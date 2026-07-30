'use client';

import React, { useState } from 'react';
import { Settings } from '@/lib/types';
import { X, Key, Sliders, MessageSquareCode, Save, Info, ExternalLink } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSaveSettings: (newSettings: Settings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [formData, setFormData] = useState<Settings>({ ...settings });

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-[#1e1e1e] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-[#252525]">
          <div className="flex items-center gap-2 text-neutral-100 font-semibold text-lg">
            <Sliders className="w-5 h-5 text-orange-500" />
            <span>AI Assistant Settings</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* Vercel Deployment Note */}
          <div className="p-4 rounded-xl bg-orange-950/20 border border-orange-900/40 text-orange-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-semibold text-orange-400 text-sm">
              <Info className="w-4 h-4" />
              <span>Vercel Environment Variable Notice</span>
            </div>
            <p>
              When deployed on Vercel, simply set <code className="bg-black/40 px-1 py-0.5 rounded text-orange-300 font-mono">GROQ_API_KEY</code> in your Vercel Project Settings. You don't need to type it below unless you want a local browser override.
            </p>
            <a
              href="https://console.groq.com/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-orange-400 hover:underline font-medium pt-1"
            >
              Get free Groq API Key <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* API Key Override */}
          <div className="space-y-2">
            <label className="block font-medium text-neutral-300 flex items-center gap-2">
              <Key className="w-4 h-4 text-orange-400" />
              <span>Groq API Key (Optional Local Override)</span>
            </label>
            <input
              type="password"
              placeholder="gsk_..."
              value={formData.customApiKey || ''}
              onChange={(e) => setFormData({ ...formData, customApiKey: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-100 focus:outline-none focus:border-orange-500 transition-colors font-mono text-xs"
            />
            <p className="text-[11px] text-neutral-500">
              Stored safely in your local browser storage for client-side API requests.
            </p>
          </div>

          {/* System Prompt */}
          <div className="space-y-2">
            <label className="block font-medium text-neutral-300 flex items-center gap-2">
              <MessageSquareCode className="w-4 h-4 text-orange-400" />
              <span>Default System Prompt</span>
            </label>
            <textarea
              rows={3}
              value={formData.systemPrompt}
              onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-100 focus:outline-none focus:border-orange-500 transition-colors leading-relaxed"
            />
          </div>

          {/* Temperature Slider */}
          <div className="space-y-2">
            <div className="flex justify-between font-medium text-neutral-300">
              <span>Creativity / Temperature</span>
              <span className="text-orange-400 font-mono">{formData.temperature}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={formData.temperature}
              onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
              className="w-full accent-orange-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-neutral-500">
              <span>Precise / Coding (0.0)</span>
              <span>Balanced (0.7)</span>
              <span>Creative / Writing (1.0)</span>
            </div>
          </div>

          {/* Max Tokens Slider */}
          <div className="space-y-2">
            <div className="flex justify-between font-medium text-neutral-300">
              <span>Max Response Length (Tokens)</span>
              <span className="text-orange-400 font-mono">{formData.maxTokens}</span>
            </div>
            <input
              type="range"
              min="512"
              max="8192"
              step="512"
              value={formData.maxTokens}
              onChange={(e) => setFormData({ ...formData, maxTokens: parseInt(e.target.value) })}
              className="w-full accent-orange-500 cursor-pointer"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-medium shadow-lg shadow-orange-950/50 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Save Preferences</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
