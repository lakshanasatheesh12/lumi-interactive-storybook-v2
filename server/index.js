import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import db from './db.js';

const PORT = Number(process.env.PORT) || 3001;
const KINDS = ['teddy', 'cloud', 'duck'];
const EYES = ['round', 'happy', 'sleepy', 'wink'];
const ACCS = ['bow', 'scarf', 'star', 'heart', 'none'];
const COLORS = ['brown', 'yellow', 'pink', 'purple'];
const BABIES = ['sleepy', 'curious', 'playful', 'dancing', 'quiet', 'giggly', 'dreamy'];
const ID_RE = /^[A-Za-z0-9-]{16,64}$/;

const q = {
  listGuest: db.prepare('SELECT id, name, message, created_at AS createdAt FROM guestbook ORDER BY id DESC LIMIT ?'),
  addGuest: db.prepare('INSERT INTO guestbook (name, message) VALUES (?, ?)'),
  getGuest: db.prepare('SELECT id, name, message, created_at AS createdAt FROM guestbook WHERE id = ?'),
  getPlayer: db.prepare('SELECT progress FROM players WHERE id = ?'),
  upsertPlayer: db.prepare(`INSERT INTO players (id, progress) VALUES (?, ?)
    ON CONFLICT(id) DO UPDATE SET progress = excluded.progress, updated_at = datetime('now')`),
  addToy: db.prepare('INSERT INTO toys (player_id, source, kind, eyes, accessory, color) VALUES (?,?,?,?,?,?)'),
  listToys: db.prepare('SELECT id, source, kind, eyes, accessory, color, created_at AS createdAt FROM toys WHERE player_id = ? ORDER BY id DESC LIMIT 50'),
  addDelivery: db.prepare('INSERT INTO deliveries (player_id, baby) VALUES (?, ?)'),
  countDeliveries: db.prepare('SELECT COUNT(*) AS n FROM deliveries WHERE player_id = ?'),
  countToys: db.prepare('SELECT source, COUNT(*) AS n FROM toys WHERE player_id = ? GROUP BY source'),
};

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(express.json({ limit: '10kb' }));
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  next();
});

// tiny in-memory rate limiter for guestbook posts
const hits = new Map();
function rateLimit(max, windowMs) {
  return (req, _res, next) => {
    const key = req.ip + req.path;
    const now = Date.now();
    const list = (hits.get(key) || []).filter((t) => now - t < windowMs);
    if (list.length >= max) return next(new HttpError(429, 'Too many messages. Take a breath and try again soon.'));
    list.push(now);
    hits.set(key, list);
    next();
  };
}

const cleanText = (v, max) =>
  String(v ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

const needPlayer = (id) => {
  if (!ID_RE.test(id || '')) throw new HttpError(400, 'Invalid player id.');
  return id;
};

function sanitizeProgress(input, current = {}) {
  const out = { ...current };
  if (input && typeof input === 'object') {
    if (input.theme === 'day' || input.theme === 'night') out.theme = input.theme;
    for (const k of ['toysMade', 'toysRepaired', 'totalDeliveries']) {
      if (Number.isInteger(input[k]) && input[k] >= 0 && input[k] <= 1_000_000) out[k] = input[k];
    }
    if (typeof input.chestOpened === 'boolean') out.chestOpened = input.chestOpened;
    if (Array.isArray(input.delivered)) {
      out.delivered = [...new Set(input.delivered.filter((b) => BABIES.includes(b)))];
    }
  }
  return out;
}

app.get('/api/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// ---- Guestbook ----
app.get('/api/guestbook', (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
  res.json(q.listGuest.all(limit));
});

app.post('/api/guestbook', rateLimit(6, 60_000), (req, res) => {
  const message = cleanText(req.body?.message, 200);
  const name = cleanText(req.body?.name, 24) || 'a friend';
  if (message.length < 1) throw new HttpError(400, 'Please write a message first.');
  const info = q.addGuest.run(name, message);
  res.status(201).json(q.getGuest.get(info.lastInsertRowid));
});

// ---- Progress ----
app.get('/api/progress/:id', (req, res) => {
  const id = needPlayer(req.params.id);
  const row = q.getPlayer.get(id);
  const progress = row ? JSON.parse(row.progress) : {};
  const counts = Object.fromEntries(q.countToys.all(id).map((r) => [r.source, r.n]));
  res.json({
    theme: 'day', toysMade: counts.made || 0, toysRepaired: counts.repaired || 0,
    totalDeliveries: q.countDeliveries.get(id).n, chestOpened: false, delivered: [],
    ...progress,
  });
});

app.put('/api/progress/:id', (req, res) => {
  const id = needPlayer(req.params.id);
  const row = q.getPlayer.get(id);
  const merged = sanitizeProgress(req.body, row ? JSON.parse(row.progress) : {});
  q.upsertPlayer.run(id, JSON.stringify(merged));
  res.json(merged);
});

// ---- Toys ----
app.get('/api/toys/:id', (req, res) => res.json(q.listToys.all(needPlayer(req.params.id))));

app.post('/api/toys', (req, res) => {
  const b = req.body || {};
  const id = needPlayer(b.playerId);
  if (!['made', 'repaired'].includes(b.source)) throw new HttpError(400, 'Invalid toy source.');
  if (!KINDS.includes(b.kind)) throw new HttpError(400, 'Invalid toy.');
  if (!EYES.includes(b.eyes)) throw new HttpError(400, 'Invalid eyes.');
  if (!ACCS.includes(b.accessory)) throw new HttpError(400, 'Invalid accessory.');
  if (!COLORS.includes(b.color)) throw new HttpError(400, 'Invalid colour.');
  const info = q.addToy.run(id, b.source, b.kind, b.eyes, b.accessory, b.color);
  res.status(201).json({ id: info.lastInsertRowid });
});

// ---- Deliveries ----
app.post('/api/deliveries', (req, res) => {
  const id = needPlayer(req.body?.playerId);
  if (!BABIES.includes(req.body?.baby)) throw new HttpError(400, 'Unknown baby.');
  q.addDelivery.run(id, req.body.baby);
  res.status(201).json({ ok: true, total: q.countDeliveries.get(id).n });
});

app.use('/api', (_req, _res, next) => next(new HttpError(404, 'Not found.')));

// ---- Static client (production) ----
const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err.status || (err.type === 'entity.parse.failed' ? 400 : 500);
  if (status === 500) console.error(err);
  res.status(status).json({ error: status === 500 ? 'Something went wrong on the server.' : err.message });
});

app.listen(PORT, () => console.log(`LUMI server listening on http://localhost:${PORT}`));
