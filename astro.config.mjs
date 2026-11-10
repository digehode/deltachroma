import { defineConfig } from 'astro/config';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import mdx from '@astrojs/mdx';
// https://astro.build/config
export default defineConfig({
  site: 'https://digehode.github.io',
  base: '/deltachroma',
  output: 'static',

  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },

  integrations: [mdx()],
});