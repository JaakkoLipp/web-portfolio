/* Builders for the bigger blocks of output: logo, fastfetch, git log, help, man page, projects. */
import { shortUrl } from '../../lib/format';
import { D, MAN, PAGE_IDS, RM, S, T0, ago, dim, el, esc, link, print, printText, readMore, sleep } from './state.js';
import { resolve } from './fs.js';

/* JL logo, option C (shadow block). Block and shadow layers are split so the gradient only hits the blocks. */
const LOGO_BLOCK = [
  '     ██  ██',
  '     ██  ██',
  '     ██  ██',
  '██   ██  ██',
  ' █████   ███████',
  ' ',
].join('\n');
const LOGO_SHADOW = [
  '       ╗   ╗',
  '       ║   ║',
  '       ║   ║',
  '       ║   ║',
  '╚     ╔╝        ╗',
  ' ╚════╝  ╚══════╝',
].join('\n');

function logoHTML() {
  return `<div class="logo live" aria-hidden="true">
    <div class="logo-mark"><pre class="lg-block">${LOGO_BLOCK}</pre><pre class="lg-shadow">${LOGO_SHADOW}</pre></div>
    <div class="lg-word">${esc(D.brand)}<span class="lg-cur">▌</span></div>
  </div>`;
}

function uptimeShort() {
  const m = Math.floor((Date.now() - T0) / 60000);
  return m < 1 ? 'just now (your visit)' : `${m} min${m === 1 ? '' : 's'} (your visit)`;
}

/* Rosé Pine as terminal ANSI colors: normal row, then bright row. */
const SWATCH_1 = ['--bg-3', '--love', '--pine', '--gold', '--accent', '--iris', '--rose', '--fg'];
const SWATCH_2 = ['--faint', '--love', '--pine', '--gold', '--accent', '--iris', '--rose', '--fg'];

export function fetchHTML() {
  /* Only the newest logo on screen animates. */
  el.out.querySelectorAll('.logo.live').forEach((n) => n.classList.remove('live'));
  const { machine: m, owner: o } = D;
  const rows = [
    ['OS', `${m.os} x86_64`],
    ['Host', `${m.host} (serves ${D.domain})`],
    ['Kernel', `Linux ${m.kernel}`],
    ['Uptime', uptimeShort()],
    ['Shell', m.shell],
    ['Theme', 'Rosé Pine (main)'],
    ['Owner', o.name],
    ['Role', o.role],
    ['Focus', o.focus],
    ['Stack', o.stack],
    ['Location', o.location],
    ['Langs', o.langs],
  ];
  const sw = (arr) => arr.map((c) => `<span class="sw" style="background:var(${c})"></span>`).join('');
  const title = `${m.user}@${m.host}`;
  return `<div class="fetch">
    ${logoHTML()}
    <div class="info">
      <div><span class="pu">${esc(m.user)}</span>@<span class="pu">${esc(m.host)}</span></div>
      <div class="sep">${'-'.repeat(title.length)}</div>
      ${rows.map(([k, v]) => `<div><span class="k">${k}</span>: ${esc(v)}</div>`).join('')}
      <div class="swrow" aria-hidden="true">${sw(SWATCH_1)}<br>${sw(SWATCH_2)}</div>
    </div>
  </div>`;
}

export function printLog(n = 5) {
  D.log.slice(0, n).forEach((c, i) => {
    const ref = i === 0 ? '<span class="ref">(HEAD -&gt; main)</span> ' : '';
    print(`<span class="hash">${c.hash}</span> ${ref}<span class="ty">${esc(c.type)}:</span> ${link(esc(c.msg), c.cmd, c.href)} ${dim(`(${ago(c.date)})`)}`);
  });
  if (!D.log.length) print(dim('fatal: your current branch has no commits yet'));
}

/* The help screen: [group, [[command, description], ...]]. Clicking a command runs its first word. */
const HELP = [
  ['Pages', [['open <page>', `go to ${PAGE_IDS}`], ['contact', 'how to reach me']]],
  ['Projects', [['ls ~/projects', 'every project is a program here'], [D.projects[0]?.id ?? 'ls ~/projects', 'run one. Try --help too']]],
  ['Files', [['ls [dir]', 'list files (-a also shows hidden ones)'], ['cd <dir>', 'change directory'], ['cat <file>', 'print a file']]],
  ['About', [['fastfetch', 'summary card'], [`man ${MAN}`, 'the manual page'], ['git log', 'recent work'], ['htop', 'process view (simulated)']]],
  ['Shell', [['history', 'previous commands'], ['clear', 'clear the screen'], ['whoami, uname -a, date, uptime', 'the usual']]],
];

export function printHelp(title) {
  if (title) printText(title);
  for (const [g, rows] of HELP) {
    print(`<span class="grp">${g}</span>`, 'block');
    const cells = rows.map(([c, d]) => {
      const run = /[<[,]/.test(c) ? c.split(/ <| \[|,/)[0] : c;
      return `<span class="hc">${link(esc(c), run)}</span><span class="hd">${esc(d)}</span>`;
    }).join('');
    print(`<div class="help">${cells}</div>`, 'block');
  }
  print(dim('Tab completes. Up and down walk the history. Ctrl+C stops a command. Ctrl+L clears.'));
  print(dim('Some commands are not on this list.'));
}

export function manHTML() {
  const d = new Date();
  const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const NAME = MAN.toUpperCase();
  const m = D.man;
  const opt = (o) => `<dt>${esc(o.flag)}</dt><dd>${esc(o.text)}${o.see ? ` See ${link(esc(o.see.label), o.see.cmd)}.` : ''}</dd>`;
  return `<div class="man">
    <div class="mh"><span>${NAME}(1)</span><span>User Commands</span><span>${NAME}(1)</span></div>
    <h3>NAME</h3><p>${esc(m.name)}</p>
    <h3>SYNOPSIS</h3><p>${esc(m.synopsis)}</p>
    <h3>DESCRIPTION</h3>${m.description.map((p) => `<p>${esc(p)}</p>`).join('')}
    <h3>OPTIONS</h3><dl>${m.options.map(opt).join('')}</dl>
    <h3>ENVIRONMENT</h3><p>${m.environment.map(esc).join('<br>')}</p>
    <h3>FILES</h3><p>${D.pages.map((p) => link('~/' + esc(p.id), `ls ~/${p.id}`, p.path)).join('   ')}</p>
    <h3>BUGS</h3><p>${esc(m.bugs)}</p>
    <h3>SEE ALSO</h3><p>${link('contact(1)', 'contact')}, ${link('fastfetch(1)', 'fastfetch')}, ${link('git-log(1)', 'git log')}</p>
    <div class="mh mf"><span>${esc(D.domain)}</span><span>${ym}</span><span>${NAME}(1)</span></div>
  </div>`;
}

export function hintHTML() {
  return `${dim('Click a name above to open it, or type ')}${link('help', 'help')}${dim('.')}`;
}

/* ---------------- Projects are programs ---------------- */
export async function runProject(p, args = []) {
  const flag = args.find((a) => a.startsWith('-'));
  if (flag === '--version' || flag === '-V' || flag === '-v') { printText(`${p.id} ${p.version}`); return; }
  if (flag === '--help' || flag === '-h') {
    printText(`Usage: ${p.id} [--help] [--version]\n\n${p.summary}\n\nRun it without options for a summary. The full write-up is at ${p.path}.`);
    return;
  }
  if (flag) { printText(`${p.id}: unrecognized option '${flag}'`, 'err'); printText(`Try '${p.id} --help' for more information.`); return; }
  if (!RM) {
    const d = print(dim(`Starting ${p.id}...`));
    await sleep(320);
    if (S.cancel) return;
    d.remove();
  }
  print(`<span class="exe">${esc(p.id)}</span> ${dim(p.version)}<span class="dim">:</span> ${esc(p.summary)}`);
  const rows = [];
  if (p.context) rows.push(['context', esc(p.context)]);
  if (p.status) rows.push(['status', `<span class="st-${esc(p.status)}">${esc(p.status)}</span>`]);
  if (p.stack.length) rows.push(['stack', esc(p.stack.join(', '))]);
  for (const l of p.links) rows.push([l.label.toLowerCase(), `<a class="lnk" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(shortUrl(l.url))}</a>`]);
  if (rows.length) print(rows.map(([k, v]) => `  <span class="k">${esc(k.padEnd(8))}</span> ${v}`).join('\n'));
  readMore(p.path);
}

/* ---------------- Navigation ---------------- */
/* A page by id or alias (site.config.ts `aliases`). */
export const findPage = (name) => D.pages.find((p) => p.id === name || p.aliases?.includes(name));

/* Every name `open` understands: '/', page ids, aliases and paths, project and post ids and paths. */
const ROUTES = new Map([
  ['/', '/'],
  ...D.pages.flatMap((p) => [p.id, p.path, ...(p.aliases ?? [])].map((k) => [k, p.path])),
  ...[...D.projects, ...D.posts].flatMap((e) => [[e.id, e.path], [e.path, e.path]]),
]);

/* `open` also takes file system paths, like ~/projects/homelab or writing/post.md. */
function routeFor(name) {
  const key = name.replace(/^~\/?/, '').replace(/\/$/, '').replace(/\.md$/, '') || '/';
  const node = resolve(name)?.node;
  return ROUTES.get(key) ?? node?.route ?? node?.project?.path ?? null;
}

export function openPage(name) {
  if (!name) { printText(`usage: open <page>   (${PAGE_IDS}, or a project)`); return; }
  const route = routeFor(name);
  if (!route) { printText(`open: ${name}: no such page`, 'err'); return; }
  print(`Opening <span class="pd">${esc(D.domain + route)}</span>`);
  location.href = route;
}

