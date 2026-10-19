import { useCallback, useEffect, useRef, useState } from 'react';
import { Bubble, Hot, R, Stage } from '../components/Stage';
import { Nav } from '../components/Nav';
import { Guestbook } from '../components/Guestbook';
import { useProgress } from '../lib/progress';
import { sfx } from '../lib/sound';
import { LumiCorner } from '../components/LumiCorner';
import { greeting as makeGreeting, registerVisit } from '../lib/lumi';

const W = 1536, H = 512;
// Calibrated against home.png (top half = day, bottom half = night). Open ?debug=1 to see hotspots.
const L = {
  day: { lumi: { x: 360, y: 350, r: 190 }, body: { x: 250, y: 215, w: 240, h: 280 }, guest: { x: 1062, y: 88, w: 386, h: 396 }, meet: { x: 68, y: 393, w: 196, h: 58 }, part: { x: 400, y: 410 }, bubble: { x: 215, y: 100 } },
  night: { lumi: { x: 290, y: 315, r: 175 }, body: { x: 140, y: 178, w: 300, h: 270 }, guest: { x: 1083, y: 66, w: 392, h: 392 }, meet: { x: 68, y: 384, w: 196, h: 58 }, part: { x: 345, y: 335 }, bubble: { x: 120, y: 100 } },
};
const DREAMS = ['…must fix them all… mumble…', 'snrk!', '*rolls over*', 'five more minutes…', '…tiny screws… zzz', '*sleep-giggles*'];

export default function Home() {
  const { progress, update } = useProgress();
  const mode = progress.theme;
  const c = L[mode];
  const [say, setSayState] = useState('');
  const sayTimer = useRef<number>();
  const [near, setNear] = useState(false);
  const [angry, setAngry] = useState(false);
  const [asleep, setAsleep] = useState(false);
  const asleepRef = useRef(false);
  const last = useRef(Date.now());
  const [part, setPart] = useState<'idle' | 'pop' | 'fall' | 'fix'>('idle');
  const [meet, setMeet] = useState(false);
  const [flash, setFlash] = useState(false);
  const [flashPos, setFlashPos] = useState({ x: 700, y: 250 });
  const flashRef = useRef(false);
  flashRef.current = flash;
  // Lumi remembers returning visitors (localStorage) and greets them in her own voice
  const [visit] = useState(() => registerVisit());
  const hello = makeGreeting(visit.visitor, visit.returning, visit.daysAgo);

  const talk = useCallback((t: string, ms = 2600) => {
    setSayState(t);
    window.clearTimeout(sayTimer.current);
    sayTimer.current = window.setTimeout(() => setSayState(''), ms);
  }, []);
  asleepRef.current = asleep;
  useEffect(() => { const t = window.setTimeout(() => talk(hello, 6000), 900); return () => window.clearTimeout(t); }, [hello, talk]);

  // personal-space circle: approaching Lumi (not touching!) makes her grumpy
  const onPointer = useCallback((p: { x: number; y: number } | null) => {
    if (!p) { setNear(false); return; }
    if (flashRef.current) setFlashPos(p);
    const d = Math.hypot(p.x - c.lumi.x, p.y - c.lumi.y);
    setNear(d < c.lumi.r);
  }, [c]);
  useEffect(() => {
    if (!near) { setAngry(false); return; }
    talk('Personal space, please!', 2200);
    sfx.bad();
    const t = window.setTimeout(() => { setAngry(true); talk('GRRR! Too close!', 2500); sfx.bad(); }, 2500);
    return () => window.clearTimeout(t);
  }, [near, talk]);

  // easter egg: falls asleep when nothing happens, then does random stuff
  useEffect(() => {
    const bump = () => {
      last.current = Date.now();
      if (asleepRef.current) { setAsleep(false); talk('Hmph. I was sleeping!', 2800); }
    };
    const ev = ['pointermove', 'pointerdown', 'keydown'] as const;
    ev.forEach((e) => window.addEventListener(e, bump));
    const t = window.setInterval(() => { if (!asleepRef.current && Date.now() - last.current > 45000) setAsleep(true); }, 1000);
    return () => { ev.forEach((e) => window.removeEventListener(e, bump)); window.clearInterval(t); };
  }, [talk]);
  useEffect(() => {
    if (!asleep) return;
    talk('Zzz…', 2000);
    const t = window.setInterval(() => { talk(DREAMS[Math.floor(Math.random() * DREAMS.length)], 2800); sfx.pop(); }, 5200);
    return () => window.clearInterval(t);
  }, [asleep, talk]);

  // special interaction: a part falls off, a spring pops out, Lumi picks it up and fixes herself
  function pressButton() {
    if (part !== 'idle') return;
    sfx.click();
    setPart('pop'); talk('Wait, what did you press?!', 1400); sfx.boing();
    window.setTimeout(() => { setPart('fall'); talk('Oh no… my button fell off!', 2200); }, 700);
    window.setTimeout(() => { setPart('fix'); talk('*picks it up* …*clink*', 2000); }, 2600);
    window.setTimeout(() => { setPart('idle'); talk('All fixed. Nobody saw that.', 2500); sfx.ok(); }, 3800);
  }

  return (
    <>
      <Stage art="/art/home.webp" w={W} h={H} crop={mode === 'day' ? 'top' : 'bottom'} onPointer={onPointer}>
        <Nav rect={{ x: 455, y: 10, w: 940, h: 62 }} theme={mode} onTheme={() => update({ theme: mode === 'day' ? 'night' : 'day' })} />

        <Hot {...c.meet} label="Meet Lumi" onClick={() => { sfx.click(); setMeet(true); }}
          style={{ borderRadius: 999, background: mode === 'day' ? '#ffeab0' : '#4a2f7a', border: `.25cqw solid ${mode === 'day' ? '#e8b85a' : '#ff8ad0'}`, color: mode === 'day' ? '#4a3328' : '#ffe9f7', fontSize: '1.9cqw', boxShadow: mode === 'night' ? '0 0 1.6cqw #ff8ad0' : '0 .3cqw .8cqw rgba(90,50,30,.3)' }}>
          Meet Lumi →
        </Hot>

        <Hot {...c.body} label="Lumi (please don’t touch)" onClick={() => { talk('Hey! Don’t touch me!', 2400); sfx.bad(); setAngry(true); window.setTimeout(() => setAngry(false), 900); }} cls="rounded-3xl" />

        {(near || angry) && (
          <R x={c.lumi.x - c.lumi.r} y={c.lumi.y - c.lumi.r} w={c.lumi.r * 2} h={c.lumi.r * 2} z={25} className={angry ? 'a-shake' : ''}
            style={{ borderRadius: '50%', border: `.3cqw dashed ${angry ? '#ff4d6d' : '#ffe27a'}`, boxShadow: `0 0 2.4cqw ${angry ? '#ff4d6d' : '#ffe27a'}, inset 0 0 2.4cqw ${angry ? 'rgba(255,77,109,.35)' : 'rgba(255,226,122,.3)'}`, pointerEvents: 'none' }} />
        )}
        {angry && <R x={c.lumi.x - 30} y={c.lumi.y - 190} w={90} h={60} z={26} style={{ fontSize: '4cqw', pointerEvents: 'none' }} className="a-pop">💢</R>}
        {asleep && [0, 1, 2].map((i) => (
          <R key={i} x={c.lumi.x + 40 + i * 28} y={c.lumi.y - 170 - i * 22} w={60} h={50} z={26} style={{ fontSize: `${2.2 + i * 0.7}cqw`, animationDelay: `${i * 0.7}s`, pointerEvents: 'none', color: '#fff' }} className="a-z">z</R>
        ))}
        <Bubble x={c.bubble.x} y={c.bubble.y} w={250} text={say} />

        {/* the “don’t press” retro button */}
        <Hot x={640} y={436} w={170} h={54} label="Press the button" onClick={pressButton}
          style={{ borderRadius: 999, background: 'linear-gradient(180deg,#ff7f9e,#d83a68)', border: '.3cqw solid #8f2447', color: '#fff', fontSize: '1.7cqw', boxShadow: '0 .5cqw 0 #8f2447, 0 .8cqw 1.4cqw rgba(0,0,0,.35)' }}>
          don’t press!
        </Hot>

        {part !== 'idle' && (
          <R x={c.part.x - 22} y={c.part.y - 22} w={44} h={90} z={27} style={{ pointerEvents: 'none' }}>
            {part === 'pop' && (
              <svg viewBox="0 0 44 90" className="a-pop" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                <path d="M22 70 q-14 -6 0 -12 t0 -12 t0 -12 t0 -12" fill="none" stroke="#9aa6b5" strokeWidth="4" strokeLinecap="round" />
                <circle cx="22" cy="14" r="14" fill="#6ec5f2" stroke="#2a4a66" strokeWidth="2.5" />
              </svg>
            )}
            {part !== 'pop' && (
              <div className={part === 'fall' ? 'a-fall' : 'a-back'} style={{ width: '100%' }}>
                <svg viewBox="0 0 44 44" style={{ width: '100%' }}>
                  <circle cx="22" cy="22" r="16" fill="#6ec5f2" stroke="#2a4a66" strokeWidth="2.5" /><circle cx="17" cy="16" r="5" fill="#fff" opacity=".8" />
                </svg>
                <svg viewBox="0 0 44 30" style={{ width: '70%', margin: '-10% 15% 0' }}>
                  <path d="M6 4 q16 4 0 8 t0 8 t0 8" fill="none" stroke="#9aa6b5" strokeWidth="3.5" strokeLinecap="round" />
                </svg>
              </div>
            )}
          </R>
        )}

        {mode === 'night' && (
          <Hot x={860} y={436} w={200} h={54} label={flash ? 'Turn the flashlight off' : 'Turn the flashlight on'} onClick={() => { sfx.click(); setFlash((f) => !f); }}
            style={{ borderRadius: 999, background: flash ? '#ffe27a' : '#4a2f7a', color: flash ? '#3a2418' : '#ffe9f7', border: '.25cqw solid #ffd95e', fontSize: '1.7cqw', boxShadow: '0 0 1.4cqw rgba(255,226,122,.7)' }}>
            🔦 {flash ? 'Lights on' : 'Flashlight'}
          </Hot>
        )}
        {mode === 'night' && flash && (
          <R x={0} y={0} w={W} h={H} z={35} style={{ pointerEvents: 'none', background: `radial-gradient(circle 15cqw at ${(flashPos.x / W) * 100}% ${(flashPos.y / H) * 100}%, transparent 0%, rgba(6,3,22,.55) 55%, rgba(6,3,22,.93) 100%)` }} />
        )}

        <Guestbook {...c.guest} night={mode === 'night'} />
      </Stage>

      {meet && <LumiCorner onClose={() => setMeet(false)} theme={mode} greeting={hello} />}
    </>
  );
}
