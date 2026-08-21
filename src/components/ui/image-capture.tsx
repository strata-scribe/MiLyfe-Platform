'use client';

import { useState, useRef } from 'react';
import { cn } from '@/lib/utils/cn';

interface ImageCaptureProps {
  onImageSelected: (file: File) => void;
  currentPreview?: string | null;
  onClear?: () => void;
}

export function ImageCapture({ onImageSelected, currentPreview, onClear }: ImageCaptureProps) {
  const [preview, setPreview] = useState<string | null>(currentPreview ?? null);
  const [mode, setMode] = useState<'idle' | 'preview'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | null) => {
    if (!file) return;

    // Validate
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be under 10MB.');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
      setMode('preview');
    };
    reader.readAsDataURL(file);

    onImageSelected(file);
  };

  const handleClear = () => {
    setPreview(null);
    setMode('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    onClear?.();
  };

  if (mode === 'preview' && preview) {
    return (
      <div className="relative rounded-xl overflow-hidden border-2 border-teal-200 dark:border-teal-800">
        <img
          src={preview}
          alt="Captured preview"
          className="w-full h-48 object-cover"
        />
        <button
          onClick={handleClear}
          className="absolute top-2 right-2 w-8 h-8 bg-black/60 text-white rounded-full flex items-center justify-center text-sm hover:bg-black/80 transition-colors"
          aria-label="Remove photo"
        >
          ✕
        </button>
        <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg">
          📷 Photo attached
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Add a photo (optional)
      </label>
      <div className="flex gap-2">
        {/* Camera capture (mobile) */}
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className={cn(
            'flex-1 flex flex-col items-center gap-1 p-4 rounded-xl border-2 border-dashed transition-colors',
            'border-gray-300 dark:border-harbor-600 hover:border-teal-400 hover:bg-teal-50/50 dark:hover:bg-teal-900/10'
          )}
        >
          <span className="text-2xl">📸</span>
          <span className="text-xs text-gray-500">Take Photo</span>
        </button>

        {/* File picker */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'flex-1 flex flex-col items-center gap-1 p-4 rounded-xl border-2 border-dashed transition-colors',
            'border-gray-300 dark:border-harbor-600 hover:border-teal-400 hover:bg-teal-50/50 dark:hover:bg-teal-900/10'
          )}
        >
          <span className="text-2xl">🖼️</span>
          <span className="text-xs text-gray-500">Choose File</span>
        </button>
      </div>

      {/* Hidden inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        className="hidden"
        aria-hidden="true"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        className="hidden"
        aria-hidden="true"
      />
    </div>
  );
}
