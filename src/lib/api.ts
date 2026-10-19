import type { BabyId, ToySpec } from './data';

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

async function req<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(BASE + url, { headers: { 'Content-Type': 'application/json' }, ...init });
  if (!r.ok) {
    let m = 'Request failed';
    try { m = ((await r.json()) as { error?: string }).error ?? m; } catch { /* ignore */ }
    throw new Error(m);
  }
  return (await r.json()) as T;
}

export function playerId(): string {
  let id = '';
  try { id = localStorage.getItem('lumi-player') ?? ''; } catch { /* storage blocked */ }
  if (!id) {
    id = (globalThis.crypto?.randomUUID?.() ?? `p-${Date.now()}-${Math.random().toString(16).slice(2)}-xxxxxxxx`).slice(0, 64);
    try { localStorage.setItem('lumi-player', id); } catch { /* ignore */ }
  }
  return id;
}

export interface Entry { id: number; name: string; message: string; createdAt: string }
export interface Progress {
  theme: 'day' | 'night'; toysMade: number; toysRepaired: number; totalDeliveries: number;
  chestOpened: boolean; delivered: BabyId[];
}

export const api = {
  guestbook: () => req<Entry[]>('/api/guestbook?limit=60'),
  postGuest: (name: string, message: string) =>
    req<Entry>('/api/guestbook', { method: 'POST', body: JSON.stringify({ name, message }) }),
  getProgress: () => req<Progress>(`/api/progress/${playerId()}`),
  putProgress: (p: Partial<Progress>) =>
    req<Progress>(`/api/progress/${playerId()}`, { method: 'PUT', body: JSON.stringify(p) }),
  saveToy: (source: 'made' | 'repaired', t: ToySpec) =>
    req<{ id: number }>('/api/toys', {
      method: 'POST',
      body: JSON.stringify({ playerId: playerId(), source, kind: t.kind, eyes: t.eyes, accessory: t.acc, color: t.color }),
    }),
  deliver: (baby: BabyId) =>
    req<{ total: number }>('/api/deliveries', { method: 'POST', body: JSON.stringify({ playerId: playerId(), baby }) }),
};
