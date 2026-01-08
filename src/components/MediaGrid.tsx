import { MediaItem } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Play, Image as ImageIcon } from 'lucide-react';

interface MediaGridProps {
  items: MediaItem[];
  onItemClick: (item: MediaItem) => void;
  onItemRemove: (id: string) => void;
}

export const MediaGrid = ({ items, onItemClick, onItemRemove }: MediaGridProps) => {
  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-20 px-6 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm"
      >
        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <ImageIcon className="w-10 h-10 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-2xl font-bold mb-2 font-display text-slate-900 dark:text-white">It's a bit empty here</h3>
        <p className="text-slate-600 dark:text-slate-400 max-w-sm mx-auto mb-8">
          Upload some photos or videos to start your creative journey. Kurt Edgar is waiting.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      <AnimatePresence mode="popLayout">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-shadow bg-slate-200 dark:bg-slate-800"
            onClick={() => onItemClick(item)}
          >
            {item.type === 'image' ? (
              <img
                src={item.url}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full relative">
                <video
                  src={item.url}
                  className="w-full h-full object-cover"
                  muted
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/40">
                    <Play className="w-6 h-6 text-white fill-current" />
                  </div>
                </div>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
              <p className="text-white font-medium truncate mb-1">{item.title}</p>
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {item.tags.slice(0, 2).map((tag, i) => (
                    <span key={i} className="text-xs bg-white/20 backdrop-blur-md text-white px-2 py-0.5 rounded-full border border-white/10">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onItemRemove(item.id);
              }}
              className="absolute top-3 right-3 p-2 bg-red-500/80 hover:bg-red-600 backdrop-blur-md text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 shadow-lg"
              aria-label="Remove item"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
