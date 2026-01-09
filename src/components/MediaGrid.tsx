import { MediaItem } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Image as ImageIcon, Cloud, Clock, AlertCircle, Loader2 } from 'lucide-react';

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

  const getStatusIcon = (item: MediaItem) => {
    if (item.cloudAsset) {
      return <Cloud className="w-3 h-3 text-green-400" />;
    }
    switch (item.uploadStatus) {
      case 'uploading':
        return <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-3 h-3 text-red-400" />;
      case 'pending':
      default:
        return <Clock className="w-3 h-3 text-orange-400" />;
    }
  };

  const getStatusLabel = (item: MediaItem) => {
    if (item.cloudAsset) return 'Safe in Cloud';
    switch (item.uploadStatus) {
      case 'uploading': return 'Uploading...';
      case 'error': return item.uploadError || 'Error';
      case 'pending':
      default: return 'Local only';
    }
  };

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
            data-testid="asset-card"
          >
            {item.type === 'video' ? (
              <video
                data-testid="video-asset"
                src={item.url}
                poster={item.thumbUrl || undefined}
                className="w-full h-full object-cover"
                muted
                loop
                playsInline
                onMouseEnter={(e) => {
                  // Autoplay on hover (desktop only)
                  if (window.matchMedia('(hover: hover)').matches) {
                    e.currentTarget.play().catch(() => {
                      // Ignore autoplay errors
                    });
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.pause();
                  e.currentTarget.currentTime = 0;
                }}
              />
            ) : item.type === 'audio' ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-pink-500 to-purple-600 text-white p-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm mb-3 animate-pulse">
                  <span className="text-2xl">🎵</span>
                </div>
                <p className="text-xs font-medium text-center opacity-90 line-clamp-2">{item.title}</p>
                <audio src={item.url} controls className="w-full mt-2 h-6" />
              </div>
            ) : item.type === 'image' ? (
              <img
                data-testid="asset-thumb"
                src={item.thumbUrl || item.url}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white">
                <span className="text-4xl">❓</span>
              </div>
            )}

            {/* Upload Status Indicator */}
            <div className="absolute top-3 left-3 z-10">
              <div
                data-testid={item.cloudAsset ? 'upload-success' : item.uploadStatus === 'error' ? 'upload-error' : item.uploadStatus === 'uploading' ? 'upload-progress' : 'upload-pending'}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs backdrop-blur-md shadow-sm ${item.cloudAsset
                  ? 'bg-green-500/80 text-white border border-green-400'
                  : item.uploadStatus === 'error'
                    ? 'bg-red-500/80 text-white border border-red-400'
                    : item.uploadStatus === 'uploading'
                      ? 'bg-blue-500/80 text-white border border-blue-400'
                      : 'bg-orange-500/80 text-white border border-orange-400'
                  }`}
                title={getStatusLabel(item)}
              >
                {getStatusIcon(item)}
                {item.cloudAsset && <span className="hidden group-hover:inline ml-1 font-medium">Synced</span>}
              </div>
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 pointer-events-none">
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
              className="absolute top-3 right-3 p-2 bg-red-500/80 hover:bg-red-600 backdrop-blur-md text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 shadow-lg z-20"
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
