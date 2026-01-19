import type { APIRoute } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { siteConfig } from '@/data/siteConfig';

export const prerender = true;

export const GET: APIRoute = async () => {
  const posts = await getCollection('blog', ({ data }: CollectionEntry<'blog'>) => !data.draft);
  const sortedPosts = posts.sort((a: CollectionEntry<'blog'>, b: CollectionEntry<'blog'>) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  const turboItems = sortedPosts.map((post: CollectionEntry<'blog'>) => {
    const pubDate = post.data.pubDate.toUTCString();
    const link = `${siteConfig.url}/blog/${post.slug}`;
    
    return `
    <item turbo="true">
      <title>${escapeXml(post.data.title)}</title>
      <link>${link}</link>
      <pubDate>${pubDate}</pubDate>
      <author>${escapeXml(post.data.author)}</author>
      <turbo:content>
        <![CDATA[
          <header>
            <h1>${escapeXml(post.data.title)}</h1>
            ${post.data.image ? `<figure><img src="${post.data.image}" /></figure>` : ''}
          </header>
          <p>${escapeXml(post.data.description)}</p>
        ]]>
      </turbo:content>
      <yandex:full-text>${escapeXml(post.body)}</yandex:full-text>
    </item>`;
  }).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:yandex="http://news.yandex.ru" xmlns:media="http://search.yahoo.com/mrss/" xmlns:turbo="http://turbo.yandex.ru" version="2.0">
  <channel>
    <title>${escapeXml(siteConfig.name)}</title>
    <link>${siteConfig.url}</link>
    <description>${escapeXml(siteConfig.description)}</description>
    <language>ru</language>
    ${turboItems}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
