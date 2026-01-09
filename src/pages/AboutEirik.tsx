import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, User } from 'lucide-react';
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
                        <div className="w-24 h-24 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6">
                            <User className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h1 className="text-5xl md:text-6xl font-bold font-display bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            About Eirik
                        </h1>
                    </div>

                    <div className="prose prose-lg dark:prose-invert max-w-none">
                        <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-3xl border border-slate-200 dark:border-slate-800 p-8 md:p-12">
                            <p className="text-xl leading-relaxed text-slate-700 dark:text-slate-300 font-light">
                                Eirik is a financially independent technologist, investor, and creative builder, and the creator behind this site. He lives off long term investments in stocks, funds, and crypto, which gives him the freedom to focus on what he does best: inventing, exploring, and building digital things that feel genuinely fun and useful. Known for his ability as a highly intuitive and fast moving vibe coder, Eirik excels at turning loose ideas into working systems with personality. He is full of new and unconventional ideas, constantly experimenting with AI, games, and digital platforms, and always looking for ways to create small moments of digital joy. Originally from Stokmarknes in Northern Norway and now based in Oslo, he combines deep analytical thinking with creativity, curiosity, and a strong desire to make technology feel human rather than heavy.
                            </p>
                        </div>
                    </div>

                    <div className="text-center pt-8">
                        <Link
                            to="/studio"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all"
                        >
                            <Sparkles className="w-5 h-5" />
                            Visit The Studio
                        </Link>
                    </div>
                </motion.div>
            </main>
        </div>
    );
};
