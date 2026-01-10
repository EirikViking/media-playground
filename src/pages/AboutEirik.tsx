import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { MessengerButtons } from '../components/MessengerButtons';

export const AboutEirik = () => {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <main className="max-w-4xl mx-auto px-6 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-12"
                >
                    <div className="flex flex-col md:flex-row items-center gap-12">
                        {/* Image Section */}
                        <motion.div
                            className="flex-shrink-0 relative group"
                            whileHover={{ scale: 1.05, rotate: 2 }}
                            transition={{ type: "spring", stiffness: 300 }}
                        >
                            <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full"></div>
                            <img
                                src="/eirik-pixel.png"
                                alt="Eirik Pixel Art"
                                className="w-64 h-64 md:w-80 md:h-80 rounded-3xl object-cover shadow-2xl rotate-3 group-hover:rotate-0 transition-transform relative z-10 border-4 border-white dark:border-slate-800"
                            />
                        </motion.div>

                        {/* Title Section */}
                        <div className="text-center md:text-left space-y-4 flex-1">
                            <h1 className="text-5xl md:text-7xl font-bold font-display bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent transform md:-ml-4">
                                About Eirik
                            </h1>
                            <p className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 font-light max-w-lg">
                                Technologist, Investor, & Vibe Coder
                            </p>
                            <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-2">
                                {['Stokmarknes', 'Oslo', 'Crypto', 'AI', 'Builder'].map(tag => (
                                    <span key={tag} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-sm font-medium">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="prose prose-lg dark:prose-invert max-w-none">
                        <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-3xl border border-slate-200 dark:border-slate-800 p-8 md:p-12 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                            <p className="text-xl leading-relaxed text-slate-700 dark:text-slate-300 font-light relative z-10">
                                Eirik is a financially independent technologist, investor, and creative builder, and the creator behind this site. He lives off long term investments in stocks, funds, and crypto, which gives him the freedom to focus on what he does best: inventing, exploring, and building digital things that feel genuinely fun and useful. Known for his ability as a highly intuitive and fast moving vibe coder, Eirik excels at turning loose ideas into working systems with personality. He is full of new and unconventional ideas, constantly experimenting with AI, games, and digital platforms, and always looking for ways to create small moments of digital joy. Originally from Stokmarknes in Northern Norway and now based in Oslo, he combines deep analytical thinking with creativity, curiosity, and a strong desire to make technology feel human rather than heavy.
                            </p>
                        </div>
                    </div>


                    <div className="flex justify-center">
                        <MessengerButtons />
                    </div>

                    <div className="text-center pt-8">
                        <Link
                            to="/studio"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-blue-500/30 hover:scale-105 transition-all text-lg"
                        >
                            <Sparkles className="w-6 h-6" />
                            Visit The Studio
                        </Link>
                    </div>
                </motion.div>
            </main>
        </div>
    );
};
