import { useState } from 'react';
import { MediaItem } from '../types';
import { generateCollage, downloadImage } from '../utils/collage';
import { Button } from './Button';

interface CollageCreatorProps {
  items: MediaItem[];
}

export const CollageCreator = ({ items }: CollageCreatorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (items.length === 0) return;

    setIsGenerating(true);
    try {
      const collageUrl = await generateCollage(items);
      setPreviewUrl(collageUrl);
    } catch (error) {
      console.error('Failed to generate collage:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (previewUrl) {
      downloadImage(previewUrl, `collage-${Date.now()}.png`);
    }
  };

  const imageCount = items.filter(item => item.type === 'image').length;

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-8 border border-purple-200 dark:border-purple-800">
      <div className="flex items-center gap-3 mb-6">
        <div className="text-4xl">✨</div>
        <div>
          <h2 className="text-2xl font-bold">Create Something Fun</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Generate a beautiful collage from your images
          </p>
        </div>
      </div>

      {imageCount === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p>Add some images to create a collage</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {imageCount} image{imageCount !== 1 ? 's' : ''} available
            </p>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="min-w-32"
            >
              {isGenerating ? 'Generating...' : 'Generate Collage'}
            </Button>
          </div>

          {previewUrl && (
            <div className="space-y-4 animate-scale-in">
              <div className="rounded-lg overflow-hidden border-4 border-white dark:border-gray-700 shadow-xl">
                <img
                  src={previewUrl}
                  alt="Generated collage"
                  className="w-full h-auto"
                />
              </div>
              <div className="flex gap-3">
                <Button onClick={handleDownload} className="flex-1">
                  Download Collage
                </Button>
                <Button
                  onClick={handleGenerate}
                  variant="secondary"
                  disabled={isGenerating}
                  className="flex-1"
                >
                  Regenerate
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
