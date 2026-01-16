import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel/serverless';

export default defineConfig({
  site: 'https://texblog.ru/',
  output: 'hybrid',
  adapter: vercel({
    runtime: 'nodejs20.x'
  }),
  integrations: [tailwind(), sitemap()],
  trailingSlash: 'never',
  compressHTML: true,
  markdown: {
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark'
      }
    }
  }
});
