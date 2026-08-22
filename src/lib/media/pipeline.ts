/**
 * Unified Media Pipeline
 * 
 * Handles upload validation, processing, and CDN URL generation.
 * Centralizes all file upload logic for the platform.
 */

export interface UploadConfig {
  maxSizeMB: number;
  allowedTypes: string[];
  bucket: string;
  generateThumbnail?: boolean;
}

export const UPLOAD_CONFIGS: Record<string, UploadConfig> = {
  avatar: { maxSizeMB: 5, allowedTypes: ['image/jpeg', 'image/png', 'image/webp'], bucket: 'avatars' },
  media_video: { maxSizeMB: 500, allowedTypes: ['video/mp4', 'video/webm', 'video/quicktime'], bucket: 'media', generateThumbnail: true },
  media_audio: { maxSizeMB: 100, allowedTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'], bucket: 'media' },
  media_image: { maxSizeMB: 20, allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'], bucket: 'media', generateThumbnail: true },
  recording: { maxSizeMB: 200, allowedTypes: ['video/webm', 'video/mp4'], bucket: 'recordings' },
  shop: { maxSizeMB: 10, allowedTypes: ['image/jpeg', 'image/png', 'image/webp'], bucket: 'shop' },
  forum: { maxSizeMB: 10, allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'], bucket: 'forum' },
  social: { maxSizeMB: 50, allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'], bucket: 'social' },
  documents: { maxSizeMB: 25, allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'], bucket: 'vault' },
  vehicles: { maxSizeMB: 10, allowedTypes: ['image/jpeg', 'image/png', 'image/webp'], bucket: 'vehicles' },
};

export interface UploadResult {
  success: boolean;
  publicUrl?: string;
  filePath?: string;
  error?: string;
}

/**
 * Validate a file against upload config
 */
export function validateFile(file: File, configKey: string): { valid: boolean; error?: string } {
  const config = UPLOAD_CONFIGS[configKey];
  if (!config) return { valid: false, error: 'Invalid upload type' };

  // Check size
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > config.maxSizeMB) {
    return { valid: false, error: `File too large. Max ${config.maxSizeMB}MB, got ${sizeMB.toFixed(1)}MB` };
  }

  // Check MIME type
  if (!config.allowedTypes.includes(file.type)) {
    return { valid: false, error: `File type "${file.type}" not allowed. Accepted: ${config.allowedTypes.join(', ')}` };
  }

  return { valid: true };
}

/**
 * Generate a storage path for an upload
 */
export function generateFilePath(userId: string, configKey: string, filename: string): string {
  const ext = filename.split('.').pop() || 'bin';
  const timestamp = Date.now();
  const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, '_').slice(0, 50);
  return `${userId}/${timestamp}-${sanitized}.${ext}`;
}

/**
 * Get optimized image URL with transformations (Supabase Storage transforms)
 */
export function getImageUrl(publicUrl: string, options?: { width?: number; height?: number; quality?: number }): string {
  if (!options || !publicUrl.includes('supabase')) return publicUrl;

  const params = new URLSearchParams();
  if (options.width) params.set('width', options.width.toString());
  if (options.height) params.set('height', options.height.toString());
  if (options.quality) params.set('quality', options.quality.toString());

  // Supabase storage render endpoint
  return publicUrl.replace('/object/public/', '/render/image/public/') + '?' + params.toString();
}

/**
 * Get thumbnail URL for a media file
 */
export function getThumbnailUrl(publicUrl: string): string {
  return getImageUrl(publicUrl, { width: 400, height: 300, quality: 75 });
}

/**
 * Check if a file type is a video
 */
export function isVideo(mimeType: string): boolean {
  return mimeType.startsWith('video/');
}

/**
 * Check if a file type is an image
 */
export function isImage(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
