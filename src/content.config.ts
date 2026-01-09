import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const posts = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content" }),
  schema: z.object({
    title: z.string(),
    date: z.union([z.string(), z.date()]),
    tag: z.string().optional(),
    icon: z.string().optional(),
    excerpt: z.string().optional(),
  }),
});

export const collections = { posts };
