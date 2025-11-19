# Dead Internet Playground

My turn to embrace Vibe Coding

## Overview

This project implements a modular n8n workflow system called **celiio** that receives updates from three Telegram bots, stores them in PostgreSQL, and uses three LLM-powered agents with distinct personalities to generate and send replies. The system processes messages through a coordinated pipeline of sub-workflows.

The current flow features three agents - **Ceres**, **Iodes**, and **Lithos** - each with their own dedicated workflows and personality traits.

## Features

- **Three Telegram Bots**: Receives updates from three separate Telegram bots using long polling
- **PostgreSQL Storage**: Stores all incoming updates and outgoing responses
- **Three AI Agents with Distinct Personalities**:
  - **Ceres** 🌾: Agricultural and growth-focused, nurturing responses
  - **Iodes** 💜: Violet/purple themed, mystical and intuitive responses
  - **Lithos** 🗿: Stone-themed, solid and grounded responses
- **Conversation Memory**: Agents discriminate messages sent from each user in each group, keeping a specific number of messages in memory
- **Automatic Reply**: Each agent replies to messages in its assigned chats
- **Local LLM via Ollama**: Runs models locally in Docker (CPU or GPU).

## Documentation

- [Quick Start Guide](docs/QUICKSTART.md)
- [Architecture Overview](docs/ARCHITECTURE.md)
- [AI Agents Guide](AGENTS.md) - Detailed information about the three AI agents
- [Troubleshooting](docs/TROUBLESHOOTING.md)
- [AI-Assisted Development Log](docs/AI_ASSISTED_DEVELOPMENT.md)

## Architecture

**Celiio Modular System**:
```
celiio_main_v4 (Orchestrator - runs every minute)
    ↓
celiio_step0_v4 (Bot initialization)
    ↓
celiio_step1_v4 + agent variants (Get Telegram updates)
    ↓
celiio_step3_v4 (Process personalized messages)
    ↓
celiio_step5_v4 + agent variants (Generate LLM responses)
    ↓
celiio_step6_v4 (Message filtering)
    ↓
celiio_step7_v4 (Store messages to database)
    ↓
celiio_step8_v4 + agent variants (Send replies to Telegram)
```

**17 Total Workflows**: Main orchestrator + 16 supporting sub-workflows

## Prerequisites

- Docker and Docker Compose
- Three Telegram bot tokens (get them from [@BotFather](https://t.me/botfather))
- Optional for GPU acceleration: [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/iuriguilherme/dip.git
cd dip
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

# Note: OpenAI API key no longer required - using local Ollama
# OPENAI_API_KEY=sk-...your-api-key... (optional for external providers)
```

### 3. Start the Services

```bash
docker-compose up -d
```

This will start:
- PostgreSQL database (port 5432)
- n8n server (port 5678)
 - Ollama (port 11434) — local LLM server
 - Ollama fallback (port 11435) — optional secondary Ollama instance

**Note**: Data is persisted in the `./instance/` directory:
- `./instance/postgres_data/` - PostgreSQL database files
- `./instance/n8n_data/` - n8n configuration and workflows
 - `./instance/ollama/models/` - Ollama model cache shared by both Ollama containers

This directory is excluded from version control (.gitignore) to keep your local data separate from the repository.

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

3. Configure **LLM (Ollama)** credentials using OpenAI-compatible settings:
   - API Base URL: `http://n8n_ollama:11434/v1`
   - Model: e.g. `llama3.2` (or any model you pulled into Ollama)
   - API Key: any non-empty value (not used by Ollama, but some nodes require it)

4. Add **Telegram** credentials for each bot:
   - Access Token: Your bot tokens from `.env`

### 6. Import and Activate the Workflows

1. Go to **Workflows** in n8n
2. **Import main workflow first**: `workflows/celiio_main_v4.json`
3. **Import all 16 supporting workflows** from the `workflows/` folder
4. Configure the credential references in each workflow's nodes
5. **Activate only** `celiio_main_v4` - sub-workflows are triggered automatically

## Ollama (Local LLM) Setup

The `docker-compose.yml` already includes two Ollama services:

- `ollama` (container name `n8n_ollama`) on host port `11434`
- `ollama_fallback` (container name `n8n_ollama_fallback`) on host port `11435`

Inside the Docker network, n8n reaches the main Ollama at `http://n8n_ollama:11434`.

### Pull and run a model in this project

```bash
# Pull a model into the main Ollama container
docker exec -it n8n_ollama ollama pull llama3.2

# Run the model interactively (test chat)
docker exec -it n8n_ollama ollama run llama3.2

# List installed models
docker exec -it n8n_ollama ollama list
```

See the [Ollama library](https://ollama.com/library) for available models and names.

### Official Ollama Docker reference (from docs)

The following commands are from the Ollama Docker documentation and are provided for reference and troubleshooting. You generally do not need to run these when using this project's `docker-compose.yml`.

#### CPU only

```bash
docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama
```

#### Nvidia GPU

Install NVIDIA Container Toolkit (choose your distro):

```bash
# Apt (Debian/Ubuntu)
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey \
  | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
curl -fsSL https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list \
  | sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' \
  | sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list
sudo apt-get update
sudo apt-get install -y nvidia-container-toolkit

# Yum/Dnf (RHEL/CentOS/Fedora)
curl -fsSL https://nvidia.github.io/libnvidia-container/stable/rpm/nvidia-container-toolkit.repo \
  | sudo tee /etc/yum.repos.d/nvidia-container-toolkit.repo
sudo yum install -y nvidia-container-toolkit

# Configure Docker to use the Nvidia runtime
sudo nvidia-ctk runtime configure --runtime=docker
sudo systemctl restart docker
```

Start the container with GPU access:

```bash
docker run -d --gpus=all -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama
```

#### AMD GPU (ROCm)

```bash
docker run -d --device /dev/kfd --device /dev/dri \
  -v ollama:/root/.ollama -p 11434:11434 \
  --name ollama ollama/ollama:rocm
```

#### Vulkan support

```bash
docker run -d --device /dev/kfd --device /dev/dri \
  -v ollama:/root/.ollama -p 11434:11434 \
  -e OLLAMA_VULKAN=1 \
  --name ollama ollama/ollama
```

#### Run a model (generic Docker example)

```bash
docker exec -it ollama ollama run llama3.2
```

## Usage

### Interacting with the Bots

1. Start a conversation with any of your three Telegram bots (Ceres, Iodes, or Lithos)
2. Send a text message
3. The celiio system will:
   - Store your message in the `telegram_messages` database table
   - Route the message through the modular workflow pipeline
   - Generate a response using the specific agent's personality and local Ollama model
   - Send the reply back through the same bot
   - Track message processing status in the database

### Agent Personalities

- **Ceres** 🌾 (Agricultural): Provides nurturing, growth-focused responses
- **Iodes** 💜 (Mystical): Offers intuitive, violet-themed, spiritual replies
- **Lithos** 🗿 (Grounded): Delivers solid, stone-themed, stable perspectives

Each agent has its own Telegram bot and responds based on which bot receives the message.

For detailed information about agent personalities, customization options, and memory system, see the [AI Agents Guide](AGENTS.md).

### Message Processing System

- Messages are stored in `telegram_messages` table
- Processing controlled by `meta` table with `start_from` timestamp
- Context built from recent message history per chat
- Responses generated using local Ollama models

## Database Schema

### Tables

1. **telegram_messages**: Stores all incoming Telegram messages

See `docker/init.sql` for the complete schema.

## Customization

### Adjust Conversation History

There is a n8n data table named `meta` which has a `start_from` column. The first result will be used as a timestamp to determine when to start processing incoming messages, even those already stored on database.

### Modify Agent Personalities

Edit the "celiio_step5" nodes in the workflow to customize:
- System prompts
- Personality descriptions
- Change ollama models

## Troubleshooting

### Workflow Not Receiving Messages

1. Ensure bots are using **long polling** (not webhooks)
2. Check that bot tokens are correct
3. Verify the workflow is **activated** in n8n
4. Check n8n logs: `docker-compose logs -f n8n_server`

### Database Connection Issues

1. Ensure PostgreSQL is running: `docker-compose ps`
2. Check credentials in n8n match `docker-compose.yml`
3. View PostgreSQL logs: `docker-compose logs -f postgres`

### LLM API Errors

1. Ensure the `n8n_ollama` container is running: `docker-compose ps` and check logs: `docker-compose logs -f n8n_ollama`
2. Verify a model is installed: `docker exec -it n8n_ollama ollama list` (pull with `ollama pull <model>` if missing)
3. In n8n, confirm the API Base URL is `http://n8n_ollama:11434/v1` and the model name matches an installed Ollama model
4. For GPU usage, ensure the NVIDIA Container Toolkit is installed and Docker sees your GPU (`--gpus=all` works in test runs)
5. Review n8n execution logs for detailed error messages

## Stopping the Services

```bash
docker-compose down
```

**Note**: Your data in `./instance/` will be preserved. To completely remove all data:

```bash
docker-compose down
rm -rf ./instance/postgres_data ./instance/n8n_data ./instance/ollama
```

## Development

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Only n8n
docker-compose logs -f n8n_server

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

## Acknowledgments

- Built with [n8n](https://n8n.io/) - Fair-code licensed workflow automation
- Local LLM served by [Ollama](https://ollama.com/)
- Uses custom n8n nodes for Telegram credential extraction
- Powered by [Telegram Bot API](https://core.telegram.org/bots/api)
- PostgreSQL for reliable data persistence

## Roadmap

### TODO

- Automate n8n data tables creation
- Implement dynamic Telegram credentials extraction
- Implement dynamic Ollama model selection
- Create a secure node for Telegram Long Polling
- Configure LLM tools via environment files
- Configure Telegram credentials via environment files
- Configure PostgreSQL credentials via environment files
- Configure Ollama credentials via environment files
- Configure n8n credentials via environment files

## License

This project is licensed under the GNU General Public License v3.0 (GPL-3.0).
You may redistribute and/or modify it under the terms of the [LICENSE](LICENSE) file.
