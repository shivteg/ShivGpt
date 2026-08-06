'use client';

import React, { useState } from 'react';
import { ChatSession, AuthUser } from '@/lib/types';
import {
  Plus,
  MessageSquare,
  Trash2,
  Settings as SettingsIcon,
  Zap,
  Edit2,
  Check,
  X,
  ExternalLink,
  ChevronLeft,
  User,
  LogIn,
  LogOut,
  ShieldCheck,
} from 'lucide-react';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, title: string) => void;
  onClearAll: () => void;
  onOpenSettings: () => void;
  user: AuthUser | null;
  onOpenAuth: () => void;
  onSignOut: () => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onRenameSession,
  onClearAll,
  onOpenSettings,
  user,
  onOpenAuth,
  onSignOut,
  isOpen,
  onToggleOpen,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleStartRename = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const handleSaveRename = (id: string, e: React.FormEvent) => {
    e.preventDefault();
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onToggleOpen}
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 md:w-72 bg-[#171717] border-r border-neutral-800 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Header Branding */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-orange-950/40">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            <div>
              <h1 className="font-bold text-sm text-neutral-100 tracking-tight flex items-center gap-1.5">
                ShivGpt AI <span className="text-[10px] px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-400 font-bold border border-orange-500/30">PRO</span>
              </h1>
              <p className="text-[11px] text-neutral-500">shivteg</p>
            </div>
          </div>
          <button
            onClick={onToggleOpen}
            className="md:hidden p-1 rounded-lg text-neutral-400 hover:text-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* User Profile Card */}
        <div className="p-3 border-b border-neutral-800 bg-[#1f1f1f]/50">
          {user ? (
            <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-900 border border-neutral-800">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
                  {user.username ? user.username.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-neutral-200 truncate flex items-center gap-1">
                    <span>{user.username || user.email.split('@')[0]}</span>
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  </div>
                  <div className="text-[10px] text-neutral-500 truncate">{user.email}</div>
                  <div className="text-[9px] text-amber-400/90 font-medium flex items-center gap-1 mt-0.5">
                    <span>⚡ Quota: 432 tokens/1 hr</span>
                  </div>
                </div>
              </div>
              <button
                onClick={onSignOut}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-neutral-800 transition-colors"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-orange-950/40 to-amber-950/40 border border-orange-900/50 hover:border-orange-500 text-orange-200 text-xs font-medium transition-all group"
            >
              <div className="flex items-center gap-2">
                <LogIn className="w-4 h-4 text-orange-400 group-hover:scale-110 transition-transform" />
                <span>Log In / Create Account</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 font-bold">
                Auth
              </span>
            </button>
          )}
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={onNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-medium text-sm shadow-lg shadow-orange-950/40 transition-all hover:scale-[1.01]"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <div className="px-2 py-1.5 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
            Recent Conversations
          </div>

          {sessions.length === 0 ? (
            <div className="text-center py-8 text-neutral-500 text-xs">
              No previous chats yet.
            </div>
          ) : (
            sessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const isEditing = session.id === editingId;

              return (
                <div
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  className={`group relative flex items-center justify-between px-3 py-2.5 rounded-lg text-xs cursor-pointer transition-all ${
                    isActive
                      ? 'bg-neutral-800 text-white font-medium border border-neutral-700'
                      : 'text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <MessageSquare className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-orange-400' : 'text-neutral-500'}`} />
                    {isEditing ? (
                      <form
                        onSubmit={(e) => handleSaveRename(session.id, e)}
                        className="flex items-center gap-1 flex-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full bg-neutral-900 text-white text-xs px-2 py-1 rounded border border-orange-500 focus:outline-none"
                          autoFocus
                        />
                        <button type="submit" className="text-green-400 hover:text-green-300">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="text-neutral-400 hover:text-neutral-300"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    ) : (
                      <span className="truncate">{session.title}</span>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="hidden group-hover:flex items-center gap-1">
                      <button
                        onClick={(e) => handleStartRename(session, e)}
                        className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-700"
                        title="Rename"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSession(session.id);
                        }}
                        className="p-1 rounded text-neutral-400 hover:text-red-400 hover:bg-neutral-700"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-neutral-800 space-y-1">
          {sessions.length > 0 && (
            <button
              onClick={onClearAll}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-neutral-400 hover:text-red-400 hover:bg-neutral-800/80 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear all chats</span>
            </button>
          )}

          <button
            onClick={onOpenSettings}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-neutral-300 hover:bg-neutral-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <SettingsIcon className="w-4 h-4 text-orange-400" />
              <span>Settings</span>
            </div>
            <span className="text-[10px] text-neutral-500">API Keys & Models</span>
          </button>
        </div>
      </aside>
    </>
  );
};

