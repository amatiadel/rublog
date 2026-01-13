import type { APIRoute } from 'astro';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export const prerender = false;

const translitMap: Record<string, string> = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
  'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
  'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
  'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '',
  'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .split('')
    .map(char => translitMap[char] || char)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { title, description, author, image, tags, content } = body;

    if (!title || !description || !content) {
      return new Response(JSON.stringify({ error: 'Заполните все обязательные поля' }), { status: 400 });
    }

    const slug = slugify(title);
    const pubDate = new Date().toISOString().split('T')[0];
    const tagsArray = tags ? tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [];

    const frontmatter = `---
title: "${title}"
description: "${description}"
pubDate: ${pubDate}
author: "${author || 'Админ'}"
${image ? `image: "${image}"` : ''}
tags: [${tagsArray.map((t: string) => `"${t}"`).join(', ')}]
---

${content}`;

    const filePath = join(process.cwd(), 'src', 'content', 'blog', `${slug}.md`);
    await writeFile(filePath, frontmatter, 'utf-8');

    return new Response(JSON.stringify({ success: true, slug }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
