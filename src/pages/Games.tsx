import { ArrowLeft, ExternalLink, Gamepad2 } from 'lucide-react';
import { Link } from 'react-router-dom';


export const Games = () => {
    return (
        <div className="min-h-screen bg-slate-900 text-white p-6 flex flex-col">
            <header className="mb-6 flex justify-between items-center max-w-7xl mx-auto w-full">
                <div className="flex items-center gap-4">
                    <Link to="/" className="flex items-center gap-2 hover:text-purple-400 transition-colors bg-white/5 px-4 py-2 rounded-full">
                        <ArrowLeft className="w-5 h-5" /> Back to Playground
                    </Link>
                </div>
                <h1 className="text-2xl font-bold font-display flex items-center gap-2">
                    <Gamepad2 className="w-8 h-8 text-purple-500" />
                    Arcade
                </h1>
            </header>

            <main className="flex-1 w-full max-w-7xl mx-auto flex flex-col">
                <div className="flex-1 bg-black rounded-2xl overflow-hidden relative border border-slate-700 shadow-2xl">
                    <iframe
                        src="https://c303a75a.roast-rage-redux2.pages.dev/"
                        className="w-full h-full absolute inset-0 border-0"
                        title="Roast Rage"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                </div>

                <div className="mt-6 flex justify-center">
                    <p className="text-slate-400 text-sm flex items-center gap-2">
                        Game not loading?
                        <a href="https://c303a75a.roast-rage-redux2.pages.dev/" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium">
                            Open in new tab <ExternalLink className="w-3 h-3" />
                        </a>
                    </p>
                </div>
            </main>
        </div>
    );
};
