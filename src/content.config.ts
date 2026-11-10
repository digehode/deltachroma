import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blogCollection = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    // Allow an optional custom slug in frontmatter, fallback computed manually if missing
    slug: z.string().optional(),
  }),
});

export const collections = {
  blog: blogCollection,
};
