import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string(),
    image: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    featured: z.boolean().default(false),
    // SEO: Summary/TL;DR for Featured Snippets
    summary: z.string().optional(),
    tldr: z.string().optional(),
    // SEO: Entity tagging for AI recognition (Wikidata/Wikipedia URLs)
    about: z.array(z.string()).optional(),
    mentions: z.array(z.string()).optional()
  })
});

export const collections = { blog };
