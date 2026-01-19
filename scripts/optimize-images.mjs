#!/usr/bin/env node
/**
 * Image optimization script for blog uploads
 * Compresses images and converts to WebP format
 */

import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';

const UPLOADS_DIR = './public/uploads';
const MAX_WIDTH = 1200;
const QUALITY = 80;

async function optimizeImage(filePath) {
  try {
    const ext = filePath.toLowerCase();
    if (!ext.match(/\.(jpg|jpeg|png)$/)) return;

    console.log(`Optimizing: ${filePath}`);
    
    const image = sharp(filePath);
    const metadata = await image.metadata();
    
    // Resize if too large
    if (metadata.width > MAX_WIDTH) {
      await image
        .resize(MAX_WIDTH, null, { withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toFile(filePath.replace(/\.(jpg|jpeg|png)$/i, '.webp'));
      
      console.log(`✓ Created WebP version`);
    } else {
      await image
        .webp({ quality: QUALITY })
        .toFile(filePath.replace(/\.(jpg|jpeg|png)$/i, '.webp'));
      
      console.log(`✓ Converted to WebP`);
    }
  } catch (error) {
    console.error(`✗ Error optimizing ${filePath}:`, error.message);
  }
}

async function processDirectory(dir) {
  const files = await readdir(dir);
  
  for (const file of files) {
    const filePath = join(dir, file);
    const stats = await stat(filePath);
    
    if (stats.isDirectory()) {
      await processDirectory(filePath);
    } else {
      await optimizeImage(filePath);
    }
  }
}

console.log('Starting image optimization...\n');
await processDirectory(UPLOADS_DIR);
console.log('\n✓ Image optimization complete!');
