# Image Scraping Workflow - Implementation Summary

## What Was Implemented

### New Scripts Created

1. **`scripts/scrape-image.mjs`** - Main image scraping script
   - Extracts keywords from post frontmatter (title, tags, description)
   - Searches Unsplash API for matching images
   - Falls back to Pexels if Unsplash fails
   - Downloads, converts to WebP, saves to `public/uploads/`
   - Updates post frontmatter with new image path
   - Supports `--dry-run`, `--force`, `--query`, `--verbose` flags

2. **`scripts/scrape-images-batch.mjs`** - Batch processing
   - Scans all posts in `src/content/blog/`
   - Identifies posts missing images
   - Processes multiple posts automatically
   - Supports `--missing-only`, `--limit`, `--dry-run` flags

3. **`scripts/scrape-image-web.mjs`** - Fallback method
   - Uses curated Unsplash URLs when APIs fail
   - Reliable fallback for when rate limits are hit
   - Categories: technology, business, ai, photo, marketing

4. **`scripts/add-image.sh`** - Bash wrapper
   - Simple wrapper for quick usage

### Documentation Created

1. **`scripts/IMAGE_SCRAPER.md`** - Complete technical documentation
2. **`SKILL.md`** - High-level workflow for agents

## How to Use

### For a single post:
```bash
cd /root/clawd/skills/rublog
node scripts/scrape-image.mjs src/content/blog/my-post.md
```

### Test first (dry run):
```bash
node scripts/scrape-image.mjs src/content/blog/my-post.md --dry-run
```

### Batch process all posts missing images:
```bash
node scripts/scrape-images-batch.mjs --missing-only
```

### With custom search query:
```bash
node scripts/scrape-image.mjs src/content/blog/my-post.md --query "business automation"
```

### If APIs fail, use fallback:
```bash
node scripts/scrape-image-web.mjs src/content/blog/my-post.md
```

## Workflow Integration for Agents

When texblog or nanobanana agents create a new blog post:

1. **Write post** → Save to `src/content/blog/post-slug.md`
2. **Add image** → Run `node scripts/scrape-image.mjs src/content/blog/post-slug.md`
3. **Verify** → Check that image appears in `public/uploads/`
4. **Commit** → `git add public/uploads/ src/content/blog/ && git commit -m "..."`

## Key Features

### Smart Keyword Extraction
- Extracts from title (primary)
- Uses tags if available
- Falls back to H1/H2 headings
- Generates multiple search queries

### Error Handling
- Validates downloaded images (>2KB)
- Multiple fallback sources
- Graceful failure with helpful messages
- `--force` to overwrite existing

### Image Standards
- WebP format (optimal compression)
- 1200px max width
- 85% quality
- Descriptive filenames with random suffix

### No API Keys Required
Works out of the box using:
- Unsplash public search endpoints
- Direct curated image URLs as fallback

Optional API keys for higher limits:
```bash
export UNSPLASH_ACCESS_KEY="..."
export PEXELS_API_KEY="..."
```

## Testing Results

✅ All scripts executable and tested
✅ Dry-run mode works correctly
✅ All 12 existing posts have images
✅ Image search finds relevant images

## File Locations

```
/root/clawd/skills/rublog/
├── scripts/
│   ├── scrape-image.mjs           # Main script
│   ├── scrape-images-batch.mjs    # Batch processor
│   ├── scrape-image-web.mjs       # Fallback method
│   ├── add-image.sh               # Bash wrapper
│   └── IMAGE_SCRAPER.md           # Full docs
├── SKILL.md                        # Agent workflow docs
└── public/uploads/                 # Image destination
```

## Notes for Adel

1. **Scripts are ready to use** - No configuration needed
2. **Works without API keys** - But can add them for higher rate limits
3. **Always commit images** - They must be in git to deploy
4. **Use dry-run first** - When testing new posts
5. **Fallback available** - If main script fails, use `scrape-image-web.mjs`

## Example Output

```
🖼️  Blog Image Scraper
═══════════════════════

📄 Post: n8n-avtomatizaciya-biznesa.md
   Title: n8n: Как автоматизировать бизнес...
   Current image: (none)

🔍 Searching Unsplash for: "n8n автоматизация"
✅ Found image on Unsplash by Planet Volumes
⬇️ Downloading image...
✅ Downloaded 156.3KB
🔄 Converting to WebP...
✅ Created WebP: 42.1KB
✅ Updated frontmatter

✨ Success! Image saved to: uploads/n8n-avtomatizaciya-biznesa-a3f7d2e9.webp

📋 Next steps:
   git add "..."
   git commit -m "Add image for n8n post"
```
