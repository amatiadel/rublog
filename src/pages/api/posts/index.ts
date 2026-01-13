import type { APIRoute } from 'astro';
import { readdir } from 'fs/promises';
import { join } from 'path';

export const prerender = false;

// GET - list all posts (basic info)
export const GET: APIRoute = async () => {
  try {
    const blogDir = join(process.cwd(), 'src', 'content', 'blog');
    const files = await readdir(blogDir);
    const posts = files
      .filter(f => f.endsWith('.md'))
      .map(f => f.replace('.md', ''));

    return new Response(JSON.stringify({ posts }), {
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
