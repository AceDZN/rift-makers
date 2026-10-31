// Local progress: stars per level and anonymous learning events (first try
// unaided vs hinted). Nothing leaves the browser.

const KEY = 'rift-makers:v1';

export interface LearnEvent {
  level: number;
  unaided: boolean;
  hinted: boolean;
  mistakes: number;
  stars: number;
  at: number;
}

export interface Progress {
  stars: Record<number, number>;
  learn: LearnEvent[];
  /** Mistakes and hints of a level not yet won, kept across leaving and reloading. */
  pending: Record<number, { mistakes: number; hints: number }>;
  settings: { muted: boolean; reducedMotion: boolean | null };
}

const empty = (): Progress => ({ stars: {}, learn: [], pending: {}, settings: { muted: false, reducedMotion: null } });

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const p = JSON.parse(raw) as Partial<Progress>;
    return { ...empty(), ...p, settings: { ...empty().settings, ...(p.settings ?? {}) } };
  } catch {
    return empty();
  }
}

export function saveProgress(p: Progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // private mode or blocked storage: progress lasts for this visit only
  }
}

/** Level n is open when level n−1 has a star (level 1 always); commissions (id > 100) open after the final. */
export function isUnlocked(p: Progress, id: number): boolean {
  if ((p.stars[id] ?? 0) > 0) return true;
  if (id > 100) return (p.stars[18] ?? 0) > 0;
  return id === 1 || (p.stars[id - 1] ?? 0) > 0;
}

export function recordResult(p: Progress, e: LearnEvent) {
  p.stars[e.level] = Math.max(p.stars[e.level] ?? 0, e.stars);
  delete p.pending[e.level];
  // first attempt only: was it unaided?
  if (!p.learn.some((x) => x.level === e.level)) p.learn.push(e);
  saveProgress(p);
}

/** Remember an unfinished level's mistakes and hints. */
export function recordPending(p: Progress, level: number, mistakes: number, hints: number) {
  if (!mistakes && !hints) return;
  p.pending[level] = { mistakes, hints };
  saveProgress(p);
}
