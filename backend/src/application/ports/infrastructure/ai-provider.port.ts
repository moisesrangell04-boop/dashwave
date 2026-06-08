export interface AICompletionMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AICompletionResult {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AIProviderPort {
  complete(messages: AICompletionMessage[], options?: AICompletionOptions): Promise<AICompletionResult>;
  streamComplete(messages: AICompletionMessage[], options?: AICompletionOptions): AsyncIterable<string>;
}

export interface AICompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  provider?: 'openai' | 'anthropic' | 'gemini';
}
