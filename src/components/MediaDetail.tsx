import { useState } from 'react';
import { MediaItem } from '../types';
import { Button } from './Button';

interface MediaDetailProps {
  item: MediaItem;
  onClose: () => void;
  onUpdate: (updates: Partial<MediaItem>) => void;
}

export const MediaDetail = ({ item, onClose, onUpdate }: MediaDetailProps) => {
  const [title, setTitle] = useState(item.title);
  const [notes, setNotes] = useState(item.notes);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState(item.tags);

  const handleSave = () => {
    onUpdate({ title, notes, tags });
    onClose();
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
          <div className="flex-1 bg-gray-900 flex items-center justify-center p-8">
            {item.type === 'image' ? (
              <img
                src={item.url}
                alt={item.title}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            ) : (
              <video
                src={item.url}
                controls
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            )}
          </div>

          <div className="w-full md:w-96 p-6 flex flex-col overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold">Details</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6 flex-1">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tags</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagInputKeyDown}
                    placeholder="Add a tag"
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                  />
                  <Button onClick={addTag} variant="secondary">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm flex items-center gap-2"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="hover:text-blue-600 dark:hover:text-blue-400"
                        aria-label={`Remove ${tag}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow resize-none"
                  placeholder="Add notes about this media..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button onClick={handleSave} className="flex-1">
                Save Changes
              </Button>
              <Button onClick={onClose} variant="secondary" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
