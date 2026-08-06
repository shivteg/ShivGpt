'use client';

import React, { useState } from 'react';
import { AuthUser } from '@/lib/types';
import { supabaseSignIn, supabaseSignUp, supabaseResendConfirmation, isSupabaseConfigured, getSupabaseConfig } from '@/lib/supabase';
import { X, LogIn, UserPlus, Eye, EyeOff, CheckCircle, AlertTriangle, ShieldCheck, Mail, Lock, User, Sparkles, Send } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  user: AuthUser | null;
  onAuthSuccess: (user: AuthUser) => void;
  isCompulsory?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  user,
  onAuthSuccess,
  isCompulsory = false,
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Email Verification & Resend State
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

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
    setResendStatus(null);

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
          setUnverifiedEmail(email.trim());
        } else if (result.user) {
          setSuccessMsg('Account created successfully! Redirecting...');
          onAuthSuccess(result.user);
          if (onClose && !isCompulsory) setTimeout(() => onClose(), 1000);
        }
      } else {
        const result = await supabaseSignIn(email.trim(), password.trim());
        if (result.error) {
          setError(result.error);
          if (result.error.toLowerCase().includes('not confirmed') || result.error.toLowerCase().includes('unconfirmed')) {
            setUnverifiedEmail(email.trim());
          }
        } else if (result.user) {
          setSuccessMsg('Welcome back! Successfully logged in.');
          onAuthSuccess(result.user);
          if (onClose && !isCompulsory) setTimeout(() => onClose(), 1000);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'An unexpected authentication error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    const targetEmail = unverifiedEmail || email.trim();
    if (!targetEmail) return;

    setIsResending(true);
    setResendStatus(null);

    const res = await supabaseResendConfirmation(targetEmail);
    setIsResending(false);

    if (res.error) {
      setResendStatus(`Error: ${res.error}`);
    } else {
      setResendStatus(`Confirmation email resent to ${targetEmail}! Please check your inbox and spam folder.`);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#1e1e1e] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-[#252525]">
          <div className="flex items-center gap-2.5 text-neutral-100 font-semibold text-base">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-md">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span>{isCompulsory ? 'Authentication Required' : 'ShivGpt Supabase Auth'}</span>
          </div>
          {!isCompulsory && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
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

          {unverifiedEmail ? (
            /* Email Verification Notice Card */
            <div className="p-5 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-neutral-200 space-y-4 text-xs animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3 text-amber-400 font-semibold text-sm">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/40">
                  <Mail className="w-4 h-4 text-amber-400" />
                </div>
                <span>Confirmation Link Sent!</span>
              </div>
              <p className="leading-relaxed text-neutral-300 text-xs">
                We sent a confirmation email to <strong className="text-white underline">{unverifiedEmail}</strong>. Please check your email inbox (and Spam/Junk folder) and click the link to verify your account.
              </p>

              {resendStatus && (
                <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  resendStatus.startsWith('Error') 
                    ? 'bg-red-950/40 border-red-800/60 text-red-300' 
                    : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                }`}>
                  {resendStatus.startsWith('Error') ? <AlertTriangle className="w-4 h-4 flex-shrink-0" /> : <CheckCircle className="w-4 h-4 flex-shrink-0" />}
                  <span>{resendStatus}</span>
                </div>
              )}

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleResendEmail}
                  disabled={isResending}
                  className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 font-medium text-xs text-white shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {isResending ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin text-amber-200" />
                      <span>Resending Link...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Resend Confirmation Link</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => { setUnverifiedEmail(null); setMode('login'); setResendStatus(null); setError(null); }}
                  className="w-full py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white font-medium text-xs transition-colors"
                >
                  Back to Log In
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Mode Switcher Tabs */}
              <div className="flex bg-neutral-900 p-1 rounded-xl border border-neutral-800">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(null); setSuccessMsg(null); setUnverifiedEmail(null); }}
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
                  onClick={() => { setMode('signup'); setError(null); setSuccessMsg(null); setUnverifiedEmail(null); }}
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
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                  {(error.toLowerCase().includes('not confirmed') || error.toLowerCase().includes('unconfirmed')) && (
                    <button
                      type="button"
                      onClick={handleResendEmail}
                      disabled={isResending}
                      className="text-amber-400 hover:underline font-semibold text-[11px] self-start flex items-center gap-1 mt-1"
                    >
                      <Mail className="w-3 h-3" />
                      <span>Click here to resend email confirmation link</span>
                    </button>
                  )}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};
