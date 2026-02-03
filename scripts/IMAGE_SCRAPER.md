# Image Scraper for Blog Posts

Automatically find and download relevant images for blog posts using free stock photo APIs (Unsplash, Pexels).

## Quick Start

### Add image to a single post:
```bash
node scripts/scrape-image.mjs src/content/blog/my-post.md
```

Or use the wrapper:
```bash
./scripts/add-image.sh src/content/blog/my-post.md
```

### Add images to all posts missing them:
```bash
node scripts/scrape-images-batch.mjs --missing-only
```

## How It Works

1. **Reads the post** - Extracts title, description, tags, and content
2. **Generates search queries** - Creates keywords from post metadata
3. **Searches stock photos** - Queries Unsplash (and Pexels as fallback)
4. **Downloads & converts** - Saves image and converts to WebP
5. **Updates frontmatter** - Adds `image: "/uploads/FILENAME.webp"` to the post

## Scripts

### scrape-image.mjs
Main script for processing a single post.

**Usage:**
```bash
node scripts/scrape-image.mjs <path-to-post.md> [options]

Options:
  --dry-run      Test mode - searches but doesn't download
  --force        Overwrite existing image
  --verbose      Detailed logging
  --query        Override search query (e.g., --query "business automation")
```

**Examples:**
```bash
# Basic usage
node scripts/scrape-image.mjs src/content/blog/n8n-guide.md

# Test what image would be found
node scripts/scrape-image.mjs src/content/blog/n8n-guide.md --dry-run

# Force new image even if one exists
node scripts/scrape-image.mjs src/content/blog/n8n-guide.md --force

# Custom search query
node scripts/scrape-image.mjs src/content/blog/n8n-guide.md --query "workflow automation"
```

### scrape-images-batch.mjs
Batch process multiple posts.

**Usage:**
```bash
node scripts/scrape-images-batch.mjs [options]

Options:
  --dir <path>      Directory to scan (default: src/content/blog)
  --dry-run         Test mode - don't download images
  --missing-only    Only process posts without images
  --limit <n>       Process max n posts
  --verbose         Detailed logging
```

**Examples:**
```bash
# Process all posts missing images
node scripts/scrape-images-batch.mjs --missing-only

# Dry run to see what would be processed
node scripts/scrape-images-batch.mjs --missing-only --dry-run

# Process max 5 posts
node scripts/scrape-images-batch.mjs --missing-only --limit 5
```

## Image Sources

### Primary: Unsplash
- Free, high-quality stock photos
- No API key required for basic usage
- With API key: higher rate limits

**To add API key:**
```bash
export UNSPLASH_ACCESS_KEY="your_key_here"
```

Get a free key at: https://unsplash.com/developers

### Fallback: Pexels
- Used if Unsplash returns no results
- Requires API key

**To enable:**
```bash
export PEXELS_API_KEY="your_key_here"
```

Get a free key at: https://www.pexels.com/api/

## Configuration

Edit the CONFIG section in `scripts/scrape-image.mjs`:

```javascript
const CONFIG = {
  uploadsDir: './public/uploads',  // Where images are saved
  minImageSize: 2048,              // Minimum file size (2KB)
  maxWidth: 1200,                  // Max image width
  quality: 85,                     // WebP quality (0-100)
};
```

## Requirements

- Node.js 18+
- ImageMagick (`convert` command)
- curl

**Install ImageMagick:**
```bash
# Ubuntu/Debian
sudo apt-get install imagemagick

# macOS
brew install imagemagick
```

## How Images Are Named

Images are named based on the post filename with a random suffix:
```
n8n-avtomatizaciya-biznesa-a3f7d2e9.webp
```

This ensures:
- Human-readable filenames
- No collisions between posts
- Consistent with existing blog images

## Search Query Generation

The script extracts keywords from:
1. **Title** - Primary source (cleaned of punctuation)
2. **Tags** - If available in frontmatter
3. **Description** - First few words
4. **H1 heading** - As fallback

Example post:
```yaml
---
title: "n8n: Как автоматизировать бизнес"
description: "Полное руководство по n8n для бизнеса"
tags: ["n8n", "автоматизация", "бизнес"]
---
```

Generated queries:
- `n8n автоматизировать бизнес`
- `n8n автоматизация`
- `Полное руководство по n8n`

## Troubleshooting

### "Could not find suitable image"
- Try using `--query` to specify custom search terms
- Check internet connection
- Verify Unsplash is accessible

### "Download failed"
- Check network connectivity
- Some images may be restricted
- Try again later (rate limiting)

### "Conversion failed"
- Verify ImageMagick is installed: `convert --version`
- Check disk space
- Verify write permissions to `public/uploads/`

### No API keys needed!
The script works without API keys by using Unsplash's public search. 
For production use with higher limits, get free API keys.

## Integration with Workflow

### For texblog/nanobanana agents:

When a post is ready in `blog-drafts/` or `posts_ready/`:

```bash
# 1. Add image to the post
node scripts/scrape-image.mjs src/content/blog/DRAFT-post.md

# 2. Verify the image was added
git status

# 3. Commit both files
git add public/uploads/ src/content/blog/DRAFT-post.md
git commit -m "Add blog post with image"
```

### Automated workflow:
```bash
# Process all posts missing images and commit
node scripts/scrape-images-batch.mjs --missing-only
git add public/uploads/ src/content/blog/
git commit -m "Add images for blog posts"
```

## Output Example

```
🖼️  Blog Image Scraper
═══════════════════════

📄 Post: n8n-avtomatizaciya-biznesa.md
   Title: n8n: Как автоматизировать бизнес и экономить 20+ часов в неделю
   Current image: (none)

🔍 Searching Unsplash for: "n8n автоматизировать бизнес"
✅ Found image on Unsplash by John Smith
⬇️ Downloading image...
✅ Downloaded 156.3KB
🔄 Converting to WebP...
✅ Created WebP: 42.1KB
✅ Updated frontmatter: (none) → /uploads/n8n-avtomatizaciya-biznesa-a3f7d2e9.webp

✨ Success! Image saved to: uploads/n8n-avtomatizaciya-biznesa-a3f7d2e9.webp
   Full path: ./public/uploads/n8n-avtomatizaciya-biznesa-a3f7d2e9.webp

📋 Next steps:
   git add "./public/uploads/n8n-avtomatizaciya-biznesa-a3f7d2e9.webp"
   git add "src/content/blog/n8n-avtomatizaciya-biznesa.md"
   git commit -m "Add image for n8n-avtomatizaciya-biznesa.md"
```
