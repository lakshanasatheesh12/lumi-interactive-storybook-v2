import { CSSProperties } from 'react';
import { Acc, COLORS, Col, DamageType, DAMAGE_META, Eyes, Kind } from '../lib/data';

export interface DamageState { type: DamageType; fixed: boolean }
interface Props {
  kind: Kind; eyes: Eyes; color: Col; acc: Acc;
  faded?: number; dirty?: boolean; damages?: DamageState[]; ghostAcc?: Acc;
  onMarker?: (t: DamageType) => void; onBody?: () => void; style?: CSSProperties; className?: string;
}

function mix(a: string, b: string, t: number) {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const A = p(a), B = p(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

const LINE = '#7a5a48';
const EYEPOS: Record<Kind, [[number, number], [number, number]]> = {
  teddy: [[80, 84], [120, 84]], cloud: [[80, 106], [120, 106]], duck: [[86, 76], [114, 76]],
};
const DPOS: Record<Kind, Record<DamageType, [number, number]>> = {
  teddy: { thread: [100, 152], bandage: [74, 62], cotton: [128, 168], patch: [46, 138] },
  cloud: { thread: [100, 138], bandage: [72, 84], cotton: [138, 120], patch: [54, 116] },
  duck: { thread: [100, 150], bandage: [72, 70], cotton: [132, 165], patch: [54, 150] },
};
const ANCH: Record<Kind, Record<Exclude<Acc, 'none'>, [number, number]>> = {
  teddy: { bow: [100, 138], scarf: [100, 138], star: [142, 46], heart: [100, 168] },
  cloud: { bow: [138, 66], scarf: [100, 152], star: [100, 38], heart: [100, 150] },
  duck: { bow: [100, 118], scarf: [100, 120], star: [136, 48], heart: [100, 158] },
};

function Accessory({ a, kind, ghost }: { a: Exclude<Acc, 'none'>; kind: Kind; ghost?: boolean }) {
  const [x, y] = ANCH[kind][a];
  const fill = (c: string) => (ghost ? 'rgba(255,255,255,.25)' : c);
  const st = ghost ? { stroke: '#ff5d8f', strokeDasharray: '4 3', strokeWidth: 2.5 } : { stroke: LINE, strokeWidth: 2 };
  return (
    <g transform={`translate(${x} ${y})`} className={ghost ? 'a-pulse' : undefined} {...st} strokeLinejoin="round">
      {a === 'bow' && (<><path d="M0 0 L-24 -13 L-24 13 Z" fill={fill('#b794f4')} /><path d="M0 0 L24 -13 L24 13 Z" fill={fill('#b794f4')} /><circle r="6" fill={fill('#8a63c4')} /></>)}
      {a === 'scarf' && (<><path d="M-36 -6 Q0 12 36 -6 L36 7 Q0 25 -36 7 Z" fill={fill('#8ec9f0')} /><path d="M12 10 l9 24 l11 -5 l-5 -22 Z" fill={fill('#6fb3e0')} /></>)}
      {a === 'star' && <polygon points="0,-17 5,-5 17,-5 7,3 11,16 0,8 -11,16 -7,3 -17,-5 -5,-5" fill={fill('#ffd95e')} />}
      {a === 'heart' && <path d="M0 13 C-26 -4 -15 -23 0 -8 C15 -23 26 -4 0 13 Z" fill={fill('#ff8fb4')} />}
    </g>
  );
}

function Body({ kind, base, light, dark }: { kind: Kind; base: string; light: string; dark: string }) {
  if (kind === 'teddy')
    return (
      <g stroke={LINE} strokeWidth="2.5" strokeLinejoin="round">
        <circle cx="52" cy="50" r="22" fill={base} /><circle cx="52" cy="50" r="11" fill={light} />
        <circle cx="148" cy="50" r="22" fill={base} /><circle cx="148" cy="50" r="11" fill={light} />
        <ellipse cx="100" cy="152" rx="46" ry="40" fill={base} />
        <ellipse cx="100" cy="160" rx="26" ry="24" fill={light} stroke="none" />
        <ellipse cx="48" cy="140" rx="14" ry="24" fill={base} transform="rotate(25 48 140)" />
        <ellipse cx="152" cy="140" rx="14" ry="24" fill={base} transform="rotate(-25 152 140)" />
        <ellipse cx="66" cy="184" rx="20" ry="13" fill={base} /><ellipse cx="134" cy="184" rx="20" ry="13" fill={base} />
        <circle cx="100" cy="88" r="52" fill={base} />
        <ellipse cx="100" cy="108" rx="22" ry="17" fill={light} />
        <ellipse cx="100" cy="100" rx="7" ry="5" fill="#5a3d2e" />
        <path d="M100 105 Q94 116 87 112 M100 105 Q106 116 113 112" fill="none" strokeWidth="2" />
      </g>
    );
  if (kind === 'cloud') {
    const shapes = (stroke: boolean) => (
      <g stroke={stroke ? LINE : 'none'} strokeWidth={stroke ? 7 : 0} fill={base}>
        <circle cx="58" cy="112" r="38" /><circle cx="142" cy="112" r="38" /><circle cx="100" cy="80" r="44" />
        <circle cx="100" cy="122" r="46" /><ellipse cx="100" cy="142" rx="68" ry="32" />
      </g>
    );
    return (<g strokeLinejoin="round">{shapes(true)}{shapes(false)}<ellipse cx="100" cy="132" rx="38" ry="20" fill={light} opacity=".55" />
      <path d="M92 128 Q100 136 108 128" fill="none" stroke={LINE} strokeWidth="2.5" strokeLinecap="round" /></g>);
  }
  return (
    <g stroke={LINE} strokeWidth="2.5" strokeLinejoin="round">
      <ellipse cx="78" cy="193" rx="16" ry="6" fill="#f6a65b" /><ellipse cx="122" cy="193" rx="16" ry="6" fill="#f6a65b" />
      <path d="M150 140 L186 124 L170 156 Z" fill={base} />
      <ellipse cx="100" cy="150" rx="56" ry="42" fill={base} />
      <ellipse cx="100" cy="160" rx="32" ry="24" fill={light} stroke="none" />
      <ellipse cx="62" cy="150" rx="18" ry="26" fill={dark} transform="rotate(-12 62 150)" />
      <circle cx="100" cy="80" r="42" fill={base} />
      <path d="M92 40 Q100 24 108 40" fill="none" />
      <ellipse cx="100" cy="98" rx="21" ry="11" fill="#ffb35a" />
      <path d="M86 98 Q100 104 114 98" fill="none" strokeWidth="1.8" />
    </g>
  );
}

function EyeSet({ kind, eyes, hurt }: { kind: Kind; eyes: Eyes; hurt: boolean }) {
  const [[lx, ly], [rx, ry]] = EYEPOS[kind];
  const sky = (x: number, y: number, r = 7) => (
    <g><circle cx={x} cy={y} r={r} fill="#5ec3f5" stroke="#2a4a66" strokeWidth="1.6" />
      <circle cx={x - r * 0.3} cy={y - r * 0.35} r={r * 0.32} fill="#fff" /><circle cx={x + r * 0.35} cy={y + r * 0.3} r={r * 0.14} fill="#fff" opacity=".8" /></g>
  );
  const arc = (x: number, y: number, up: boolean) => (
    <path d={up ? `M${x - 7} ${y + 3} Q${x} ${y - 7} ${x + 7} ${y + 3}` : `M${x - 7} ${y - 2} Q${x} ${y + 8} ${x + 7} ${y - 2}`} fill="none" stroke="#3b2a22" strokeWidth="3" strokeLinecap="round" />
  );
  const left = hurt ? (
    <path d={`M${lx - 6} ${ly - 6} L${lx + 6} ${ly + 6} M${lx + 6} ${ly - 6} L${lx - 6} ${ly + 6}`} stroke="#3b2a22" strokeWidth="3" strokeLinecap="round" />
  ) : eyes === 'round' ? sky(lx, ly) : eyes === 'happy' ? arc(lx, ly, true) : eyes === 'sleepy' ? arc(lx, ly, false) : sky(lx, ly, 5.5);
  const right = eyes === 'round' ? sky(rx, ry) : eyes === 'happy' ? arc(rx, ry, true) : eyes === 'sleepy' ? arc(rx, ry, false)
    : <path d={`M${rx - 5} ${ry - 7} L${rx + 6} ${ry} L${rx - 5} ${ry + 7}`} fill="none" stroke="#3b2a22" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />;
  return (
    <g>
      <circle cx={lx - 9} cy={ly + 14} r="6" fill="#ff9fba" opacity=".55" /><circle cx={rx + 9} cy={ry + 14} r="6" fill="#ff9fba" opacity=".55" />
      {left}{right}
    </g>
  );
}

function Damage({ type, fixed, pos }: { type: DamageType; fixed: boolean; pos: [number, number] }) {
  const [x, y] = pos;
  return (
    <g transform={`translate(${x} ${y})`}>
      {type === 'thread' && (fixed
        ? <path d="M-18 0 H18" stroke="#8a63c4" strokeWidth="3" strokeDasharray="5 4" strokeLinecap="round" />
        : <g><path d="M-18 0 l6 -7 l6 7 l6 -7 l6 7 l6 -7 l6 7" fill="none" stroke="#4b3326" strokeWidth="3" strokeLinejoin="round" />
            <circle cx="-4" cy="-10" r="6" fill="#fff" /><circle cx="6" cy="-12" r="5" fill="#fff" /></g>)}
      {type === 'bandage' && (fixed
        ? <g transform="rotate(-30)"><rect x="-17" y="-7" width="34" height="14" rx="6" fill="#f4c9a0" stroke={LINE} strokeWidth="1.8" /><rect x="-6" y="-7" width="12" height="14" fill="#f0b88a" /></g>
        : <g stroke="#4b3326" strokeWidth="3" strokeLinecap="round"><path d="M-12 -10 L12 10 M12 -10 L-12 10" /></g>)}
      {type === 'cotton' && (fixed
        ? <g fill="#fff" stroke="#e1d6e8" strokeWidth="1.5"><circle cx="-6" cy="2" r="9" /><circle cx="6" cy="-3" r="10" /><circle cx="8" cy="7" r="7" /></g>
        : <g><ellipse rx="14" ry="10" fill="#4b3326" /><circle cx="-4" cy="-8" r="6" fill="#fff" /><circle cx="6" cy="-9" r="5" fill="#fff" /></g>)}
      {type === 'patch' && (fixed
        ? <g><rect x="-14" y="-14" width="28" height="28" rx="4" fill="#b4c6ef" stroke="#7d93c9" strokeWidth="1.8" /><rect x="-10" y="-10" width="20" height="20" rx="2" fill="none" stroke="#fff" strokeDasharray="3 3" strokeWidth="1.5" /></g>
        : <polygon points="-14,-4 -6,-14 4,-8 14,-12 12,2 16,12 2,14 -8,10 -14,12" fill="#4b3326" />)}
    </g>
  );
}

export function Toy({ kind, eyes, color, acc, faded = 0, dirty, damages = [], ghostAcc, onMarker, onBody, style, className }: Props) {
  const c = COLORS[color];
  const f = faded * 0.6;
  const base = mix(c.base, '#e4dfdb', f), light = mix(c.light, '#f2eeea', f), dark = mix(c.dark, '#b9b2ad', f);
  const hurt = damages.some((d) => !d.fixed);
  return (
    <svg viewBox="0 0 200 200" className={className} style={{ overflow: 'visible', ...style }} onClick={onBody} role="img" aria-label={`${color} ${kind}`}>
      <ellipse cx="100" cy="195" rx="62" ry="7" fill="rgba(80,50,30,.2)" />
      <Body kind={kind} base={base} light={light} dark={dark} />
      <EyeSet kind={kind} eyes={eyes} hurt={hurt} />
      {dirty && (<g fill="#7a5a3a" opacity=".38"><circle cx="70" cy="120" r="9" /><circle cx="128" cy="140" r="7" /><circle cx="92" cy="170" r="8" /><circle cx="116" cy="70" r="5" /></g>)}
      {damages.map((d) => <Damage key={d.type} type={d.type} fixed={d.fixed} pos={DPOS[kind][d.type]} />)}
      {acc !== 'none' && <Accessory a={acc} kind={kind} />}
      {ghostAcc && ghostAcc !== 'none' && <Accessory a={ghostAcc} kind={kind} ghost />}
      {onMarker && damages.filter((d) => !d.fixed).map((d) => {
        const [x, y] = DPOS[kind][d.type];
        return (
          <g key={'m' + d.type} style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); onMarker(d.type); }}>
            <circle cx={x} cy={y} r="19" fill="rgba(255,255,255,.02)" stroke="#ff5d8f" strokeWidth="3" strokeDasharray="5 4" className="a-pulse" />
            <text x={x} y={y - 24} textAnchor="middle" fontSize="16">{DAMAGE_META[d.type].icon}</text>
          </g>
        );
      })}
    </svg>
  );
}
