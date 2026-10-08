/*
  The simulated machine: commands driven by `machine` and `services` in site.config.ts.
  Exports SYSTEM, a command table merged into the shell by commands.js.
*/
import { fnv1a, shortUrl } from '../../lib/format';
import { D, KERNEL_BUILD, S, T0, TZ, dim, esc, pidOf, print, printText, progress, rand, sleep, typeInto } from './state.js';
import { htop } from './htop.js';

const m = D.machine;

/* ---------------- apt (Proxmox is Debian underneath) ---------------- */
const DPKG_LOCKED = 'E: Could not open lock file /var/lib/dpkg/lock-frontend - open (13: Permission denied)';

async function aptLockError() {
  printText('E: Could not open lock file /var/lib/apt/lists/lock - open (13: Permission denied)', 'err');
  printText('E: Unable to lock directory /var/lib/apt/lists/', 'err');
  await sleep(500);
  print(dim('Running a pretend one for guests instead.'));
  await sleep(400);
}

async function aptUpdate() {
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

async function aptUpgrade() {
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
  printText(`Reminding ${m.user} to read the Proxmox release notes... done`);
}

function aptList() {
  ['coffee/stable,now 26.10-1 amd64 [installed]', 'curiosity/stable,now 2.0-1 amd64 [installed]', `${m.shell.split(' ')[0]}/stable,now 1.0-1 amd64 [installed]`, 'proxmox-ve/stable,now 9.0.0 all [installed]', 'sisu/stable,now 1.0-1 amd64 [installed]', 'vim/stable,now 2:9.1-1 amd64 [installed]']
    .forEach((p) => printText(p));
}

/* `apt <sub>`. `root` skips the lock error, for `sudo apt`. `install` hooks let eggs.js add packages like kahvi. */
export const aptInstallHooks = {};
export async function apt(a, { root = false } = {}) {
  const sub = a.find((x) => !x.startsWith('-')) || '';
  if (sub === 'update' || ['upgrade', 'full-upgrade', 'dist-upgrade'].includes(sub)) {
    if (!root) await aptLockError();
    return sub === 'update' ? aptUpdate() : aptUpgrade();
  }
  if (sub === 'list') return aptList();
  if (sub === 'install') {
    const pkg = a[a.indexOf('install') + 1];
    if (!pkg) { printText('E: No packages specified'); return; }
    if (aptInstallHooks[pkg]) return aptInstallHooks[pkg]();
    printText(root ? `E: Unable to locate package ${pkg}` : DPKG_LOCKED, 'err');
    return;
  }
  if (sub === 'remove' || sub === 'purge') { printText(DPKG_LOCKED, 'err'); return; }
  if (!sub) { printText('apt 3.0.3 (amd64)\nUsage: apt [options] command\n\nMost used commands:\n  list, update, upgrade, full-upgrade, install'); return; }
  printText(`E: Invalid operation ${sub}`, 'err');
}

/* ---------------- Hardware (simulated) ---------------- */
const row = (s) => `| ${s.padEnd(75).slice(0, 75)} |`;
const line = () => `+${'-'.repeat(77)}+`;

function nvidiaSmi() {
  const g = m.gpu;
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
    ...(procs.length
      ? procs.map((s) => row(`   0   ${String(pidOf(s.unit)).padStart(5)}      C   ${s.cmd.padEnd(38).slice(0, 38)} ${`${used - 120}MiB`.padStart(9)}`))
      : [row('  No running processes found')]),
    line(),
  ].join('\n');
  print(`<div class="scroll-x"><pre>${esc(t)}</pre></div>`, 'block');
  print(dim('(simulated, from the homelab GPU node)'));
}

function dockerPs() {
  const head = ['CONTAINER ID', 'IMAGE', 'STATUS', 'NAMES'];
  const rows = D.services.filter((s) => s.image).map((s) => [
    (fnv1a(s.unit).toString(16).padStart(8, '0') + fnv1a(s.image).toString(16).padStart(8, '0')).slice(0, 12),
    s.image,
    s.uptime ?? 'Up 1 day',
    s.unit,
  ]);
  const w = [0, 1, 2].map((i) => Math.max(head[i].length, ...rows.map((r) => r[i].length)) + 3);
  const fmt = (r) => r.map((c, i) => (i < 3 ? c.padEnd(w[i]) : c)).join('');
  print(`<div class="scroll-x"><pre>${[head, ...rows].map((r) => esc(fmt(r))).join('\n')}</pre></div>`, 'block');
  print(dim('(simulated)'));
}

/* ---------------- Network. Addresses are documentation or private ranges. ---------------- */
const HOSTS = { [m.host]: m.consoleIp, [D.domain]: m.consoleIp, localhost: '127.0.0.1', homelab: '10.10.0.2' };

async function ping(args) {
  const h = args.find((x) => !x.startsWith('-')) || m.host;
  const ip = HOSTS[h];
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

/* ---------------- Commands ---------------- */
export const SYSTEM = {
  htop: () => htop(), top: () => htop(), btop: () => htop(),
  'nvidia-smi': () => nvidiaSmi(),
  docker: (a) => (a[0] === 'ps' ? dockerPs() : printText(`docker: '${a[0] || ''}' is not available for guests. Try: docker ps`, 'err')),
  apt: (a) => apt(a), 'apt-get': (a) => apt(a),
  dpkg: (a) => (a[0] === '-l' ? aptList() : printText('dpkg: error: need an action option. Try: dpkg -l', 'err')),
  pveversion: () => printText(`pve-manager/${m.os.replace(/^\D+/, '')}/${fnv1a(m.kernel).toString(16).padStart(8, '0')} (running kernel: ${m.kernel})`),
  systemctl: (a) => {
    if (a[0] !== 'status') { printText('Failed to connect to bus: guests only get status. Try: systemctl status', 'err'); return; }
    const s = D.services.find((x) => x.unit === a[1]?.replace(/\.service$/, ''));
    if (!s) { printText(`● ${m.host}\n    State: running\n    Units: ${D.services.length + 41} loaded`); return; }
    print(`<span class="ok">●</span> ${esc(s.unit)}.service - ${esc(s.description)}\n     Loaded: loaded (/etc/systemd/system/${esc(s.unit)}.service; enabled)\n     Active: <span class="ok">active (running)</span>\n   Main PID: ${pidOf(s.unit)} (${esc(s.cmd.split(' ')[0])})`);
  },
  hostname: () => printText(m.host),
  uname: (a) => printText(a.includes('-a') ? `Linux ${m.host} ${m.kernel} ${KERNEL_BUILD} x86_64 GNU/Linux` : a.includes('-r') ? m.kernel : 'Linux'),
  uptime: () => {
    const now = new Date().toLocaleTimeString('en-GB', { timeZone: TZ });
    const mins = Math.floor((Date.now() - T0) / 60000);
    printText(` ${now} up 12 days, ${mins} min,  1 user,  load average: 0.42, 0.37, 0.31`);
  },
  ping: (a) => ping(a),
  ssh: (a) => {
    const h = (a.find((x) => !x.startsWith('-')) || '').split('@').pop();
    if (!h) { printText('usage: ssh <host>'); return; }
    printText(`ssh: connect to host ${h} port 22: Connection refused`, 'err');
    print(dim(h === 'homelab' ? '(The homelab only talks to keys it knows.)' : h === m.host ? '(You are already here.)' : '(Nice try.)'));
  },
  curl: (a) => {
    const u = shortUrl(a.find((x) => !x.startsWith('-')) || '');
    if (!u) { printText(`curl: try 'curl ${D.domain}'`); return; }
    if (u === D.domain || u === 'localhost') {
      const o = D.owner;
      printText(`${D.domain}, plain text edition\n\n${o.name}. ${o.role}. ${o.location}.\n${o.focus}.\n\nPages: ${D.pages.map((p) => p.path).join('  ')}`);
      return;
    }
    if (u.startsWith('wttr.in')) { printText('Helsinki: dark, probably. Check a window.'); return; }
    printText(`curl: (6) Could not resolve host: ${u}`, 'err');
  },
};
