import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { siteConfig } from '@/data/siteConfig';
import type { APIContext } from 'astro';

export const prerender = true;

export async function GET(context: APIContext) {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return rss({
    title: siteConfig.name,
    description: siteConfig.description,
    site: context.site || siteConfig.url,
    items: posts
      .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
      .map((post) => ({
        title: post.data.title,
        pubDate: post.data.pubDate,
        description: post.data.description,
        link: `/blog/${post.slug}`,
        author: post.data.author,
        categories: post.data.tags,
        customData: post.data.image ? `<enclosure url="${post.data.image}" type="image/jpeg"/>` : '',
      })),
    customData: `<language>ru-ru</language><lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
  });
}
