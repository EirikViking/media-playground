import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCw, MessageSquare, Bot } from 'lucide-react';
import { Button } from './Button';
import { generateTileContent } from '../utils/generators';

interface AiHelperModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode?: 'ai-helper' | 'search-challenge';
}

export const AiHelperModal = ({ isOpen, onClose, mode = 'ai-helper' }: AiHelperModalProps) => {
    const [seed, setSeed] = useState(Date.now());
    const [content, setContent] = useState(generateTileContent(mode, seed));

    useEffect(() => {
        if (isOpen) {
            handleGenerate();
        }
    }, [isOpen, mode]);

    const handleGenerate = () => {
        const newSeed = Date.now() + Math.random();
        setSeed(newSeed);
        setContent(generateTileContent(mode, newSeed));
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4"
                    >
                        <div
                            className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 pointer-events-auto relative overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="mb-6">
                                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-4">
                                    <Bot className="w-6 h-6" />
                                </div>
                                <h2 className="text-2xl font-bold font-display text-slate-900 dark:text-white mb-2">
                                    {content.title}
                                </h2>
                                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                    {content.body}
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <a
                                        href="https://chatgpt.com"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold transition-transform hover:scale-105"
                                    >
                                        <MessageSquare className="w-4 h-4" /> ChatGPT
                                    </a>
                                    <a
                                        href="https://gemini.google.com"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-transform hover:scale-105"
                                    >
                                        <Bot className="w-4 h-4" /> Gemini
                                    </a>
                                </div>

                                <Button
                                    variant="ghost"
                                    className="w-full text-slate-500 hover:text-purple-600"
                                    onClick={handleGenerate}
                                >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    {content.actionLabel}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
