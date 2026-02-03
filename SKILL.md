---
name: rublog
description: Russian blog for Nano Banana and texblog. Blog posts about AI photography, business automation, and technology. Posts are stored in src/content/blog/ with images in public/uploads/.
---

# Rublog - Russian Blog

This is the Russian-language blog for Nano Banana (AI photo service) and texblog projects.

## Directory Structure

```
skills/rublog/
├── src/content/blog/          # Blog posts (.md files)
├── public/uploads/            # Blog images (.webp files)
├── scripts/                   # Helper scripts
│   ├── scrape-image.mjs       # Auto-download images (API method)
│   ├── scrape-image-web.mjs   # Auto-download images (web method)
│   ├── scrape-images-batch.mjs # Batch processing
│   ├── add-image.sh           # Wrapper script
│   ├── optimize-images.mjs    # Optimize existing images
│   └── IMAGE_SCRAPER.md       # Full documentation
└── SKILL.md                   # This file
```

## Post Format

Blog posts use frontmatter:

```yaml
---
title: "Post Title"
description: "SEO description"
pubDate: 2026-02-03
author: "Адель Мокрани"
image: "/uploads/filename.webp"
tags: ["tag1", "tag2", "tag3"]
---

# Post Title

Content here...
```

## Adding Images to Posts

### Quick Method (Recommended)

When a post is ready and needs an image:

```bash
cd /root/clawd/skills/rublog

# For a single post
node scripts/scrape-image.mjs src/content/blog/your-post.md

# Or use the wrapper
./scripts/add-image.sh src/content/blog/your-post.md

# Test first (dry run)
node scripts/scrape-image.mjs src/content/blog/your-post.md --dry-run
```

### Batch Processing

```bash
# Add images to all posts missing them
node scripts/scrape-images-batch.mjs --missing-only

# Dry run to see what would be processed
node scripts/scrape-images-batch.mjs --missing-only --dry-run
```

### Fallback Method (if APIs fail)

```bash
# Uses curated Unsplash URLs
node scripts/scrape-image-web.mjs src/content/blog/your-post.md
```

## How Image Scraping Works

1. **Extract keywords** from post title, tags, description
2. **Search Unsplash** (and Pexels as fallback) for matching images
3. **Download** the best matching image
4. **Convert to WebP** using ImageMagick
5. **Save** to `public/uploads/`
6. **Update frontmatter** with the new image path

## Workflow for texblog/nanobanana Agents

### When creating a new post:

1. **Write the post** in `src/content/blog/` with complete frontmatter
2. **Add the image** using the scraper:
   ```bash
   node scripts/scrape-image.mjs src/content/blog/new-post.md
   ```
3. **Verify** the image was added correctly
4. **Commit** both files:
   ```bash
   git add public/uploads/new-image.webp
   git add src/content/blog/new-post.md
   git commit -m "Add blog post: Post Title"
   ```

### If image search fails:

1. Try with a custom query:
   ```bash
   node scripts/scrape-image.mjs src/content/blog/new-post.md --query "AI technology"
   ```

2. Or use the fallback method:
   ```bash
   node scripts/scrape-image-web.mjs src/content/blog/new-post.md
   ```

3. Or manually find an image and save it:
   ```bash
   # Download manually
   curl -o temp.jpg "https://images.unsplash.com/..."
   
   # Convert to webp
   convert temp.jpg -resize 1200x1200> -quality 85 public/uploads/your-image.webp
   
   # Update post frontmatter manually
   ```

## Image Requirements

- **Format**: WebP (converted automatically)
- **Max width**: 1200px
- **Quality**: 85%
- **Min size**: 2KB (validates download wasn't corrupted)
- **Naming**: `{post-slug}-{random8chars}.webp`

## Git Workflow

Images must be committed to git:

```bash
# After adding images
git add public/uploads/
git add src/content/blog/
git commit -m "Add blog post with featured image"
git push
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Could not find image" | Use `--query` with simpler terms |
| "Download failed" | Check internet, try `--force` |
| "Conversion failed" | Check ImageMagick: `convert --version` |
| Image looks wrong | Use `--force` to regenerate |
| API rate limited | Wait or use `scrape-image-web.mjs` |

## API Keys (Optional)

For higher rate limits, set these environment variables:

```bash
export UNSPLASH_ACCESS_KEY="your_key"
export PEXELS_API_KEY="your_key"
```

Scripts work without API keys using public search endpoints.

## See Also

- `scripts/IMAGE_SCRAPER.md` - Complete documentation for image scripts
- `../seo-blog-optimizer/` - For SEO optimization of posts
