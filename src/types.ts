// Asset stored in R2
export interface CloudAsset {
  assetId: string;
  originalKey: string;
  thumbKey: string;
  contentType: string;
  byteSize: number;
  width: number;
  height: number;
  fileName: string;
  createdAt: string;
}

// Local media item (pre-upload or local-only)
export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  file?: File;
  url: string;
  thumbUrl?: string;
  dataUrl?: string; // Base64 data URL for local persistence
  thumbDataUrl?: string; // Thumbnail base64
  title: string;
  tags: string[];
  notes: string;
  createdAt: number;
  // Cloud sync status
  cloudAsset?: CloudAsset;
  uploadStatus?: 'pending' | 'uploading' | 'uploaded' | 'error';
  uploadError?: string;
}

export interface Project {
  id: string;
  name: string;
  items: MediaItem[];
  createdAt: number;
  updatedAt: number;
}

// Project data stored in D1
export interface ProjectJsonData {
  version: number;
  assets?: CloudAsset[];
  layout?: Record<string, unknown>;
}

// Upload limits
export const UPLOAD_LIMITS = {
  maxFileSize: 10 * 1024 * 1024, // 10 MB
  maxAssetsPerProject: 30,
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  thumbWidth: 320,
  thumbQuality: 0.8,
};
