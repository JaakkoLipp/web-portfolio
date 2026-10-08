/* htop overlay with simulated values. Processes come from the services list. */
import { D, S, SH, el, esc, pidOf, rand } from './state.js';

const fmtSize = (gib) => (gib >= 1 ? `${gib.toFixed(1)}G` : `${Math.max(1, Math.round(gib * 1024))}M`);

function makeProcs() {
  const total = D.machine.memGiB;
  const procs = D.services.map((s) => {
    const mem = s.mem ?? 0.2;
    const res = (mem / 100) * total;
    return {
      pid: pidOf(s.unit),
      user: s.user.slice(0, 8),
      cmd: s.cmd,
      cpu: s.cpu ?? 1,
      max: s.gpu ? 99 : 18,
      step: s.gpu ? 6 : 1.2,
      mem,
      virt: fmtSize(res * 1.8 + 0.02),
      res: fmtSize(res),
      time: (s.cpu ?? 1) * 290,
    };
  });
  procs.push({ pid: 4096, user: D.machine.user.slice(0, 8), cmd: SH, cpu: 0.3, max: 2, step: 0.3, mem: 0, virt: '20M', res: '8M', time: 2 });
  return procs;
}

function hbar(label, pct, txt, cls = 'bar', W = 26) {
  const n = Math.round((Math.min(100, Math.max(0, pct)) / 100) * W);
  const cells = ('|'.repeat(n) + ' '.repeat(W - n)).split('');
  const barPart = cells.slice(0, W - txt.length).join('');
  return `<span class="hl">${label}</span>[<span class="${cls}">${esc(barPart)}</span><span class="dim">${esc(txt)}</span>]`;
}
const walk = (v, lo, hi, step) => Math.min(hi, Math.max(lo, v + rand(-step, step)));

export function htop() {
  return new Promise((res) => {
    const { cpus, memGiB, gpu } = D.machine;
    const PROCS = makeProcs();
    const memBase = PROCS.reduce((a, p) => a + (p.mem / 100) * memGiB, 0) + memGiB * 0.04;
    const gpuMem = gpu.memMiB / 1024;
    const hasGpu = D.services.some((s) => s.gpu);
    const st = {
      cpu: Array.from({ length: cpus }, () => rand(15, 65)),
      mem: memBase,
      gpu: gpuMem * 0.9,
      load: [1.12, 0.94, 0.8],
      up: 12 * 86400 + 4 * 3600 + 13 * 60,
    };
    const render = () => {
      st.cpu = st.cpu.map((v) => walk(v, 4, 99, 14));
      st.mem = walk(st.mem, memBase * 0.95, memBase * 1.05, 0.6);
      st.gpu = walk(st.gpu, gpuMem * 0.88, gpuMem * 0.93, 0.2);
      st.load = st.load.map((v) => walk(v, 0.4, 2.4, 0.08));
      st.up += 1;
      PROCS.forEach((p) => { p.cpu = Math.max(0, walk(p.cpu, 0, p.max, p.step)); p.time += p.cpu / 100; });
      let left = st.cpu.map((v, i) => hbar(String(i).padStart(3), v, v.toFixed(1) + '%')).join('\n')
        + '\n' + hbar('Mem', (st.mem / memGiB) * 100, `${st.mem.toFixed(1)}G/${memGiB}G`, 'bar mem');
      if (hasGpu) left += '\n' + hbar('GPU', (st.gpu / gpuMem) * 100, `${st.gpu.toFixed(1)}G/${gpuMem.toFixed(1)}G`, 'bar gpu');
      const d = Math.floor(st.up / 86400), hh = Math.floor((st.up % 86400) / 3600), mm = Math.floor((st.up % 3600) / 60), ss = st.up % 60;
      const right = `<span class="hl">Tasks:</span> 87, 312 thr; 2 running\n<span class="hl">Load average:</span> ${st.load.map((v) => v.toFixed(2)).join(' ')}\n<span class="hl">Uptime:</span> ${d} days, ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
      const head = '  PID USER      PRI  NI   VIRT    RES S  CPU% MEM%     TIME+  Command';
      const tf = (t) => `${Math.floor(t / 60)}:${(t % 60).toFixed(2).padStart(5, '0')}`;
      const rows = [...PROCS].sort((a, b) => b.cpu - a.cpu).map((p) =>
        esc(`${String(p.pid).padStart(5)} ${p.user.padEnd(8)}   20   0 ${p.virt.padStart(6)} ${p.res.padStart(6)} ${p.cpu > 5 ? 'R' : 'S'} ${p.cpu.toFixed(1).padStart(5)} ${p.mem.toFixed(1).padStart(4)} ${tf(p.time).padStart(9)}  `) + `<span class="pcmd">${esc(p.cmd)}</span>`,
      ).join('\n');
      el.ovBody.innerHTML = `<p class="dim ovnote">htop with simulated values, not live telemetry. Press q to quit.</p>
        <div class="htop-top"><pre>${left}</pre><pre>${right}</pre></div>
        <div class="tbl"><pre><span class="thead">${esc(head)}</span>\n${rows}</pre></div>`;
    };
    render();
    const iv = setInterval(render, 1000);
    S.overlayOpen = true;
    el.ov.hidden = false;
    el.ovQuit.focus();
    S.closeOverlay = () => {
      clearInterval(iv);
      el.ov.hidden = true;
      S.overlayOpen = false;
      S.closeOverlay = () => {};
      res();
    };
  });
}
