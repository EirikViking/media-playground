import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, Music } from 'lucide-react';
import { MediaItem } from '../types';

interface ChaosMixPlayerProps {
    items: MediaItem[];
    isOpen: boolean;
    onClose: () => void;
}

export const ChaosMixPlayer = ({ items, isOpen, onClose }: ChaosMixPlayerProps) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [shuffledItems, setShuffledItems] = useState<MediaItem[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);

    // Audio ref
    const audioRef = useRef<HTMLAudioElement>(null);
    const [audioTracks, setAudioTracks] = useState<MediaItem[]>([]);
    const [currentAudioIndex, setCurrentAudioIndex] = useState(0);

    useEffect(() => {
        if (isOpen && items.length > 0) {
            // Filter visual items
            const visuals = items.filter(i => i.type === 'image' || i.type === 'video');
            // Filter audio items
            const audios = items.filter(i => i.type === 'audio');

            // Validate URLs
            const validVisuals = visuals.filter(i => i.url);

            // Shuffle
            const shuffled = [...validVisuals].sort(() => Math.random() - 0.5);
            setShuffledItems(shuffled);
            setAudioTracks(audios);
            setCurrentIndex(0);
            setCurrentAudioIndex(0);
            setIsPlaying(true);
        } else {
            setIsPlaying(false);
        }
    }, [isOpen, items]);

    useEffect(() => {
        if (!isPlaying || shuffledItems.length === 0) return;

        // Fast clean transitions
        const timer = setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % shuffledItems.length);
        }, 3000);

        return () => clearTimeout(timer);
    }, [isPlaying, currentIndex, shuffledItems]);

    // Audio loop
    useEffect(() => {
        if (isPlaying && audioTracks.length > 0 && audioRef.current) {
            const playAudio = async () => {
                try {
                    if (audioRef.current) {
                        const track = audioTracks[currentAudioIndex];
                        if (audioRef.current.src !== track.url) {
                            audioRef.current.src = track.url;
                            await audioRef.current.play();
                        } else if (audioRef.current.paused) {
                            await audioRef.current.play();
                        }
                    }
                } catch (e) { console.error("Audio play failed", e); }
            };
            playAudio();
        } else if (!isPlaying && audioRef.current) {
            audioRef.current.pause();
        }
    }, [isPlaying, currentAudioIndex, audioTracks]);

    const handleAudioEnded = () => {
        setCurrentAudioIndex(prev => (prev + 1) % audioTracks.length);
    };

    if (!isOpen) return null;

    if (shuffledItems.length === 0) {
        return (
            <div className="fixed inset-0 z-50 bg-black text-white flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl mb-4">No content for Chaos!</h2>
                    <button onClick={onClose} className="bg-white text-black px-4 py-2 rounded-full">Close</button>
                </div>
            </div>
        );
    }

    const currentItem = shuffledItems[currentIndex];

    return (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden">
            {/* Background blur */}
            <div className="absolute inset-0 opacity-30 blur-3xl scale-125 pointer-events-none">
                {currentItem.type === 'image' && <img src={currentItem.url} className="w-full h-full object-cover" alt="" />}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={`${currentItem.id}-${currentIndex}`}
                    initial={{ opacity: 0, scale: 0.8, rotate: Math.random() * 10 - 5 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 1.2, rotate: Math.random() * 10 - 5 }}
                    transition={{ duration: 0.4 }}
                    className="relative z-10 w-full h-full flex items-center justify-center p-8"
                >
                    {currentItem.type === 'video' ? (
                        <video
                            src={currentItem.url}
                            autoPlay
                            muted
                            loop
                            className="max-h-[80vh] max-w-[90vw] rounded-xl shadow-2xl border-4 border-white/20 object-contain"
                        />
                    ) : (
                        <img
                            src={currentItem.url}
                            className="max-h-[80vh] max-w-[90vw] rounded-xl shadow-2xl border-4 border-white/20 object-contain"
                            alt={currentItem.title}
                        />
                    )}
                    <div className="absolute bottom-12 left-0 right-0 text-center">
                        <span className="bg-black/50 text-white px-4 py-2 rounded-full text-base backdrop-blur-md">
                            {currentItem.title}
                        </span>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Controls */}
            <div className="absolute top-6 right-6 z-20 flex gap-4">
                <button onClick={() => setIsPlaying(!isPlaying)} className="p-4 bg-white/10 hover:bg-white/20 backdrop-blur rounded-full text-white transition">
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </button>
                <button onClick={onClose} className="p-4 bg-white/10 hover:bg-white/20 backdrop-blur rounded-full text-white transition">
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Audio Hidden Player */}
            <audio
                ref={audioRef}
                onEnded={handleAudioEnded}
                className="hidden"
            />

            {audioTracks.length > 0 && isPlaying && (
                <div className="absolute bottom-6 right-6 text-white/50 text-sm flex items-center gap-2 animate-pulse">
                    <Music className="w-4 h-4" />
                    {audioTracks[currentAudioIndex].title}
                </div>
            )}
        </div>
    );
};
