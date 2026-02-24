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

    const itemsRaw = Array.isArray(parsed.items) ? parsed.items : [];
    const items = itemsRaw.map((item: Partial<MediaItem>) => ({
      id: typeof item.id === 'string' ? item.id : crypto.randomUUID(),
      type: item.type === 'video' || item.type === 'audio' ? item.type : 'image',
      title: typeof item.title === 'string' ? item.title : 'Untitled',
      tags: Array.isArray(item.tags) ? item.tags : [],
      notes: typeof item.notes === 'string' ? item.notes : '',
      createdAt: typeof item.createdAt === 'number' ? item.createdAt : Date.now(),
      dataUrl: typeof item.dataUrl === 'string' ? item.dataUrl : undefined,
      thumbDataUrl: typeof item.thumbDataUrl === 'string' ? item.thumbDataUrl : undefined,
      url: typeof item.dataUrl === 'string' ? item.dataUrl : '',
    }));

    return {
      id: typeof parsed.id === 'string' ? parsed.id : crypto.randomUUID(),
      name: typeof parsed.name === 'string' ? parsed.name : 'Untitled Project',
      items,
      createdAt: typeof parsed.createdAt === 'number' ? parsed.createdAt : Date.now(),
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : Date.now(),
    };
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
