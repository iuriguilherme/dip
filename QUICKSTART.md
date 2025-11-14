# Quick Start Guide

## Prerequisites

Before starting, you need:

1. **Docker & Docker Compose** installed on your machine
2. **Three Telegram Bot Tokens**:
   - Open Telegram and search for [@BotFather](https://t.me/botfather)
   - Send `/newbot` command three times to create three bots
   - Save the bot tokens provided by BotFather
3. **OpenAI API Key**:
   - Sign up at [OpenAI](https://platform.openai.com/)
   - Navigate to [API Keys](https://platform.openai.com/api-keys)
   - Create a new API key and save it

## Setup (5 minutes)

### Step 1: Clone and Configure

```bash
# Clone the repository
git clone https://github.com/iuriguilherme/n8n9n10n.git
cd n8n9n10n

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env  # or use your preferred editor
```

Add your tokens to `.env`:
```env
TELEGRAM_BOT_TOKEN_1=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_BOT_TOKEN_2=987654321:XYZwvuTSRqponMLKjihGFEdcba
TELEGRAM_BOT_TOKEN_3=555555555:AABBccDDeeFFggHHiiJJkkLLmmNN
OPENAI_API_KEY=sk-proj-...your-key-here...
```

### Step 2: Start Services

```bash
# Start n8n and PostgreSQL
docker-compose up -d

# Check that services are running
docker-compose ps
```

You should see both `n8n_server` and `n8n_postgres` running.

### Step 3: Configure n8n

1. Open http://localhost:5678 in your browser
2. Login with:
   - Username: `admin`
   - Password: `admin`

3. **Add PostgreSQL Credentials:**
   - Go to **Credentials** → **Add Credential**
   - Select **Postgres**
   - Enter:
     - Host: `postgres`
     - Database: `n8n`
     - User: `n8n`
     - Password: `n8n`
     - Port: `5432`
   - Click **Save**

4. **Add OpenAI Credentials:**
   - Go to **Credentials** → **Add Credential**
   - Select **OpenAI**
   - Enter your API key from `.env`
   - Click **Save**

5. **Add Telegram Credentials (3 times):**
   - Go to **Credentials** → **Add Credential**
   - Select **Telegram**
   - Enter one of your bot tokens
   - Click **Save**
   - Repeat for the other two bots

### Step 4: Import Workflow

1. Click **Workflows** in the sidebar
2. Click **Import from File**
3. Select `workflows/telegram-multi-agent-bot.json`
4. The workflow will open in the editor

### Step 5: Connect Credentials

For each node in the workflow that requires credentials:

1. **Telegram Bot 1/2/3 Trigger** nodes:
   - Click the node
   - Under "Credential to connect with", select the corresponding Telegram credential
   
2. **Postgres** nodes (5 total):
   - Click each node
   - Select the PostgreSQL credential you created

3. **OpenAI** node:
   - Click the node
   - Select the OpenAI credential

4. **Telegram** node (Send Telegram Reply):
   - Click the node
   - Select any of the three Telegram credentials

### Step 6: Activate Workflow

1. Click the **Inactive** toggle at the top to change it to **Active**
2. The workflow is now running!

## Testing

1. Open Telegram and find your bot by username (check @BotFather for the username)
2. Send a message like "Hello!"
3. Wait 1-2 seconds
4. You should receive a reply from one of the three agents

## Agent Personalities

Your message will be answered by one of these agents (assignment is consistent per chat):

- **Agent Alpha** 🎯: Professional, analytical, clear and concise
- **Agent Beta** 💙: Friendly, warm, conversational and supportive
- **Agent Gamma** 🎨: Creative, imaginative, uses metaphors and wordplay

## Troubleshooting

**Bot not responding?**
```bash
# Check logs
docker-compose logs -f n8n

# Ensure workflow is active in n8n UI
```

**Database connection error?**
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs -f postgres
```

**OpenAI API error?**
- Verify your API key in n8n credentials
- Check your OpenAI account has credits
- Review n8n execution logs for error details

## Next Steps

- Customize agent personalities in the workflow's "Assign to Agents" node
- Adjust memory duration in "Update Agent Memory" node
- Change LLM model in "LLM Generate Response" node
- View conversation history in PostgreSQL:
  ```bash
  docker-compose exec postgres psql -U n8n -d n8n
  SELECT * FROM agent_memory ORDER BY created_at DESC LIMIT 20;
  ```

## Stopping

```bash
# Stop services
docker-compose down

# Stop and remove data (WARNING: deletes all messages)
docker-compose down -v
```

---

For detailed information, see the full [README.md](README.md).
