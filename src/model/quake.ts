// Earthquakes: magnitude (Richter, energy released) versus the shaking and
// damage a town feels (Mercalli: depends on distance and on construction).
// All numbers are a simplified teaching model.

import { type Vec2, dist } from './geo.ts';

/** Each Richter unit is 10× the ground shaking (wave amplitude). */
export function shakingRatio(deltaM: number): number {
  return Math.pow(10, deltaM);
}

/** …and about 32× the energy, so 2 units ≈ 1,000×. */
export function energyRatio(deltaM: number): number {
  return Math.pow(10, 1.5 * deltaM);
}

export interface Quake {
  id: string;
  magnitude: number;
  /** Epicentre (מוקד-העל) on the surface, km. */
  x: number;
  z: number;
  /** Depth of the focus (מוקד), km. */
  depthKm: number;
}

/**
 * Relative ground shaking felt at a place: 1.0 = a magnitude-6 quake right
 * under you. Falls with distance from the focus.
 */
export function shakingAt(q: Quake, p: Vec2): number {
  const r = Math.hypot(dist(p, { x: q.x, z: q.z }), q.depthKm);
  return Math.pow(10, q.magnitude - 6) * Math.pow(20 / (r + 20), 2.5);
}

/** How much more a תקן 413 building withstands than an ordinary old one. */
export const RETROFIT_FACTOR = 25;

export interface House {
  id: string;
  town: string;
  x: number;
  z: number;
  /** Shaking an ordinary version of this building survives. */
  strength: number;
  /** Built (or retrofitted) to תקן 413. */
  code413: boolean;
  /** Already built to code at level start (can't be bought again). */
  preset413?: boolean;
}

export function houseSurvives(h: House, shaking: number): boolean {
  return shaking <= h.strength * (h.code413 ? RETROFIT_FACTOR : 1);
}

export interface TownReport {
  town: string;
  total: number;
  standing: number;
  maxShaking: number;
  mercalli: number;
}

/** A Mercalli-like 1–12 damage reading: from shaking and from what actually fell. */
export function mercalliFrom(shaking: number, collapsedFraction: number): number {
  const base = 3 + 2.2 * Math.log10(Math.max(shaking, 0.01) * 10);
  const dmg = collapsedFraction * 4;
  return Math.max(1, Math.min(12, Math.round(base * 0.6 + dmg + 2)));
}

export function runQuakes(quakes: Quake[], houses: House[]): { collapsed: Set<string>; towns: TownReport[] } {
  const collapsed = new Set<string>();
  const maxS = new Map<string, number>();
  for (const h of houses) {
    let worst = 0;
    for (const q of quakes) worst = Math.max(worst, shakingAt(q, h));
    maxS.set(h.id, worst);
    if (!houseSurvives(h, worst)) collapsed.add(h.id);
  }
  const towns = new Map<string, TownReport>();
  for (const h of houses) {
    const t = towns.get(h.town) ?? { town: h.town, total: 0, standing: 0, maxShaking: 0, mercalli: 1 };
    t.total++;
    if (!collapsed.has(h.id)) t.standing++;
    t.maxShaking = Math.max(t.maxShaking, maxS.get(h.id) ?? 0);
    towns.set(h.town, t);
  }
  for (const t of towns.values()) t.mercalli = mercalliFrom(t.maxShaking, 1 - t.standing / t.total);
  return { collapsed, towns: [...towns.values()] };
}

// ---- tsunami ----

export interface TsunamiTiming {
  /** Minutes from the undersea quake until the wave reaches the shore. */
  arrivalMin: number;
  /** Run-up height on land, m. Ground lower than this floods. */
  runupM: number;
  /** People start walking this many minutes after the shaking. */
  sirenDelayMin: number;
  /** Walking speed, km per minute (5 km/h ≈ 0.083). */
  walkKmPerMin: number;
  /** Path winding factor over straight-line distance. */
  pathFactor: number;
}

export interface EvacResult {
  warningMin: number;
  walkMin: number;
  highEnough: boolean;
  safe: boolean;
}

export function evacuate(tm: TsunamiTiming, from: Vec2, to: Vec2, toElevM: number): EvacResult {
  const warningMin = tm.arrivalMin - tm.sirenDelayMin;
  const walkMin = (dist(from, to) * tm.pathFactor) / tm.walkKmPerMin;
  const highEnough = toElevM > tm.runupM;
  return { warningMin, walkMin, highEnough, safe: highEnough && walkMin <= warningMin };
}
