'use client';

import React, { useState } from 'react';
import { Message } from '@/lib/types';
import { CodeBlock } from './CodeBlock';
import { User, Copy, Check, Zap, Clock, Download, Maximize2, Sparkles, Image as ImageIcon, ExternalLink, Video, Film } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const [copied, setCopied] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.videoUrl || message.imageUrl || message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    const targetUrl = message.videoUrl || message.imageUrl;
    if (!targetUrl) return;
    try {
      const response = await fetch(targetUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shivgpt-generated-${message.isVideo ? 'video' : 'art'}-${Date.now()}.${message.isVideo ? 'mp4' : 'jpg'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      window.open(targetUrl, '_blank');
    }
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
    <>
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
          ) : message.isVideo ? (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-purple-950/50">
              <Video className="w-4 h-4 text-white" />
            </div>
          ) : message.isImage ? (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 via-rose-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-pink-950/50">
              <ImageIcon className="w-4 h-4 text-white" />
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
                {isUser
                  ? 'You'
                  : message.isVideo
                  ? 'ShivGpt AI Video Studio (Kling AI)'
                  : message.isImage
                  ? 'ShivGpt AI Image Studio'
                  : 'SAI (Shiv AI)'}
              </span>
              {message.model && !isUser && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700 flex items-center gap-1">
                  {message.isVideo ? (
                    <Film className="w-3 h-3 text-purple-400" />
                  ) : message.isImage ? (
                    <Sparkles className="w-3 h-3 text-pink-400" />
                  ) : null}
                  <span>{message.model}</span>
                </span>
              )}
            </div>

            <button
              onClick={handleCopy}
              className="p-1 rounded text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 transition-colors"
              title="Copy link or text"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Generated Video Content */}
          {message.isVideo && message.videoUrl ? (
            <div className="mt-3 space-y-3">
              <div className="text-xs text-neutral-400 italic bg-neutral-900/60 px-3 py-1.5 rounded-lg border border-neutral-800/80 inline-flex items-center gap-2">
                <Video className="w-3.5 h-3.5 text-purple-400" />
                <span>Video Prompt: "{message.videoPrompt || message.content}"</span>
              </div>

              <div className="relative group max-w-xl rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900 shadow-2xl">
                <video
                  src={message.videoUrl}
                  controls
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full rounded-2xl object-cover max-h-[450px]"
                />

                <div className="p-3 bg-neutral-950/80 flex items-center justify-between border-t border-neutral-800 text-xs">
                  <span className="text-neutral-400 truncate max-w-xs">{message.model || 'Kling AI Video'}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDownload}
                      className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-md"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download MP4</span>
                    </button>
                    <a
                      href={message.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
                      title="Open video link"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ) : message.isImage && message.imageUrl ? (
            /* Generated Image Content */
            <div className="mt-3 space-y-3">
              <div className="text-xs text-neutral-400 italic bg-neutral-900/60 px-3 py-1.5 rounded-lg border border-neutral-800/80 inline-flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                <span>Prompt: "{message.imagePrompt || message.content}"</span>
              </div>

              <div className="relative group max-w-lg rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900 shadow-2xl">
                {!imgLoaded && (
                  <div className="w-full h-80 bg-neutral-800/60 animate-pulse flex items-center justify-center text-neutral-500 text-xs gap-2">
                    <Sparkles className="w-4 h-4 animate-spin text-orange-400" />
                    <span>Rendering AI Image...</span>
                  </div>
                )}

                <img
                  src={message.imageUrl}
                  alt={message.imagePrompt || message.content}
                  onLoad={() => setImgLoaded(true)}
                  className={`w-full object-cover transition-all duration-300 group-hover:scale-[1.01] cursor-pointer ${
                    imgLoaded ? 'block' : 'hidden'
                  }`}
                  onClick={() => setIsModalOpen(true)}
                />

                {imgLoaded && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex items-end justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleDownload}
                        className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                      <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </button>
                    </div>
                    <a
                      href={message.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-md text-white transition-colors"
                      title="Open image in new tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Regular Text / Code Content & Attached Picture */
            <div className="text-neutral-200 text-sm leading-relaxed space-y-3">
              {message.attachedImage && message.attachedImage.url && (
                <div className="mb-3 p-3 rounded-xl bg-neutral-900 border border-neutral-800 max-w-md space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-orange-400">
                    <ImageIcon className="w-4 h-4 text-orange-400" />
                    <span>Attached Picture Context: {message.attachedImage.title || 'User Image'}</span>
                  </div>
                  <img
                    src={message.attachedImage.url}
                    alt={message.attachedImage.title || 'Attached Picture'}
                    className="max-h-56 w-auto object-cover rounded-lg border border-neutral-700 cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => {
                      if (message.attachedImage?.url) {
                        window.open(message.attachedImage.url, '_blank');
                      }
                    }}
                  />
                  {message.attachedImage.context && (
                    <p className="text-xs text-neutral-400 italic bg-neutral-950/60 p-2 rounded-lg border border-neutral-800">
                      Context instruction: "{message.attachedImage.context}"
                    </p>
                  )}
                </div>
              )}

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
          )}

          {/* Speed / Usage Badge */}
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

      {/* Fullscreen Image Preview Modal */}
      {isModalOpen && message.imageUrl && (
        <div
          onClick={() => setIsModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl border border-neutral-700 shadow-2xl">
            <img
              src={message.imageUrl}
              alt="Fullscreen AI Art Preview"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl"
            />
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between bg-black/70 backdrop-blur-md p-3 rounded-xl border border-neutral-800 text-white text-xs">
              <span className="truncate max-w-md">{message.imagePrompt || message.content}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white flex items-center gap-1.5 font-medium transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Save HD</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
