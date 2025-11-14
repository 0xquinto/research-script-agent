import { OpenRouter } from '@openrouter/sdk';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Configuration interface for AI Core module
 */
export interface AICoreConfig {
  apiKey: string;
  defaultModel?: string;
  siteUrl?: string;
  siteName?: string;
}

/**
 * Message interface for chat completions
 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Chat completion options
 */
export interface ChatCompletionOptions {
  model?: string;
  messages: ChatMessage[];
  stream?: boolean;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

/**
 * Chat completion response
 */
export interface ChatCompletionResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Base AI Core module using OpenRouter
 * 
 * This module provides a unified interface for interacting with various AI models
 * through OpenRouter's API. It handles initialization, configuration, and provides
 * methods for chat completions.
 */
export class AICore {
  private client: OpenRouter;
  private defaultModel: string;
  private siteUrl: string;
  private siteName: string;

  /**
   * Initialize the AI Core module
   * 
   * @param config - Configuration object with API key and optional settings
   */
  constructor(config?: Partial<AICoreConfig>) {
    const apiKey = config?.apiKey || process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
      throw new Error('OpenRouter API key is required. Set OPENROUTER_API_KEY in your .env file or pass it in the config.');
    }

    this.defaultModel = config?.defaultModel || process.env.OPENROUTER_DEFAULT_MODEL || 'openai/gpt-4o';
    this.siteUrl = config?.siteUrl || process.env.OPENROUTER_SITE_URL || '';
    this.siteName = config?.siteName || process.env.OPENROUTER_SITE_NAME || '';

    this.client = new OpenRouter({
      apiKey,
    });
  }

  /**
   * Send a chat completion request
   * 
   * @param options - Chat completion options
   * @returns Promise resolving to the chat completion response
   */
  async chat(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    const model = options.model || this.defaultModel;
    const shouldStream = options.stream === true;

    // Prepare headers for OpenRouter rankings
    const headers: Record<string, string> = {};
    if (this.siteUrl) {
      headers['HTTP-Referer'] = this.siteUrl;
    }
    if (this.siteName) {
      headers['X-Title'] = this.siteName;
    }

    try {
      const requestParams: any = {
        model,
        messages: options.messages,
        stream: shouldStream ? true : false,
      };

      // Add optional parameters only if they are defined
      if (options.temperature !== undefined) {
        requestParams.temperature = options.temperature;
      }
      if (options.maxTokens !== undefined) {
        requestParams.maxTokens = options.maxTokens;
      }
      if (options.topP !== undefined) {
        requestParams.topP = options.topP;
      }
      if (options.frequencyPenalty !== undefined) {
        requestParams.frequencyPenalty = options.frequencyPenalty;
      }
      if (options.presencePenalty !== undefined) {
        requestParams.presencePenalty = options.presencePenalty;
      }

      const completion = await this.client.chat.send(
        requestParams as any,
        { headers: Object.keys(headers).length > 0 ? headers : undefined }
      );

      const message = completion.choices[0]?.message;
      if (!message) {
        throw new Error('No message in completion response');
      }

      // Handle content which can be string or array
      let content: string;
      if (typeof message.content === 'string') {
        content = message.content;
      } else if (Array.isArray(message.content)) {
        // Extract text from content array
        content = message.content
          .map((item: any) => (typeof item === 'string' ? item : item.text || ''))
          .join('');
      } else {
        throw new Error('No content in completion response');
      }

      return {
        content,
        model: completion.model || model,
        usage: completion.usage ? {
          promptTokens: completion.usage.promptTokens || 0,
          completionTokens: completion.usage.completionTokens || 0,
          totalTokens: completion.usage.totalTokens || 0,
        } : undefined,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`AI Core chat error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Send a simple message and get a response
   * 
   * @param message - The user message
   * @param model - Optional model override
   * @returns Promise resolving to the response content
   */
  async sendMessage(message: string, model?: string): Promise<string> {
    const response = await this.chat({
      model,
      messages: [
        {
          role: 'user',
          content: message,
        },
      ],
    });

    return response.content;
  }

  /**
   * Send a conversation with multiple messages
   * 
   * @param messages - Array of chat messages
   * @param model - Optional model override
   * @returns Promise resolving to the response content
   */
  async sendConversation(messages: ChatMessage[], model?: string): Promise<string> {
    const response = await this.chat({
      model,
      messages,
    });

    return response.content;
  }

  /**
   * Get the default model being used
   * 
   * @returns The default model identifier
   */
  getDefaultModel(): string {
    return this.defaultModel;
  }

  /**
   * Set a new default model
   * 
   * @param model - The model identifier to set as default
   */
  setDefaultModel(model: string): void {
    this.defaultModel = model;
  }
}

/**
 * Create and export a default instance of AICore
 * This can be imported directly: import { ai } from './core/ai'
 */
export const ai = new AICore({
  defaultModel: 'openai/gpt-5.1-chat'
});

