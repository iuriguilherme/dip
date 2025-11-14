const { spawnSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const WORKFLOW_DIR = '/home/node/.n8n/workflows';

function log(...args) {
  console.log('[entrypoint]', ...args);
}

function importWorkflow(filePath) {
  log('Importing', filePath);
  try {
    const res = spawnSync('n8n', ['import:workflow', '--input', filePath], { stdio: 'inherit' });
    if (res.error) {
      log('Error importing', filePath, res.error);
      return false;
    }
    if (res.status !== 0) {
      log('n8n import returned non-zero status for', filePath, 'status=', res.status);
      return false;
    }
    return true;
  } catch (err) {
    log('Exception importing', filePath, err);
    return false;
  }
}

function discoverAndImport() {
  try {
    const files = fs.readdirSync(WORKFLOW_DIR).filter((f) => f.endsWith('.json'));
    if (!files.length) {
      log('No workflow JSON files found in', WORKFLOW_DIR);
      return;
    }
    for (const f of files) {
      const full = path.join(WORKFLOW_DIR, f);
      importWorkflow(full);
    }
  } catch (err) {
    if (err.code === 'ENOENT') {
      log('Workflow directory not present:', WORKFLOW_DIR);
      return;
    }
    log('Error while scanning workflows dir:', err);
  }
}

function startN8n() {
  log('Starting n8n process');
  const child = spawn('n8n', [], { stdio: 'inherit' });

  // Forward signals
  ['SIGINT', 'SIGTERM', 'SIGHUP'].forEach((sig) => {
    process.on(sig, () => {
      try {
        child.kill(sig);
      } catch (e) {}
    });
  });

  child.on('exit', (code, signal) => {
    log('n8n exited', { code, signal });
    process.exit(code === null ? 0 : code);
  });
}

// Run imports first (doesn't require a running server; CLI writes to DB using env)
discoverAndImport();

// Then start n8n server
startN8n();
