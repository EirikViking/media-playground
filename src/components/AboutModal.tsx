import { motion, AnimatePresence } from 'framer-motion';
import { X, Palette, Camera, Zap, Heart } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal = ({ isOpen, onClose }: AboutModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-all"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative border border-slate-200 dark:border-slate-800">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-6 h-6 text-slate-500" />
              </button>

              <div className="p-8 md:p-12">
                <div className="text-center mb-10">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                    className="w-24 h-24 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg"
                  >
                    <Palette className="w-12 h-12 text-white" />
                  </motion.div>
                  <h2 className="text-4xl font-bold font-display mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Kurt Edgar's Gallery
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 text-lg">
                    Where chaos meets creativity.
                  </p>
                </div>

                <div className="space-y-8">
                  <div className="prose dark:prose-invert mx-auto">
                    <p className="text-center italic text-slate-500 text-lg mb-8">
                      "I didn't choose the glitch life, the glitch life chose me." - Kurt Edgar
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Feature 
                      icon={<Camera className="w-6 h-6 text-blue-500" />}
                      title="Visuals"
                      desc="Stunning clarity (mostly)."
                    />
                    <Feature 
                      icon={<Zap className="w-6 h-6 text-yellow-500" />}
                      title="Speed"
                      desc="Faster than a caffeinated squirrel."
                    />
                    <Feature 
                      icon={<Heart className="w-6 h-6 text-red-500" />}
                      title="Passion"
                      desc="Built with 110% heart."
                    />
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <h3 className="text-lg font-semibold mb-2">About the Artist</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                      Kurt Edgar is a digital nomad, pixel wrangler, and part-time philosopher. This gallery represents the culmination of 3 minutes of intense brainstorming and a lifetime of appreciation for the color purple.
                    </p>
                    <div className="flex justify-center">
                      <button 
                        onClick={onClose}
                        className="text-purple-600 font-medium hover:text-purple-700 hover:underline"
                      >
                       Start Exploring →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const Feature = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <div className="text-center p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
      {icon}
    </div>
    <h3 className="font-semibold mb-1">{title}</h3>
    <p className="text-sm text-slate-500 dark:text-slate-400">{desc}</p>
  </div>
);
