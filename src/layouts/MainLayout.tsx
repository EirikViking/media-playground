import { Outlet } from 'react-router-dom';
import { Navigation } from '../components/Navigation';

export const MainLayout = () => {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
            <header className="p-6 flex justify-between items-center relative z-20 max-w-7xl mx-auto w-full">
                <Navigation />
            </header>

            <main className="flex-1 w-full relative z-10">
                <Outlet />
            </main>
        </div>
    );
};
