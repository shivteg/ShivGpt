import { GroqModelInfo } from './types';

export const TEXT_MODELS: GroqModelInfo[] = [
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B Versatile',
    description: 'Meta flagship open-weight 70B model, fast & highly intelligent.',
    contextWindow: 128000,
    speed: '~300 tokens/sec',
    badge: 'Recommended',
    type: 'text',
    provider: 'Groq',
  },
  {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B Instant',
    description: 'Ultra-fast lightweight model for instant responses & code snippets.',
    contextWindow: 128000,
    speed: '~800 tokens/sec',
    badge: 'Ultra Fast',
    type: 'text',
    provider: 'Groq',
  },
  {
    id: 'deepseek-r1-distill-llama-70b',
    name: 'DeepSeek R1 Distill 70B',
    description: 'Advanced reasoning model distilled by DeepSeek for complex logic.',
    contextWindow: 128000,
    speed: '~220 tokens/sec',
    badge: 'Reasoning',
    type: 'text',
    provider: 'Groq',
  },
  {
    id: 'mixtral-8x7b-32768',
    name: 'Mixtral 8x7B Instruct',
    description: 'Mistral AI mixture-of-experts model with 32k context.',
    contextWindow: 32768,
    speed: '~500 tokens/sec',
    type: 'text',
    provider: 'Groq',
  },
  {
    id: 'gemma2-9b-it',
    name: 'Gemma 2 9B Instruct',
    description: 'Google modern lightweight open model fine-tuned for chat.',
    contextWindow: 8192,
    speed: '~600 tokens/sec',
    type: 'text',
    provider: 'Groq',
  },
];

export const IMAGE_MODELS: GroqModelInfo[] = [
  {
    id: 'flux-1-schnell',
    name: 'FLUX.1 Schnell',
    description: 'State-of-the-art open image model by Black Forest Labs.',
    contextWindow: 0,
    speed: '~2-5 sec',
    badge: 'HD Art',
    type: 'image',
    provider: 'Together / FLUX',
  },
  {
    id: 'dall-e-3',
    name: 'DALL-E 3',
    description: 'OpenAI high-fidelity photorealistic & creative image generation.',
    contextWindow: 0,
    speed: '~5-10 sec',
    badge: 'DALL-E 3',
    type: 'image',
    provider: 'OpenAI',
  },
  {
    id: 'stable-diffusion-xl',
    name: 'Stable Diffusion XL',
    description: 'High resolution 1024x1024 photorealistic & artistic image generator.',
    contextWindow: 0,
    speed: '~4-8 sec',
    badge: 'SDXL',
    type: 'image',
    provider: 'Stability / HF',
  },
  {
    id: 'pollinations-flux',
    name: 'Pollinations FLUX',
    description: 'Fast, high-quality AI art generator powered by FLUX & Pollinations.',
    contextWindow: 0,
    speed: '~3-6 sec',
    badge: 'Instant',
    type: 'image',
    provider: 'Pollinations AI',
  },
];

export const SUPPORTED_MODELS: GroqModelInfo[] = [...TEXT_MODELS, ...IMAGE_MODELS];

export const isImageModel = (modelId: string): boolean => {
  return IMAGE_MODELS.some((m) => m.id === modelId) || modelId.startsWith('flux') || modelId.includes('dall-e') || modelId.includes('stable-diffusion') || modelId.includes('pollinations');
};

export const getModelInfo = (modelId: string): GroqModelInfo => {
  return SUPPORTED_MODELS.find((m) => m.id === modelId) || SUPPORTED_MODELS[0];
};

export const DEFAULT_SYSTEM_PROMPT = 
  "You are a helpful, brilliant, and precise AI assistant known as SAI (Shiv AI), powered by lightning-fast inference. Provide clear, direct, and well-structured answers using GitHub-flavored Markdown. When providing code, specify language tags and write clean, modern code.";

