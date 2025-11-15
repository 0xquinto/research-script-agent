import type { Tool, ParsedToolCall } from './types';
import { calculatorTool } from './calculator';

/**
 * Tool registry for managing available tools
 */
class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  constructor() {
    // Register default tools
    this.register(calculatorTool);
  }

  /**
   * Register a new tool
   */
  register(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Get a tool by name
   */
  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all registered tools
   */
  getAll(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Parse a tool call from a message
   * Returns the first matching tool call found
   */
  parseToolCall(message: string): ParsedToolCall | null {
    for (const tool of this.tools.values()) {
      const args = tool.parseCall(message);
      if (args !== null) {
        return {
          toolName: tool.name,
          args,
        };
      }
    }
    return null;
  }

  /**
   * Execute a tool call
   */
  async executeToolCall(parsedCall: ParsedToolCall): Promise<import('./types').ToolResult> {
    const tool = this.get(parsedCall.toolName);
    if (!tool) {
      return {
        success: false,
        error: `Tool "${parsedCall.toolName}" not found`,
      };
    }

    return await tool.execute(parsedCall.args);
  }

  /**
   * Generate system prompt describing available tools
   */
  generateSystemPrompt(): string {
    const toolDescriptions = this.getAll().map(tool => {
      return `- ${tool.name}: ${tool.description}`;
    }).join('\n');

    return `You have access to the following tools:
${toolDescriptions}

When you need to use a tool, reply with exactly: CALL_TOOL <operation> <arg1> <arg2> (e.g. 'CALL_TOOL add 2 2').
Wait for a follow-up message that begins with "You executed" containing the result, then continue the conversation without repeating the tool call.`;
  }
}

/**
 * Default tool registry instance
 */
export const toolRegistry = new ToolRegistry();

/**
 * Export registry class for custom instances
 */
export { ToolRegistry };

