'use client';

import React, { useState } from 'react';
import { Message } from '@/lib/types';
import { CodeBlock } from './CodeBlock';
import { Bot, User, Copy, Check, Zap, Clock } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Basic parser for code blocks vs regular markdown text
  const parseContent = (content: string) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.substring(lastIndex, match.index),
        });
      }
      parts.push({
        type: 'code',
        language: match[1] || 'plaintext',
        content: match[2],
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.substring(lastIndex),
      });
    }

    return parts.length > 0 ? parts : [{ type: 'text', content }];
  };

  const parts = parseContent(message.content);

  return (
    <div
      className={`py-6 px-4 md:px-6 flex gap-4 transition-colors ${
        isUser ? 'bg-[#212121]' : 'bg-[#171717] border-y border-neutral-800/40'
      }`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {isUser ? (
          <div className="w-8 h-8 rounded-full bg-orange-600/30 border border-orange-500/50 flex items-center justify-center text-orange-400 font-semibold shadow-md">
            <User className="w-4 h-4" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-orange-950/50">
            <Zap className="w-4 h-4 fill-white" />
          </div>
        )}
      </div>

      {/* Message Body */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-neutral-200">
              {isUser ? 'You' : 'SAI (Shiv AI)'}
            </span>
            {message.model && !isUser && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700">
                {message.model}
              </span>
            )}
          </div>

          <button
            onClick={handleCopy}
            className="p-1 rounded text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 transition-colors"
            title="Copy message"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="text-neutral-200 text-sm leading-relaxed space-y-3">
          {parts.map((part, idx) => {
            if (part.type === 'code') {
              return <CodeBlock key={idx} language={part.language} code={part.content} />;
            }
            return (
              <div key={idx} className="whitespace-pre-wrap font-sans">
                {part.content}
              </div>
            );
          })}
        </div>

        {/* Speed / Token Usage Badge */}
        {!isUser && message.usage && (
          <div className="pt-2 flex flex-wrap items-center gap-3 text-[11px] text-neutral-500">
            {message.usage.tokensPerSecond ? (
              <div className="flex items-center gap-1 text-orange-400 font-medium bg-orange-950/30 px-2 py-0.5 rounded border border-orange-900/40">
                <Zap className="w-3 h-3" />
                <span>{message.usage.tokensPerSecond} tokens/sec</span>
              </div>
            ) : null}

            {message.usage.latencyMs ? (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{message.usage.latencyMs} ms</span>
              </div>
            ) : null}

            {message.usage.totalTokens ? (
              <div>
                <span>{message.usage.totalTokens} total tokens</span>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};
