import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, VolumeX, Play, Pause } from 'lucide-react';
import { CloudAsset } from '../types';
import { getAssetUrl } from '../utils/upload';

interface MashPlayerProps {
    projectId: string;
    assets: CloudAsset[]; // Assuming we pass full assets
    onClose: () => void;
}

export const MashPlayer = ({ projectId, assets, onClose }: MashPlayerProps) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [playing, setPlaying] = useState(true);
    const [muted, setMuted] = useState(false);

    // Filter assets
    const audioAssets = assets.filter(a => a.fileName.endsWith('.mp3') || a.fileName.endsWith('.wav'));
    const visualAssets = assets.filter(a => !audioAssets.includes(a)); // Images and Videos

    const backgroundMusic = audioAssets[0]; // Take first audio found

    useEffect(() => {
        if (!playing) return;

        // Timer for slide transition
        const timer = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % visualAssets.length);
        }, 4000); // 4 seconds per slide

        return () => clearInterval(timer);
    }, [playing, visualAssets.length]);

    useEffect(() => {
        if (playing && audioRef.current) {
            audioRef.current.play().catch(() => { });
        } else if (!playing && audioRef.current) {
            audioRef.current.pause();
        }
    }, [playing]);

    const currentVisual = visualAssets[currentIndex];

    // Fallback if no visuals
    if (visualAssets.length === 0) {
        return (
            <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
                <button onClick={onClose} className="absolute top-4 right-4 text-white p-2 bg-black/50 rounded-full">
                    <X />
                </button>
                <div className="text-white text-center">
                    <p className="text-2xl font-display mb-4">Audio Only Mode</p>
                    {backgroundMusic && (
                        <div className="animate-pulse">
                            Playing: {backgroundMusic.fileName}
                        </div>
                    )}
                    {backgroundMusic && (
                        <audio
                            ref={audioRef}
                            src={getAssetUrl(projectId, backgroundMusic.assetId, 'original')}
                            autoPlay
                            loop
                            controls
                            className="mt-8"
                        />
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] bg-black text-white overflow-hidden flex items-center justify-center">
            {/* Background Music */}
            {backgroundMusic && (
                <audio
                    ref={audioRef}
                    src={getAssetUrl(projectId, backgroundMusic.assetId, 'original')}
                    autoPlay={playing}
                    loop
                    muted={muted}
                />
            )}

            {/* Visual Display */}
            <div className="relative w-full h-full">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentVisual ? currentVisual.assetId : 'empty'}
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.5 }}
                        className="absolute inset-0 flex items-center justify-center bg-black"
                    >
                        {currentVisual && (
                            currentVisual.fileName.match(/\.(mp4|webm|mov)$/i) ? (
                                <video
                                    src={getAssetUrl(projectId, currentVisual.assetId, 'original')}
                                    autoPlay
                                    muted
                                    loop
                                    className="w-full h-full object-contain"
                                />
                            ) : (
                                <motion.img
                                    src={getAssetUrl(projectId, currentVisual.assetId, 'original')}
                                    alt={currentVisual.fileName}
                                    className="w-full h-full object-cover opacity-80"
                                    animate={{ scale: [1, 1.05] }}
                                    transition={{ duration: 4, ease: "linear" }}
                                />
                            )
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Text Overlay / Title? */}
                <div className="absolute bottom-12 left-0 right-0 text-center pointer-events-none">
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        key={currentIndex}
                        className="inline-block px-4 py-2 bg-black/40 backdrop-blur-md rounded-full text-sm font-medium"
                    >
                        {currentIndex + 1} / {visualAssets.length}
                    </motion.div>
                </div>
            </div>

            {/* Controls Overlay */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start bg-gradient-to-b from-black/60 to-transparent">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-md">
                        <X className="w-6 h-6" />
                    </button>
                    <h2 className="font-bold text-lg drop-shadow-md hidden sm:block">Mash Mode</h2>
                </div>

                <div className="flex items-center gap-4">
                    <button onClick={() => setPlaying(!playing)} className="p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md">
                        {playing ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                    </button>
                    {backgroundMusic && (
                        <button onClick={() => setMuted(!muted)} className="p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md">
                            {muted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
