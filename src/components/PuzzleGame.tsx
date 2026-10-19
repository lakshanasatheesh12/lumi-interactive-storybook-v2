import { PointerEvent as RPE, useEffect, useRef, useState } from 'react';
import { Toy } from './Toy';
import { ACC_IDS, COLOR_IDS, EYE_IDS, KINDS, ToySpec } from '../lib/data';
import { sfx } from '../lib/sound';

interface Piece { id: number; row: number; col: number; x: number; y: number; hx: number; hy: number; rot: number; placed: boolean }
const rand = <T,>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)];
const newSpec = (): ToySpec => ({ kind: rand(KINDS).id, eyes: rand(EYE_IDS), acc: rand(ACC_IDS), color: rand(COLOR_IDS) });

/** Fix a toy by dragging its torn-apart pieces back into place, like a jigsaw. */
export function PuzzleGame({ onClose, onWin }: { onClose: () => void; onWin: (s: ToySpec) => void }) {
  const BOARD = Math.max(220, Math.min(360, Math.floor((typeof window === 'undefined' ? 360 : window.innerWidth) * 0.82)));
  const [n, setN] = useState(3);
  const [spec, setSpec] = useState<ToySpec>(newSpec);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [peek, setPeek] = useState(false);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [msg, setMsg] = useState('Drag each piece back into the toy’s outline.');
  const arena = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; dx: number; dy: number } | null>(null);
  const wonRef = useRef(false);
  const tile = BOARD / n;
  const TRAY = Math.round(tile * 2.1) + 24;

  useEffect(() => {
    const ps: Piece[] = [];
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const hx = Math.random() * (BOARD - tile), hy = BOARD + 14 + Math.random() * (TRAY - tile - 24);
      ps.push({ id: r * n + c, row: r, col: c, x: hx, y: hy, hx, hy, rot: (Math.random() - 0.5) * 16, placed: false });
    }
    setPieces(ps); setWon(false); wonRef.current = false; setMoves(0); setMsg('Drag each piece back into the toy’s outline.');
  }, [n, spec, BOARD, tile, TRAY]);

  const down = (e: RPE, p: Piece) => {
    if (p.placed || won) return;
    const r = arena.current!.getBoundingClientRect();
    drag.current = { id: p.id, dx: e.clientX - r.left - p.x, dy: e.clientY - r.top - p.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    sfx.click();
  };
  const move = (e: RPE) => {
    const d = drag.current; if (!d) return;
    const r = arena.current!.getBoundingClientRect();
    const x = Math.max(-tile / 3, Math.min(BOARD - tile * 0.66, e.clientX - r.left - d.dx));
    const y = Math.max(-tile / 3, Math.min(BOARD + TRAY - tile * 0.66, e.clientY - r.top - d.dy));
    setPieces((ps) => ps.map((p) => (p.id === d.id ? { ...p, x, y } : p)));
  };
  const up = () => {
    const d = drag.current; drag.current = null;
    if (!d) return;
    setMoves((m) => m + 1);
    setPieces((ps) => {
      const p = ps.find((q) => q.id === d.id)!;
      const cx = p.x + tile / 2, cy = p.y + tile / 2;
      const inBoard = cx >= 0 && cx < BOARD && cy >= 0 && cy < BOARD;
      const near = Math.hypot(p.x - p.col * tile, p.y - p.row * tile) < tile * 0.45;
      let next: Piece[];
      if (near) {
        sfx.ok(); setMsg('Click! That piece fits.');
        next = ps.map((q) => (q.id === d.id ? { ...q, x: q.col * tile, y: q.row * tile, placed: true } : q));
      } else if (inBoard) {
        sfx.bad(); setMsg('Hmm, that doesn’t fit there. Try another spot!');
        next = ps.map((q) => (q.id === d.id ? { ...q, x: q.hx, y: q.hy } : q));
      } else {
        next = ps.map((q) => (q.id === d.id ? { ...q, hx: q.x, hy: q.y } : q));
      }
      if (next.every((q) => q.placed) && !wonRef.current) { wonRef.current = true; setTimeout(() => { setWon(true); sfx.ok(); onWin(spec); }, 250); }
      return next;
    });
  };

  const placedCount = pieces.filter((p) => p.placed).length;
  return (
    <div role="dialog" aria-modal="true" aria-label="Puzzle repair bench" className="fixed inset-0 z-50 overflow-auto p-3" style={{ background: 'rgba(20,10,30,.8)' }} onClick={onClose}>
      <div className="paper mx-auto my-2 w-fit max-w-full rounded-3xl p-4" style={{ boxShadow: '0 12px 50px rgba(0,0,0,.6)' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="m-0 text-3xl">🧩 Puzzle Repair Bench</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full bg-white px-3 py-1 text-lg shadow">✕</button>
        </div>
        <p className="my-1 text-lg" role="status">{won ? 'Good as new! The toy is whole again ✨' : msg}</p>
        <div className="mb-2 flex flex-wrap items-center gap-2 text-lg">
          {[2, 3, 4].map((k) => (
            <button key={k} type="button" onClick={() => { sfx.click(); setN(k); }} className="rounded-full px-3 py-1" style={{ background: n === k ? '#f2759f' : '#fff', color: n === k ? '#fff' : 'inherit', border: '2px solid #e7c9b8' }}>
              {k === 2 ? 'Easy' : k === 3 ? 'Normal' : 'Tricky'}
            </button>
          ))}
          <button type="button" onClick={() => setPeek((v) => !v)} className="rounded-full bg-white px-3 py-1" style={{ border: '2px solid #e7c9b8' }}>{peek ? 'Hide picture' : 'Peek at picture'}</button>
          <button type="button" onClick={() => { sfx.click(); setSpec(newSpec()); }} className="rounded-full bg-white px-3 py-1" style={{ border: '2px solid #e7c9b8' }}>New toy</button>
          <span className="ml-auto opacity-80">{placedCount}/{n * n} pieces · {moves} moves</span>
        </div>

        <div ref={arena} onPointerMove={move} onPointerUp={up} onPointerCancel={up} className="relative mx-auto select-none" style={{ width: BOARD, height: BOARD + TRAY, touchAction: 'none' }}>
          <div className="absolute left-0 top-0 overflow-hidden" style={{ width: BOARD, height: BOARD, borderRadius: 16, background: 'rgba(255,255,255,.55)', border: '3px dashed #d99bb5' }}>
            {peek && <Toy {...spec} style={{ width: BOARD, height: BOARD, opacity: 0.25 }} />}
            {Array.from({ length: n * n }, (_, i) => (
              <div key={i} style={{ position: 'absolute', left: (i % n) * tile, top: Math.floor(i / n) * tile, width: tile, height: tile, border: '1px dashed rgba(180,120,150,.45)' }} />
            ))}
          </div>
          <div className="absolute left-0 rounded-2xl" style={{ top: BOARD + 6, width: BOARD, height: TRAY - 6, background: 'rgba(120,80,100,.14)' }} aria-hidden />
          {pieces.map((p) => (
            <div key={p.id} role="img" aria-label={`Puzzle piece ${p.id + 1}${p.placed ? ' (placed)' : ''}`}
              onPointerDown={(e) => down(e, p)}
              style={{ position: 'absolute', left: p.x, top: p.y, width: tile, height: tile, overflow: 'hidden', borderRadius: 8, background: '#fff6e6', cursor: p.placed ? 'default' : 'grab',
                transform: p.placed ? 'none' : `rotate(${p.rot}deg)`, zIndex: drag.current?.id === p.id ? 10 : p.placed ? 1 : 5,
                boxShadow: p.placed ? 'none' : '0 4px 10px rgba(60,30,40,.35)', border: p.placed ? '1px solid rgba(255,255,255,.6)' : '2px solid #e7a8c3', transition: drag.current?.id === p.id ? 'none' : 'left .25s, top .25s', touchAction: 'none' }}>
              <Toy {...spec} style={{ position: 'absolute', left: -p.col * tile, top: -p.row * tile, width: BOARD, height: BOARD, pointerEvents: 'none' }} />
            </div>
          ))}
          {won && (
            <div className="absolute left-0 top-0 grid place-items-center" style={{ width: BOARD, height: BOARD, background: 'rgba(255,250,235,.9)', borderRadius: 16, zIndex: 20 }}>
              <div className="text-center">
                <Toy {...spec} style={{ width: BOARD * 0.7, height: BOARD * 0.7 }} />
                <p className="m-0 text-2xl">Repaired in {moves} moves! ✨</p>
                <button type="button" onClick={() => { sfx.click(); setSpec(newSpec()); }} className="mt-2 rounded-full px-5 py-1 text-xl text-white" style={{ background: '#f2759f', boxShadow: '0 3px 0 #c34c78' }}>Next toy</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
