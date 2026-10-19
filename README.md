# LUMI — a small robot for a kinder world

Multi-page storybook site: **Home · Backstory · Toys · Workshop · Delivery**.
React + Vite + TypeScript + Tailwind frontend, Node/Express backend, SQLite database.
Your reference screenshots (in `public/art/`) are the backgrounds; every button, toy, game and form is a real element laid over them.

## Tier checklist (portfolio rubric)

| Tier | Item | Status |
|---|---|---|
| 1 | Character reacts to cursor | Done in the 3D Lumi: head and eyes follow the pointer, touch works too. On the painted pages she reacts with the personal-space ring |
| 1 | Scroll-driven story | Done: Backstory page, scroll down (three scenes from your backstory sentence) |
| 1 | Day/night or mood toggle | Done: changes the scene, Lumi's palette and her expression |
| 1 | Responsive layout | **Partial**: pages keep a minimum width and pan sideways on phones instead of reflowing (see Limitations) |
| 1 | Hidden Easter eggs | Done: secret toy chest, falls asleep when idle, "don't press!" button |
| 2 | Mini-game | Done: **Puzzle Repair Bench** (Workshop, bottom-left): drag torn-apart toy pieces back into place; Easy 2x2, Normal 3x3, Tricky 4x4 |
| 2 | Lullaby Lab (audio) | Done: 🎶 button in the nav plays an original music-box lullaby (Web Audio synth, no files); slower and lower at night; the 🔊 mute switch silences it |
| 2 | Flashlight cursor | Done: night mode on Home, "Flashlight" button |
| 3 | 3D model | Done (Three.js, lazy-loaded): Home, "Meet Lumi" |
| 3 | Live guestbook | Done: Express + SQLite |
| 3 | Remembers the visitor | Done: localStorage (name, visit count, days away); "Forget me" button |
| 3 | Chats back in character | Done: rule-based, tired, silly, grumpy, no touching |
| 3 | Lighthouse 90+ | Prepared, **not measured** (see Performance) |

## Performance (for Lighthouse)

Art converted to WebP (about 17 MB down to about 1.6 MB), Three.js loaded only when you open "Meet Lumi", home image preloaded,
`font-display: swap`, audio is synthesised (no audio files), reduced-motion respected. Run Lighthouse on `npm run build && npm start`
(not on the dev server) and tell me the scores to tune.

## Limitations (honest list)

- Nothing has been run in a browser yet (the build sandbox has no network), including the 3D model and the puzzle game.
- On phones the painted pages scroll sideways rather than reflowing into a true mobile layout.
- Overlay positions were placed by eye; use `?debug=1` to calibrate.
- Chat is rule-based (no AI service), so unusual questions get one of Lumi's "wasn't listening" lines.

## Run it in a browser workspace

SQLite uses `better-sqlite3` (a native module), so use a workspace with a real Linux container:
**Replit, GitHub Codespaces, CodeSandbox (Devbox) or Gitpod**. *StackBlitz/WebContainers cannot run it.*

1. Upload/extract this folder (keep `public/art/*.png`).
2. In the workspace shell: `npm install`
3. Dev mode (hot reload): `npm run dev`
   - web: http://localhost:5173 (proxies `/api` to the server)
   - api: http://localhost:3001
4. Or production mode: `npm run build && npm start` → everything on http://localhost:3001

Env (optional, see `.env.example`): `PORT` (3001), `DB_PATH` (`./data/lumi.db`), `CORS_ORIGIN`.
The database file and tables are created automatically on first start.

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | liveness |
| GET / POST | `/api/guestbook` | list latest messages / add one (validated, rate-limited) |
| GET / PUT | `/api/progress/:playerId` | day/night mode, secret chest, counters |
| GET / POST | `/api/toys` , `/api/toys/:playerId` | toys you made or repaired |
| POST | `/api/deliveries` | one row per baby delivered |

All queries are prepared statements; inputs are validated server-side (types, lengths, allowed values).
Progress is keyed by an anonymous player id kept in this browser's localStorage.

## Calibrating the overlays

Overlays are positioned in the **original pixel coordinates of each reference image**
(`Stage` + `R`/`Hot` in `src/components/Stage.tsx`). I placed them by eye from your images and could not
open a browser to check, so some may be a few pixels off. Add **`?debug=1`** to any URL to see every hotspot
outlined in red, then nudge the numbers in the page file:

- Home `src/pages/Home.tsx` (`L` table) · Backstory `Backstory.tsx` (`CLOSED`, `OPEN`, `Paper`)
- Toys `Toys.tsx` (`KIND/EYE/ACC/COL`) · Workshop `Workshop.tsx` (`FIX/PAINT/ACCS`, tray rects)
- Delivery `src/lib/data.ts` (`BABIES[].house/box`) and `Delivery.tsx`

Content you may want to edit: backstory wording and baby wishes live in `src/lib/data.ts`.

## Manual test checklist

- [ ] All five nav links work from every page; the chest is NOT in the nav
- [ ] Home: day↔night toggle; moving the cursor into Lumi's circle shows the personal-space ring and she gets cross; clicking her says don't touch; idle 45 s → she falls asleep and mumbles; "don't press!" → a button pops off with a spring, falls, Lumi fixes it
- [ ] Guestbook: post a message, refresh the page, it is still there; check `data/lumi.db`
- [ ] Backstory: paper sheet wording reads correctly; chest opens and closes; theme persists after refresh; scrolling down advances the three story scenes
- [ ] Home: "Meet Lumi" opens the 3D model (eyes follow the pointer, drag spins her); chat replies in character; reload and reopen: she greets you by name with your visit number; night mode flashlight works
- [ ] Workshop: "Puzzle bench" opens; pieces snap into place; completing a puzzle adds to the "Toys repaired" counter
- [ ] Toys: each choice updates the dome toy live; "Make my toy!" shows the result and saves
- [ ] Workshop: click chest → toy appears; pick tool → tap toy/pink rings; damage, faded colour, accessory, dirt visibly change; progress bar, stars and checklist update; before/after card; counter survives refresh
- [ ] Delivery: tap each of the 7 houses and its gift box; wrong box is refused; "Start delivery!" drives the truck to all 7, statuses go Pending → Loaded → On the way → Delivered
- [ ] 🎶 plays the lullaby (it needs one click first), keeps playing across pages, slows down at night, and 🔊/🔇 mutes it; mute also silences the click sounds; sparkle trail follows the cursor
