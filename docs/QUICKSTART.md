# Quick Start Guide

## Prerequisites

Before starting, you need:

1. **Docker & Docker Compose** installed on your machine
2. **Three Telegram Bot Tokens**:
   - Open Telegram and search for [@BotFather](https://t.me/botfather)
   - Send `/newbot` command three times to create three bots
   - Name them Ceres, Iodes, and Lithos (or your preferred names)
   - Save the bot tokens provided by BotFather
3. **Local LLM via Ollama** (included in Docker setup)
   - No external API keys needed for local models
   - GPU acceleration optional but recommended

## Setup (5 minutes)

### Step 1: Clone and Configure

```bash
# Clone the repository
git clone https://github.com/iuriguilherme/dip.git
cd dip

# Copy environment template
cp .env.example .env

# Edit `./.env` with your credentials and secrets
nano .env  # or use your preferred editor

The `.env.example` includes all variables used by the compose setup. At minimum update the Telegram bot tokens:

```env
# Telegram bot tokens (get these from @BotFather)
TELEGRAM_BOT_TOKEN_1=your_ceres_bot_token_here
TELEGRAM_BOT_TOKEN_2=your_iodes_bot_token_here
TELEGRAM_BOT_TOKEN_3=your_lithos_bot_token_here

# Optional: change n8n basic auth defaults
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=admin

# Optional: change Postgres password (local default is "n8n")
POSTGRES_PASSWORD=n8n
```

**Note**: This system uses local Ollama for LLM processing, so no external API keys are required.

Automatic workflow import
-------------------------

This setup will automatically import any workflow JSON files placed under the `workflows/` directory into n8n on container start. The compose file mounts `./workflows` into the container and runs a small import script before launching n8n.

To add workflows automatically:

1. Place exported workflow JSON files into `workflows/` (for example `workflows/telegram-multi-agent-bot.json`).
2. Start or restart the stack with `docker-compose up -d`.
3. The import script will attempt to import all `*.json` files in the directory and then start n8n.

If an import fails for a file it will be logged and the container will still start; fix the offending file and restart if needed.

### Step 2: Start Services

```bash
# Start n8n and PostgreSQL
docker-compose up -d

# Check that services are running
docker-compose ps
```

This will start:
- PostgreSQL database (port 5432)
- n8n server (port 5678)
- Ollama (port 11434) — local LLM server
- Ollama fallback (port 11435) — optional secondary Ollama instance

You should see both `n8n_server` and `n8n_postgres` running.

**Data Persistence**: Your data is automatically stored in `./instance/` directory:
- `./instance/postgres_data/` - Database files
- `./instance/n8n_data/` - n8n configuration
- `./instance/ollama/` - ollama keys and models

This folder is gitignored, keeping your local data separate from the repository.

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

4. **Add Ollama Credentials:**
   - Go to **Credentials** → **Add Credential**
   - Select **OpenAI** (compatible with Ollama)
   - API Base URL: `http://n8n_ollama:11434/v1`
   - API Key: any value (not used by Ollama)
   - Click **Save**

5. **Add Telegram Credentials (3 times):**
   - Go to **Credentials** → **Add Credential**
   - Select **Telegram**
   - Name: "Ceres" and enter your first bot token
   - Click **Save**
   - Repeat for "Iodes" and "Lithos" with their respective tokens

### Step 4: Import Workflows

**Import the main workflow first:**
1. Click **Workflows** in the sidebar
2. Click **Import from File** 
3. Select `workflows/celiio_main_v4.json`
4. Click **Save**

**Import all supporting workflows:**
5. Repeat import process for each file in `workflows/` folder:
   - `celiio_step0_v4.json` - Bot initialization
   - `celiio_step1_v4.json` + agent variants - Telegram updates
   - `celiio_step3_v4.json` - Message processing  
   - `celiio_step5_v4.json` + agent variants - LLM responses
   - `celiio_step6_v4.json` - Message filtering
   - `celiio_step7_v4.json` - Database storage
   - `celiio_step8_v4.json` + agent variants - Telegram replies

**Note**: Import all workflows before configuring credentials.

### Step 5: Connect Credentials

**Configure credentials across all imported workflows:**

1. **PostgreSQL nodes** (found in multiple workflows):
   - Click each Postgres node
   - Select the PostgreSQL credential you created

2. **Telegram credentials** (agent-specific):
   - In step1 variants: Match Ceres/Iodes/Lithos credentials to respective workflows
   - In step8 variants: Match agent credentials for sending replies
   - In step5 variants: Match agent credentials for error logging

3. **Ollama LLM nodes** (found in step5 workflows):
   - API Base URL: `http://n8n_ollama:11434/v1`
   - Model: `llama3.2` (or your preferred model)
   - API Key: any value (not used by Ollama)

**Note**: Each agent (Ceres, Iodes, Lithos) has dedicated workflow variants with their specific credentials.

### Step 6: Activate Main Workflow

1. Open `celiio_main_v4` workflow
2. Click the **Inactive** toggle at the top to change it to **Active**
3. The main workflow will run every minute and coordinate all sub-workflows

**Note**: Only activate the main workflow. Sub-workflows are triggered automatically.

## Testing

1. Open Telegram and find your bot by username (check @BotFather for the username)
2. Send a message like "Hello!"
3. Wait 1-2 seconds
4. You should receive a reply from one of the three agents

## Agent Personalities

Your message will be answered by one of these agents (assignment is based on bot interaction):

- **Ceres** 🌾: Agricultural and growth-focused, nurturing responses
- **Iodes** 💜: Violet/purple themed, mystical and intuitive responses  
- **Lithos** 🗿: Stone-themed, solid and grounded responses

**Note**: Each agent has its own Telegram bot and responds with its unique personality as configured in the `celiio_step5` workflow variants.

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

**Ollama/LLM error?**
- Ensure `n8n_ollama` container is running: `docker-compose ps`
- Check if model is available: `docker exec -it n8n_ollama ollama list`
- Pull missing model: `docker exec -it n8n_ollama ollama pull llama3.2`
- Review n8n execution logs for error details

## Next Steps

- Customize agent personalities in the `celiio_step5` workflow variants
- Adjust message processing logic in `celiio_step3_v4` workflow
- Change Ollama models in the step5 agent workflows
- View conversation history in PostgreSQL:
  ```bash
  docker-compose exec postgres psql -U n8n -d n8n
  SELECT bot_id, chat_id, from_id, LEFT(message_text, 50) as preview, created_at 
  FROM telegram_messages ORDER BY created_at DESC LIMIT 20;
  ```
- Pull additional Ollama models:
  ```bash
  docker exec -it n8n_ollama ollama pull llama3.2
  docker exec -it n8n_ollama ollama list
  ```

## Stopping

```bash
# Stop services (data is preserved in ./instance/)
docker-compose down

# Stop and remove all data (WARNING: deletes all messages)
docker-compose down
rm -rf ./instance/postgres_data ./instance/n8n_data ./instance/ollama
```

---

For detailed information, see the full [README.md](README.md).
