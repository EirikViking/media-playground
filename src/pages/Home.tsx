import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Video, Image as ImageIcon, Zap, Gamepad2 } from 'lucide-react';
import { Button } from '../components/Button';
import { ThemeToggle } from '../components/ThemeToggle';
import { AboutModal } from '../components/AboutModal';

export const Home = () => {
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden relative selection:bg-purple-500/30">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[800px] h-[800px] bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-[40%] -left-[10%] w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute -bottom-[20%] right-[20%] w-[600px] h-[600px] bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '12s' }} />
      </div>

      <header className="p-6 flex justify-between items-center relative z-10 max-w-7xl mx-auto w-full">
        <span className="font-display text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Kurt Edgar & Eirik
        </span>
        <ThemeToggle />
      </header>

      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-6">
        <div className="max-w-5xl w-full text-center space-y-8">
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

            <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
              Where pixels go to party. Create chaotic collages, organize your visual mess, and pretend it's art.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8"
          >
            <Link to="/studio">
              <Button size="lg" className="min-w-48 text-lg shadow-purple-500/25 shadow-2xl group">
                <Sparkles className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                Start Creating
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/games">
              <Button variant="secondary" size="lg" className="min-w-48 text-lg shadow-sm">
                <Gamepad2 className="w-5 h-5 mr-2" />
                Games Arcade
              </Button>
            </Link>
            <Button variant="ghost" size="lg" className="text-lg" onClick={() => setIsAboutOpen(true)}>
              Learn More
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20"
          >
            <FeatureCard
              icon={<ImageIcon className="w-8 h-8 text-blue-500" />}
              title="Visual Chaos"
              desc="Drag, drop, and destroy expectations."
            />
            <FeatureCard
              icon={<Video className="w-8 h-8 text-purple-500" />}
              title="Motion Magic"
              desc="Video support because static is boring."
            />
            <FeatureCard
              icon={<Zap className="w-8 h-8 text-pink-500" />}
              title="Instant Zen"
              desc="Chill mode. Works with your uploads too."
            />
          </motion.div>
        </div>
      </main>

      <footer className="relative z-10 p-8 text-center text-slate-500 dark:text-slate-500 text-sm">
        <p>© {new Date().getFullYear()} Kurt Edgar & Eirik's Playground. v{__APP_VERSION__}</p>
      </footer>

      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <motion.div
    whileHover={{ y: -5 }}
    className="p-8 rounded-3xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200 dark:border-slate-800 hover:border-purple-500/50 transition-colors shadow-lg hover:shadow-xl"
  >
    <div className="mb-4 inline-flex p-3 rounded-2xl bg-white dark:bg-slate-800 shadow-sm">
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-2 font-display">{title}</h3>
    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
      {desc}
    </p>
  </motion.div>
);

