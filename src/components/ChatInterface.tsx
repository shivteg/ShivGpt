'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Message, ChatSession } from '@/lib/types';
import { isImageModel, isVideoModel } from '@/lib/groq';
import { ChatMessage } from './ChatMessage';
import { ModelSelector } from './ModelSelector';
import {
  Send,
  Sparkles,
  Menu,
  Zap,
  Code,
  Lightbulb,
  FileCode,
  Bot,
  RefreshCw,
  Loader2,
  Image as ImageIcon,
  Palette,
  Compass,
  Video,
  Film,
  Play,
  Brain,
  Paperclip,
  X,
  Upload,
} from 'lucide-react';

interface ChatInterfaceProps {
  session: ChatSession;
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  onSendMessage: (content: string, attachedImage?: { url: string; title?: string; context?: string }) => void;
  onRegenerate: () => void;
  isLoading: boolean;
  onToggleSidebar: () => void;
  onOpenTrainModal: () => void;
}

const TEXT_STARTER_PROMPTS = [
  {
    icon: Brain,
    title: 'Train AI with Picture Context',
    subtitle: 'Upload a picture & teach SAI custom context, pets, UI design or charts',
    prompt: '',
    isTrainAction: true,
  },
  {
    icon: Code,
    title: 'Write Python Code',
    subtitle: 'Build a REST API using FastAPI and Groq SDK',
    prompt: 'Write a complete Python script using FastAPI and Groq SDK to process text queries.',
  },
  {
    icon: Lightbulb,
    title: 'Explain Complex Concept',
    subtitle: 'How does modern LPU hardware achieve 800 tokens/sec?',
    prompt: 'Explain LPU processing architecture and how it achieves record-breaking inference speeds compared to traditional GPUs.',
  },
  {
    icon: FileCode,
    title: 'Debug React / Next.js',
    subtitle: 'Fix state re-render issue in Next.js App Router',
    prompt: 'How do I optimize React component state in Next.js App Router to avoid unnecessary re-renders?',
  },
];

const IMAGE_STARTER_PROMPTS = [
  {
    icon: Palette,
    title: 'Cyberpunk Neon City',
    subtitle: 'A futuristic Tokyo cityscape at midnight with neon rain',
    prompt: 'A vibrant cyberpunk Tokyo street at night with glowing neon kanji signs, reflections in wet pavement, ultra-detailed 8k resolution cinematic lighting',
  },
  {
    icon: Sparkles,
    title: '3D Pixar-Style Mascot',
    subtitle: 'A cute friendly AI robot companion',
    prompt: 'A cute 3D Pixar-style friendly robot assistant floating in a cozy modern study room, soft studio lighting, Octane render 8k',
  },
  {
    icon: Compass,
    title: 'Epic Fantasy Landscape',
    subtitle: 'Mystical floating islands over an emerald sea',
    prompt: 'Breathtaking fantasy landscape with giant floating islands, cascading waterfalls into clouds, golden hour sunlight, hyperrealistic digital painting',
  },
  {
    icon: ImageIcon,
    title: 'Photorealistic Portrait',
    subtitle: 'Close-up studio portrait with dramatic lighting',
    prompt: 'A photorealistic close-up portrait of a female astronaut looking into deep space through a helmet visor, reflections of distant galaxies, 8k photography',
  },
];

const VIDEO_STARTER_PROMPTS = [
  {
    icon: Film,
    title: 'Cinematic Sci-Fi Flythrough',
    subtitle: 'A high-speed drone shot flying through a glowing cyberpunk city',
    prompt: '/video A cinematic camera flythrough shot of a futuristic cyberpunk mega-city at dusk, neon reflections on glass skyscrapers, 4k ultra-HD 60fps video',
  },
  {
    icon: Video,
    title: 'Golden Hour Ocean Waves',
    subtitle: 'Slow motion ocean waves crashing on golden sand at sunset',
    prompt: '/video Cinematic slow-motion shot of ocean waves crashing gently on a tropical beach during golden hour, cinematic lighting, 4k high definition',
  },
  {
    icon: Play,
    title: '3D Character Animation',
    subtitle: 'Cute 3D robot character waving hello and turning around',
    prompt: '/video A cute 3D Pixar-style friendly robot character waving enthusiastically at the camera, smooth camera pan, 3D animated film render',
  },
  {
    icon: Sparkles,
    title: 'Magical Cherry Blossoms',
    subtitle: 'Pink sakura petals drifting in the wind around an ancient temple',
    prompt: '/video Cinematic slow-motion camera pan around a traditional Japanese pagoda temple with pink sakura cherry blossom petals falling gracefully in the wind',
  },
];

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  session,
  selectedModel,
  onSelectModel,
  onSendMessage,
  onRegenerate,
  isLoading,
  onToggleSidebar,
  onOpenTrainModal,
}) => {
  const [input, setInput] = useState('');
  const [attachedImage, setAttachedImage] = useState<{ url: string; title?: string; context?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const trainedImages = session.trainedImages || [];
  const isVideoMode = isVideoModel(selectedModel);
  const isImageMode = isImageModel(selectedModel);
  
  const activeStarters = isVideoMode 
    ? VIDEO_STARTER_PROMPTS 
    : isImageMode 
    ? IMAGE_STARTER_PROMPTS 
    : TEXT_STARTER_PROMPTS;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [session.messages, isLoading]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedImage({
          url: reader.result as string,
          title: file.name.replace(/\.[^/.]+$/, ''),
          context: 'User attached picture to this query',
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!input.trim() && !attachedImage) || isLoading) return;
    
    const messageText = input.trim() || (attachedImage ? `Analyze this picture: ${attachedImage.title || ''}` : '');
    onSendMessage(messageText, attachedImage || undefined);
    
    setInput('');
    setAttachedImage(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const cycleMode = () => {
    if (isVideoMode) {
      onSelectModel('llama-3.3-70b-versatile');
    } else if (isImageMode) {
      onSelectModel('kling-v1-5');
    } else {
      onSelectModel('flux-1-schnell');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-[#171717] overflow-hidden relative">
      {/* Top Navigation Bar */}
      <header className="h-14 px-4 border-b border-neutral-800 flex items-center justify-between bg-[#171717]/90 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <ModelSelector selectedModel={selectedModel} onSelectModel={onSelectModel} />
        </div>

        <div className="flex items-center gap-2">
          {/* Train AI with Picture Button */}
          <button
            onClick={onOpenTrainModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-600 via-amber-600 to-purple-600 text-white text-xs font-semibold shadow-lg shadow-orange-950/40 hover:opacity-95 transition-all"
            title="Train AI with Picture & Context"
          >
            <Brain className="w-3.5 h-3.5 text-white" />
            <span className="hidden sm:inline">Train AI Picture</span>
            {trainedImages.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-white text-[10px] font-bold">
                {trainedImages.length}
              </span>
            )}
          </button>

          {/* Quick Mode Toggle Button */}
          <button
            onClick={cycleMode}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
              isVideoMode
                ? 'bg-purple-950/50 text-purple-300 border-purple-700/60 hover:bg-purple-900/60'
                : isImageMode
                ? 'bg-pink-950/50 text-pink-300 border-pink-700/60 hover:bg-pink-900/60'
                : 'bg-orange-950/40 text-orange-400 border-orange-900/50 hover:bg-orange-900/40'
            }`}
          >
            {isVideoMode ? (
              <>
                <Video className="w-3.5 h-3.5 text-purple-400" />
                <span>🎥 Kling AI Video</span>
              </>
            ) : isImageMode ? (
              <>
                <ImageIcon className="w-3.5 h-3.5 text-pink-400" />
                <span>🎨 Image Mode</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 fill-orange-400" />
                <span>🎥 AI Studio</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto">
        {session.messages.length === 0 ? (
          /* Empty State Suggestions */
          <div className="max-w-3xl mx-auto px-4 py-12 md:py-16 flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] text-center">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-xl mb-6 ${
              isVideoMode
                ? 'bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 shadow-purple-950/50'
                : isImageMode
                ? 'bg-gradient-to-br from-pink-500 via-rose-500 to-amber-500 shadow-pink-950/50'
                : 'bg-gradient-to-br from-orange-500 to-amber-600 shadow-orange-950/50 groq-glow'
            }`}>
              {isVideoMode ? (
                <Video className="w-9 h-9 text-white" />
              ) : isImageMode ? (
                <Palette className="w-9 h-9 text-white" />
              ) : (
                <Brain className="w-9 h-9 text-white" />
              )}
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-neutral-100 mb-2 tracking-tight">
              {isVideoMode
                ? 'What AI Video would you like to generate with Kling AI?'
                : isImageMode
                ? 'What image do you want to create?'
                : 'What would you like to build or train today?'}
            </h2>
            <p className="text-neutral-400 text-sm max-w-md mb-8 leading-relaxed">
              {isVideoMode
                ? 'Describe your cinematic video scene in detail. Powered by Kling AI & high-speed video rendering.'
                : isImageMode
                ? 'Describe your visual idea in detail. Powered by FLUX, Kling AI, DALL-E 3 & SDXL.'
                : "Powered by SAI (Shiv AI)'s vision models & open reasoning. Upload pictures to train AI or select a prompt."}
            </p>

            {/* Active Trained Pictures Bar */}
            {trainedImages.length > 0 && (
              <div className="mb-8 w-full max-w-lg p-3 rounded-2xl bg-neutral-900/90 border border-neutral-800 text-left">
                <div className="flex items-center justify-between text-xs font-semibold text-orange-400 mb-2">
                  <span className="flex items-center gap-1.5">
                    <Brain className="w-4 h-4 text-orange-400" />
                    <span>Trained Picture Memory ({trainedImages.length})</span>
                  </span>
                  <button
                    onClick={onOpenTrainModal}
                    className="text-[11px] text-neutral-400 hover:text-white underline"
                  >
                    Manage
                  </button>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {trainedImages.map((img) => (
                    <div
                      key={img.id}
                      className="flex items-center gap-2 p-1.5 rounded-lg bg-neutral-950 border border-neutral-800 flex-shrink-0"
                    >
                      <img src={img.imageUrl} alt={img.title} className="w-7 h-7 object-cover rounded" />
                      <span className="text-xs text-neutral-300 font-medium max-w-[120px] truncate">{img.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              {activeStarters.map((starter, idx) => {
                const IconComponent = starter.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      if (starter.isTrainAction) {
                        onOpenTrainModal();
                      } else {
                        onSendMessage(starter.prompt);
                      }
                    }}
                    className={`p-4 rounded-xl bg-neutral-900/80 hover:bg-neutral-800/90 border text-left transition-all group flex flex-col justify-between hover:scale-[1.01] ${
                      isVideoMode
                        ? 'border-neutral-800 hover:border-purple-500/50'
                        : isImageMode
                        ? 'border-neutral-800 hover:border-pink-500/50'
                        : starter.isTrainAction
                        ? 'border-orange-900/60 bg-gradient-to-br from-orange-950/30 to-purple-950/30 hover:border-orange-500'
                        : 'border-neutral-800 hover:border-orange-500/50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <IconComponent className={`w-5 h-5 mb-2 group-hover:scale-110 transition-transform ${
                        isVideoMode ? 'text-purple-400' : isImageMode ? 'text-pink-400' : 'text-orange-400'
                      }`} />
                      <Sparkles className={`w-3.5 h-3.5 text-neutral-600 transition-colors ${
                        isVideoMode
                          ? 'group-hover:text-purple-400'
                          : isImageMode
                          ? 'group-hover:text-pink-400'
                          : 'group-hover:text-orange-400'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-neutral-200 group-hover:text-white flex items-center gap-1.5">
                        {starter.title}
                        {starter.isTrainAction && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-orange-500 text-black font-bold">
                            NEW
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-neutral-500 group-hover:text-neutral-400 mt-0.5 line-clamp-2">
                        {starter.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Message History */
          <div className="divide-y divide-neutral-800/40 pb-36">
            {session.messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="py-6 px-4 md:px-6 bg-[#171717] flex gap-4 items-center text-neutral-400 text-sm">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
                  isVideoMode
                    ? 'bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 shadow-purple-950/50'
                    : isImageMode
                    ? 'bg-gradient-to-br from-pink-500 via-rose-500 to-amber-500 shadow-pink-950/50'
                    : 'bg-gradient-to-br from-orange-500 to-amber-600'
                }`}>
                  {isVideoMode ? (
                    <Video className="w-4 h-4 animate-spin text-white" />
                  ) : isImageMode ? (
                    <Palette className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Brain className="w-4 h-4 text-white animate-spin" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Loader2 className={`w-4 h-4 animate-spin ${
                    isVideoMode ? 'text-purple-400' : isImageMode ? 'text-pink-400' : 'text-orange-400'
                  }`} />
                  <span>
                    {isVideoMode
                      ? '🎥 Kling AI is generating your AI video...'
                      : isImageMode
                      ? '🎨 ShivGpt is generating your AI image...'
                      : 'SAI (Shiv AI) is analyzing picture & instructions...'}
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Bottom Floating Input Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#171717] via-[#171717] to-transparent pt-6">
        <div className="max-w-3xl mx-auto space-y-2">
          {session.messages.length > 0 && !isLoading && (
            <div className="flex justify-center">
              <button
                onClick={onRegenerate}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-xs text-neutral-300 transition-colors shadow-md"
              >
                <RefreshCw className={`w-3 h-3 ${
                  isVideoMode ? 'text-purple-400' : isImageMode ? 'text-pink-400' : 'text-orange-400'
                }`} />
                <span>{isVideoMode ? 'Regenerate Video' : isImageMode ? 'Regenerate Image' : 'Regenerate response'}</span>
              </button>
            </div>
          )}

          {/* Attached Image Preview Bar */}
          {attachedImage && (
            <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-900 border border-neutral-800 shadow-xl max-w-xs animate-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center gap-2 min-w-0">
                <img src={attachedImage.url} alt="Attached" className="w-10 h-10 object-cover rounded-lg border border-neutral-700" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-neutral-200 truncate">{attachedImage.title || 'Picture attached'}</div>
                  <div className="text-[10px] text-orange-400 font-medium">Ready to send with context</div>
                </div>
              </div>
              <button
                onClick={() => setAttachedImage(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="relative glass-input rounded-2xl shadow-2xl p-2 flex items-end gap-2 bg-[#212121]">
            {/* Hidden File Input for Picture Upload */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Upload Attachment Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-xl text-neutral-400 hover:text-orange-400 hover:bg-neutral-800 transition-colors flex-shrink-0"
              title="Attach picture to prompt"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              placeholder={
                isVideoMode
                  ? "Describe the video scene to generate (e.g. 'A cinematic camera shot of sunset on ocean waves')..."
                  : isImageMode
                  ? "Describe the image to generate (e.g. 'A futuristic cyberpunk city at sunset in 8k')..."
                  : "Message SAI (Shiv AI), attach a picture, or type /video [prompt]..."
              }
              className="w-full bg-transparent text-neutral-100 text-sm placeholder-neutral-500 px-2 py-2 focus:outline-none resize-none max-h-48 leading-relaxed font-sans"
            />

            <button
              type="submit"
              disabled={(!input.trim() && !attachedImage) || isLoading}
              className={`p-2.5 rounded-xl flex items-center justify-center transition-all ${
                (input.trim() || attachedImage) && !isLoading
                  ? isVideoMode
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-950/50'
                    : isImageMode
                    ? 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white shadow-lg shadow-pink-950/50'
                    : 'bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-950/50'
                  : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
              }`}
            >
              {isVideoMode ? <Video className="w-4 h-4 text-white" /> : isImageMode ? <Palette className="w-4 h-4 text-white" /> : <Send className="w-4 h-4" />}
            </button>
          </form>

          <p className="text-[11px] text-center text-neutral-500">
            ShivGpt AI Studio • Vision & Picture Training • Powered by shivteg
          </p>
        </div>
      </div>
    </div>
  );
};

