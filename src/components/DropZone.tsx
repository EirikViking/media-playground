import { useCallback, useState, DragEvent } from 'react';

interface DropZoneProps {
  onFilesAdded: (files: File[]) => void;
}

export const DropZone = ({ onFilesAdded }: DropZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOut = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const mediaFiles = files.filter(file =>
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );

    if (mediaFiles.length > 0) {
      onFilesAdded(mediaFiles);
    }
  }, [onFilesAdded]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFilesAdded(Array.from(files));
    }
  };

  return (
    <div
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`
        relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200
        ${isDragging
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-105'
          : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
        }
      `}
    >
      <input
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={handleFileInput}
        className="hidden"
        id="file-input"
      />
      <label htmlFor="file-input" className="cursor-pointer">
        <div className="space-y-4">
          <div className="text-6xl">📁</div>
          <div className="space-y-2">
            <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
              Drop your media here
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              or click to browse files
            </p>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Supports images (JPG, PNG, WebP) and videos (MP4, WebM)
          </p>
        </div>
      </label>
    </div>
  );
};
