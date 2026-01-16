import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDir = join(__dirname, '..', 'public');

const sizes = [
  { name: 'favicon-16.png', size: 16 },
  { name: 'favicon-32.png', size: 32 },
  { name: 'favicon-192.png', size: 192 },
  { name: 'favicon-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 }
];

async function generateFavicons() {
  const inputPath = join(publicDir, 'logo.png');
  
  for (const { name, size } of sizes) {
    await sharp(inputPath)
      .resize(size, size)
      .png()
      .toFile(join(publicDir, name));
    console.log(`Generated ${name}`);
  }
  
  // Generate ICO-like favicon (32x32 PNG as favicon.png)
  await sharp(inputPath)
    .resize(32, 32)
    .png()
    .toFile(join(publicDir, 'favicon.png'));
  console.log('Generated favicon.png');
  
  console.log('All favicons generated!');
}

generateFavicons().catch(console.error);
