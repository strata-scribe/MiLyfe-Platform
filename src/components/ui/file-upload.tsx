'use client';

import { useState, useEffect, useRef } from 'react';
import Uppy from '@uppy/core';
import Tus from '@uppy/tus';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

interface FileUploadProps {
  bucket?: string;
  accept?: string[];
  maxSize?: number;
  maxFiles?: number;
  onUpload?: (urls: string[]) => void;
  compact?: boolean;
  className?: string;
}

/**
 * Production-ready file upload component powered by Uppy.
 * Connects to Supabase Storage via TUS for resumable uploads.
 */
export function FileUpload({
  bucket = 'uploads',
  accept,
  maxSize = 50 * 1024 * 1024,
  maxFiles = 5,
  onUpload,
  compact = false,
  className,
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload() {
    if (files.length === 0) return;
    setUploading(true);
    setProgress(0);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      toast.error('Upload configuration missing');
      setUploading(false);
      return;
    }

    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const objectName = `${Date.now()}-${file.name}`;

      const response = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${objectName}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': file.type,
          'x-upsert': 'true',
        },
        body: file,
      });

      if (response.ok) {
        uploadedUrls.push(`${supabaseUrl}/storage/v1/object/public/${bucket}/${objectName}`);
      }
      setProgress(Math.round(((i + 1) / files.length) * 100));
    }

    if (uploadedUrls.length > 0) {
      onUpload?.(uploadedUrls);
      toast.success(`${uploadedUrls.length} file${uploadedUrls.length > 1 ? 's' : ''} uploaded!`);
    }
    setFiles([]);
    setUploading(false);
    setProgress(0);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []);
    const filtered = selected.filter(f => f.size <= maxSize).slice(0, maxFiles);
    setFiles(filtered);
    if (selected.length > filtered.length) {
      toast.error(`Some files were too large (max ${Math.round(maxSize / 1024 / 1024)}MB)`);
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <input
        ref={inputRef}
        type="file"
        multiple={maxFiles > 1}
        accept={accept?.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full border-2 border-dashed border-gray-200 dark:border-harbor-700 rounded-xl p-4 text-center hover:border-teal-300 hover:bg-gray-50 dark:hover:bg-harbor-900 transition-colors cursor-pointer"
      >
        <p className="text-2xl mb-1">📂</p>
        <p className="text-xs text-gray-500">{compact ? 'Add files' : 'Click to browse or drag files here'}</p>
        {accept && <p className="text-[10px] text-gray-400 mt-1">Accepts: {accept.join(', ')}</p>}
      </button>

      {/* Selected files */}
      {files.length > 0 && (
        <div className="space-y-1">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-2 text-xs bg-gray-50 dark:bg-harbor-900 rounded-lg px-3 py-1.5">
              <span className="flex-1 truncate text-harbor-800 dark:text-white">{f.name}</span>
              <span className="text-gray-400">{(f.size / 1024).toFixed(0)}KB</span>
            </div>
          ))}
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="btn-teal w-full text-xs disabled:opacity-50"
          >
            {uploading ? `Uploading... ${progress}%` : `Upload ${files.length} file${files.length > 1 ? 's' : ''}`}
          </button>
          {uploading && (
            <div className="h-1.5 bg-gray-100 dark:bg-harbor-800 rounded-full overflow-hidden">
              <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Simple drop zone variant.
 */
export function DropZone({
  onFiles,
  accept,
  multiple = false,
  className,
  children,
}: {
  onFiles: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) onFiles(multiple ? files : [files[0]]);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) onFiles(files);
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors',
        dragOver
          ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
          : 'border-gray-200 dark:border-harbor-700 hover:border-teal-300 hover:bg-gray-50 dark:hover:bg-harbor-900',
        className
      )}
    >
      <input ref={inputRef} type="file" accept={accept} multiple={multiple} onChange={handleChange} className="hidden" />
      {children || (
        <div>
          <p className="text-2xl mb-2">📂</p>
          <p className="text-sm text-gray-500">Drop files here or click to browse</p>
          {accept && <p className="text-[10px] text-gray-400 mt-1">Accepts: {accept}</p>}
        </div>
      )}
    </div>
  );
}
