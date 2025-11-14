# n8n9n10n

My turn to embrace Vibe Coding

## Overview

This project implements an n8n workflow that receives updates from three Telegram bots, stores them in PostgreSQL, and uses three LLM-powered agents with distinct personalities to generate and send replies. The agents maintain conversation memory that influences their behavior over time.

## Features

- **Three Telegram Bots**: Receives updates from three separate Telegram bots using long polling
- **PostgreSQL Storage**: Stores all incoming updates and outgoing responses
- **Three AI Agents with Distinct Personalities**:
  - **Agent Alpha**: Professional and analytical
  - **Agent Beta**: Friendly and empathetic
  - **Agent Gamma**: Creative and imaginative
- **Conversation Memory**: Agents remember recent interactions for 1 hour
- **Automatic Reply**: Each agent replies to messages in its assigned chats
- **LLM Integration**: Uses OpenAI API (or compatible endpoints) for response generation

## Architecture

```
Telegram Updates (3 bots)
    ↓
Filter Text Messages
    ↓
Store in PostgreSQL
    ↓
Retrieve Agent Memory
    ↓
Assign to Agent (based on chat ID)
    ↓
Build Conversation Context
    ↓
Generate Response with LLM
    ↓
Store Response in PostgreSQL
    ↓
Send Reply on Telegram
    ↓
Update Agent Memory
```

## Prerequisites

- Docker and Docker Compose
- Three Telegram bot tokens (get them from [@BotFather](https://t.me/botfather))
- OpenAI API key or compatible LLM endpoint

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/iuriguilherme/n8n9n10n.git
cd n8n9n10n
```

### 2. Configure Environment Variables

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` and add your tokens:

```env
# Get bot tokens from @BotFather on Telegram
TELEGRAM_BOT_TOKEN_1=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_BOT_TOKEN_2=9876543210:XYZwvuTSRqponMLKjihGFEdcba
TELEGRAM_BOT_TOKEN_3=5555555555:AABBccDDeeFFggHHiiJJkkLLmmNN

# Get API key from https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-...your-api-key...
```

### 3. Start the Services

```bash
docker-compose up -d
```

This will start:
- PostgreSQL database (port 5432)
- n8n server (port 5678)

### 4. Access n8n

Open your browser and navigate to:

```
http://localhost:5678
```

Login credentials (default):
- **Username**: `admin`
- **Password**: `admin`

### 5. Configure n8n Credentials

Before activating the workflow, you need to set up credentials in n8n:

1. Go to **Credentials** in the n8n interface
2. Add **PostgreSQL** credentials:
   - Host: `postgres`
   - Database: `n8n`
   - User: `n8n`
   - Password: `n8n`
   - Port: `5432`

3. Add **OpenAI** credentials:
   - API Key: Your OpenAI API key from `.env`

4. Add **Telegram** credentials for each bot:
   - Access Token: Your bot tokens from `.env`

### 6. Import and Activate the Workflow

1. Go to **Workflows** in n8n
2. Click **Import from File**
3. Select `workflows/telegram-multi-agent-bot.json`
4. Configure the credential references in each node
5. Click **Activate** to enable the workflow

## Usage

### Interacting with the Bots

1. Start a conversation with any of your three Telegram bots
2. Send a text message
3. The bot will:
   - Store your message in the database
   - Assign it to one of the three agents (based on your chat ID)
   - Retrieve recent conversation history
   - Generate a response with the agent's personality
   - Reply to your message
   - Store the interaction in memory for 1 hour

### Agent Personalities

- **Agent Alpha** (Professional): Provides clear, analytical, fact-based responses
- **Agent Beta** (Friendly): Offers warm, empathetic, conversational replies
- **Agent Gamma** (Creative): Delivers imaginative, metaphorical, unique perspectives

Each chat is consistently assigned to the same agent based on the chat ID.

### Memory System

- Agents remember the last 10 messages per chat
- Memories expire after 1 hour
- Memory influences agent responses and maintains context

## Database Schema

### Tables

1. **telegram_updates**: Stores all incoming Telegram messages
2. **agent_responses**: Records all agent-generated responses
3. **agent_memory**: Maintains conversation context for each agent

See `init.sql` for the complete schema.

## Customization

### Adjust Memory Duration

Edit the workflow's "Update Agent Memory" node to change the expiration time:

```sql
expires_at = NOW() + INTERVAL '2 hours'  -- Change from 1 hour to 2 hours
```

### Modify Agent Personalities

Edit the "Assign to Agents" node in the workflow to customize:
- Agent names
- System prompts
- Personality descriptions

### Change LLM Model

Edit the "LLM Generate Response" node to use a different model:
- `gpt-4` for better quality
- `gpt-3.5-turbo-16k` for longer context
- Custom models if using a compatible endpoint

### Use Alternative LLM Providers

Set `OPENAI_API_BASE` in your `.env` file to use OpenAI-compatible endpoints:

```env
OPENAI_API_BASE=https://your-llm-endpoint.com/v1
```

## Troubleshooting

### Workflow Not Receiving Messages

1. Ensure bots are using **long polling** (not webhooks)
2. Check that bot tokens are correct
3. Verify the workflow is **activated** in n8n
4. Check n8n logs: `docker-compose logs -f n8n`

### Database Connection Issues

1. Ensure PostgreSQL is running: `docker-compose ps`
2. Check credentials in n8n match `docker-compose.yml`
3. View PostgreSQL logs: `docker-compose logs -f postgres`

### LLM API Errors

1. Verify your OpenAI API key is valid
2. Check API quota and billing status
3. Review n8n execution logs for error details

## Stopping the Services

```bash
docker-compose down
```

To also remove data volumes:

```bash
docker-compose down -v
```

## Development

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Only n8n
docker-compose logs -f n8n

# Only PostgreSQL
docker-compose logs -f postgres
```

### Accessing PostgreSQL

```bash
docker-compose exec postgres psql -U n8n -d n8n
```

### Backup Database

```bash
docker-compose exec postgres pg_dump -U n8n n8n > backup.sql
```

## Security Notes

- Change default n8n credentials in production
- Keep your `.env` file secure and never commit it to version control
- Use strong passwords for PostgreSQL in production
- Consider using Docker secrets for sensitive data
- Implement rate limiting for production deployments

## Contributing

Feel free to open issues or submit pull requests!

## License

See LICENSE file for details.

## Acknowledgments

- Built with [n8n](https://n8n.io/) - Fair-code licensed workflow automation
- Powered by [OpenAI](https://openai.com/) or compatible LLM providers
- Uses [Telegram Bot API](https://core.telegram.org/bots/api)
