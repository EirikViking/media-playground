import { MediaItem } from '../types';

type CollageStyle =
  | 'grid' | 'noir' | 'vaporwave' | 'glitch' | 'warm'
  | 'cool' | 'sepia' | 'pop' | 'matrix' | 'dream' | 'scrapbook';

export const STYLES: CollageStyle[] = [
  'grid', 'noir', 'vaporwave', 'glitch', 'warm',
  'cool', 'sepia', 'pop', 'matrix', 'dream', 'scrapbook'
];

export const generateCollage = async (
  items: MediaItem[],
  width: number = 1200,
  height: number = 800,
  style: CollageStyle = 'grid'
): Promise<string> => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Base Background
  ctx.fillStyle = '#1a1a1a';
  if (style === 'grid') ctx.fillStyle = '#ffffff';
  if (style === 'vaporwave') ctx.fillStyle = '#ff71ce';
  if (style === 'warm') ctx.fillStyle = '#fff4e6';
  if (style === 'cool') ctx.fillStyle = '#e6f4ff';

  ctx.fillRect(0, 0, width, height);

  // Filter for displayable items (images and videos with thumbnails)
  const visualItems = items.filter(item =>
    (item.type === 'image' && item.url) ||
    (item.type === 'video' && item.thumbUrl)
  );

  if (visualItems.length === 0) {
    // If we have audio but no visuals, make a cool audio waveform placeholder
    const hasAudio = items.some(i => i.type === 'audio');

    ctx.fillStyle = hasAudio ? '#1a1a1a' : '#9ca3af';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = hasAudio ? '#a855f7' : '#ffffff';
    ctx.font = 'bold 64px sans-serif';
    ctx.textAlign = 'center';

    if (hasAudio) {
      ctx.fillText('♫ Audio Mash', width / 2, height / 2);
    } else {
      ctx.fillText('No visual media', width / 2, height / 2);
    }
    return canvas.toDataURL('image/png');
  }

  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => {
        console.warn("Failed to load image for collage:", url);
        resolve(new Image()); // Return empty image
      };
      img.src = url;
    });
  };

  const images = (await Promise.all(
    visualItems.slice(0, 9).map(item => loadImage(item.type === 'video' ? item.thumbUrl! : item.url))
  )).filter(img => img.width > 0);


  if (style === 'scrapbook') {
    // Random placement
    images.forEach((img) => {
      ctx.save();
      const scale = Math.random() * 0.5 + 0.3;
      const x = Math.random() * (width - 200) + 100;
      const y = Math.random() * (height - 200) + 100;
      const rot = (Math.random() - 0.5) * 0.5;

      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 20;

      const w = img.width * scale;
      const h = img.height * scale;

      ctx.fillStyle = 'white';
      ctx.fillRect(-w / 2 - 10, -h / 2 - 10, w + 20, h + 20);
      ctx.drawImage(img, -w / 2, -h / 2, w, h);

      ctx.restore();
    });
  } else {
    // Grid Based with filters
    const cols = Math.ceil(Math.sqrt(images.length));
    const rows = Math.ceil(images.length / cols);
    const cellWidth = width / cols;
    const cellHeight = height / rows;

    images.forEach((img, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = col * cellWidth;
      const y = row * cellHeight;

      const scale = Math.max(cellWidth / img.width, cellHeight / img.height);
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      const offsetX = (cellWidth - scaledWidth) / 2;
      const offsetY = (cellHeight - scaledHeight) / 2;

      ctx.save();

      if (style === 'glitch') {
        ctx.translate(Math.random() * 10 - 5, Math.random() * 10 - 5);
      }

      ctx.beginPath();
      ctx.rect(x, y, cellWidth, cellHeight);
      ctx.clip();

      if (style === 'noir') ctx.filter = 'grayscale(100%) contrast(120%)';
      if (style === 'sepia') ctx.filter = 'sepia(100%)';
      if (style === 'pop') ctx.filter = 'saturate(200%) contrast(110%)';
      if (style === 'dream') ctx.filter = 'blur(1px) brightness(110%)';
      if (style === 'matrix') ctx.filter = 'hue-rotate(90deg) contrast(150%)';

      ctx.drawImage(img, x + offsetX, y + offsetY, scaledWidth, scaledHeight);

      // Overlays
      if (style === 'vaporwave') {
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = 'rgba(255, 0, 255, 0.2)';
        ctx.fillRect(x, y, cellWidth, cellHeight);
      }
      if (style === 'matrix') {
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
        ctx.fillRect(x, y, cellWidth, cellHeight);
      }

      ctx.restore();

      if (style === 'grid') {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.strokeRect(x, y, cellWidth, cellHeight);
      }
    });
  }

  // Post-processing global effects
  if (style === 'noir') {
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(0, 0, width, height);
  }

  return canvas.toDataURL('image/png');
};

export const downloadImage = (dataUrl: string, filename: string = 'collage.png'): void => {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
};
