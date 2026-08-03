export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  model?: string;
  isImage?: boolean;
  imageUrl?: string;
  imagePrompt?: string;
  usage?: {
    totalTokens?: number;
    promptTokens?: number;
    completionTokens?: number;
    latencyMs?: number;
    tokensPerSecond?: number;
  };
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  model: string;
  systemPrompt?: string;
  messages: Message[];
}

export interface GroqModelInfo {
  id: string;
  name: string;
  description: string;
  contextWindow: number;
  speed: string;
  badge?: string;
  type?: 'text' | 'image';
  provider?: string;
}

export interface Settings {
  customApiKey?: string;
  customImageApiKey?: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  theme: 'dark' | 'light';
  streamResponse: boolean;
  defaultImageModel?: string;
}

