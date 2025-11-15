// Clean, canonical importer entrypoint
const { spawnSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const WORKFLOW_DIR = '/home/node/.n8n/workflows';

function log(level, ...args) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}] [entrypoint]`, ...args);
}

function info(...args) { log('INFO', ...args); }
function warn(...args) { log('WARN', ...args); }
function error(...args) { log('ERROR', ...args); }
function debug(...args) { log('DEBUG', ...args); }

function importWorkflowCLI(filePath) {
  info('Importing via CLI:', filePath);
  try {
    const res = spawnSync('n8n', ['import:workflow', '--input', filePath], { stdio: 'inherit' });
    if (res.error) {
      error('Error importing', filePath, res.error);
      return false;
    }
    if (res.status !== 0) {
      error('n8n import returned non-zero status for', filePath, 'status=', res.status);
      return false;
    }
    info('Successfully imported workflow via CLI:', filePath);
    return true;
  } catch (err) {
    error('Exception importing', filePath, err);
    return false;
  }
}

function startN8n() {
  info('Starting n8n process...');
  const child = spawn('n8n', [], { stdio: 'inherit' });

  ['SIGINT', 'SIGTERM', 'SIGHUP'].forEach((sig) => {
    process.on(sig, () => {
      try { child.kill(sig); } catch (e) { /* ignore */ }
    });
  });

  child.on('exit', (code, signal) => {
    warn('n8n process exited', { code, signal });
    process.exit(code === null ? 0 : code);
  });

  return child;
}

function restRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${process.env.N8N_BASIC_AUTH_USER || ''}:${process.env.N8N_BASIC_AUTH_PASSWORD || ''}`).toString('base64');
    const opts = {
      hostname: process.env.N8N_HOST || '127.0.0.1',
      port: process.env.N8N_PORT || 5678,
      path,
      method,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      timeout: 5000,
    };

    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        const result = { statusCode: res.statusCode, body: data };
        try { result.json = JSON.parse(data); } catch (e) { result.json = null; }
        resolve(result);
      });
    });

    req.on('error', (e) => reject(e));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function waitForN8nReady(retries = 120, intervalMs = 1000) {
  info('Waiting for n8n API to be ready...');
  for (let i = 0; i < retries; i++) {
    try {
      const r = await restRequest('GET', '/rest/workflows');
      if (r.statusCode === 200) {
        info('n8n API is ready (HTTP 200)');
        return true;
      }
      if (r.statusCode === 401) {
        info('n8n API is ready (HTTP 401 - auth required)');
        return true;
      }
    } catch (e) { 
      if (i % 10 === 0) debug(`Waiting for n8n... attempt ${i + 1}/${retries}`);
    }
    await new Promise((res) => setTimeout(res, intervalMs));
  }
  error('Timeout waiting for n8n API to be ready');
  return false;
}

async function importMissingWorkflows() {
  info('Starting workflow import process...');
  
  try {
    // Ensure directory exists
    if (!fs.existsSync(WORKFLOW_DIR)) {
      warn('Workflow directory does not exist:', WORKFLOW_DIR);
      return;
    }

    const files = fs.readdirSync(WORKFLOW_DIR).filter((f) => f.endsWith('.json') && !f.startsWith('.imported_'));
    info(`Found ${files.length} workflow file(s) to process`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (const f of files) {
      const full = path.join(WORKFLOW_DIR, f);
      info(`Processing workflow: ${f}`);
      
      let content;
      try { 
        content = fs.readFileSync(full, 'utf8'); 
      } catch (e) { 
        error('Could not read file:', full, e.message); 
        failCount++;
        continue; 
      }
      
      let obj = null;
      try { 
        obj = JSON.parse(content); 
      } catch (e) { 
        error('Invalid JSON in file:', full, e.message);
        failCount++;
        continue;
      }

      if (!obj || !obj.name) {
        error('Workflow missing name field:', full);
        failCount++;
        continue;
      }

      // Try REST API update first
      let imported = false;
      try {
        const listResp = await restRequest('GET', '/rest/workflows');
        if (listResp && listResp.statusCode === 200 && Array.isArray(listResp.json)) {
          const existing = listResp.json.find((w) => w.name === obj.name);
          if (existing && existing.id) {
            info(`Found existing workflow "${obj.name}" with ID ${existing.id}, updating...`);
            try {
              const payload = Object.assign({}, obj);
              payload.id = existing.id;
              const put = await restRequest('PUT', `/rest/workflows/${existing.id}`, payload);
              if (put.statusCode >= 200 && put.statusCode < 300) {
                info(`✓ Successfully updated workflow "${obj.name}" via REST API`);
                successCount++;
                imported = true;
              } else {
                warn(`REST PUT failed for "${obj.name}" (HTTP ${put.statusCode}), falling back to CLI`);
              }
            } catch (e) { 
              warn(`REST PUT error for "${obj.name}", falling back to CLI:`, e.message); 
            }
          }
        }
      } catch (e) { 
        debug('REST API not available, using CLI import');
      }

      // Fall back to CLI import if REST failed
      if (!imported) {
        const ok = importWorkflowCLI(full);
        if (ok) {
          successCount++;
          info(`✓ Successfully imported workflow "${obj.name}" via CLI`);
        } else {
          failCount++;
          error(`✗ Failed to import workflow "${obj.name}"`);
        }
      }
    }
    
    info(`Workflow import complete: ${successCount} succeeded, ${failCount} failed`);

    // Setup file watcher for changes
    try {
      const debounce = new Map();
      fs.watch(WORKFLOW_DIR, (ev, filename) => {
        if (!filename || !filename.endsWith('.json') || filename.startsWith('.imported_')) return;
        const full = path.join(WORKFLOW_DIR, filename);
        info(`Detected change in workflow file: ${filename}`);
        if (debounce.has(full)) clearTimeout(debounce.get(full));
        const t = setTimeout(() => { 
          importMissingWorkflows().catch((e) => error('Auto-import failed:', e)); 
          debounce.delete(full); 
        }, 1000);
        debounce.set(full, t);
      });
      info('✓ File watcher established for:', WORKFLOW_DIR);
    } catch (e) { 
      error('Failed to setup file watcher:', e.message); 
    }
  } catch (err) { 
    error('Error during workflow import:', err.message);
  }
}

async function main() {
  info('═══════════════════════════════════════════════════════');
  info('n8n Workflow Import Entrypoint Starting');
  info('═══════════════════════════════════════════════════════');
  
  const n8nProcess = startN8n();
  const ready = await waitForN8nReady();
  
  if (!ready) { 
    error('n8n API not ready, skipping workflow import'); 
    return; 
  }
  
  await importMissingWorkflows();
  
  info('═══════════════════════════════════════════════════════');
  info('n8n is ready and workflows have been imported');
  info('Watching for workflow changes...');
  info('═══════════════════════════════════════════════════════');
  
  // Keep process running
  process.stdin.resume();
}

main().catch((e) => { error('Unhandled error in importer:', e && e.message ? e.message : e); process.exit(1); });

process.on('uncaughtException', (err) => { error('Uncaught exception:', err && err.stack ? err.stack : err); process.exit(1); });
process.on('unhandledRejection', (reason) => { error('Unhandled rejection:', reason); process.exit(1); });

