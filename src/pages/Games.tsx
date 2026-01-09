import { ArrowLeft, Gamepad2, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Game {
    id: string;
    title: string;
    description: string;
    steamAppId?: string;
    gradient: string;
}

const games: Game[] = [
    {
        id: 'aoe4',
        title: 'Age of Empires IV',
        description: 'Strategic conquest and empire building.',
        steamAppId: '1466860',
        gradient: 'from-yellow-600 to-amber-800'
    },
    {
        id: 'helldivers2',
        title: 'Helldivers 2',
        description: 'Cooperative third-person shooter.',
        steamAppId: '553850',
        gradient: 'from-slate-700 to-slate-900'
    }
];

export const Games = () => {
    return (
        <div className="min-h-screen bg-slate-950 text-white p-6 flex flex-col">
            <header className="mb-12 flex justify-between items-center max-w-7xl mx-auto w-full relative z-10">
                <div className="flex items-center gap-4">
                    <Link to="/" className="flex items-center gap-2 text-slate-400 hover:text-purple-400 transition-colors bg-white/5 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
                        <ArrowLeft className="w-5 h-5" /> Back to Playground
                    </Link>
                </div>
                <h1 className="text-3xl font-bold font-display flex items-center gap-3">
                    <Gamepad2 className="w-10 h-10 text-purple-500" />
                    <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">Arcade</span>
                </h1>
            </header>

            <main className="max-w-7xl mx-auto w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {games.map((game) => (
                        <div key={game.id} className="relative group rounded-3xl overflow-hidden border border-white/10 bg-white/5 hover:border-purple-500/50 transition-all hover:-translate-y-1">
                            <div className={`h-40 bg-gradient-to-br ${game.gradient} relative overflow-hidden`}>
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                                <div className="absolute bottom-4 left-6">
                                    <h2 className="text-2xl font-bold font-display shadow-black drop-shadow-lg">{game.title}</h2>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                <p className="text-slate-400">{game.description}</p>

                                {game.steamAppId && (
                                    <div className="space-y-4">
                                        <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 text-xs text-slate-500 space-y-2">
                                            <p className="flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                PC only. Works with Steam installed.
                                            </p>
                                            <p className="flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                Start game → Shift+Tab to invite.
                                            </p>
                                        </div>

                                        <a
                                            href={`steam://run/${game.steamAppId}`}
                                            data-testid={`launch-${game.id}`}
                                            className="w-full flex items-center justify-center gap-2 bg-[#1b2838] hover:bg-[#2a475e] text-blue-100 font-medium py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-900/20 active:scale-95 border border-blue-500/20"
                                        >
                                            <Play className="w-5 h-5 fill-current" />
                                            Invite & Launch
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};
