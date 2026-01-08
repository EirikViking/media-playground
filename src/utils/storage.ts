import { Project, MediaItem } from '../types';

const STORAGE_KEY = 'media-playground-project';

export const saveProject = (project: Project): void => {
  try {
    const projectData = {
      ...project,
      items: project.items.map(item => ({
        id: item.id,
        type: item.type,
        title: item.title,
        tags: item.tags,
        notes: item.notes,
        createdAt: item.createdAt,
        dataUrl: item.dataUrl, // Persist base64 data
      }))
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projectData));
  } catch (error) {
    console.error('Failed to save project:', error);
  }
};

export const loadProject = (): Project | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;

    const parsed = JSON.parse(data);

    // Restore url from dataUrl for each item
    if (parsed.items) {
      parsed.items = parsed.items.map((item: Partial<MediaItem>) => ({
        ...item,
        url: item.dataUrl || '', // Use dataUrl as url if available
      }));
    }

    return parsed;
  } catch (error) {
    console.error('Failed to load project:', error);
    return null;
  }
};

export const clearProject = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear project:', error);
  }
};

// Helper to convert File to base64 data URL
export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
