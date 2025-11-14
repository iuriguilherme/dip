-- Initialize database tables for Telegram bot messages and agent memory

-- Table for incoming Telegram updates
CREATE TABLE IF NOT EXISTS telegram_updates (
    id SERIAL PRIMARY KEY,
    bot_token VARCHAR(100) NOT NULL,
    update_id BIGINT NOT NULL,
    message_id BIGINT,
    chat_id BIGINT NOT NULL,
    user_id BIGINT,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    message_text TEXT,
    message_type VARCHAR(50),
    message_date TIMESTAMP,
    raw_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(bot_token, update_id)
);

-- Table for agent responses
CREATE TABLE IF NOT EXISTS agent_responses (
    id SERIAL PRIMARY KEY,
    update_id INTEGER REFERENCES telegram_updates(id),
    agent_name VARCHAR(100) NOT NULL,
    agent_personality VARCHAR(50) NOT NULL,
    response_text TEXT NOT NULL,
    llm_model VARCHAR(100),
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    sent_successfully BOOLEAN DEFAULT false,
    telegram_message_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for agent memory (context window)
CREATE TABLE IF NOT EXISTS agent_memory (
    id SERIAL PRIMARY KEY,
    agent_name VARCHAR(100) NOT NULL,
    chat_id BIGINT NOT NULL,
    message_role VARCHAR(20) NOT NULL, -- 'user' or 'assistant'
    message_content TEXT NOT NULL,
    message_timestamp TIMESTAMP NOT NULL,
    expires_at TIMESTAMP, -- When this memory should be dropped
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_telegram_updates_bot_token ON telegram_updates(bot_token);
CREATE INDEX IF NOT EXISTS idx_telegram_updates_chat_id ON telegram_updates(chat_id);
CREATE INDEX IF NOT EXISTS idx_telegram_updates_created_at ON telegram_updates(created_at);
CREATE INDEX IF NOT EXISTS idx_agent_responses_agent_name ON agent_responses(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_responses_created_at ON agent_responses(created_at);
CREATE INDEX IF NOT EXISTS idx_agent_memory_agent_name_chat_id ON agent_memory(agent_name, chat_id);
CREATE INDEX IF NOT EXISTS idx_agent_memory_expires_at ON agent_memory(expires_at);

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO n8n;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO n8n;
