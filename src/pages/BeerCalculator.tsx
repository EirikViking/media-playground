import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Beer, AlertTriangle, RotateCcw, Plus, Minus } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';
import { Button } from '../components/Button';
import { BeerRiskMeter } from '../components/BeerRiskMeter';
import { playWarningSound } from '../utils/beep';

const FACTS = [
    "One beer. A gentle buzz, minimal impairment.",
    "Two beers. Feeling chattier, but reaction time slows slightly.",
    "Three beers. Inhibitions drop. You might think you're funnier than you are.",
    "Four beers. Coordination wobbles. Driving is definitely out.",
    "Five beers. Emotions amplify. Happy becomes happier, sad becomes sadder.",
    "Six beers. Balance issues. Stick to hydration now.",
    "Seven beers. Slurring starts. Tomorrow's hangover is loading...",
    "Eight beers. Significant impairment. Nausea risk increases.",
    "Nine beers. Memory encoding fails. 'What happened last night?' territory.",
    "Ten beers. Motor control compromised. Sleep quality will be terrible."
];

export const BeerCalculator = () => {
    const [count, setCount] = useState(0);

    const handleIncrement = () => {
        const newCount = count + 1;
        // Trigger sound only on 7 -> 8 transition
        if (count === 7) {
            playWarningSound();
        }
        setCount(newCount);
    };

    const handleDecrement = () => {
        if (count > 0) {
            setCount(count - 1);
        }
    };

    const handleReset = () => {
        setCount(0);
    };

    const getFact = () => {
        if (count === 0) return "Start clicking +1 to begin.";
        if (count <= 10) return FACTS[count - 1];
        return `${FACTS[9]} At this point, the risks climb very fast.`;
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
            <header className="p-6 flex justify-between items-center max-w-4xl mx-auto w-full">
                <Link
                    to="/"
                    className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Hub
                </Link>
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold font-display hidden md:block text-slate-900 dark:text-white">
                        Beer Calculator
                    </h1>
                    <ThemeToggle />
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-start pt-12 px-6 pb-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-md w-full space-y-8"
                >
                    {/* Main Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-800 space-y-8">

                        {/* Header icon */}
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mb-4 text-amber-600 dark:text-amber-500">
                                <Beer className="w-8 h-8" />
                            </div>
                            <h2 className="text-3xl font-bold font-display text-slate-900 dark:text-white">
                                How many?
                            </h2>
                        </div>

                        {/* Counter Display */}
                        <div className="flex justify-center items-center py-6">
                            <motion.span
                                key={count}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className={`text-8xl font-black font-display tracking-tighter ${count >= 8 ? 'text-red-600 drop-shadow-lg' :
                                        count >= 4 ? 'text-orange-500' : 'text-slate-900 dark:text-white'
                                    }`}
                            >
                                {count}
                            </motion.span>
                        </div>

                        {/* Controls */}
                        <div className="grid grid-cols-2 gap-4">
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
                                className={count >= 7 ? 'animate-pulse hover:animate-none' : ''}
                            >
                                <Plus className="w-5 h-5 mr-2" />
                                One More
                            </Button>
                        </div>

                        <div className="flex justify-center">
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
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                            <BeerRiskMeter count={count} />
                        </div>

                        {/* Fact Box */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 min-h-[5rem] flex items-center justify-center text-center">
                            <AnimatePresence mode="wait">
                                <motion.p
                                    key={count}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    className="text-slate-600 dark:text-slate-300 font-medium"
                                >
                                    {getFact()}
                                </motion.p>
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Red Zone Warning Banner */}
                    <AnimatePresence>
                        {count >= 8 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-start gap-3"
                            >
                                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-bold text-red-700 dark:text-red-400">Red Zone</h3>
                                    <p className="text-red-600 dark:text-red-300 text-sm mt-1">
                                        Red zone: consider stopping, hydrate, and take a break.
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <p className="text-center text-xs text-slate-400 dark:text-slate-600 max-w-xs mx-auto">
                        For fun and general info only. Not medical advice. Please drink responsibly.
                    </p>
                </motion.div>
            </main>
        </div>
    );
};
