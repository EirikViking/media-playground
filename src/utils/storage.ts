import { Project } from '../types';

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
    return JSON.parse(data);
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
