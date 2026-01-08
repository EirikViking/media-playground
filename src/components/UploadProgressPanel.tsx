import { motion, AnimatePresence } from 'framer-motion';
import { Upload, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { UploadProgress } from '../utils/upload';

interface UploadProgressPanelProps {
    isUploading: boolean;
    completed: number;
    total: number;
    current?: UploadProgress;
    errors: Array<{ fileName: string; error: string }>;
    onClose: () => void;
}

export const UploadProgressPanel = ({
    isUploading,
    completed,
    total,
    current,
    errors,
    onClose,
}: UploadProgressPanelProps) => {
    if (!isUploading && completed === 0) return null;

    const getStageLabel = (stage: UploadProgress['stage']): string => {
        switch (stage) {
            case 'preparing': return 'Preparing...';
            case 'uploading-original': return 'Uploading original...';
            case 'generating-thumb': return 'Generating thumbnail...';
            case 'uploading-thumb': return 'Uploading thumbnail...';
            case 'committing': return 'Saving metadata...';
            case 'done': return 'Complete!';
            case 'error': return 'Error';
            default: return 'Processing...';
        }
    };

    const overallProgress = total > 0 ? Math.round((completed / total) * 100) : 0;
    const isDone = !isUploading && completed === total;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="fixed bottom-4 right-4 z-50 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 w-80"
            >
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        {isUploading ? (
                            <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
                        ) : isDone ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                            <Upload className="w-5 h-5 text-purple-500" />
                        )}
                        <span className="font-medium">
                            {isUploading ? 'Uploading...' : isDone ? (errors.length > 0 ? 'Completed with errors' : 'Upload Complete') : 'Upload'}
                        </span>
                    </div>
                    {!isUploading && (
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Overall Progress */}
                <div className="mb-3">
                    <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mb-1">
                        <span>{completed} of {total} files</span>
                        <span>{overallProgress}%</span>
                    </div>
                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-purple-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${overallProgress}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>
                </div>

                {/* Current File */}
                {current && isUploading && (
                    <div className="text-sm mb-3 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="font-medium truncate">{current.fileName}</div>
                        <div className="text-slate-500 flex items-center gap-2">
                            {current.stage === 'error' ? (
                                <XCircle className="w-3 h-3 text-red-500" />
                            ) : current.stage === 'done' ? (
                                <CheckCircle className="w-3 h-3 text-green-500" />
                            ) : (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            )}
                            {getStageLabel(current.stage)}
                        </div>
                    </div>
                )}

                {/* Errors */}
                {errors.length > 0 && (
                    <div className="mt-3 space-y-1">
                        <div className="text-sm font-medium text-red-500 flex items-center gap-1">
                            <XCircle className="w-4 h-4" />
                            {errors.length} failed
                        </div>
                        <div className="max-h-24 overflow-y-auto space-y-1">
                            {errors.map((err, i) => (
                                <div key={i} className="text-xs text-red-400 truncate">
                                    {err.fileName}: {err.error}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
};
