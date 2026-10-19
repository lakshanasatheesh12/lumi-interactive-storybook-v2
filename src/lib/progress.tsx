import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { api, Progress } from './api';

const DEFAULT: Progress = { theme: 'day', toysMade: 0, toysRepaired: 0, totalDeliveries: 0, chestOpened: false, delivered: [] };
interface Ctx { progress: Progress; online: boolean; update: (p: Partial<Progress>) => void }
const C = createContext<Ctx>({ progress: DEFAULT, online: true, update: () => {} });
export const useProgress = () => useContext(C);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>(DEFAULT);
  const [online, setOnline] = useState(true);
  const ref = useRef(progress);
  ref.current = progress;

  useEffect(() => {
    api.getProgress().then((p) => { setProgress(p); setOnline(true); }).catch(() => setOnline(false));
  }, []);

  const update = useCallback((patch: Partial<Progress>) => {
    setProgress((p) => ({ ...p, ...patch }));
    api.putProgress(patch).then(() => setOnline(true)).catch(() => setOnline(false));
  }, []);

  return <C.Provider value={{ progress, online, update }}>{children}</C.Provider>;
}
