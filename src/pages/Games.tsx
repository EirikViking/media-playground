import { motion } from 'framer-motion';
import { Gamepad2, Play, Users, ArrowLeft } from 'lucide-react';
import { Button } from '../components/Button';
import { ThemeToggle } from '../components/ThemeToggle';
import { Link } from 'react-router-dom';

interface Game {
    id: string;
    title: string;
    description: string;
    image: string;
    steamAppId?: string;
    isFeatured?: boolean;
    tags: string[];
}

const GAMES: Game[] = [
    {
        id: 'roast-game',
        title: 'Roast Game',
        description: 'The ultimate roasting experience. Turn your beautiful photos into art (or something like it) with our chaos generator.',
        image: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&q=80&w=2340', // Placeholder fire/roast img
        isFeatured: true,
        tags: ['Chaos', 'Creative', 'Web Game']
    },
    {
        id: 'aoe4',
        title: 'Age of Empires IV',
        description: 'One of the most beloved real-time strategy games tailored for a new generation.',
        image: 'https://cdn.akamai.steamstatic.com/steam/apps/1466860/header.jpg',
        steamAppId: '1466860',
        tags: ['Strategy', 'RTS', 'Multiplayer']
    },
    {
        id: 'helldivers2',
        title: 'Helldivers 2',
        description: 'Join the Helldivers and fight for freedom with friends across a hostile galaxy.',
        image: 'https://cdn.akamai.steamstatic.com/steam/apps/553850/header.jpg',
        steamAppId: '553850',
        tags: ['Action', 'Co-op', 'Shooter']
    }
];

export const Games = () => {
    const featuredGame = GAMES.find(g => g.isFeatured);
    const steamGames = GAMES.filter(g => !g.isFeatured && g.steamAppId);

    const launchSteamGame = (appId: string) => {
        window.location.href = `steam://run/${appId}`;
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white pb-20">
            {/* Header */}
            <header className="p-6 flex justify-between items-center max-w-7xl mx-auto">
                <Link
                    to="/"
                    className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Hub
                </Link>
                <ThemeToggle />
            </header>

            <main className="max-w-7xl mx-auto px-6 space-y-16">

                {/* Header Section */}
                <div className="text-center space-y-4 pt-8">
                    <h1 className="text-5xl md:text-7xl font-bold font-display bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
                        Game Center
                    </h1>
                    <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
                        Jump into our featured experiences or join us on Steam for some digital chaos.
                    </p>
                </div>

                {/* Featured Game */}
                {featuredGame && (
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="relative rounded-3xl overflow-hidden bg-slate-900 shadow-2xl mx-auto max-w-5xl group"
                    >
                        <div className="absolute inset-0">
                            <img
                                src={featuredGame.image}
                                alt={featuredGame.title}
                                className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                        </div>

                        <div className="relative p-8 md:p-16 flex flex-col items-start gap-6 pt-32 md:pt-48">
                            <div className="flex gap-2">
                                {featuredGame.tags.map(tag => (
                                    <span key={tag} className="px-3 py-1 bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider rounded-full backdrop-blur-sm border border-amber-500/20">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                            <h2 className="text-4xl md:text-6xl font-bold text-white font-display">
                                {featuredGame.title}
                            </h2>
                            <p className="text-lg text-slate-200 max-w-xl leading-relaxed">
                                {featuredGame.description}
                            </p>

                            <Link to="/studio">
                                <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-slate-900 border-none font-bold text-lg px-8 shadow-lg shadow-amber-900/20">
                                    <Play className="w-6 h-6 mr-2 fill-current" />
                                    Play Now
                                </Button>
                            </Link>
                        </div>
                    </motion.section>
                )}

                {/* Steam Games Section */}
                <section className="max-w-5xl mx-auto">
                    <h3 className="text-2xl font-bold flex items-center gap-3 mb-8 text-slate-800 dark:text-white">
                        <Gamepad2 className="w-6 h-6 text-blue-500" />
                        Invite & Launch via Steam
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 gap-y-12">
                        {steamGames.map((game, index) => (
                            <motion.div
                                key={game.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all hover:shadow-xl group"
                            >
                                <div className="h-48 overflow-hidden relative">
                                    <img
                                        src={game.image}
                                        alt={game.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent flex items-end p-4">
                                        <div className="flex gap-2">
                                            {game.tags.map(tag => (
                                                <span key={tag} className="px-2 py-0.5 bg-black/60 text-white text-[10px] uppercase font-bold tracking-wider rounded backdrop-blur-sm">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <h4 className="text-xl font-bold mb-2 font-display">{game.title}</h4>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
                                        {game.description}
                                    </p>

                                    <div className="space-y-3">
                                        <Button
                                            variant="secondary"
                                            onClick={() => launchSteamGame(game.steamAppId!)}
                                            className="w-full bg-[#1b2838] hover:bg-[#2a475e] text-white border-transparent"
                                        >
                                            <Gamepad2 className="w-5 h-5 mr-2" />
                                            Invite & Launch
                                        </Button>

                                        <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-xs text-blue-800 dark:text-blue-300">
                                            <Users className="w-4 h-4 mt-0.5 shrink-0" />
                                            <div className="leading-relaxed">
                                                <p className="font-semibold mb-0.5">PC Only • Steam Required</p>
                                                <p className="opacity-80">Start game → Shift+Tab to invite friends</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
};
