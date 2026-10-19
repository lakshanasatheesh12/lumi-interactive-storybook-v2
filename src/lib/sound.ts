import { useSyncExternalStore } from 'react';

let ctx: AudioContext | null = null;
let muted = false;
try { muted = localStorage.getItem('lumi-muted') === '1'; } catch { /* ignore */ }
const subs = new Set<() => void>();

export const setMuted = (m: boolean) => {
  muted = m;
  try { localStorage.setItem('lumi-muted', m ? '1' : '0'); } catch { /* ignore */ }
  subs.forEach((f) => f());
};
export const isMuted = () => muted;
export const onMuteChange = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };
export const useMuted = () =>
  useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f); }; }, () => muted);

function blip(freq: number, dur = 0.09, type: OscillatorType = 'square', vol = 0.035) {
  if (muted) return;
  try {
    ctx ??= new AudioContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type; o.frequency.value = freq; g.gain.value = vol;
    o.connect(g); g.connect(ctx.destination);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.start(); o.stop(ctx.currentTime + dur + 0.02);
  } catch { /* audio unavailable */ }
}
export const sfx = {
  click: () => blip(420),
  ok: () => { blip(520); setTimeout(() => blip(700), 90); },
  bad: () => blip(150, 0.16, 'sawtooth'),
  pop: () => blip(900, 0.06, 'triangle', 0.05),
  boing: () => { blip(300, 0.1, 'triangle', 0.05); setTimeout(() => blip(520, 0.12, 'triangle', 0.05), 80); },
};
