import { useRef, useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HoverVideoProps {
    src: string;
    className?: string;
}

export const HoverVideo = ({ src, className = '' }: HoverVideoProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isMuted, setIsMuted] = useState(true);
    const [showHint, setShowHint] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    // Persist audio preference per session
    const [soundEnabled, setSoundEnabled] = useState(() => {
        if (typeof window !== 'undefined') {
            return sessionStorage.getItem('kurtVideoSoundEnabled') === 'true';
        }
        return false;
    });

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        // If sound was previously enabled by user, respect it
        if (soundEnabled) {
            video.muted = false;
            setIsMuted(false);
        }
    }, [soundEnabled]);

    const handleMouseEnter = async () => {
        const video = videoRef.current;
        if (!video) return;

        try {
            // Try to play with current mute state (which might be unmuted if soundEnabled is true)
            video.muted = !soundEnabled;
            await video.play();
            setIsPlaying(true);
            setIsMuted(!soundEnabled);

            if (!soundEnabled) {
                // If we are playing muted, show hint
                setShowHint(true);
            }
        } catch (err) {
            // If autoplay failed (likely due to audio), fall back to muted
            console.warn('Autoplay with audio blocked, falling back to muted', err);
            video.muted = true;
            setIsMuted(true);
            setShowHint(true);
            try {
                await video.play();
                setIsPlaying(true);
            } catch (mutedErr) {
                // Completely blocked
                console.error('Autoplay blocked completely', mutedErr);
            }
        }
    };

    const handleMouseLeave = () => {
        const video = videoRef.current;
        if (!video) return;

        video.pause();
        video.currentTime = 0;
        setIsPlaying(false);
        setShowHint(false);
    };

    const handleClick = () => {
        const video = videoRef.current;
        if (!video) return;

        // Enable sound globally for session
        sessionStorage.setItem('kurtVideoSoundEnabled', 'true');
        setSoundEnabled(true);
        video.muted = false;
        setIsMuted(false);
        setShowHint(false);

        if (video.paused) {
            video.play().catch(console.error);
            setIsPlaying(true);
        }
    };

    return (
        <div
            className={`relative rounded-3xl overflow-hidden cursor-pointer shadow-xl bg-black ${className}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
        >
            <video
                ref={videoRef}
                src={src}
                className="w-full h-full object-cover"
                playsInline
                muted={isMuted}
                loop
            />

            {/* Hint Overlay */}
            <AnimatePresence>
                {showHint && isPlaying && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 pointer-events-none"
                    >
                        <VolumeX className="w-4 h-4" />
                        Click to enable sound
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Audio Indicator (when sound enabled) */}
            <AnimatePresence>
                {!isMuted && isPlaying && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-4 right-4 bg-white/20 backdrop-blur-md p-2 rounded-full"
                    >
                        <Volume2 className="w-5 h-5 text-white" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
