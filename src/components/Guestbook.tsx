import { FormEvent, useCallback, useEffect, useState } from 'react';
import { api, Entry } from '../lib/api';
import { sfx } from '../lib/sound';
import { R, useU } from './Stage';

const NOTE = ['#fde3ec', '#fff0b8', '#eadcff', '#dff1ee'];

/** Live guestbook: saved to SQLite through the Express API, refreshed every few seconds. */
export function Guestbook({ x, y, w, h, night }: { x: number; y: number; w: number; h: number; night?: boolean }) {
  const u = useU();
  const [items, setItems] = useState<Entry[]>([]);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try { setItems(await api.guestbook()); setErr(''); } catch { setErr('The guestbook server can’t be reached right now.'); }
    setLoaded(true);
  }, []);
  useEffect(() => { load(); const t = setInterval(load, 6000); return () => clearInterval(t); }, [load]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!msg.trim() || busy) return;
    setBusy(true);
    try {
      const entry = await api.postGuest(name, msg);
      setItems((l) => [entry, ...l.filter((i) => i.id !== entry.id)]);
      setMsg(''); setErr(''); sfx.ok();
    } catch (ex) { setErr((ex as Error).message); sfx.bad(); }
    setBusy(false);
  }

  const wood = night ? 'linear-gradient(160deg,#6a4a64,#47304f)' : 'linear-gradient(160deg,#d79f6a,#b97a4c)';
  return (
    <R x={x} y={y} w={w} h={h} z={20}>
      <section aria-label="Live Guestbook" className="flex h-full w-full flex-col" style={{ background: wood, borderRadius: u(16), padding: u(10), boxShadow: `0 ${u(6)} ${u(14)} rgba(40,20,20,.5), inset 0 0 0 ${u(3)} rgba(255,225,180,.35)` }}>
        <div className="paper flex min-h-0 flex-1 flex-col" style={{ borderRadius: u(10), padding: `${u(8)} ${u(12)}` }}>
          <h2 className="m-0" style={{ fontSize: u(28), lineHeight: 1 }}>Live Guestbook <span style={{ color: '#e8628f' }}>♥</span></h2>
          <p className="m-0" style={{ fontSize: u(15), margin: `${u(2)} 0 ${u(6)}` }}>Leave a message or dream wish for the baby</p>
          <form onSubmit={submit} className="flex flex-col" style={{ gap: u(5) }}>
            <div className="flex" style={{ gap: u(6) }}>
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={24} placeholder="Your name (optional)" aria-label="Your name"
                style={{ width: '38%', fontSize: u(14), padding: `${u(4)} ${u(8)}`, borderRadius: u(14), border: `${u(1.5)} solid #e7c9b8`, background: '#fffaf2', fontFamily: 'inherit' }} />
              <input value={msg} onChange={(e) => setMsg(e.target.value)} maxLength={200} placeholder="Write your message…" aria-label="Your message"
                style={{ flex: 1, minWidth: 0, fontSize: u(14), padding: `${u(4)} ${u(8)}`, borderRadius: u(14), border: `${u(1.5)} solid #e7c9b8`, background: '#fffaf2', fontFamily: 'inherit' }} />
              <button type="submit" disabled={busy || !msg.trim()} style={{ fontSize: u(15), padding: `${u(3)} ${u(14)}`, borderRadius: u(14), background: '#f2759f', color: '#fff', opacity: busy || !msg.trim() ? 0.6 : 1, boxShadow: `0 ${u(2)} 0 #c34c78` }}>Post</button>
            </div>
          </form>
          {err && <p role="alert" style={{ fontSize: u(13), color: '#b3263f', margin: `${u(4)} 0 0` }}>{err}</p>}
          <ul className="m-0 grid min-h-0 flex-1 list-none overflow-y-auto p-0" style={{ gridTemplateColumns: '1fr 1fr', gap: u(8), marginTop: u(8), alignContent: 'start' }}>
            {loaded && items.length === 0 && !err && <li style={{ gridColumn: '1 / -1', fontSize: u(15), opacity: 0.8 }}>No messages yet — be the first to leave a dream wish ✨</li>}
            {items.map((it, i) => (
              <li key={it.id} style={{ background: NOTE[it.id % NOTE.length], padding: u(8), borderRadius: u(4), fontSize: u(14), lineHeight: 1.15, transform: `rotate(${((it.id % 5) - 2) * 0.6}deg)`, boxShadow: `0 ${u(2)} ${u(4)} rgba(80,50,40,.25)`, wordBreak: 'break-word' }}>
                {it.message}
                <div style={{ marginTop: u(3), fontSize: u(12), opacity: 0.8 }}>— {it.name}</div>
                {i === 0 && <span className="sr-only">newest</span>}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </R>
  );
}
