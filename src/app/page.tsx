'use client';

import React, { useState, useEffect } from 'react';
import { ChatSession, Message, Settings } from '@/lib/types';
import { DEFAULT_SYSTEM_PROMPT } from '@/lib/groq';
import { Sidebar } from '@/components/Sidebar';
import { ChatInterface } from '@/components/ChatInterface';
import { SettingsModal } from '@/components/SettingsModal';

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
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Initialize from LocalStorage
  useEffect(() => {
    try {
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
    }
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

  const currentSession =
    sessions.find((s) => s.id === activeSessionId) || {
      id: 'temp',
      title: 'New Chat',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: selectedModel,
      messages: [],
    };

  const handleSendMessage = async (userText: string) => {
    if (!userText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
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

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (settings.customApiKey) {
        headers['x-groq-api-key'] = settings.customApiKey;
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          model: selectedModel,
          temperature: settings.temperature,
          maxTokens: settings.maxTokens,
          systemPrompt: settings.systemPrompt,
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

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#171717]">
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        onNewChat={createNewSession}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        onClearAll={handleClearAll}
        onOpenSettings={() => setIsSettingsOpen(true)}
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
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={setSettings}
      />
    </div>
  );
}
