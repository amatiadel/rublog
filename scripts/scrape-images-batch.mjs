#!/usr/bin/env node
/**
 * Batch Image Scraper for Blog Posts
 * 
 * Processes multiple blog posts and adds images to those missing them.
 * Usage: node scripts/scrape-images-batch.mjs [options]
 * 
 * Options:
 *   --dir <path>      Directory to scan (default: src/content/blog)
 *   --dry-run         Test mode - don't download images
 *   --missing-only    Only process posts without images
 *   --limit <n>       Process max n posts
 *   --verbose         Detailed logging
 */

import { readdir, readFile, access } from 'fs/promises';
import { join, basename } from 'path';
import { execSync } from 'child_process';

const CONFIG = {
  postsDir: './src/content/blog',
  uploadsDir: './public/uploads',
};

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return null;
  
  const frontmatter = match[1];
  const meta = {};
  const lines = frontmatter.split('\n');
  
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      let value = line.slice(colonIndex + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      meta[key] = value;
    }
  }
  
  return meta;
}

async function getPostsWithoutImages(dir) {
  const files = await readdir(dir);
  const mdFiles = files.filter(f => f.endsWith('.md'));
  
  const postsWithoutImages = [];
  const postsWithImages = [];
  
  for (const file of mdFiles) {
    const filePath = join(dir, file);
    const content = await readFile(filePath, 'utf-8');
    const meta = extractFrontmatter(content);
    
    if (!meta) continue;
    
    if (!meta.image || meta.image === '') {
      postsWithoutImages.push({
        file,
        path: filePath,
        title: meta.title || file,
        description: meta.description || ''
      });
    } else {
      // Check if image file actually exists
      const imagePath = join(CONFIG.uploadsDir, meta.image.replace('/uploads/', ''));
      try {
        await access(imagePath);
        postsWithImages.push({ file, title: meta.title, image: meta.image });
      } catch {
        // Image referenced but file doesn't exist
        postsWithoutImages.push({
          file,
          path: filePath,
          title: meta.title || file,
          description: meta.description || '',
          missingFile: meta.image
        });
      }
    }
  }
  
  return { postsWithoutImages, postsWithImages };
}

async function main() {
  const args = process.argv.slice(2);
  
  const dryRun = args.includes('--dry-run');
  const missingOnly = args.includes('--missing-only');
  const verbose = args.includes('--verbose');
  
  const dirIndex = args.indexOf('--dir');
  const postsDir = dirIndex !== -1 ? args[dirIndex + 1] : CONFIG.postsDir;
  
  const limitIndex = args.indexOf('--limit');
  const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1]) : Infinity;
  
  log(`\n📦 Batch Image Scraper`, 'cyan');
  log(`═══════════════════════\n`);
  
  try {
    const { postsWithoutImages, postsWithImages } = await getPostsWithoutImages(postsDir);
    
    log(`📊 Found ${postsWithImages.length} posts with images`, 'green');
    log(`📊 Found ${postsWithoutImages.length} posts missing images`, postsWithoutImages.length > 0 ? 'yellow' : 'green');
    
    if (postsWithoutImages.length === 0) {
      log(`\n✅ All posts have images!`, 'green');
      process.exit(0);
    }
    
    log(`\n📋 Posts needing images:\n`, 'blue');
    postsWithoutImages.forEach((post, i) => {
      const marker = post.missingFile ? '❌' : '⚠️';
      log(`   ${i + 1}. ${marker} ${post.title.slice(0, 50)}${post.title.length > 50 ? '...' : ''}`, 'cyan');
      if (verbose) {
        log(`      File: ${post.file}`, 'reset');
        if (post.missingFile) {
          log(`      Missing: ${post.missingFile}`, 'red');
        }
      }
    });
    
    if (dryRun) {
      log(`\n🔍 Dry run - no changes made`, 'yellow');
      process.exit(0);
    }
    
    // Process posts
    const toProcess = postsWithoutImages.slice(0, limit);
    log(`\n🚀 Processing ${toProcess.length} post(s)...\n`, 'blue');
    
    let success = 0;
    let failed = 0;
    
    for (let i = 0; i < toProcess.length; i++) {
      const post = toProcess[i];
      log(`[${i + 1}/${toProcess.length}] Processing: ${post.title.slice(0, 40)}...`, 'cyan');
      
      try {
        const cmd = `node scripts/scrape-image.mjs "${post.path}"`;
        const output = execSync(cmd, { encoding: 'utf-8', timeout: 120000 });
        
        if (verbose) {
          console.log(output);
        } else {
          // Extract just the success message
          const lines = output.split('\n').filter(l => 
            l.includes('✅') || l.includes('✨') || l.includes('❌')
          );
          lines.forEach(l => console.log('   ' + l.trim()));
        }
        
        success++;
      } catch (error) {
        log(`   ❌ Failed: ${error.message}`, 'red');
        if (verbose) {
          console.error(error.stderr || error.message);
        }
        failed++;
      }
      
      // Small delay between requests
      if (i < toProcess.length - 1) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }
    
    log(`\n═══════════════════════`, 'cyan');
    log(`✅ Success: ${success}`, 'green');
    if (failed > 0) {
      log(`❌ Failed: ${failed}`, 'red');
    }
    
    if (success > 0) {
      log(`\n📋 Don't forget to commit the new images!`, 'blue');
      log(`   git add public/uploads/`, 'cyan');
      log(`   git add ${postsDir}/`, 'cyan');
      log(`   git commit -m "Add images for ${success} blog posts"`, 'cyan');
    }
    
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    if (verbose) {
      console.error(error);
    }
    process.exit(1);
  }
}

main();
