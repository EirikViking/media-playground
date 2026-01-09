import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Palette, Rocket, Star } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';

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
                        <h1 className="text-5xl md:text-6xl font-bold font-display bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                            About Kurt Edgar
                        </h1>
                        <p className="text-xl text-slate-600 dark:text-slate-400">
                            The other half of this creative adventure
                        </p>
                    </div>

                    <div className="prose prose-lg dark:prose-invert max-w-none">
                        <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-6">
                            <section>
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                    <Heart className="w-6 h-6 text-pink-500" />
                                    Hello from Kurt Edgar
                                </h2>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                    I'm Kurt Edgar, the creative spark that keeps this playground vibrant. Together with Eirik,
                                    we're building a space where imagination meets pixels, and where the only limit is how
                                    far we're willing to push the boundaries of what's possible.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                    <Palette className="w-6 h-6 text-purple-500" />
                                    What you'll discover
                                </h2>
                                <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                                    <li className="flex items-start gap-2">
                                        <Star className="w-5 h-5 text-pink-500 mt-0.5 flex-shrink-0" />
                                        <span>Creative experiments that blur the line between art and code</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Star className="w-5 h-5 text-pink-500 mt-0.5 flex-shrink-0" />
                                        <span>Interactive experiences designed to spark joy</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Star className="w-5 h-5 text-pink-500 mt-0.5 flex-shrink-0" />
                                        <span>Games and playful tools for pure entertainment</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Star className="w-5 h-5 text-pink-500 mt-0.5 flex-shrink-0" />
                                        <span>Collaborative projects with Eirik that push creative boundaries</span>
                                    </li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                    <Rocket className="w-6 h-6 text-blue-500" />
                                    The mission
                                </h2>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                    My goal is simple: make digital experiences that feel alive, surprising, and fun.
                                    Whether it's a visual toy, a game mechanic, or just a delightful interaction,
                                    I want everything here to bring a smile to your face.
                                </p>
                            </section>
                        </div>
                    </div>

                    <div className="text-center pt-8">
                        <Link
                            to="/games"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all"
                        >
                            <Rocket className="w-5 h-5" />
                            Explore the Games
                        </Link>
                    </div>
                </motion.div>
            </main>
        </div>
    );
};
