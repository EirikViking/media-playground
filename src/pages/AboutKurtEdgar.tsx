import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gamepad2 } from 'lucide-react';
import { MessengerButtons } from '../components/MessengerButtons';
import { HoverVideo } from '../components/HoverVideo';

export const AboutKurtEdgar = () => {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <main className="max-w-4xl mx-auto px-6 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-8"
                >
                    <div className="text-center space-y-8">
                        {/* Kurt Video - Moved to Top */}
                        <div className="mx-auto max-w-2xl transform hover:scale-[1.02] transition-transform duration-500">
                            <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800">
                                <HoverVideo
                                    src="https://media-playground-api.cromkake.workers.dev/api/assets/original/fd4237ba-f675-4905-b8f4-782b79ec63c8/fb77ab5a-f90f-4831-a41b-ee31d68fb541"
                                    className="aspect-[9/16] md:aspect-video w-full object-cover"
                                />
                            </div>
                        </div>

                        <h1 className="text-5xl md:text-6xl font-bold font-display bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                            About Kurt Edgar
                        </h1>
                    </div>

                    <div className="prose prose-lg dark:prose-invert max-w-none">
                        <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-3xl border border-slate-200 dark:border-slate-800 p-8 md:p-12 relative">
                            <div className="absolute top-0 left-0 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl -ml-16 -mt-16"></div>
                            <p className="text-xl leading-relaxed text-slate-700 dark:text-slate-300 font-light relative z-10">
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
