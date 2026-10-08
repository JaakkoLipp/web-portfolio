/* Boot, Proxmox console banner, auto login and the auto-typed intro. */
import { D, KERNEL_BUILD, RM, S, TZ, clear, dim, el, esc, hooks, print, rand, showInput, sleep, store, typeCmd, typeInto, wait } from './state.js';
import { fetchHTML, hintHTML, printLog } from './content.js';
import { FS, printLs } from './fs.js';

const LAST_LOGIN = 'jaalip.lastLogin';
const m = D.machine;

const ok = (t) => `<span class="okb">[  <span class="ok">OK</span>  ]</span> ${esc(t)}`;
const starting = (t) => `         ${esc(t)}`;
const unit = (name, desc) => `${name}.service - ${desc}`;

/* systemd units in boot order. Services from site.config.ts start after the Proxmox stack. */
function bootUnits() {
  const base = [
    ['ok', 'Created slice system-getty.slice - Slice /system/getty.'],
    ['ok', 'Started systemd-journald.service - Journal Service.'],
    ['ok', 'Started systemd-udevd.service - Rule-based Manager for Device Events and Files.'],
    ['ok', 'Reached target local-fs.target - Local File Systems.'],
    ['ok', 'Finished systemd-tmpfiles-setup.service - Create System Files and Directories.'],
    ['start', 'Starting networking.service - Network initialization...'],
    ['ok', 'Finished networking.service - Network initialization.'],
    ['ok', 'Reached target network-online.target - Network is Online.'],
    ['ok', 'Started pve-cluster.service - The Proxmox VE cluster filesystem.'],
    ['ok', 'Started pvedaemon.service - PVE API Daemon.'],
    ['ok', 'Started pveproxy.service - PVE API Proxy Server.'],
  ];
  const services = [];
  for (const s of D.services) {
    const u = unit(s.unit, s.description);
    if (s.gpu) services.push(['start', `Starting ${u}...`], ['job', s.description], ['ok', `Started ${u}.`]);
    else services.push(['ok', `Started ${u}.`]);
  }
  return [
    ...base,
    ...services,
    ['ok', 'Started getty@tty1.service - Getty on tty1.'],
    ['ok', 'Reached target multi-user.target - Multi-User System.'],
  ];
}

/* systemd's "A start job is running" spinner, for a moment. */
async function startJob(desc) {
  if (RM || S.skip) return;
  const d = print('');
  const frames = ['*     ', '**    ', '***   ', ' ***  ', '  *** ', '   ***', '    **', '     *', '    **', '   ***', '  *** ', ' ***  ', '***   ', '**    '];
  for (let i = 0; i < 14; i++) {
    if (S.skip) break;
    const s = Math.floor(i / 4) + 3;
    d.innerHTML = `[<span class="spin">${frames[i % frames.length]}</span>] A start job is running for ${esc(desc)} (${s}s / 1min 30s)`;
    await sleep(110);
  }
  d.remove();
}

async function bootLog() {
  const k = m.kernel;
  print(`Loading Linux ${esc(k)} ...`);
  await sleep(220);
  print('Loading initial ramdisk ...');
  await sleep(380);
  const kernel = [
    ['0.000000', `Linux version ${k} (build@proxmox) ${KERNEL_BUILD}`],
    ['0.000000', `Command line: BOOT_IMAGE=/boot/vmlinuz-${k} root=/dev/mapper/pve-root ro`],
    ['0.412233', 'Run /init as init process'],
    ['1.873120', 'EXT4-fs (dm-1): mounted filesystem with ordered data mode.'],
  ];
  for (const [t, msg] of kernel) {
    print(dim(`[${t.padStart(12)}] ${msg}`));
    await sleep(rand(30, 90));
  }
  print();
  print(`Welcome to <span class="distro">${esc(m.distro)}</span>!`);
  print();
  await sleep(160);
  for (const [kind, t] of bootUnits()) {
    if (kind === 'job') { await startJob(t); continue; }
    print(kind === 'ok' ? ok(t) : starting(t));
    await sleep(kind === 'start' ? rand(120, 220) : rand(18, 70));
  }
  await sleep(300);
}

function banner() {
  const rule = '-'.repeat(78);
  print();
  print(dim(rule));
  print();
  print('Welcome to the Proxmox Virtual Environment. Please use your web browser to\nconfigure this server - connect to:');
  print();
  print(`  <span class="pd">https://${esc(m.consoleIp)}:8006/</span>`);
  print();
  print(dim(rule));
  print();
}

const fmtLogin = (d) => d.toLocaleString('en-US', { timeZone: TZ, weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', year: 'numeric', hour12: false }).replace(/,/g, '');

async function login(last) {
  const l = print(`${esc(m.host)} login: <span class="typed echo"></span>`);
  await typeInto(l.querySelector('.typed'), m.user, { min: 70, max: 140 });
  await sleep(250);
  print(`Password: ${dim('(automatic login for guests)')}`);
  await sleep(300);
  print(`Linux ${esc(m.host)} ${esc(m.kernel)} ${esc(KERNEL_BUILD)} x86_64`);
  print();
  print(dim('The programs included with the Debian GNU/Linux system are free software;\nthe exact distribution terms for each program are described in the\nindividual files in /usr/share/doc/*/copyright.'));
  print();
  print(dim('Debian GNU/Linux comes with ABSOLUTELY NO WARRANTY, to the extent\npermitted by applicable law.'));
  print(last ? `Last login: ${esc(fmtLogin(new Date(last)))} on tty1` : `Last login: never. Welcome, ${esc(m.user)}.`);
}

export async function intro({ boot = true, auto = true } = {}) {
  S.introRunning = true; S.busy = true; S.skip = false;
  el.cmdLine.hidden = true;
  el.statusMid.textContent = 'press any key to skip';
  const last = store.get(LAST_LOGIN);
  /* Ctrl+L once booted: login starts at the top and the boot log is gone, not just scrolled away. */
  if (boot) { await bootLog(); clear(); }
  banner();
  await login(last);
  if (auto) {
    await typeCmd('fastfetch');
    print(fetchHTML(), 'block');
    await sleep(450);
    await typeCmd('git log --oneline -5');
    printLog();
    await sleep(450);
  }
  /* Always last: the home listing is the site menu. */
  await typeCmd('ls ~');
  printLs(FS, [], false);
  await sleep(200);
  print();
  print(hintHTML());
  store.set(LAST_LOGIN, new Date().toISOString());
  S.introRunning = false; S.skip = false; S.busy = false;
  showInput();
  if (S.queued) { const q = S.queued; S.queued = null; hooks.submit(q); }
}

/* Short shutdown log for `reboot`, then a full boot. */
export async function reboot() {
  const stop = [...D.services].reverse().slice(0, 4).map((s) => ok(`Stopped ${unit(s.unit, s.description)}.`));
  for (const l of [...stop, ok('Stopped pveproxy.service - PVE API Proxy Server.'), ok('Reached target reboot.target - System Reboot.')]) {
    print(l);
    await sleep(rand(40, 110));
  }
  print('reboot: Restarting system');
  await wait(RM ? 0 : 700);
  clear();
  S.cwd = []; S.mode = 'sh';
  await intro({ boot: true, auto: true });
}

export const isReturning = () => !!store.get(LAST_LOGIN);
