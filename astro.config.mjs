import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';

export default defineConfig({
  site: 'https://example.com',
  output: 'hybrid',
  adapter: node({ mode: 'standalone' }),
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
  },
  server: {
    host: true,
    port: 4321
  }
});
