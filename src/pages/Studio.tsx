import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MediaItem } from '../types';
import { useProject } from '../hooks/useProject';
import { ThemeToggle } from '../components/ThemeToggle';
import { Button } from '../components/Button';
import { DropZone } from '../components/DropZone';
import { MediaGrid } from '../components/MediaGrid';
import { MediaDetail } from '../components/MediaDetail';
import { CollageCreator } from '../components/CollageCreator';

export const Studio = () => {
  const { project, addItem, updateItem, removeItem, createNewProject } = useProject();
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);

  const handleFilesAdded = (files: File[]) => {
    files.forEach((file) => {
      const item: MediaItem = {
        id: crypto.randomUUID(),
        type: file.type.startsWith('image/') ? 'image' : 'video',
        file,
        url: URL.createObjectURL(file),
        title: file.name,
        tags: [],
        notes: '',
        createdAt: Date.now(),
      };
      addItem(item);
    });
  };

  const handleItemUpdate = (updates: Partial<MediaItem>) => {
    if (selectedItem) {
      updateItem(selectedItem.id, updates);
      setSelectedItem({ ...selectedItem, ...updates });
    }
  };

  const handleNewProject = () => {
    if (project.items.length > 0) {
      if (window.confirm('Create a new project? Current project will be cleared.')) {
        createNewProject();
      }
    } else {
      createNewProject();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
                Media Playground
              </Link>
              <div className="hidden sm:block text-sm text-gray-500 dark:text-gray-400">
                {project.items.length} item{project.items.length !== 1 ? 's' : ''}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={handleNewProject} variant="secondary" size="sm">
                New Project
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <div className="animate-fade-in">
          <DropZone onFilesAdded={handleFilesAdded} />
        </div>

        {project.items.length > 0 && (
          <>
            <div className="animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Your Media</h2>
              </div>
              <MediaGrid
                items={project.items}
                onItemClick={setSelectedItem}
                onItemRemove={removeItem}
              />
            </div>

            <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <CollageCreator items={project.items} />
            </div>
          </>
        )}
      </main>

      {selectedItem && (
        <MediaDetail
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onUpdate={handleItemUpdate}
        />
      )}
    </div>
  );
};
