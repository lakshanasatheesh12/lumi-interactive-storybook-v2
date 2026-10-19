import { useState } from 'react';
import { Bubble, Hot, R, Stage, useU } from '../components/Stage';
import { Nav } from '../components/Nav';
import { useProgress } from '../lib/progress';
import { BACKSTORY } from '../lib/data';
import { sfx } from '../lib/sound';
import { StoryScroll } from '../components/StoryScroll';

const W = 1536, H = 512;
const CLOSED = { day: { x: 1275, y: 265, w: 225, h: 175 }, night: { x: 1258, y: 253, w: 252, h: 185 } };
const OPEN = { day: { x: 1225, y: 135, w: 290, h: 358 }, night: { x: 1225, y: 148, w: 290, h: 358 } };

function Paper() {
  const u = useU();
  const tape = (extra: object) => (
    <span style={{ position: 'absolute', width: u(64), height: u(22), background: 'rgba(255,214,120,.8)', boxShadow: `0 ${u(1)} ${u(2)} rgba(0,0,0,.2)`, ...extra }} />
  );
  return (
    <R x={718} y={66} w={396} h={350} z={15} style={{ perspective: u(1100) }}>
      <article aria-label="Lumi’s backstory" className="paper relative h-full w-full"
        style={{
          transform: 'rotateY(-5deg) rotateX(2deg) rotateZ(-.6deg)', transformOrigin: 'left center', padding: `${u(26)} ${u(30)}`,
          clipPath: 'polygon(1% 2%,12% 0,26% 1.5%,41% 0,58% 1.5%,74% 0,90% 1.5%,100% 0,99% 14%,100% 30%,99% 48%,100% 66%,99% 84%,100% 100%,86% 98.5%,70% 100%,52% 98.5%,36% 100%,20% 98.5%,6% 100%,0 98%,1% 80%,0 62%,1% 44%,0 26%,1% 12%)',
          boxShadow: `${u(10)} ${u(14)} ${u(26)} rgba(40,20,30,.5)`,
          backgroundImage: 'linear-gradient(100deg, rgba(120,70,50,.18), transparent 8%, transparent 92%, rgba(120,70,50,.14)), radial-gradient(circle at 20% 15%, rgba(255,255,255,.55), transparent 40%), linear-gradient(160deg,#fff6e6,#f9e5cc)',
        }}>
        {tape({ left: u(-14), top: u(10), transform: 'rotate(-35deg)' })}
        {tape({ right: u(-14), top: u(8), transform: 'rotate(30deg)' })}
        <h1 className="m-0" style={{ fontSize: u(30), lineHeight: 1.05 }}>
          {BACKSTORY.title} <span style={{ color: '#e8628f', fontSize: u(22) }}>♥</span>
        </h1>
        <div style={{ height: u(2), background: '#e8628f', width: '70%', margin: `${u(3)} 0 ${u(9)}` }} />
        <p className="m-0" style={{ fontSize: u(14), color: '#a0617c' }}>Story</p>
        <p style={{ fontSize: u(16.5), lineHeight: 1.16, margin: `${u(2)} 0 ${u(8)}` }}>{BACKSTORY.story}</p>
        <p className="m-0" style={{ fontSize: u(14), color: '#a0617c' }}>Personality</p>
        <ul className="m-0 list-none p-0" style={{ fontSize: u(16.5), lineHeight: 1.1 }}>
          {BACKSTORY.personality.map((t) => (
            <li key={t} className="flex" style={{ gap: u(8), marginTop: u(3) }}>
              <span style={{ color: '#f2b43a' }}>★</span><span>{t}</span>
            </li>
          ))}
        </ul>
        <span aria-hidden style={{ position: 'absolute', right: u(30), top: u(60), fontSize: u(30) }}>🌙</span>
      </article>
    </R>
  );
}

export default function Backstory() {
  const { progress, update } = useProgress();
  const mode = progress.theme;
  const [open, setOpen] = useState(false);
  const [say, setSay] = useState('');
  const closed = CLOSED[mode], o = OPEN[mode];

  function toggle() {
    const next = !open;
    setOpen(next);
    next ? sfx.ok() : sfx.click();
    setSay(next ? 'Lumi’s secret toy chest ✨' : '');
    if (next && !progress.chestOpened) update({ chestOpened: true });
    if (next) window.setTimeout(() => setSay(''), 2600);
  }

  return (
    <>
    <Stage art="/art/backstory.webp" w={W} h={H} crop={mode === 'day' ? 'top' : 'bottom'}>
      <Nav rect={{ x: 335, y: 6, w: 880, h: 60 }} theme={mode} onTheme={() => update({ theme: mode === 'day' ? 'night' : 'day' })} />
      <Paper />

      {!open && (
        <>
          <Hot {...closed} label="Open Lumi’s secret toy chest" onClick={toggle} cls="rounded-2xl glow a-bob" />
          <R x={closed.x} y={closed.y - 26} w={closed.w} h={24} z={22} style={{ fontSize: '1.5cqw', textAlign: 'center', color: '#fff', textShadow: '0 0 .8cqw #000', pointerEvents: 'none' }}>Psst… a secret chest ✨</R>
        </>
      )}
      {open && (
        <>
          <R x={o.x} y={o.y} w={o.w} h={o.h} z={22} style={{
            backgroundImage: 'url(/art/backstory-open.webp)', backgroundSize: `${(1536 / 425) * 100}% auto`,
            backgroundPosition: `${(1085 / (1536 - 425)) * 100}% ${(355 / (1024 - 525)) * 100}%`, backgroundRepeat: 'no-repeat',
            WebkitMaskImage: 'radial-gradient(ellipse 62% 62% at 50% 55%, #000 58%, transparent 100%)', maskImage: 'radial-gradient(ellipse 62% 62% at 50% 55%, #000 58%, transparent 100%)',
            filter: mode === 'day' ? 'brightness(1.12) saturate(.95)' : 'none', pointerEvents: 'none',
          }} />
          <Hot x={o.x + 20} y={o.y + 40} w={o.w - 40} h={o.h - 60} label="Close the chest" onClick={toggle} z={23} />
        </>
      )}
      <Bubble x={1190} y={80} w={260} text={say} tail="left" />
      <Hot x={620} y={470} w={300} h={34} label="Scroll down for Lumi’s story" onClick={() => document.getElementById('story')?.scrollIntoView({ behavior: 'smooth' })} z={22}
        style={{ borderRadius: 999, background: 'rgba(255,255,255,.75)', fontSize: '1.7cqw' }}>Scroll for her story ↓</Hot>
    </Stage>
    <StoryScroll />
    </>
  );
}
