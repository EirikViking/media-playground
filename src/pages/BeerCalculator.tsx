import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, RotateCcw, Plus, Minus, Settings } from 'lucide-react';
import { Button } from '../components/Button';
import { BeerRiskMeter } from '../components/BeerRiskMeter';
import { playBeerTone, speakMessage } from '../utils/audioSystem';

interface Message {
    headline: string;
    serious: string;
    suggestion: string;
}

const MESSAGES: Record<number, Message> = {
    0: { headline: "Level 0: Zero Alcohol", serious: "Completely sober. Full mental capacity.", suggestion: "Stay hydrated and ready." },
    1: { headline: "Level 1: The Starter", serious: "Mild relaxation. Your liver is active.", suggestion: "Savor it and pace yourself." },
    2: { headline: "Level 2: Warming Up", serious: "Reaction time slows slightly. Feeling chatty.", suggestion: "Have a glass of water now." },
    3: { headline: "Level 3: The Buzz", serious: "Inhibitions drop. Judgement softens.", suggestion: "Do not drive. Seriously." },
    4: { headline: "Level 4: Wobbly", serious: "Coordination impaired. Emotions amplified.", suggestion: "Eat some substantial food." },
    5: { headline: "Level 5: Tipsy", serious: "Balance slips. Reasoning gets fuzzy.", suggestion: "Put the phone away. Don't text exes." },
    6: { headline: "Level 6: Slippery Slope", serious: "Slurring speech. Hydration is critical.", suggestion: "Switch to water immediately." },
    7: { headline: "Level 7: The Edge", serious: "Hangover loading... Sleep quality will suffer.", suggestion: "Stop now or take a very long break." },
    8: { headline: "RED ZONE 🚨", serious: "Significant impairment. Nausea likely.", suggestion: "Stop drinking. Hydrate. Get home safe." },
    9: { headline: "RED ZONE 🚨", serious: "Blackout risk. Motor control failing.", suggestion: "Find a safe place. Stay there." },
    10: { headline: "RED ZONE ⚠️", serious: "Severe intoxication. Vomiting risk.", suggestion: "Do not be alone. Stop." }
};

const EMERGENCY_MESSAGE = {
    headline: "EMERGENCY ZONE 🚑",
    serious: "Risk of alcohol poisoning. Unconscious risk.",
    suggestion: "Seek help if unresponsive. Stop immediately."
};

const getVoiceLine = (count: number) => {
    if (count === 0) return "Counter reset. Back to zero.";
    if (count === 1) return "First sip. Enjoy responsibly.";
    if (count === 2) return "Number two. Easy does it.";
    if (count === 3) return "Three. Your inhibitions are fading.";
    if (count === 4) return "Four. Caution. Coordination dropping.";
    if (count === 5) return "Five. You are now tipsy.";
    if (count === 6) return "Six. Slurring detected. Drink water.";
    if (count === 7) return "Seven. Approaching danger zone.";
    if (count >= 8 && count < 10) return "Warning! High alcohol level. Stop now.";
    if (count >= 10) return "Critical warning! Severe intoxication. Seek safety.";
    return "Another one.";
};

export const BeerCalculator = () => {
    const [count, setCount] = useState(0);
    const [settingsOpen, setSettingsOpen] = useState(false);

    // Audio Settings
    const [voiceEnabled, setVoiceEnabled] = useState(true);
    const [volume, setVolume] = useState(1);
    const [rate, setRate] = useState(1);

    // Animation state
    const [shakeKey, setShakeKey] = useState(0);

    const prevCount = useRef(count);

    useEffect(() => {
        // Trigger effects only on change
        if (count !== prevCount.current) {
            // Tone
            playBeerTone(count);

            // Voice
            if (voiceEnabled) {
                const text = getVoiceLine(count);
                // Escalate tone/rate slightly for higher counts
                const effectiveRate = count >= 8 ? rate * 0.9 : rate;
                const effectiveVol = volume;
                speakMessage(text, true, effectiveVol, effectiveRate);
            }
        }
        prevCount.current = count;
    }, [count, voiceEnabled, volume, rate]);

    const handleIncrement = () => {
        setCount(c => c + 1);
        setShakeKey(k => k + 1);
    };

    const handleDecrement = () => {
        if (count > 0) setCount(c => c - 1);
    };

    const handleReset = () => {
        setCount(0);
        setShakeKey(0);
    };

    const currentMessage = count <= 10 ? MESSAGES[count] : EMERGENCY_MESSAGE;
    const tiltAngle = Math.min(count * 2, 20);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
            {/* Settings Panel */}
            <AnimatePresence>
                {settingsOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="w-full max-w-4xl mx-auto bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 overflow-hidden"
                    >
                        <div className="py-4 space-y-4">
                            <h3 className="text-sm font-bold uppercase text-slate-500 tracking-wider">Voice Feedback</h3>

                            <div className="flex items-center justify-between">
                                <span className="text-slate-700 dark:text-slate-300">Enable Voice</span>
                                <Button
                                    variant={voiceEnabled ? 'primary' : 'secondary'}
                                    size="sm"
                                    onClick={() => setVoiceEnabled(!voiceEnabled)}
                                >
                                    {voiceEnabled ? 'On' : 'Off'}
                                </Button>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600 dark:text-slate-400">Volume</span>
                                    <span>{Math.round(volume * 100)}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0" max="1" step="0.1"
                                    value={volume}
                                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600 dark:text-slate-400">Speed</span>
                                    <span>{rate}x</span>
                                </div>
                                <input
                                    type="range"
                                    min="0.5" max="2" step="0.1"
                                    value={rate}
                                    onChange={(e) => setRate(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <main className="flex-1 flex flex-col items-center justify-start pt-8 px-6 pb-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-md w-full space-y-8"
                >
                    {/* Main Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-800 space-y-6 relative overflow-hidden">

                        <button
                            onClick={() => setSettingsOpen(!settingsOpen)}
                            className={`absolute top-4 right-4 p-2 rounded-full transition-colors z-20 ${settingsOpen ? 'bg-purple-100 text-purple-600' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                            aria-label="Audio Settings"
                        >
                            <Settings className="w-5 h-5" />
                        </button>

                        {/* Beer Can Display */}
                        <div className="flex justify-center mb-2 h-[180px] items-end relative z-10">
                            {/* Wrapper for shake animation */}
                            <div
                                key={shakeKey}
                                className={`${shakeKey > 0 ? (count >= 8 ? "animate-shake-strong" : "animate-shake-gentle") : ""}`}
                            >
                                {/* Frosted Glass Shimmer Effect (CSS) */}
                                <div className="relative group">
                                    {/* Bubbles if count > 0 */}
                                    {count > 0 && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-full h-8 flex justify-center gap-2 pointer-events-none opacity-50">
                                            {[...Array(3)].map((_, i) => (
                                                <motion.div
                                                    key={i}
                                                    className="w-2 h-2 bg-white/50 rounded-full"
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: [0, 1, 0], y: -20, x: (i - 1) * 5 }}
                                                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.3 }}
                                                />
                                            ))}
                                        </div>
                                    )}

                                    <img
                                        src="/beervan.png"
                                        alt="Isbjørn Lite beer can"
                                        className="w-[110px] md:w-[150px] drop-shadow-2xl transition-transform duration-500 ease-out object-contain origin-bottom"
                                        style={{
                                            transform: `rotate(${tiltAngle}deg)`
                                        }}
                                    />
                                    {/* Shimmer overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 skew-x-12 translate-x-[-150%] animate-shimmer pointer-events-none rounded-lg mix-blend-overlay" />
                                </div>
                            </div>
                        </div>

                        {/* Counter Display */}
                        <div className="flex flex-col items-center justify-center space-y-2 relative z-10">
                            <h2 className="text-sm uppercase tracking-wider text-slate-500 font-bold">How many?</h2>
                            <motion.span
                                key={count}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className={`text-7xl font-black font-display tracking-tighter ${count >= 8 ? 'text-red-600 drop-shadow-md' :
                                    count >= 4 ? 'text-orange-500' : 'text-slate-900 dark:text-white'
                                    }`}
                            >
                                {count}
                            </motion.span>
                        </div>

                        {/* Controls */}
                        <div className="grid grid-cols-2 gap-4 relative z-10">
                            <Button
                                variant="secondary"
                                size="lg"
                                onClick={handleDecrement}
                                disabled={count === 0}
                                aria-label="Decrease beer count"
                            >
                                <Minus className="w-5 h-5 mr-2" />
                                Less
                            </Button>
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={handleIncrement}
                                aria-label="Increase beer count"
                                className={count >= 7 ? 'animate-pulse hover:animate-none shadow-orange-500/20' : ''}
                            >
                                <Plus className="w-5 h-5 mr-2" />
                                One More
                            </Button>
                        </div>

                        <div className="flex justify-center relative z-10">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleReset}
                                aria-label="Reset count to zero"
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <RotateCcw className="w-4 h-4 mr-1" />
                                Reset Counter
                            </Button>
                        </div>

                        {/* Risk Meter */}
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 relative z-10">
                            <BeerRiskMeter count={count} />
                        </div>

                        {/* Message System */}
                        <div className={`rounded-xl p-5 text-center transition-colors duration-300 relative z-10 border ${count >= 8
                            ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30'
                            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800'
                            }`}>
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={count}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    className="space-y-2"
                                >
                                    <h3 className={`font-display font-bold text-lg ${count >= 8 ? 'text-red-700 dark:text-red-400' : 'text-slate-900 dark:text-white'
                                        }`}>
                                        {currentMessage.headline}
                                    </h3>
                                    <p className="text-slate-700 dark:text-slate-300 font-medium leading-tight">
                                        {currentMessage.serious}
                                    </p>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm italic pt-1">
                                        💡 {currentMessage.suggestion}
                                    </p>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Red Zone Warning */}
                    <AnimatePresence>
                        {count >= 8 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-red-600 text-white shadow-lg shadow-red-500/30 rounded-2xl p-4 flex items-start gap-3"
                            >
                                <AlertTriangle className="w-6 h-6 text-white flex-shrink-0 mt-0.5 animate-bounce" />
                                <div>
                                    <h3 className="font-bold text-white">Red Zone Warning</h3>
                                    <p className="text-red-100 text-sm mt-1">
                                        Consider stopping, hydrate, and take a break. Your body is under stress.
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <p className="text-center text-xs text-slate-400 dark:text-slate-600 max-w-xs mx-auto">
                        Educational only. Not medical advice. Please drink responsibly.
                    </p>
                </motion.div>
            </main>
        </div>
    );
};
