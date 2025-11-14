# Troubleshooting Guide

## Common Issues and Solutions

### 1. Workflow Not Receiving Messages

#### Symptoms
- Messages sent to bot have no response
- n8n execution history is empty

#### Solutions

**A. Check Workflow Status**
```bash
# Workflow must be ACTIVE in n8n UI
# Look for green "Active" toggle at top of workflow
```

**B. Verify Bot Tokens**
```bash
# Test bot token with curl
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getMe"

# Should return bot info, not error
```

**C. Check Long Polling**
- Ensure no webhooks are set:
```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
# Should show: "url": ""

# If webhook exists, delete it:
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/deleteWebhook"
```

**D. Check n8n Logs**
```bash
docker-compose logs -f n8n | grep -i error
```

**E. Restart Workflow**
- In n8n UI: Toggle workflow Inactive → Active

---

### 2. Database Connection Errors

#### Symptoms
- Error: "Connection refused"
- Error: "role 'n8n' does not exist"

#### Solutions

**A. Check PostgreSQL is Running**
```bash
docker-compose ps postgres
# Should show "Up" status

# If not running:
docker-compose up -d postgres
```

**B. Verify Database Credentials**
```bash
# Connect manually to test
docker-compose exec postgres psql -U n8n -d n8n

# If successful, credentials are correct
# If failed, recreate containers:
docker-compose down -v
docker-compose up -d
```

**C. Check Database Initialization**
```bash
# Verify tables exist
docker-compose exec postgres psql -U n8n -d n8n -c "\dt"

# Should show: telegram_updates, agent_responses, agent_memory
```

**D. Rebuild from Scratch**
```bash
# WARNING: Deletes all data
docker-compose down -v
docker-compose up -d
# Wait 10 seconds for initialization
docker-compose logs postgres | grep "ready to accept connections"
```

---

### 3. OpenAI API Errors

#### Symptoms
- Error: "Invalid API key"
- Error: "Rate limit exceeded"
- Error: "Insufficient quota"

#### Solutions

**A. Verify API Key**
```bash
# Test API key directly
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"

# Should return list of models
```

**B. Check OpenAI Account**
- Visit https://platform.openai.com/account/billing
- Ensure you have credits
- Check usage limits

**C. Rate Limiting**
- Free tier: 3 requests/minute
- Solution: Upgrade plan or reduce message frequency

**D. Update Credentials in n8n**
1. Go to Credentials in n8n
2. Find OpenAI credential
3. Update API key
4. Save and restart workflow

---

### 4. Agent Not Responding or Wrong Personality

#### Symptoms
- Bot replies but personality seems wrong
- Same agent responding to all chats

#### Solutions

**A. Check Agent Assignment Logic**
- View "Assign to Agents" node in workflow
- Each chat should hash to same agent consistently

**B. Verify System Prompts**
- Check system prompt in "Assign to Agents" node
- Ensure three distinct personalities defined

**C. Clear and Rebuild Memory**
```sql
-- Connect to database
docker-compose exec postgres psql -U n8n -d n8n

-- Clear all agent memory
DELETE FROM agent_memory;

-- Send new messages to rebuild memory
```

---

### 5. Memory Not Working

#### Symptoms
- Agent doesn't remember previous messages
- Every response seems like first message

#### Solutions

**A. Check Memory Storage**
```sql
-- Connect to database
docker-compose exec postgres psql -U n8n -d n8n

-- View agent memory
SELECT agent_name, chat_id, message_role, 
       LEFT(message_content, 50) as content,
       expires_at
FROM agent_memory
ORDER BY created_at DESC
LIMIT 20;
```

**B. Verify Memory Not Expired**
- Default: 1 hour expiration
- Check `expires_at` column
- Adjust in "Update Agent Memory" node if needed

**C. Check Memory Retrieval**
- Ensure "Retrieve Agent Memory" node runs successfully
- Check node execution output in n8n

---

### 6. Docker Issues

#### Symptoms
- "Cannot connect to Docker daemon"
- "Port already in use"

#### Solutions

**A. Docker Not Running**
```bash
# Start Docker service (Linux)
sudo systemctl start docker

# Or Docker Desktop (Mac/Windows)
# Start Docker Desktop application
```

**B. Port Conflicts**
```bash
# Check what's using port 5678
lsof -i :5678  # Mac/Linux
netstat -ano | findstr :5678  # Windows

# Option 1: Stop conflicting service
# Option 2: Change port in docker-compose.yml
# Change "5678:5678" to "5679:5678" or another port
```

**C. Insufficient Resources**
```bash
# Check Docker resources
docker system df

# Clean up if needed
docker system prune -a
```

---

### 7. n8n UI Not Accessible

#### Symptoms
- Cannot access http://localhost:5678
- Connection refused or timeout

#### Solutions

**A. Check n8n Container**
```bash
docker-compose ps n8n
# Should show "Up" status

# View logs for errors
docker-compose logs n8n | tail -50
```

**B. Verify Port Binding**
```bash
# Check if port is bound
docker-compose port n8n 5678
# Should show: 0.0.0.0:5678

# Try accessing from container
docker-compose exec n8n wget -O- http://localhost:5678
```

**C. Firewall Issues**
```bash
# Temporarily disable firewall to test
# Linux: sudo ufw disable
# Mac: System Preferences → Security → Firewall
# Windows: Windows Defender Firewall settings
```

**D. Use Different Browser**
- Try Chrome, Firefox, or Safari
- Clear browser cache
- Try incognito/private mode

---

### 8. Credentials Not Working

#### Symptoms
- "Credentials are invalid"
- "Authentication failed"

#### Solutions

**A. Re-create Credentials**
1. In n8n: Settings → Credentials
2. Delete existing credential
3. Create new credential with same name
4. Update nodes to use new credential

**B. Check Credential Names**
- Node must reference correct credential ID
- After import, credentials need manual assignment

**C. Environment Variables**
```bash
# Check env vars are loaded
docker-compose exec n8n env | grep TELEGRAM
docker-compose exec n8n env | grep OPENAI

# If empty, check .env file exists and is correct
```

---

### 9. SQL Errors in Workflow

#### Symptoms
- "Syntax error at or near..."
- "Column does not exist"

#### Solutions

**A. Check Table Schema**
```sql
-- Connect to database
docker-compose exec postgres psql -U n8n -d n8n

-- Describe tables
\d telegram_updates
\d agent_responses
\d agent_memory
```

**B. Verify SQL Queries**
- Check for quote issues in queries
- JSON fields need proper escaping
- Test queries directly in psql first

**C. Reinitialize Database**
```bash
# Backup data first if needed
docker-compose exec postgres pg_dump -U n8n n8n > backup.sql

# Recreate database
docker-compose down -v
docker-compose up -d
```

---

### 10. Performance Issues

#### Symptoms
- Slow responses
- High memory usage
- Database growing too large

#### Solutions

**A. Optimize Database**
```sql
-- Connect to database
docker-compose exec postgres psql -U n8n -d n8n

-- Check table sizes
SELECT 
  relname as table_name,
  pg_size_pretty(pg_total_relation_size(relid)) as size
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;

-- Vacuum database
VACUUM ANALYZE;

-- Clean old data
DELETE FROM agent_memory WHERE expires_at < NOW() - INTERVAL '1 day';
DELETE FROM telegram_updates WHERE created_at < NOW() - INTERVAL '30 days';
```

**B. Adjust Memory Settings**
- Reduce memory retention period
- Limit conversation history to 5 messages instead of 10
- Increase expires_at interval

**C. Use Lighter LLM Model**
- Change from `gpt-4` to `gpt-3.5-turbo`
- Reduce max_tokens parameter
- Adjust temperature for faster responses

---

## Getting Help

If none of these solutions work:

1. **Check Logs**
```bash
# All logs
docker-compose logs

# Specific service
docker-compose logs -f n8n
docker-compose logs -f postgres
```

2. **Enable Debug Mode**
```yaml
# In docker-compose.yml, add to n8n environment:
- N8N_LOG_LEVEL=debug
```

3. **Export Workflow**
- In n8n: Download workflow as JSON
- Check for syntax errors
- Compare with original template

4. **Community Support**
- n8n Community: https://community.n8n.io/
- GitHub Issues: https://github.com/iuriguilherme/n8n9n10n/issues
- Stack Overflow: Tag with `n8n`

## Useful Commands

```bash
# Restart everything
docker-compose restart

# View real-time logs
docker-compose logs -f

# Check disk space
docker system df

# Enter n8n container
docker-compose exec n8n sh

# Enter PostgreSQL
docker-compose exec postgres psql -U n8n -d n8n

# Backup database
docker-compose exec postgres pg_dump -U n8n n8n > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore database
docker-compose exec -T postgres psql -U n8n -d n8n < backup.sql

# View environment
docker-compose config

# Stop without removing data
docker-compose stop

# Full cleanup (WARNING: deletes data)
docker-compose down -v
```
