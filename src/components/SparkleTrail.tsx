import { useEffect, useRef } from 'react';

/** Sparkle/bubble cursor trail (canvas, pointer-events: none). */
export function SparkleTrail() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current!;
    const ctx = cv.getContext('2d')!;
    const parts: { x: number; y: number; vx: number; vy: number; r: number; life: number; hue: number; star: boolean }[] = [];
    const size = () => { cv.width = innerWidth; cv.height = innerHeight; };
    size();
    let last = 0;
    const move = (e: PointerEvent) => {
      const t = performance.now();
      if (t - last < 30) return;
      last = t;
      parts.push({ x: e.clientX, y: e.clientY, vx: (Math.random() - 0.5) * 0.8, vy: -0.3 - Math.random() * 0.7, r: 3 + Math.random() * 5, life: 1, hue: 190 + Math.random() * 150, star: Math.random() < 0.35 });
    };
    let raf = 0;
    const tick = () => {
      ctx.clearRect(0, 0, cv.width, cv.height);
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.x += p.vx; p.y += p.vy; p.life -= 0.02;
        if (p.life <= 0) { parts.splice(i, 1); continue; }
        ctx.globalAlpha = p.life;
        if (p.star) {
          ctx.fillStyle = `hsl(${p.hue},90%,80%)`;
          ctx.beginPath();
          for (let k = 0; k < 8; k++) { const a = (k * Math.PI) / 4, rr = k % 2 ? p.r * 0.4 : p.r; ctx.lineTo(p.x + Math.cos(a) * rr, p.y + Math.sin(a) * rr); }
          ctx.fill();
        } else {
          ctx.strokeStyle = `hsl(${p.hue},90%,85%)`; ctx.fillStyle = `hsla(${p.hue},90%,90%,.25)`; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        }
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    addEventListener('pointermove', move); addEventListener('resize', size);
    return () => { cancelAnimationFrame(raf); removeEventListener('pointermove', move); removeEventListener('resize', size); };
  }, []);
  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0" style={{ zIndex: 100 }} />;
}
