import { useCallback, useState, DragEvent } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileUp } from 'lucide-react';

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`
        relative overflow-hidden rounded-3xl p-12 text-center transition-all duration-300 border-2 border-dashed
        ${isDragging
          ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-900/20 scale-[1.02] shadow-xl'
          : 'border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 hover:border-purple-400 dark:hover:border-purple-600'
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
      <label htmlFor="file-input" className="cursor-pointer relative z-10 w-full h-full block">
        <div className="space-y-6">
          <motion.div
            animate={isDragging ? { y: -10 } : {}}
            transition={{ type: "spring", bounce: 0.5 }}
            className="w-20 h-20 mx-auto bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center"
          >
            {isDragging ? (
              <FileUp className="w-10 h-10 text-purple-600 dark:text-purple-400" />
            ) : (
              <Upload className="w-10 h-10 text-slate-500 dark:text-slate-400" />
            )}
          </motion.div>

          <div className="space-y-2">
            <h3 className="text-2xl font-bold font-display text-slate-900 dark:text-slate-100">
              {isDragging ? 'Feed the machine!' : 'Drop media here'}
            </h3>
            <p className="text-lg text-slate-500 dark:text-slate-400">
              or click to browse from the boring file system
            </p>
          </div>

          <div className="inline-block px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs text-slate-500 dark:text-slate-400 font-medium">
            Images (JPG, PNG, WebP) & Videos (MP4, WebM)
          </div>
        </div>
      </label>
    </motion.div>
  );
};
