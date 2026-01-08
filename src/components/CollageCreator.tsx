import { useState } from 'react';
import { MediaItem } from '../types';
import { generateCollage, downloadImage } from '../utils/collage';
import { getRandomStory } from '../utils/chaos-story';
import { Button } from './Button';
import { Wand2, Download, RefreshCw, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface CollageCreatorProps {
  items: MediaItem[];
}

export const CollageCreator = ({ items }: CollageCreatorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [story, setStory] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (items.length === 0) return;

    setIsGenerating(true);
    setStory(null);
    try {
      const collageUrl = await generateCollage(items);
      setPreviewUrl(collageUrl);
      setStory(getRandomStory());
    } catch (error) {
      console.error('Failed to generate collage:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (previewUrl) {
      downloadImage(previewUrl, `kurt-edgar-chaos-${Date.now()}.png`);
    }
  };

  const imageCount = items.filter(item => item.type === 'image').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-3xl p-8 border border-white/50 dark:border-purple-800 shadow-xl backdrop-blur-sm"
    >
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6">
          <Sparkles className="w-8 h-8 text-pink-500" />
        </div>
        <div>
          <h2 className="text-3xl font-bold font-display bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Chaos Generator
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Turn your beautiful photos into art (or something like it).
          </p>
        </div>
      </div>

      {imageCount === 0 ? (
        <div className="text-center py-12 rounded-2xl border-2 border-dashed border-purple-200 dark:border-purple-800/50 bg-white/30 dark:bg-purple-900/10">
          <p className="text-slate-500 dark:text-slate-400">Add some images to unleash the chaos</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-slate-900/50 rounded-xl border border-white/50 dark:border-slate-800">
            <p className="font-medium text-slate-700 dark:text-slate-300">
              {imageCount} image{imageCount !== 1 ? 's' : ''} ready for mixing
            </p>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="min-w-40 shadow-purple-500/20"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Mixing...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate Chaos
                </>
              )}
            </Button>
          </div>

          {previewUrl && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="space-y-6"
            >
              <div className="relative">
                <div className="rounded-2xl overflow-hidden border-8 border-white dark:border-slate-800 shadow-2xl rotate-1 hover:rotate-0 transition-transform duration-500">
                  <img
                    src={previewUrl}
                    alt="Generated collage"
                    className="w-full h-auto"
                  />
                </div>
                {story && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -bottom-6 left-6 right-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-6 rounded-xl shadow-lg border border-purple-100 dark:border-purple-900"
                  >
                    <p className="text-lg font-display text-center italic text-slate-800 dark:text-slate-200">
                      "{story}"
                    </p>
                  </motion.div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-8">
                <Button onClick={handleDownload} className="flex-1 text-lg py-4" size="lg">
                  <Download className="w-5 h-5 mr-2" />
                  Download Masterpiece
                </Button>
                <Button
                  onClick={handleGenerate}
                  variant="secondary"
                  disabled={isGenerating}
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Remix Again
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
};
