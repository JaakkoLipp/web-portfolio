import { getCollection, type CollectionEntry } from 'astro:content';
import { site } from '../site.config';
import { shortHash } from './format';
import { page } from './site';

export type Project = CollectionEntry<'projects'>;
export type Post = CollectionEntry<'writing'>;

/* URLs for content entries. The folders in src/pages/ must match these page paths. */
export const projectPath = (id: string) => `${page('projects').path}/${id}`;
export const postPath = (id: string) => `${page('writing').path}/${id}`;

const published = <T extends { data: { draft: boolean } }>(e: T) => !import.meta.env.PROD || !e.data.draft;

/* Sorted by `order`, then newest first, then by id. */
export async function getProjects(): Promise<Project[]> {
  const all = await getCollection('projects', published);
  return all.sort(
    (a, b) =>
      a.data.order - b.data.order ||
      (b.data.date?.getTime() ?? 0) - (a.data.date?.getTime() ?? 0) ||
      a.id.localeCompare(b.id),
  );
}

/* Newest first. */
export async function getPosts(): Promise<Post[]> {
  const all = await getCollection('writing', published);
  return all.sort((a, b) => b.data.date.getTime() - a.data.date.getTime() || a.id.localeCompare(b.id));
}

export interface LogEntry {
  hash: string;
  type: string;
  msg: string;
  /* Terminal command that runs when the line is clicked. */
  cmd: string;
  href: string;
  date: string;
}

/* `git log` entries, newest first: dated projects, posts and pages. */
export async function getLog(): Promise<LogEntry[]> {
  const [projects, posts] = await Promise.all([getProjects(), getPosts()]);
  const entry = (key: string, type: string, msg: string, cmd: string, href: string, date: Date) =>
    ({ hash: shortHash(key), type, msg, cmd, href, date: date.toISOString() });
  const entries: LogEntry[] = [
    ...projects.flatMap((p) => (p.data.date ? [entry(`projects/${p.id}`, `feat(${p.id})`, p.data.log ?? p.data.summary, p.id, projectPath(p.id), p.data.date)] : [])),
    ...posts.map((p) => entry(`writing/${p.id}`, 'docs(writing)', p.data.title, `open ${postPath(p.id)}`, postPath(p.id), p.data.date)),
    ...site.pages.flatMap((p) => (p.date ? [entry(`pages/${p.id}`, `feat(${p.id})`, p.title, `open ${p.id}`, p.path, new Date(p.date))] : [])),
  ];
  return entries.sort((a, b) => b.date.localeCompare(a.date) || a.hash.localeCompare(b.hash));
}

export const fmtDate = (d: Date) => d.toISOString().slice(0, 10);
