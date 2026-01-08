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
import { ArrowLeft, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { fileToDataUrl } from '../utils/storage';

export const Studio = () => {
  const { project, addItem, updateItem, removeItem, createNewProject } = useProject();
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);

  const handleFilesAdded = async (files: File[]) => {
    for (const file of files) {
      try {
        const isImage = file.type.startsWith('image/');

        // Only convert images to base64 (videos are too large)
        // Videos will use blob URLs and won't persist across refreshes
        let dataUrl: string | undefined;
        let url: string;

        if (isImage) {
          dataUrl = await fileToDataUrl(file);
          url = dataUrl;
        } else {
          // Use blob URL for videos (not persisted)
          url = URL.createObjectURL(file);
        }

        const item: MediaItem = {
          id: crypto.randomUUID(),
          type: isImage ? 'image' : 'video',
          file,
          url,
          dataUrl, // Only set for images
          title: file.name,
          tags: [],
          notes: '',
          createdAt: Date.now(),
        };
        addItem(item);
      } catch (error) {
        console.error('Failed to process file:', file.name, error);
      }
    }
  };

  const handleItemUpdate = (updates: Partial<MediaItem>) => {
    if (selectedItem) {
      updateItem(selectedItem.id, updates);
      setSelectedItem({ ...selectedItem, ...updates });
    }
  };

  const handleNewProject = () => {
    if (project.items.length > 0) {
      if (window.confirm('Start fresh? This will clear your current masterpiece.')) {
        createNewProject();
      }
    } else {
      createNewProject();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back to Gallery</span>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:block text-sm text-slate-500 font-medium px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
                {project.items.length} item{project.items.length !== 1 ? 's' : ''} in staging
              </span>
              <Button onClick={handleNewProject} variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                <Trash2 className="w-4 h-4 mr-2" />
                Clear
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold font-display text-slate-900 dark:text-white">
            The Studio
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Where the magic (and errors) happen.
          </p>
        </div>

        <section>
          <DropZone onFilesAdded={handleFilesAdded} />
        </section>

        {project.items.length > 0 && (
          <>
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-2 h-8 bg-purple-600 rounded-full inline-block"></span>
                  Your Assets
                </h2>
              </div>
              <MediaGrid
                items={project.items}
                onItemClick={setSelectedItem}
                onItemRemove={removeItem}
              />
            </section>

            <motion.section
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="pt-8"
            >
              <CollageCreator items={project.items} />
            </motion.section>
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
