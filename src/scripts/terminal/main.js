/* Entry point: input handling, execution, key bindings, clock. */
import { RM, S, TOUCH, clear, el, esc, flush, hooks, print, printText, promptHTML, scroll, showInput, wait } from './state.js';
import { complete, dispatch } from './commands.js';
import { intro, isReturning } from './intro.js';

async function execute(raw) {
  if (S.busy) return;
  S.busy = true;
  const vimColon = S.mode === 'vim' && raw.trim().startsWith(':');
  el.cmdLine.hidden = true;
  el.input.value = '';
  print((vimColon ? '' : promptHTML()) + `<span class="echo">${esc(raw)}</span>`);
  const line = raw.trim();
  if (line) S.hist.push(line);
  S.hIdx = S.hist.length;
  try { if (line) await dispatch(line); }
  catch (err) { printText(`jsh: ${err.message}`, 'err'); console.error(err); }
  if (S.cancel && S.cancelReason === 'ctrlc') print('<span class="dim">^C</span>');
  S.cancel = false; S.cancelReason = ''; S.anyKeyCancels = false; S.busy = false;
  if (!S.introRunning) showInput();
}

/* Types a command into the prompt, then runs it. Used by links and the dock. */
async function submitTyped(cmd) {
  if (S.introRunning) { S.queued = cmd; skipIntro(); return; }
  if (S.busy) return;
  S.busy = true;
  el.cmdLine.hidden = false;
  el.input.value = '';
  if (RM) el.input.value = cmd;
  else for (const ch of cmd) { el.input.value += ch; await wait(16); }
  await wait(RM ? 0 : 90);
  S.busy = false;
  await execute(el.input.value);
}
hooks.submit = submitTyped;

function cancelRun(reason) {
  S.cancel = true; S.cancelReason = reason;
  flush();
  if (S.overlayOpen) S.closeOverlay();
}
function skipIntro() { S.skip = true; flush(); }

/* ---------------- Input ---------------- */
el.input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); execute(el.input.value); }
  else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (S.hist.length) { S.hIdx = Math.max(0, S.hIdx - 1); el.input.value = S.hist[S.hIdx] || ''; }
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    S.hIdx = Math.min(S.hist.length, S.hIdx + 1); el.input.value = S.hist[S.hIdx] || '';
  } else if (e.key === 'Tab') {
    e.preventDefault();
    const r = complete(el.input.value);
    if (r.list) {
      print(promptHTML() + `<span class="echo">${esc(el.input.value)}</span>`);
      printText(r.list.join('  '));
      scroll(true);
    }
    el.input.value = r.value;
  } else if (e.ctrlKey && e.key.toLowerCase() === 'l') { e.preventDefault(); clear(); }
  else if (e.ctrlKey && e.key.toLowerCase() === 'c' && !String(getSelection())) {
    e.preventDefault();
    print(promptHTML() + `<span class="echo">${esc(el.input.value)}</span><span class="dim">^C</span>`);
    el.input.value = '';
    scroll(true);
  }
});

/* Konami code: revontulet (northern lights). */
const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let kIdx = 0;
function konami(key) {
  const k = key.length === 1 ? key.toLowerCase() : key;
  kIdx = k === KONAMI[kIdx] ? kIdx + 1 : (k === KONAMI[0] ? 1 : 0);
  if (kIdx === KONAMI.length) {
    kIdx = 0;
    document.body.classList.remove('aurora');
    void document.body.offsetWidth;
    document.body.classList.add('aurora');
    setTimeout(() => document.body.classList.remove('aurora'), 7200);
    print('<span class="ref">Revontulet unlocked.</span> <span class="dim">The northern lights pass over the terminal.</span>');
  }
}

document.addEventListener('keydown', (e) => {
  konami(e.key);
  if (S.introRunning) {
    if (!['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(e.key)) skipIntro();
    return;
  }
  if (S.overlayOpen && ['q', 'Q', 'Escape', 'F10'].includes(e.key)) { e.preventDefault(); S.closeOverlay(); return; }
  if (S.busy && (e.key === 'Escape' || (e.ctrlKey && e.key.toLowerCase() === 'c'))) { e.preventDefault(); cancelRun('ctrlc'); return; }
  if (S.busy && S.anyKeyCancels) { cancelRun('soft'); return; }
  if (!S.busy && document.activeElement !== el.input && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) el.input.focus({ preventScroll: true });
});

/* Tap or click on the terminal focuses the prompt, but not after a scroll or a text selection. */
let down = null;
el.term.addEventListener('pointerdown', (e) => {
  down = { x: e.clientX, y: e.clientY };
  if (S.introRunning && !e.target.closest('a')) skipIntro();
});
el.term.addEventListener('pointerup', (e) => {
  if (!down) return;
  const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y) > 10;
  down = null;
  if (moved || S.busy || e.target.closest('a,button') || String(getSelection())) return;
  if (!TOUCH || !el.cmdLine.hidden) el.input.focus({ preventScroll: true });
});
el.out.addEventListener('click', (e) => {
  const a = e.target.closest('a[data-cmd]');
  if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
  e.preventDefault();
  submitTyped(a.dataset.cmd);
});
el.dock.addEventListener('click', (e) => {
  const b = e.target.closest('button[data-cmd]');
  if (b) submitTyped(b.dataset.cmd);
});
el.ovQuit.addEventListener('click', () => S.closeOverlay());

/* Status line clock, Helsinki time. */
function tick() {
  const now = new Date();
  const t = now.toLocaleTimeString('en-GB', { timeZone: 'Europe/Helsinki', hour: '2-digit', minute: '2-digit' });
  const d = now.toLocaleDateString('en-GB', { timeZone: 'Europe/Helsinki', weekday: 'short', day: '2-digit', month: 'short' });
  el.clock.textContent = `${t}  ${d}`;
}
tick();
setInterval(tick, 15000);

/* Returning visitors skip the boot log but still get the fetch card. */
intro({ boot: !isReturning(), auto: true });
