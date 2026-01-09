import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Pause, SkipBack, SkipForward, Shuffle, Volume2, Music, VolumeX } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';

const TRACKS = [
    {
        title: "Eirik's Logic Flow",
        url: "https://media-playground-api.cromkake.workers.dev/api/assets/original/1fc3d85b-9a12-4a51-9d9f-211432738e0d/073fb463-164a-410b-bf52-29c19088d8c5"
    },
    {
        title: "Critical Component",
        url: "https://media-playground-api.cromkake.workers.dev/api/assets/original/1fc3d85b-9a12-4a51-9d9f-211432738e0d/20adb989-3d55-43d0-a166-1768fd1f7fbd"
    },
    {
        title: "Async Await Beat",
        url: "https://media-playground-api.cromkake.workers.dev/api/assets/original/1fc3d85b-9a12-4a51-9d9f-211432738e0d/218e6e5c-bf36-4a7e-8790-d16736beb3cc"
    },
    {
        title: "Undefined Behavior",
        url: "https://media-playground-api.cromkake.workers.dev/api/assets/original/1fc3d85b-9a12-4a51-9d9f-211432738e0d/3df8601f-f384-460f-bee1-12d4b2a8e06e"
    }
];

export const AwesomeMusic = () => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.8);
    const [isShuffle, setIsShuffle] = useState(false);
    const [isMuted, setIsMuted] = useState(false);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = isMuted ? 0 : volume;
        }
    }, [volume, isMuted]);

    useEffect(() => {
        if (audioRef.current && isPlaying) {
            audioRef.current.play().catch(e => console.error("Play error:", e));
        }
    }, [currentTrackIndex]);

    const handlePlayPause = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play().catch(e => console.error("Play error:", e));
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setProgress(audioRef.current.currentTime);
            setDuration(audioRef.current.duration || 0);
        }
    };

    const handleNext = () => {
        if (isShuffle) {
            const nextIndex = Math.floor(Math.random() * TRACKS.length);
            setCurrentTrackIndex(nextIndex);
        } else {
            setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
        }
        setIsPlaying(true);
    };

    const handlePrev = () => {
        setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
        setIsPlaying(true);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = Number(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setProgress(time);
        }
    };

    const handleTrackEnd = () => {
        handleNext();
    };

    const formatTime = (time: number) => {
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
            <header className="p-6 flex justify-between items-center max-w-6xl mx-auto w-full">
                <Link
                    to="/"
                    className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Hub
                </Link>
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold font-display hidden md:block text-slate-900 dark:text-white">
                        Awesome Music
                    </h1>
                    <ThemeToggle />
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center p-6 pb-24">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md"
                >
                    {/* Visualizer / Artwork */}
                    <div className="relative aspect-square rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 mb-8 overflow-hidden flex items-center justify-center shadow-lg">
                        <div className={`absolute inset-0 bg-black/20 ${isPlaying ? 'animate-pulse' : ''}`} />
                        <Music className={`w-32 h-32 text-white/50 drop-shadow-xl ${isPlaying ? 'animate-bounce' : ''}`} />

                        {/* Fake "visualizer" bars */}
                        {isPlaying && (
                            <div className="absolute bottom-0 left-0 right-0 h-12 flex items-end justify-center gap-1 pb-4">
                                {[...Array(10)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className="w-2 bg-white/40 rounded-t"
                                        animate={{ height: [10, Math.random() * 40 + 10, 10] }}
                                        transition={{ duration: 0.5, repeat: Infinity, repeatType: "mirror", delay: i * 0.1 }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 font-display" data-testid="track-title">
                            {TRACKS[currentTrackIndex].title}
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                            Generic Artist &bull; Amazing Album
                        </p>
                    </div>

                    {/* Progress */}
                    <div className="space-y-2 mb-8">
                        <input
                            type="range"
                            min={0}
                            max={duration}
                            value={progress}
                            onChange={handleSeek}
                            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                            data-testid="progress-bar"
                        />
                        <div className="flex justify-between text-xs text-slate-400 font-mono">
                            <span>{formatTime(progress)}</span>
                            <span>{formatTime(duration)}</span>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-between mb-8">
                        <button
                            onClick={() => setIsShuffle(!isShuffle)}
                            className={`p-2 rounded-full transition-colors ${isShuffle ? 'text-purple-600 bg-purple-100 dark:bg-purple-900/20' : 'text-slate-400 hover:text-slate-600'}`}
                            data-testid="shuffle-btn"
                        >
                            <Shuffle className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-6">
                            <button onClick={handlePrev} className="text-slate-700 dark:text-slate-300 hover:text-purple-600 transition-colors" data-testid="prev-btn">
                                <SkipBack className="w-8 h-8" />
                            </button>
                            <button
                                onClick={handlePlayPause}
                                className="w-16 h-16 bg-purple-600 hover:bg-purple-700 rounded-full flex items-center justify-center text-white shadow-xl shadow-purple-500/30 transition-transform active:scale-95"
                                data-testid="play-pause-btn"
                            >
                                {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                            </button>
                            <button onClick={handleNext} className="text-slate-700 dark:text-slate-300 hover:text-purple-600 transition-colors" data-testid="next-btn">
                                <SkipForward className="w-8 h-8" />
                            </button>
                        </div>

                        <div className="w-9" /> {/* Spacer balance */}
                    </div>

                    {/* Volume */}
                    <div className="flex items-center gap-3 px-4 py-2 bg-slate-100 dark:bg-slate-800/50 rounded-xl">
                        <button onClick={() => setIsMuted(!isMuted)}>
                            {isMuted ? <VolumeX className="w-5 h-5 text-slate-400" /> : <Volume2 className="w-5 h-5 text-slate-400" />}
                        </button>
                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.01}
                            value={isMuted ? 0 : volume}
                            onChange={(e) => {
                                setVolume(Number(e.target.value));
                                setIsMuted(false);
                            }}
                            className="flex-1 h-1 bg-slate-200 dark:bg-slate-700 rounded appearance-none cursor-pointer accent-slate-500"
                        />
                    </div>
                </motion.div>

                {/* Playlist Drawer / List */}
                <div className="mt-8 w-full max-w-md space-y-2">
                    <h3 className="text-sm font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-4 px-2">Playlist</h3>
                    {TRACKS.map((track, i) => (
                        <button
                            key={i}
                            onClick={() => {
                                setCurrentTrackIndex(i);
                                setIsPlaying(true);
                            }}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${i === currentTrackIndex
                                ? 'bg-purple-50 dark:bg-purple-900/20 shadow-sm ring-1 ring-purple-100 dark:ring-purple-900/50'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                                }`}
                        >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${i === currentTrackIndex ? 'bg-purple-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                                }`}>
                                {i === currentTrackIndex && isPlaying ? (
                                    <div className="flex gap-0.5 items-end h-3">
                                        <motion.div className="w-0.5 bg-white" animate={{ height: [4, 12, 4] }} transition={{ duration: 0.4, repeat: Infinity }} />
                                        <motion.div className="w-0.5 bg-white" animate={{ height: [8, 4, 12] }} transition={{ duration: 0.5, repeat: Infinity }} />
                                        <motion.div className="w-0.5 bg-white" animate={{ height: [12, 8, 4] }} transition={{ duration: 0.6, repeat: Infinity }} />
                                    </div>
                                ) : (
                                    <span className="text-xs font-bold">{i + 1}</span>
                                )}
                            </div>
                            <div className="text-left flex-1 min-w-0">
                                <div className={`font-medium truncate ${i === currentTrackIndex ? 'text-purple-900 dark:text-purple-300' : ''}`}>
                                    {track.title}
                                </div>
                            </div>
                            {i === currentTrackIndex && <div className="text-xs font-bold text-purple-600">PLAYING</div>}
                        </button>
                    ))}
                </div>
            </main>

            <audio
                ref={audioRef}
                src={TRACKS[currentTrackIndex].url}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleTrackEnd}
            />
        </div>
    );
};
