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

  // Helper to draw placeholder
  const getPlaceholder = (type: string, text: string = '?'): Promise<HTMLImageElement> => {
    return new Promise((resolve) => {
      const pCanvas = document.createElement('canvas');
      pCanvas.width = 400;
      pCanvas.height = 400;
      const pCtx = pCanvas.getContext('2d')!;

      // Pastel backgrounds
      if (type === 'audio') pCtx.fillStyle = '#fbcfe8'; // pink-200
      else if (type === 'video') pCtx.fillStyle = '#bae6fd'; // sky-200
      else pCtx.fillStyle = '#e2e8f0'; // slate-200

      pCtx.fillRect(0, 0, 400, 400);

      pCtx.fillStyle = '#475569';
      pCtx.font = 'bold 80px sans-serif';
      pCtx.textAlign = 'center';
      pCtx.textBaseline = 'middle';
      pCtx.fillText(type === 'audio' ? '♫' : (type === 'video' ? '▶' : text), 200, 200);

      const img = new Image();
      img.onload = () => resolve(img);
      img.src = pCanvas.toDataURL();
    });
  };

  const loadImage = (item: MediaItem): Promise<HTMLImageElement> => {
    const url = item.type === 'video' ? item.thumbUrl : item.url;
    if (!url) {
      return getPlaceholder(item.type);
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => {
        // Fallback to placeholder on error
        getPlaceholder(item.type).then(resolve);
      };
      img.src = url;
    });
  };

  // Prepare images (max 9)
  const displayItems = items.slice(0, 9);
  if (displayItems.length === 0) {
    const img = await getPlaceholder('empty', 'No Media');
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL('image/png');
  }

  const images = await Promise.all(displayItems.map(loadImage));

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
    // Gap-free Row Layout
    const count = images.length;
    let rowCount = 1;
    if (count >= 2) rowCount = 2;
    if (count >= 5) rowCount = 3;
    if (count >= 9) rowCount = 3;

    // Distribute items to rows
    const rows: HTMLImageElement[][] = Array.from({ length: rowCount }, () => []);
    images.forEach((img, i) => {
      rows[i % rowCount].push(img);
    });

    // Draw rows
    const rowHeight = height / rowCount;
    let currentY = 0;

    rows.forEach((rowImages, rIndex) => {
      // Adjust for last row to fill remaining pixel height precisely
      const thisRowHeight = (rIndex === rowCount - 1) ? (height - currentY) : rowHeight;
      const colWidth = width / rowImages.length;

      rowImages.forEach((img, cIndex) => {
        const x = cIndex * colWidth;
        const y = currentY;
        const w = (cIndex === rowImages.length - 1) ? (width - x) : colWidth;
        const h = thisRowHeight;

        // Crop logic (Object-fit: cover)
        const scale = Math.max(w / img.width, h / img.height);
        const scaledW = img.width * scale;
        const scaledH = img.height * scale;
        const offsetX = (w - scaledW) / 2;
        const offsetY = (h - scaledH) / 2;

        ctx.save();

        if (style === 'glitch') {
          ctx.translate(Math.random() * 10 - 5, Math.random() * 10 - 5);
        }

        // Clip to cell
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.clip();

        // Filters
        if (style === 'noir') ctx.filter = 'grayscale(100%) contrast(120%)';
        if (style === 'sepia') ctx.filter = 'sepia(100%)';
        if (style === 'pop') ctx.filter = 'saturate(200%) contrast(110%)';
        if (style === 'dream') ctx.filter = 'blur(1px) brightness(110%)';
        if (style === 'matrix') ctx.filter = 'hue-rotate(90deg) contrast(150%)';

        ctx.drawImage(img, x + offsetX, y + offsetY, scaledW, scaledH);

        // Overlays
        if (style === 'vaporwave') {
          ctx.globalCompositeOperation = 'screen';
          ctx.fillStyle = 'rgba(255, 0, 255, 0.2)';
          ctx.fillRect(x, y, w, h);
        }
        if (style === 'matrix') {
          ctx.globalCompositeOperation = 'overlay';
          ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
          ctx.fillRect(x, y, w, h);
        }

        ctx.restore();

        // Grid lines
        if (style === 'grid') {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 4;
          ctx.strokeRect(x, y, w, h);
        }
      });
      currentY += thisRowHeight;
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
