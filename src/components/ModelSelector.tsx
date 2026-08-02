'use client';

import React, { useState, useRef, useEffect } from 'react';
import { SUPPORTED_MODELS } from '@/lib/groq';
import { GroqModelInfo } from '@/lib/types';
import { ChevronDown, Zap, Sparkles, Check } from 'lucide-react';

interface ModelSelectorProps {
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onSelectModel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentModel = SUPPORTED_MODELS.find((m) => m.id === selectedModel) || SUPPORTED_MODELS[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-700/80 border border-neutral-700 text-neutral-200 text-sm font-medium transition-all"
      >
        <Zap className="w-4 h-4 text-orange-500 fill-orange-500" />
        <span>{currentModel.name}</span>
        {currentModel.badge && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 font-bold border border-orange-500/30">
            {currentModel.badge}
          </span>
        )}
        <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-72 md:w-80 bg-[#1e1e1e] border border-neutral-700 rounded-xl shadow-2xl z-50 p-1.5 backdrop-blur-xl">
          <div className="px-3 py-2 border-b border-neutral-800 text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center justify-between">
            <span>Select SAI (Shiv AI) Model</span>
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
          </div>

          <div className="py-1 space-y-1 max-h-80 overflow-y-auto">
            {SUPPORTED_MODELS.map((model: GroqModelInfo) => {
              const isSelected = model.id === selectedModel;
              return (
                <button
                  key={model.id}
                  onClick={() => {
                    onSelectModel(model.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-lg transition-colors flex items-start justify-between gap-2 ${
                    isSelected
                      ? 'bg-orange-500/15 border border-orange-500/30 text-white'
                      : 'hover:bg-neutral-800/80 text-neutral-300'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{model.name}</span>
                      {model.badge && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-400 font-bold">
                          {model.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-400 leading-snug">{model.description}</p>
                    <div className="flex items-center gap-3 text-[10px] text-neutral-500 pt-0.5">
                      <span>Speed: {model.speed}</span>
                      <span>Context: {Math.round(model.contextWindow / 1024)}k</span>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-orange-400 mt-1 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
