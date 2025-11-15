/**
 * Tool execution result
 */
export interface ToolResult {
  success: boolean;
  result?: any;
  error?: string;
}

/**
 * Tool definition interface
 */
export interface Tool {
  name: string;
  description: string;
  execute: (args: any) => Promise<ToolResult> | ToolResult;
  parseCall: (message: string) => any | null;
}

/**
 * Parsed tool call
 */
export interface ParsedToolCall {
  toolName: string;
  args: any;
}

