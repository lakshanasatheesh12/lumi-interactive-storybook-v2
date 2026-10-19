import { useRef, useState } from 'react';
import { Bubble, Hot, R, Stage } from '../components/Stage';
import { Nav } from '../components/Nav';
import { Toy } from '../components/Toy';
import { api } from '../lib/api';
import { BABIES, BabyId, specText } from '../lib/data';
import { useProgress } from '../lib/progress';
import { sfx } from '../lib/sound';

const W = 1672, H = 941;
const HUB = { x: 790, y: 372 };
type Status = 'pending' | 'loaded' | 'driving' | 'delivered';
const PILL: Record<Status, { bg: string; fg: string; label: string }> = {
  pending: { bg: '#e8e1f1', fg: '#6b5a7e', label: 'Pending' },
  loaded: { bg: '#ffe9a8', fg: '#7a5a10', label: 'Loaded' },
  driving: { bg: '#bfe6ff', fg: '#1d5a85', label: 'On the way' },
  delivered: { bg: '#c8f1c4', fg: '#25692b', label: 'Delivered ✓' },
};
const BADGE: Record<Status, string> = { pending: '', loaded: '🎁', driving: '🚚', delivered: '✅' };
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const target = (i: number) => ({ x: BABIES[i].house.x + BABIES[i].house.w / 2, y: BABIES[i].house.y + BABIES[i].house.h * 0.82 });

export default function Delivery() {
  const { progress, update } = useProgress();
  const [sel, setSel] = useState<number | null>(null);
  const [carry, setCarry] = useState<number | null>(null);
  const [status, setStatus] = useState<Status[]>(BABIES.map(() => 'pending'));
  const [running, setRunning] = useState(false);
  const [truck, setTruck] = useState({ ...HUB, flip: false });
  const [route, setRoute] = useState<{ x: number; y: number } | null>(null);
  const [say, setSayText] = useState('');
  const [lcd, setLcd] = useState('READY');
  const [hearts, setHearts] = useState<{ i: number; k: number } | null>(null);
  const [err, setErr] = useState('');
  const sayTimer = useRef<number>();
  const pos = useRef({ ...HUB });

  const talk = (t: string, ms = 3600) => { setSayText(t); window.clearTimeout(sayTimer.current); sayTimer.current = window.setTimeout(() => setSayText(''), ms); };
  const setSt = (i: number, s: Status) => setStatus((a) => a.map((v, k) => (k === i ? s : v)));
  const loadedCount = status.filter((s) => s !== 'pending').length;
  const allDelivered = status.every((s) => s === 'delivered');

  function tryMatch(h: number, b: number) {
    if (h === b) { setSt(h, 'loaded'); talk(`${BABIES[h].name} will love it!`); sfx.ok(); setLcd(`LOADED ${loadedCount + 1}/7`); }
    else { talk(`That gift isn’t for ${BABIES[h].name}. Check the icon and its wish!`); sfx.bad(); }
    setSel(null); setCarry(null);
  }
  function house(i: number) {
    if (running) return;
    if (status[i] !== 'pending') { talk(`${BABIES[i].name}’s gift is already ${status[i] === 'delivered' ? 'delivered' : 'loaded'}.`); return; }
    sfx.click();
    if (carry !== null) return tryMatch(i, carry);
    setSel(i); talk(`${BABIES[i].name} wishes for a ${specText(BABIES[i].wants)}. Pick its gift box!`, 6000);
  }
  function box(i: number) {
    if (running) return;
    if (status[i] !== 'pending') { talk('That gift is already on its way.'); return; }
    sfx.click();
    if (sel !== null) return tryMatch(sel, i);
    setCarry(i); talk('Which house is this gift for? Tap a house.');
  }

  async function drive(to: { x: number; y: number }, ms: number) {
    const from = { ...pos.current };
    const t0 = performance.now();
    setRoute(to);
    await new Promise<void>((res) => {
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / ms), e = ease(t);
        const p = { x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e };
        pos.current = p; setTruck({ ...p, flip: to.x < from.x });
        t < 1 ? requestAnimationFrame(step) : res();
      };
      requestAnimationFrame(step);
    });
  }

  async function start() {
    if (running) return;
    if (allDelivered) { setStatus(BABIES.map(() => 'pending')); setLcd('READY'); talk('Fresh start! Load the gifts again.'); sfx.click(); return; }
    const missing = status.findIndex((s) => s === 'pending');
    if (missing >= 0) { talk(`Load ${BABIES[missing].name}’s toy first — tap its house, then its gift box.`); sfx.bad(); return; }
    setRunning(true); setErr(''); sfx.ok();
    const done: BabyId[] = [];
    let totalNow = progress.totalDeliveries;
    for (let i = 0; i < BABIES.length; i++) {
      setSt(i, 'driving'); setLcd(`TO: ${BABIES[i].id.toUpperCase()}`); talk(`Off to ${BABIES[i].name}!`, 1800);
      await drive(target(i), 1700);
      setSt(i, 'delivered'); setHearts({ i, k: Date.now() }); sfx.ok(); done.push(BABIES[i].id);
      try { totalNow = (await api.deliver(BABIES[i].id)).total; } catch (e) { setErr(`Couldn’t save delivery: ${(e as Error).message}`); }
      await sleep(600);
    }
    await drive({ ...HUB }, 1500);
    setRoute(null); setRunning(false); setLcd('ALL DONE ★');
    talk('Seven houses, seven happy babies. Time for a nap…', 6000);
    update({ delivered: done, totalDeliveries: totalNow });
  }

  const note = sel !== null ? BABIES[sel] : null;
  return (
    <Stage art="/art/delivery.webp" w={W} h={H}>
      <Nav rect={{ x: 300, y: 5, w: 1080, h: 58 }} />

      {/* pinned note (replaces the painted one) */}
      <R x={54} y={294} w={176} h={152} z={12} className="paper" style={{ borderRadius: '.6cqw', padding: '.7cqw .9cqw', fontSize: '1.45cqw', lineHeight: 1.15, transform: 'rotate(-2deg)', boxShadow: '0 .4cqw .8cqw rgba(0,0,0,.35)' }}>
        {note ? (
          <>
            <b>{note.icon} {note.name}</b> wishes for:
            <Toy {...note.wants} style={{ width: '42%', display: 'block', margin: '.2cqw auto 0' }} />
          </>
        ) : (
          <>Seven houses, seven different babies, and a special toy for each one! ♡</>
        )}
      </R>

      {/* houses */}
      {BABIES.map((b, i) => (
        <Hot key={b.id} {...b.house} label={`${b.name} house`} onClick={() => house(i)} cls={sel === i ? 'sel' : ''} z={14} style={{ borderRadius: '1.4cqw' }}>
          {BADGE[status[i]] && <span className={status[i] === 'driving' ? 'a-bob' : ''} style={{ position: 'absolute', right: '4%', top: '2%', fontSize: '2.2cqw', background: 'rgba(255,255,255,.9)', borderRadius: '50%', width: '3cqw', height: '3cqw', display: 'grid', placeItems: 'center' }}>{BADGE[status[i]]}</span>}
        </Hot>
      ))}
      {hearts && (
        <R key={hearts.k} x={target(hearts.i).x - 40} y={target(hearts.i).y - 90} w={80} h={60} z={31} style={{ pointerEvents: 'none', fontSize: '3cqw', textAlign: 'center' }} className="a-heart">💖</R>
      )}

      {/* route + truck */}
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 30 }}>
        {route && <path d={`M${HUB.x} ${HUB.y} Q ${(HUB.x + route.x) / 2} ${Math.min(HUB.y, route.y) - 60} ${route.x} ${route.y}`} fill="none" stroke="#ff4f9a" strokeWidth="5" strokeDasharray="12 10" strokeLinecap="round" opacity=".85" />}
        <g transform={`translate(${truck.x} ${truck.y - 20}) scale(${truck.flip ? -1 : 1} 1)`} className={running ? 'a-bob' : ''}>
          <rect x="-36" y="-26" width="50" height="36" rx="5" fill="#fff3e2" stroke="#b46f9a" strokeWidth="3" />
          <rect x="-36" y="0" width="50" height="7" fill="#ff8fb4" />
          <path d="M14 -14 h14 l10 12 v12 h-24 Z" fill="#fff3e2" stroke="#b46f9a" strokeWidth="3" strokeLinejoin="round" />
          <rect x="18" y="-9" width="11" height="9" rx="2" fill="#cfeaff" stroke="#b46f9a" strokeWidth="2" />
          <text x="-11" y="-6" textAnchor="middle" fontSize="16" fill="#e8a000">★</text>
          <circle cx="-20" cy="12" r="8" fill="#4a3328" /><circle cx="24" cy="12" r="8" fill="#4a3328" />
          <circle cx="-20" cy="12" r="3" fill="#ddd" /><circle cx="24" cy="12" r="3" fill="#ddd" />
        </g>
      </svg>

      {/* delivery route list status pills */}
      {BABIES.map((b, i) => {
        const p = PILL[status[i]];
        return <R key={b.id} x={1496} y={236 + i * 40.2} w={82} h={28} z={12} style={{ background: p.bg, color: p.fg, borderRadius: '.7cqw', fontSize: '1.05cqw', display: 'grid', placeItems: 'center', whiteSpace: 'nowrap', pointerEvents: 'none', border: '.12cqw solid rgba(120,90,140,.25)' }}>{p.label}</R>;
      })}

      {/* gift boxes */}
      {BABIES.map((b, i) => (
        <Hot key={b.id} {...b.box} label={`Gift for ${b.name} (${specText(b.wants)})`} onClick={() => box(i)} cls={carry === i ? 'sel' : status[i] !== 'pending' ? 'glow' : ''} z={14} style={{ borderRadius: '1.2cqw', transform: status[i] !== 'pending' ? 'translateY(-1cqw)' : undefined }}>
          {status[i] !== 'pending' && <span style={{ position: 'absolute', right: 0, top: 0, background: '#7be28d', color: '#fff', borderRadius: '50%', width: '2.4cqw', height: '2.4cqw', fontSize: '1.5cqw', display: 'grid', placeItems: 'center' }}>✓</span>}
        </Hot>
      ))}

      {/* retro LCD */}
      <R x={1143} y={742} w={92} h={58} z={12} style={{ background: '#0f2a1d', color: '#7dffb0', border: '.25cqw solid #5a6b78', borderRadius: '.6cqw', fontFamily: 'monospace', fontSize: '1.05cqw', display: 'grid', placeItems: 'center', textAlign: 'center', lineHeight: 1.1, pointerEvents: 'none', textShadow: '0 0 .5cqw #7dffb0' }}>
        {lcd}<br />{progress.totalDeliveries} {progress.totalDeliveries === 1 ? 'trip' : 'trips'}
      </R>

      <Hot x={672} y={778} w={396} h={78} label="Start delivery!" onClick={start} cls={!running && loadedCount === 7 && !allDelivered ? 'glow a-bob' : ''} z={16} style={{ borderRadius: 999 }} />
      <Bubble x={240} y={336} w={260} text={say} tail="left" />
      {err && <Bubble x={560} y={690} w={520} text={err} />}
    </Stage>
  );
}
