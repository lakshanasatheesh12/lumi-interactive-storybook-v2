import { FormEvent, lazy, Suspense, useEffect, useRef, useState } from 'react';
import { loadVisitor, Mood, parseName, reply, setVisitorName, Visitor } from '../lib/lumi';
import { sfx } from '../lib/sound';

const Lumi3D = lazy(() => import('./Lumi3D'));
interface Msg { from: 'lumi' | 'you'; text: string }

/** Modal with the 3D Lumi and a chat. Lumi answers in character (tired, silly, grumpy, no touching). */
export function LumiCorner({ onClose, theme, greeting }: { onClose: () => void; theme: 'day' | 'night'; greeting: string }) {
  const resting: Mood = theme === 'night' ? 'sleepy' : 'happy';
  const [mood, setMood] = useState<Mood>(resting);
  const [visitor, setVisitor] = useState<Visitor | null>(loadVisitor());
  const [msgs, setMsgs] = useState<Msg[]>([{ from: 'lumi', text: greeting }]);
  const [text, setText] = useState('');
  const [sheet, setSheet] = useState(false);
  const [typing, setTyping] = useState(false);
  const awaitingName = useRef(!!visitor && !visitor.name);
  const end = useRef<HTMLDivElement>(null);
  const moodTimer = useRef<number>();

  useEffect(() => { const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onClose]);
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }); }, [msgs, typing]);
  useEffect(() => { setMood(resting); }, [resting]);

  const lumiSays = (t: string, m: Mood) => {
    setTyping(true);
    window.setTimeout(() => {
      setTyping(false); setMsgs((l) => [...l, { from: 'lumi', text: t }]); setMood(m); sfx.pop();
      window.clearTimeout(moodTimer.current); moodTimer.current = window.setTimeout(() => setMood(resting), 5000);
    }, 650);
  };

  function send(e: FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    setText(''); setMsgs((l) => [...l, { from: 'you', text: t }]); sfx.click();
    if (awaitingName.current) {
      const explicit = /(my name is|i am|i['’]m|call me)/i.test(t);
      const greet = /^(hi|hello|hey|yo)\b/i.test(t);
      const name = parseName(t);
      if (name && (explicit || (!greet && t.split(/\s+/).length <= 2))) {
        awaitingName.current = false;
        setVisitor(setVisitorName(name));
        return lumiSays(`${name}. Okay. *yawn* I’ll remember that. Nice to meet you, ${name}! Please stay outside my circle.`, 'happy');
      }
    }
    const r = reply(t, visitor);
    lumiSays(r.text, r.mood);
  }

  function forget() {
    try { localStorage.removeItem('lumi-visitor'); } catch { /* ignore */ }
    setVisitor(null); awaitingName.current = false;
    lumiSays('Forget you? …Okay. Who are you again? Just kidding. Mostly.', 'sleepy');
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="Meet Lumi" className="fixed inset-0 z-50 flex items-center justify-center p-3" style={{ background: 'rgba(20,10,30,.78)' }} onClick={onClose}>
      <div className="paper relative flex max-h-[96vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl md:flex-row" style={{ boxShadow: '0 12px 50px rgba(0,0,0,.6)' }} onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-3 top-3 z-10 rounded-full bg-white px-3 py-1 text-lg shadow">✕</button>

        <div className="relative flex-1" style={{ minHeight: 300, background: theme === 'night' ? 'radial-gradient(circle at 50% 40%,#4b3a7a,#1f1538)' : 'radial-gradient(circle at 50% 40%,#ffe9c9,#f7c9b0)' }}>
          {sheet ? (
            <img src="/art/character.webp" alt="Lumi’s character sheet with turnaround, expressions, colour palette and personality" className="h-full w-full object-contain" />
          ) : (
            <Suspense fallback={<p className="p-6 text-center text-xl">Waking Lumi up…</p>}><Lumi3D mood={mood} theme={theme} /></Suspense>
          )}
          <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-sm" style={{ color: theme === 'night' ? '#ffe9f7' : '#4a3328' }}>
            <span>{sheet ? 'Character sheet' : 'Drag to spin Lumi. Her eyes follow you!'}</span>
            <button type="button" onClick={() => { sfx.click(); setSheet((s) => !s); }} className="rounded-full bg-white/80 px-3 py-1 shadow">{sheet ? 'Show 3D Lumi' : 'Character sheet'}</button>
          </div>
        </div>

        <section aria-label="Chat with Lumi" className="flex flex-1 flex-col p-4" style={{ minHeight: 320 }}>
          <h2 className="m-0 text-2xl">Chat with Lumi <span style={{ color: '#e8628f' }}>♥</span></h2>
          <p className="m-0 mb-2 text-sm opacity-75">
            {visitor ? `${visitor.name ? visitor.name + ', v' : 'V'}isit number ${visitor.visits}. ` : ''}She’s tired, silly, and easily annoyed. No touching!
          </p>
          <div className="flex-1 overflow-y-auto rounded-2xl bg-white/50 p-3" style={{ maxHeight: '42vh', minHeight: 170 }} aria-live="polite">
            {msgs.map((m, i) => (
              <p key={i} className="my-1.5 max-w-[88%] rounded-2xl px-3 py-1.5 text-lg leading-tight" style={m.from === 'lumi'
                ? { background: '#fff0b8', marginRight: 'auto' } : { background: '#fbd3e2', marginLeft: 'auto', textAlign: 'right' }}>{m.text}</p>
            ))}
            {typing && <p className="my-1.5 text-lg opacity-70">Lumi is yawning… 💤</p>}
            <div ref={end} />
          </div>
          <form onSubmit={send} className="mt-2 flex gap-2">
            <input value={text} onChange={(e) => setText(e.target.value)} maxLength={140} aria-label="Message to Lumi" placeholder="Say something to Lumi…"
              className="min-w-0 flex-1 rounded-full border-2 px-4 py-2 text-lg" style={{ borderColor: '#e7c9b8', background: '#fffaf2', fontFamily: 'inherit' }} />
            <button type="submit" disabled={!text.trim()} className="rounded-full px-5 py-2 text-lg text-white" style={{ background: '#f2759f', boxShadow: '0 3px 0 #c34c78', opacity: text.trim() ? 1 : 0.6 }}>Send</button>
          </form>
          {visitor && <button type="button" onClick={forget} className="mt-2 self-start text-sm underline opacity-70">Forget me</button>}
        </section>
      </div>
    </div>
  );
}
