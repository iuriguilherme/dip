-- Initialize database tables for Telegram bot messages and agent memory

-- Table for incoming Telegram updates
CREATE TABLE IF NOT EXISTS telegram_messages (
    id SERIAL PRIMARY KEY,
    update_id BIGINT NOT NULL,
    message_id BIGINT,
    from_id BIGINT,
    first_name VARCHAR(255),
    chat_id BIGINT NOT NULL,
    chat_type VARCHAR(50),
    message_text TEXT,
    message_date TIMESTAMP,
    replied BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(update_id)
);

-- Table for agent responses
CREATE TABLE IF NOT EXISTS agent_responses (
    id SERIAL PRIMARY KEY,
    telegram_id INTEGER REFERENCES telegram_messages(id),
    agent_name VARCHAR(100) NOT NULL,
    agent_personality VARCHAR(50) NOT NULL,
    response_text TEXT NOT NULL,
    llm_model VARCHAR(100),
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    sent_successfully BOOLEAN DEFAULT false,
    telegram_message_id BIGINT,
    telegram_chat_id BIGINT,
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
CREATE INDEX IF NOT EXISTS idx_telegram_messages_chat_id ON telegram_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_telegram_messages_message_from_id ON telegram_messages(from_id);
CREATE INDEX IF NOT EXISTS idx_telegram_messages_created_at ON telegram_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_agent_responses_agent_name ON agent_responses(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_responses_created_at ON agent_responses(created_at);
CREATE INDEX IF NOT EXISTS idx_agent_memory_agent_name_chat_id ON agent_memory(agent_name, chat_id);
CREATE INDEX IF NOT EXISTS idx_agent_memory_expires_at ON agent_memory(expires_at);

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO n8n;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO n8n;
