/*
  The shell: core commands, dispatch and tab completion.
  The command table merges CORE (here), SYSTEM (system.js) and EGGS (eggs.js).
*/
import { D, HOME, MAN, S, SH, TZ, clear, dim, esc, link, print, printText, wait } from './state.js';
import { contactHTML, findProject, isOutsideHome, printCat, printLs, resolve } from './fs.js';
import { fetchHTML, findPage, manHTML, openPage, printHelp, printLog, runProject } from './content.js';
import { SYSTEM } from './system.js';
import { EGGS, PHRASES, vimInput } from './eggs.js';
import { intro, reboot } from './intro.js';

const m = D.machine;
const ENV = { USER: m.user, HOME, SHELL: `/usr/bin/${SH}`, HOSTNAME: m.host, PATH: `${HOME}/projects:/usr/local/bin:/usr/bin:/bin`, LANG: 'fi_FI.UTF-8', TZ, EDITOR: 'vim' };
const pwd = () => HOME + (S.cwd.length ? '/' + S.cwd.join('/') : '');
const expand = (s) => s.replace(/\$(\w+)/g, (_, k) => (k === 'PWD' ? pwd() : (ENV[k] ?? '')));

function fileType(node, name) {
  if (node.type === 'dir') return 'directory';
  if (node.type === 'exe') return 'ELF 64-bit LSB pie executable, x86-64, dynamically linked. Or a Markdown file in disguise.';
  if (name.endsWith('.html')) return 'HTML document, UTF-8 Unicode text';
  if (name.endsWith('.1')) return 'troff or preprocessor input, ASCII text';
  return 'ASCII text';
}

function gitLog(a) {
  let n = 5;
  a.forEach((x, i) => { const d = /^-n?(\d+)$/.exec(x); if (d) n = +d[1]; else if (x === '-n') n = +a[i + 1] || n; });
  printLog(Math.max(1, n));
}

async function logout() {
  printText('logout');
  await wait(500);
  clear();
  S.cwd = []; S.mode = 'sh';
  await intro({ boot: false, auto: false });
}

async function poweroff() {
  printText('Guests cannot power off this machine. Rebooting instead.');
  await wait(900);
  await reboot();
}

const CORE = {
  /* Help and pages */
  help: () => printHelp(), '?': () => printHelp(),
  open: (a) => openPage(a[0]), 'xdg-open': (a) => openPage(a[0]),
  contact: () => print(contactHTML()),

  /* Files */
  ls: (a) => {
    const flags = a.filter((x) => x.startsWith('-')).join('');
    const tgt = a.find((x) => !x.startsWith('-'));
    if (tgt && isOutsideHome(tgt)) {
      print(['bin', 'boot', 'dev', 'etc', 'home', 'opt', 'proc', 'srv', 'usr', 'var'].map((d) => `<span class="dir">${d}</span>`).join('  '));
      print(dim('Guests can look, not touch.'));
      return;
    }
    const r = resolve(tgt);
    if (!r) { printText(`ls: cannot access '${tgt}': No such file or directory`, 'err'); return; }
    if (r.node.type !== 'dir') { print(link(esc(tgt), r.node.type === 'exe' ? r.node.project.id : `cat ${tgt}`)); return; }
    printLs(r.node, r.path, flags.includes('a'), flags.includes('l'));
  },
  ll: (a) => CORE.ls(['-la', ...a]),
  la: (a) => CORE.ls(['-a', ...a]),
  dir: (a) => CORE.ls(a),
  cd: (a) => {
    const t = a[0];
    if (!t || t === '~') { S.cwd = []; return; }
    if (isOutsideHome(t)) { printText(`${SH}: cd: ${t}: Permission denied`, 'err'); return; }
    const r = resolve(t);
    if (!r) { printText(`${SH}: cd: ${t}: No such file or directory`, 'err'); return; }
    if (r.node.type !== 'dir') { printText(`${SH}: cd: ${t}: Not a directory`, 'err'); return; }
    S.cwd = r.path;
  },
  'cd..': () => CORE.cd(['..']),
  pwd: () => printText(pwd()),
  cat: printCat, less: printCat, more: printCat, bat: printCat,
  file: (a) => {
    for (const t of a) {
      const r = resolve(t);
      printText(r ? `${t}: ${fileType(r.node, t)}` : `${t}: cannot open '${t}' (No such file or directory)`);
    }
  },

  /* About */
  fastfetch: () => print(fetchHTML(), 'block'),
  neofetch: () => { print(dim('neofetch is archived upstream. Running fastfetch instead.')); CORE.fastfetch(); },
  man: (a) => {
    const t = a[a.length - 1];
    if (!t) { printText(`What manual page do you want?\nFor example, try: man ${MAN}`); return; }
    if (t === MAN || t === D.brand) { print(manHTML(), 'block'); return; }
    if (t === 'man') { printText(`The manual for manuals is not installed. Try: man ${MAN}`); return; }
    const p = findProject(t);
    if (p) { runProject(p, ['--help']); return; }
    printText(`No manual entry for ${t}`, 'err');
  },
  git: (a) => {
    const sub = a[0] || '';
    if (sub === 'log' || sub === 'lg') return gitLog(a);
    if (sub === 'status') { printText("On branch main\nYour branch is up to date with 'origin/main'.\n\nnothing to commit, working tree clean"); return; }
    if (sub === 'blame') { printText(`Every line: ${D.owner.short}. No one else to blame.`); return; }
    if (sub === 'push') { const f = a.includes('--force') || a.includes('-f'); printText(f ? 'remote: Force push rejected. Not on main. Not today.' : 'Everything up-to-date', f ? 'err' : ''); return; }
    if (sub === 'pull') { printText('Already up to date.'); return; }
    if (sub === 'commit') { printText('On branch main\nnothing to commit. Guests do not get write access.'); return; }
    if (!sub) { printText('usage: git log | status | blame'); return; }
    printText(`git: '${sub}' is not a git command. See 'git --help'.`, 'err');
  },

  /* Shell */
  history: () => S.hist.forEach((h, i) => printText(`${String(i + 1).padStart(5)}  ${h}`)),
  clear,
  whoami: () => printText(m.user),
  who: () => { printText(`${m.user.padEnd(8)} tty1     just now`); printText(`${MAN.padEnd(8)} pts/0    somewhere in ${D.owner.location.split(',')[0]}`); },
  id: () => printText(`uid=1000(${m.user}) gid=1000(${m.user}) groups=1000(${m.user}),998(curious)`),
  date: () => printText(new Date().toLocaleString('en-GB', { timeZone: TZ, dateStyle: 'full', timeStyle: 'long' })),
  echo: (_a, line) => printText(expand(line.replace(/^\s*\S+\s?/, ''))),
  env: () => Object.entries(ENV).forEach(([k, v]) => printText(`${k}=${v}`)),
  printenv: () => CORE.env(),
  which: (a) => {
    const t = a[0];
    if (!t) return;
    if (findProject(t)) printText(`${HOME}/projects/${t}`);
    else if (Object.hasOwn(C, t)) printText(`/usr/bin/${t}`);
    else printText(`which: no ${t} in (${ENV.PATH})`, 'err');
  },
  exit: logout, logout,
  reboot: () => reboot(),
  poweroff, shutdown: poweroff, halt: poweroff,
};

/* Core wins on a name clash, so an egg can never shadow a real command. */
export const C = { ...EGGS, ...SYSTEM, ...CORE };

/* Shown in completion and "Did you mean". Projects join through PATH. */
const VISIBLE = ['help', 'ls', 'cd', 'cat', 'open', 'contact', 'fastfetch', 'man', 'git', 'htop', 'history', 'clear', 'whoami', 'uname', 'date', 'uptime', 'echo', 'pwd', 'which', 'file', 'exit'];
const commandNames = () => [...VISIBLE, ...D.projects.map((p) => p.id)];

function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}
function notFound(cmd) {
  printText(`${SH}: ${cmd}: command not found`, 'err');
  const best = commandNames().map((c) => [c, levenshtein(cmd.toLowerCase(), c)]).sort((x, y) => x[1] - y[1])[0];
  if (best && best[1] <= 2) print(`${dim('Did you mean ')}${link(esc(best[0]), best[0])}${dim('?')}`);
}

/* A path with a slash runs a program, like ./homelab or ~/projects/homelab. */
function runPath(cmd, args) {
  const r = resolve(cmd);
  if (!r) { printText(`${SH}: ${cmd}: No such file or directory`, 'err'); return; }
  if (r.node.type === 'dir') { printText(`${SH}: ${cmd}: Is a directory`, 'err'); return; }
  if (r.node.type !== 'exe') { printText(`${SH}: ${cmd}: Permission denied`, 'err'); return; }
  return runProject(r.node.project, args);
}

/* Lookup order: vim mode, whole-line phrases, paths, commands, page names, projects on PATH. */
export async function dispatch(line) {
  if (S.mode === 'vim') return vimInput(line);
  const phrase = line.toLowerCase().replace(/\s+/g, ' ').trim();
  if (Object.hasOwn(PHRASES, phrase)) return PHRASES[phrase]();
  const [cmd, ...args] = line.trim().split(/\s+/);
  if (cmd.includes('/')) return runPath(cmd, args);
  const name = Object.hasOwn(C, cmd) ? cmd : cmd.toLowerCase();
  if (Object.hasOwn(C, name)) return C[name](args, line);
  const page = findPage(name);
  if (page) return openPage(page.id);
  const project = findProject(cmd) ?? findProject(name);
  if (project) return runProject(project, args);
  notFound(cmd);
}

/* ---------------- Completion ---------------- */
function commonPrefix(arr) {
  if (!arr.length) return '';
  let p = arr[0];
  for (const s of arr) while (!s.startsWith(p)) p = p.slice(0, -1);
  return p;
}

/* Returns the new input value, or a list of candidates to print. */
export function complete(v) {
  const parts = v.split(' ');
  let last = parts[parts.length - 1];
  let cands, replaceWith, dirPart = '';
  if (parts.length === 1 && !last.includes('/')) {
    cands = commandNames().filter((c) => c.startsWith(last));
    replaceWith = (c) => c + ' ';
  } else {
    const slash = last.lastIndexOf('/');
    dirPart = slash >= 0 ? last.slice(0, slash + 1) : '';
    const pre = last.slice(slash + 1);
    const r = resolve(dirPart || '.');
    if (!r || r.node.type !== 'dir') return { value: v };
    cands = Object.keys(r.node.children)
      .filter((n) => n.startsWith(pre) && (pre.startsWith('.') || !r.node.children[n].hidden))
      .map((n) => n + (r.node.children[n].type === 'dir' ? '/' : ''));
    replaceWith = (c) => dirPart + c + (c.endsWith('/') ? '' : ' ');
    last = pre;
  }
  if (!cands.length) return { value: v };
  const head = parts.slice(0, -1).join(' ') + (parts.length > 1 ? ' ' : '');
  if (cands.length === 1) return { value: head + replaceWith(cands[0]) };
  const cp = commonPrefix(cands);
  if (cp.length > last.length) return { value: head + dirPart + cp };
  return { value: v, list: cands };
}
