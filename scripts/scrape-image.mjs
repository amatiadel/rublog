#!/usr/bin/env node
/**
 * Image Scraper for Blog Posts
 * 
 * This script automatically finds and downloads relevant images for blog posts.
 * Usage: node scripts/scrape-image.mjs <path-to-post.md> [options]
 * 
 * Options:
 *   --dry-run    Test mode - searches but doesn't download
 *   --force      Overwrite existing image
 *   --verbose    Detailed logging
 */

import { readFile, writeFile, access, stat } from 'fs/promises';
import { execSync } from 'child_process';
import { join, basename, extname } from 'path';
import { randomBytes } from 'crypto';

// Configuration
const CONFIG = {
  uploadsDir: './public/uploads',
  minImageSize: 2048, // 2KB minimum
  maxWidth: 1200,
  quality: 85,
  unsplashAccessKey: process.env.UNSPLASH_ACCESS_KEY || null,
};

// Colors for terminal output
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
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;
  
  const frontmatter = match[1];
  const body = match[2];
  
  // Parse frontmatter into object
  const meta = {};
  const lines = frontmatter.split('\n');
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      let value = line.slice(colonIndex + 1).trim();
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      meta[key] = value;
    }
  }
  
  return { meta, body, frontmatterRaw: match[1] };
}

function generateImageFilename(title, slug) {
  // Create URL-friendly filename from title or slug
  const base = slug || title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 50);
  
  // Add random suffix to avoid collisions
  const suffix = randomBytes(4).toString('hex').slice(0, 8);
  return `${base}-${suffix}.webp`;
}

async function searchUnsplash(query) {
  try {
    log(`🔍 Searching Unsplash for: "${query}"`, 'cyan');
    
    // Use curl to search Unsplash API
    const searchUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=10&orientation=landscape`;
    
    let curlCmd;
    if (CONFIG.unsplashAccessKey) {
      curlCmd = `curl -s -H "Authorization: Client-ID ${CONFIG.unsplashAccessKey}" "${searchUrl}"`;
    } else {
      // Fallback: search without API key (limited, for public images)
      curlCmd = `curl -s "https://unsplash.com/napi/search/photos?query=${encodeURIComponent(query)}&per_page=10&orientation=landscape"`;
    }
    
    const result = execSync(curlCmd, { encoding: 'utf-8', timeout: 30000 });
    const data = JSON.parse(result);
    
    if (data.results && data.results.length > 0) {
      // Return the first suitable image
      for (const photo of data.results) {
        if (photo.urls && photo.urls.regular) {
          return {
            url: photo.urls.regular,
            thumb: photo.urls.small,
            alt: photo.alt_description || query,
            author: photo.user?.name || 'Unsplash',
            downloadUrl: photo.links?.download_location || photo.urls.full
          };
        }
      }
    }
    
    return null;
  } catch (error) {
    log(`⚠️ Unsplash search failed: ${error.message}`, 'yellow');
    return null;
  }
}

async function searchImage(query) {
  // Try Unsplash first
  let result = await searchUnsplash(query);
  if (result) {
    log(`✅ Found image on Unsplash by ${result.author}`, 'green');
    return result;
  }
  
  // Fallback: Try Pexels
  try {
    log(`🔍 Trying Pexels...`, 'cyan');
    const pexelsKey = process.env.PEXELS_API_KEY;
    if (pexelsKey) {
      const curlCmd = `curl -s -H "Authorization: ${pexelsKey}" "https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape"`;
      const result = execSync(curlCmd, { encoding: 'utf-8', timeout: 30000 });
      const data = JSON.parse(result);
      
      if (data.photos && data.photos.length > 0) {
        const photo = data.photos[0];
        return {
          url: photo.src.large,
          thumb: photo.src.medium,
          alt: query,
          author: photo.photographer,
          source: 'Pexels'
        };
      }
    }
  } catch (error) {
    log(`⚠️ Pexels search failed`, 'yellow');
  }
  
  // Last resort: Try direct Unsplash source URLs (unsplash.com/s/photos/)
  try {
    log(`🔍 Trying direct Unsplash search...`, 'cyan');
    const searchPage = `https://unsplash.com/s/photos/${encodeURIComponent(query.replace(/\s+/g, '-'))}`;
    // We can't easily parse HTML, so we'll use a predefined fallback approach
    // by generating a likely direct image URL pattern
    return null;
  } catch (error) {
    // Silently fail
  }
  
  return null;
}

async function downloadImage(url, outputPath) {
  try {
    log(`⬇️ Downloading image...`, 'blue');
    
    // Use curl to download
    const curlCmd = `curl -sL -o "${outputPath}.tmp" "${url}" --max-time 30`;
    execSync(curlCmd, { timeout: 35000 });
    
    // Check file size
    const stats = await stat(`${outputPath}.tmp`);
    if (stats.size < CONFIG.minImageSize) {
      throw new Error(`Downloaded image too small (${stats.size} bytes)`);
    }
    
    log(`✅ Downloaded ${(stats.size / 1024).toFixed(1)}KB`, 'green');
    return `${outputPath}.tmp`;
  } catch (error) {
    throw new Error(`Download failed: ${error.message}`);
  }
}

async function convertToWebp(inputPath, outputPath) {
  try {
    log(`🔄 Converting to WebP...`, 'blue');
    
    // Use ImageMagick convert - escape > properly for shell
    const convertCmd = `convert "${inputPath}" -resize '${CONFIG.maxWidth}x${CONFIG.maxWidth}>' -quality ${CONFIG.quality} "${outputPath}"`;
    execSync(convertCmd, { timeout: 30000, shell: '/bin/bash' });
    
    // Check output file
    const stats = await stat(outputPath);
    if (stats.size < CONFIG.minImageSize) {
      throw new Error(`Converted image too small (${stats.size} bytes)`);
    }
    
    log(`✅ Created WebP: ${(stats.size / 1024).toFixed(1)}KB`, 'green');
    return outputPath;
  } catch (error) {
    throw new Error(`Conversion failed: ${error.message}`);
  }
}

async function cleanup(tempPath) {
  try {
    if (tempPath) {
      execSync(`rm -f "${tempPath}"`, { stdio: 'ignore' });
    }
  } catch {
    // Ignore cleanup errors
  }
}

function extractKeywords(meta, body) {
  const keywords = [];
  
  // Extract from title
  if (meta.title) {
    // Clean up title - remove quotes and common words
    const cleanTitle = meta.title
      .replace(/['"""]/g, '')
      .replace(/:\s*.*$/, '') // Remove subtitle after colon
      .trim();
    keywords.push(cleanTitle);
  }
  
  // Extract from tags if available
  if (meta.tags) {
    try {
      // Parse array format: ["tag1", "tag2"]
      const tags = JSON.parse(meta.tags.replace(/'/g, '"'));
      if (Array.isArray(tags) && tags.length > 0) {
        keywords.push(tags.slice(0, 2).join(' '));
      }
    } catch {
      // If not JSON, treat as comma-separated
      const tags = meta.tags.split(/[,\[\]]/).map(t => t.trim()).filter(Boolean);
      if (tags.length > 0) {
        keywords.push(tags.slice(0, 2).join(' '));
      }
    }
  }
  
  // Extract from description
  if (meta.description) {
    const descWords = meta.description
      .split(' ')
      .slice(0, 5)
      .join(' ');
    keywords.push(descWords);
  }
  
  // Extract first H1 as fallback
  const h1Match = body.match(/^#\s+(.+)$/m);
  if (h1Match && !keywords.some(k => k.includes(h1Match[1]))) {
    keywords.push(h1Match[1].slice(0, 50));
  }
  
  return keywords;
}

async function updateFrontmatter(filePath, newImagePath, dryRun = false) {
  try {
    const content = await readFile(filePath, 'utf-8');
    const parsed = extractFrontmatter(content);
    
    if (!parsed) {
      throw new Error('Could not parse frontmatter');
    }
    
    const { meta, frontmatterRaw } = parsed;
    const oldImage = meta.image;
    
    // Generate new image path for frontmatter
    const imageFilename = basename(newImagePath);
    const newImageFrontmatter = `/uploads/${imageFilename}`;
    
    // Update frontmatter - handle both existing and empty image fields
    let newFrontmatter = frontmatterRaw;
    
    // Replace any existing image line (including empty ones)
    newFrontmatter = newFrontmatter.replace(
      /^(image:\s*["']?[^"'\n]*["']?)$/m,
      `image: "${newImageFrontmatter}"`
    );
    
    // If no image line was found, add it after description or title
    if (!newFrontmatter.includes(`image: "${newImageFrontmatter}"`)) {
      const insertAfter = meta.description ? 'description' : 'title';
      newFrontmatter = newFrontmatter.replace(
        new RegExp(`^(${insertAfter}:[^\n]+)$`, 'm'),
        `$1\nimage: "${newImageFrontmatter}"`
      );
    }
    
    const newContent = content.replace(frontmatterRaw, newFrontmatter);
    
    if (dryRun) {
      log(`🔍 Dry run - would update frontmatter:`, 'yellow');
      log(`   Old: ${oldImage || '(none)'}`, 'yellow');
      log(`   New: ${newImageFrontmatter}`, 'yellow');
      return;
    }
    
    await writeFile(filePath, newContent, 'utf-8');
    log(`✅ Updated frontmatter: ${oldImage || '(none)'} → ${newImageFrontmatter}`, 'green');
    
  } catch (error) {
    throw new Error(`Failed to update frontmatter: ${error.message}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: node scripts/scrape-image.mjs <path-to-post.md> [options]

Options:
  --dry-run    Test mode - searches but doesn't download
  --force      Overwrite existing image  
  --verbose    Detailed logging
  --query      Override search query (e.g., --query "business automation")

Examples:
  node scripts/scrape-image.mjs src/content/blog/my-post.md
  node scripts/scrape-image.mjs src/content/blog/my-post.md --dry-run
  node scripts/scrape-image.mjs src/content/blog/my-post.md --query "AI technology"
`);
    process.exit(0);
  }
  
  const postPath = args[0];
  const dryRun = args.includes('--dry-run');
  const force = args.includes('--force');
  const verbose = args.includes('--verbose');
  
  // Extract custom query if provided
  const queryIndex = args.indexOf('--query');
  const customQuery = queryIndex !== -1 ? args[queryIndex + 1] : null;
  
  log(`\n🖼️  Blog Image Scraper`, 'cyan');
  log(`═══════════════════════\n`);
  
  try {
    // Check if file exists
    await access(postPath);
    
    // Read and parse post
    const content = await readFile(postPath, 'utf-8');
    const parsed = extractFrontmatter(content);
    
    if (!parsed) {
      throw new Error('Could not parse frontmatter from post');
    }
    
    const { meta, body } = parsed;
    
    log(`📄 Post: ${basename(postPath)}`);
    log(`   Title: ${meta.title || '(no title)'}`);
    log(`   Current image: ${meta.image || '(none)'}\n`);
    
    // Check if image already exists
    if (meta.image && !force && !dryRun) {
      const existingPath = join(CONFIG.uploadsDir, basename(meta.image));
      try {
        await access(existingPath);
        log(`⚠️ Image already exists: ${meta.image}`, 'yellow');
        log(`   Use --force to overwrite\n`);
        process.exit(0);
      } catch {
        // File doesn't exist, continue
      }
    }
    
    // Extract search keywords
    const keywords = customQuery ? [customQuery] : extractKeywords(meta, body);
    
    if (verbose) {
      log(`🔍 Search keywords:`, 'blue');
      keywords.forEach(k => log(`   - ${k}`));
    }
    
    // Try each keyword until we find an image
    let imageResult = null;
    for (const keyword of keywords) {
      if (keyword.length < 3) continue;
      
      imageResult = await searchImage(keyword);
      if (imageResult) break;
    }
    
    if (!imageResult) {
      // Last attempt with simplified query
      const fallbackQuery = meta.title 
        ? meta.title.replace(/:\s*.*/, '').slice(0, 30)
        : 'technology business';
      
      log(`🔄 Trying fallback query: "${fallbackQuery}"`, 'yellow');
      imageResult = await searchImage(fallbackQuery);
    }
    
    if (!imageResult) {
      throw new Error('Could not find suitable image from any source');
    }
    
    if (dryRun) {
      log(`\n✅ Dry run complete - image found:`, 'green');
      log(`   URL: ${imageResult.url}`, 'green');
      log(`   Author: ${imageResult.author}`, 'green');
      log(`   Alt: ${imageResult.alt}`, 'green');
      process.exit(0);
    }
    
    // Generate filename
    const slug = basename(postPath, '.md');
    const filename = generateImageFilename(meta.title || slug, slug);
    const outputPath = join(CONFIG.uploadsDir, filename);
    
    // Download and convert
    let tempPath = null;
    try {
      tempPath = await downloadImage(imageResult.url, outputPath);
      await convertToWebp(tempPath, outputPath);
      
      // Update frontmatter
      await updateFrontmatter(postPath, outputPath, dryRun);
      
      log(`\n✨ Success! Image saved to: uploads/${filename}`, 'green');
      log(`   Full path: ${outputPath}`, 'cyan');
      
    } finally {
      await cleanup(tempPath);
    }
    
    // Suggest git commands
    log(`\n📋 Next steps:`, 'blue');
    log(`   git add "${outputPath}"`, 'cyan');
    log(`   git add "${postPath}"`, 'cyan');
    log(`   git commit -m "Add image for ${basename(postPath)}"`, 'cyan');
    
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    if (verbose) {
      console.error(error);
    }
    process.exit(1);
  }
}

main();
