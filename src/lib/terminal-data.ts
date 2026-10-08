import { site } from '../site.config';
import { getLog, getPosts, getProjects, postPath, projectPath } from './content';

/*
  Everything the terminal knows, as one JSON document.
  Built at build time and embedded in the homepage. The terminal never fetches anything.
  New config fields and frontmatter fields reach the terminal without changes here.
*/
export async function getTerminalData() {
  const [projects, posts, log] = await Promise.all([getProjects(), getPosts(), getLog()]);
  return {
    ...site,
    projects: projects.map((p) => ({ ...p.data, id: p.id, path: projectPath(p.id), date: p.data.date?.toISOString(), size: p.body?.length ?? 0 })),
    posts: posts.map((p) => ({ ...p.data, id: p.id, path: postPath(p.id), date: p.data.date.toISOString(), size: p.body?.length ?? 0 })),
    log,
    builtAt: new Date().toISOString(),
  };
}

export type TerminalData = Awaited<ReturnType<typeof getTerminalData>>;

/* JSON that is safe to put inside a <script> element. */
export const toScriptJson = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c');
