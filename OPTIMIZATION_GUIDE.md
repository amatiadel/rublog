# Website Optimization Guide

## Current Issues (Based on Lighthouse Audit)

### 🔴 Critical Issues

1. **Performance Score: 69/100**
   - Largest Contentful Paint: 45.9s (CRITICAL)
   - First Contentful Paint: 2.6s
   - Speed Index: 4.3s

2. **Image Optimization: 9MB total**
   - Individual images: 1.5-2.3 MB each
   - No WebP/AVIF formats
   - No compression
   - No lazy loading

3. **Accessibility Score: 88/100**
   - ✅ FIXED: ARIA role mismatch in ThemeToggle

## 🚀 Quick Fixes Applied

### 1. Accessibility Fix
- Changed `aria-pressed` to `aria-checked` for switch role in ThemeToggle component
- This fixes the ARIA attributes mismatch

### 2. Image Configuration
- Added domain configuration to astro.config.mjs
- Created image optimization utilities

## 📋 Recommended Actions

### Priority 1: Image Optimization (URGENT)

Your images are the main performance bottleneck. Here's what to do:

#### Option A: Automated Optimization (Recommended)

1. Install Sharp (if not already installed):
   ```bash
   npm install sharp
   ```

2. Run the optimization script:
   ```bash
   node scripts/optimize-images.mjs
   ```

This will:
- Convert all JPG/PNG to WebP format
- Resize images larger than 1200px
- Compress with 80% quality
- Keep originals as backup

#### Option B: Manual Optimization

Use online tools:
- https://squoosh.app/ (Google's tool)
- https://tinypng.com/
- https://imageoptim.com/

Target specs:
- Format: WebP or AVIF
- Max width: 1200px for blog images
- Quality: 75-85%
- Target size: <200KB per image

### Priority 2: Implement Lazy Loading

Update your markdown rendering to add lazy loading:

```astro
<!-- In your blog post renderer -->
<img 
  src={image} 
  alt={alt}
  loading="lazy"
  decoding="async"
  width="1200"
  height="auto"
/>
```

### Priority 3: Add Responsive Images

Use Astro's Image component in your blog layout:

```astro
---
import { Image } from 'astro:assets';
---

<Image 
  src={frontmatter.image}
  alt={frontmatter.title}
  width={1200}
  height={630}
  format="webp"
  quality={80}
  loading="lazy"
/>
```

### Priority 4: Enable Caching

Add to your hosting configuration (Vercel/Netlify):

```json
{
  "headers": [
    {
      "source": "/uploads/:path*",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

## 📊 Expected Results After Optimization

- **Performance Score**: 85-95/100
- **LCP**: <2.5s (currently 45.9s)
- **FCP**: <1.5s (currently 2.6s)
- **Image Size**: <2MB total (currently 9MB)
- **Accessibility**: 100/100 ✅

## 🔧 Additional Optimizations

### 1. Font Optimization

Add to your base layout:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
```

### 2. Preload Critical Resources

```html
<link rel="preload" as="image" href="/logo.png">
```

### 3. Minify CSS/JS

Already enabled via `compressHTML: true` in astro.config.mjs ✅

### 4. Enable HTTP/2

Most modern hosting (Vercel, Netlify) enables this by default ✅

## 📝 Testing

After applying fixes, test with:

1. **Lighthouse**: Chrome DevTools > Lighthouse
2. **PageSpeed Insights**: https://pagespeed.web.dev/
3. **WebPageTest**: https://www.webpagetest.org/

## 🎯 Target Metrics

- Performance: >90
- Accessibility: 100
- Best Practices: >95
- SEO: >95
- LCP: <2.5s
- FID: <100ms
- CLS: <0.1

## 📚 Resources

- [Astro Image Optimization](https://docs.astro.build/en/guides/images/)
- [Web.dev Performance](https://web.dev/performance/)
- [Lighthouse Scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring/)
