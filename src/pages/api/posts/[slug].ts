import type { APIRoute } from 'astro';
import { readFile, writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export const prerender = false;

// GET - fetch single post
export const GET: APIRoute = async ({ params }) => {
  try {
    const { slug } = params;
    const filePath = join(process.cwd(), 'src', 'content', 'blog', `${slug}.md`);

    if (!existsSync(filePath)) {
      return new Response(JSON.stringify({ error: 'Статья не найдена' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const fileContent = await readFile(filePath, 'utf-8');
    const frontmatterMatch = fileContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

    if (!frontmatterMatch) {
      return new Response(JSON.stringify({ error: 'Неверный формат файла' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const frontmatter = frontmatterMatch[1];
    const content = frontmatterMatch[2];

    // Parse frontmatter
    const title = frontmatter.match(/title:\s*"(.*)"/)?.[1] || '';
    const description = frontmatter.match(/description:\s*"(.*)"/)?.[1] || '';
    const author = frontmatter.match(/author:\s*"(.*)"/)?.[1] || '';
    const image = frontmatter.match(/image:\s*"(.*)"/)?.[1] || '';
    const pubDate = frontmatter.match(/pubDate:\s*([\d-]+)/)?.[1] || '';
    const tagsMatch = frontmatter.match(/tags:\s*\[(.*)\]/);
    const tags = tagsMatch ? tagsMatch[1].replace(/"/g, '').split(',').map(t => t.trim()).join(', ') : '';

    return new Response(JSON.stringify({
      slug,
      title,
      description,
      author,
      image,
      pubDate,
      tags,
      content: content.trim()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// PUT - update post
export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const { slug } = params;
    const body = await request.json();
    const { title, description, author, image, tags, content, pubDate } = body;

    if (!title || !description || !content) {
      return new Response(JSON.stringify({ error: 'Заполните все обязательные поля' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const filePath = join(process.cwd(), 'src', 'content', 'blog', `${slug}.md`);

    if (!existsSync(filePath)) {
      return new Response(JSON.stringify({ error: 'Статья не найдена' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

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

    await writeFile(filePath, frontmatter, 'utf-8');

    return new Response(JSON.stringify({ success: true, slug }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// DELETE - delete post
export const DELETE: APIRoute = async ({ params }) => {
  try {
    const { slug } = params;
    const filePath = join(process.cwd(), 'src', 'content', 'blog', `${slug}.md`);

    if (!existsSync(filePath)) {
      return new Response(JSON.stringify({ error: 'Статья не найдена' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await unlink(filePath);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
