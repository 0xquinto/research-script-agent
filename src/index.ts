import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { ai, type ChatMessage } from './core/ai';

const EXIT_COMMANDS = new Set(['exit', '/exit', 'quit', '/quit']);

async function main() {
  const rl = createInterface({ input, output });
  rl.on('SIGINT', () => {
    console.log('\nGoodbye!');
    rl.close();
    process.exit(0);
  });

  const conversation: ChatMessage[] = [
    {
      role: 'system',
      content: 'You are a helpful research assistant chatting with the user through their terminal.',
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
        const response = await ai.chat({ messages: conversation });
        const assistantReply = response.content.trim();
        console.log(`AI (${response.model}): ${assistantReply}\n`);
        conversation.push({ role: 'assistant', content: assistantReply });
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

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Chat app failed: ${message}`);
  process.exit(1);
});
