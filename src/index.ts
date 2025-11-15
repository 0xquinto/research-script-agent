/**
 * Main entry point for the chat application
 * 
 * This file wires together the core AI, CLI, and tools modules.
 */

import { startChat } from './cli';

startChat().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Chat app failed: ${message}`);
  process.exit(1);
});
