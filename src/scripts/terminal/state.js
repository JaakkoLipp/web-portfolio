/* Shared state, DOM handles and output helpers for the terminal. Ported from docs/reference/jaalip-tty.html. */
import { fnv1a } from '../../lib/format';

/** @type {import('../../lib/terminal-data').TerminalData} */
export const D = JSON.parse(document.getElementById('term-data').textContent);

export const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const TOUCH = matchMedia('(pointer: coarse)').matches;
export const T0 = Date.now();

/* Values derived from site.config.ts, named once. */
export const HOME = `/home/${D.machine.user}`;
export const SH = D.machine.shell.split(' ')[0];
export const TZ = D.owner.timeZone;
export const MAN = D.owner.short.toLowerCase();
export const PAGE_IDS = D.pages.map((p) => p.id).join(', ');
/* Proxmox kernels report their version without the -pve suffix after PMX. */
export const KERNEL_BUILD = `#1 SMP PREEMPT_DYNAMIC PMX ${D.machine.kernel.replace(/-pve$/, '')}`;
/* Stable fake PID per service, the same in htop, nvidia-smi and systemctl. */
export const pidOf = (unit) => 300 + (fnv1a(unit) % 3700);

const $ = (s) => document.querySelector(s);
export const el = {
  out: $('#out'),
  term: $('#term'),
  cmdLine: $('#cmdLine'),
  input: $('#cmd'),
  prompt: $('#prompt'),
  statusMid: $('#statusMid'),
  clock: $('#clock'),
  ov: $('#overlay'),
  ovBody: $('#ovBody'),
  ovQuit: $('#ovQuit'),
};

/* Mutable shell state. */
export const S = {
  introRunning: false,
  skip: false,
  cancel: false,
  cancelReason: '',
  busy: true,
  anyKeyCancels: false,
  overlayOpen: false,
  mode: 'sh',
  queued: null,
  closeOverlay: () => {},
  hist: [],
  hIdx: 0,
  cwd: [],
};

/* Late-bound functions, set by main.js, so modules do not import each other in a loop. */
export const hooks = { submit: (_cmd) => {} };

export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const rand = (a, b) => a + Math.random() * (b - a);

export const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* storage off: fine */ } },
};

/* Interruptible sleep: skip or cancel resolves every pending wait at once. */
const pending = new Set();
const fast = () => S.skip || S.cancel || RM;
export function sleep(ms) {
  if (fast()) return Promise.resolve();
  return new Promise((r) => {
    const done = () => { clearTimeout(t); pending.delete(done); r(); };
    const t = setTimeout(done, ms);
    pending.add(done);
  });
}
export const wait = (ms) => new Promise((r) => setTimeout(r, ms));
export function flush() { [...pending].forEach((d) => d()); }

/* Output */
let stick = true;
el.term.addEventListener('scroll', () => { stick = el.term.scrollHeight - el.term.scrollTop - el.term.clientHeight < 48; }, { passive: true });
export function scroll(force) { if (stick || force) el.term.scrollTop = el.term.scrollHeight; }
export function print(html = '', cls = '') {
  const d = document.createElement('div');
  d.className = 'ln' + (cls ? ' ' + cls : '');
  d.innerHTML = html;
  el.out.appendChild(d);
  scroll();
  return d;
}
export const printText = (t, cls) => print(esc(t), cls);
export const dim = (t) => `<span class="dim">${esc(t)}</span>`;
export const link = (html, cmd, href = '#') => `<a class="lnk" href="${esc(href)}" data-cmd="${esc(cmd)}">${html}</a>`;
export const readMore = (route) => print(`${dim('Read more: ')}${link(esc('open ' + route), 'open ' + route, route)}`);
export function clear() { el.out.innerHTML = ''; }

/* An animated [####----] bar. Returns false when cancelled. */
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

/* Prompt and status line */
const dirName = () => '~' + (S.cwd.length ? '/' + S.cwd.join('/') : '');
export function promptHTML() {
  if (S.mode === 'vim') return '<span class="pv">:</span>';
  const { user, host } = D.machine;
  return `<span class="pu">${esc(user)}@${esc(host)}</span><span class="pb">:</span><span class="pd">${esc(dirName())}</span><span class="pb">$</span> `;
}
function updateStatus() { el.statusMid.textContent = `${D.machine.user}@${D.machine.host}:${dirName()}`; }
export function showInput() {
  el.cmdLine.hidden = false;
  el.prompt.innerHTML = promptHTML();
  updateStatus();
  scroll(true);
  if (!TOUCH) el.input.focus({ preventScroll: true });
}

export async function typeInto(node, text, { min = 40, max = 110 } = {}) {
  for (let i = 0; i < text.length; i++) {
    if (fast()) { node.textContent = text; return; }
    node.textContent += text[i];
    scroll();
    await sleep(rand(min, max));
  }
}
export async function typeCmd(cmd) {
  const d = print(promptHTML() + '<span class="typed echo"></span><span class="cur" aria-hidden="true"></span>');
  await sleep(420);
  await typeInto(d.querySelector('.typed'), cmd);
  await sleep(260);
  d.querySelector('.cur')?.remove();
}

/* "3 days ago", like git's relative dates. */
export function ago(iso) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days < 1) return 'today';
  if (days < 2) return 'yesterday';
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  const y = Math.floor(days / 365);
  return `${y} year${y === 1 ? '' : 's'} ago`;
}
