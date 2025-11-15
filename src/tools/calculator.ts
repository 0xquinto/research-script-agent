import type { Tool, ToolResult, ParsedToolCall } from './types';

type CalculatorOperation = 'add' | 'subtract' | 'multiply' | 'divide';

interface CalculatorArgs {
  operation: CalculatorOperation;
  a: number;
  b: number;
}

const TOOL_CALL_TOKEN = 'CALL_TOOL';

/**
 * Calculator tool for performing basic arithmetic operations
 */
export const calculatorTool: Tool = {
  name: 'calculator',
  description: 'Performs basic arithmetic operations: add, subtract, multiply, divide',
  
  parseCall(message: string): CalculatorArgs | null {
    const trimmed = message.trim();
    if (!trimmed.toUpperCase().startsWith(TOOL_CALL_TOKEN)) {
      return null;
    }

    const tokens = trimmed.split(/\s+/);
    if (tokens.length < 4) {
      return null;
    }

    const [, opRaw, aRaw, bRaw] = tokens;
    const operation = opRaw.toLowerCase() as CalculatorOperation;
    
    if (!['add', 'subtract', 'multiply', 'divide'].includes(operation)) {
      return null;
    }

    const a = Number(aRaw);
    const b = Number(bRaw);
    
    if (Number.isNaN(a) || Number.isNaN(b)) {
      return null;
    }

    return { operation, a, b };
  },

  execute(args: CalculatorArgs): ToolResult {
    try {
      const { operation, a, b } = args;
      let result: number;

      switch (operation) {
        case 'add':
          result = a + b;
          break;
        case 'subtract':
          result = a - b;
          break;
        case 'multiply':
          result = a * b;
          break;
        case 'divide':
          if (b === 0) {
            return {
              success: false,
              error: 'Division by zero is not allowed.',
            };
          }
          result = a / b;
          break;
        default:
          return {
            success: false,
            error: `Unsupported calculator operation: ${operation}`,
          };
      }

      return {
        success: true,
        result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};

