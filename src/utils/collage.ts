import { MediaItem } from '../types';

export const generateCollage = async (
  items: MediaItem[],
  width: number = 1200,
  height: number = 800
): Promise<string> => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  const imageItems = items.filter(item => item.type === 'image');
  if (imageItems.length === 0) {
    ctx.fillStyle = '#9ca3af';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No images to create collage', width / 2, height / 2);
    return canvas.toDataURL('image/png');
  }

  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  };

  const images = await Promise.all(
    imageItems.slice(0, 9).map(item => loadImage(item.url))
  );

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
    ctx.beginPath();
    ctx.rect(x, y, cellWidth, cellHeight);
    ctx.clip();
    ctx.drawImage(img, x + offsetX, y + offsetY, scaledWidth, scaledHeight);
    ctx.restore();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, cellWidth, cellHeight);
  });

  return canvas.toDataURL('image/png');
};

export const downloadImage = (dataUrl: string, filename: string = 'collage.png'): void => {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
};
