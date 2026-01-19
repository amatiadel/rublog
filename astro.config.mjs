import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://texblog.ru/',
  output: 'static',
  integrations: [tailwind(), sitemap()],
  trailingSlash: 'never',
  compressHTML: true,
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp'
    }
  },
  markdown: {
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark'
      }
    }
  }
});
