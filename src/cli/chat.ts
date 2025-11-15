import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { ai, type ChatMessage } from '../core/ai';
import { toolRegistry, type ParsedToolCall } from '../tools';

const EXIT_COMMANDS = new Set(['exit', '/exit', 'quit', '/quit']);

/**
 * Handle assistant response, including tool calls
 */
async function respondWithAssistant(conversation: ChatMessage[]): Promise<void> {
  // Keep polling the AI until it returns a regular message (i.e., not a tool call)
  while (true) {
    const response = await ai.chat({ messages: conversation });
    const assistantReply = response.content.trim();
    const assistantMessage: ChatMessage = { role: 'assistant', content: assistantReply };
    conversation.push(assistantMessage);

    const toolCall = toolRegistry.parseToolCall(assistantReply);
    if (!toolCall) {
      console.log(`AI (${response.model}): ${assistantReply}\n`);
      return;
    }

    // Execute the tool call
    console.log(`AI requested ${toolCall.toolName}:`, toolCall.args);
    const toolResult = await toolRegistry.executeToolCall(toolCall);
    
    if (toolResult.success) {
      const toolMessage = `You executed ${toolCall.toolName}(${JSON.stringify(toolCall.args)}); result = ${toolResult.result}. Use this to reply to the user.`;
      console.log(`Tool result: ${toolResult.result}\n`);
      conversation.push({ role: 'user', content: toolMessage });
    } else {
      const errorMessage = `Tool execution failed: ${toolResult.error}. Use this to reply to the user.`;
      console.log(`Tool error: ${toolResult.error}\n`);
      conversation.push({ role: 'user', content: errorMessage });
    }
  }
}

/**
 * Start the interactive chat CLI
 */
export async function startChat(): Promise<void> {
  const rl = createInterface({ input, output });
  
  rl.on('SIGINT', () => {
    console.log('\nGoodbye!');
    rl.close();
    process.exit(0);
  });

  const conversation: ChatMessage[] = [
    {
      role: 'system',
      content: [
        'You are a helpful research assistant chatting with the user through their terminal.',
        toolRegistry.generateSystemPrompt(),
      ].join('\n\n'),
    },
  ];

  console.log('AI Terminal Chat');
  console.log("Type 'exit' or '/exit' to leave the conversation.\n");

  try {
    // Loop until the user exits manually
    while (true) {
      const userInput = (await rl.question('You: ')).trim();
      if (!userInput) {
        continue;
      }

      if (EXIT_COMMANDS.has(userInput.toLowerCase())) {
        console.log('Goodbye!');
        break;
      }

      conversation.push({ role: 'user', content: userInput });

      try {
        await respondWithAssistant(conversation);
      } catch (error) {
        conversation.pop(); // Remove the unprocessed user message
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Failed to reach AI: ${message}\n`);
      }
    }
  } finally {
    rl.close();
  }
}

