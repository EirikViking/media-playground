import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { ThemeToggle } from '../components/ThemeToggle';

export const Home = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-6 flex justify-end">
        <ThemeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-4xl w-full text-center space-y-8 animate-fade-in">
          <div className="space-y-4 animate-slide-up">
            <h1 className="text-6xl md:text-7xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              Media Playground
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Create beautiful collages from your photos and videos.
              Everything stays local in your browser.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <Link to="/studio">
              <Button size="lg" className="min-w-48">
                Start Creating
              </Button>
            </Link>
            <Button variant="secondary" size="lg" className="min-w-48" onClick={() => {
              window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            }}>
              Learn More
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800">
              <div className="text-4xl mb-4">🎨</div>
              <h3 className="text-xl font-semibold mb-2">Creative Freedom</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Drag, drop, and arrange your media into stunning collages with ease.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-800">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold mb-2">Privacy First</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Your files never leave your device. Everything runs in your browser.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 border border-pink-200 dark:border-pink-800">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
              <p className="text-gray-600 dark:text-gray-400">
                No uploads, no waiting. Create and export instantly.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="p-6 text-center text-gray-500 dark:text-gray-500 text-sm">
        <p>Built with React, TypeScript, and Tailwind CSS</p>
      </footer>
    </div>
  );
};
