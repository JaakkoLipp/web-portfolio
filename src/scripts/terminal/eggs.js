/*
  Easter eggs: jokes and toys. Exports EGGS (commands), PHRASES (whole-line matches)
  and vimInput (the vim mode). Add a new egg here and nowhere else.
*/
import { D, RM, S, SH, clear, dim, esc, link, print, printText, progress, rand, scroll, sleep, wait } from './state.js';
import { printHelp } from './content.js';
import { apt, aptInstallHooks } from './system.js';

const m = D.machine;
const readOnly = (c, a) => printText(`${c}: cannot modify '${a.filter((x) => !x.startsWith('-')).pop() || ''}': Read-only file system`, 'err');

/* ---------------- rm -rf / ---------------- */
async function fakeWipe() {
  print(`[sudo] password for ${esc(m.user)}: `);
  await sleep(700);
  const home = `/home/${m.user}`;
  const files = [`/boot/vmlinuz-${m.kernel}`, '/etc/fstab', '/etc/pve/storage.cfg', `/usr/bin/${SH}`, '/var/log/journal', `${home}/projects`, `${home}/.bash_history`, `${home}/sense-of-humour`];
  for (const f of files) {
    if (S.cancel) return;
    printText(`removed '${f}'`, 'dim');
    await sleep(rand(90, 220));
  }
  await sleep(800);
  if (!S.cancel) printText('Just kidding. This is a static site. Nothing here deletes that easily.');
}

/* ---------------- sl ---------------- */
const TRAIN = String.raw`      ~  ~   ~
     ~    ~
   ___||____     ______________   ______________
  |  _____  |___|              |_|              |
  | |_|_|_| |  ||    jaalip    | |   express    |
  |_________|__||______________|_|______________|
   (O)   (O)      (O)      (O)     (O)      (O)`;

async function sl() {
  const wrap = print('', 'trainwrap');
  const pre = document.createElement('pre');
  pre.className = 'train';
  pre.textContent = TRAIN;
  wrap.appendChild(pre);
  if (RM) { pre.style.position = 'static'; wrap.style.height = 'auto'; printText('The train is parked. Reduced motion is on.', 'dim'); return; }
  S.anyKeyCancels = true;
  const W = wrap.clientWidth, w = pre.scrollWidth, dur = 3800, t0 = performance.now();
  await new Promise((res) => {
    const f = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      pre.style.transform = `translateX(${W - (W + w) * p}px)`;
      if (p < 1 && !S.cancel) requestAnimationFrame(f); else res();
    };
    requestAnimationFrame(f);
  });
  wrap.remove();
  print(dim('The train left. You typed sl, not ls.'));
}

/* ---------------- cowsay, with a moose ---------------- */
const MOOSE = String.raw`     \
      \   \|/        \|/
           \\________//
            (  o   o  )
             \       /_________
              \_   _/          \__
                \_/  |  |-----|  |
                     |  |     |  |`;

function moosesay(msg) {
  msg = (msg || 'Moi.').slice(0, 200);
  const lines = [];
  let cur = '';
  for (const w of msg.split(/\s+/)) {
    if ((cur + ' ' + w).trim().length > 34) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(cur);
  const W = Math.max(...lines.map((l) => l.length));
  const body = lines.length === 1 ? [`< ${lines[0]} >`] : lines.map((l, i) => {
    const [a, b] = i === 0 ? ['/', '\\'] : i === lines.length - 1 ? ['\\', '/'] : ['|', '|'];
    return `${a} ${l.padEnd(W)} ${b}`;
  });
  printText([' ' + '_'.repeat(W + 2), ...body, ' ' + '-'.repeat(W + 2), MOOSE].join('\n'));
}
const argText = (line) => line.trim().split(/\s+/).slice(1).join(' ');

/* ---------------- matrix ---------------- */
async function matrix() {
  if (RM) { printText('Reduced motion is on, so the rain stays off.', 'dim'); return; }
  const css = getComputedStyle(document.documentElement);
  const [fg, accent, iris, bg] = ['--fg', '--accent', '--iris', '--bg'].map((v) => css.getPropertyValue(v).trim());
  const c = document.createElement('canvas');
  c.className = 'matrix';
  c.setAttribute('aria-hidden', 'true');
  document.body.appendChild(c);
  const dpr = Math.min(2, devicePixelRatio || 1);
  const w = innerWidth, h = innerHeight;
  c.width = w * dpr; c.height = h * dpr;
  const ctx = c.getContext('2d');
  ctx.scale(dpr, dpr);
  const fs = 16, cols = Math.ceil(w / fs);
  const drops = Array.from({ length: cols }, () => rand(-40, 0));
  const chars = 'アイウエオカキクケコサシスセソタチツテト0123456789ÄÖÅäöå<>/{}#$';
  S.anyKeyCancels = true;
  c.addEventListener('pointerdown', () => { S.cancel = true; });
  const end = performance.now() + 7000;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  await new Promise((res) => {
    let last = 0;
    const f = (t) => {
      if (t - last > 50) {
        last = t;
        ctx.globalAlpha = 0.2; ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h); ctx.globalAlpha = 1;
        ctx.font = `${fs}px "Martian Mono Variable", ui-monospace, monospace`;
        for (let i = 0; i < cols; i++) {
          const y = drops[i] * fs;
          ctx.fillStyle = Math.random() < 0.05 ? fg : (i % 7 === 0 ? iris : accent);
          ctx.fillText(chars[Math.floor(Math.random() * chars.length)], i * fs, y);
          if (y > h && Math.random() > 0.975) drops[i] = 0;
          drops[i]++;
        }
      }
      if (t < end && !S.cancel) requestAnimationFrame(f); else res();
    };
    requestAnimationFrame(f);
  });
  c.style.opacity = '0';
  await wait(300);
  c.remove();
  print(dim('Back to the terminal. The rain had ä and ö in it.'));
}

/* ---------------- Finnish things ---------------- */
async function sauna() {
  printText('Heating the kiuas (sauna stove)...');
  const d = print('');
  for (let t = 20; t <= 80; t += 4) {
    const n = Math.round(((t - 20) / 60) * 20);
    d.innerHTML = `${dim('temp')} [<span class="heat">${'#'.repeat(n)}</span>${'-'.repeat(20 - n)}] ${t}°C`;
    scroll();
    await sleep(110);
    if (S.cancel) return;
  }
  await sleep(300);
  printText('Löyly! The steam hits the ceiling.');
  printText('Sauna valmis. Drink water, then go swim in the lake.');
}

const CUP = String.raw`    ( (
     ) )
  .______.
  |      |]
  \      /
   '----'`;

async function brew() {
  printText('Brewing kahvi...');
  if (!await progress('kahvinkeitin', 20, 70)) return;
  print(`<pre class="art cup">${esc(CUP)}</pre>`, 'block');
  printText('Finns drink more coffee per person than almost any other country. Kahvi on valmis.');
}

/* `apt install coffee` and friends. */
Object.assign(aptInstallHooks, { coffee: brew, kahvi: brew, sauna });

/* ---------------- vim ---------------- */
function vim() {
  S.mode = 'vim';
  for (let i = 0; i < 4; i++) print('<span class="tilde">~</span>');
  print(dim('"[No Name]" 0L, 0B'));
  print(dim('You are in vim now. Type :q and press Enter to leave.'));
}

/* Input handling while S.mode is 'vim'. */
export function vimInput(line) {
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

/* ---------------- Commands ---------------- */
const notHere = (name, why) => { printText(`${SH}: ${name}: command not found`, 'err'); print(why); };
const moi = () => printText('Moi! Finnish works here too. Try: apua');
const btw = () => printText('Not on this box. Proxmox, btw.');
const pacman = () => notHere('pacman', `${dim('This is Proxmox, so Debian underneath. Try: ')}${link('apt update', 'apt update')}`);
const notVim = () => printText('You are not in vim. The reflex is strong, though.');
const hello = () => printText('Hello. Type help to see what this shell can do.');

export const EGGS = {
  apua: () => printHelp('Apua tulossa. (Help is on the way.)'),
  cls: () => { clear(); print(dim('cls: this is not Windows. Cleared anyway.')); },
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
  rm: (a) => (a.length ? readOnly('rm', a) : printText('rm: missing operand', 'err')),
  ...Object.fromEntries(['mkdir', 'touch', 'mv', 'cp', 'chmod', 'chown'].map((c) => [c, (a) => readOnly(c, a)])),
  kill: () => printText('kill: guests cannot kill processes. htop shows them, though.', 'err'),
  pacman, yay: () => notHere('yay', dim('No AUR on Debian. There is a backports repo, though.')),
  paru: () => notHere('paru', dim('No AUR on Debian. There is a backports repo, though.')),
  vim, vi: vim, nvim: vim,
  emacs: () => printText('emacs: not installed. A fine operating system, though. Try vim.'),
  nano: () => printText('nano: a sensible choice. Also not installed.'),
  ':q': notVim, ':wq': notVim, q: notVim,
  sl,
  cowsay: (_a, line) => { print(dim('No cows here. A moose volunteered.')); moosesay(argText(line) || 'Moo.'); },
  moosesay: (_a, line) => moosesay(argText(line)),
  matrix, cmatrix: matrix,
  sauna, löyly: sauna, loyly: sauna,
  kahvi: brew, coffee: brew,
  make: (a) => {
    if (!a.length) { printText('make: *** No targets specified and no makefile found.  Stop.', 'err'); return; }
    printText(`make: *** No rule to make target '${a[0]}'.  Stop.`, 'err');
    if (a.join(' ') === 'coffee') print(dim('Try: kahvi'));
  },
  sisu: () => printText('sisu (n.), Finnish: grit that shows up when the easy options are gone.\nAlso how this site got finished.'),
  moi, hei: moi, terve: moi, moikka: moi, moro: moi,
  kiitos: () => printText('Ole hyvä.'),
  thanks: () => printText("You're welcome."),
  turku: () => printText('Turku: the oldest city in Finland and its former capital.\nThis terminal has a Turku accent. Mää ja sää.'),
  fortune: () => printText(D.fortunes[Math.floor(Math.random() * D.fortunes.length)]),
  xyzzy: () => printText('Nothing happens.'),
  42: () => printText('Correct answer. The question is still in code review.'),
  hello, hi: hello,
  btw,
  theme: (a) => {
    if (a[0] === 'dawn' || a[0] === 'light') { printText('Rosé Pine Dawn exists. Helsinki in December has very little dawn.'); return; }
    printText('Rosé Pine, main variant. There is only dark mode here.\nHelsinki gets less than six hours of daylight in December.');
  },
  light: () => EGGS.theme(['light']),
};

/* Whole-line matches, checked before normal commands. Keys are lowercase with single spaces. */
const rmRoot = () => { printText("rm: it is dangerous to operate recursively on '/'", 'err'); printText('rm: use --no-preserve-root to override this failsafe', 'err'); };
export const PHRASES = {
  'sudo rm -rf /': fakeWipe,
  'sudo rm -rf / --no-preserve-root': fakeWipe,
  'sudo rm -rf --no-preserve-root /': fakeWipe,
  'rm -rf / --no-preserve-root': fakeWipe,
  'rm -rf --no-preserve-root /': fakeWipe,
  'rm -rf /': rmRoot,
  'sudo make me a sandwich': () => printText('Okay.'),
  'make me a sandwich': () => printText('What? Make it yourself.'),
  'i use arch btw': btw,
  'sudo pacman -syu': pacman,
};
