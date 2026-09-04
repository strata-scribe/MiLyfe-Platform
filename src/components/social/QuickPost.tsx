'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ImagePlus, Send, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface QuickPostProps {
  onSubmit?: (data: { caption: string; image: File | null }) => Promise<void>;
  className?: string;
  maxLength?: number;
}

export function QuickPost({ onSubmit, className, maxLength = 100 }: QuickPostProps) {
  const [caption, setCaption] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const charsRemaining = maxLength - caption.length;
  const isOverLimit = charsRemaining < 0;
  const isDisabled = isSubmitting || caption.trim().length === 0 || isOverLimit;

  // Cleanup object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleImageChange = (file: File | null) => {
    if (file && file.type.startsWith('image/')) {
      setImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const clearImage = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setImage(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleImageChange(e.dataTransfer.files[0]);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDisabled) return;

    setIsSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit({ caption: caption.trim(), image });
      } else {
        // Optimistic default mock
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
      // Clear form on success
      setCaption('');
      clearImage();
    } catch (error) {
      console.error('Failed to post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      <form onSubmit={handleSubmit}>
        <CardContent className="p-4 space-y-4">
          {previewUrl ? (
            <div className="relative w-full h-48 rounded-xl overflow-hidden bg-gray-100 dark:bg-harbor-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Upload preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={clearImage}
                className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                aria-label="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              className={cn(
                'w-full h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-colors cursor-pointer',
                isDragging
                  ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/20'
                  : 'border-gray-200 dark:border-harbor-700 bg-gray-50 dark:bg-harbor-900/50 hover:bg-gray-100 dark:hover:bg-harbor-800/50'
              )}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              aria-label="Drop image here or click to upload"
            >
              <ImagePlus className="w-8 h-8 text-gray-400 dark:text-gray-500 mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                Drop an image or click to upload
              </p>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleImageChange(e.target.files[0]);
                  }
                }}
                aria-label="Image upload input"
              />
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="What's going on?"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className={cn(
                  'pr-16',
                  isOverLimit && 'border-red-500 focus-visible:ring-red-500 dark:border-red-500/50 dark:focus-visible:ring-red-500/50'
                )}
                aria-label="Post caption"
                disabled={isSubmitting}
              />
              <div
                className={cn(
                  'absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium',
                  isOverLimit ? 'text-red-500 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'
                )}
                aria-live="polite"
              >
                {charsRemaining}
              </div>
            </div>
            <Button
              type="submit"
              disabled={isDisabled}
              className="shrink-0 w-10 h-10 p-0 rounded-xl"
              aria-label="Post"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}
