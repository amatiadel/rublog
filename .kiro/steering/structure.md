# Project Structure

```
.
├── src/
│   ├── components/     # Reusable UI components
│   │   ├── BlogCard.astro
│   │   ├── Footer.astro
│   │   ├── Header.astro
│   │   └── SEO.astro
│   ├── content/
│   │   └── blog/       # Markdown blog posts
│   ├── data/
│   │   └── siteConfig.ts
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── pages/
│   │   ├── blog/[...slug].astro
│   │   ├── tags/
│   │   ├── index.astro
│   │   └── rss.xml.ts
│   └── utils/
│       └── slugify.ts
├── public/             # Static assets
├── astro.config.mjs
├── tailwind.config.mjs
└── package.json
```

## Conventions
- Blog posts in `src/content/blog/` as Markdown
- Components use `.astro` extension
- Config/data in `src/data/`
