# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Telegram API                            │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐                    │
│  │ Bot 1   │    │ Bot 2   │    │ Bot 3   │                    │
│  └────┬────┘    └────┬────┘    └────┬────┘                    │
└───────┼──────────────┼──────────────┼──────────────────────────┘
        │              │              │
        │   Long Polling (no webhooks)
        │              │              │
┌───────▼──────────────▼──────────────▼──────────────────────────┐
│                      n8n Workflow                               │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  1. Telegram Triggers (3)                              │    │
│  │     ↓                                                   │    │
│  │  2. Merge Updates                                       │    │
│  │     ↓                                                   │    │
│  │  3. Filter Text Messages                               │    │
│  │     ↓                                                   │    │
│  │  4. Store in PostgreSQL ──→ [telegram_messages table]  │────┼──┐
│  │     ↓                                                   │    │  │
│  │  5. Retrieve Message History ←─ [telegram_messages]     │←───┼──┤
│  │     ↓                                                   │    │  │
│  │  6. Assign to Agent (Hash-based routing)               │    │  │
│  │     ↓                                                   │    │  │
│  │     ├─→ Agent Alpha (Professional) ──┐                 │    │  │
│  │     ├─→ Agent Beta (Friendly) ───────┼─→               │    │  │
│  │     └─→ Agent Gamma (Creative) ──────┘                 │    │  │
│  │     ↓                                                   │    │  │
│  │  7. Build Conversation Context                         │    │  │
│  │     ↓                                                   │    │  │
│  │  8. Call OpenAI LLM                                     │────┼──┼──┐
│  │     ↓                                                   │    │  │  │
│  │  9. Extract Response                                    │    │  │  │
│  │     ↓                                                   │    │  │  │
│  │ 10. Store Response (optional)                          │────┼──┤  │
│  │     ↓                                                   │    │  │  │
│  │ 11. Send Telegram Reply                                │    │  │  │
│  │     ↓                                                   │    │  │  │
│  │ 12. Mark as Replied ──→ [telegram_messages]            │────┼──┘  │
│  │     ↓                                                   │    │     │
│  │ 13. Mark as Sent                                        │    │     │
│  └────────────────────────────────────────────────────────┘    │     │
│                                                                  │     │
└──────────────────────────────────────────────────────────────────┘     │
                                   │                                     │
                                   │                                     │
┌──────────────────────────────────▼─────────────────────────────────────▼─┐
│                         PostgreSQL Database                              │
│                                                                           │
│  ┌───────────────────┐                                               │
│  │ telegram_messages │                                               │
│  ├───────────────────┤                                               │
│  │ - id              │                                               │
│  │ - unique_id       │                                               │
│  │ - bot_id          │                                               │
│  │ - update_id       │                                               │
│  │ - chat_id         │                                               │
│  │ - from_id         │                                               │
│  │ - message_id      │                                               │
│  │ - chat_type       │                                               │
│  │ - first_name      │                                               │
│  │ - message_text    │                                               │
│  │ - message_date    │                                               │
│  │ - replied         │                                               │
│  │ - is_bot          │                                               │
│  │ - created_at      │                                               │
│  └───────────────────┘                                               │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
                                   │
                                   │
┌──────────────────────────────────▼─────────────────────────────┐
│                         OpenAI API                              │
│                  (or compatible LLM endpoint)                   │
│                                                                  │
│  - Receives system prompt + conversation history                │
│  - Generates contextual responses                               │
│  - Returns completion with token usage                          │
└──────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Incoming Message
```
User → Telegram Bot → n8n Trigger → Store in DB
```

### 2. Message Retrieval
```
Chat ID → Query telegram_messages → Get last 10 messages
```

### 3. Agent Assignment
```
Hash(Chat ID) % 3 → Assign Agent → Load Personality
```

### 4. Response Generation
```
System Prompt + History + Message → OpenAI → Response
```

### 5. Reply & Storage
```
Response → Send to Telegram → Store in DB → Update Memory
```

## Agent Personality Matrix

| Agent   | Personality    | Tone            | Focus           | Example Response Style     |
|---------|---------------|-----------------|-----------------|---------------------------|
| Alpha   | Professional  | Formal, Clear   | Facts & Logic   | "Based on the data..."    |
| Beta    | Friendly      | Warm, Casual    | Empathy         | "I totally understand..." |
| Gamma   | Creative      | Playful, Unique | Imagination     | "Imagine it like this..." |

## Memory System

- **Capacity**: 10 messages per chat per agent
- **Duration**: 1 hour (configurable)
- **Scope**: Per agent + chat ID combination
- **Format**: Role (user/assistant) + Content + Timestamp
- **Cleanup**: Automatic deletion of expired memories

## Scalability Considerations

### Horizontal Scaling
- Multiple n8n instances can run the same workflow
- PostgreSQL handles concurrent requests
- Each bot token can be used by one instance only (Telegram limitation)

### Performance
- Long polling: ~1 request/second per bot
- LLM calls: Async, non-blocking
- Database: Indexed for fast lookups
- Memory cleanup: Automatic via SQL queries

### Cost Optimization
- Use `gpt-3.5-turbo` for lower costs
- Adjust max_tokens to control response length
- Set memory expiration to reduce storage
- Consider caching for frequently asked questions
