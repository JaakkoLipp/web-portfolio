import { site } from '../site.config';
import { getLog, getPosts, getProjects } from './content';

/*
  Everything the terminal knows, as one JSON document.
  Built at build time and embedded in the homepage. The terminal never fetches anything.
*/
export async function getTerminalData() {
  const [projects, posts, log] = await Promise.all([getProjects(), getPosts(), getLog()]);
  return {
    domain: site.domain,
    owner: site.owner,
    links: site.links,
    pages: site.pages.map(({ id, path, title, blurb }) => ({ id, path, title, blurb })),
    machine: site.machine,
    services: site.services,
    readme: site.readme,
    man: site.man,
    fortunes: site.fortunes,
    projects: projects.map((p) => ({
      id: p.id,
      title: p.data.title,
      summary: p.data.summary,
      status: p.data.status,
      context: p.data.context,
      stack: p.data.stack,
      links: p.data.links,
      version: p.data.version,
      path: `/projects/${p.id}`,
      date: p.data.date?.toISOString(),
      size: p.body?.length ?? 0,
    })),
    posts: posts.map((p) => ({
      id: p.id,
      title: p.data.title,
      description: p.data.description,
      path: `/writing/${p.id}`,
      date: p.data.date.toISOString(),
      size: p.body?.length ?? 0,
    })),
    log,
    builtAt: new Date().toISOString(),
  };
}

export type TerminalData = Awaited<ReturnType<typeof getTerminalData>>;

/* JSON that is safe to put inside a <script> element. */
export const toScriptJson = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c');
