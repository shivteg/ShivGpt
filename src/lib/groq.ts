import { GroqModelInfo } from './types';

export const SUPPORTED_MODELS: GroqModelInfo[] = [
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B Versatile',
    description: 'Meta flagship open-weight 70B model, fast & highly intelligent.',
    contextWindow: 128000,
    speed: '~300 tokens/sec',
    badge: 'Recommended',
  },
  {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B Instant',
    description: 'Ultra-fast lightweight model for instant responses & code snippets.',
    contextWindow: 128000,
    speed: '~800 tokens/sec',
    badge: 'Ultra Fast',
  },
  {
    id: 'deepseek-r1-distill-llama-70b',
    name: 'DeepSeek R1 Distill 70B',
    description: 'Advanced reasoning model distilled by DeepSeek for complex logic.',
    contextWindow: 128000,
    speed: '~220 tokens/sec',
    badge: 'Reasoning',
  },
  {
    id: 'mixtral-8x7b-32768',
    name: 'Mixtral 8x7B Instruct',
    description: 'Mistral AI mixture-of-experts model with 32k context.',
    contextWindow: 32768,
    speed: '~500 tokens/sec',
  },
  {
    id: 'gemma2-9b-it',
    name: 'Gemma 2 9B Instruct',
    description: 'Google modern lightweight open model fine-tuned for chat.',
    contextWindow: 8192,
    speed: '~600 tokens/sec',
  },
];

export const DEFAULT_SYSTEM_PROMPT = 
  "You are a helpful, brilliant, and precise AI assistant known as SAI (Shiv AI), powered by lightning-fast inference. Provide clear, direct, and well-structured answers using GitHub-flavored Markdown. When providing code, specify language tags and write clean, modern code.";
