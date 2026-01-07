import { MediaItem } from '../types';

interface MediaGridProps {
  items: MediaItem[];
  onItemClick: (item: MediaItem) => void;
  onItemRemove: (id: string) => void;
}

export const MediaGrid = ({ items, onItemClick, onItemRemove }: MediaGridProps) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400 dark:text-gray-600">
        <div className="text-6xl mb-4">🎭</div>
        <p className="text-lg">No media yet. Add some files to get started!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 cursor-pointer animate-scale-in hover:scale-105 transition-transform duration-200 shadow-md hover:shadow-xl"
          onClick={() => onItemClick(item)}
        >
          {item.type === 'image' ? (
            <img
              src={item.url}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <video
              src={item.url}
              className="w-full h-full object-cover"
              muted
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <p className="text-white text-sm font-medium truncate">{item.title}</p>
              {item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {item.tags.slice(0, 2).map((tag, i) => (
                    <span
                      key={i}
                      className="text-xs bg-white/20 backdrop-blur-sm text-white px-2 py-0.5 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                  {item.tags.length > 2 && (
                    <span className="text-xs text-white/80">
                      +{item.tags.length - 2}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onItemRemove(item.id);
            }}
            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
            aria-label="Remove item"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
};
