import { createContext, CSSProperties, MouseEventHandler, ReactNode, useCallback, useContext, useRef } from 'react';

interface Dim { w: number; h: number }
const Ctx = createContext<Dim>({ w: 1000, h: 1000 });
export const useStage = () => useContext(Ctx);
export const useU = () => { const { w } = useStage(); return (n: number) => `${(n / w) * 100}cqw`; };

interface StageProps {
  art: string; w: number; h: number; crop?: 'top' | 'bottom'; children: ReactNode;
  onPointer?: (p: { x: number; y: number } | null) => void;
}

/** Art-backed stage. Everything inside is positioned in the ORIGINAL art pixel coordinates. */
export function Stage({ art, w, h, crop, children, onPointer }: StageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const debug = typeof location !== 'undefined' && new URLSearchParams(location.search).has('debug');
  const move = useCallback((e: { clientX: number; clientY: number }) => {
    const r = ref.current?.getBoundingClientRect();
    if (r && onPointer) onPointer({ x: ((e.clientX - r.left) / r.width) * w, y: ((e.clientY - r.top) / r.height) * h });
  }, [onPointer, w, h]);
  const bg: CSSProperties = {
    backgroundImage: `url(${art})`,
    backgroundSize: crop ? '100% 200%' : '100% 100%',
    backgroundPosition: crop === 'bottom' ? '0 100%' : '0 0',
  };
  return (
    <div className={`stage-wrap relative flex min-h-screen w-full items-center justify-center ${debug ? 'debug' : ''}`} style={{ background: '#2a1a3a' }}>
      <div className="fixed inset-0" aria-hidden style={{ backgroundImage: `url(${art})`, backgroundSize: 'cover', filter: 'blur(26px) brightness(.85)', transform: 'scale(1.15)' }} />
      <div
        ref={ref}
        onPointerMove={onPointer ? move : undefined}
        onPointerLeave={onPointer ? () => onPointer(null) : undefined}
        className="relative select-none"
        style={{ width: `max(min(100vw, calc(100vh * ${w / h})), 880px)`, aspectRatio: `${w} / ${h}`, containerType: 'inline-size', ...bg }}
      >
        <Ctx.Provider value={{ w, h }}>{children}</Ctx.Provider>
      </div>
    </div>
  );
}

interface RProps {
  x: number; y: number; w: number; h: number; children?: ReactNode; className?: string; style?: CSSProperties;
  onClick?: MouseEventHandler; z?: number;
}
export function R({ x, y, w, h, children, className = '', style, onClick, z }: RProps) {
  const s = useStage();
  return (
    <div className={`absolute ${className}`} onClick={onClick}
      style={{ left: `${(x / s.w) * 100}%`, top: `${(y / s.h) * 100}%`, width: `${(w / s.w) * 100}%`, height: `${(h / s.h) * 100}%`, zIndex: z, ...style }}>
      {children}
    </div>
  );
}

interface HotProps extends Omit<RProps, 'onClick'> { label: string; onClick: () => void; cls?: string }
/** Transparent real <button> placed over a piece of artwork. */
export function Hot({ x, y, w, h, label, onClick, cls = '', children, style, z }: HotProps) {
  const s = useStage();
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className={`hs absolute ${cls}`}
      style={{ left: `${(x / s.w) * 100}%`, top: `${(y / s.h) * 100}%`, width: `${(w / s.w) * 100}%`, height: `${(h / s.h) * 100}%`, zIndex: z, ...style }}>
      {children}
    </button>
  );
}

export function Bubble({ x, y, w, text, tail = 'bottom', z = 30 }: { x: number; y: number; w: number; text: string; tail?: 'bottom' | 'left'; z?: number }) {
  const u = useU();
  if (!text) return null;
  return (
    <R x={x} y={y} w={w} h={10} z={z} style={{ height: 'auto', pointerEvents: 'none' }}>
      <div className="paper a-pop relative" style={{ borderRadius: u(14), padding: `${u(7)} ${u(12)}`, fontSize: u(17), lineHeight: 1.15, boxShadow: `0 ${u(3)} ${u(8)} rgba(60,30,40,.35)` }}>
        {text}
        <span style={{ position: 'absolute', width: u(12), height: u(12), background: '#fbebd6', transform: 'rotate(45deg)', borderRight: '.15cqw solid #e9cdb0', borderBottom: '.15cqw solid #e9cdb0',
          ...(tail === 'bottom' ? { left: u(24), bottom: u(-6) } : { left: u(-6), top: u(14), transform: 'rotate(135deg)' }) }} />
      </div>
    </R>
  );
}
