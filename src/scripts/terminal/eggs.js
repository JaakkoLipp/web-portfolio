/* Easter egg engines. */
import { D, RM, S, dim, esc, hashNum, print, printText, rand, scroll, sleep, typeInto, wait } from './state.js';

export async function progress(label, width = 20, step = 55) {
  const d = print('');
  for (let i = 0; i <= width; i++) {
    d.innerHTML = `${esc(label.padEnd(16))} [${'#'.repeat(i)}${'-'.repeat(width - i)}] ${String(Math.round((i / width) * 100)).padStart(3)}%`;
    scroll();
    if (i < width) await sleep(step);
    if (S.cancel) return false;
  }
  return true;
}

/* ---------------- apt (Proxmox is Debian underneath) ---------------- */
async function aptLockError() {
  printText('E: Could not open lock file /var/lib/apt/lists/lock - open (13: Permission denied)', 'err');
  printText('E: Unable to lock directory /var/lib/apt/lists/', 'err');
  await sleep(500);
  print(dim('Running a pretend one for guests instead.'));
  await sleep(400);
}

export async function aptUpdate({ root = false } = {}) {
  if (!root) await aptLockError();
  const repos = [
    ['Hit:1', 'http://deb.debian.org/debian trixie InRelease'],
    ['Hit:2', 'http://security.debian.org/debian-security trixie-security InRelease'],
    ['Get:3', 'http://download.proxmox.com/debian/pve trixie InRelease [2,771 B]'],
    ['Get:4', 'http://download.proxmox.com/debian/pve trixie/pve-no-subscription amd64 Packages [312 kB]'],
  ];
  for (const [k, r] of repos) {
    if (S.cancel) return;
    printText(`${k} ${r}`);
    await sleep(rand(120, 320));
  }
  printText('Fetched 315 kB in 1s (412 kB/s)');
  printText('Reading package lists... Done');
  await sleep(200);
  printText('Building dependency tree... Done');
  printText("3 packages can be upgraded. Run 'apt list --upgradable' to see them.");
}

export async function aptUpgrade({ root = false } = {}) {
  if (!root) await aptLockError();
  printText('Reading package lists... Done');
  await sleep(250); printText('Building dependency tree... Done');
  await sleep(150); printText('Calculating upgrade... Done');
  printText('The following packages will be upgraded:\n  coffee curiosity sisu');
  printText('3 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.');
  const q = print('Do you want to continue? [Y/n] <span class="typed echo"></span>');
  await sleep(600); await typeInto(q.querySelector('.typed'), 'y');
  const pkgs = [['coffee', '26.10-1'], ['curiosity', '2.1-1'], ['sisu', '1.0-2']];
  for (const [i, [p]] of pkgs.entries()) {
    if (!await progress(`Get:${i + 1} ${p}`, 20, 40)) return;
  }
  for (const [p, v] of pkgs) {
    if (S.cancel) return;
    printText(`Setting up ${p} (${v}) ...`);
    await sleep(160);
  }
  printText('Processing triggers for man-db (2.13.1-1) ...');
  await sleep(300);
  printText(`Reminding ${D.machine.user} to read the Proxmox release notes... done`);
}

export function aptList() {
  ['coffee/stable,now 26.10-1 amd64 [installed]', 'curiosity/stable,now 2.0-1 amd64 [installed]', `${D.machine.shell.split(' ')[0]}/stable,now 1.0-1 amd64 [installed]`, 'proxmox-ve/stable,now 9.0.0 all [installed]', 'sisu/stable,now 1.0-1 amd64 [installed]', 'vim/stable,now 2:9.1-1 amd64 [installed]']
    .forEach((p) => printText(p));
}

/* ---------------- rm -rf / ---------------- */
export async function fakeWipe() {
  print(`[sudo] password for ${esc(D.machine.user)}: `);
  await sleep(700);
  const home = `/home/${D.machine.user}`;
  const files = ['/boot/vmlinuz-' + D.machine.kernel, '/etc/fstab', '/etc/pve/storage.cfg', '/usr/bin/jsh', '/var/log/journal', `${home}/projects`, `${home}/.bash_history`, `${home}/sense-of-humour`];
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

export async function sl() {
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

export function moosesay(msg) {
  msg = (msg || 'Moi.').slice(0, 200);
  const words = msg.split(/\s+/), lines = [];
  let cur = '';
  for (const w of words) {
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

/* ---------------- matrix ---------------- */
export async function matrix() {
  if (RM) { printText('Reduced motion is on, so the rain stays off.', 'dim'); return; }
  const css = getComputedStyle(document.documentElement);
  const color = (v) => css.getPropertyValue(v).trim();
  const [fg, accent, iris, bg] = [color('--rp-text'), color('--rp-foam'), color('--rp-iris'), color('--rp-base')];
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
export async function sauna() {
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

export async function brew() {
  printText('Brewing kahvi...');
  if (!await progress('kahvinkeitin', 20, 70)) return;
  print(`<pre class="art cup">${esc(CUP)}</pre>`, 'block');
  printText('Finns drink more coffee per person than almost any other country. Kahvi on valmis.');
}

/* ---------------- Network toys. Addresses are documentation or private ranges. ---------------- */
export async function ping(args) {
  const self = D.machine.host;
  const h = args.find((x) => !x.startsWith('-')) || self;
  const ips = { [self]: D.machine.consoleIp, [D.domain]: D.machine.consoleIp, localhost: '127.0.0.1', homelab: '10.10.0.2' };
  const ip = ips[h];
  if (!ip) { printText(`ping: ${h}: Name or service not known`, 'err'); return; }
  printText(`PING ${h} (${ip}) 56(84) bytes of data.`);
  const base = h === 'homelab' ? 7.8 : 0.04;
  const times = [];
  for (let i = 1; i <= 4; i++) {
    if (S.cancel) break;
    const t = +(base + Math.random() * base * 0.6).toFixed(3);
    times.push(t);
    printText(`64 bytes from ${h} (${ip}): icmp_seq=${i} ttl=64 time=${t.toFixed(3)} ms`);
    if (i < 4) await sleep(700);
  }
  print();
  printText(`--- ${h} ping statistics ---`);
  printText(`${times.length} packets transmitted, ${times.length} received, 0% packet loss`);
  if (times.length) {
    const avg = times.reduce((x, y) => x + y, 0) / times.length;
    printText(`rtt min/avg/max = ${Math.min(...times).toFixed(3)}/${avg.toFixed(3)}/${Math.max(...times).toFixed(3)} ms`);
  }
}

/* ---------------- Hardware toys (simulated) ---------------- */
const row = (s) => `| ${s.padEnd(75).slice(0, 75)} |`;
const line = (c = '-') => `+${c.repeat(77)}+`;

export function nvidiaSmi() {
  const g = D.machine.gpu;
  const procs = D.services.filter((s) => s.gpu);
  const util = Math.round(rand(82, 97)), temp = Math.round(rand(63, 71)), pwr = Math.round(rand(290, 340));
  const used = Math.round(g.memMiB * rand(0.88, 0.91));
  const t = [
    line(),
    row(`NVIDIA-SMI ${g.driver}`.padEnd(24) + `Driver Version: ${g.driver}`.padEnd(29) + `CUDA Version: ${g.cuda}`),
    '|-------------------------------+----------------------+----------------------+',
    '| GPU  Name        Persistence-M| Bus-Id        Disp.A | Volatile Uncorr. ECC |',
    '| Fan  Temp  Perf  Pwr:Usage/Cap|         Memory-Usage | GPU-Util  Compute M. |',
    '|===============================+======================+======================|',
    `|   0  ${g.name.padEnd(18).slice(0, 18)} On    | 00000000:01:00.0 Off |                  N/A |`,
    `| 61%   ${temp}C    P2   ${pwr}W / 350W |${`${used}MiB / ${g.memMiB}MiB `.padStart(22)}|${`${util}%`.padStart(8)}      Default |`,
    '+-------------------------------+----------------------+----------------------+',
    row('Processes:'),
    row(' GPU    PID   Type   Process name                             GPU Memory'),
    ...(procs.length ? procs : [{ unit: 'idle', cmd: 'No running processes found' }]).map((s) =>
      s.unit === 'idle' ? row(`  ${s.cmd}`) : row(`   0   ${String(300 + (hashNum(s.unit) % 3700)).padStart(5)}      C   ${s.cmd.padEnd(38).slice(0, 38)} ${`${used - 120}MiB`.padStart(9)}`),
    ),
    line(),
  ].join('\n');
  print(`<div class="scroll-x"><pre>${esc(t)}</pre></div>`, 'block');
  print(dim('(simulated, from the homelab GPU node)'));
}

export function dockerPs() {
  const rows = D.services.filter((s) => s.image).map((s) => [
    hashNum(s.unit).toString(16).padStart(8, '0') + hashNum(s.image).toString(16).padStart(8, '0').slice(0, 4),
    s.image,
    s.uptime ?? 'Up 1 day',
    s.unit,
  ]);
  if (!rows.length) { printText('CONTAINER ID   IMAGE   STATUS   NAMES'); return; }
  const head = ['CONTAINER ID', 'IMAGE', 'STATUS', 'NAMES'];
  const w = [0, 1, 2].map((i) => Math.max(head[i].length, ...rows.map((r) => r[i].length)) + 3);
  const fmt = (r) => r.map((c, i) => (i < 3 ? c.padEnd(w[i]) : c)).join('');
  print(`<div class="scroll-x"><pre>${esc(fmt(head))}\n${rows.map((r) => esc(fmt(r))).join('\n')}</pre></div>`, 'block');
  print(dim('(simulated)'));
}
