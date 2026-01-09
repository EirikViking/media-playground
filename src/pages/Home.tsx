import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User,
  Users,
  Gamepad2,
  Sparkles,
  ArrowRight,
  Palette,
  Code
} from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';

export const Home = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden relative selection:bg-purple-500/30">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[800px] h-[800px] bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-[40%] -left-[10%] w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute -bottom-[20%] right-[20%] w-[600px] h-[600px] bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '12s' }} />
      </div>

      <header className="p-6 flex justify-between items-center relative z-10 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-8">
          <span className="font-display text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Kurt Edgar & Eirik
          </span>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/about/eirik"
              className="text-sm font-medium text-slate-600 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-400 transition-colors"
              data-testid="nav-about-eirik"
            >
              About Eirik
            </Link>
            <Link
              to="/about/kurt-edgar"
              className="text-sm font-medium text-slate-600 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-400 transition-colors"
              data-testid="nav-about-kurt"
            >
              About Kurt Edgar
            </Link>
            <Link
              to="/beer-calculator"
              className="text-sm font-medium text-slate-600 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-400 transition-colors"
              data-testid="nav-beer-calc"
            >
              Beer Calculator
            </Link>
            <Link
              to="/games"
              className="text-sm font-medium text-slate-600 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-400 transition-colors"
              data-testid="nav-gaming"
            >
              Gaming
            </Link>
            <Link
              to="/studio"
              className="text-sm font-medium text-slate-600 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-400 transition-colors"
              data-testid="nav-studio"
            >
              The Studio
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link
            to="/admin"
            className="text-sm font-medium text-slate-400 hover:text-purple-500 dark:hover:text-purple-400 transition-colors"
            data-testid="nav-admin"
          >
            Admin
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-6">
        <div className="max-w-6xl w-full text-center space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-6"
          >
            <h1 className="text-6xl md:text-8xl font-bold font-display tracking-tight leading-[0.9] text-slate-900 dark:text-white">
              <span className="block hover:scale-105 transition-transform duration-500 cursor-default">KURT EDGAR</span>
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent block hover:scale-105 transition-transform duration-500 cursor-default">
                & EIRIK'S
              </span>
              <span className="block hover:scale-105 transition-transform duration-500 cursor-default">PLAYGROUND</span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto font-light leading-relaxed">
              Welcome to our creative hub! Explore who we are, challenge yourself with games,
              or jump into The Studio to create something extraordinary.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16"
          >
            <SectionCard
              to="/about/eirik"
              icon={<User className="w-8 h-8 text-blue-500" />}
              title="About Eirik"
              description="Meet Eirik, the code wizard behind the magic"
              gradient="from-blue-500 to-cyan-500"
              testId="card-about-eirik"
            />

            <SectionCard
              to="/about/kurt-edgar"
              icon={<Users className="w-8 h-8 text-pink-500" />}
              title="About Kurt Edgar"
              description="Discover Kurt Edgar's creative vision"
              gradient="from-pink-500 to-purple-500"
              testId="card-about-kurt"
            />

            <SectionCard
              to="/games"
              icon={<Gamepad2 className="w-8 h-8 text-purple-500" />}
              title="Gaming"
              description="Play, compete, and have fun in our arcade"
              gradient="from-purple-500 to-violet-500"
              testId="card-gaming"
            />

            <SectionCard
              to="/studio"
              icon={<Sparkles className="w-8 h-8 text-yellow-500" />}
              title="The Studio"
              description="Create chaotic collages and visual masterpieces"
              gradient="from-yellow-500 to-orange-500"
              featured
              testId="card-studio"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="pt-8"
          >
            <p className="text-slate-500 dark:text-slate-500 text-sm flex items-center justify-center gap-2">
              <Palette className="w-4 h-4" />
              Built with passion by Kurt Edgar and Eirik
              <Code className="w-4 h-4" />
            </p>
          </motion.div>
        </div>
      </main>

      <footer className="relative z-10 p-8 text-center text-slate-500 dark:text-slate-500 text-sm">
        <p>© {new Date().getFullYear()} Kurt Edgar & Eirik's Playground. v{__APP_VERSION__}</p>
      </footer>
    </div>
  );
};

interface SectionCardProps {
  to: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
  featured?: boolean;
  testId?: string;
}

const SectionCard = ({ to, icon, title, description, gradient, featured, testId }: SectionCardProps) => (
  <Link to={to} data-testid={testId}>
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        relative p-6 rounded-3xl backdrop-blur-md border transition-all h-full
        ${featured
          ? 'bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30 shadow-xl shadow-purple-500/10'
          : 'bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-purple-500/50'
        }
      `}
    >
      {featured && (
        <div className="absolute -top-3 -right-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
          Popular
        </div>
      )}

      <div className="mb-4 inline-flex p-3 rounded-2xl bg-white dark:bg-slate-800 shadow-sm">
        {icon}
      </div>

      <h3 className="text-xl font-bold mb-2 font-display text-slate-900 dark:text-white">
        {title}
      </h3>

      <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
        {description}
      </p>

      <div className="flex items-center gap-2 text-sm font-semibold">
        <span className={`bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
          Explore
        </span>
        <ArrowRight className="w-4 h-4 text-slate-400" />
      </div>
    </motion.div>
  </Link>
);
