import { useState, useEffect } from 'react';
import { Download, Share, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Robust mobile detection
const isMobileDevice = (): boolean => {
    if (typeof window === 'undefined') return false;

    // 1. Check for coarse pointer (touch device)
    const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;

    // 2. Check viewport width (mobile threshold)
    const isMobileWidth = window.matchMedia('(max-width: 768px)').matches;

    // 3. User agent fallback for iOS and Android
    const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    return hasCoarsePointer || isMobileWidth || mobileUA;
};

export const PwaInstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showIosHint, setShowIosHint] = useState(false);
    const [isInstallable, setIsInstallable] = useState(false);



    useEffect(() => {
        // Never show in test mode
        if (import.meta.env.MODE === 'test' || (typeof window !== 'undefined' && (window as any).__E2E__)) {
            return;
        }

        // Only proceed if mobile device
        if (!isMobileDevice()) {
            return;
        }

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);
        };
        window.addEventListener('beforeinstallprompt', handler);

        // iOS Detection (only on mobile)
        const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        if (isIos && !isStandalone) {
            setShowIosHint(true);
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    // Don't render anything in test mode or on desktop
    if (import.meta.env.MODE === 'test' || (typeof window !== 'undefined' && (window as any).__E2E__)) {
        return null;
    }

    if (!isMobileDevice()) {
        return null;
    }

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setIsInstallable(false);
        }
    };

    return (
        <AnimatePresence>
            {/* Install Button (Android/Desktop) */}
            {isInstallable && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
                >
                    <button
                        onClick={handleInstallClick}
                        className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                    >
                        <Download className="w-5 h-5" />
                        Install App
                    </button>
                </motion.div>
            )}

            {/* iOS Hint */}
            {showIosHint && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-6 left-6 right-6 z-50 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl"
                >
                    <div className="flex items-start gap-4">
                        <div className="bg-slate-100 dark:bg-slate-700 p-2 rounded-lg">
                            <Share className="w-6 h-6 text-blue-500" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-slate-900 dark:text-white mb-1">Install for better experience</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                                Tap <Share className="w-3 h-3 inline mx-1" /> and select "Add to Home Screen"
                            </p>
                        </div>
                        <button
                            onClick={() => setShowIosHint(false)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                            ✕
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
