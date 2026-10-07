import { getCollection, type CollectionEntry } from 'astro:content';
import { site } from '../site.config';

export type Project = CollectionEntry<'projects'>;
export type Post = CollectionEntry<'writing'>;

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

/* Stable 7-character hex "commit hash" for an id (FNV-1a). */
export function shortHash(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0').slice(0, 7);
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
  const entries: (LogEntry & { t: number })[] = [];
  for (const p of projects) {
    if (!p.data.date) continue;
    entries.push({ hash: shortHash(`projects/${p.id}`), type: `feat(${p.id})`, msg: p.data.log ?? p.data.summary, cmd: p.id, href: `/projects/${p.id}`, date: p.data.date.toISOString(), t: p.data.date.getTime() });
  }
  for (const p of posts) {
    entries.push({ hash: shortHash(`writing/${p.id}`), type: 'docs(writing)', msg: p.data.title, cmd: `open /writing/${p.id}`, href: `/writing/${p.id}`, date: p.data.date.toISOString(), t: p.data.date.getTime() });
  }
  for (const p of site.pages) {
    if (!p.date) continue;
    const d = new Date(p.date);
    entries.push({ hash: shortHash(`pages/${p.id}`), type: `feat(${p.id})`, msg: p.title, cmd: `open ${p.id}`, href: p.path, date: d.toISOString(), t: d.getTime() });
  }
  return entries.sort((a, b) => b.t - a.t || a.hash.localeCompare(b.hash)).map(({ t: _t, ...e }) => e);
}

export const fmtDate = (d: Date) => d.toISOString().slice(0, 10);
