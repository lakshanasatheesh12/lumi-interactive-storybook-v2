import { useState } from 'react';
import { Bubble, Hot, R, Stage } from '../components/Stage';
import { Nav } from '../components/Nav';
import { Toy } from '../components/Toy';
import { api } from '../lib/api';
import { useProgress } from '../lib/progress';
import { Acc, Col, COLORS, Eyes, Kind, ToySpec } from '../lib/data';
import { sfx } from '../lib/sound';

const W = 1586, H = 992;
const KIND: [Kind, number, number][] = [['teddy', 72, 680], ['cloud', 226, 680], ['duck', 376, 680]];
const EYE: [Eyes, number, number][] = [['round', 565, 675], ['happy', 697, 675], ['sleepy', 565, 765], ['wink', 697, 765]];
const ACC: [Exclude<Acc, 'none'>, number, number][] = [['bow', 872, 675], ['scarf', 1025, 675], ['star', 872, 770], ['heart', 1025, 770]];
const COL: [Col, number, number][] = [['brown', 1232, 675], ['yellow', 1382, 675], ['pink', 1232, 775], ['purple', 1382, 775]];
const SECTIONS = [
  { x: 62, y: 612, w: 470, h: 272, hint: 'Step 1: Choose your toy: teddy, cloud, or duck!' },
  { x: 536, y: 612, w: 298, h: 272, hint: 'Step 2: Choose its eyes.' },
  { x: 838, y: 612, w: 350, h: 272, hint: 'Step 3: Choose an accessory.' },
  { x: 1192, y: 612, w: 352, h: 272, hint: 'Step 4: Choose a pastel colour.' },
];

export default function Toys() {
  const { progress, update } = useProgress();
  const [spec, setSpec] = useState<ToySpec>({ kind: 'teddy', eyes: 'round', acc: 'bow', color: 'brown' });
  const [step, setStep] = useState(0);
  const [made, setMade] = useState<ToySpec | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const pick = (patch: Partial<ToySpec>, s: number) => { sfx.click(); setSpec((p) => ({ ...p, ...patch })); setStep(s); };

  async function make() {
    if (saving) return;
    setSaving(true); setErr(''); sfx.ok();
    try {
      await api.saveToy('made', spec);
      update({ toysMade: progress.toysMade + 1 });
      setMade(spec);
    } catch (e) { setErr(`Couldn’t save your toy: ${(e as Error).message}`); sfx.bad(); }
    setSaving(false);
  }

  const check = (
    <span style={{ position: 'absolute', right: '4%', top: '4%', width: '2.2cqw', height: '2.2cqw', borderRadius: '50%', background: '#ff6fa8', color: '#fff', fontSize: '1.4cqw', display: 'grid', placeItems: 'center', border: '.15cqw solid #fff' }}>✓</span>
  );

  return (
    <Stage art="/art/toys.webp" w={W} h={H}>
      <Nav rect={{ x: 330, y: 8, w: 922, h: 62 }} />

      {/* the toy dome on the pedestal — a live preview */}
      <R x={672} y={296} w={246} h={226} z={10} style={{ borderRadius: '50%', background: 'radial-gradient(circle at 50% 60%, #fff4c9 0%, #ffd77a 55%, rgba(255,190,90,.9) 100%)', boxShadow: '0 0 4cqw rgba(255,200,90,.9), inset 0 0 2cqw rgba(255,255,255,.7)', border: '.3cqw solid #f0b856' }} />
      <R x={690} y={310} w={210} h={210} z={11} className="a-bob" style={{ pointerEvents: 'none' }}>
        <Toy {...spec} style={{ width: '100%', height: '100%' }} />
      </R>
      <Bubble x={250} y={118} w={250} text={SECTIONS[step].hint} tail="bottom" />

      {SECTIONS.map((s, i) => i === step && <R key={i} x={s.x} y={s.y} w={s.w} h={s.h} z={5} style={{ borderRadius: '1.4cqw', boxShadow: '0 0 0 .3cqw #ffd95e, 0 0 2.4cqw rgba(255,217,94,.9)', pointerEvents: 'none' }} />)}

      {KIND.map(([id, x, y]) => <Hot key={id} x={x} y={y} w={146} h={188} label={`Choose ${id}`} onClick={() => pick({ kind: id }, 1)} cls={spec.kind === id ? 'sel' : ''}>{spec.kind === id && check}</Hot>)}
      {EYE.map(([id, x, y]) => <Hot key={id} x={x} y={y} w={122} h={82} label={`Choose ${id} eyes`} onClick={() => pick({ eyes: id }, 2)} cls={spec.eyes === id ? 'sel' : ''}>{spec.eyes === id && check}</Hot>)}
      {ACC.map(([id, x, y]) => <Hot key={id} x={x} y={y} w={142} h={88} label={`Choose ${id}`} onClick={() => pick({ acc: id }, 3)} cls={spec.acc === id ? 'sel' : ''}>{spec.acc === id && check}</Hot>)}
      {COL.map(([id, x, y]) => <Hot key={id} x={x} y={y} w={140} h={94} label={`Choose ${COLORS[id].label}`} onClick={() => pick({ color: id }, 3)} cls={spec.color === id ? 'sel' : ''}>{spec.color === id && check}</Hot>)}

      <Hot x={418} y={890} w={170} h={64} label="Back" onClick={() => { sfx.click(); setStep((s) => Math.max(0, s - 1)); }} />
      <Hot x={992} y={890} w={170} h={64} label="Next" onClick={() => { sfx.click(); setStep((s) => Math.min(3, s + 1)); }} />
      <Hot x={622} y={888} w={340} h={68} label="Make my toy!" onClick={make} />

      {err && <Bubble x={560} y={800} w={460} text={err} />}

      {made && (
        <R x={0} y={0} w={W} h={H} z={50} style={{ background: 'rgba(30,15,40,.65)', display: 'grid', placeItems: 'center' }} onClick={() => setMade(null)}>
          <div className="paper" onClick={(e) => e.stopPropagation()} style={{ width: '34cqw', padding: '2.4cqw', borderRadius: '2cqw', textAlign: 'center', boxShadow: '0 0 5cqw rgba(255,210,120,.8)' }}>
            <div style={{ fontSize: '2.6cqw' }}>Your toy is ready! ✨</div>
            <Toy {...made} style={{ width: '18cqw', height: '18cqw' }} />
            <div style={{ fontSize: '1.7cqw', margin: '.6cqw 0 1.2cqw' }}>A {COLORS[made.color].label.toLowerCase()} {made.kind} with {made.eyes} eyes{made.acc === 'none' ? '' : ` and a ${made.acc}`} — saved to Lumi’s shelf.</div>
            <button type="button" onClick={() => setMade(null)} style={{ fontSize: '1.7cqw', padding: '.5cqw 2.4cqw', borderRadius: 999, background: '#f2759f', color: '#fff', boxShadow: '0 .3cqw 0 #c34c78' }}>Make another</button>
          </div>
        </R>
      )}
    </Stage>
  );
}
