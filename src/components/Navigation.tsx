import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export const Navigation = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <>
            <div className="flex items-center gap-8">
                <Link to="/" data-testid="nav-home">
                    <span className="font-display text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        Kurt Edgar & Eirik
                    </span>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-6">
                    <NavLink to="/about/eirik" testId="nav-about-eirik">About Eirik</NavLink>
                    <NavLink to="/about/kurt-edgar" testId="nav-about-kurt">About Kurt Edgar</NavLink>
                    <NavLink to="/beers" testId="nav-beer-calc">Beer Calculator</NavLink>
                    <NavLink to="/games" testId="nav-gaming">Gaming</NavLink>
                    <NavLink to="/studio" testId="nav-studio">The Studio</NavLink>
                    <NavLink to="/music" testId="nav-music">Music Library</NavLink>
                </nav>
            </div>

            <div className="flex items-center gap-4">
                <ThemeToggle />

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                    onClick={() => setMobileMenuOpen(true)}
                    data-testid="mobile-menu-btn"
                >
                    <Menu className="w-6 h-6" />
                </button>

                <Link
                    to="/admin"
                    className="hidden md:block text-sm font-medium text-slate-400 hover:text-purple-500 dark:hover:text-purple-400 transition-colors"
                    data-testid="nav-admin"
                >
                    Admin
                </Link>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: '100%' }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: '100%' }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed inset-0 z-50 bg-white dark:bg-slate-900 md:hidden flex flex-col p-6"
                    >
                        <div className="flex justify-between items-center mb-8">
                            <span className="font-display text-2xl font-bold text-slate-900 dark:text-white">Menu</span>
                            <button
                                onClick={() => setMobileMenuOpen(false)}
                                className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <nav className="flex flex-col gap-6 text-lg font-medium">
                            <MobileNavLink to="/about/eirik" onClick={() => setMobileMenuOpen(false)}>About Eirik</MobileNavLink>
                            <MobileNavLink to="/about/kurt-edgar" onClick={() => setMobileMenuOpen(false)}>About Kurt Edgar</MobileNavLink>
                            <MobileNavLink to="/beers" onClick={() => setMobileMenuOpen(false)}>Beer Calculator</MobileNavLink>
                            <MobileNavLink to="/games" onClick={() => setMobileMenuOpen(false)}>Gaming</MobileNavLink>
                            <MobileNavLink to="/studio" onClick={() => setMobileMenuOpen(false)}>The Studio</MobileNavLink>
                            <MobileNavLink to="/music" onClick={() => setMobileMenuOpen(false)}>Music Library</MobileNavLink>
                            <MobileNavLink to="/admin" onClick={() => setMobileMenuOpen(false)}>Admin</MobileNavLink>
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

// Helper Components
const NavLink = ({ to, children, testId }: { to: string, children: React.ReactNode, testId?: string }) => (
    <Link
        to={to}
        className="text-sm font-medium text-slate-600 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-400 transition-colors"
        data-testid={testId}
    >
        {children}
    </Link>
);

const MobileNavLink = ({ to, children, onClick }: { to: string, children: React.ReactNode, onClick: () => void }) => (
    <Link
        to={to}
        onClick={onClick}
        className="text-slate-800 dark:text-slate-200 hover:text-purple-600 dark:hover:text-purple-400"
    >
        {children}
    </Link>
);
