export interface TrainedImageContext {
  id: string;
  title: string;
  context: string;
  imageUrl: string;
  createdAt: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  model?: string;
  isImage?: boolean;
  imageUrl?: string;
  imagePrompt?: string;
  attachedImage?: {
    url: string;
    title?: string;
    context?: string;
  };
  isVideo?: boolean;
  videoUrl?: string;
  videoPrompt?: string;
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
  trainedImages?: TrainedImageContext[];
  messages: Message[];
}

export interface GroqModelInfo {
  id: string;
  name: string;
  description: string;
  contextWindow: number;
  speed: string;
  badge?: string;
  type?: 'text' | 'image' | 'video';
  provider?: string;
}

export interface Settings {
  customApiKey?: string;
  customImageApiKey?: string;
  customVideoApiKey?: string;
  resendApiKey?: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  theme: 'dark' | 'light';
  streamResponse: boolean;
  defaultImageModel?: string;
  defaultVideoModel?: string;
}
export interface AuthUser {
  id: string;
  email: string;
  username?: string;
  accessToken?: string;
  createdAt?: string;
}

