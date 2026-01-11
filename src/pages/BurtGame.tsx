import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Maximize, Minimize, X, ExternalLink, Loader2 } from 'lucide-react';
import { updateLocalState, getLocalState } from '../utils/localState';

const GAME_URL = 'https://master.burt-game.pages.dev/';
const LOAD_TIMEOUT = 3000;

export const BurtGame = () => {
    const navigate = useNavigate();
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [hasLoadError, setHasLoadError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<number>();

    useEffect(() => {
        // Track game play
        const state = getLocalState();
        const playCount = (state.tileClicksCount['burt-game'] || 0) + 1;
        updateLocalState({
            tileClicksCount: {
                ...state.tileClicksCount,
                'burt-game': playCount
            }
        });

        // Set timeout for load detection
        timeoutRef.current = window.setTimeout(() => {
            if (isLoading) {
                setHasLoadError(true);
                setIsLoading(false);
            }
        }, LOAD_TIMEOUT);

        return () => {
            if (timeoutRef.current) {
                window.clearTimeout(timeoutRef.current);
            }
        };
    }, [isLoading]);

    const handleIframeLoad = () => {
        setIsLoading(false);
        if (timeoutRef.current) {
            window.clearTimeout(timeoutRef.current);
        }
    };

    const toggleFullscreen = async () => {
        if (!containerRef.current) return;

        try {
            if (!isFullscreen) {
                await containerRef.current.requestFullscreen();
                setIsFullscreen(true);
            } else {
                await document.exitFullscreen();
                setIsFullscreen(false);
            }
        } catch (err) {
            console.warn('Fullscreen failed:', err);
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const openInNewTab = () => {
        window.open(GAME_URL, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-12">
            <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 space-y-4"
                >
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-4xl md:text-6xl font-bold font-display bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 bg-clip-text text-transparent mb-3">
                                Burt fra Stokmarknes
                            </h1>
                            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl">
                                En norsk helt flyr gjennom verdensrommet. Beskyt nordlyset mot invasjon. Klassisk arcade action med Vesteråls vibe.
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/games')}
                            className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                            aria-label="Tilbake til spill"
                        >
                            <X className="w-5 h-5" />
                            <span className="hidden md:inline">Lukk</span>
                        </button>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                        {['Arcade', 'Space Shooter', 'Stokmarknes', 'Galaga-inspirert'].map(tag => (
                            <span key={tag} className="px-3 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-full">
                                {tag}
                            </span>
                        ))}
                    </div>
                </motion.div>

                {/* Game Container */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    ref={containerRef}
                    className="relative bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800"
                >
                    {/* Controls Bar */}
                    <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent p-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={openInNewTab}
                                className="p-2 bg-slate-800/80 hover:bg-slate-700 text-white rounded-lg transition-colors backdrop-blur-sm"
                                aria-label="Åpne i ny fane"
                            >
                                <ExternalLink className="w-4 h-4" />
                            </button>
                            <button
                                onClick={toggleFullscreen}
                                className="p-2 bg-slate-800/80 hover:bg-slate-700 text-white rounded-lg transition-colors backdrop-blur-sm"
                                aria-label={isFullscreen ? 'Avslutt fullskjerm' : 'Fullskjerm'}
                            >
                                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Loading State */}
                    {isLoading && !hasLoadError && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900">
                            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                            <p className="text-slate-400">Laster spillet...</p>
                        </div>
                    )}

                    {/* Error Fallback */}
                    {hasLoadError && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900 p-8">
                            <div className="max-w-md text-center space-y-4">
                                <p className="text-xl text-slate-300">
                                    Spillet lastet ikke inn her inne.
                                </p>
                                <p className="text-slate-400">
                                    Åpne det i ny fane for best opplevelse.
                                </p>
                                <button
                                    onClick={openInNewTab}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                                >
                                    <ExternalLink className="w-5 h-5" />
                                    Åpne i ny fane
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Game Iframe */}
                    <div className="relative w-full bg-black" style={{ paddingBottom: '75%' }}>
                        <iframe
                            src={GAME_URL}
                            title="Burt fra Stokmarknes - Space Shooter"
                            className="absolute inset-0 w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            onLoad={handleIframeLoad}
                        />
                    </div>
                </motion.div>

                {/* Tips Section */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800"
                >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <p className="text-sm text-blue-900 dark:text-blue-200">
                            <span className="font-semibold">Tips:</span> Bruk piltaster for å bevege deg og space for å skyte
                        </p>
                        <button
                            onClick={openInNewTab}
                            className="text-sm text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 font-medium underline underline-offset-2"
                        >
                            Åpne i ny fane →
                        </button>
                    </div>
                </motion.div>
            </main>
        </div>
    );
};
