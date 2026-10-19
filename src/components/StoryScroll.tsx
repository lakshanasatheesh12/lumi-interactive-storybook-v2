import { useEffect, useRef, useState } from 'react';
import { Toy } from './Toy';

const SCENES = [
  'Lumi gets discarded because she is a broken toy,',
  'and then she decides to fix all broken toys',
  'so they don’t end up like her.',
];

/** Scroll-driven story: the three parts of Lumi's backstory advance as you scroll. */
export function StoryScroll() {
  const ref = useRef<HTMLElement>(null);
  const [p, setP] = useState(0);
  useEffect(() => {
    const on = () => {
      const el = ref.current; if (!el) return;
      const r = el.getBoundingClientRect();
      setP(Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight))));
    };
    on();
    addEventListener('scroll', on, { passive: true }); addEventListener('resize', on);
    return () => { removeEventListener('scroll', on); removeEventListener('resize', on); };
  }, []);
  const scene = Math.min(2, Math.floor(p * 3));
  const fade = (i: number) => ({ opacity: scene === i ? 1 : 0, transform: scene === i ? 'none' : `translateY(${i < scene ? -24 : 24}px)`, transition: 'opacity .5s, transform .5s', position: 'absolute' as const, inset: 0, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, textAlign: 'center' as const, pointerEvents: scene === i ? 'auto' as const : 'none' as const });
  const bad = { faded: 1, dirty: true, damages: [{ type: 'thread' as const, fixed: false }, { type: 'patch' as const, fixed: false }, { type: 'cotton' as const, fixed: false }] };
  const half = { faded: 0, dirty: false, damages: [{ type: 'thread' as const, fixed: true }, { type: 'patch' as const, fixed: false }] };
  return (
    <section id="story" ref={ref} aria-label="Lumi’s story, told as you scroll" style={{ height: '320vh', position: 'relative', background: `linear-gradient(180deg, #1c1236, ${p > 0.55 ? '#6a3f6e' : '#2a1d4a'} 60%, #c9788f)` }}>
      <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', color: '#fff4e8' }}>
        <div style={{ position: 'relative', height: '100%' }}>
          <div style={fade(0)}>
            <div style={{ opacity: 0.8, filter: 'grayscale(.4)', transform: 'rotate(-18deg)' }}><Toy kind="teddy" eyes="round" color="brown" acc="none" {...bad} style={{ width: 'min(52vw, 280px)' }} /></div>
            <p style={{ fontSize: 'clamp(24px, 4.5vw, 44px)', margin: 0, maxWidth: 760 }}>{SCENES[0]}</p>
          </div>
          <div style={fade(1)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="a-bob" style={{ fontSize: 'clamp(40px, 8vw, 80px)' }}>🔧</span>
              <Toy kind="duck" eyes="happy" color="yellow" acc="none" ghostAcc="bow" {...half} style={{ width: 'min(48vw, 260px)' }} />
            </div>
            <p style={{ fontSize: 'clamp(24px, 4.5vw, 44px)', margin: 0, maxWidth: 760 }}>{SCENES[1]}</p>
          </div>
          <div style={fade(2)}>
            <div style={{ display: 'flex', gap: 8, filter: 'drop-shadow(0 0 18px rgba(255,220,150,.8))' }}>
              <Toy kind="teddy" eyes="happy" color="brown" acc="bow" style={{ width: 'min(28vw, 170px)' }} />
              <Toy kind="cloud" eyes="sleepy" color="purple" acc="star" style={{ width: 'min(28vw, 170px)' }} />
              <Toy kind="duck" eyes="wink" color="pink" acc="heart" style={{ width: 'min(28vw, 170px)' }} />
            </div>
            <p style={{ fontSize: 'clamp(24px, 4.5vw, 44px)', margin: 0, maxWidth: 760 }}>{SCENES[2]} ♡</p>
          </div>
          <div aria-hidden style={{ position: 'absolute', bottom: 22, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 10 }}>
            {SCENES.map((_, i) => <span key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: scene === i ? '#ffd95e' : 'rgba(255,255,255,.35)' }} />)}
          </div>
        </div>
      </div>
    </section>
  );
}
