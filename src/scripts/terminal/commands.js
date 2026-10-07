/* Commands, dispatch and tab completion. */
import { D, HOME, S, T0, clear, dim, esc, hashNum, link, print, printText, sleep, wait } from './state.js';
import { contactHTML, findProject, isOutsideHome, printCat, printLs, resolve } from './fs.js';
import { fetchHTML, manHTML, manName, openPage, printHelp, printLog, runProject } from './content.js';
import { aptList, aptUpdate, aptUpgrade, brew, dockerPs, fakeWipe, matrix, moosesay, nvidiaSmi, ping, sauna, sl } from './eggs.js';
import { htop } from './htop.js';
import { intro, reboot } from './intro.js';

const m = D.machine;
const ENV = { USER: m.user, HOME, SHELL: '/usr/bin/jsh', HOSTNAME: m.host, PATH: `${HOME}/projects:/usr/local/bin:/usr/bin:/bin`, LANG: 'fi_FI.UTF-8', TZ: 'Europe/Helsinki', EDITOR: 'vim' };
const pwd = () => HOME + (S.cwd.length ? '/' + S.cwd.join('/') : '');
const expand = (s) => s.replace(/\$(\w+)/g, (_, k) => (k === 'PWD' ? pwd() : (ENV[k] ?? '')));
const readOnly = (c, a) => printText(`${c}: cannot modify '${a.filter((x) => !x.startsWith('-')).pop() || ''}': Read-only file system`, 'err');
const kernelLine = () => `Linux ${m.host} ${m.kernel} #1 SMP PREEMPT_DYNAMIC PMX ${m.kernel.replace(/-pve$/, '')} x86_64 GNU/Linux`;

async function apt(a, { root = false } = {}) {
  const sub = a.find((x) => !x.startsWith('-')) || '';
  if (sub === 'update') return aptUpdate({ root });
  if (['upgrade', 'full-upgrade', 'dist-upgrade'].includes(sub)) return aptUpgrade({ root });
  if (sub === 'list') return aptList();
  if (sub === 'install') {
    const pkg = a[a.indexOf('install') + 1];
    if (!pkg) { printText('E: No packages specified'); return; }
    if (pkg === 'coffee' || pkg === 'kahvi') return brew();
    if (pkg === 'sauna') return sauna();
    if (!root) { printText('E: Could not open lock file /var/lib/dpkg/lock-frontend - open (13: Permission denied)', 'err'); return; }
    printText(`E: Unable to locate package ${pkg}`, 'err');
    return;
  }
  if (sub === 'remove' || sub === 'purge') { printText('E: Could not open lock file /var/lib/dpkg/lock-frontend - open (13: Permission denied)', 'err'); return; }
  if (!sub) { printText('apt 3.0.3 (amd64)\nUsage: apt [options] command\n\nMost used commands:\n  list, update, upgrade, full-upgrade, install'); return; }
  printText(`E: Invalid operation ${sub}`, 'err');
}

export const C = {
  help: () => printHelp(),
  '?': () => printHelp(),
  apua: () => printHelp('Apua tulossa. (Help is on the way.)'),
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
  ll: (a) => C.ls(['-la', ...a]),
  la: (a) => C.ls(['-a', ...a]),
  dir: (a) => C.ls(a),
  cd: (a) => {
    const t = a[0];
    if (!t || t === '~') { S.cwd = []; return; }
    if (isOutsideHome(t)) { printText(`jsh: cd: ${t}: Permission denied`, 'err'); return; }
    const r = resolve(t);
    if (!r) { printText(`jsh: cd: ${t}: No such file or directory`, 'err'); return; }
    if (r.node.type !== 'dir') { printText(`jsh: cd: ${t}: Not a directory`, 'err'); return; }
    S.cwd = r.path;
  },
  'cd..': () => C.cd(['..']),
  pwd: () => printText(pwd()),
  cat: (a) => printCat(a),
  less: (a) => printCat(a), more: (a) => printCat(a), bat: (a) => printCat(a),
  file: (a) => {
    for (const t of a) {
      const r = resolve(t);
      if (!r) { printText(`${t}: cannot open '${t}' (No such file or directory)`); continue; }
      const n = r.node;
      printText(`${t}: ${n.type === 'dir' ? 'directory' : n.type === 'exe' ? 'ELF 64-bit LSB pie executable, x86-64, dynamically linked. Or a Markdown file in disguise.' : t.endsWith('.html') ? 'HTML document, UTF-8 Unicode text' : 'ASCII text'}`);
    }
  },
  open: (a) => openPage(a[0]), 'xdg-open': (a) => openPage(a[0]),
  contact: () => print(contactHTML()),
  fastfetch: () => print(fetchHTML(), 'block'),
  neofetch: () => { print(dim('neofetch is archived upstream. Running fastfetch instead.')); C.fastfetch(); },
  man: (a) => {
    const t = a[a.length - 1];
    if (!t) { printText(`What manual page do you want?\nFor example, try: man ${manName()}`); return; }
    if (t === manName() || t === D.domain.split('.')[0]) { print(manHTML(), 'block'); return; }
    if (t === 'man') { printText(`The manual for manuals is not installed. Try: man ${manName()}`); return; }
    const p = findProject(t);
    if (p) { runProject(p, ['--help']); return; }
    printText(`No manual entry for ${t}`, 'err');
  },
  git: (a) => {
    const sub = a[0] || '';
    if (sub === 'log' || sub === 'lg') {
      let n = 5;
      a.forEach((x, i) => { const d = /^-n?(\d+)$/.exec(x); if (d) n = +d[1]; else if (x === '-n') n = +a[i + 1] || n; });
      printLog(Math.max(1, n));
      return;
    }
    if (sub === 'status') { printText("On branch main\nYour branch is up to date with 'origin/main'.\n\nnothing to commit, working tree clean"); return; }
    if (sub === 'blame') { printText(`Every line: ${D.owner.short}. No one else to blame.`); return; }
    if (sub === 'push') { const f = a.includes('--force') || a.includes('-f'); printText(f ? 'remote: Force push rejected. Not on main. Not today.' : 'Everything up-to-date', f ? 'err' : ''); return; }
    if (sub === 'pull') { printText('Already up to date.'); return; }
    if (sub === 'commit') { printText('On branch main\nnothing to commit. Guests do not get write access.'); return; }
    if (!sub) { printText('usage: git log | status | blame'); return; }
    printText(`git: '${sub}' is not a git command. See 'git --help'.`, 'err');
  },
  htop: () => htop(), top: () => htop(), btop: () => htop(),
  'nvidia-smi': () => nvidiaSmi(),
  docker: (a) => { if (a[0] === 'ps') dockerPs(); else printText(`docker: '${a[0] || ''}' is not available for guests. Try: docker ps`, 'err'); },
  pveversion: () => printText(`pve-manager/${m.os.replace(/^\D+/, '')}/${hashNum(m.kernel).toString(16).padStart(8, '0')} (running kernel: ${m.kernel})`),
  systemctl: (a) => {
    if (a[0] !== 'status') { printText('Failed to connect to bus: guests only get status. Try: systemctl status', 'err'); return; }
    const s = D.services.find((x) => x.unit === a[1]?.replace(/\.service$/, ''));
    if (!s) { printText(`● ${m.host}\n    State: running\n    Units: ${D.services.length + 41} loaded`); return; }
    print(`<span class="ok">●</span> ${esc(s.unit)}.service - ${esc(s.description)}\n     Loaded: loaded (/etc/systemd/system/${esc(s.unit)}.service; enabled)\n     Active: <span class="ok">active (running)</span>\n   Main PID: ${300 + (hashNum(s.unit) % 3700)} (${esc(s.cmd.split(' ')[0])})`);
  },
  history: () => S.hist.forEach((h, i) => printText(`${String(i + 1).padStart(5)}  ${h}`)),
  clear: () => clear(),
  cls: () => { clear(); print(dim('cls: this is not Windows. Cleared anyway.')); },
  whoami: () => printText(m.user),
  who: () => { printText(`${m.user.padEnd(8)} tty1     just now`); printText(`${manName().padEnd(8)} pts/0    somewhere in Helsinki`); },
  id: () => printText(`uid=1000(${m.user}) gid=1000(${m.user}) groups=1000(${m.user}),998(curious)`),
  hostname: () => printText(m.host),
  uname: (a) => printText(a.includes('-a') ? kernelLine() : a.includes('-r') ? m.kernel : 'Linux'),
  date: () => printText(new Date().toLocaleString('en-GB', { timeZone: 'Europe/Helsinki', dateStyle: 'full', timeStyle: 'long' })),
  uptime: () => {
    const now = new Date().toLocaleTimeString('en-GB', { timeZone: 'Europe/Helsinki' });
    const mins = Math.floor((Date.now() - T0) / 60000);
    printText(` ${now} up 12 days, ${mins} min,  1 user,  load average: 0.42, 0.37, 0.31`);
  },
  echo: (_a, line) => printText(expand(line.replace(/^\s*echo\s?/, ''))),
  env: () => Object.entries(ENV).forEach(([k, v]) => printText(`${k}=${v}`)),
  printenv: () => C.env(),
  which: (a) => {
    const t = a[0];
    if (!t) return;
    if (findProject(t)) printText(`${HOME}/projects/${t}`);
    else if (Object.prototype.hasOwnProperty.call(C, t)) printText(`/usr/bin/${t}`);
    else printText(`which: no ${t} in (${ENV.PATH})`, 'err');
  },
  exit: async () => { printText('logout'); await wait(500); clear(); S.cwd = []; S.mode = 'sh'; await intro({ boot: false, auto: false }); },
  logout: () => C.exit(),
  reboot: () => reboot(),
  poweroff: async () => { printText('Guests cannot power off this machine. Rebooting instead.'); await wait(900); await reboot(); },
  shutdown: () => C.poweroff(), halt: () => C.poweroff(),

  /* Easter eggs */
  sudo: async (a) => {
    if (!a.length) { printText('usage: sudo <command>'); return; }
    print(`[sudo] password for ${esc(m.user)}: `);
    await sleep(1100);
    printText(`${m.user} is not in the sudoers file. This incident will be reported.`, 'err');
    await sleep(500);
    print(dim('Reported to: nobody. Relax.'));
    if ((a[0] === 'apt' || a[0] === 'apt-get') && !S.cancel) {
      await sleep(400);
      print(dim('Running a pretend one for guests instead.'));
      await sleep(300);
      await apt(a.slice(1), { root: true });
    }
  },
  su: () => printText('su: Authentication failure', 'err'),
  please: () => printText('Manners noted. Still no root.'),
  rm: (a) => { if (!a.length) printText('rm: missing operand', 'err'); else readOnly('rm', a); },
  mkdir: (a) => readOnly('mkdir', a), touch: (a) => readOnly('touch', a), mv: (a) => readOnly('mv', a),
  cp: (a) => readOnly('cp', a), chmod: (a) => readOnly('chmod', a), chown: (a) => readOnly('chown', a),
  kill: () => printText('kill: guests cannot kill processes. htop shows them, though.', 'err'),
  apt: (a) => apt(a), 'apt-get': (a) => apt(a),
  dpkg: (a) => (a[0] === '-l' ? aptList() : printText('dpkg: error: need an action option. Try: dpkg -l', 'err')),
  pacman: () => { printText('jsh: pacman: command not found', 'err'); print(`${dim('This is Proxmox, so Debian underneath. Try: ')}${link('apt update', 'apt update')}`); },
  yay: () => { printText('jsh: yay: command not found', 'err'); print(dim('No AUR on Debian. There is a backports repo, though.')); },
  paru: () => C.yay(),
  vim: () => {
    S.mode = 'vim';
    for (let i = 0; i < 4; i++) print('<span class="tilde">~</span>');
    print(dim('"[No Name]" 0L, 0B'));
    print(dim('You are in vim now. Type :q and press Enter to leave.'));
  },
  vi: () => C.vim(), nvim: () => C.vim(),
  emacs: () => printText('emacs: not installed. A fine operating system, though. Try vim.'),
  nano: () => printText('nano: a sensible choice. Also not installed.'),
  ':q': () => printText('You are not in vim. The reflex is strong, though.'),
  ':wq': () => C[':q'](), q: () => C[':q'](),
  sl: () => sl(),
  cowsay: (_a, line) => { print(dim('No cows here. A moose volunteered.')); moosesay(line.replace(/^\s*cowsay\s?/, '') || 'Moo.'); },
  moosesay: (_a, line) => moosesay(line.replace(/^\s*moosesay\s?/, '')),
  matrix: () => matrix(), cmatrix: () => matrix(),
  sauna: () => sauna(), löyly: () => sauna(), loyly: () => sauna(),
  kahvi: () => brew(), coffee: () => brew(),
  make: (a) => {
    if (!a.length) { printText('make: *** No targets specified and no makefile found.  Stop.', 'err'); return; }
    printText(`make: *** No rule to make target '${a[0]}'.  Stop.`, 'err');
    if (a.join(' ') === 'coffee') print(dim('Try: kahvi'));
  },
  sisu: () => printText('sisu (n.), Finnish: grit that shows up when the easy options are gone.\nAlso how this site got finished.'),
  moi: () => printText('Moi! Finnish works here too. Try: apua'),
  hei: () => C.moi(), terve: () => C.moi(), moikka: () => C.moi(), moro: () => C.moi(),
  kiitos: () => printText('Ole hyvä.'),
  thanks: () => printText("You're welcome."),
  turku: () => printText('Turku: the oldest city in Finland and its former capital.\nThis terminal has a Turku accent. Mää ja sää.'),
  ssh: (a) => {
    const h = (a.find((x) => !x.startsWith('-')) || '').split('@').pop();
    if (!h) { printText('usage: ssh <host>'); return; }
    printText(`ssh: connect to host ${h} port 22: Connection refused`, 'err');
    print(dim(h === 'homelab' ? '(The homelab only talks to keys it knows.)' : h === m.host ? '(You are already here.)' : '(Nice try.)'));
  },
  ping: (a) => ping(a),
  curl: (a) => {
    const u = (a.find((x) => !x.startsWith('-')) || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (!u) { printText(`curl: try 'curl ${D.domain}'`); return; }
    if (u === D.domain || u === 'localhost') {
      const o = D.owner;
      printText(`${D.domain}, plain text edition\n\n${o.name}. ${o.role}. ${o.location}.\n${o.focus}.\n\nPages: ${D.pages.map((p) => p.path).join('  ')}`);
      return;
    }
    if (u.startsWith('wttr.in')) { printText('Helsinki: dark, probably. Check a window.'); return; }
    printText(`curl: (6) Could not resolve host: ${u}`, 'err');
  },
  fortune: () => printText(D.fortunes[Math.floor(Math.random() * D.fortunes.length)]),
  xyzzy: () => printText('Nothing happens.'),
  42: () => printText('Correct answer. The question is still in code review.'),
  hello: () => printText('Hello. Type help to see what this shell can do.'),
  hi: () => C.hello(),
  btw: () => printText('Not on this box. Proxmox, btw.'),
  theme: (a) => {
    if (a[0] === 'dawn' || a[0] === 'light') { printText('Rosé Pine Dawn exists. Helsinki in December has very little dawn.'); return; }
    printText('Rosé Pine, main variant. There is only dark mode here.\nHelsinki gets less than six hours of daylight in December.');
  },
  light: () => C.theme(['light']),
};

/* Shown in completion and "Did you mean". Projects join through PATH. */
const VISIBLE = ['help', 'ls', 'cd', 'cat', 'open', 'contact', 'fastfetch', 'man', 'git', 'htop', 'history', 'clear', 'whoami', 'uname', 'date', 'uptime', 'echo', 'pwd', 'which', 'file', 'exit'];
export const commandNames = () => [...VISIBLE, ...D.projects.map((p) => p.id)];

function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}
function notFound(cmd) {
  printText(`jsh: ${cmd}: command not found`, 'err');
  const best = commandNames().map((c) => [c, levenshtein(cmd.toLowerCase(), c)]).sort((x, y) => x[1] - y[1])[0];
  if (best && best[1] <= 2) print(`${dim('Did you mean ')}${link(esc(best[0]), best[0])}${dim('?')}`);
}

function vimInput(line) {
  const t = line.trim();
  const c = t.startsWith(':') ? t : ':' + t;
  if ([':q', ':q!', ':wq', ':wq!', ':x', ':qa', ':qa!'].includes(c) || t === 'ZZ') {
    S.mode = 'sh';
    printText('You escaped vim. Few do.');
    return;
  }
  if (c === ':help') { printText('Type :q to quit. That is the whole tutorial.'); return; }
  printText(`E492: Not an editor command: ${c.slice(1)}`, 'err');
}

/* A path with a slash runs a program, like ./homelab or ~/projects/homelab. */
function runPath(cmd, args) {
  const r = resolve(cmd);
  if (!r) { printText(`jsh: ${cmd}: No such file or directory`, 'err'); return; }
  if (r.node.type === 'dir') { printText(`jsh: ${cmd}: Is a directory`, 'err'); return; }
  if (r.node.type !== 'exe') { printText(`jsh: ${cmd}: Permission denied`, 'err'); return; }
  return runProject(r.node.project, args);
}

const SPECIAL = {
  'sudo rm -rf /': fakeWipe,
  'sudo rm -rf / --no-preserve-root': fakeWipe,
  'sudo rm -rf --no-preserve-root /': fakeWipe,
  'rm -rf / --no-preserve-root': fakeWipe,
  'rm -rf --no-preserve-root /': fakeWipe,
  'rm -rf /': () => { printText("rm: it is dangerous to operate recursively on '/'", 'err'); printText('rm: use --no-preserve-root to override this failsafe', 'err'); },
  'sudo make me a sandwich': () => printText('Okay.'),
  'make me a sandwich': () => printText('What? Make it yourself.'),
  'i use arch btw': () => C.btw(),
  'sudo pacman -syu': () => C.pacman(),
};

export async function dispatch(line) {
  if (S.mode === 'vim') return vimInput(line);
  const l = line.toLowerCase().replace(/\s+/g, ' ').trim();
  if (Object.prototype.hasOwnProperty.call(SPECIAL, l)) return SPECIAL[l]();
  const tokens = line.trim().split(/\s+/);
  const cmd = tokens[0], args = tokens.slice(1);
  if (cmd.includes('/')) return runPath(cmd, args);
  const own = (k) => Object.prototype.hasOwnProperty.call(C, k);
  const fn = own(cmd) ? C[cmd] : own(cmd.toLowerCase()) ? C[cmd.toLowerCase()] : null;
  if (fn) return fn(args, line);
  /* Page names work as shortcuts, like the dock buttons. */
  const page = D.pages.find((p) => p.id === cmd.toLowerCase() || (cmd.toLowerCase() === 'blog' && p.id === 'writing'));
  if (page) return openPage(page.id);
  const project = findProject(cmd) || findProject(cmd.toLowerCase());
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

