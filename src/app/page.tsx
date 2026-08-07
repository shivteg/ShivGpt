'use client';

import React, { useState, useEffect } from 'react';
import { ChatSession, Message, Settings, AuthUser, TrainedImageContext } from '@/lib/types';
import { DEFAULT_SYSTEM_PROMPT, isImageModel, isVideoModel } from '@/lib/groq';
import { getStoredUser, supabaseSignOut, supabaseHandleAuthCallback } from '@/lib/supabase';
import { Sidebar } from '@/components/Sidebar';
import { ChatInterface } from '@/components/ChatInterface';
import { SettingsModal } from '@/components/SettingsModal';
import { AuthModal } from '@/components/AuthModal';
import { TrainImageModal } from '@/components/TrainImageModal';
import { Zap, CheckCircle } from 'lucide-react';

const DEFAULT_SETTINGS: Settings = {
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  temperature: 0.7,
  maxTokens: 4096,
  theme: 'dark',
  streamResponse: false,
};

export default function Home() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('llama-3.3-70b-versatile');
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isTrainModalOpen, setIsTrainModalOpen] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [authNotification, setAuthNotification] = useState<string | null>(null);

  // Initialize from LocalStorage and handle Supabase email confirmation callbacks
  useEffect(() => {
    const initAuth = async () => {
      try {
        // First check if user arrived from email confirmation link redirect (#access_token=...)
        const callbackResult = await supabaseHandleAuthCallback();
        if (callbackResult.user) {
          setUser(callbackResult.user);
          setIsAuthOpen(false);
          setAuthNotification('Email verified successfully! Welcome to ShivGpt.');
          setTimeout(() => setAuthNotification(null), 5000);
        } else {
          const savedUser = getStoredUser();
          if (savedUser) {
            setUser(savedUser);
          } else {
            setIsAuthOpen(true);
          }
        }

        const savedSessions = localStorage.getItem('groq_chat_sessions');
        const savedSettings = localStorage.getItem('groq_chat_settings');

        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }

        if (savedSessions) {
          const parsed: ChatSession[] = JSON.parse(savedSessions);
          if (parsed.length > 0) {
            setSessions(parsed);
            setActiveSessionId(parsed[0].id);
            setSelectedModel(parsed[0].model || 'llama-3.3-70b-versatile');
            return;
          }
        }

        // Create initial new chat session if none exists
        createNewSession();
      } catch (e) {
        console.error('Failed to load storage:', e);
        createNewSession();
      } finally {
        setAuthChecking(false);
      }
    };

    initAuth();
  }, []);

  // Save sessions to LocalStorage on change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('groq_chat_sessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  // Save settings to LocalStorage on change
  useEffect(() => {
    localStorage.setItem('groq_chat_settings', JSON.stringify(settings));
  }, [settings]);

  const handleSignOut = async () => {
    await supabaseSignOut(user?.accessToken);
    setUser(null);
  };

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: selectedModel,
      messages: [],
    };

    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  };

  const handleAddTrainedImage = (newImage: TrainedImageContext) => {
    const existing = currentSession.trainedImages || [];
    const updatedImages = [...existing, newImage];

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId ? { ...s, trainedImages: updatedImages } : s
      )
    );
  };

  const handleRemoveTrainedImage = (imageId: string) => {
    const existing = currentSession.trainedImages || [];
    const updatedImages = existing.filter((img) => img.id !== imageId);

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId ? { ...s, trainedImages: updatedImages } : s
      )
    );
  };

  const currentSession =
    sessions.find((s) => s.id === activeSessionId) || {
      id: 'temp',
      title: 'New Chat',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: selectedModel,
      messages: [],
    };

  const handleSendMessage = async (
    userText: string,
    attachedImage?: { url: string; title?: string; context?: string }
  ) => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }
    if (!userText.trim() && !attachedImage) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
      attachedImage: attachedImage,
      timestamp: Date.now(),
    };

    // Update state with user message
    const updatedMessages = [...currentSession.messages, userMessage];
    
    // Auto title for new sessions
    let title = currentSession.title;
    if (currentSession.messages.length === 0) {
      title = userText.length > 28 ? `${userText.substring(0, 28)}...` : userText;
    }

    const updatedSession: ChatSession = {
      ...currentSession,
      title,
      updatedAt: Date.now(),
      messages: updatedMessages,
    };

    setSessions((prev) =>
      prev.map((s) => (s.id === activeSessionId ? updatedSession : s))
    );

    setIsLoading(true);

    const isVideoReq =
      isVideoModel(selectedModel) ||
      userText.toLowerCase().startsWith('/video ') ||
      userText.toLowerCase().startsWith('/create-video ') ||
      userText.toLowerCase().startsWith('/clip ');

    if (isVideoReq) {
      let videoPrompt = userText;
      if (userText.toLowerCase().startsWith('/video ')) videoPrompt = userText.substring(7).trim();
      else if (userText.toLowerCase().startsWith('/create-video ')) videoPrompt = userText.substring(14).trim();
      else if (userText.toLowerCase().startsWith('/clip ')) videoPrompt = userText.substring(6).trim();

      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        if (user?.email) {
          headers['x-user-email'] = user.email;
        }

        if (settings.customVideoApiKey || settings.customImageApiKey) {
          headers['x-video-api-key'] = settings.customVideoApiKey || settings.customImageApiKey || '';
        }

        const response = await fetch('/api/generate-video', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            prompt: videoPrompt,
            model: isVideoModel(selectedModel) ? selectedModel : 'kling-v1-5',
            duration: '5',
          }),
        });

        const data = await response.json();

        if (response.ok && data.videoUrl) {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `🎥 Generated Kling AI Video for: "${data.prompt}"`,
            isVideo: true,
            videoUrl: data.videoUrl,
            videoPrompt: data.prompt,
            model: data.provider || data.model || selectedModel,
            usage: { latencyMs: data.latencyMs },
            timestamp: Date.now(),
          };

          setSessions((prev) =>
            prev.map((s) =>
              s.id === activeSessionId
                ? { ...s, messages: [...s.messages, assistantMessage] }
                : s
            )
          );
        } else {
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `⚠️ Video Generation Error: ${data.error || 'Failed to generate video'}`,
            timestamp: Date.now(),
          };

          setSessions((prev) =>
            prev.map((s) =>
              s.id === activeSessionId
                ? { ...s, messages: [...s.messages, errorMessage] }
                : s
            )
          );
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `⚠️ Video Generation Error: ${errorMsg || 'Could not connect to video server.'}`,
          timestamp: Date.now(),
        };

        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSessionId
              ? { ...s, messages: [...s.messages, errorMessage] }
              : s
          )
        );
      } finally {
        setIsLoading(false);
      }
      return;
    }

    const isImageReq =
      isImageModel(selectedModel) ||
      userText.toLowerCase().startsWith('/image ') ||
      userText.toLowerCase().startsWith('/draw ') ||
      userText.toLowerCase().startsWith('/generate ');

    if (isImageReq) {
      // Clean prompt from slash commands if used
      let imagePrompt = userText;
      if (userText.toLowerCase().startsWith('/image ')) imagePrompt = userText.substring(7).trim();
      else if (userText.toLowerCase().startsWith('/draw ')) imagePrompt = userText.substring(6).trim();
      else if (userText.toLowerCase().startsWith('/generate ')) imagePrompt = userText.substring(10).trim();

      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        if (user?.email) {
          headers['x-user-email'] = user.email;
        }

        if (settings.customImageApiKey) {
          headers['x-image-api-key'] = settings.customImageApiKey;
        }

        const response = await fetch('/api/generate-image', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            prompt: imagePrompt,
            model: isImageModel(selectedModel) ? selectedModel : 'flux-1-schnell',
            width: 1024,
            height: 1024,
          }),
        });

        const data = await response.json();

        if (response.ok && data.imageUrl) {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `🎨 Generated Image for: "${data.prompt}"`,
            isImage: true,
            imageUrl: data.imageUrl,
            imagePrompt: data.prompt,
            model: data.provider || data.model || selectedModel,
            usage: { latencyMs: data.latencyMs },
            timestamp: Date.now(),
          };

          setSessions((prev) =>
            prev.map((s) =>
              s.id === activeSessionId
                ? { ...s, messages: [...s.messages, assistantMessage] }
                : s
            )
          );
        } else {
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `⚠️ Image Generation Error: ${data.error || 'Failed to generate image'}`,
            timestamp: Date.now(),
          };

          setSessions((prev) =>
            prev.map((s) =>
              s.id === activeSessionId
                ? { ...s, messages: [...s.messages, errorMessage] }
                : s
            )
          );
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `⚠️ Image Generation Error: ${errorMsg || 'Could not connect to image server.'}`,
          timestamp: Date.now(),
        };

        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSessionId
              ? { ...s, messages: [...s.messages, errorMessage] }
              : s
          )
        );
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Text Chat Route
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (settings.customApiKey) {
        headers['x-groq-api-key'] = settings.customApiKey;
      }

      if (settings.resendApiKey) {
        headers['x-resend-api-key'] = settings.resendApiKey;
      }

      if (user?.email) {
        headers['x-user-email'] = user.email;
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
            attachedImage: m.attachedImage,
          })),
          model: selectedModel,
          temperature: settings.temperature,
          maxTokens: settings.maxTokens,
          systemPrompt: settings.systemPrompt,
          trainedImages: currentSession.trainedImages || [],
          userEmail: user?.email,
        }),
      });

      const data = await response.json();

      if (response.ok && data.content) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.content,
          timestamp: Date.now(),
          model: data.model || selectedModel,
          usage: data.usage,
        };

        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSessionId
              ? { ...s, messages: [...s.messages, assistantMessage] }
              : s
          )
        );
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `⚠️ Error: ${data.error || 'Failed to get response from Groq API'}`,
          timestamp: Date.now(),
        };

        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSessionId
              ? { ...s, messages: [...s.messages, errorMessage] }
              : s
          )
        );
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `⚠️ Network error: ${errorMsg || 'Could not connect to server route.'}`,
        timestamp: Date.now(),
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? { ...s, messages: [...s.messages, errorMessage] }
            : s
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = () => {
    if (currentSession.messages.length < 2) return;
    const lastUserMessageIndex = [...currentSession.messages]
      .reverse()
      .findIndex((m) => m.role === 'user');

    if (lastUserMessageIndex === -1) return;

    const actualUserIndex = currentSession.messages.length - 1 - lastUserMessageIndex;
    const userMessage = currentSession.messages[actualUserIndex];

    // Remove responses after last user message
    const trimmedMessages = currentSession.messages.slice(0, actualUserIndex);
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId ? { ...s, messages: trimmedMessages } : s
      )
    );

    handleSendMessage(userMessage.content);
  };

  const handleDeleteSession = (id: string) => {
    const filtered = sessions.filter((s) => s.id !== id);
    setSessions(filtered);
    if (filtered.length > 0) {
      setActiveSessionId(filtered[0].id);
    } else {
      createNewSession();
    }
  };

  const handleRenameSession = (id: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle } : s))
    );
  };

  const handleClearAll = () => {
    setSessions([]);
    localStorage.removeItem('groq_chat_sessions');
    createNewSession();
  };

  if (authChecking) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#171717] text-white">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-xl">
            <Zap className="w-7 h-7 fill-white" />
          </div>
          <div className="text-sm font-semibold text-neutral-300">Initializing ShivGpt...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-[#171717]">
      {authNotification && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 text-xs font-semibold shadow-2xl backdrop-blur-md animate-in slide-in-from-top-3 duration-300">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{authNotification}</span>
        </div>
      )}

      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        onNewChat={createNewSession}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        onClearAll={handleClearAll}
        onOpenSettings={() => setIsSettingsOpen(true)}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onSignOut={handleSignOut}
        isOpen={isSidebarOpen}
        onToggleOpen={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <ChatInterface
        session={currentSession}
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
        onSendMessage={handleSendMessage}
        onRegenerate={handleRegenerate}
        isLoading={isLoading}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenTrainModal={() => setIsTrainModalOpen(true)}
      />

      <TrainImageModal
        isOpen={isTrainModalOpen}
        onClose={() => setIsTrainModalOpen(false)}
        trainedImages={currentSession.trainedImages || []}
        onAddTrainedImage={handleAddTrainedImage}
        onRemoveTrainedImage={handleRemoveTrainedImage}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={setSettings}
      />

      <AuthModal
        isOpen={!user || isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        user={user}
        onAuthSuccess={(authUser) => {
          setUser(authUser);
          setIsAuthOpen(false);
        }}
        isCompulsory={!user}
      />
    </div>
  );
}


