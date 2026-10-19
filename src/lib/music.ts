import { useSyncExternalStore } from 'react';
import { isMuted, onMuteChange } from './sound';

/**
 * Lumi's lullaby: an original little music-box tune, synthesised live with the Web Audio API
 * (no audio files). Starts only after a click (browser autoplay rules) and obeys the mute switch.
 * Plays slower and lower in night mode. Keeps playing while you move between pages.
 */
const NOTES = [392, 440, 523.25, 587.33, 659.25, 783.99, 880, 1046.5]; // G4 A4 C5 D5 E5 G5 A5 C6 (pentatonic)
const MELODY: [number, number][] = [
  [4, 1], [2, 1], [3, 1], [4, 2], [5, 1], [4, 1], [3, 1], [2, 2],
  [2, 1], [3, 1], [4, 1], [5, 2], [6, 1], [5, 1], [4, 1], [3, 2],
  [4, 1], [5, 1], [6, 1], [7, 2], [6, 1], [5, 1], [4, 1], [3, 1],
  [3, 1], [2, 1], [1, 1], [2, 3], [-1, 1],
];
const BASS = [130.81, 98, 110, 98]; // C3 G2 A2 G2, one per four beats

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let timer: number | undefined;
let on = false;
let night = false;
let idx = 0;
let beatsSinceBass = 0;
let bassIdx = 0;
let nextTime = 0;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

function note(freq: number, when: number, vol: number, dur: number) {
  if (!ctx || !master) return;
  for (const [mult, v, d] of [[1, vol, dur], [2, vol * 0.25, dur * 0.35]] as const) {
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = mult === 1 ? 'sine' : 'triangle'; o.frequency.value = freq * mult;
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(v, when + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, when + d);
    o.connect(g); g.connect(master); o.start(when); o.stop(when + d + 0.05);
  }
}

function tick() {
  if (!ctx || !master) return;
  master.gain.setTargetAtTime(isMuted() ? 0 : 0.5, ctx.currentTime, 0.05);
  const beat = night ? 0.8 : 0.55, shift = night ? 0.75 : 1;
  while (nextTime < ctx.currentTime + 1.2) {
    const [n, beats] = MELODY[idx];
    if (beatsSinceBass <= 0) { note(BASS[bassIdx % BASS.length] * shift, nextTime, 0.07, beat * 4); bassIdx++; beatsSinceBass = 4; }
    if (n >= 0) note(NOTES[n] * shift, nextTime, 0.13, 1.6);
    nextTime += beats * beat; beatsSinceBass -= beats;
    idx = (idx + 1) % MELODY.length;
  }
}

export const music = {
  async start() {
    if (on) return;
    try {
      ctx ??= new AudioContext();
      if (!master) {
        master = ctx.createGain(); master.gain.value = isMuted() ? 0 : 0.5;
        const echo = ctx.createDelay(1); echo.delayTime.value = 0.32;
        const fb = ctx.createGain(); fb.gain.value = 0.3;
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600;
        master.connect(ctx.destination); master.connect(echo); echo.connect(lp); lp.connect(fb); fb.connect(echo); lp.connect(ctx.destination);
      }
      await ctx.resume();
      on = true; nextTime = ctx.currentTime + 0.1; beatsSinceBass = 0;
      tick(); timer = window.setInterval(tick, 250); emit();
    } catch { on = false; emit(); /* audio unavailable */ }
  },
  stop() { window.clearInterval(timer); on = false; master?.gain.setTargetAtTime(0, ctx?.currentTime ?? 0, 0.1); emit(); },
  toggle() { return on ? music.stop() : music.start(); },
  setNight(v: boolean) { night = v; },
};
onMuteChange(() => { if (ctx && master) master.gain.setTargetAtTime(isMuted() ? 0 : 0.5, ctx.currentTime, 0.05); });

export const useMusicOn = () => useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f); }; }, () => on);
