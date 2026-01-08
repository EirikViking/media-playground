export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  file?: File;
  url: string;
  dataUrl?: string; // Base64 data URL for persistence
  title: string;
  tags: string[];
  notes: string;
  createdAt: number;
}

export interface Project {
  id: string;
  name: string;
  items: MediaItem[];
  createdAt: number;
  updatedAt: number;
}
