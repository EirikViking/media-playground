import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Gamepad2 } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';
import { MessengerButtons } from '../components/MessengerButtons';

export const AboutKurtEdgar = () => {
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
                        <div className="w-24 h-24 mx-auto bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center mb-6">
                            <Users className="w-12 h-12 text-pink-600 dark:text-pink-400" />
                        </div>
                        <h1 className="text-5xl md:text-6xl font-bold font-display bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                            About Kurt Edgar
                        </h1>
                    </div>

                    <div className="prose prose-lg dark:prose-invert max-w-none">
                        <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-3xl border border-slate-200 dark:border-slate-800 p-8 md:p-12">
                            <p className="text-xl leading-relaxed text-slate-700 dark:text-slate-300 font-light">
                                Kurt Edgar Lien is from Stokmarknes and has been active his whole life. He enjoys running in the mountains, simple and honest food, and a cold Isbjørn beer. His taste in music is firmly rooted in 80s hair rock, and while he likes playing video games, he is famously bad at them. Kurt Edgar brings energy, humor, and practicality into any collaboration. He is direct, unpretentious, and action oriented, and often balances more analytical personalities with movement, momentum, and a grounded approach to life.
                            </p>
                        </div>
                    </div>


                    <div className="flex justify-center">
                        <MessengerButtons />
                    </div>

                    <div className="text-center pt-8">
                        <Link
                            to="/games"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all"
                        >
                            <Gamepad2 className="w-5 h-5" />
                            Explore Games
                        </Link>
                    </div>
                </motion.div>
            </main>
        </div>
    );
};
