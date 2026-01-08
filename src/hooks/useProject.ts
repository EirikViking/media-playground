import { useState, useEffect } from 'react';
import { Project, MediaItem } from '../types';
import { saveProject, loadProject, clearProject } from '../utils/storage';

export const useProject = () => {
  const [project, setProject] = useState<Project>(() => {
    const loaded = loadProject();
    if (loaded) return loaded;

    return {
      id: crypto.randomUUID(),
      name: 'Untitled Project',
      items: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  });

  useEffect(() => {
    saveProject(project);
  }, [project]);

  const addItem = (item: MediaItem) => {
    setProject(prev => ({
      ...prev,
      items: [...prev.items, item],
      updatedAt: Date.now(),
    }));
  };

  const updateItem = (id: string, updates: Partial<MediaItem>) => {
    setProject(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === id ? { ...item, ...updates } : item
      ),
      updatedAt: Date.now(),
    }));
  };

  const removeItem = (id: string) => {
    setProject(prev => {
      const item = prev.items.find(i => i.id === id);
      if (item) {
        URL.revokeObjectURL(item.url);
      }
      return {
        ...prev,
        items: prev.items.filter(item => item.id !== id),
        updatedAt: Date.now(),
      };
    });
  };

  const createNewProject = () => {
    project.items.forEach(item => URL.revokeObjectURL(item.url));
    clearProject();
    setProject({
      id: crypto.randomUUID(),
      name: 'Untitled Project',
      items: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  };

  return {
    project,
    setProject,
    addItem,
    updateItem,
    removeItem,
    createNewProject,
  };
};
