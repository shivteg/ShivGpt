'use client';

import React, { useState } from 'react';
import { TrainedImageContext } from '@/lib/types';
import {
  X,
  Upload,
  Brain,
  Sparkles,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  Info,
  Link as LinkIcon,
} from 'lucide-react';

interface TrainImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainedImages: TrainedImageContext[];
  onAddTrainedImage: (image: TrainedImageContext) => void;
  onRemoveTrainedImage: (id: string) => void;
}

export const TrainImageModal: React.FC<TrainImageModalProps> = ({
  isOpen,
  onClose,
  trainedImages,
  onAddTrainedImage,
  onRemoveTrainedImage,
}) => {
  const [title, setTitle] = useState('');
  const [context, setContext] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSuccessMsg, setIsSuccessMsg] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreviewUrl(result);
        setImageUrl(result);
        if (!title) {
          setTitle(file.name.replace(/\.[^/.]+$/, ''));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlChange = (url: string) => {
    setImageUrl(url);
    setPreviewUrl(url);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim() || !context.trim()) return;

    const newTrainedImage: TrainedImageContext = {
      id: Date.now().toString(),
      title: title.trim() || 'Untitled Trained Picture',
      context: context.trim(),
      imageUrl: imageUrl.trim(),
      createdAt: Date.now(),
    };

    onAddTrainedImage(newTrainedImage);
    setTitle('');
    setContext('');
    setImageUrl('');
    setPreviewUrl(null);
    setIsSuccessMsg(true);
    setTimeout(() => setIsSuccessMsg(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#1e1e1e] border border-neutral-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between bg-gradient-to-r from-orange-950/30 via-neutral-900 to-purple-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 via-amber-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-orange-950/50">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
                Train AI with Picture Context
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-bold border border-orange-500/40">
                  Vision Memory
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Upload a picture & define context so SAI (Shiv AI) understands its meaning in your chat.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Scroll Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Notification Banner */}
          {isSuccessMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2 animate-in slide-in-from-top duration-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Picture & context successfully saved into AI memory for this chat session!</span>
            </div>
          )}

          {/* Form to Train New Picture Context */}
          <form onSubmit={handleSubmit} className="space-y-4 bg-neutral-900/60 p-4 rounded-xl border border-neutral-800">
            <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              <span>Add New Trained Picture Context</span>
            </h3>

            {/* Input Selection Tabs */}
            <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  activeTab === 'upload'
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Image File</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('url')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  activeTab === 'url'
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>Paste Image URL</span>
              </button>
            </div>

            {/* Upload Area / URL Input */}
            {activeTab === 'upload' ? (
              <div>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-neutral-700 hover:border-orange-500/80 rounded-xl cursor-pointer bg-neutral-950/50 hover:bg-neutral-900/80 transition-all group">
                  <div className="flex flex-col items-center justify-center pt-3 pb-3">
                    <Upload className="w-7 h-7 text-neutral-400 group-hover:text-orange-400 mb-1 transition-colors" />
                    <p className="text-xs text-neutral-300 font-medium">Click to upload picture or drag and drop</p>
                    <p className="text-[10px] text-neutral-500 mt-0.5">PNG, JPG, WebP, GIF (Max 10MB)</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Image URL</label>
                <input
                  type="url"
                  placeholder="https://example.com/my-picture.jpg"
                  value={imageUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  className="w-full bg-neutral-950 text-neutral-200 text-xs px-3 py-2 rounded-lg border border-neutral-800 focus:border-orange-500 focus:outline-none"
                />
              </div>
            )}

            {/* Image Preview */}
            {previewUrl && (
              <div className="relative max-w-xs rounded-xl overflow-hidden border border-neutral-700 bg-neutral-950">
                <img
                  src={previewUrl}
                  alt="Trained Picture Preview"
                  className="w-full h-36 object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPreviewUrl(null);
                    setImageUrl('');
                  }}
                  className="absolute top-2 right-2 p-1 rounded-full bg-black/70 text-white hover:bg-red-600 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Picture Title & Label */}
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Picture Title / Label <span className="text-neutral-500">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Pet Dog Buster / Company Logo / UI Mockup Layout"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-neutral-950 text-neutral-200 text-xs px-3 py-2 rounded-lg border border-neutral-800 focus:border-orange-500 focus:outline-none"
              />
            </div>

            {/* Context & Training Instructions */}
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Context & Training Instructions for AI <span className="text-orange-400">*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="Explain what this picture shows so the AI understands it. E.g., 'This is a photo of my pet dog Buster. He is a Golden Retriever. Whenever I ask about Buster or my pet, reference this picture and his details.'"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="w-full bg-neutral-950 text-neutral-200 text-xs px-3 py-2 rounded-lg border border-neutral-800 focus:border-orange-500 focus:outline-none resize-none leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={!imageUrl.trim() || !context.trim()}
              className={`w-full py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all ${
                imageUrl.trim() && context.trim()
                  ? 'bg-gradient-to-r from-orange-600 via-amber-600 to-purple-600 text-white shadow-lg shadow-orange-950/50 hover:opacity-95'
                  : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
              }`}
            >
              <Brain className="w-4 h-4" />
              <span>Train AI with this Picture</span>
            </button>
          </form>

          {/* Currently Trained Images in Session Memory */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                Active Trained Picture Memory ({trainedImages.length})
              </span>
            </h3>

            {trainedImages.length === 0 ? (
              <div className="p-4 rounded-xl border border-neutral-800/80 bg-neutral-900/40 text-center text-xs text-neutral-500 flex flex-col items-center gap-1.5">
                <Info className="w-4 h-4 text-neutral-600" />
                <span>No trained picture memory added to this session yet. Upload a picture above to train SAI!</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {trainedImages.map((img) => (
                  <div
                    key={img.id}
                    className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex items-start gap-3 relative group hover:border-neutral-700 transition-colors"
                  >
                    <img
                      src={img.imageUrl}
                      alt={img.title}
                      className="w-14 h-14 object-cover rounded-lg border border-neutral-700 flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="font-semibold text-xs text-neutral-200 truncate">{img.title}</div>
                      <div className="text-[11px] text-neutral-400 line-clamp-2 leading-tight">
                        {img.context}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveTrainedImage(img.id)}
                      className="p-1 rounded text-neutral-500 hover:text-red-400 hover:bg-neutral-800 transition-colors"
                      title="Delete trained picture memory"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
