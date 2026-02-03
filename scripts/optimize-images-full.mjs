#!/usr/bin/env node
/**
 * Comprehensive image optimization script
 * - Backs up original files with .original extension
 * - Converts to WebP with 80% quality
 * - Resizes images >1200px width
 * - Updates markdown files to reference WebP versions
 */

import sharp from 'sharp';
import { readdir, stat, rename, readFile, writeFile } from 'fs/promises';
import { join, basename, extname } from 'path';

const UPLOADS_DIR = './public/uploads';
const BLOG_DIR = './src/content/blog';
const MAX_WIDTH = 1200;
const QUALITY = 80;
const MAX_SIZE_KB = 200;

const stats = {
  processed: 0,
  skipped: 0,
  backedUp: 0,
  markdownUpdated: 0,
  originalSize: 0,
  newSize: 0,
  errors: []
};

async function getFileSize(filePath) {
  const s = await stat(filePath);
  return s.size;
}

async function optimizeImage(filePath) {
  const ext = extname(filePath).toLowerCase();
  const baseName = basename(filePath, ext);
  const webpPath = join(UPLOADS_DIR, `${baseName}.webp`);
  const backupPath = `${filePath}.original`;
  
  // Only process jpg, jpeg, png
  if (!['.jpg', '.jpeg', '.png'].includes(ext)) {
    return null;
  }

  try {
    const originalSize = await getFileSize(filePath);
    stats.originalSize += originalSize;

    // Check if already backed up
    try {
      await stat(backupPath);
      console.log(`  ℹ Already backed up: ${basename(filePath)}`);
    } catch {
      // Backup original
      await rename(filePath, backupPath);
      stats.backedUp++;
      console.log(`  ✓ Backed up: ${basename(filePath)} → ${basename(backupPath)}`);
    }

    // Check if WebP already exists and is small enough
    let webpExists = false;
    let webpSize = 0;
    try {
      webpSize = await getFileSize(webpPath);
      if (webpSize < MAX_SIZE_KB * 1024) {
        webpExists = true;
        console.log(`  ℹ WebP exists and is optimized: ${(webpSize/1024).toFixed(1)}KB`);
      }
    } catch {}

    if (!webpExists) {
      // Process image
      const image = sharp(backupPath);
      const metadata = await image.metadata();
      
      let pipeline = image;
      
      // Resize if too large
      if (metadata.width > MAX_WIDTH) {
        pipeline = pipeline.resize(MAX_WIDTH, null, { withoutEnlargement: true });
        console.log(`  ↳ Resized from ${metadata.width}px to max ${MAX_WIDTH}px`);
      }
      
      // Convert to WebP
      await pipeline.webp({ quality: QUALITY }).toFile(webpPath);
      webpSize = await getFileSize(webpPath);
      console.log(`  ✓ Created WebP: ${(webpSize/1024).toFixed(1)}KB`);
    }

    stats.newSize += webpSize;
    stats.processed++;
    
    return {
      original: basename(filePath),
      webp: `${baseName}.webp`,
      originalSize,
      webpSize
    };
  } catch (error) {
    console.error(`  ✗ Error: ${error.message}`);
    stats.errors.push({ file: filePath, error: error.message });
    return null;
  }
}

async function updateMarkdownFiles(imageMap) {
  const files = await readdir(BLOG_DIR);
  const mdFiles = files.filter(f => f.endsWith('.md'));
  
  for (const mdFile of mdFiles) {
    const mdPath = join(BLOG_DIR, mdFile);
    let content = await readFile(mdPath, 'utf-8');
    let modified = false;
    
    for (const { original, webp } of imageMap) {
      const originalBase = original.replace(/\.[^.]+$/, '');
      const originalExt = original.match(/\.[^.]+$/)[0];
      
      // Replace references to original file with webp
      // Match patterns like /uploads/filename.jpg or /uploads/filename.png
      const patterns = [
        new RegExp(`(/uploads/${originalBase})\\${originalExt}`, 'g'),
        new RegExp(`(/uploads/${originalBase})\\.jpg`, 'gi'),
        new RegExp(`(/uploads/${originalBase})\\.jpeg`, 'gi'),
        new RegExp(`(/uploads/${originalBase})\\.png`, 'gi'),
      ];
      
      for (const pattern of patterns) {
        if (pattern.test(content)) {
          content = content.replace(pattern, `$1.webp`);
          modified = true;
          console.log(`  ✓ Updated ${mdFile}: ${original} → ${webp}`);
        }
      }
    }
    
    if (modified) {
      await writeFile(mdPath, content, 'utf-8');
      stats.markdownUpdated++;
    }
  }
}

async function processDirectory(dir) {
  const files = await readdir(dir);
  const imageMap = [];
  
  for (const file of files) {
    const filePath = join(dir, file);
    const stats = await stat(filePath);
    
    if (stats.isDirectory()) {
      continue; // Skip subdirectories
    } else {
      const result = await optimizeImage(filePath);
      if (result) {
        imageMap.push(result);
      }
    }
  }
  
  return imageMap;
}

console.log('='.repeat(60));
console.log('IMAGE OPTIMIZATION SCRIPT');
console.log('='.repeat(60));
console.log(`Max width: ${MAX_WIDTH}px`);
console.log(`WebP quality: ${QUALITY}%`);
console.log(`Max target size: ${MAX_SIZE_KB}KB`);
console.log('='.repeat(60));
console.log();

// Process images
console.log('Step 1: Optimizing images...');
console.log('-'.repeat(60));
const imageMap = await processDirectory(UPLOADS_DIR);

console.log();
console.log('Step 2: Updating markdown files...');
console.log('-'.repeat(60));
await updateMarkdownFiles(imageMap);

console.log();
console.log('='.repeat(60));
console.log('OPTIMIZATION COMPLETE');
console.log('='.repeat(60));
console.log(`Images processed: ${stats.processed}`);
console.log(`Originals backed up: ${stats.backedUp}`);
console.log(`Markdown files updated: ${stats.markdownUpdated}`);
console.log(`Errors: ${stats.errors.length}`);
console.log();
console.log('SIZE COMPARISON:');
console.log(`  Original total: ${(stats.originalSize/1024/1024).toFixed(2)} MB`);
console.log(`  WebP total:     ${(stats.newSize/1024/1024).toFixed(2)} MB`);
console.log(`  Savings:        ${((stats.originalSize - stats.newSize)/1024/1024).toFixed(2)} MB (${((1 - stats.newSize/stats.originalSize) * 100).toFixed(1)}%)`);
console.log('='.repeat(60));

if (stats.errors.length > 0) {
  console.log();
  console.log('ERRORS:');
  for (const { file, error } of stats.errors) {
    console.log(`  ${file}: ${error}`);
  }
}

// Write detailed report
const report = `# Image Optimization Report

Generated: ${new Date().toISOString()}

## Summary

| Metric | Value |
|--------|-------|
| Images Processed | ${stats.processed} |
| Originals Backed Up | ${stats.backedUp} |
| Markdown Files Updated | ${stats.markdownUpdated} |
| Errors | ${stats.errors.length} |

## Size Comparison

| Type | Total Size |
|------|------------|
| Original (JPG/PNG) | ${(stats.originalSize/1024/1024).toFixed(2)} MB |
| Optimized (WebP) | ${(stats.newSize/1024/1024).toFixed(2)} MB |
| **Savings** | **${((stats.originalSize - stats.newSize)/1024/1024).toFixed(2)} MB** (${((1 - stats.newSize/stats.originalSize) * 100).toFixed(1)}%) |

## Processing Details

${imageMap.map(img => `- ${img.original}: ${(img.originalSize/1024).toFixed(1)}KB → ${(img.webpSize/1024).toFixed(1)}KB (${((1 - img.webpSize/img.originalSize) * 100).toFixed(1)}% reduction)`).join('\n')}

${stats.errors.length > 0 ? `## Errors\n\n${stats.errors.map(e => `- ${e.file}: ${e.error}`).join('\n')}` : ''}
`;

await writeFile('/root/syncthing/AdelVault/BOT_INBOX/blog_agents/image_optimization_report.md', report, 'utf-8');
console.log();
console.log('Report saved to: /root/syncthing/AdelVault/BOT_INBOX/blog_agents/image_optimization_report.md');
