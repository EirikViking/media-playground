import { motion } from 'framer-motion';
import { Gamepad2, Users, ExternalLink, Rocket } from 'lucide-react';
import { Button } from '../components/Button';
import { useNavigate } from 'react-router-dom';

const ROAST_GAME_URL = 'https://c303a75a.roast-rage-redux2.pages.dev/';

interface Game {
    id: string;
    title: string;
    description: string;
    image: string;
    steamAppId?: string;
    isFeatured?: boolean;
    isInternal?: boolean;
    internalPath?: string;
    tags: string[];
}

const GAMES: Game[] = [
    {
        id: 'burt-game',
        title: 'Burt fra Stokmarknes',
        description: 'En norsk helt flyr gjennom verdensrommet. Beskyt nordlyset mot invasjon i denne klassiske arcade shooteren.',
        image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?auto=format&fit=crop&q=80&w=2340',
        isInternal: true,
        internalPath: '/play/burt',
        tags: ['Arcade', 'Space Shooter', 'Stokmarknes']
    },
    {
        id: 'roast-rage-redux-2',
        title: 'Roast Rage Redux 2',
        description: 'The ultimate roasting experience. Battle through waves of chaos in this action-packed web game. Play now or open in fullscreen for the best experience.',
        image: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&q=80&w=2340',
        isFeatured: true,
        tags: ['Action', 'Web Game', 'Featured']
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
    const navigate = useNavigate();
    const featuredGame = GAMES.find(g => g.isFeatured);
    const webGames = GAMES.filter(g => !g.isFeatured && (g.isInternal || !g.steamAppId));
    const steamGames = GAMES.filter(g => !g.isFeatured && g.steamAppId);

    const launchSteamGame = (appId: string) => {
        window.location.href = `steam://run/${appId}`;
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white pb-20">
            {/* Header */}
            <main className="max-w-7xl mx-auto px-6 space-y-16 pt-8">

                {/* Header Section */}
                <div className="text-center space-y-4 pt-8">
                    <h1 className="text-5xl md:text-7xl font-bold font-display bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
                        Game Center
                    </h1>
                    <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
                        Jump into our featured experiences or join us on Steam for some digital chaos.
                    </p>
                </div>

                {/* Featured Game: Roast Rage Redux 2 */}
                {featuredGame && (
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="relative rounded-3xl overflow-hidden bg-slate-900 shadow-2xl mx-auto max-w-5xl"
                    >
                        {/* Game Header */}
                        <div className="relative bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 p-8 md:p-12">
                            <div className="flex gap-2 mb-4">
                                {featuredGame.tags.map(tag => (
                                    <span key={tag} className="px-3 py-1 bg-black/30 text-white text-xs font-bold uppercase tracking-wider rounded-full backdrop-blur-sm border border-white/20">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                            <h2 className="text-4xl md:text-6xl font-bold text-white font-display mb-4">
                                {featuredGame.title}
                            </h2>
                            <p className="text-lg text-white/90 max-w-2xl leading-relaxed mb-6">
                                {featuredGame.description}
                            </p>
                            <a
                                href={ROAST_GAME_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-full font-bold hover:bg-slate-100 transition-colors shadow-lg"
                            >
                                <ExternalLink className="w-5 h-5" />
                                Open Fullscreen
                            </a>
                        </div>

                        {/* Game Iframe */}
                        <div className="relative w-full bg-black" style={{ paddingBottom: '56.25%' }}>
                            <iframe
                                src={ROAST_GAME_URL}
                                title="Roast Rage Redux 2"
                                className="absolute inset-0 w-full h-full border-0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>

                        {/* Mobile Hint */}
                        <div className="p-4 bg-slate-800/50 backdrop-blur-sm text-center text-sm text-slate-300">
                            <p className="md:hidden">💡 For best experience, tap "Open Fullscreen" above or rotate your device to landscape.</p>
                            <p className="hidden md:block">Use WASD or Arrow Keys to move. Click to shoot. Have fun!</p>
                        </div>
                    </motion.section>
                )}

                {/* Web Games Section */}
                {webGames.length > 0 && (
                    <section className="max-w-5xl mx-auto mb-16">
                        <h3 className="text-2xl font-bold flex items-center gap-3 mb-8 text-slate-800 dark:text-white">
                            <Rocket className="w-6 h-6 text-cyan-500" />
                            Play Now
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {webGames.map((game, index) => (
                                <motion.div
                                    key={game.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-cyan-500/50 dark:hover:border-cyan-500/50 transition-all hover:shadow-xl group cursor-pointer"
                                    onClick={() => game.isInternal && game.internalPath && navigate(game.internalPath)}
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

                                        <Button
                                            variant="primary"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (game.isInternal && game.internalPath) {
                                                    navigate(game.internalPath);
                                                }
                                            }}
                                            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-transparent"
                                        >
                                            <Rocket className="w-5 h-5 mr-2" />
                                            Spill nå
                                        </Button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </section>
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
