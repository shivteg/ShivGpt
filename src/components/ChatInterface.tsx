'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Message, ChatSession } from '@/lib/types';
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
} from 'lucide-react';

interface ChatInterfaceProps {
  session: ChatSession;
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  onSendMessage: (content: string) => void;
  onRegenerate: () => void;
  isLoading: boolean;
  onToggleSidebar: () => void;
}

const STARTER_PROMPTS = [
  {
    icon: Code,
    title: 'Write Python Code',
    subtitle: 'Build a REST API using FastAPI and Groq SDK',
    prompt: 'Write a complete Python script using FastAPI and Groq SDK to process text queries.',
  },
  {
    icon: Lightbulb,
    title: 'Explain Complex Concept',
    subtitle: 'How does Groq LPU architecture achieve 800 tokens/sec?',
    prompt: 'Explain Groq LPU architecture and how it achieves record-breaking inference speeds compared to traditional GPUs.',
  },
  {
    icon: FileCode,
    title: 'Debug React / Next.js',
    subtitle: 'Fix state re-render issue in Next.js App Router',
    prompt: 'How do I optimize React component state in Next.js App Router to avoid unnecessary re-renders?',
  },
  {
    icon: Bot,
    title: 'System Architecture',
    subtitle: 'Design scalable microservices on Vercel & Supabase',
    prompt: 'Design a high-performance system architecture using Vercel Next.js edge routes and Supabase database.',
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
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [session.messages, isLoading]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
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
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-orange-400 bg-orange-950/40 px-2.5 py-1 rounded-full border border-orange-900/50">
            <Zap className="w-3.5 h-3.5 fill-orange-400" />
            <span className="font-semibold">SAI (Shiv AI) Powered</span>
          </div>
        </div>
      </header>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto">
        {session.messages.length === 0 ? (
          /* Empty State Suggestions */
          <div className="max-w-3xl mx-auto px-4 py-12 md:py-16 flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-xl shadow-orange-950/50 mb-6 groq-glow">
              <Zap className="w-9 h-9 fill-white" />
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-neutral-100 mb-2 tracking-tight">
              What would you like to build today?
            </h2>
            <p className="text-neutral-400 text-sm max-w-md mb-10 leading-relaxed">
              Powered by SAI (Shiv AI)'s lightning-fast open models. Select a suggestion below or type your own question.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              {STARTER_PROMPTS.map((starter, idx) => {
                const IconComponent = starter.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => onSendMessage(starter.prompt)}
                    className="p-4 rounded-xl bg-neutral-900/80 hover:bg-neutral-800/90 border border-neutral-800 hover:border-orange-500/50 text-left transition-all group flex flex-col justify-between hover:scale-[1.01]"
                  >
                    <div className="flex items-start justify-between">
                      <IconComponent className="w-5 h-5 text-orange-400 mb-2 group-hover:scale-110 transition-transform" />
                      <Sparkles className="w-3.5 h-3.5 text-neutral-600 group-hover:text-orange-400 transition-colors" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-neutral-200 group-hover:text-white">
                        {starter.title}
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
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white">
                  <Zap className="w-4 h-4 fill-white animate-spin" />
                </div>
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
                  <span>SAI (Shiv AI) is thinking...</span>
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
                <RefreshCw className="w-3 h-3 text-orange-400" />
                <span>Regenerate response</span>
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="relative glass-input rounded-2xl shadow-2xl p-2 flex items-end gap-2 bg-[#212121]">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              placeholder="Message SAI (Shiv AI)..."
              className="w-full bg-transparent text-neutral-100 text-sm placeholder-neutral-500 px-3 py-2 focus:outline-none resize-none max-h-48 leading-relaxed font-sans"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={`p-2.5 rounded-xl flex items-center justify-center transition-all ${
                input.trim() && !isLoading
                  ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-950/50'
                  : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <p className="text-[11px] text-center text-neutral-500">
            SAI (Shiv AI) can make mistakes. Verify important information. Designed for Vercel deployment with <code className="text-orange-400 font-mono">GROQ_API_KEY</code>.
          </p>
        </div>
      </div>
    </div>
  );
};
