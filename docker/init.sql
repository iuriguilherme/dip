-- Initialize database tables for Telegram bot messages and agent memory

-- Table for incoming Telegram updates
CREATE TABLE IF NOT EXISTS telegram_messages (
    id SERIAL PRIMARY KEY,
    unique_id VARCHAR(255) NOT NULL,
    bot_id BIGINT NOT NULL,
    update_id BIGINT NOT NULL,
    chat_id BIGINT NOT NULL,
    from_id BIGINT NOT NULL,
    message_id BIGINT NOT NULL,
    chat_type VARCHAR(50) NOT NULL,
    first_name VARCHAR(255),
    message_text TEXT NOT NULL,
    message_date BIGINT NOT NULL,
    replied BOOLEAN DEFAULT false,
    is_bot BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(unique_id)
);

-- Table for agent responses
-- CREATE TABLE IF NOT EXISTS agent_responses (
--     id SERIAL PRIMARY KEY,
--     telegram_id INTEGER REFERENCES telegram_messages(id),
--     agent_name VARCHAR(100) NOT NULL,
--     agent_personality VARCHAR(50) NOT NULL,
--     agent_feeling VARCHAR(50) NOT NULL,
--     agent_emotion VARCHAR(50) NOT NULL,
--     response_text TEXT NOT NULL,
--     llm_model VARCHAR(100),
--     prompt_tokens INTEGER,
--     completion_tokens INTEGER,
--     sent_successfully BOOLEAN DEFAULT false,
--     telegram_update_id BIGINT,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_telegram_messages_chat_id ON telegram_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_telegram_messages_update_id ON telegram_messages(update_id);
CREATE INDEX IF NOT EXISTS idx_telegram_messages_from_id ON telegram_messages(from_id);
CREATE INDEX IF NOT EXISTS idx_telegram_messages_date ON telegram_messages(message_date);
CREATE INDEX IF NOT EXISTS idx_telegram_messages_created_at ON telegram_messages(created_at);
-- CREATE INDEX IF NOT EXISTS idx_agent_responses_agent_name ON agent_responses(agent_name);
-- CREATE INDEX IF NOT EXISTS idx_agent_responses_created_at ON agent_responses(created_at);

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO n8n;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO n8n;
