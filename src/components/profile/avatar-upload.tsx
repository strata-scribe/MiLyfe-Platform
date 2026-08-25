'use client';

import { useState, useCallback, useTransition } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadAvatar } from '@/lib/actions/profile';

interface AvatarUploadProps {
  currentUrl: string | null;
  onUploaded: (url: string) => void;
}

export function AvatarUpload({ currentUrl, onUploaded }: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate client-side
    if (file.size > 2 * 1024 * 1024) {
      setError('File too large (max 2MB)');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Use JPG, PNG, or WebP');
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Upload
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.append('avatar', file);
      const result = await uploadAvatar(formData);
      if (result.error) {
        setError(result.error);
        setPreview(currentUrl); // Revert
      } else if (result.url) {
        onUploaded(result.url);
      }
    });
  }, [currentUrl, onUploaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
    maxSize: 2 * 1024 * 1024,
  });

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        {...getRootProps()}
        className={`relative h-24 w-24 cursor-pointer overflow-hidden rounded-full border-2 border-dashed transition-colors ${
          isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/30 hover:border-primary'
        }`}
      >
        <input {...getInputProps()} />
        {preview ? (
          <img src={preview} alt="Avatar" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted text-2xl">
            📷
          </div>
        )}
        {isPending && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {isDragActive ? 'Drop image here' : 'Click or drag to upload'}
      </p>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
