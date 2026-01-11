import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Search, Music, Sparkles, Zap, List } from 'lucide-react';
import { api } from '../utils/api';

// --- Constants & Data ---

const TRACK_IDS = [
    { projectId: "1fc3d85b-9a12-4a51-9d9f-211432738e0d", assetId: "073fb463-164a-410b-bf52-29c19088d8c5" },
    { projectId: "1fc3d85b-9a12-4a51-9d9f-211432738e0d", assetId: "20adb989-3d55-43d0-a166-1768fd1f7fbd" },
    { projectId: "1fc3d85b-9a12-4a51-9d9f-211432738e0d", assetId: "218e6e5c-bf36-4a7e-8790-d16736beb3cc" },
    { projectId: "1fc3d85b-9a12-4a51-9d9f-211432738e0d", assetId: "3df8601f-f384-460f-bee1-12d4b2a8e06e" }
];

const RAW_TRACKS = TRACK_IDS.map((track) => ({
    url: api.getAssetUrl(track.projectId, track.assetId, 'original')
}));

const TITLE_TEMPLATES = [
    "The {A} of {B}", "{A} {C}", "{B} and the {A}", "Electric {C}", "{A} in {B}",
    "Return of {B}", "{A} Strikes Back", "{B} Vibes", "The {C} Protocol", "{A} {B} {C}",
    "Heavy {A}", "Soft {B}", "{C} Anthem", "Ballad of {B}", "{A} 2000",
    "Super {C}", "Mega {A}", "{B} Meltdown", "{A} Fusion", "The {B} Experience"
];

const WORDS_A = ["Kurt Edgar", "Eirik", "Satan", "Jævel", "Kuk i bir"];
const WORDS_B = ["Stokmarknes", "Isbjørn", "Puddel", "Rock", "Metal"];
const WORDS_C = ["Dreams", "Nightmare", "Symphony", "Riff", "Solo", "Mash"];

const LORE_TEMPLATES = [
    "Kurt Edgar explicitly forbade this track.",
    "Recorded in a basement in {B}.",
    "Inspired by a true story about {A}.",
    "This is what {A} sounds like at 3AM.",
    "Contains hidden messages about {B}.",
    "Approved by Eirik, rejected by society.",
    "Play this at your own risk.",
    "The anthem of {B}.",
    "Dedicated to the fine art of {A}.",
    "Rumored to summon a {C}.",
    "Eirik claims he wrote this in his sleep.",
    "Kurt Edgar danced to this once. Tragically.",
    "Best served with a cold Isbjørn.",
    "The definition of {C}.",
    "A sonic tribute to {A}.",
    "Historically inaccurate soundscape."
];

// --- Helpers ---

const pseudoRandom = (seed: string) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) - hash) + seed.charCodeAt(i);
        hash = hash & hash;
    }
    return Math.abs(hash);
};

const pick = (arr: string[], seed: number) => arr[seed % arr.length];

const generateTrackData = (url: string, index: number) => {
    const seed = pseudoRandom(url + index + "v2");

    // Title Generation
    const template = pick(TITLE_TEMPLATES, seed);
    const wordA = pick(WORDS_A, seed + 1);
    const wordB = pick(WORDS_B, seed + 2);
    const wordC = pick(WORDS_C, seed + 3);

    let title = template
        .replace("{A}", wordA)
        .replace("{B}", wordB)
        .replace("{C}", wordC);

    // Add suffix/emoji
    const suffix = seed % 5 === 0 ? " (Live)" : seed % 7 === 0 ? " (Demo)" : "";
    const emoji = ["🎸", "🥁", "🎹", "🎤", "🤘", "🔥", "🍺"][seed % 7];

    // Lore Generation
    const loreTemplate = pick(LORE_TEMPLATES, seed + 4);
    const lore = loreTemplate
        .replace("{A}", wordA)
        .replace("{B}", wordB)
        .replace("{C}", wordC);

    return {
        id: `track-${index}`,
        url,
        title: `${title}${suffix}`,
        emoji,
        lore,
        unhingedScore: seed % 100
    };
};

// --- Components ---

export const AwesomeMusic = () => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    // Removed unused volume/mute state for now
    const [isShuffle, setIsShuffle] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [kurtMode, setKurtMode] = useState(() => {
        if (typeof window === 'undefined') return false;
        try {
            return window.localStorage.getItem('kurtMode') === 'true';
        } catch {
            return false;
        }
    });
    const [toast, setToast] = useState<string | null>(null);
    const [sortMode, setSortMode] = useState<'default' | 'unhinged'>('default');

    const tracks = useMemo(() => RAW_TRACKS.map((t, i) => generateTrackData(t.url, i)), []);

    const displayedTracks = useMemo(() => {
        let filtered = tracks.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));
        if (sortMode === 'unhinged') {
            filtered = [...filtered].sort((a, b) => b.unhingedScore - a.unhingedScore);
        }
        return filtered;
    }, [tracks, searchQuery, sortMode]);

    const currentTrack = tracks[currentTrackIndex];
    const isE2E = (typeof window !== 'undefined' && (window as any).__E2E__ === true);

    useEffect(() => {
        if (isPlaying && audioRef.current) {
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => console.error("Auto-play prevented:", error));
            }
        }
    }, [currentTrackIndex]); // Only trigger when track changes

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement) return;
            switch (e.code) {
                case 'Space': e.preventDefault(); handlePlayPause(); break;
                case 'KeyN': handleNext(); break;
                case 'KeyP': handlePrev(); break;
                case 'KeyS': toggleShuffle(); break;
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [isPlaying, isShuffle]);

    const showToast = (msg: string) => {
        if (isE2E) return;
        setToast(msg);
        setTimeout(() => setToast(null), 2000);
    };

    const handlePlayPause = () => {
        if (!audioRef.current) return;
        if (isPlaying) audioRef.current.pause();
        else audioRef.current.play();
        setIsPlaying(!isPlaying);
    };

    const handleNext = () => {
        if (isShuffle) {
            const next = Math.floor(Math.random() * tracks.length);
            setCurrentTrackIndex(next);
        } else {
            setCurrentTrackIndex(prev => (prev + 1) % tracks.length);
        }
        setIsPlaying(true);
        showToast("Next Track ⏭️");
    };

    const handlePrev = () => {
        setCurrentTrackIndex(prev => (prev - 1 + tracks.length) % tracks.length);
        setIsPlaying(true);
        showToast("Previous Track ⏮️");
    };

    const toggleShuffle = () => {
        setIsShuffle(!isShuffle);
        showToast(!isShuffle ? "Shuffle On 🔀" : "Shuffle Off ➡️");
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = Number(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setProgress(time);
        }
    };

    const toggleKurtMode = () => {
        const newVal = !kurtMode;
        setKurtMode(newVal);
        try {
            window.localStorage.setItem('kurtMode', String(newVal));
        } catch {
            // ignore storage errors
        }
        showToast(newVal ? "Kurt Mode Activated 🎸" : "Sanity Restored 🧠");
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 relative overflow-hidden" data-testid="music-page">
            {/* Ambient Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
                {isPlaying && !isE2E && (
                    <motion.div
                        animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 bg-gradient-to-t from-purple-900/10 to-transparent"
                    />
                )}
            </div>

            <div className="max-w-6xl mx-auto px-6 py-8 relative z-10">

                {/* Hero Section */}
                <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
                    <div className="flex-1 space-y-4 text-center md:text-left">
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                            <h1 className="text-4xl md:text-6xl font-display font-bold text-slate-900 dark:text-white leading-tight">
                                Awesome Music <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                                    by Eirik
                                </span>
                            </h1>
                            <p className="text-lg text-slate-600 dark:text-slate-400 mt-4 max-w-lg">
                                {kurtMode ?
                                    "Kurt Edgar has unfortunately approved this playlist, claiming it speaks to his 'inner chaos'." :
                                    "Hand-picked tracks that Kurt Edgar pretends to hate but secretly vibes to."}
                            </p>
                        </motion.div>

                        <div className="flex items-center justify-center md:justify-start gap-4 mt-6">
                            <button
                                onClick={() => { setIsPlaying(true); audioRef.current?.play(); }}
                                className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-xl"
                                data-testid="hero-play-btn"
                            >
                                <Play className="fill-current w-5 h-5" /> Start Listening
                            </button>
                            <button
                                onClick={toggleKurtMode}
                                className={`px-4 py-3 rounded-full font-medium border flex items-center gap-2 transition-colors ${kurtMode ? 'bg-orange-100 border-orange-300 text-orange-700' : 'bg-white/50 border-slate-200 text-slate-600 hover:bg-white'}`}
                                data-testid="kurt-mode-toggle"
                            >
                                {kurtMode ? <Zap className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                                {kurtMode ? "Kurt Mode ON" : "Kurt Mode"}
                            </button>
                        </div>
                    </div>

                    {/* Playing Visualization / Card */}
                    <div className="relative w-full max-w-xs aspect-square bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl shadow-2xl flex items-center justify-center overflow-hidden border-4 border-white/10">
                        {isPlaying ? (
                            <motion.div
                                animate={{ scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                            >
                                <div className="text-9xl filter drop-shadow-lg">{currentTrack.emoji}</div>
                            </motion.div>
                        ) : (
                            <Music className="w-32 h-32 text-white/50" />
                        )}

                        <div className="absolute bottom-4 left-4 right-4 bg-black/40 backdrop-blur-md p-3 rounded-xl border border-white/10">
                            <div className="text-white font-bold truncate">{currentTrack.title}</div>
                            <div className="text-white/60 text-xs">Now Playing</div>
                        </div>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 sticky top-20 z-20 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="relative w-full md:w-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search tracks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            data-testid="search-input"
                        />
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setSortMode('default')}
                            className={`p-2 rounded-lg ${sortMode === 'default' ? 'bg-purple-100 text-purple-700' : 'text-slate-500 hover:bg-slate-100'}`}
                            title="Default Order"
                        >
                            <List className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setSortMode('unhinged')}
                            className={`p-2 rounded-lg ${sortMode === 'unhinged' ? 'bg-orange-100 text-orange-700' : 'text-slate-500 hover:bg-slate-100'}`}
                            title="Sorted by Unhinged Score"
                        >
                            <Zap className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Track List */}
                <div className="grid grid-cols-1 gap-4" data-testid="playlist-list">
                    <AnimatePresence>
                        {displayedTracks.map((track) => (
                            <motion.div
                                key={track.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className={`
                                    group flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer
                                    ${currentTrack.url === track.url ?
                                        'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 ring-1 ring-purple-300 dark:ring-purple-700' :
                                        'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md'
                                    }
                                `}
                                onClick={() => {
                                    const idx = tracks.findIndex(t => t.id === track.id);
                                    if (idx !== -1) {
                                        setCurrentTrackIndex(idx);
                                        setIsPlaying(true);
                                    }
                                }}
                                data-testid="playlist-item"
                            >
                                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl shadow-inner">
                                    {track.emoji}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3 className={`font-bold truncate ${currentTrack.url === track.url ? 'text-purple-700 dark:text-purple-300' : 'text-slate-900 dark:text-white'}`}>
                                        {track.title}
                                    </h3>
                                    <p className="text-sm text-slate-500 italic truncate">
                                        "{track.lore}"
                                    </p>
                                </div>

                                {kurtMode && (
                                    <div className="text-xs font-mono text-orange-500 hidden md:block border border-orange-200 px-2 py-1 rounded">
                                        Unhinged: {track.unhingedScore}%
                                    </div>
                                )}

                                <button className={`
                                    w-10 h-10 rounded-full flex items-center justify-center transition-all
                                    ${currentTrack.url === track.url && isPlaying ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/40 group-hover:text-purple-600'}
                                `}>
                                    {currentTrack.url === track.url && isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {displayedTracks.length === 0 && (
                        <div className="text-center py-12 text-slate-500">No tracks found for "{searchQuery}"</div>
                    )}
                </div>
            </div>

            {/* Sticky Mini Player */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 p-2 md:p-4 pb-safe shadow-2xl" data-testid="mini-player">
                <div className="max-w-4xl mx-auto flex items-center gap-4">
                    <img
                        src={`https://api.dicebear.com/7.x/shapes/svg?seed=${currentTrack.title}`}
                        alt="Art"
                        className="w-12 h-12 rounded-lg bg-slate-200 hidden md:block"
                    />

                    <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-900 dark:text-white truncate text-sm md:text-base">
                            {currentTrack.title}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span>{formatTime(progress)}</span>
                            <input
                                type="range"
                                min={0}
                                max={duration || 100}
                                value={progress}
                                onChange={handleSeek}
                                className="flex-1 h-1 bg-slate-200 rounded-full accent-purple-600"
                            />
                            <span>{formatTime(duration)}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-4">
                        <button onClick={handlePrev} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full hidden md:block">
                            <SkipBack className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handlePlayPause}
                            className="w-10 h-10 md:w-12 md:h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-full flex items-center justify-center shadow-lg"
                        >
                            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
                        </button>
                        <button onClick={handleNext} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                            <SkipForward className="w-5 h-5" />
                        </button>
                        <button onClick={toggleShuffle} className={`p-2 rounded-full hidden md:block ${isShuffle ? 'text-purple-600 bg-purple-100' : 'text-slate-400'}`}>
                            <Shuffle className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Audio Element */}
            <audio
                ref={audioRef}
                src={currentTrack.url}
                onTimeUpdate={() => {
                    if (audioRef.current) {
                        setProgress(audioRef.current.currentTime);
                        setDuration(audioRef.current.duration || 0);
                    }
                }}
                onEnded={handleNext}
                onError={(e) => console.error("Audio error", e)}
            />

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-900 text-white rounded-full shadow-lg text-sm font-medium z-[60]"
                    >
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const formatTime = (seconds: number) => {
    if (!seconds) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
};
