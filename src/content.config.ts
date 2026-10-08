import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/*
  Projects. The file name is the id, the URL (/projects/<id>) and the executable name in ~/projects.
  Keep ids short, lowercase and dash-separated.
*/
const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    /* One line. Shown in lists, in the terminal and in `git log`. */
    summary: z.string(),
    /* Last notable update. Entries with a date show up in `git log`, newest first. */
    date: z.coerce.date().optional(),
    status: z.enum(['active', 'done', 'planned', 'paused']).optional(),
    /* Context, for example "Master's thesis, LUT University". */
    context: z.string().optional(),
    stack: z.array(z.string()).default([]),
    links: z.array(z.object({ label: z.string(), url: z.url() })).default([]),
    /* Printed by `<id> --version`. */
    version: z.string().default('1.0'),
    /* Overrides the `git log` message. Defaults to the summary. */
    log: z.string().optional(),
    /* Lower numbers sort first on /projects. */
    order: z.number().default(100),
    draft: z.boolean().default(false),
  }),
});

const writing = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/writing' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

/*
  Simple pages, one Markdown file per page in site.config.ts (paper, keymap, ...).
  The file name is the page id. Title and blurb come from the config.
*/
const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({}),
});

export const collections = { projects, writing, pages };
