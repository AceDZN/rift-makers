// One level being played. Pure and deterministic: the scene and UI call these
// methods and read the state; tests call the same methods.
//
// The player's only power is heat. They place hot plumes and cold drips,
// commit a duration and run deep time forward. Boundaries emerge from the
// flows; the landscape is judged at the end of the run.

import { type Vec2, add, clamp, dist, dot, rng, scale, sub, v, smoothstep } from './geo.ts';
import {
  type Boundary,
  type Deposit,
  type Terrain,
  MAT,
  baseSampler,
  boundaryDisp,
  boundaryFrame,
  buildTerrain,
  cellAt,
  divingSide,
  maxElevNear,
  movePoint,
  waterAlong,
} from './terrain.ts';
import { type LevelDef, type RockId, levelById } from './levels.ts';
import { type Heat, type HeatKind, type SeamMotion, flowAt, plateAt, plateVelocity, seamMotion } from './heat.ts';
import { type LayerId, LAYERS, mantleTempAt, readStation, type StationReading } from './earth.ts';
import { RETROFIT_FACTOR, energyRatio, evacuate, runQuakes, shakingAt, type EvacResult, type House, type TownReport } from './quake.ts';
import { type RockSample } from './rocks.ts';
import { reasonLine } from './explain.ts';

export type Phase = 'plan' | 'running' | 'collect' | 'sites' | 'review' | 'done';

export type GameEvent =
  | { type: 'heat'; heat: Heat }
  | { type: 'unheat'; id: string }
  | { type: 'run'; duration: number }
  | { type: 'boundary'; seam: string; btype: string; rate: number }
  | { type: 'flood' }
  | { type: 'volcano'; id: string; x: number; z: number }
  | { type: 'quake'; x: number; z: number; magnitude: number }
  | { type: 'mistake'; reason: string }
  | { type: 'success' }
  | { type: 'fail'; reason: string }
  | { type: 'hint' }
  | { type: 'sample'; x: number; z: number; value: string | number }
  | { type: 'fire' }
  | { type: 'wave' }
  | { type: 'collapse'; house: string }
  | { type: 'cheer' }
  | { type: 'restart' };

export interface Outcome {
  success: boolean;
  stars: number;
  reason: string;
  line: string;
}

export interface WishStatus {
  villager: string;
  ok: boolean;
  reason: string;
  value?: number;
}

export interface Probe {
  x: number;
  z: number;
  value: number;
}

const HEAT_KINDS = new Set(['heat', 'predict', 'wegener', 'rocks', 'fossil', 'israel']);

export class Session {
  readonly def: LevelDef;
  phase: Phase = 'plan';
  heats: Heat[] = [];
  duration: number;
  t = 0;
  runStart = 0;
  runs = 0;
  mistakes = 0;
  hints = 0;
  outcome: Outcome | null = null;
  feedback: { tone: 'good' | 'bad' | 'info'; line: string } | null = null;
  events: GameEvent[] = [];
  private mistakeKeys = new Set<string>();
  private heatSeq = 0;
  private terrainCache: { key: string; terrain: Terrain } | null = null;
  private flowCache: { key: string; motions: SeamMotion[] } | null = null;
  private announced = new Set<string>();
  private quakeClock = 0;
  private extraOk = true;

  // seismograph
  stations: number[] = [];
  readings: StationReading[] = [];
  fired = 0;
  marked: LayerId | null = null;
  // predictions
  predictions: Record<string, string> = {};
  // heat-flow probes / sea-floor ages
  probes: Probe[] = [];
  dug: Probe | null = null;
  // Wegener
  pieces: Record<string, { x: number; z: number; rot: number }> = {};
  accepted = false;
  // site choices
  site: Vec2 | null = null;
  siteReport: { felt: number; nearestKm: number } | null = null;
  copyChoice: string | null = null;
  cove: string | null = null;
  hill: string | null = null;
  evac: EvacResult | null = null;
  townSites: Record<string, string> = {};
  quakeReport: { collapsed: string[]; towns: TownReport[] } | null = null;
  // rocks
  hammered: { x: number; z: number; rock: RockSample }[] = [];
  collected = new Set<RockId>();

  constructor(levelId: number) {
    this.def = levelById(levelId);
    const d = this.def;
    this.duration = d.duration.start;
    for (const h of d.fixedHeat ?? []) this.heats.push({ ...h, fixed: true });
    if (d.kind === 'wegener') for (const p of d.wegener!.pieces) this.pieces[p.id] = { ...p.start };
    this.resetPhase();
  }

  private resetPhase() {
    const k = this.def.kind;
    if (k === 'dig') {
      this.phase = 'collect';
      this.t = this.duration;
    } else if (k === 'site' || k === 'copy') {
      this.phase = 'sites';
      this.t = this.duration;
    } else {
      this.phase = 'plan';
      this.t = 0;
    }
    this.runStart = this.t;
  }

  // ───────── shared ─────────

  get cellKm(): number {
    return this.def.cellKm ?? 260;
  }

  get strength(): number {
    return this.def.strength ?? 4;
  }

  get chained(): boolean {
    return this.def.chainMaxMyr !== undefined;
  }

  private say(tone: 'good' | 'bad' | 'info', line: string) {
    this.feedback = { tone, line };
  }

  private layoutKey(): string {
    return JSON.stringify([this.heats.map((h) => [h.kind, h.x, h.z]), this.duration, this.predictions, this.site, this.copyChoice, this.cove, this.hill, this.townSites]);
  }

  private mistake(reason: string, extra?: Record<string, string | number>) {
    this.say('bad', reasonLine(reason, extra));
    this.events.push({ type: 'mistake', reason });
    const key = reason + this.layoutKey();
    if (this.mistakeKeys.has(key)) return;
    this.mistakeKeys.add(key);
    this.mistakes++;
  }

  private fail(reason: string, extra?: Record<string, string | number>) {
    this.mistake(reason, extra);
    this.phase = 'review';
    this.events.push({ type: 'fail', reason });
  }

  private finish(extra = true) {
    let stars = 1 + (this.mistakes === 0 ? 1 : 0) + (extra && this.extraOk ? 1 : 0) - (this.hints > 0 ? 1 : 0);
    stars = clamp(stars, 1, 3);
    this.outcome = { success: true, stars, reason: 'ok', line: this.def.success };
    this.phase = 'done';
    this.events.push({ type: 'success' }, { type: 'cheer' });
    this.say('good', this.def.success);
  }

  /** First try, no hint: the learning record the UI stores locally. */
  get unaided(): boolean {
    return !!this.outcome?.success && this.mistakes === 0 && this.hints === 0;
  }

  hint(): string | null {
    if (this.def.noHints || this.outcome) return null;
    this.hints++;
    this.events.push({ type: 'hint' });
    this.say('info', this.def.hint);
    return this.def.hint;
  }

  /** Back to the start of deep time. Heat placements stay. */
  restart() {
    if (this.outcome) return;
    this.resetPhase();
    for (const h of this.heats) h.bornMyr = 0;
    this.hammered = [];
    this.collected.clear();
    this.dug = null;
    this.evac = null;
    this.quakeReport = null;
    this.siteReport = null;
    this.announced.clear();
    this.feedback = null;
    this.events.push({ type: 'restart' });
  }

  // ───────── heat ─────────

  private heatCount(kind: HeatKind) {
    return this.heats.filter((h) => !h.fixed && h.kind === kind).length;
  }

  heatLeft(kind: HeatKind): number {
    const d = this.def;
    if (d.anyHeat !== undefined) return d.anyHeat - this.heats.filter((h) => !h.fixed).length;
    return (kind === 'plume' ? d.plumes ?? 0 : d.drips ?? 0) - this.heatCount(kind);
  }

  canPlaceHeat(kind: HeatKind): boolean {
    if (this.phase !== 'plan' || this.outcome) return false;
    if (!HEAT_KINDS.has(this.def.kind)) return false;
    if (this.def.kind === 'wegener' && !this.accepted) return false;
    return this.heatLeft(kind) > 0;
  }

  private snapHeat(x: number, z: number): Vec2 {
    const s = this.def.heatSnapKm ?? 10;
    const { widthKm: W, depthKm: D } = this.def.base;
    return v(clamp(Math.round(x / s) * s, 0, W), clamp(Math.round(z / s) * s, 0, D));
  }

  placeHeat(kind: HeatKind, x: number, z: number): Heat | null {
    if (!this.canPlaceHeat(kind)) return null;
    const p = this.snapHeat(x, z);
    if (this.heats.some((h) => dist(v(h.x, h.z), p) < 1)) return null;
    const h: Heat = { id: `h${++this.heatSeq}`, kind, x: p.x, z: p.z, bornMyr: this.t };
    this.heats.push(h);
    this.events.push({ type: 'heat', heat: h });
    return h;
  }

  moveHeat(id: string, x: number, z: number) {
    const h = this.heats.find((q) => q.id === id);
    if (!h || h.fixed || this.phase !== 'plan' || (h.bornMyr ?? 0) < this.t) return;
    const p = this.snapHeat(x, z);
    h.x = p.x;
    h.z = p.z;
  }

  removeHeat(id: string) {
    const h = this.heats.find((q) => q.id === id);
    if (!h || h.fixed || this.phase !== 'plan' || (h.bornMyr ?? 0) < this.t) return;
    this.heats = this.heats.filter((q) => q !== h);
    this.events.push({ type: 'unheat', id });
  }

  /** Heat burning at deep time `at`. */
  activeHeats(at = this.t): Heat[] {
    return this.heats.filter((h) => (h.bornMyr ?? 0) <= at + 1e-9);
  }

  // ───────── flows and boundaries ─────────

  motions(): SeamMotion[] {
    const heats = this.heats;
    const key = JSON.stringify(heats.map((h) => [h.kind, h.x, h.z]));
    if (this.flowCache?.key === key) return this.flowCache.motions;
    const d = this.def;
    let motions: SeamMotion[] = (d.seams ?? []).map((s) => seamMotion(s, heats, this.cellKm, this.strength, d.baseMotion?.[s.id]));
    if (d.fixedRate) motions = motions.map((m) => (m.type ? { ...m, rateCmYr: d.fixedRate! } : m));
    this.flowCache = { key, motions };
    return motions;
  }

  motion(seamId?: string): SeamMotion | null {
    const ms = this.motions();
    return (seamId ? ms.find((m) => m.seam === seamId) : ms[0]) ?? null;
  }

  /** Plate drift (cm/yr vector) from the flow under the whole plate. */
  plateVelocity(plateId: string): Vec2 {
    const p = this.def.plates!.find((q) => q.id === plateId)!;
    return plateVelocity(p, this.heats, this.cellKm, this.strength, this.def.base.widthKm, this.def.base.depthKm);
  }

  /** Surface flow at a point, for arrows. */
  flowAt(x: number, z: number): Vec2 {
    return flowAt(v(x, z), this.heats, this.cellKm, this.strength);
  }

  boundaries(): Boundary[] {
    const d = this.def;
    const out: Boundary[] = [];
    if (d.seamAtPlume) {
      const pl = this.heats.find((h) => h.kind === 'plume');
      if (pl) {
        const dx = Math.abs(pl.x - d.seamAtPlume.upwellingX);
        const rate = d.seamAtPlume.rateCmYr * Math.exp(-((dx / d.seamAtPlume.toleranceKm) ** 2) * 0.7);
        if (rate >= 0.6) out.push({ id: 'p', p0: v(pl.x, 0), p1: v(pl.x, d.base.depthKm), type: 'pull', rateCmYr: Math.round(rate * 10) / 10 });
      }
      return out;
    }
    if (d.kind === 'dig') {
      const g = d.dig!;
      return [{ id: 'ridge', p0: v(g.ridgeX, 0), p1: v(g.ridgeX, d.base.depthKm), type: 'pull', rateCmYr: g.rateCmYr }];
    }
    if (d.kind === 'wegener') return [];
    const base = baseSampler(d.base, 0);
    for (const seam of d.seams ?? []) {
      const m = this.motion(seam.id);
      if (!m?.type) continue;
      const b: Boundary = { id: seam.id, p0: seam.p0, p1: seam.p1, type: m.type, rateCmYr: m.rateCmYr, sense: m.sense, rift: seam.rift, segment: seam.segment, startMyr: 0 };
      if (b.type === 'push') b.arcKm = this.arcKm(b, base);
      out.push(b);
    }
    return out;
  }

  /** Arc volcanoes rise above where the diving slab is pulled down: the nearest drip on the overriding side. */
  private arcKm(b: Boundary, base = baseSampler(this.def.base, 0)): number {
    const { t, n, length } = boundaryFrame(b);
    const mid = add(b.p0, scale(t, length / 2));
    const a = base(add(mid, scale(n, -70)));
    const c = base(add(mid, scale(n, 70)));
    const dive = divingSide(a.crust, c.crust, a.elev, c.elev);
    if (!dive) return 95;
    const over = dive === 'a' ? 1 : -1;
    let best = Infinity;
    for (const h of this.heats) {
      if (h.kind !== 'drip') continue;
      const rel = sub(v(h.x, h.z), b.p0);
      const dd = dot(rel, n);
      const u = dot(rel, t);
      if (Math.sign(dd) !== over || u < -80 || u > length + 80) continue;
      if (Math.abs(dd) < Math.abs(best)) best = dd;
    }
    return Number.isFinite(best) ? clamp(Math.abs(best), 30, 320) : 45;
  }

  // ───────── deep time ─────────

  setDuration(myr: number) {
    const d = this.def.duration;
    if (d.fixed || this.phase !== 'plan') return;
    this.duration = clamp(Math.round((myr - d.min) / d.step) * d.step + d.min, d.min, d.max);
  }

  canRun(): boolean {
    if (this.phase !== 'plan' || this.outcome || !HEAT_KINDS.has(this.def.kind)) return false;
    const d = this.def;
    if (d.kind === 'predict') return (d.predict ?? []).every((p) => this.predictions[p.key]);
    if (d.kind === 'wegener') return this.accepted && this.heats.some((h) => h.kind === 'plume');
    if (d.kind === 'fossil') return this.t + this.duration <= (d.chainMaxMyr ?? 100) + 1e-9;
    if (d.kind === 'heat' && !d.fixedHeat?.length) return this.heats.length > 0;
    if (d.kind === 'rocks' || d.kind === 'israel') return this.heats.some((h) => !h.fixed);
    return true;
  }

  run(): boolean {
    if (!this.canRun()) return false;
    this.runs++;
    this.runStart = this.t;
    this.phase = 'running';
    this.quakeClock = 0;
    this.events.push({ type: 'run', duration: this.duration });
    this.say('info', 'הזמן רץ קדימה…');
    if (this.duration <= 0) this.endRun();
    return true;
  }

  get runEnd(): number {
    return this.runStart + this.duration;
  }

  /** Move deep time forward (Myr). Never backwards. */
  advance(dtMyr: number) {
    if (this.phase !== 'running' || dtMyr <= 0) return;
    const prev = this.t;
    this.t = Math.min(this.runEnd, this.t + dtMyr);
    this.announce(prev);
    if (this.t >= this.runEnd - 1e-9) this.endRun();
  }

  runToEnd() {
    if (this.phase === 'running') this.advance(this.runEnd - this.t + 1);
  }

  /** Scene events while time runs: boundaries forming, floods, volcanoes, quakes. */
  private announce(prev: number) {
    const bs = this.boundaries();
    for (const b of bs) {
      const key = `b:${b.id}`;
      if (!this.announced.has(key) && boundaryDisp(b, this.t) > 2) {
        this.announced.add(key);
        this.events.push({ type: 'boundary', seam: b.id, btype: b.type, rate: b.rateCmYr });
      }
      if (b.type === 'pull' && !this.announced.has('flood') && boundaryDisp(b, this.t) > 45) {
        this.announced.add('flood');
        this.events.push({ type: 'flood' });
      }
    }
    if (bs.some((b) => b.type !== 'pull' || b.rift)) {
      this.quakeClock += this.t - prev;
      const every = Math.max(this.duration / 6, 0.2);
      const r = rng(Math.round(this.t * 1000) + 7);
      while (this.quakeClock >= every) {
        this.quakeClock -= every;
        const b = bs[Math.floor(r() * bs.length)];
        const p = add(b.p0, scale(sub(b.p1, b.p0), 0.15 + 0.7 * r()));
        this.events.push({ type: 'quake', x: p.x, z: p.z, magnitude: Math.round((5 + r() * 2.5) * 10) / 10 });
      }
    }
    for (const vc of this.terrain().volcanoes) {
      if (vc.h > 400 && !this.announced.has(`v:${vc.id}`)) {
        this.announced.add(`v:${vc.id}`);
        this.events.push({ type: 'volcano', id: vc.id, x: vc.x, z: vc.z });
      }
    }
  }

  private endRun() {
    this.t = this.runEnd;
    for (const h of this.heats) if (h.bornMyr === undefined) h.bornMyr = 0;
    this.judge();
  }

  // ───────── villagers ─────────

  villagerPos(vl: { x: number; z: number }): Vec2 {
    const bs = this.boundaries();
    if (!bs.length) return v(vl.x, vl.z);
    return movePoint(v(vl.x, vl.z), bs, this.t, baseSampler(this.def.base, 0));
  }

  wishStatus(): WishStatus[] {
    const out: WishStatus[] = [];
    const vs = this.def.villagers ?? [];
    const ter = this.terrain();
    for (const vl of vs) {
      if (!vl.wish) continue;
      const p = this.villagerPos(vl);
      const w = vl.wish;
      if (w.kind === 'sea') {
        const ok = this.seaWithin(ter, p, w.r);
        out.push({ villager: vl.id, ok, reason: ok ? 'ok' : 'noSea' });
      } else if (w.kind === 'seaBetween') {
        const other = vs.find((o) => o.id === w.other)!;
        const width = Math.round(waterAlong(ter, p, this.villagerPos(other), 1));
        const ok = width >= w.min && width <= w.max;
        out.push({ villager: vl.id, ok, value: width, reason: ok ? 'ok' : width < w.min ? 'tooNarrow' : 'tooWide' });
      } else {
        const h = Math.round(maxElevNear(ter, p, w.r));
        const ok = h >= w.minElev;
        out.push({ villager: vl.id, ok, value: h, reason: ok ? 'ok' : 'tooLow' });
      }
    }
    return out;
  }

  private seaWithin(ter: Terrain, p: Vec2, r: number): boolean {
    for (let a = 0; a < 16; a++) {
      for (const k of [0.25, 0.5, 0.75, 1]) {
        const q = v(p.x + Math.cos((a / 16) * Math.PI * 2) * r * k, p.z + Math.sin((a / 16) * Math.PI * 2) * r * k);
        if (ter.waterKind[cellAt(ter, q)] === 1) return true;
      }
    }
    return false;
  }

  // ───────── terrain ─────────

  /** Shallow-sea layers and uplift (level 17), integrated over deep time. */
  fossilState(at = this.t): { layers: number; upliftM: number; topM: number | null } {
    const f = this.def.fossil;
    if (!f) return { layers: 0, upliftM: 0, topM: null };
    let layers = 0;
    let up = 0;
    const dt = 0.25;
    for (let tt = 0; tt < at - 1e-9; tt += dt) {
      const step = Math.min(dt, at - tt);
      const shelf = -60 + 20 * layers + up;
      if (shelf < 0) layers = Math.min(f.layers + 2, layers + step / f.layerMyr);
      for (const h of this.activeHeats(tt)) {
        if (h.x < 10 || h.x > 110) continue;
        up += (h.kind === 'drip' ? f.upliftMPerMyr : -8) * step;
      }
    }
    const L = Math.floor(layers + 1e-6);
    return { layers: L, upliftM: up, topM: L >= 1 ? -60 + 20 * L + up : null };
  }

  /** Landscape built by the final level's heat besides the rift. */
  private israelDeposits(): Deposit[] {
    const d = this.def;
    const il = d.israel!;
    const out: Deposit[] = [];
    const t = this.t;
    let coastUplift = false;
    for (const h of this.heats) {
      const inAF = h.x < 150 - 8;
      if (h.kind === 'drip' && inAF) {
        out.push({ id: `fold-${h.id}`, kind: 'uplift', geom: { kind: 'line', pts: [v(h.x, -30), v(h.x - 6, d.base.depthKm + 30)], w: 46, soft: 30 }, amount: 880, progress: smoothstep(0, 6, t) });
        out.push({ id: `lime-${h.id}`, kind: 'limestone', geom: { kind: 'line', pts: [v(h.x, -30), v(h.x - 6, d.base.depthKm + 30)], w: 60, soft: 20 }, amount: 0, progress: smoothstep(0, 2, t) });
        if (h.x < il.coastBand[1] + 10) coastUplift = true;
      }
      if (h.kind === 'plume') {
        out.push({ id: `basalt-${h.id}`, kind: 'basalt', geom: { kind: 'circle', x: h.x, z: h.z, r: 34, soft: 18 }, amount: 260, progress: smoothstep(0, 4, t) });
      }
    }
    if (!coastUplift) {
      out.push({ id: 'kurkar', kind: 'kurkar', geom: { kind: 'rect', x1: il.coastBand[0], z1: -30, x2: il.coastBand[1], z2: d.base.depthKm + 30, soft: 10 }, amount: 45, progress: smoothstep(0.5, 3, t) });
    }
    return out;
  }

  terrainInput() {
    const d = this.def;
    const deposits: Deposit[] = [];
    if (d.kind === 'fossil') {
      const f = this.fossilState();
      if (f.layers > 0) deposits.push({ id: 'layers', kind: 'limestone', geom: { kind: 'rect', x1: 26, z1: -20, x2: 94, z2: 100, soft: 10 }, amount: 140, progress: Math.min(1, f.layers / this.def.fossil!.layers) });
      if (f.upliftM) deposits.push({ id: 'uplift', kind: 'uplift', geom: { kind: 'rect', x1: 24, z1: -20, x2: 96, z2: 100, soft: 22 }, amount: f.upliftM, progress: 1 });
    }
    if (d.kind === 'israel') deposits.push(...this.israelDeposits());
    const big = d.kind === 'site' && d.site?.kind === 'tsunami';
    return { base: d.base, boundaries: this.boundaries(), tMyr: this.t, deposits, nx: big ? 113 : 97, nz: big ? 73 : 65 };
  }

  terrain(): Terrain {
    const input = this.terrainInput();
    const key = JSON.stringify([input.boundaries, input.tMyr, input.deposits]);
    if (this.terrainCache?.key === key) return this.terrainCache.terrain;
    const terrain = buildTerrain(input);
    this.terrainCache = { key, terrain };
    return terrain;
  }

  // ───────── judging a run ─────────

  private judge() {
    const d = this.def;
    switch (d.kind) {
      case 'heat':
        return this.judgeHeat();
      case 'predict':
        return this.judgePredict();
      case 'wegener':
        return this.judgeWegener();
      case 'rocks':
        this.phase = 'collect';
        this.say('info', 'הזמן עצר. קחו את הפטיש ודגמו סלעים.');
        return;
      case 'fossil':
        return this.judgeFossil();
      case 'israel':
        return this.judgeIsrael();
    }
  }

  private judgeHeat() {
    const d = this.def;
    if (d.ring) return this.judgeRing();
    if (d.fields) return this.judgeArc();
    if (d.road) return this.judgeRoad();
    const wishes = this.wishStatus();
    if (wishes.every((w) => w.ok)) return this.finish();
    const bs = this.boundaries();
    const b = bs[0];
    const wantsMountain = (d.villagers ?? []).some((vl) => vl.wish?.kind === 'mountain');
    if (!b) {
      if (d.seamAtPlume) {
        const pl = this.heats.find((h) => h.kind === 'plume')!;
        return this.fail('heatOffUpwelling', { value: Math.abs(pl.x - d.seamAtPlume.upwellingX) });
      }
      return this.fail('locked');
    }
    if (wantsMountain) {
      if (b.type === 'pull') return this.fail('sulkFishing');
      if (b.type === 'slide') return this.fail('slideNoMountain');
      const w = wishes.find((x) => !x.ok)!;
      return this.fail('tooLow', { value: w.value ?? 0 });
    }
    if (b.type === 'push') return this.fail('mountainNotSea');
    if (b.type === 'slide') return this.fail('slideNoSea');
    const w = wishes.find((x) => !x.ok)!;
    if (d.seamAtPlume && w.value === 0) {
      const pl = this.heats.find((h) => h.kind === 'plume')!;
      return this.fail('heatOffUpwelling', { value: Math.abs(pl.x - d.seamAtPlume.upwellingX) });
    }
    return this.fail(w.reason, { value: w.value ?? 0 });
  }

  private judgeArc() {
    const f = this.def.fields!;
    const b = this.boundaries()[0];
    if (!b) return this.fail('locked');
    if (b.type === 'pull') return this.fail('pullNoArc');
    if (b.type === 'slide') return this.fail('slideNoArc');
    const vs = this.terrain().volcanoes.filter((x) => x.source === 'arc' && x.h > 300);
    if (!vs.length) return this.fail('noArcYet');
    const mx = vs.reduce((a, x) => a + x.x, 0) / vs.length;
    if (vs.some((x) => dist(v(x.x, x.z), f.town) < f.townSafeKm)) return this.fail('arcInTown');
    if (Math.abs(mx - f.x) <= f.band) return this.finish();
    return this.fail(mx < f.x ? 'arcAtCoast' : 'arcNotFields');
  }

  /** km between the north and south halves of the road, along the fault (0 = joined). */
  roadOffset(): number {
    const r = this.def.road!;
    const bs = this.boundaries();
    const base = baseSampler(this.def.base, 0);
    const n = movePoint(v(r.northX, r.faultZ - 40), bs, this.t, base);
    const s = movePoint(v(r.southX, r.faultZ + 40), bs, this.t, base);
    return Math.round(n.x - s.x);
  }

  private judgeRoad() {
    const r = this.def.road!;
    const b = this.boundaries()[0];
    if (!b) return this.fail('locked');
    if (b.type === 'push') return this.fail('roadPush');
    if (b.type === 'pull') return this.fail('roadPull');
    const off = this.roadOffset();
    if (Math.abs(off) <= r.tolKm) return this.finish();
    if (Math.abs(off) > Math.abs(r.northX - r.southX)) return this.fail('wrongSense');
    return this.fail('roadOffset', { value: Math.abs(off) });
  }

  private judgeRing() {
    const ring = this.def.ring!;
    for (const seam of this.def.seams!) {
      const m = this.motion(seam.id);
      if (m?.type !== 'push') {
        const name = { north: 'חוף הצפוני', east: 'חוף המזרחי', south: 'חוף הדרומי' }[seam.id] ?? 'אחד החופים';
        return this.fail('ringOpen', { seam: name });
      }
    }
    const vs = this.terrain().volcanoes.filter((x) => x.h > 300);
    for (const vl of ring.villages) {
      if (vs.some((x) => dist(v(x.x, x.z), v(vl.x, vl.z)) < ring.minArcKm)) return this.fail('arcOnVillage', { village: vl.he });
    }
    return this.finish();
  }

  // ───────── level 3: predictions ─────────

  predict(key: string, value: string) {
    if (this.outcome || (this.phase !== 'plan' && this.phase !== 'sites')) return;
    this.predictions[key] = value;
  }

  /** The answer the flows give (east/west) for a plate. */
  plateDir(plateId: string): 'east' | 'west' {
    return this.plateVelocity(plateId).x >= 0 ? 'east' : 'west';
  }

  private judgePredict() {
    for (const p of this.def.predict ?? []) {
      const truth = this.plateDir(p.key);
      if (this.predictions[p.key] !== truth) {
        return this.fail('wrongPredict', { plate: p.he, dir: truth === 'east' ? 'מזרחה' : 'מערבה' });
      }
    }
    this.finish();
  }

  // ───────── level 2: seismograph ─────────

  placeStation(angleDeg: number) {
    if (this.def.kind !== 'seismo' || this.outcome) return;
    const a = clamp(Math.round(Math.abs(angleDeg) / 5) * 5, 10, 180);
    if (this.stations.includes(a)) return;
    this.stations.push(a);
    if (this.stations.length > this.def.seismo!.stations) this.stations.shift();
    this.readings = [];
  }

  fire() {
    if (this.def.kind !== 'seismo' || this.outcome || this.stations.length < this.def.seismo!.stations) return;
    this.fired++;
    this.readings = this.stations.map(readStation);
    this.events.push({ type: 'fire' });
    const shadow = this.readings.filter((r) => !r.solidOnlyArrives).length;
    this.say(
      'info',
      shadow === 0
        ? 'כל הגלים הגיעו לכל התחנות. נסו להציב תחנה רחוק יותר, בצד השני של הכדור.'
        : shadow === this.readings.length
          ? 'באף תחנה לא הגיע הגל השני. השוו לתחנה קרובה יותר.'
          : 'יש תחנות שהגל השני לא הגיע אליהן. דרך איזו שכבה הוא היה צריך לעבור? סמנו את השכבה הנוזלית.',
    );
  }

  mark(layer: LayerId) {
    if (this.def.kind !== 'seismo' || this.outcome || !this.fired) return;
    this.marked = layer;
    const L = LAYERS.find((l) => l.id === layer)!;
    if (layer !== 'outerCore') return this.mistake(layer === 'innerCore' ? 'innerCoreSolid' : 'mantleSolid', { layer: L.he });
    const hasShadow = this.readings.some((r) => !r.solidOnlyArrives);
    const hasArrive = this.readings.some((r) => r.solidOnlyArrives);
    if (!hasShadow || !hasArrive) {
      this.say('info', 'זו התשובה, אבל איפה ההוכחה? צריך תחנה שהגל השני מגיע אליה ותחנה שלא.');
      return;
    }
    this.extraOk = this.fired === 1;
    this.finish();
  }

  // ───────── level 5: heat-flow probes ─────────

  probe(x: number, z: number): Probe | null {
    const d = this.def;
    if (!d.seamAtPlume || this.phase !== 'plan' || this.probes.length >= (d.probes ?? 4)) return null;
    const p = { x: Math.round(x), z: Math.round(z), value: mantleTempAt(x, d.seamAtPlume.upwellingX, 160) };
    this.probes.push(p);
    this.events.push({ type: 'sample', x: p.x, z: p.z, value: p.value });
    if (this.probes.length > 3) this.extraOk = false;
    return p;
  }

  // ───────── level 6: sea-floor ages and the dig ─────────

  ageAt(x: number, z: number): number {
    const ter = this.terrain();
    const a = ter.age[cellAt(ter, v(x, z))];
    return Math.round(Math.max(0, a));
  }

  sampleAge(x: number, z: number): Probe | null {
    const g = this.def.dig;
    if (!g || this.phase !== 'collect' || this.probes.length >= g.samples) return null;
    const p = { x: Math.round(x), z: Math.round(z), value: this.ageAt(x, z) };
    this.probes.push(p);
    this.events.push({ type: 'sample', x: p.x, z: p.z, value: p.value });
    if (this.probes.length > 2) this.extraOk = false;
    return p;
  }

  dig(x: number, z: number) {
    const g = this.def.dig;
    if (!g || this.phase !== 'collect' || this.outcome) return;
    const age = this.ageAt(x, z);
    this.dug = { x: Math.round(x), z: Math.round(z), value: age };
    this.events.push({ type: 'sample', x, z, value: age });
    if (age >= g.minAgeMyr) return this.finish();
    this.mistake('notOldest', { value: age });
  }

  // ───────── level 10: Wegener ─────────

  movePiece(id: string, x: number, z: number, rot?: number) {
    if (this.def.kind !== 'wegener' || this.accepted || this.outcome) return;
    const p = this.pieces[id];
    if (!p) return;
    p.x = x;
    p.z = z;
    if (rot !== undefined) p.rot = rot;
  }

  rotatePiece(id: string, delta: number) {
    const p = this.pieces[id];
    if (!p || this.accepted) return;
    p.rot += delta;
  }

  wegenerCheck(): { fit: boolean; decoy: boolean } {
    const w = this.def.wegener!;
    let fit = true;
    let decoy = false;
    const join = v(3000, 1750);
    for (const pc of w.pieces) {
      const pose = this.pieces[pc.id];
      if (pc.target) {
        const ok = dist(v(pose.x, pose.z), v(pc.target.x, pc.target.z)) <= w.snapKm && Math.abs(((pose.rot - pc.target.rot) * 180) / Math.PI) <= w.snapDeg;
        fit &&= ok;
      } else if (dist(v(pose.x, pose.z), join) < 900) {
        decoy = true;
      }
    }
    return { fit, decoy };
  }

  /** Show the assembled supercontinent to the critics. */
  present() {
    if (this.def.kind !== 'wegener' || this.accepted || this.outcome) return;
    const c = this.wegenerCheck();
    if (c.decoy) return this.mistake('decoy');
    if (!c.fit) return this.mistake('noFit');
    this.accepted = true;
    for (const pc of this.def.wegener!.pieces) if (pc.target) this.pieces[pc.id] = { ...pc.target };
    this.say('good', 'המבקרים: "החופים, המאובנים ורצועות הסלע מתאימים. אבל איזה כוח הזיז יבשות שלמות?" הניחו חום והריצו את הזמן עד היום.');
  }

  /** Separation speed (cm/yr) of the two continents from the heat. */
  driftRate(): number {
    const w = this.def.wegener!;
    const [a, b] = w.pieces.filter((p) => p.target);
    const fa = flowAt(v(a.target!.x, a.target!.z), this.heats, this.cellKm, this.strength);
    const fb = flowAt(v(b.target!.x, b.target!.z), this.heats, this.cellKm, this.strength);
    return fb.x - fa.x;
  }

  piecePose(id: string): { x: number; z: number; rot: number } {
    const p = this.pieces[id];
    if (!this.accepted || this.t <= 0) return p;
    const pc = this.def.wegener!.pieces.find((q) => q.id === id)!;
    if (!pc.target) return p;
    const w = this.def.wegener!;
    const [a] = w.pieces.filter((q) => q.target);
    const sign = pc.id === a.id ? -1 : 1;
    const fl = flowAt(v(pc.target.x, pc.target.z), this.heats, this.cellKm, this.strength);
    const km = this.t * 10;
    return { x: p.x + fl.x * km, z: p.z + fl.z * km * 0.3, rot: p.rot + sign * 0.0006 * this.t };
  }

  private judgeWegener() {
    const km = this.driftRate() * this.duration * 10;
    if (km >= this.def.wegener!.minDriftKm) return this.finish();
    this.fail('plumeNotBetween');
  }

  // ───────── level 12: where to build ─────────

  /** Active plate boundaries as segments, for site checks. */
  activeSegments(): Boundary[] {
    return this.boundaries();
  }

  adviseSite(x: number, z: number) {
    const d = this.def;
    if (d.site?.kind !== 'quakes' || this.phase !== 'sites' || this.outcome) return;
    const ter = this.terrain();
    const p = v(x, z);
    if (ter.waterKind[cellAt(ter, p)]) return this.say('info', reasonLine('siteOnWater'));
    if (!this.seaWithin(ter, p, 35)) return this.say('info', reasonLine('siteNotCoast'));
    this.site = p;
    const bs = this.boundaries();
    let nearest = Infinity;
    for (const b of bs) {
      const { t, length } = boundaryFrame(b);
      const u = clamp(dot(sub(p, b.p0), t), 0, length);
      nearest = Math.min(nearest, dist(p, add(b.p0, scale(t, u))));
    }
    // a thousand years of quakes along the active boundaries
    const r = rng(1000);
    let felt = 0;
    for (let i = 0; i < 60; i++) {
      const b = bs[Math.floor(r() * bs.length)];
      const q = add(b.p0, scale(sub(b.p1, b.p0), r()));
      const m = 5.5 + r() * 2.5;
      const s = shakingAt({ id: `q${i}`, magnitude: m, x: q.x, z: q.z, depthKm: 15 }, p);
      if (s > 0.02) felt++;
      if (i < 12) this.events.push({ type: 'quake', x: q.x, z: q.z, magnitude: Math.round(m * 10) / 10 });
    }
    this.siteReport = { felt, nearestKm: Math.round(nearest) };
    if (nearest >= (d.site.safeKm ?? 200)) return this.finish();
    this.mistake('siteOnBoundary', { n: felt });
  }

  // ───────── level 13: who copies whom ─────────

  copyHouses(): House[] {
    const c = this.def.copy!;
    const out: House[] = [];
    for (const town of c.towns) {
      let code = town.code413;
      if (this.copyChoice === `${town.id}-copies`) code = c.towns.find((o) => o.id !== town.id)!.code413;
      for (let i = 0; i < c.houses; i++) {
        const a = (i / c.houses) * Math.PI * 2;
        out.push({ id: `${town.id}${i}`, town: town.id, x: town.x + Math.cos(a) * 4, z: town.z + Math.sin(a) * 4, strength: 0.5, code413: code });
      }
    }
    return out;
  }

  chooseCopy(choice: string) {
    if (this.def.kind !== 'copy' || this.phase !== 'sites' || this.outcome) return;
    this.copyChoice = choice;
  }

  runCopyQuakes() {
    const c = this.def.copy;
    if (!c || this.phase !== 'sites' || !this.copyChoice || this.outcome) return;
    const energy = this.def.predict?.find((p) => p.key === 'energy');
    if (energy && !this.predictions.energy) return;
    const houses = this.copyHouses();
    const towns = new Map<string, TownReport>();
    const collapsed: string[] = [];
    for (const town of c.towns) {
      const q = { id: town.id, ...town.quake };
      const res = runQuakes([q], houses.filter((h) => h.town === town.id));
      for (const t of res.towns) towns.set(t.town, t);
      collapsed.push(...res.collapsed);
      this.events.push({ type: 'quake', x: q.x, z: q.z, magnitude: q.magnitude });
    }
    for (const id of collapsed) this.events.push({ type: 'collapse', house: id });
    this.quakeReport = { collapsed, towns: [...towns.values()] };
    if (energy && this.predictions.energy !== energy.answer) {
      this.extraOk = false;
    }
    const bad = [...towns.values()].find((t) => t.standing < c.minStanding);
    if (!bad) {
      if (!this.extraOk) this.say('info', reasonLine('energyWrong'));
      return this.finish();
    }
    const he = c.towns.find((t) => t.id === bad.town)!.he;
    this.mistake('copyWrong', { town: he, standing: bad.standing, total: bad.total });
  }

  /** 2 Richter units ≈ 1,000× the energy. */
  static energyRatio(dm: number) {
    return energyRatio(dm);
  }

  // ───────── level 14: tsunami ─────────

  chooseCove(id: string) {
    if (this.def.site?.kind !== 'tsunami' || this.phase !== 'sites' || this.outcome) return;
    this.cove = id;
  }

  chooseHill(id: string) {
    if (this.def.site?.kind !== 'tsunami' || this.phase !== 'sites' || this.outcome) return;
    this.hill = id;
  }

  runTsunami() {
    const s = this.def.site;
    if (s?.kind !== 'tsunami' || this.phase !== 'sites' || !this.cove || !this.hill || this.outcome) return;
    const cove = s.sites.find((x) => x.id === this.cove)!;
    const hill = s.hills!.find((x) => x.id === this.hill)!;
    this.events.push({ type: 'quake', x: 0.5, z: 4.5, magnitude: 8.6 }, { type: 'wave' });
    this.evac = evacuate(s.tsunami!, v(cove.x, cove.z), v(hill.x, hill.z), hill.elev);
    if (this.evac.safe) return this.finish();
    if (!this.evac.highEnough) return this.mistake('tooLowHill', { village: cove.he, elev: hill.elev });
    this.mistake('tooSlow', { village: cove.he, walk: Math.round(this.evac.walkMin), warn: Math.round(this.evac.warningMin) });
  }

  // ───────── levels 15 and 18: rebuilding towns ─────────

  chooseTownSite(town: string, siteId: string) {
    if (this.phase !== 'sites' || this.outcome) return;
    const towns = this.def.site?.towns ?? this.def.israel?.towns ?? [];
    const t = towns.find((x) => x.id === town);
    if (!t || !t.sites.includes(siteId)) return;
    this.townSites[town] = siteId;
  }

  /** Worst shaking a site can feel from any quake that may come (ground factor included). */
  siteShaking(siteId: string): number {
    const d = this.def;
    const sites = d.site?.sites ?? d.israel?.sites ?? [];
    const s = sites.find((x) => x.id === siteId)!;
    const quakes =
      d.site?.quakes ??
      Array.from({ length: 14 }, (_, i) => ({ magnitude: d.israel!.quake.magnitude, x: 150, z: i * 20, depthKm: d.israel!.quake.depthKm }));
    let worst = 0;
    for (const [i, q] of quakes.entries()) worst = Math.max(worst, shakingAt({ id: `q${i}`, ...q }, v(s.x, s.z)) * (s.ground ?? 1));
    return worst;
  }

  /** A new 413 neighbourhood withstands this much shaking. */
  get withstands(): number {
    return (this.def.site?.houseStrength ?? 0.03) * RETROFIT_FACTOR;
  }

  runTownQuakes() {
    const towns = this.def.site?.towns ?? this.def.israel?.towns;
    if (!towns || this.phase !== 'sites' || this.outcome) return;
    if (!towns.every((t) => this.townSites[t.id])) return;
    const sites = this.def.site?.sites ?? this.def.israel!.sites;
    const report: TownReport[] = [];
    const collapsed: string[] = [];
    for (const t of towns) {
      const s = this.siteShaking(this.townSites[t.id]);
      const ok = s <= this.withstands;
      if (!ok) collapsed.push(t.id);
      report.push({ town: t.id, total: 1, standing: ok ? 1 : 0, maxShaking: s, mercalli: ok ? 6 : 9 });
    }
    this.quakeReport = { collapsed, towns: report };
    const q = this.def.site?.quakes?.[0] ?? { x: 150, z: 120, magnitude: this.def.israel?.quake.magnitude ?? 6.4 };
    this.events.push({ type: 'quake', x: q.x, z: q.z, magnitude: q.magnitude });
    for (const id of collapsed) this.events.push({ type: 'collapse', house: id });
    if (!collapsed.length) return this.finish();
    const t = towns.find((x) => x.id === collapsed[0])!;
    const s = sites.find((x) => x.id === this.townSites[t.id])!;
    this.mistake('houseFell', { town: t.he, where: `ב${s.he}`, ground: s.ground ?? 1 });
  }

  // ───────── level 16: rock orders ─────────

  rockAt(x: number, z: number): RockSample {
    const p = v(x, z);
    const base = baseSampler(this.def.base, 0);
    for (const b of this.boundaries()) {
      const s = boundaryDisp(b, this.t);
      const { t, n, length } = boundaryFrame(b);
      const rel = sub(p, b.p0);
      const d = dot(rel, n);
      const u = dot(rel, t);
      if (u < -20 || u > length + 20) continue;
      if (b.type === 'pull' && Math.abs(d) <= s / 2 + 4 && s >= 8) return 'basalt';
      if (b.type === 'push') {
        if (Math.abs(d) <= 22) return s >= 120 && this.t >= 10 ? 'granite' : 'folded';
        if (Math.abs(d) <= 70 && s >= 40) {
          const src = base(add(p, scale(n, Math.sign(d) * Math.min(s / 2, 60))));
          if (src.mat === MAT.limestone || base(p).mat === MAT.limestone) return 'marble';
        }
      }
    }
    return base(p).mat === MAT.limestone ? 'limestone' : 'soil';
  }

  hammer(x: number, z: number): RockSample | null {
    const r = this.def.rocks;
    if (!r || this.phase !== 'collect' || this.outcome) return null;
    const rock = this.rockAt(x, z);
    this.hammered.push({ x: Math.round(x), z: Math.round(z), rock });
    this.events.push({ type: 'sample', x, z, value: rock });
    if ((r.targets as string[]).includes(rock)) this.collected.add(rock as RockId);
    if (this.hammered.length > 6) this.extraOk = false;
    const missing = r.targets.filter((t) => !this.collected.has(t));
    if (!missing.length) {
      this.finish();
      return rock;
    }
    if (this.hammered.length >= r.samples) {
      const he = { basalt: 'בזלת', granite: 'גרניט', limestone: 'גיר', marble: 'שיש' };
      this.fail('outOfSamples', { rocks: missing.map((m) => he[m]).join(', ') });
    }
    return rock;
  }

  // ───────── level 17: fossils at 700 m ─────────

  private judgeFossil() {
    const f = this.def.fossil!;
    const st = this.fossilState();
    if (st.topM !== null && st.topM >= f.targetM) return this.finish(this.runs <= 2);
    const plumeOnShelf = this.heats.some((h) => h.kind === 'plume' && h.x >= 10 && h.x <= 110);
    if (plumeOnShelf) return this.fail('sankDeeper');
    if (st.layers < 1 && st.upliftM > 60) return this.fail('noShells');
    if (this.t >= (this.def.chainMaxMyr ?? 100) - 1e-9) return this.fail('outOfTime');
    // the story goes on from here: more heat or more time
    this.phase = 'plan';
    const d = this.def.duration;
    this.duration = clamp(this.duration, d.min, Math.max(d.min, (this.def.chainMaxMyr ?? 100) - this.t));
    this.say('info', st.topM === null ? `הים הרדוד השקיע ${st.layers} שכבות.` : `שכבות הצדפים (${st.layers}) בגובה ${Math.round(st.topM)} מ׳. ` + reasonLine('notHighYet', { value: Math.round(st.topM) }));
  }

  // ───────── level 18: the Land of Israel ─────────

  israelCheck(): { ok: boolean; reason: string } {
    const il = this.def.israel!;
    const m = this.motion('rift');
    const t = this.t;
    if (m?.type === 'push') return { ok: false, reason: 'pushNoRift' };
    if (m?.type === 'pull') return { ok: false, reason: 'riftWide' };
    const drips = this.heats.filter((h) => h.kind === 'drip' && h.x < 142);
    const plumes = this.heats.filter((h) => h.kind === 'plume');
    if (plumes.some((h) => h.x < 142)) return { ok: false, reason: 'basaltWrong' };
    if (drips.some((h) => h.x < il.coastBand[1] + 10)) return { ok: false, reason: 'ridgeOnCoast' };
    if (!drips.some((h) => h.x >= il.ridgeBand[0] - 5 && h.x <= il.ridgeBand[1] + 5)) return { ok: false, reason: 'needRidge' };
    if (!plumes.some((h) => h.x >= il.golan.xMin && h.z <= il.golan.zMax)) return { ok: false, reason: 'needGolan' };
    if (!m?.type || boundaryDisp({ id: 'rift', p0: v(0, 0), p1: v(0, 1), type: 'slide', rateCmYr: m.rateCmYr }, t) < 45) return { ok: false, reason: 'needRift' };
    if (t < 4) return { ok: false, reason: 'notEnoughTime' };
    // the built landscape must read right too
    const ter = this.terrain();
    const crest = this.maxAlongZ(ter, il.ridgeBand[0], il.ridgeBand[1]);
    if (crest < 600) return { ok: false, reason: 'needRidge' };
    const coast = ter.mat[cellAt(ter, v((il.coastBand[0] + il.coastBand[1]) / 2, 130))];
    if (coast !== MAT.sand) return { ok: false, reason: 'needCoast' };
    let lake = false;
    for (let k = 0; k < ter.waterKind.length; k++) if (ter.waterKind[k] === 2) lake = true;
    if (!lake) return { ok: false, reason: 'needRift' };
    return { ok: true, reason: 'ok' };
  }

  private maxAlongZ(ter: Terrain, x1: number, x2: number): number {
    let sum = 0;
    let n = 0;
    for (let z = 20; z <= this.def.base.depthKm - 20; z += 40) {
      let best = -Infinity;
      for (let x = x1; x <= x2; x += 5) best = Math.max(best, ter.elev[cellAt(ter, v(x, z))]);
      sum += best;
      n++;
    }
    return sum / n;
  }

  private judgeIsrael() {
    const c = this.israelCheck();
    if (!c.ok) return this.fail(c.reason);
    this.phase = 'sites';
    this.say('good', 'הנוף נבנה. עכשיו בחרו לכל עיר מקום, לפני שהבקע ירעד.');
  }

  // ───────── reading state ─────────

  plateAt(x: number, z: number) {
    return this.def.plates ? plateAt(this.def.plates, v(x, z)) : null;
  }

  snapshot() {
    const d = this.def;
    const r1 = (n: number) => Math.round(n * 10) / 10;
    const snap: Record<string, unknown> = {
      coords: 'km; x grows east (right), z grows south (down); north is up',
      level: d.id,
      key: d.key,
      kind: d.kind,
      phase: this.phase,
      tMyr: r1(this.t),
      durationMyr: this.duration,
      runs: this.runs,
      mistakes: this.mistakes,
      hints: this.hints,
      heats: this.heats.map((h) => ({ id: h.id, kind: h.kind, x: h.x, z: h.z, fixed: !!h.fixed })),
      heatLeft: HEAT_KINDS.has(d.kind) ? { plume: Math.max(0, this.heatLeft('plume')), drip: Math.max(0, this.heatLeft('drip')) } : undefined,
      seams: (d.seams ?? []).map((s) => {
        const m = this.motion(s.id);
        return { id: s.id, type: m?.type ?? null, rateCmYr: m?.rateCmYr ?? 0 };
      }),
      boundaries: this.boundaries().map((b) => ({ id: b.id, type: b.type, rateCmYr: b.rateCmYr, km: Math.round(boundaryDisp(b, this.t)) })),
      feedback: this.feedback,
      outcome: this.outcome,
    };
    if (d.villagers) {
      snap.villagers = d.villagers.map((vl) => {
        const p = this.villagerPos(vl);
        return { id: vl.id, x: Math.round(p.x), z: Math.round(p.z) };
      });
      if (this.phase !== 'plan') snap.wishes = this.wishStatus();
    }
    const ter = this.terrain();
    snap.volcanoes = ter.volcanoes.filter((x) => x.h > 300).map((x) => ({ x: Math.round(x.x), z: Math.round(x.z) }));
    if (d.kind === 'seismo') Object.assign(snap, { stations: this.stations, readings: this.readings.map((r) => ({ angle: r.angleDeg, second: r.solidOnlyArrives })), marked: this.marked });
    if (d.predict) snap.predictions = this.predictions;
    if (this.probes.length) snap.probes = this.probes;
    if (this.dug) snap.dug = this.dug;
    if (d.road) snap.roadOffsetKm = this.roadOffset();
    if (d.wegener) snap.pieces = Object.fromEntries(Object.keys(this.pieces).map((id) => [id, this.piecePose(id)]));
    if (d.wegener) snap.accepted = this.accepted;
    if (this.site) Object.assign(snap, { site: this.site, siteReport: this.siteReport });
    if (d.copy) snap.copyChoice = this.copyChoice;
    if (d.site?.kind === 'tsunami') Object.assign(snap, { cove: this.cove, hill: this.hill, evac: this.evac });
    if (Object.keys(this.townSites).length) snap.townSites = this.townSites;
    if (this.quakeReport) snap.quakeReport = this.quakeReport;
    if (d.rocks) Object.assign(snap, { hammered: this.hammered, collected: [...this.collected] });
    if (d.fossil) snap.fossil = this.fossilState();
    return snap;
  }
}

export { MAT };
