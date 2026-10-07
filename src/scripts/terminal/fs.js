/* Virtual file system under the guest's home, built from site data. */
import { D, HOME, S, esc, link, print, printText, dim } from './state.js';

/* Default file inside each page folder. */
const PAGE_FILES = { paper: 'today.html', keymap: 'sofle.md' };

function buildFs() {
  const children = {};
  for (const page of D.pages) {
    let kids;
    if (page.id === 'projects') {
      kids = Object.fromEntries(D.projects.map((p) => [p.id, { type: 'exe', project: p, size: p.size, date: p.date }]));
    } else if (page.id === 'writing') {
      kids = Object.fromEntries(D.posts.map((p) => [`${p.id}.md`, { type: 'file', post: p, route: p.path, size: p.size, date: p.date }]));
    } else {
      kids = { [PAGE_FILES[page.id] ?? 'README.md']: { type: 'file', route: page.path, body: `# ${page.title}\n${page.blurb}` } };
    }
    children[page.id] = { type: 'dir', route: page.path, children: kids };
  }
  children['contact.txt'] = { type: 'file', special: 'contact' };
  children['README.md'] = { type: 'file', body: D.readme.join('\n') };
  children['.secrets'] = {
    type: 'file',
    hidden: true,
    body: 'API_KEY=****************\n\n# Real secrets live in a vault, not in a static site.\n# Nice try though.',
  };
  return { type: 'dir', children };
}
export const FS = buildFs();

export function nodeAt(path) {
  let n = FS;
  for (const s of path) {
    if (n.type !== 'dir' || !n.children[s]) return null;
    n = n.children[s];
  }
  return n;
}

/* Resolve a path relative to the current directory. Returns { node, path } or null. */
export function resolve(p) {
  let base;
  if (!p || p === '.') return { node: nodeAt(S.cwd), path: [...S.cwd] };
  if (p === '~' || p.startsWith('~/')) { base = []; p = p.slice(1); }
  else if (p === HOME || p.startsWith(HOME + '/')) { base = []; p = p.slice(HOME.length); }
  else if (p.startsWith('/')) return null;
  else base = [...S.cwd];
  for (const seg of p.split('/').filter(Boolean)) {
    if (seg === '.') continue;
    if (seg === '..') { base.pop(); continue; }
    base.push(seg);
  }
  const node = nodeAt(base);
  return node ? { node, path: base } : null;
}

export const tildePath = (path) => '~/' + path.join('/');
export const findProject = (id) => D.projects.find((p) => p.id === id);
export const isOutsideHome = (p) => p.startsWith('/') && p !== HOME && !p.startsWith(HOME + '/');

/* One clickable ls entry. Directories list, programs run, files print. */
export function lsItem(node, name, path) {
  const full = tildePath([...path, name]);
  if (node.type === 'dir') return link(`<span class="dir">${esc(name)}/</span>`, `ls ${full}`, node.route ?? '#');
  if (node.type === 'exe') return link(`<span class="exe">${esc(name)}*</span>`, name, node.project.path);
  return link(`<span class="${name.startsWith('.') ? 'hid' : 'file'}">${esc(name)}</span>`, `cat ${full}`, node.route ?? '#');
}

function lsDate(iso) {
  const d = iso ? new Date(iso) : new Date(D.builtAt);
  const part = (o) => d.toLocaleString('en-US', { ...o, timeZone: 'Europe/Helsinki' });
  const mon = part({ month: 'short' });
  const day = part({ day: 'numeric' }).padStart(2);
  const recent = Date.now() - d.getTime() < 182 * 86400000;
  const tail = recent ? part({ hour: '2-digit', minute: '2-digit', hour12: false }) : ' ' + part({ year: 'numeric' });
  return `${mon} ${day} ${tail}`;
}

export function printLs(node, path, all = false, long = false) {
  const names = Object.keys(node.children)
    .filter((n) => all || !node.children[n].hidden)
    .sort((a, b) => a.replace(/^\./, '').localeCompare(b.replace(/^\./, '')));
  const user = D.machine.user;
  if (long) {
    print(`total ${names.length * 4}`);
    for (const n of names) {
      const ch = node.children[n];
      const perm = ch.type === 'dir' ? 'drwxr-xr-x' : ch.type === 'exe' ? '-rwxr-xr-x' : '-rw-r--r--';
      const size = ch.type === 'dir' ? 4096 : (ch.size ?? ch.body?.length ?? 312);
      print(`${dim(`${perm} ${user} ${user} ${String(size).padStart(5)} ${lsDate(ch.date)}`)} ${lsItem(ch, n, path)}`);
    }
  } else if (names.length) {
    print(names.map((n) => lsItem(node.children[n], n, path)).join('  '));
  }
}

export function contactHTML() {
  const w = Math.max(...D.links.map((l) => l.id.length)) + 2;
  const short = (u) => u.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
  return D.links
    .map((l) => `<span class="dir">${esc(l.id.padEnd(w))}</span><a class="lnk" href="${esc(l.url)}" target="_blank" rel="noopener me">${esc(short(l.url))}</a>`)
    .join('\n');
}

const heading = (l) => (l.startsWith('# ') ? `<span class="h1">${esc(l)}</span>` : esc(l));
const readMore = (route) => print(`${dim('Read more: ')}${link(esc('open ' + route), 'open ' + route, route)}`);

export function printFile(r, name) {
  const n = r.node;
  if (n.special === 'contact') { print(contactHTML()); return; }
  if (n.type === 'exe') {
    print(dim('^?ELF^B^A^A^@^@^@^@^@^@^@^@^@^C^@>^@^A^@^@^@`^P^@^@^@^@^@^@@^@^@^@'));
    print(`${dim(`cat: ${name}: this is a program, not a text file. Run it: `)}${link(esc(n.project.id), n.project.id, n.project.path)}`);
    return;
  }
  if (n.post) {
    print(`<span class="h1">${esc('# ' + n.post.title)}</span>\n${esc(n.post.description)}`);
    readMore(n.route);
    return;
  }
  print(n.body.split('\n').map(heading).join('\n'));
  if (n.route) readMore(n.route);
}

export function printCat(args) {
  if (!args.length) { printText('usage: cat <file>   (try: cat README.md)'); return; }
  for (const t of args) {
    const r = resolve(t);
    if (!r) { printText(`cat: ${t}: No such file or directory`, 'err'); continue; }
    if (r.node.type === 'dir') { printText(`cat: ${t}: Is a directory`, 'err'); continue; }
    printFile(r, t);
  }
}
