// The heightfield is generated from plate state, never edited directly.
// base terrain (authored per level) → each boundary deforms the previous
// sampler (pull / push / slide) → volcano cones, deposits and lava → water.

import {
  type Vec2,
  add,
  clamp,
  distToPolyline,
  distToSeg,
  dot,
  fbm,
  lerp,
  norm,
  scale,
  sdPolygon,
  smoothstep,
  sub,
  v,
  dist,
} from './geo.ts';

export type Crust = 'continental' | 'oceanic';
export type BoundaryType = 'push' | 'pull' | 'slide';

export const MAT = {
  seafloor: 0,
  basalt: 1, // young sea floor, lava, volcanic cones
  sand: 2, // kurkar / coastal sand
  grass: 3,
  rock: 4, // folded / uplifted rock
  limestone: 5,
  fertile: 6, // volcanic soil
  fault: 7,
  desert: 8,
  road: 9,
  river: 10,
  dunes: 11,
  canyon: 12,
  chalk: 13,
} as const;
export type Mat = (typeof MAT)[keyof typeof MAT];

export const SNOWLINE_M = 3500;

/** One authored base shape. Geometry in km. */
export interface Shape {
  id?: string;
  geom:
    | { kind: 'rect'; x1: number; z1: number; x2: number; z2: number; soft?: number }
    | { kind: 'poly'; pts: Vec2[]; soft?: number }
    | { kind: 'circle'; x: number; z: number; r: number; soft?: number }
    | { kind: 'line'; pts: Vec2[]; w: number; soft?: number };
  /** Blend elevation toward this value (m). */
  set?: number;
  /** Add this many metres at full weight (a bump). */
  add?: number;
  /** Bump profile for `add`: 'flat' plateau or 'cone' peaked. */
  profile?: 'flat' | 'cone' | 'ridge';
  mat?: Mat;
  crust?: Crust;
  /** External process: the shape's `add` decays with deep time (erosion). */
  erodeTauMyr?: number;
  /** Only paint material, no crust or relief change. */
  paintOnly?: boolean;
  /** Carve this many metres (rivers, canyons). */
  carve?: number;
  roughness?: number;
}

export interface BaseSpec {
  widthKm: number;
  depthKm: number;
  elev: number;
  crust: Crust;
  mat: Mat;
  shapes: Shape[];
  roughness?: number;
  seed?: number;
}

export interface Boundary {
  id: string;
  p0: Vec2;
  p1: Vec2;
  type: BoundaryType;
  /** Relative plate speed, cm per year. */
  rateCmYr: number;
  /** Deep time when this boundary started moving (Myr). */
  startMyr?: number;
  /** Dead Sea rift mode: plates slide past each other and the block between them sinks. */
  rift?: RiftProfile;
  /** Slide sense: +1 = side B moves along +tangent. */
  sense?: 1 | -1;
  /** Only the segment p0→p1 deforms (seams that end inside the slab). */
  segment?: boolean;
  /** Distance of the volcanic arc from the trench (set by where the cold drip sinks). */
  arcKm?: number;
}

/** Depth targets (m, negative = below sea level) of the sinking block along the boundary. */
export interface RiftProfile {
  widthKm: number;
  /** [fraction along boundary 0..1, floor elevation m at full sinking] */
  floor: [number, number][];
  fullAtKm: number;
}

export interface Sample {
  elev: number;
  mat: Mat;
  crust: Crust;
  /** Sea-floor age in Myr, or −1 for not new sea floor. */
  age: number;
}

export type Sampler = (p: Vec2) => Sample;

/** Kilometres moved = rate (cm/yr) × time (Myr) × 10. 1 cm/yr for 1 Myr is 10 km. */
export function displacementKm(rateCmYr: number, myr: number): number {
  return rateCmYr * myr * 10;
}

/** Time (Myr) to move `km` at `rateCmYr`. */
export function timeForKm(km: number, rateCmYr: number): number {
  return km / (rateCmYr * 10);
}

export function boundaryFrame(b: Pick<Boundary, 'p0' | 'p1'>) {
  const t = norm(sub(b.p1, b.p0));
  const n = { x: -t.z, z: t.x };
  const length = dist(b.p0, b.p1);
  return { t, n, length };
}

export function boundaryDisp(b: Boundary, tMyr: number): number {
  return displacementKm(b.rateCmYr, Math.max(0, tMyr - (b.startMyr ?? 0)));
}

function shapeWeight(s: Shape, p: Vec2): number {
  const g = s.geom;
  const soft = g.soft ?? 20;
  let d: number;
  switch (g.kind) {
    case 'rect':
      d = Math.max(Math.min(g.x1, g.x2) - p.x, p.x - Math.max(g.x1, g.x2), Math.min(g.z1, g.z2) - p.z, p.z - Math.max(g.z1, g.z2));
      break;
    case 'poly':
      d = sdPolygon(p, g.pts);
      break;
    case 'circle':
      d = dist(p, v(g.x, g.z)) - g.r;
      break;
    case 'line':
      d = distToPolyline(p, g.pts) - g.w / 2;
      break;
  }
  return 1 - smoothstep(-soft / 2, soft / 2, d);
}

function shapeProfile(s: Shape, p: Vec2, w: number): number {
  const g = s.geom;
  if (s.profile === 'cone' && g.kind === 'circle') {
    const r = dist(p, v(g.x, g.z)) / g.r;
    return Math.pow(clamp(1 - r, 0, 1), 1.4);
  }
  if (s.profile === 'ridge' && g.kind === 'line') {
    const r = distToPolyline(p, g.pts) / (g.w / 2);
    return Math.pow(clamp(1 - r, 0, 1), 1.2);
  }
  return w;
}

/** The authored landscape before any plate moves. */
export function baseSampler(spec: BaseSpec, tMyr = 0): Sampler {
  const seed = spec.seed ?? 7;
  const rough = spec.roughness ?? 120;
  return (p) => {
    let elev = spec.elev;
    let mat: Mat = spec.mat;
    let crust: Crust = spec.crust;
    for (const s of spec.shapes) {
      const w = shapeWeight(s, p);
      if (w <= 0) continue;
      if (!s.paintOnly) {
        if (s.set !== undefined) elev = lerp(elev, s.set, w);
        if (s.add) {
          const decay = s.erodeTauMyr ? Math.exp(-tMyr / s.erodeTauMyr) : 1;
          elev += s.add * decay * shapeProfile(s, p, w);
        }
        if (s.carve) elev -= s.carve * w;
        if (s.crust && w > 0.5) crust = s.crust;
      }
      if (s.mat !== undefined && w > 0.5) mat = s.mat;
    }
    const r = fbm(p.x / 90, p.z / 90, seed) * rough * (elev > 0 ? 1 : 0.6);
    return { elev: elev + r, mat, crust, age: -1 };
  };
}

const FLOOD_KM = 40; // a continental rift floods once it is about this wide
const ridgeDepth = (ageMyr: number) => -2500 - 350 * Math.sqrt(Math.max(0, ageMyr));
export const foldHeight = (km: number) => 7600 * (1 - Math.exp(-km / 520));

/** Local plate types on both sides of a boundary near point p. */
export function sidesAt(b: Boundary, prev: Sampler, p: Vec2) {
  const { t, n } = boundaryFrame(b);
  const u = dot(sub(p, b.p0), t);
  const on = add(b.p0, scale(t, u));
  const a = prev(add(on, scale(n, -70)));
  const bb = prev(add(on, scale(n, 70)));
  return { a: a.crust, b: bb.crust, aElev: a.elev, bElev: bb.elev, u };
}

/** Which side dives at a convergent boundary: 'a' (d<0), 'b', or null for collision. */
export function divingSide(a: Crust, b: Crust, aElev: number, bElev: number): 'a' | 'b' | null {
  if (a === 'continental' && b === 'continental') return null;
  if (a === 'oceanic' && b === 'continental') return 'a';
  if (b === 'oceanic' && a === 'continental') return 'b';
  return aElev <= bElev ? 'a' : 'b';
}

function riftFloor(r: RiftProfile, frac: number): number {
  const f = r.floor;
  if (frac <= f[0][0]) return f[0][1];
  for (let i = 0; i < f.length - 1; i++) {
    if (frac <= f[i + 1][0]) return lerp(f[i][1], f[i + 1][1], (frac - f[i][0]) / (f[i + 1][0] - f[i][0]));
  }
  return f[f.length - 1][1];
}

/** How much of the diving plate's motion shows at distance ad from the trench. */
const diveFeed = (ad: number) => 1 - smoothstep(160, 360, ad);

/** One boundary deforming the previous sampler. */
export function applyBoundary(b: Boundary, s: number, prev: Sampler): Sampler {
  if (s <= 0) return prev;
  const inner = applyLine(b, s, prev);
  if (!b.segment) return inner;
  const { t, length } = boundaryFrame(b);
  const taper = 60;
  return (p) => {
    const u = dot(sub(p, b.p0), t);
    const w = Math.min(smoothstep(-taper, 0, u), 1 - smoothstep(length, length + taper, u));
    if (w <= 0) return prev(p);
    const r = inner(p);
    if (w >= 1) return r;
    const q = prev(p);
    return { ...(w > 0.5 ? r : q), elev: lerp(q.elev, r.elev, w) };
  };
}

function applyLine(b: Boundary, s: number, prev: Sampler): Sampler {
  const { t, n, length } = boundaryFrame(b);
  const half = s / 2;
  return (p) => {
    const rel = sub(p, b.p0);
    const d = dot(rel, n);
    const u = dot(rel, t);
    const sign = d >= 0 ? 1 : -1;
    const ad = Math.abs(d);

    if (b.rift && b.type !== 'push') {
      // Syrian-African rift: sides slide (and open a little); the block between sinks.
      const slip = b.type === 'slide' ? half : half * 0.3;
      const q = b.type === 'slide' ? add(p, scale(t, -sign * slip * (b.sense ?? 1))) : add(p, scale(n, -sign * Math.min(half, 6)));
      const r = prev(q);
      const frac = clamp(u / length, 0, 1);
      const floor = riftFloor(b.rift, frac);
      const k = smoothstep(0, b.rift.fullAtKm, s);
      const w = 1 - smoothstep(b.rift.widthKm * 0.35, b.rift.widthKm * 0.65, ad);
      if (w > 0) {
        r.elev = lerp(r.elev, lerp(r.elev, floor, k), w);
        if (w > 0.6 && r.elev < 100) r.mat = MAT.desert;
      }
      if (ad < 3 && r.elev > -50) r.mat = MAT.fault;
      return r;
    }

    if (b.type === 'pull') {
      if (ad <= half) {
        const age = ad / (b.rateCmYr * 5); // half-spreading rate in km/Myr
        const edge = prev(add(p, scale(n, -d + sign)));
        const k = smoothstep(12, FLOOD_KM + 5, s);
        const startFloor = Math.min(edge.elev, 400) - 250;
        const elev = lerp(startFloor, ridgeDepth(age), k) + (ad < 1.5 && k < 1 ? 120 : 0);
        return { elev, mat: MAT.basalt, crust: 'oceanic', age };
      }
      const r = prev(add(p, scale(n, -sign * half)));
      if (r.crust === 'continental' && r.elev > 0) {
        // rift shoulders slope down to the new shore but stay dry land
        const dd = ad - half;
        const sag = 600 * smoothstep(0, FLOOD_KM, s) * Math.exp(-((dd / 30) ** 2));
        r.elev = Math.max(r.elev - sag, Math.min(r.elev, 15 + dd * 4));
      }
      return r;
    }

    if (b.type === 'slide') {
      const r = prev(add(p, scale(t, -sign * half * (b.sense ?? 1))));
      if (ad < 3 && r.elev > -200) r.mat = MAT.fault;
      return r;
    }

    // push
    const sides = sidesAt(b, prev, p);
    const dive = divingSide(sides.a, sides.b, sides.aElev, sides.bElev);
    if (dive === null) {
      // continent meets continent: both sides crumple into fold mountains, no volcano.
      const r = prev(add(p, scale(n, sign * half)));
      const w = 55 + 0.1 * s;
      const h = foldHeight(s) * Math.exp(-((d / w) ** 2)) * (0.85 + 0.15 * Math.cos(u / 37));
      r.elev = Math.max(r.elev, 0) + h;
      if (h > 400) r.mat = MAT.rock;
      return r;
    }
    const diveSign = dive === 'a' ? -1 : 1;
    if (sign === diveSign) {
      // the diving plate moves into the trench; far out, the ocean floor is
      // fed by spreading elsewhere, so only the band near the trench shifts
      const r = prev(add(p, scale(n, sign * s * diveFeed(ad))));
      const k = smoothstep(0, 60, s) * Math.exp(-(((ad - 22) / 20) ** 2));
      r.elev = lerp(r.elev, -7800, k);
      return r;
    }
    const r = prev(p);
    const uplift = 900 * smoothstep(0, 200, s) * Math.exp(-(((ad - 70) / 55) ** 2));
    r.elev += uplift;
    if (ad < 10 && r.elev < 0) r.elev = lerp(r.elev, -3000, 0.5);
    return r;
  };
}

/** Where a material point that started at p0 is now (villagers ride their plates). */
export function movePoint(p0: Vec2, boundaries: Boundary[], tMyr: number, base: Sampler): Vec2 {
  let p = p0;
  let prev = base;
  for (const b of boundaries) {
    const s = boundaryDisp(b, tMyr);
    if (s > 0) {
      const { t, n } = boundaryFrame(b);
      const d = dot(sub(p, b.p0), n);
      const sign = d >= 0 ? 1 : -1;
      const half = s / 2;
      if (b.rift && b.type !== 'push') {
        if (b.type === 'slide') p = add(p, scale(t, sign * half * (b.sense ?? 1)));
        else p = add(p, scale(n, sign * Math.min(half, 6)));
      } else if (b.type === 'pull') p = add(p, scale(n, sign * half));
      else if (b.type === 'slide') p = add(p, scale(t, sign * half * (b.sense ?? 1)));
      else {
        const sides = sidesAt(b, prev, p);
        const dive = divingSide(sides.a, sides.b, sides.aElev, sides.bElev);
        if (dive === null) {
          const nd = Math.max(Math.abs(d) - half, 8) * sign;
          p = add(p, scale(n, nd - d));
        } else if ((dive === 'a' ? -1 : 1) === sign) {
          p = add(p, scale(n, -sign * s * diveFeed(Math.abs(d))));
        }
      }
    }
    prev = applyBoundary(b, s, prev);
  }
  return p;
}

export interface Volcano {
  id: string;
  x: number;
  z: number;
  /** Cone height, m. */
  h: number;
  r: number;
  active: boolean;
  source: 'arc' | 'hotspot' | 'lava' | 'authored';
}

export interface ExtraVolcano {
  id: string;
  x: number;
  z: number;
  h: number;
  r: number;
  active?: boolean;
  source?: Volcano['source'];
  /** Appears at this deep time (Myr). */
  fromMyr?: number;
}

/** Arc volcanoes appear on the overriding plate once the slab has sunk deep enough to melt. */
export function arcVolcanoes(b: Boundary, tMyr: number, base: Sampler, spacingKm = 110, arcDefault = 95): Volcano[] {
  const arcKm = b.arcKm ?? arcDefault;
  if (b.type !== 'push') return [];
  const s = boundaryDisp(b, tMyr);
  if (s < 60) return [];
  const { t, n, length } = boundaryFrame(b);
  const out: Volcano[] = [];
  const grow = smoothstep(60, 220, s);
  let i = 0;
  for (let u = spacingKm * 0.5; u < length; u += spacingKm, i++) {
    const on = add(b.p0, scale(t, u));
    const a = base(add(on, scale(n, -70)));
    const c = base(add(on, scale(n, 70)));
    const dive = divingSide(a.crust, c.crust, a.elev, c.elev);
    if (!dive) continue;
    const over = dive === 'a' ? 1 : -1;
    const p = add(on, scale(n, over * arcKm));
    out.push({ id: `${b.id}-v${i}`, x: p.x, z: p.z, h: 2600 * grow * (0.8 + 0.2 * Math.sin(i * 2.1)), r: 32, active: true, source: 'arc' });
  }
  return out;
}

export interface Deposit {
  id: string;
  kind: 'kurkar' | 'limestone' | 'basalt' | 'uplift' | 'sediment';
  geom: Shape['geom'];
  /** metres added (uplift) or blended to (others: thickness). */
  amount: number;
  /** 0..1 how far along it is. */
  progress: number;
}

export interface Terrain {
  nx: number;
  nz: number;
  widthKm: number;
  depthKm: number;
  elev: Float32Array;
  mat: Uint8Array;
  crust: Uint8Array; // 0 continental, 1 oceanic
  age: Float32Array; // −1 none
  /** Water surface elevation (m) or NaN. */
  water: Float32Array;
  /** 1 = connected sea, 2 = lake. */
  waterKind: Uint8Array;
  volcanoes: Volcano[];
}

export interface TerrainInput {
  base: BaseSpec;
  boundaries: Boundary[];
  tMyr: number;
  extraVolcanoes?: ExtraVolcano[];
  deposits?: Deposit[];
  seaLevel?: number;
  nx?: number;
  nz?: number;
  arcSpacingKm?: number;
  arcKm?: number;
}

export function finalSampler(input: TerrainInput): { sample: Sampler; volcanoes: Volcano[] } {
  const base = baseSampler(input.base, input.tMyr);
  let s: Sampler = base;
  const volcanoes: Volcano[] = [];
  for (const b of input.boundaries) {
    const disp = boundaryDisp(b, input.tMyr);
    volcanoes.push(...arcVolcanoes(b, input.tMyr, s, input.arcSpacingKm, input.arcKm));
    s = applyBoundary(b, disp, s);
  }
  for (const e of input.extraVolcanoes ?? []) {
    if (e.fromMyr !== undefined && input.tMyr < e.fromMyr) continue;
    const grow = e.fromMyr !== undefined ? smoothstep(e.fromMyr, e.fromMyr + 1.5, input.tMyr) : 1;
    volcanoes.push({ id: e.id, x: e.x, z: e.z, h: e.h * grow, r: e.r, active: e.active ?? true, source: e.source ?? 'authored' });
  }
  const deposits = input.deposits ?? [];
  const prev = s;
  const sample: Sampler = (p) => {
    const r = prev(p);
    for (const dep of deposits) {
      const w = shapeWeight({ geom: dep.geom }, p) * dep.progress;
      if (w <= 0) continue;
      if (dep.kind === 'uplift') {
        r.elev += dep.amount * w;
        if (w > 0.5 && r.elev > 0 && r.mat !== MAT.limestone) r.mat = MAT.rock;
      } else if (dep.kind === 'kurkar') {
        r.elev = lerp(r.elev, Math.max(r.elev, dep.amount), w);
        if (w > 0.5) r.mat = MAT.sand;
      } else if (dep.kind === 'limestone' || dep.kind === 'sediment') {
        r.elev += dep.amount * w * 0.15;
        if (w > 0.5) r.mat = dep.kind === 'limestone' ? MAT.limestone : MAT.seafloor;
      } else if (dep.kind === 'basalt') {
        r.elev += dep.amount * w;
        if (w > 0.5) {
          r.mat = MAT.basalt;
          r.crust = 'continental';
        }
      }
    }
    for (const vc of volcanoes) {
      if (vc.h <= 1) continue;
      const dd = Math.hypot(p.x - vc.x, p.z - vc.z);
      if (dd < vc.r) {
        const k = 1 - dd / vc.r;
        const crater = dd < vc.r * 0.12 ? (vc.r * 0.12 - dd) / (vc.r * 0.12) * vc.h * 0.12 : 0;
        r.elev = Math.max(r.elev, (r.elev > 0 ? r.elev : -200) + vc.h * Math.pow(k, 1.6) - crater);
        r.mat = MAT.basalt;
      } else if (dd < vc.r * 2.2 && r.elev > 0 && r.mat !== MAT.fault) {
        r.mat = MAT.fertile;
      }
    }
    return r;
  };
  return { sample, volcanoes };
}

/** Build the heightfield grid. */
export function buildTerrain(input: TerrainInput): Terrain {
  const nx = input.nx ?? 97;
  const nz = input.nz ?? 65;
  const { widthKm, depthKm } = input.base;
  const { sample, volcanoes } = finalSampler(input);
  const N = nx * nz;
  const elev = new Float32Array(N);
  const mat = new Uint8Array(N);
  const crust = new Uint8Array(N);
  const age = new Float32Array(N);
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const p = v((i / (nx - 1)) * widthKm, (j / (nz - 1)) * depthKm);
      const r = sample(p);
      const k = j * nx + i;
      elev[k] = r.elev;
      mat[k] = r.mat;
      crust[k] = r.crust === 'oceanic' ? 1 : 0;
      age[k] = r.age;
    }
  }
  const { water, waterKind } = fillWater(nx, nz, elev, input.seaLevel ?? 0);
  return { nx, nz, widthKm, depthKm, elev, mat, crust, age, water, waterKind, volcanoes };
}

/** Sea floods every below-sea-level cell connected to the slab edge or open ocean; closed basins become lakes. */
export function fillWater(nx: number, nz: number, elev: Float32Array, sea: number) {
  const N = nx * nz;
  const water = new Float32Array(N).fill(NaN);
  const waterKind = new Uint8Array(N);
  const queue: number[] = [];
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      if (i > 0 && j > 0 && i < nx - 1 && j < nz - 1) continue;
      const k = j * nx + i;
      if (elev[k] < sea && !waterKind[k]) {
        waterKind[k] = 1;
        queue.push(k);
      }
    }
  }
  while (queue.length) {
    const k = queue.pop()!;
    water[k] = sea;
    const i = k % nx;
    const j = (k - i) / nx;
    const nb = [i > 0 ? k - 1 : -1, i < nx - 1 ? k + 1 : -1, j > 0 ? k - nx : -1, j < nz - 1 ? k + nx : -1];
    for (const m of nb) {
      if (m >= 0 && !waterKind[m] && elev[m] < sea) {
        waterKind[m] = 1;
        queue.push(m);
      }
    }
  }
  // closed basins below sea level: salty lakes (the Dead Sea case)
  const seen = new Uint8Array(N);
  for (let k = 0; k < N; k++) {
    if (waterKind[k] || seen[k] || elev[k] >= sea) continue;
    const comp: number[] = [k];
    waterKind[k] = 2;
    let min = elev[k];
    for (let q = 0; q < comp.length; q++) {
      const c = comp[q];
      const i = c % nx;
      const j = (c - i) / nx;
      const nb = [i > 0 ? c - 1 : -1, i < nx - 1 ? c + 1 : -1, j > 0 ? c - nx : -1, j < nz - 1 ? c + nx : -1];
      for (const m of nb) {
        if (m >= 0 && !waterKind[m] && elev[m] < sea) {
          waterKind[m] = 2;
          comp.push(m);
          min = Math.min(min, elev[m]);
        }
      }
    }
    const surface = Math.min(sea - 1, min + 0.41 * Math.abs(min));
    for (const c of comp) {
      seen[c] = 1; // a dry basin rim is not a second lake
      if (elev[c] < surface) water[c] = surface;
      else waterKind[c] = 0;
    }
  }
  return { water, waterKind };
}

export function cellAt(t: Terrain, p: Vec2): number {
  const i = clamp(Math.round((p.x / t.widthKm) * (t.nx - 1)), 0, t.nx - 1);
  const j = clamp(Math.round((p.z / t.depthKm) * (t.nz - 1)), 0, t.nz - 1);
  return j * t.nx + i;
}

export function elevAt(t: Terrain, p: Vec2): number {
  return t.elev[cellAt(t, p)];
}

export function isWater(t: Terrain, p: Vec2): boolean {
  return !Number.isNaN(t.water[cellAt(t, p)]);
}

/** Water length (km) along the straight segment a → b. */
export function waterAlong(t: Terrain, a: Vec2, b: Vec2, kind: 1 | 2 | 0 = 1): number {
  const L = dist(a, b);
  const steps = Math.max(8, Math.ceil(L / 2));
  let wet = 0;
  for (let i = 0; i < steps; i++) {
    const p = add(a, scale(sub(b, a), (i + 0.5) / steps));
    const k = cellAt(t, p);
    if (!Number.isNaN(t.water[k]) && (kind === 0 || t.waterKind[k] === kind)) wet++;
  }
  return (wet / steps) * L;
}

/** Highest elevation within r km of p. */
export function maxElevNear(t: Terrain, p: Vec2, r: number): number {
  let best = -Infinity;
  const di = Math.ceil((r / t.widthKm) * (t.nx - 1));
  const dj = Math.ceil((r / t.depthKm) * (t.nz - 1));
  const c = cellAt(t, p);
  const ci = c % t.nx;
  const cj = (c - ci) / t.nx;
  for (let j = Math.max(0, cj - dj); j <= Math.min(t.nz - 1, cj + dj); j++) {
    for (let i = Math.max(0, ci - di); i <= Math.min(t.nx - 1, ci + di); i++) {
      const q = v((i / (t.nx - 1)) * t.widthKm, (j / (t.nz - 1)) * t.depthKm);
      if (dist(q, p) <= r) best = Math.max(best, t.elev[j * t.nx + i]);
    }
  }
  return best;
}

export function distToBoundary(p: Vec2, b: Boundary): number {
  return distToSeg(p, b.p0, b.p1);
}
