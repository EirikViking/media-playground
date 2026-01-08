import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Copy, Check, X } from 'lucide-react';
import { Button } from './Button';

interface ShareButtonProps {
    projectId: string | null;
    projectTitle: string;
}

export const ShareButton = ({ projectId, projectTitle }: ShareButtonProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    if (!projectId) {
        return (
            <Button variant="ghost" size="sm" disabled title="Save project first to share">
                <Share2 className="w-4 h-4 mr-2" />
                Share
            </Button>
        );
    }

    const shareUrl = `${window.location.origin}/studio?project=${projectId}`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => {
                setCopied(false);
                setIsOpen(false);
            }, 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <>
            <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2"
            >
                <Share2 className="w-4 h-4" />
                Share
            </Button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                        />

                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold flex items-center gap-2">
                                        <Share2 className="w-5 h-5 text-purple-500" />
                                        Share Project
                                    </h2>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                    Share <strong>"{projectTitle}"</strong> with friends. Anyone with this link can view the project and its images.
                                </p>

                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        readOnly
                                        value={shareUrl}
                                        className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                    />
                                    <Button onClick={handleCopy} size="sm">
                                        {copied ? (
                                            <>
                                                <Check className="w-4 h-4 mr-1" />
                                                Copied!
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-4 h-4 mr-1" />
                                                Copy
                                            </>
                                        )}
                                    </Button>
                                </div>

                                <p className="text-xs text-slate-500 mt-4">
                                    💡 Tip: Only uploaded images will be visible to others. Local images need to be uploaded first.
                                </p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};
