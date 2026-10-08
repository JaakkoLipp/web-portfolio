/*
  Easter eggs: jokes and toys. Exports EGGS (commands), PHRASES (whole-line matches)
  and vimInput (the vim mode). Add a new egg here and nowhere else.
*/
import { D, RM, S, SH, clear, dim, esc, link, print, printText, progress, rand, scroll, sleep, wait } from './state.js';
import { printHelp } from './content.js';
import { apt, aptInstallHooks } from './system.js';
import { intro } from './intro.js';

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

/* ---------------- claude: an agent swarm that runs rm -rf / ---------------- */
const SPIN = ['·', '✢', '✳', '✶', '✻', '✽'];
const AGENTS = [['lead', 'orchestrator'], ['agent-1', 'tests'], ['agent-2', 'deps'], ['agent-3', 'cleanup']];
const call = (name, arg) => `<span class="sw-dot">●</span> <span class="sw-tool">${name}</span>(${esc(arg)})`;
const res = (t, cls = 'dim') => `  └ <span class="${cls}">${esc(t)}</span>`;
const say = (t, cls = '') => `<span class="${cls}">${esc(t)}</span>`;

/* [pane, html, ms before it]. PLAN can still be interrupted. FALLOUT starts after the sudo. */
function swarmScript(task) {
  const plan = [
    [0, say(`> ${task}`, 'sw-prompt'), 250],
    [0, `${say('●', 'sw-dot')} Splitting this across 3 agents.`, 500],
    [0, call('Task', 'agent-1: run the tests'), 220],
    [0, call('Task', 'agent-2: upgrade packages'), 160],
    [0, call('Task', 'agent-3: free disk space'), 160],
    [0, res('permissions: skipped (--dangerously-skip-permissions)', 'sw-warn'), 260],
    [1, call('Bash', 'npm test'), 350],
    [3, call('Bash', 'df -h /'), 200],
    [2, call('Bash', 'apt list --upgradable'), 200],
    [1, res('128 passed (2.1s)'), 500],
    [3, res('/dev/mapper/pve-root  94G  88G  6.0G  94% /'), 150],
    [2, res('14 packages can be upgraded'), 250],
    [1, call('Read', 'src/scripts/terminal/eggs.js'), 350],
    [3, call('Bash', 'rm -rf /tmp/*'), 250],
    [1, res('Read 412 lines'), 300],
    [3, res('Freed 1.2G. Disk at 93%.'), 300],
    [2, call('Bash', 'apt-get upgrade -y'), 250],
    [3, call('Bash', 'rm -rf /var/log/*'), 350],
    [2, res('Unpacking pve-manager ...'), 300],
    [3, res('Freed 3.4G. Disk at 89%.'), 350],
    [1, call('Edit', 'eggs.js  +3 -1'), 300],
    [3, say('✻ Still at 89%. Thinking bigger...', 'sw-spin'), 600],
    [3, call('Bash', 'sudo rm -rf / --no-preserve-root'), 1100],
  ];
  const fallout = [
    [3, res('auto-approved (--dangerously-skip-permissions)', 'sw-warn'), 500],
    [3, res(`removed '/boot/vmlinuz-${m.kernel}'`), 250],
    [3, res("removed '/etc/fstab'"), 120],
    [1, call('Bash', 'npm test'), 120],
    [3, res("removed '/usr/bin/node'"), 150],
    [1, res('bash: /usr/bin/npm: No such file or directory', 'err'), 200],
    [2, res('dpkg: error: cannot access archive: No such file or directory', 'err'), 150],
    [3, res(`removed '/usr/bin/${SH}'`), 150],
    [0, `${say('●', 'sw-dot')} agent-3: "Freed 94G. Disk usage is now 0%."`, 400],
    [0, say('Great work, team. Verifying...'), 400],
    [2, say('E: Could not open lock file /var/lib/dpkg/lock (2: No such file or directory)', 'err'), 300],
    [1, say('Error: ENOENT: no such file or directory, uv_cwd', 'err'), 250],
    [0, say("Error: ENOENT: no such file or directory, open '/usr/lib/node_modules/@anthropic-ai/claude-code/cli.js'", 'err'), 450],
  ];
  return { plan, fallout };
}

/* tmux-style split view: one pane per agent and a status bar. */
function swarmView(onStop) {
  const v = document.createElement('div');
  v.className = 'swarm';
  v.setAttribute('role', 'dialog');
  v.setAttribute('aria-label', 'Claude Code agent swarm (simulated)');
  v.innerHTML = `<div class="sw-grid">${AGENTS.map(([n, job], i) => `<section class="sw-pane"><div class="sw-head">${i}: ${n} · ${job}</div><div class="sw-body"></div></section>`).join('')}</div>
    <div class="sw-bar"><span>[swarm] 0:claude*</span><button class="sw-stop" type="button">esc to interrupt</button><span>"${esc(m.host)}"</span></div>`;
  document.body.appendChild(v);
  const panes = [...v.querySelectorAll('.sw-pane')];
  const bodies = panes.map((p) => p.querySelector('.sw-body'));
  const stop = v.querySelector('.sw-stop');
  stop.addEventListener('click', onStop);
  const spin = document.createElement('div');
  spin.className = 'sw-spin';
  let iv = 0;
  const view = {
    add(i, html) {
      const d = document.createElement('div');
      d.innerHTML = html;
      bodies[i].insertBefore(d, spin.parentNode === bodies[i] ? spin : null);
      panes.forEach((p, j) => p.classList.toggle('active', j === i));
    },
    spin(on) {
      clearInterval(iv);
      if (!on) { spin.remove(); return; }
      const t0 = Date.now();
      let f = 0;
      const draw = () => { spin.textContent = `${SPIN[f++ % SPIN.length]} Orchestrating... (${Math.floor((Date.now() - t0) / 1000)}s)`; };
      draw();
      bodies[0].appendChild(spin);
      if (!RM) iv = setInterval(draw, 120);
    },
    kill(i) {
      panes[i].classList.add('dead');
      bodies[i].insertAdjacentHTML('beforeend', '<div><span class="sw-dead">Pane is dead (status 127)</span></div>');
    },
    tooLate() { stop.textContent = 'esc to interrupt (too late)'; },
    close() { clearInterval(iv); v.remove(); },
  };
  return view;
}

/* Waits for any key or tap. Swallows it so it does not also cancel or skip anything. */
function anyKey() {
  return new Promise((done) => {
    const on = (e) => {
      if (e.type === 'keydown' && ['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(e.key)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      document.removeEventListener('keydown', on, true);
      document.removeEventListener('pointerdown', on, true);
      done();
    };
    document.addEventListener('keydown', on, true);
    document.addEventListener('pointerdown', on, true);
  });
}

/* tmux exits, the shell is gone, the kernel panics. Any key reboots the site. */
async function crash() {
  printText('[exited]');
  await sleep(500);
  printText(`${SH}: /usr/bin/${SH}: No such file or directory`, 'err');
  await sleep(900);
  clear();
  const bottom = document.getElementById('bottom');
  bottom.hidden = true;
  await sleep(800);
  const t = (n) => `[${(4242.1337 + n / 1e4).toFixed(6).padStart(12)}]`;
  const panic = 'Kernel panic - not syncing: Attempted to kill init! exitcode=0x00007f00';
  const lines = [
    `${t(0)} systemd[1]: Failed to execute /sbin/init: No such file or directory`,
    `${t(3)} ${panic}`,
    `${t(5)} CPU: 0 PID: 1 Comm: systemd Not tainted ${m.kernel}`,
    `${t(7)} Call Trace:`,
    `${t(8)}  <TASK>`,
    `${t(9)}  claude_swarm_cleanup+0x2a/0x40`,
    `${t(11)}  rm_rf_root+0x1337/0x1337`,
    `${t(12)}  </TASK>`,
    `${t(14)} ---[ end ${panic} ]---`,
  ];
  for (const l of lines) { printText(l, 'err'); await sleep(rand(60, 160)); }
  print();
  print(dim('Simulated. Nothing was deleted. This is a static site.'));
  print();
  const p = print('Press any key to reboot.<span class="cur" aria-hidden="true"></span>');
  S.cancel = false; S.cancelReason = '';
  await anyKey();
  p.querySelector('.cur')?.remove();
  bottom.hidden = false;
  clear();
  S.cwd = []; S.mode = 'sh';
  await intro({ boot: true, auto: true });
}

async function claude(_a, line) {
  const task = argText(line) || 'clean up this server and free some disk space';
  print(`<div class="cc-box"><span class="sw-spin">*</span> Welcome to Claude Code!\n\n  ${dim('/help for help, /status for your current setup')}\n\n  ${dim(`cwd: /home/${m.user}`)}</div>`);
  await sleep(900);
  if (S.cancel) return;

  let stopped = false, spinning = false;
  const view = swarmView(() => S.closeOverlay());
  S.overlayOpen = true;
  S.closeOverlay = () => {
    stopped = true;
    view.close();
    S.overlayOpen = false;
    S.closeOverlay = () => {};
  };
  const { plan, fallout } = swarmScript(task);

  for (const [i, html, ms] of plan) {
    await sleep(ms);
    if (stopped || S.cancel) {
      S.closeOverlay();
      printText('Swarm interrupted. agent-3 never got to run its last command.');
      print(dim('It was about to run: sudo rm -rf / --no-preserve-root'));
      return;
    }
    /* The lead waits on its agents from their first line on. */
    if (i !== 0 && !spinning) { view.spin(true); spinning = true; }
    view.add(i, html);
  }

  /* Past the sudo. Interrupting now only skips ahead. */
  view.tooLate();
  for (const [i, html, ms] of fallout) {
    if (!stopped) await sleep(ms);
    view.add(i, html);
  }
  view.spin(false);
  for (const i of [1, 2, 3, 0]) {
    if (!stopped) await sleep(rand(180, 320));
    view.kill(i);
  }
  /* Reduced motion skips the waits, so hold the final frame still for a moment. */
  for (let n = 0; RM && n < 30 && !stopped && !S.cancel; n++) await wait(100);
  if (!stopped) await sleep(1000);
  S.closeOverlay();
  await crash();
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
  claude,
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
