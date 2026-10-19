import { CSSProperties, useEffect, useRef, useState } from 'react';
import { Bubble, Hot, R, Stage } from '../components/Stage';
import { Nav } from '../components/Nav';
import { DamageState, Toy } from '../components/Toy';
import { api } from '../lib/api';
import { useProgress } from '../lib/progress';
import { ACC_IDS, COLOR_IDS, COLORS, DamageType, DAMAGE_META, EYE_IDS, KINDS, ToySpec } from '../lib/data';
import { sfx } from '../lib/sound';
import { PuzzleGame } from '../components/PuzzleGame';

const W = 1672, H = 941;
const FIX: [DamageType, number][] = [['thread', 225], ['bandage', 322], ['cotton', 413], ['patch', 513]];
const PAINT = [['brown', 640], ['yellow', 718], ['pink', 800], ['purple', 878]] as const;
const ACCS = [['bow', 980], ['scarf', 1068], ['star', 1150], ['heart', 1232]] as const;
const MAX_JOBS = 3;

interface Job {
  id: number; spec: ToySpec; faded: boolean; dirty: boolean; accMissing: boolean; damages: DamageState[];
  paintDone: boolean; accDone: boolean; cleanDone: boolean; done: boolean;
}
type Tool = { group: 'fix' | 'paint' | 'acc' | 'clean'; value: string } | null;

const pick = <T,>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)];
const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5);
let nextId = 1;
function makeJob(): Job {
  const types = shuffle<DamageType>(['thread', 'bandage', 'cotton', 'patch']).slice(0, 1 + Math.floor(Math.random() * 3));
  let faded = Math.random() < 0.75, dirty = Math.random() < 0.6, accMissing = Math.random() < 0.75;
  if (types.length + +faded + +dirty + +accMissing < 3) { faded = true; accMissing = true; }
  return {
    id: nextId++, spec: { kind: pick(KINDS).id, eyes: pick(EYE_IDS), acc: pick(ACC_IDS), color: pick(COLOR_IDS) },
    faded, dirty, accMissing, damages: types.map((type) => ({ type, fixed: false })), paintDone: false, accDone: false, cleanDone: false, done: false,
  };
}
const total = (j: Job) => j.damages.length + +j.faded + +j.accMissing + +j.dirty;
const remaining = (j: Job) => j.damages.filter((d) => !d.fixed).length + +(j.faded && !j.paintDone) + +(j.accMissing && !j.accDone) + +(j.dirty && !j.cleanDone);

function JobToy({ j, before, style, onMarker, onBody }: { j: Job; before?: boolean; style?: CSSProperties; onMarker?: (t: DamageType) => void; onBody?: () => void }) {
  const faded = before ? j.faded : j.faded && !j.paintDone;
  const dirty = before ? j.dirty : j.dirty && !j.cleanDone;
  const noAcc = before ? j.accMissing : j.accMissing && !j.accDone;
  return (
    <Toy {...j.spec} acc={noAcc ? 'none' : j.spec.acc} ghostAcc={noAcc && !before ? j.spec.acc : undefined} faded={faded ? 1 : 0} dirty={dirty}
      damages={before ? j.damages.map((d) => ({ ...d, fixed: false })) : j.damages} onMarker={before ? undefined : onMarker} onBody={onBody} style={style} />
  );
}

export default function Workshop() {
  const { progress, update } = useProgress();
  const pr = useRef(progress);
  pr.current = progress;
  const [jobs, setJobs] = useState<Job[]>([]);
  const [active, setActive] = useState(0);
  const [tool, setTool] = useState<Tool>(null);
  const [say, setSay] = useState('');
  const [zap, setZap] = useState(0);
  const [result, setResult] = useState<Job | null>(null);
  const [err, setErr] = useState('');
  const [puzzle, setPuzzle] = useState(false);
  const sayTimer = useRef<number>();
  const finishing = useRef<number | null>(null);

  const job = jobs[active] as Job | undefined;
  const talk = (t: string, ms = 3200) => { setSay(t); window.clearTimeout(sayTimer.current); sayTimer.current = window.setTimeout(() => setSay(''), ms); };
  const hint = !job ? 'Click the chest to pull out a broken toy!' : tool ? 'Now tap the toy (or a pink damage ring).' : 'Pick a tool below, then tap the toy.';

  useEffect(() => {
    if (!job || job.done || finishing.current === job.id || remaining(job) > 0) return;
    finishing.current = job.id;
    setJobs((js) => js.map((j) => (j.id === job.id ? { ...j, done: true } : j)));
    sfx.ok(); talk('All better! Look at that smile.', 4000);
    window.setTimeout(() => {
      api.saveToy('repaired', job.spec).catch((e) => setErr(`Couldn’t save progress: ${(e as Error).message}`));
      update({ toysRepaired: pr.current.toysRepaired + 1 });
      setResult(job);
    }, 900);
  }, [job, update]);

  function pull() {
    sfx.pop();
    if (result) return;
    if (jobs.length >= MAX_JOBS) { talk('The belt is full — finish a toy first!'); sfx.bad(); return; }
    const j = makeJob();
    setJobs((js) => [...js, j]); setActive(jobs.length); setTool(null);
    talk(`A broken ${j.spec.kind}! It used to wear a ${j.spec.acc}.`, 4200);
  }

  function use(target: 'body' | DamageType) {
    if (!job || job.done) { talk('Pull a broken toy out of the chest first!'); sfx.bad(); return; }
    if (!tool) { talk('Pick a tool first, then tap the toy.'); sfx.bad(); return; }
    const patch = (p: Partial<Job>) => { setJobs((js) => js.map((x) => (x.id === job.id ? { ...x, ...p } : x))); setZap((z) => z + 1); sfx.ok(); };
    const no = (m: string) => { talk(m); sfx.bad(); };
    if (tool.group === 'fix') {
      const type = tool.value as DamageType;
      if (target !== 'body' && target !== type) return no(`That spot needs the ${DAMAGE_META[target].tool}.`);
      if (!job.damages.some((d) => d.type === type && !d.fixed)) return no(`Nothing here needs the ${DAMAGE_META[type].tool}.`);
      patch({ damages: job.damages.map((d) => (d.type === type ? { ...d, fixed: true } : d)) }); talk('Stitch, stitch… mended!');
    } else if (tool.group === 'paint') {
      if (!job.faded || job.paintDone) return no('Its colour already looks lovely.');
      if (tool.value !== job.spec.color) return no('Hmm, that’s not its colour. Look at the faded tint!');
      patch({ paintDone: true }); talk('Colour restored!');
    } else if (tool.group === 'acc') {
      if (!job.accMissing || job.accDone) return no('It already has its accessory.');
      if (tool.value !== job.spec.acc) return no('That doesn’t match — look at the dotted outline.');
      patch({ accDone: true }); talk('Good as new — it fits perfectly!');
    } else {
      if (!job.dirty || job.cleanDone) return no('Already squeaky clean.');
      patch({ cleanDone: true }); talk('Scrub-a-dub… sparkling!');
    }
  }

  const choose = (t: NonNullable<Tool>) => { sfx.click(); setTool(t); };
  const isTool = (g: string, v: string) => tool?.group === g && tool.value === v;
  const pct = job ? Math.round(((total(job) - remaining(job)) / total(job)) * 100) : 0;
  const ticks = [
    !!job && job.damages.every((d) => d.fixed),
    !!job && (!job.faded || job.paintDone),
    !!job && (!job.accMissing || job.accDone),
  ];

  function next() {
    if (!result) return;
    setJobs((js) => js.filter((j) => j.id !== result.id)); setActive(0); setResult(null); setTool(null); sfx.click();
  }

  const checkbox = (y: number, on: boolean) => (
    <R x={1446} y={y} w={20} h={18} z={12} style={{ background: '#241a3c', border: '.2cqw solid #e9dfff', borderRadius: '.3cqw', color: '#7dffb0', fontSize: '1.4cqw', display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>{on ? '✓' : ''}</R>
  );

  return (
    <>
    <Stage art="/art/workshop.webp" w={W} h={H}>
      <Nav rect={{ x: 225, y: 4, w: 1225, h: 62 }} />

      {/* the chest replaces the toy-selection panel */}
      <Hot x={4} y={300} w={668} h={340} label="Pull a broken toy out of the chest" onClick={pull} cls={!job ? 'glow a-bob' : ''} z={8} />
      <R x={20} y={596} w={210} h={36} z={12} style={{ background: '#fbe3ee', border: '.2cqw solid #e9a5c3', borderRadius: 999, fontSize: '1.6cqw', display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>Toys repaired: {progress.toysRepaired}</R>
      <Hot x={244} y={596} w={262} h={36} label="Open the puzzle repair bench" onClick={() => { sfx.click(); setPuzzle(true); }} z={12}
        style={{ background: '#e7dcff', border: '.2cqw solid #b49ae8', borderRadius: 999, fontSize: '1.6cqw' }}>🧩 Puzzle bench</Hot>
      <Hot x={108} y={656} w={64} h={64} label="Clear the belt" onClick={() => { setJobs([]); setActive(0); setTool(null); setResult(null); sfx.click(); talk('Belt cleared.'); }} cls="rounded-full" />

      {/* work tray on the conveyor belt */}
      <R x={962} y={404} w={222} h={206} z={10} style={{ borderRadius: '1.6cqw', background: 'radial-gradient(circle at 50% 35%, #fff1de, #f6cdb0 70%, #d99b88)', border: '.35cqw solid #b46f9a', boxShadow: '0 .6cqw 1.6cqw rgba(60,20,40,.5)' }} />
      {job ? (
        <R key={job.id} x={968} y={408} w={210} h={210} z={11} className="a-fly">
          <JobToy j={job} style={{ width: '100%', height: '100%' }} onMarker={(t) => use(t)} onBody={() => use('body')} />
        </R>
      ) : (
        <R x={962} y={404} w={222} h={206} z={11} style={{ display: 'grid', placeItems: 'center', fontSize: '1.7cqw', textAlign: 'center', pointerEvents: 'none', opacity: 0.8 }}>Empty tray<br />★</R>
      )}
      {zap > 0 && job && <R key={zap} x={1010} y={440} w={130} h={130} z={13} className="a-spark" style={{ pointerEvents: 'none', fontSize: '5cqw', display: 'grid', placeItems: 'center' }}>✨</R>}

      {/* queue thumbnails on the belt + arrows */}
      {jobs.map((j, i) => (
        <Hot key={j.id} x={690 + i * 86} y={572} w={76} h={66} label={`Toy ${i + 1} on the belt`} onClick={() => { setActive(i); sfx.click(); }} cls={i === active ? 'sel' : ''} z={9} style={{ background: 'rgba(255,240,225,.85)', borderRadius: '1cqw' }}>
          <JobToy j={j} style={{ width: '100%', height: '100%' }} />
        </Hot>
      ))}
      <Hot x={722} y={828} w={106} h={60} label="Previous toy" onClick={() => { if (jobs.length) setActive((a) => (a - 1 + jobs.length) % jobs.length); sfx.click(); }} cls="rounded-full" />
      <Hot x={852} y={828} w={106} h={60} label="Next toy" onClick={() => { if (jobs.length) setActive((a) => (a + 1) % jobs.length); sfx.click(); }} cls="rounded-full" />

      {/* output platform */}
      <R x={1368} y={398} w={196} h={196} z={10} style={{ borderRadius: '1.6cqw', background: 'radial-gradient(circle at 50% 40%, #fff7e6, #ffe3a6 65%, #f0b86a)', border: '.35cqw solid #d9a24a', boxShadow: '0 0 2.4cqw rgba(255,210,120,.8)' }}>
        {result ? <JobToy j={{ ...result, paintDone: true, accDone: true, cleanDone: true, damages: result.damages.map((d) => ({ ...d, fixed: true })) }} style={{ width: '100%', height: '100%' }} />
          : <div style={{ display: 'grid', placeItems: 'center', height: '100%', fontSize: '1.6cqw', opacity: 0.7, textAlign: 'center' }}>Repaired<br />toys land<br />here ★</div>}
      </R>

      {/* machine screen: progress + stars; chalkboard checklist */}
      <R x={1415} y={128} w={186} h={96} z={12} style={{ background: '#2b2050', borderRadius: '.8cqw', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', left: '7%', right: '7%', top: '14%', height: '16%', borderRadius: 999, background: '#150f2c', overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg,#ffd95e,#ff8fb4)', transition: 'width .4s' }} />
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: '6%', display: 'flex', justifyContent: 'center', gap: '1cqw', fontSize: '3.2cqw', lineHeight: 1 }}>
          {[33, 66, 100].map((t) => <span key={t} style={{ color: pct >= t ? '#ffd95e' : '#5a4a85' }}>★</span>)}
        </div>
      </R>
      {checkbox(286, ticks[0])}{checkbox(323, ticks[1])}{checkbox(361, ticks[2])}

      <Bubble x={690} y={262} w={250} text={say || hint} />
      {err && <Bubble x={420} y={130} w={380} text={err} />}

      {/* repair tools (selectable) */}
      {FIX.map(([t, x]) => <Hot key={t} x={x} y={712} w={92} h={92} label={`Use ${DAMAGE_META[t].tool}`} onClick={() => choose({ group: 'fix', value: t })} cls={isTool('fix', t) ? 'sel' : ''} />)}
      {PAINT.map(([c, x]) => <Hot key={c} x={x} y={712} w={76} h={92} label={`Use ${COLORS[c].label} paint`} onClick={() => choose({ group: 'paint', value: c })} cls={isTool('paint', c) ? 'sel' : ''} />)}
      {ACCS.map(([a, x]) => <Hot key={a} x={x} y={712} w={80} h={92} label={`Attach ${a}`} onClick={() => choose({ group: 'acc', value: a })} cls={isTool('acc', a) ? 'sel' : ''} />)}
      <Hot x={1345} y={712} w={160} h={92} label="Use sponge to clean" onClick={() => choose({ group: 'clean', value: 'sponge' })} cls={isTool('clean', 'sponge') ? 'sel' : ''} />

      {result && (
        <R x={0} y={0} w={W} h={H} z={50} style={{ background: 'rgba(30,15,40,.7)', display: 'grid', placeItems: 'center' }}>
          <div className="paper" role="dialog" aria-label="Repair result" style={{ width: '56cqw', padding: '2cqw', borderRadius: '2cqw', textAlign: 'center', boxShadow: '0 0 5cqw rgba(255,210,120,.8)' }}>
            <div style={{ fontSize: '3cqw' }}>Good as new! ✨</div>
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', margin: '1cqw 0' }}>
              <figure style={{ margin: 0 }}><JobToy j={result} before style={{ width: '17cqw', height: '17cqw' }} /><figcaption style={{ fontSize: '2cqw' }}>before</figcaption></figure>
              <span style={{ fontSize: '4cqw' }}>→</span>
              <figure style={{ margin: 0 }}><Toy {...result.spec} style={{ width: '17cqw', height: '17cqw' }} /><figcaption style={{ fontSize: '2cqw' }}>after</figcaption></figure>
            </div>
            <button type="button" onClick={next} style={{ fontSize: '2cqw', padding: '.6cqw 3cqw', borderRadius: 999, background: '#f2759f', color: '#fff', boxShadow: '0 .3cqw 0 #c34c78' }}>Next toy</button>
          </div>
        </R>
      )}
    </Stage>
    {puzzle && (
      <PuzzleGame onClose={() => setPuzzle(false)} onWin={(s) => {
        api.saveToy('repaired', s).catch((e) => setErr(`Couldn’t save progress: ${(e as Error).message}`));
        update({ toysRepaired: pr.current.toysRepaired + 1 });
      }} />
    )}
    </>
  );
}
