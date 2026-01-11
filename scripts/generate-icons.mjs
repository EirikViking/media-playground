import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import { join } from 'path';

const PUBLIC_DIR = 'public';
const ICONS_DIR = join(PUBLIC_DIR, 'icons');
const SOURCE_IMAGE = join(PUBLIC_DIR, 'eirik-pixel.jpg');

const sizes = [
  { size: 192, name: 'icon-192.png', maskable: false },
  { size: 512, name: 'icon-512.png', maskable: false },
  { size: 192, name: 'icon-192-maskable.png', maskable: true },
  { size: 512, name: 'icon-512-maskable.png', maskable: true },
];

async function generateIcons() {
  // Create icons directory if it doesn't exist
  await mkdir(ICONS_DIR, { recursive: true });

  for (const { size, name, maskable } of sizes) {
    const outputPath = join(ICONS_DIR, name);

    let processor = sharp(SOURCE_IMAGE);

    if (maskable) {
      // For maskable icons, add padding (safe zone)
      // Maskable icons should have 40% padding (20% on each side)
      const paddedSize = Math.round(size / 0.8);
      processor = processor
        .resize(paddedSize, paddedSize, { fit: 'contain', background: { r: 15, g: 23, b: 42, alpha: 1 } })
        .extract({ left: Math.round((paddedSize - size) / 2), top: Math.round((paddedSize - size) / 2), width: size, height: size });
    } else {
      processor = processor.resize(size, size, { fit: 'cover' });
    }

    await processor.png().toFile(outputPath);
    console.log(`✓ Generated ${name} (${size}x${size}${maskable ? ' maskable' : ''})`);
  }

  console.log('\n✓ All icons generated successfully!');
}

generateIcons().catch(console.error);
