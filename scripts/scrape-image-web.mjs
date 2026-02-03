#!/usr/bin/env node
/**
 * Enhanced Image Scraper using web search
 * Fallback method when APIs are limited or for more control
 * 
 * Usage: node scripts/scrape-image-web.mjs <path-to-post.md> [options]
 */

import { readFile, writeFile, access, stat, readdir } from 'fs/promises';
import { execSync } from 'child_process';
import { join, basename, extname } from 'path';
import { randomBytes } from 'crypto';

const CONFIG = {
  uploadsDir: './public/uploads',
  tempDir: '/tmp/blog-images',
  minImageSize: 2048,
  maxWidth: 1200,
  quality: 85,
};

const colors = {
  reset: '\x1b[0m', green: '\x1b[32m', yellow: '\x1b[33m',
  red: '\x1b[31m', blue: '\x1b[34m', cyan: '\x1b[36m',
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;
  
  const meta = {};
  const lines = match[1].split('\n');
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
  
  return { meta, body: match[2], frontmatterRaw: match[1] };
}

function extractKeywords(meta, body) {
  const keywords = [];
  
  if (meta.title) {
    keywords.push(meta.title.replace(/['"""]/g, '').replace(/:\s*.*$/, '').trim());
  }
  
  // Extract main topic from first H2
  const h2Match = body.match(/^##\s+(.+)$/m);
  if (h2Match) {
    keywords.push(h2Match[1].slice(0, 50));
  }
  
  // From tags
  if (meta.tags) {
    try {
      const tags = meta.tags.replace(/[\[\]]/g, '').split(',').map(t => t.trim().replace(/['"]/g, ''));
      if (tags.length > 0) {
        keywords.push(tags.slice(0, 2).join(' '));
      }
    } catch {}
  }
  
  return keywords;
}

async function searchWithBrave(query) {
  log(`🔍 Searching web for: "${query}"`, 'cyan');
  
  try {
    // Use brave CLI tool if available, otherwise try curl
    const searchUrl = `https://search.brave.com/api/suggest?q=${encodeURIComponent(query + ' free stock photo unsplash')}`;
    
    // For now, return common Unsplash patterns based on query
    // This is a fallback when APIs aren't available
    return null;
  } catch (error) {
    return null;
  }
}

async function downloadWithCurl(url, outputPath) {
  const cmd = `curl -sL -o "${outputPath}" "${url}" --max-time 30 -H "User-Agent: Mozilla/5.0"`;
  execSync(cmd, { timeout: 35000 });
  
  const stats = await stat(outputPath);
  if (stats.size < CONFIG.minImageSize) {
    throw new Error(`Image too small: ${stats.size} bytes`);
  }
  return stats.size;
}

async function convertToWebp(inputPath, outputPath) {
  const cmd = `convert "${inputPath}" -resize '${CONFIG.maxWidth}x${CONFIG.maxWidth}>' -quality ${CONFIG.quality} "${outputPath}"`;
  execSync(cmd, { timeout: 30000, shell: '/bin/bash' });
  
  const stats = await stat(outputPath);
  return stats.size;
}

function generateFilename(title, slug) {
  const base = (slug || title)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 50);
  const suffix = randomBytes(4).toString('hex').slice(0, 8);
  return `${base}-${suffix}.webp`;
}

async function updateFrontmatter(filePath, imagePath) {
  const content = await readFile(filePath, 'utf-8');
  const parsed = extractFrontmatter(content);
  
  const imageFilename = basename(imagePath);
  const newImage = `/uploads/${imageFilename}`;
  
  let newFrontmatter = parsed.frontmatterRaw;
  if (parsed.meta.image) {
    newFrontmatter = newFrontmatter.replace(
      new RegExp(`^image:\s*["']?[^"'\n]*["']?$`, 'm'),
      `image: "${newImage}"`
    );
  } else {
    const after = parsed.meta.description ? 'description' : 'title';
    newFrontmatter = newFrontmatter.replace(
      new RegExp(`^(${after}:[^\n]+)$`, 'm'),
      `$1\nimage: "${newImage}"`
    );
  }
  
  const newContent = content.replace(parsed.frontmatterRaw, newFrontmatter);
  await writeFile(filePath, newContent, 'utf-8');
}

// List of reliable direct Unsplash image URLs by category
const FALLBACK_IMAGES = {
  'technology': [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80',
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&q=80',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&q=80',
  ],
  'business': [
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80',
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1200&q=80',
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&q=80',
  ],
  'ai': [
    'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&q=80',
    'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200&q=80',
  ],
  'photo': [
    'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=1200&q=80',
    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1200&q=80',
  ],
  'marketing': [
    'https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=1200&q=80',
    'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=1200&q=80',
  ],
  'default': [
    'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1200&q=80',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80',
  ]
};

function getFallbackImage(query) {
  const q = query.toLowerCase();
  for (const [category, urls] of Object.entries(FALLBACK_IMAGES)) {
    if (q.includes(category)) {
      return urls[Math.floor(Math.random() * urls.length)];
    }
  }
  const defaults = FALLBACK_IMAGES.default;
  return defaults[Math.floor(Math.random() * defaults.length)];
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help')) {
    console.log(`
Usage: node scripts/scrape-image-web.mjs <path-to-post.md> [options]

Options:
  --dry-run    Test only, don't download
  --force      Overwrite existing

This version uses direct Unsplash URLs as fallback when APIs fail.
`);
    process.exit(0);
  }
  
  const postPath = args[0];
  const dryRun = args.includes('--dry-run');
  
  log(`\n🖼️  Web Image Scraper (Fallback Mode)`, 'cyan');
  log(`═════════════════════════════════════\n`);
  
  try {
    const content = await readFile(postPath, 'utf-8');
    const parsed = extractFrontmatter(content);
    
    if (!parsed) throw new Error('Could not parse frontmatter');
    
    const { meta, body } = parsed;
    log(`📄 Post: ${basename(postPath)}`);
    log(`   Title: ${meta.title || '(no title)'}\n`);
    
    const keywords = extractKeywords(meta, body);
    const primaryKeyword = keywords[0] || 'technology business';
    
    // Get fallback URL
    const imageUrl = getFallbackImage(primaryKeyword);
    
    log(`🔍 Topic: ${primaryKeyword}`, 'cyan');
    log(`🌐 Using fallback image`, 'yellow');
    
    if (dryRun) {
      log(`\n✅ Dry run - would use: ${imageUrl}`, 'green');
      process.exit(0);
    }
    
    // Generate paths
    const slug = basename(postPath, '.md');
    const filename = generateFilename(meta.title || slug, slug);
    const outputPath = join(CONFIG.uploadsDir, filename);
    const tempPath = join(CONFIG.tempDir, `${filename}.tmp`);
    
    // Ensure temp dir exists
    execSync(`mkdir -p "${CONFIG.tempDir}"`);
    
    // Download
    log(`⬇️ Downloading...`, 'blue');
    const downloadSize = await downloadWithCurl(imageUrl, tempPath);
    log(`✅ Downloaded ${(downloadSize / 1024).toFixed(1)}KB`, 'green');
    
    // Convert
    log(`🔄 Converting to WebP...`, 'blue');
    const webpSize = await convertToWebp(tempPath, outputPath);
    log(`✅ Created WebP: ${(webpSize / 1024).toFixed(1)}KB`, 'green');
    
    // Cleanup temp
    execSync(`rm -f "${tempPath}"`);
    
    // Update frontmatter
    await updateFrontmatter(postPath, outputPath);
    log(`✅ Updated frontmatter`, 'green');
    
    log(`\n✨ Success!`, 'green');
    log(`   File: uploads/${filename}`, 'cyan');
    log(`\n📋 Next: git add && git commit`, 'blue');
    
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    process.exit(1);
  }
}

main();
