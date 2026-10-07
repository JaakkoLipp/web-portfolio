import { site, type Page } from '../site.config';

/* Page config by id. Throws at build time if the id is missing from site.config.ts. */
export function page(id: string): Page {
  const p = site.pages.find((x) => x.id === id);
  if (!p) throw new Error(`site.config.ts: no page with id "${id}"`);
  return p;
}
