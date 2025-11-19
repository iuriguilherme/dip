# AI Agents Documentation

## Overview

This project implements a multi-agent system with three distinct AI personalities that respond to Telegram messages. Each agent has a unique personality, communication style, and approach to problem-solving. Agents are automatically assigned to chat conversations based on a consistent hash of the chat ID, ensuring the same agent always handles the same conversation.

## The Three Agents

### Agent Alpha - The Professional Analyst

**Personality**: Professional and analytical

**Communication Style**:
- Clear and concise responses
- Well-structured information
- Focuses on facts and logical reasoning
- Provides evidence-based answers
- Uses formal language
- Prioritizes accuracy and precision

**System Prompt**:
```
You are Agent Alpha, a professional and analytical AI assistant. You provide clear, concise, and well-structured responses. You focus on facts and logical reasoning.
```

**Best Use Cases**:
- Technical inquiries
- Data analysis questions
- Decision-making support
- Professional communications
- Factual information requests

**Example Response Style**:
> "Based on the data provided, there are three key factors to consider: 1) Market trends show a 15% increase, 2) Operating costs remain stable at current levels, 3) Consumer sentiment indicators suggest positive reception. Therefore, I recommend proceeding with the proposed plan."

---

### Agent Beta - The Friendly Companion

**Personality**: Friendly and empathetic

**Communication Style**:
- Warm and conversational tone
- Casual and approachable language
- Shows emotional intelligence
- Provides supportive responses
- Uses empathy and understanding
- Creates a comfortable atmosphere

**System Prompt**:
```
You are Agent Beta, a friendly and empathetic AI assistant. You are warm, conversational, and use casual language. You care about the user's feelings and provide supportive responses.
```

**Best Use Cases**:
- Personal conversations
- Emotional support
- Casual questions
- Social interactions
- Learning and education
- Daily assistance

**Example Response Style**:
> "Hey! I totally understand where you're coming from - that sounds really challenging! Let me help you work through this. From what you've shared, it seems like you're doing great so far. Have you thought about breaking it down into smaller steps? I'm here to help if you need to talk it through!"

---

### Agent Gamma - The Creative Innovator

**Personality**: Creative and imaginative

**Communication Style**:
- Thinks outside the box
- Uses metaphors and analogies
- Provides unique perspectives
- Enjoys wordplay and creative language
- Explores unconventional solutions
- Encourages creative thinking

**System Prompt**:
```
You are Agent Gamma, a creative and imaginative AI assistant. You think outside the box, use metaphors and analogies, and provide unique perspectives. You enjoy wordplay and creative solutions.
```

**Best Use Cases**:
- Brainstorming sessions
- Creative writing
- Problem-solving with novel approaches
- Artistic projects
- Innovation discussions
- Entertainment and fun conversations

**Example Response Style**:
> "Picture this: your challenge is like a puzzle where the pieces are scattered across different dimensions. What if we flip the board entirely? Instead of climbing the mountain, let's tunnel through it! Here's a wild idea that might just work: combine approach A with the unexpected twist of approach Z. It's like jazz - sometimes the best solutions come from improvisation!"

---

## Agent Assignment

### How Agents Are Assigned

The system uses a **deterministic hash function** to assign agents to conversations:

1. Takes the Telegram chat ID
2. Applies a hash function
3. Uses modulo 3 to select one of the three agents
4. The same chat ID always gets the same agent

**Benefits**:
- **Consistency**: Users always interact with the same agent personality
- **Memory continuity**: Agents can maintain context over time
- **User preference**: Users experience a consistent communication style
- **Load balancing**: Chats are evenly distributed across agents

### Code Implementation

```javascript
function hashChatId(chatId) {
  const str = String(chatId);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

const agentIndex = hashChatId(chatId) % 3;
```

---

## Memory System

Each agent maintains conversation memory for **1 hour** per chat. This memory includes:

- Recent user messages
- Agent responses
- Conversation context
- Temporal information

### Database Schema

Incoming Telegram messages are stored in the `telegram_messages` table.
See `docker/init.sql` for the complete schema and indexes.

### Memory Retrieval

When an agent receives a message, it:
1. Retrieves the last N messages from the conversation (within the 1-hour window)
2. Builds conversation context
3. Generates a response based on the full context
4. Stores both the user message and agent response

---

## Customization Guide

### Modifying Agent Personalities

To customize agent personalities, edit the **"Assign to Agents"** node in the n8n workflow:

**Location**: `workflows/telegram-multi-agent-bot.json`

**Node**: "Assign to Agents" (Code node)

**What to modify**:

```javascript
const agents = [
  {
    name: 'Agent Alpha',
    personality: 'professional',
    systemPrompt: 'Your custom system prompt here...'
  },
  {
    name: 'Agent Beta',
    personality: 'friendly',
    systemPrompt: 'Your custom system prompt here...'
  },
  {
    name: 'Agent Gamma',
    personality: 'creative',
    systemPrompt: 'Your custom system prompt here...'
  }
];
```

### Tips for Effective System Prompts

1. **Be Specific**: Clearly define the agent's role and behavior
2. **Set Boundaries**: Specify what the agent should and shouldn't do
3. **Define Style**: Describe the communication tone and approach
4. **Add Context**: Include any domain-specific knowledge or constraints
5. **Test Iteratively**: Refine prompts based on actual responses

### Example Custom Prompts

**Technical Support Agent**:
```
You are a technical support specialist. You provide step-by-step troubleshooting guidance, ask diagnostic questions, and explain technical concepts in simple terms. Always be patient and thorough.
```

**Creative Writing Coach**:
```
You are a creative writing mentor. You inspire writers with prompts, provide constructive feedback, and help develop storytelling skills. Use vivid language and encourage experimentation.
```

**Business Advisor**:
```
You are a business strategy consultant. You analyze situations from multiple angles, provide data-driven insights, and offer practical recommendations. Focus on ROI and actionable outcomes.
```

---

## Memory Configuration

### Adjusting Memory Duration

To change the 1-hour memory window, modify the **"Store in Agent Memory"** node:

```sql
-- Change the interval in the expires_at calculation
expires_at = NOW() + INTERVAL '2 hours'  -- Example: 2 hours instead of 1
```

### Memory Retrieval Window

To adjust how many messages are retrieved, modify the **"Get Agent Memory"** node:

```sql
-- Change the time interval
WHERE expires_at > NOW() 
  AND message_timestamp > NOW() - INTERVAL '1 hour'
ORDER BY message_timestamp ASC
LIMIT 20  -- Adjust the number of messages
```

---

## Best Practices

### For Users

1. **Be Consistent**: Stay in the same chat to interact with the same agent
2. **Provide Context**: The agent remembers recent messages but not indefinitely
3. **Be Clear**: Well-formed questions get better responses
4. **Experiment**: Try different communication styles with different agents

### For Developers

1. **Monitor Logs**: Check agent response quality in the database
2. **A/B Test Prompts**: Try different system prompts and compare results
3. **Balance Load**: Ensure chats are evenly distributed
4. **Clean Old Memory**: Implement periodic cleanup of expired memory records
5. **Track Metrics**: Monitor response times, token usage, and user satisfaction

---

## Troubleshooting

### Agent Not Responding

**Check**:
- Is the Telegram bot token valid?
- Is the LLM API (OpenAI/Gemini/Deepseek) configured correctly?
- Are there error logs in the n8n workflow execution?

### Inconsistent Agent Assignment

**Check**:
- The hash function is deterministic; the same chat ID always gets the same agent
- If you see different agents, the chat ID might have changed (rare but possible)

### Memory Not Working

**Check**:
- Database connection is healthy
- `telegram_messages` table exists and contains recent messages
- Workflow nodes correctly build and pass conversation context

### Poor Response Quality

**Try**:
- Refine the system prompt with more specific instructions
- Adjust the temperature parameter in the LLM node (lower = more focused)
- Provide more context in the system prompt
- Increase the memory window to include more conversation history

---

## LLM Provider Configuration

Agents use the LLM provider configured in your `.env` file:

```bash
# Set your preferred provider
LLM_PROVIDER=openai          # or 'gemini', 'deepseek'
LLM_MODEL=gpt-3.5-turbo      # or your preferred model

# API keys
OPENAI_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here
DEEPSEEK_API_KEY=your_key_here
```

All three agents use the same LLM provider and model, but their distinct personalities come from their different system prompts.

---

## Future Enhancements

### Potential Improvements

1. **Agent Switching**: Allow users to manually switch between agents
2. **Personality Learning**: Agents adapt their style based on user preferences
3. **Specialized Agents**: Add domain-specific agents (e.g., coding, health, finance)
4. **Multi-language Support**: Agents communicate in the user's preferred language
5. **Agent Collaboration**: Multiple agents work together on complex queries
6. **Persistent Long-term Memory**: Extend memory beyond 1 hour with summarization

---

## Contributing

To contribute new agent personalities or improvements:

1. Fork the repository
2. Create a new branch for your agent
3. Modify the workflow JSON file
4. Test thoroughly with various inputs
5. Update this documentation
6. Submit a pull request

---

## License

This project is licensed under the GNU General Public License v3.0 (GPL-3.0).
See the [LICENSE](LICENSE) file for details.

---

**Last Updated**: 2025-11-15
**Version**: 1.0
**Maintainer**: dip project team
