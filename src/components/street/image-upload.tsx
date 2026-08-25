'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { createClient } from '@/lib/supabase/client';

interface ImageUploadProps {
  images: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
}

/**
 * Image upload for marketplace listings.
 * Uploads to Supabase Storage (public/listings bucket), returns URLs.
 */
export function ImageUpload({ images, onChange, maxImages = 5 }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (images.length + acceptedFiles.length > maxImages) {
      setError(`Maximum ${maxImages} images`);
      return;
    }

    setUploading(true);
    setError(null);
    const supabase = createClient();
    const newUrls: string[] = [];

    for (const file of acceptedFiles) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Each image must be under 5MB');
        continue;
      }

      const ext = file.name.split('.').pop() || 'jpg';
      const path = `listings/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('public')
        .upload(path, file, { contentType: file.type });

      if (uploadError) {
        setError(uploadError.message);
        continue;
      }

      const { data: urlData } = supabase.storage.from('public').getPublicUrl(path);
      newUrls.push(urlData.publicUrl);
    }

    if (newUrls.length > 0) {
      onChange([...images, ...newUrls]);
    }
    setUploading(false);
  }, [images, onChange, maxImages]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: maxImages - images.length,
    disabled: uploading || images.length >= maxImages,
  });

  function removeImage(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      {/* Preview grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((url, i) => (
            <div key={i} className="relative aspect-square rounded-md overflow-hidden border">
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center hover:bg-black/80"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      {images.length < maxImages && (
        <div
          {...getRootProps()}
          className={`rounded-md border-2 border-dashed p-4 text-center text-sm cursor-pointer transition-colors ${
            isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/30 hover:border-primary'
          } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <p className="text-muted-foreground">Uploading...</p>
          ) : isDragActive ? (
            <p className="text-primary">Drop images here</p>
          ) : (
            <p className="text-muted-foreground">
              📷 Drag photos here or click to browse ({images.length}/{maxImages})
            </p>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
