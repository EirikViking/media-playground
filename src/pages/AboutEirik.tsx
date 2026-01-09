import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, Code, Coffee, Zap } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';

export const AboutEirik = () => {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <header className="p-6 flex justify-between items-center max-w-4xl mx-auto">
                <Link
                    to="/"
                    className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                    data-testid="back-to-home"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Hub
                </Link>
                <ThemeToggle />
            </header>

            <main className="max-w-4xl mx-auto px-6 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-8"
                >
                    <div className="text-center space-y-4">
                        <h1 className="text-5xl md:text-6xl font-bold font-display bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            About Eirik
                        </h1>
                        <p className="text-xl text-slate-600 dark:text-slate-400">
                            Creator, tinkerer, and chaos coordinator
                        </p>
                    </div>

                    <div className="prose prose-lg dark:prose-invert max-w-none">
                        <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-6">
                            <section>
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                    <Sparkles className="w-6 h-6 text-purple-500" />
                                    Welcome to my corner
                                </h2>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                    Hey there! I'm Eirik, one half of this digital playground. I like building things
                                    that make life a bit more interesting, whether it's experimenting with code,
                                    creating visual chaos, or just seeing what happens when you mix pixels with passion.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                    <Code className="w-6 h-6 text-blue-500" />
                                    What you'll find here
                                </h2>
                                <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                                    <li className="flex items-start gap-2">
                                        <Zap className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                                        <span>Experimental projects and creative coding adventures</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Zap className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                                        <span>Tools and utilities built for fun and learning</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Zap className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                                        <span>Visual experiments that might or might not make sense</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Zap className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                                        <span>Whatever Kurt Edgar and I dream up together</span>
                                    </li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                    <Coffee className="w-6 h-6 text-pink-500" />
                                    The vibe
                                </h2>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                    This playground is all about keeping things playful. No rigid rules, no taking
                                    ourselves too seriously. Just pure creative exploration with a side of organized chaos.
                                </p>
                            </section>
                        </div>
                    </div>

                    <div className="text-center pt-8">
                        <Link
                            to="/studio"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all"
                        >
                            <Sparkles className="w-5 h-5" />
                            Try the Studio
                        </Link>
                    </div>
                </motion.div>
            </main>
        </div>
    );
};
