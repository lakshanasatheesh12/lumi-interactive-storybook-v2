import { NavLink } from 'react-router-dom';
import { R, useU } from './Stage';
import { useEffect } from 'react';
import { setMuted, sfx, useMuted } from '../lib/sound';
import { music, useMusicOn } from '../lib/music';

const LINKS = [
  { to: '/', label: 'Home' }, { to: '/backstory', label: 'Backstory' }, { to: '/toys', label: 'Toys' },
  { to: '/workshop', label: 'Workshop' }, { to: '/delivery', label: 'Delivery' },
];

interface Props { rect: { x: number; y: number; w: number; h: number }; theme?: 'day' | 'night'; onTheme?: () => void }

/** Real navigation laid over the artwork's painted nav bar. Same on every page. */
export function Nav({ rect, theme, onTheme }: Props) {
  const u = useU();
  const muted = useMuted();
  const playing = useMusicOn();
  useEffect(() => { if (theme) music.setNight(theme === 'night'); }, [theme]);
  const night = theme === 'night';
  const pill = {
    background: night ? 'linear-gradient(180deg,#3a2c5e,#2a2048)' : 'linear-gradient(180deg,#fff2e4,#fbdcc9)',
    border: `${u(2.5)} solid ${night ? '#8a6fd0' : '#f1b7c9'}`, color: night ? '#ffe9f7' : '#4a3328',
    boxShadow: `0 ${u(4)} ${u(10)} rgba(60,30,40,.35)`,
  };
  const round = { width: u(rect.h * 0.62), height: u(rect.h * 0.62), borderRadius: '50%', fontSize: u(rect.h * 0.36), background: night ? '#4b3a7a' : '#fff', border: `${u(2)} solid ${night ? '#8a6fd0' : '#f1b7c9'}` };
  return (
    <R {...rect} z={40}>
      <nav aria-label="Main" className="flex h-full w-full items-center justify-between" style={{ ...pill, borderRadius: u(rect.h), padding: `0 ${u(rect.h * 0.45)}` }}>
        <NavLink to="/" onClick={sfx.click} className="flex items-center" style={{ fontSize: u(rect.h * 0.52), letterSpacing: u(2), fontWeight: 700 }}>
          LUMI<span style={{ color: '#f2c14e', marginLeft: u(6) }}>★</span>
        </NavLink>
        <ul className="m-0 flex list-none items-center p-0" style={{ gap: u(rect.w * 0.022) }}>
          {LINKS.map((l) => (
            <li key={l.to}>
              <NavLink to={l.to} end={l.to === '/'} onClick={sfx.click}
                style={({ isActive }) => ({
                  fontSize: u(rect.h * 0.36), padding: `${u(rect.h * 0.06)} ${u(rect.h * 0.22)}`, borderRadius: u(rect.h),
                  background: isActive ? (night ? '#c45da0' : '#ff9ec3') : 'transparent', color: isActive ? '#fff' : 'inherit',
                  boxShadow: isActive ? `0 ${u(2)} ${u(5)} rgba(180,60,110,.5)` : 'none',
                })}>
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="flex items-center" style={{ gap: u(rect.h * 0.15) }}>
          {onTheme && (
            <button type="button" onClick={() => { sfx.click(); onTheme(); }} aria-label={night ? 'Switch to day mode' : 'Switch to night mode'} title={night ? 'Day mode' : 'Night mode'} style={round}>
              {night ? '☀️' : '🌙'}
            </button>
          )}
          <button type="button" onClick={() => { sfx.click(); music.toggle(); }} aria-pressed={playing} aria-label={playing ? 'Stop the lullaby' : 'Play the lullaby'} title={playing ? 'Stop lullaby' : 'Play lullaby'} style={{ ...round, background: playing ? '#ffd1e3' : round.background }}>
            {playing ? '🎵' : '🎶'}
          </button>
          <button type="button" onClick={() => { setMuted(!muted); }} aria-label={muted ? 'Unmute sounds' : 'Mute sounds'} title={muted ? 'Unmute' : 'Mute'} style={round}>
            {muted ? '🔇' : '🔊'}
          </button>
        </div>
      </nav>
    </R>
  );
}
