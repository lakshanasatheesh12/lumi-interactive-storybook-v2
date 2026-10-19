import { useEffect, useRef, useState } from 'react';
import type { Mood } from '../lib/lumi';

/**
 * Lumi as a real-time 3D model (Three.js, loaded lazily). Built from the original sketch:
 * rounded head, circular ears, rectangular forehead panel, eyes, smiling mouth, three chest buttons,
 * "LUMI" nameplate, rounded arms with three fingertips each, feet with three toes each.
 * Head and eyes follow the pointer (touch works too); drag to spin her. Mood changes her face.
 */
export default function Lumi3D({ mood, theme }: { mood: Mood; theme: 'day' | 'night' }) {
  const host = useRef<HTMLDivElement>(null);
  const moodRef = useRef(mood);
  const themeRef = useRef(theme);
  moodRef.current = mood;
  themeRef.current = theme;
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let dead = false;
    let stop = () => {};
    (async () => {
      try {
        const THREE = await import('three');
        if (dead || !host.current) return;
        const el = host.current;
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        el.appendChild(renderer.domElement);
        renderer.domElement.style.touchAction = 'none';
        renderer.domElement.style.cursor = 'grab';

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
        camera.position.set(0, 1.0, 8.6);
        camera.lookAt(0, 0.8, 0);
        scene.add(new THREE.AmbientLight(0xfff1e0, 0.9));
        const sun = new THREE.DirectionalLight(0xffe2b8, 1.6); sun.position.set(3, 5, 6); scene.add(sun);
        const rim = new THREE.PointLight(0x9ad0ff, 0.9, 20); rim.position.set(-4, 2, -3); scene.add(rim);

        const mat = (c: string, rough = 0.6) => new THREE.MeshStandardMaterial({ color: c, roughness: rough, metalness: 0.04 });
        const add = (parent: import('three').Object3D, geo: import('three').BufferGeometry, m: import('three').Material, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) => {
          const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); me.scale.set(sx, sy, sz); parent.add(me); return me;
        };
        const sphere = new THREE.SphereGeometry(1, 36, 28);
        const skin = mat('#f3dfbb', 0.75);
        const joint = mat('#dcc7a0');
        const blue = mat('#7fb4e8', 0.35);
        const pink = mat('#f4a3b5', 0.4);
        const dark = mat('#3a2418', 0.25);
        const white = new THREE.MeshBasicMaterial({ color: 0xffffff });

        const lumi = new THREE.Group(); scene.add(lumi);
        const head = new THREE.Group(); head.position.y = 2.0; lumi.add(head);

        add(head, sphere, skin, 0, 0, 0, 1.15, 1, 1.0);                       // rounded head
        for (const s of [-1, 1]) {                                            // circular ears
          add(head, sphere, skin, s * 0.86, 0.8, -0.05, 0.32, 0.32, 0.32);
          add(head, sphere, blue, s * 0.86, 0.8, 0.24, 0.13, 0.13, 0.07);
        }
        const panel = add(head, new THREE.BoxGeometry(0.95, 0.6, 0.14), blue, 0, 0.68, 0.76); panel.rotation.x = -0.7; // forehead panel
        const eyes = new THREE.Group(); head.add(eyes);
        const eyeL = add(eyes, sphere, dark, -0.4, 0, 0.93, 0.13, 0.15, 0.08);
        const eyeR = add(eyes, sphere, dark, 0.4, 0, 0.93, 0.13, 0.15, 0.08);
        add(eyes, sphere, white, -0.36, 0.05, 1.0, 0.04, 0.04, 0.02); add(eyes, sphere, white, 0.44, 0.05, 1.0, 0.04, 0.04, 0.02);
        for (const s of [-1, 1]) add(head, sphere, mat('#f6a9b8', 0.9), s * 0.66, -0.28, 0.72, 0.16, 0.1, 0.04); // cheeks
        const browL = add(head, new THREE.BoxGeometry(0.34, 0.06, 0.05), dark, -0.4, 0.28, 0.93); browL.scale.setScalar(0);
        const browR = add(head, new THREE.BoxGeometry(0.34, 0.06, 0.05), dark, 0.4, 0.28, 0.93); browR.scale.setScalar(0);
        const mouth = add(head, new THREE.TorusGeometry(0.22, 0.035, 10, 24, Math.PI), dark, 0, -0.38, 0.93); // smiling mouth
        mouth.rotation.z = Math.PI;

        add(lumi, new THREE.CylinderGeometry(0.3, 0.34, 0.35, 20), joint, 0, 1.12, 0);   // neck
        const body = add(lumi, sphere, skin, 0, 0.15, 0, 0.95, 1.05, 0.8);                // body
        for (const [x, y, c] of [[-0.36, 0.7, blue], [0, 0.78, pink], [0.36, 0.7, blue]] as const) {   // three chest buttons
          const b = add(lumi, new THREE.CylinderGeometry(0.1, 0.1, 0.08, 20), c, x, y, 0.66); b.rotation.x = Math.PI / 2;
        }
        const cv = document.createElement('canvas'); cv.width = 256; cv.height = 128;
        const g = cv.getContext('2d')!;
        g.fillStyle = '#7fb4e8'; g.fillRect(0, 0, 256, 128); g.strokeStyle = '#2a4a66'; g.lineWidth = 8; g.strokeRect(6, 6, 244, 116);
        g.fillStyle = '#fff'; g.font = 'bold 72px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('LUMI', 128, 70);
        const tex = new THREE.CanvasTexture(cv);
        add(lumi, new THREE.BoxGeometry(0.8, 0.4, 0.1), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.4 }), 0, 0.05, 0.79); // nameplate

        const arms: import('three').Group[] = [];
        for (const s of [-1, 1]) {                                            // rounded arms + three fingertips each
          const arm = new THREE.Group(); arm.position.set(s * 1.0, 0.55, 0); arm.rotation.z = s * 0.45; lumi.add(arm); arms.push(arm);
          add(arm, new THREE.CapsuleGeometry(0.2, 0.55, 6, 14), skin, 0, -0.35, 0);
          for (const fx of [-0.1, 0, 0.1]) add(arm, sphere, pink, fx, -0.88, 0.04, 0.065, 0.065, 0.065);
          // feet with three toes each
          const foot = new THREE.Group(); foot.position.set(s * 0.5, -1.05, 0.12); lumi.add(foot);
          add(foot, sphere, skin, 0, 0, 0, 0.45, 0.32, 0.5);
          for (const tx of [-0.16, 0, 0.16]) add(foot, sphere, pink, tx, -0.07, 0.46, 0.08, 0.08, 0.08);
        }

        const bodyTarget = new THREE.Color(), cur = skin.color;
        const look = { x: 0, y: 0 };
        const onMove = (e: PointerEvent) => { look.x = (e.clientX / innerWidth) * 2 - 1; look.y = (e.clientY / innerHeight) * 2 - 1; };
        let dragging = false, lastX = 0, idleSince = 0;
        const down = (e: PointerEvent) => { dragging = true; lastX = e.clientX; renderer.domElement.setPointerCapture(e.pointerId); renderer.domElement.style.cursor = 'grabbing'; };
        const drag = (e: PointerEvent) => { if (dragging) { lumi.rotation.y += (e.clientX - lastX) * 0.012; lastX = e.clientX; } };
        const up = () => { dragging = false; idleSince = performance.now(); renderer.domElement.style.cursor = 'grab'; };
        window.addEventListener('pointermove', onMove);
        const cvEl = renderer.domElement;
        cvEl.addEventListener('pointerdown', down); cvEl.addEventListener('pointermove', drag); cvEl.addEventListener('pointerup', up); cvEl.addEventListener('pointercancel', up);

        const resize = () => { const w = el.clientWidth || 300, h = el.clientHeight || 300; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); };
        resize();
        const ro = new ResizeObserver(resize); ro.observe(el);

        let raf = 0;
        const loop = (now: number) => {
          const t = now / 1000, m = moodRef.current;
          lumi.position.y = Math.sin(t * 1.6) * 0.05 * (m === 'angry' ? 0.2 : 1);
          bodyTarget.set(themeRef.current === 'night' ? '#e3cddc' : '#f3dfbb'); cur.lerp(bodyTarget, 0.06);
          if (!dragging && now - idleSince > 1500) { // ease back to facing front
            const a = ((lumi.rotation.y + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
            lumi.rotation.y -= a * 0.03;
          }
          // head + eyes follow the pointer (a sleepy Lumi droops a little)
          const droop = m === 'sleepy' ? 0.22 : 0;
          head.rotation.y += (look.x * 0.55 - head.rotation.y) * 0.1;
          head.rotation.x += (look.y * 0.3 + droop - head.rotation.x) * 0.1;
          eyes.position.x += (look.x * 0.07 - eyes.position.x) * 0.15;
          eyes.position.y += (-look.y * 0.05 - eyes.position.y) * 0.15;
          const ey = m === 'sleepy' ? 0.1 : m === 'angry' ? 0.65 : 1;
          for (const e of [eyeL, eyeR]) e.scale.y += (0.15 * ey - e.scale.y) * 0.2;
          const br = m === 'angry' ? 1 : 0;
          for (const b of [browL, browR]) b.scale.setScalar(b.scale.x + (br - b.scale.x) * 0.2);
          browL.rotation.z = -0.5; browR.rotation.z = 0.5;
          mouth.rotation.z = m === 'angry' ? 0 : Math.PI;
          mouth.position.y = m === 'angry' ? -0.52 : -0.38;
          const ms = m === 'sleepy' ? 0.55 : m === 'angry' ? 0.8 : 1;
          mouth.scale.x += (ms - mouth.scale.x) * 0.15; mouth.scale.y += (ms - mouth.scale.y) * 0.15;
          arms[0].rotation.z = -0.45 - (m === 'angry' ? 0.5 : 0); arms[1].rotation.z = 0.45 + (m === 'angry' ? 0.5 : 0);
          body.scale.y = 1.05 + Math.sin(t * 1.2) * 0.012;
          renderer.render(scene, camera);
          raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);

        stop = () => {
          cancelAnimationFrame(raf); ro.disconnect(); window.removeEventListener('pointermove', onMove);
          cvEl.removeEventListener('pointerdown', down); cvEl.removeEventListener('pointermove', drag); cvEl.removeEventListener('pointerup', up); cvEl.removeEventListener('pointercancel', up);
          scene.traverse((o) => { const me = o as import('three').Mesh; if (me.geometry) me.geometry.dispose(); });
          [skin, joint, blue, pink, dark].forEach((m) => m.dispose()); tex.dispose(); renderer.dispose();
          if (cvEl.parentNode === el) el.removeChild(cvEl);
        };
      } catch {
        if (!dead) setFailed(true); // no WebGL: fall back to the 2D character sheet
      }
    })();
    return () => { dead = true; stop(); };
  }, []);

  if (failed) {
    return <img src="/art/character.webp" alt="Lumi character sheet (3D view isn’t available on this device)" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />;
  }
  return <div ref={host} role="img" aria-label="Interactive 3D model of Lumi. Drag to spin her. Her eyes follow your pointer." style={{ width: '100%', height: '100%' }} />;
}
