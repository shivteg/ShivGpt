'use client';

import React, { useState } from 'react';
import { AuthUser } from '@/lib/types';
import { supabaseSignIn, supabaseSignUp, isSupabaseConfigured, getSupabaseConfig } from '@/lib/supabase';
import { X, LogIn, UserPlus, Eye, EyeOff, CheckCircle, AlertTriangle, ShieldCheck, Mail, Lock, User, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser | null;
  onAuthSuccess: (user: AuthUser) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  user,
  onAuthSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Manual Supabase local override fields
  const [showConfig, setShowConfig] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [customAnonKey, setCustomAnonKey] = useState('');

  if (!isOpen) return null;

  const isConfigured = isSupabaseConfigured();
  const currentConfig = getSupabaseConfig();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'signup') {
        const result = await supabaseSignUp(email.trim(), password.trim(), username.trim());
        if (result.error) {
          setError(result.error);
        } else if (result.requiresEmailVerification) {
          setSuccessMsg('Account created! Please check your email inbox to verify your account, then click Log In.');
        } else if (result.user) {
          setSuccessMsg('Account created successfully!');
          onAuthSuccess(result.user);
          setTimeout(() => onClose(), 1200);
        }
      } else {
        const result = await supabaseSignIn(email.trim(), password.trim());
        if (result.error) {
          setError(result.error);
        } else if (result.user) {
          setSuccessMsg('Welcome back! Successfully logged in.');
          onAuthSuccess(result.user);
          setTimeout(() => onClose(), 1000);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'An unexpected authentication error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCustomConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      if (customUrl.trim()) localStorage.setItem('shivgpt_supabase_url', customUrl.trim());
      if (customAnonKey.trim()) localStorage.setItem('shivgpt_supabase_anon_key', customAnonKey.trim());
    }
    setSuccessMsg('Saved Supabase configuration override!');
    setShowConfig(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#1e1e1e] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-[#252525]">
          <div className="flex items-center gap-2.5 text-neutral-100 font-semibold text-base">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-md">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span>ShivGpt Supabase Auth</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          {/* Supabase Status Banner */}
          <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
            isConfigured 
              ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300' 
              : 'bg-amber-950/30 border-amber-800/40 text-amber-300'
          }`}>
            {isConfigured ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="space-y-1 flex-1">
              <div className="font-semibold text-xs">
                {isConfigured ? '🟢 Connected to Supabase' : '⚠️ Supabase Environment Variables Missing'}
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                {isConfigured 
                  ? 'Your Supabase backend is configured via Vercel / environment variables.' 
                  : 'Add NEXT_PUBLIC_SUPABASE_URL & NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel Project Settings.'}
              </p>
              {!isConfigured && (
                <button
                  onClick={() => setShowConfig(!showConfig)}
                  className="text-amber-400 hover:underline font-semibold text-[11px] pt-1 block"
                >
                  {showConfig ? 'Hide manual configuration' : 'Or enter Supabase URL & Anon Key manually →'}
                </button>
              )}
            </div>
          </div>

          {/* Manual Config Toggle Form */}
          {showConfig && (
            <form onSubmit={handleSaveCustomConfig} className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-3 text-xs">
              <div className="font-semibold text-neutral-200">Supabase Browser Override</div>
              <div>
                <label className="block text-neutral-400 mb-1">Supabase URL</label>
                <input
                  type="text"
                  placeholder="https://xyz.supabase.co"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="w-full px-3 py-1.5 rounded bg-neutral-950 border border-neutral-800 text-white font-mono text-[11px]"
                />
              </div>
              <div>
                <label className="block text-neutral-400 mb-1">Supabase Anon Key</label>
                <input
                  type="password"
                  placeholder="eyJh..."
                  value={customAnonKey}
                  onChange={(e) => setCustomAnonKey(e.target.value)}
                  className="w-full px-3 py-1.5 rounded bg-neutral-950 border border-neutral-800 text-white font-mono text-[11px]"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 rounded bg-orange-600 hover:bg-orange-500 text-white font-semibold"
              >
                Save Local Config
              </button>
            </form>
          )}

          {/* Mode Switcher Tabs */}
          <div className="flex bg-neutral-900 p-1 rounded-xl border border-neutral-800">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); setSuccessMsg(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
                mode === 'login'
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Log In</span>
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(null); setSuccessMsg(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
                mode === 'signup'
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Sign Up</span>
            </button>
          </div>

          {/* Error & Success Messages */}
          {error && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form Inputs */}
          <form onSubmit={handleAuth} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-neutral-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-orange-400" />
                  <span>Username</span>
                </label>
                <input
                  type="text"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs placeholder-neutral-500 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-neutral-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-orange-400" />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                required
                placeholder="name@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs placeholder-neutral-500 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-neutral-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-orange-400" />
                <span>Password</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs placeholder-neutral-500 focus:outline-none focus:border-orange-500 transition-colors pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 rounded-xl font-medium text-xs text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                isLoading
                  ? 'bg-neutral-800 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 shadow-orange-950/40'
              }`}
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-orange-400" />
                  <span>Processing...</span>
                </>
              ) : mode === 'login' ? (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Log In to ShivGpt</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Create Supabase Account</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
