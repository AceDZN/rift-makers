// Heat is the player's only power. Hot plumes (rising mantle) and cold drips
// (sinking mantle) set up convection currents (זרמי ערבול). The surface flow
// drags each rigid plate; where two plates meet, their relative motion decides
// the boundary: apart (מתרחקים), together (מתנגשים) or past each other (מחליקים).

import { type Vec2, add, dot, len, scale, sdPolygon, sub, v, norm } from './geo.ts';
import { type Boundary, type BoundaryType, type Crust, type RiftProfile, boundaryFrame } from './terrain.ts';

export type HeatKind = 'plume' | 'drip';

export interface Heat {
  id: string;
  kind: HeatKind;
  x: number;
  z: number;
  /** Authored by the level (already burning); the player can't move it. */
  fixed?: boolean;
  /** Deep time when it started burning (chained runs). */
  bornMyr?: number;
}

export interface Plate {
  id: string;
  he: string;
  poly: Vec2[];
  crust: Crust;
}

export interface Seam {
  id: string;
  p0: Vec2;
  p1: Vec2;
  /** The two plates that meet here. */
  plates: [string, string];
  rift?: RiftProfile;
  /** The seam ends inside the slab (only this segment deforms). */
  segment?: boolean;
}

/** Surface flow speed profile: zero right above the source, strongest one cell away. */
export function flowProfile(r: number, cellKm: number): number {
  const k = r / cellKm;
  return k * Math.exp(1 - k);
}

/** Surface flow at p (cm/yr, before plate averaging). Plumes push away, drips pull in. */
export function flowAt(p: Vec2, heats: Heat[], cellKm: number, strength: number): Vec2 {
  let f = v(0, 0);
  for (const h of heats) {
    const d = sub(p, v(h.x, h.z));
    const r = len(d);
    if (r < 1e-6) continue;
    const mag = flowProfile(r, cellKm) * strength * (h.kind === 'plume' ? 1 : -1);
    f = add(f, scale(d, mag / r));
  }
  return f;
}

/** Sample points inside a plate (for rigid averaging). */
export function plateSamples(plate: Plate, widthKm: number, depthKm: number, n = 14): Vec2[] {
  const pts: Vec2[] = [];
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const p = v(((i + 0.5) / n) * widthKm, ((j + 0.5) / n) * depthKm);
      if (sdPolygon(p, plate.poly) < 0) pts.push(p);
    }
  }
  if (!pts.length) {
    const c = plate.poly.reduce((a, b) => add(a, b), v(0, 0));
    pts.push(scale(c, 1 / plate.poly.length));
  }
  return pts;
}

export function plateCentroid(plate: Plate, widthKm: number, depthKm: number): Vec2 {
  const s = plateSamples(plate, widthKm, depthKm);
  return scale(s.reduce((a, b) => add(a, b), v(0, 0)), 1 / s.length);
}

/** A rigid plate moves with the average surface flow beneath it (cm/yr vector). */
export function plateVelocity(plate: Plate, heats: Heat[], cellKm: number, strength: number, widthKm: number, depthKm: number): Vec2 {
  const pts = plateSamples(plate, widthKm, depthKm);
  let s = v(0, 0);
  for (const p of pts) s = add(s, flowAt(p, heats, cellKm, strength));
  return scale(s, 1 / pts.length);
}

export interface SeamMotion {
  seam: string;
  /** null = locked: too little motion to form anything. */
  type: BoundaryType | null;
  /** Relative speed along the dominant direction, cm/yr. */
  rateCmYr: number;
  /** Slide sense for terrain: +1 means the +n side moves along +t. */
  sense: 1 | -1;
  /** Opening (+) or closing (−) speed, cm/yr. */
  normal: number;
  /** Sliding speed, cm/yr. */
  tangential: number;
}

/** Minimum relative speed (cm/yr) for a boundary to become active. */
export const LOCK_CM_YR = 0.6;

/**
 * What emerges at a seam is decided by the mantle right under it: compare the
 * surface flow just on either side, averaged along the seam. `base` adds an
 * authored drift that is already going on (e.g. the Red Sea pushing Arabia).
 */
export function seamMotion(
  seam: Seam,
  heats: Heat[],
  cellKm: number,
  strength: number,
  base?: { normal: number; tangential: number },
): SeamMotion {
  const { t, n } = boundaryFrame(seam);
  const off = cellKm * 0.25;
  const K = 21;
  let normal = 0;
  let tangential = 0;
  for (let i = 0; i < K; i++) {
    const p = add(seam.p0, scale(sub(seam.p1, seam.p0), (i + 0.5) / K));
    const rel = sub(flowAt(add(p, scale(n, off)), heats, cellKm, strength), flowAt(add(p, scale(n, -off)), heats, cellKm, strength));
    normal += dot(rel, n);
    tangential += dot(rel, t);
  }
  // relative speed between the two sides; ×2 because each side moves half of it
  normal = (normal / K) * 2 + (base?.normal ?? 0);
  tangential = (tangential / K) * 2 + (base?.tangential ?? 0);
  const an = Math.abs(normal);
  const at = Math.abs(tangential);
  let type: BoundaryType | null;
  let rate: number;
  if (Math.max(an, at) < LOCK_CM_YR) {
    type = null;
    rate = 0;
  } else if (at > an * 1.3) {
    type = 'slide';
    rate = at;
  } else {
    type = normal > 0 ? 'pull' : 'push';
    rate = an;
  }
  return { seam: seam.id, type, rateCmYr: Math.round(rate * 10) / 10, sense: tangential >= 0 ? 1 : -1, normal, tangential };
}

export interface FlowSetup {
  plates: Plate[];
  seams: Seam[];
  heats: Heat[];
  cellKm: number;
  strength: number;
  widthKm: number;
  depthKm: number;
  base?: Record<string, { normal: number; tangential: number }>;
}

export interface FlowResult {
  velocities: Record<string, Vec2>;
  motions: SeamMotion[];
}

export function solveFlow(s: FlowSetup): FlowResult {
  const velocities: Record<string, Vec2> = {};
  for (const p of s.plates) velocities[p.id] = plateVelocity(p, s.heats, s.cellKm, s.strength, s.widthKm, s.depthKm);
  const motions = s.seams.map((sm) => seamMotion(sm, s.heats, s.cellKm, s.strength, s.base?.[sm.id]));
  return { velocities, motions };
}

/** Turn a seam plus its emergent motion into a terrain boundary. */
export function seamBoundary(seam: Seam, m: SeamMotion, startMyr = 0): Boundary | null {
  if (!m.type) return null;
  return { id: seam.id, p0: seam.p0, p1: seam.p1, type: m.type, rateCmYr: m.rateCmYr, sense: m.sense, rift: seam.rift, startMyr, segment: seam.segment };
}

/** The plate containing p (or null). */
export function plateAt(plates: Plate[], p: Vec2): Plate | null {
  for (const pl of plates) if (sdPolygon(p, pl.poly) <= 0) return pl;
  return null;
}

/** Arrow for HUD/scene: unit direction and speed of a plate. */
export function plateArrow(vel: Vec2): { dir: Vec2; speed: number } {
  return { dir: norm(vel), speed: Math.round(len(vel) * 10) / 10 };
}

// Convenience builders for levels.
export const rectPoly = (x1: number, z1: number, x2: number, z2: number): Vec2[] => [v(x1, z1), v(x2, z1), v(x2, z2), v(x1, z2)];
