/* Helpers derived from site.config.ts, for the build. The terminal has its own in state.js. */
import { site, type Page } from '../site.config';

/* Pages with their own folder in src/pages/. Every other page needs src/content/pages/<id>.md. */
export const OWN_ROUTES = ['projects', 'writing'];

/* The shell's program name, for example `jsh` from `jsh 1.0`. */
export const SHELL = site.machine.shell.split(' ')[0];

/* Page config by id. Throws at build time if the id is missing from site.config.ts. */
export function page(id: string): Page {
  const p = site.pages.find((x) => x.id === id);
  if (!p) throw new Error(`site.config.ts: no page with id "${id}"`);
  return p;
}
