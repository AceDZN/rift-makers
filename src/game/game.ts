// The controller: one level session, its 3D view, input, events → effects.
// All geography comes from the Session; this file only shows and routes.

import * as THREE from 'three';
import { World } from '../scene/world.ts';
import { SlabView, softDot } from '../scene/slab.ts';
import { GlobeView } from '../scene/globe.ts';
import { Actor, badge413, preloadModels, type ModelId } from '../scene/actors.ts';
import { Session, type GameEvent } from '../model/session.ts';
import { LEVELS, type LevelDef } from '../model/levels.ts';
import type { HeatKind } from '../model/heat.ts';
import { type Vec2, v } from '../model/geo.ts';
import { Audio } from './audio.ts';
import { loadProgress, recordPending, recordResult, type Progress } from './progress.ts';
import { postToHost } from '../host.ts';
import { ROCK_HE } from '../model/rocks.ts';

export type Tool = HeatKind | 'probe' | 'age' | 'dig' | 'hammer' | 'site' | 'station' | null;
export type Screen = 'select' | 'play';

interface Label {
  el: HTMLElement;
  at: () => THREE.Vector3 | null;
  until?: number;
}

const RUN_SECONDS = (dur: number) => Math.min(6, Math.max(3, 2.6 + dur * 0.12));

export class Game {
  readonly world: World;
  readonly audio = new Audio();
  progress: Progress = loadProgress();
  screen: Screen = 'select';
  session: Session | null = null;
  slab: SlabView | null = null;
  globe: GlobeView | null = null;
  tool: Tool = null;
  selectedHeat: string | null = null;
  selectedPiece: string | null = null;
  paused = false;
  showIntro = false;
  heatView = false;
  hintShown = false;
  reducedMotion: boolean;
  time = 0;
  /** Bumped whenever the HUD must redraw. */
  version = 0;
  private actors: Actor[] = [];
  private villagerActors = new Map<string, Actor>();
  private houseActors = new Map<string, Actor>();
  private extra = new THREE.Group();
  private pieceMeshes = new Map<string, THREE.Group>();
  private labels: Label[] = [];
  private labelLayer: HTMLElement;
  private terrainKey = '';
  private lastTerrainAt = 0;
  private startedAt = 0;
  private recorded = false;
  private wave: THREE.Mesh | null = null;
  private waveT = -1;
  private collapsing: { a: Actor; t: number }[] = [];
  private raycaster = new THREE.Raycaster();
  onChange: () => void = () => {};

  constructor(stage: HTMLElement, labels: HTMLElement) {
    this.world = new World({ container: stage });
    this.labelLayer = labels;
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    this.reducedMotion = this.progress.settings.reducedMotion ?? !!mq?.matches;
    this.world.reducedMotion = this.reducedMotion;
    this.audio.setMuted(this.progress.settings.muted);
    this.world.root.add(this.extra);
    preloadModels(['pebble', 'house', 'house413', 'boat', 'olive', 'cypress', 'dog', 'seismograph', 'observatory']);
    this.bindInput();
  }

  touch() {
    this.version++;
    this.onChange();
  }

  // ───────── levels ─────────

  startLevel(id: number) {
    this.teardown();
    this.orderSeed = Math.random();
    const s = new Session(id);
    const left = this.progress.pending[id];
    if (left) s.carryOver(left.mistakes, left.hints);
    this.session = s;
    this.screen = 'play';
    this.tool = null;
    this.selectedHeat = null;
    this.selectedPiece = null;
    this.paused = false;
    this.showIntro = true;
    this.hintShown = false;
    this.recorded = false;
    this.startedAt = performance.now();
    this.terrainKey = '';
    const d = s.def;
    if (d.kind === 'seismo') {
      this.globe = new GlobeView();
      this.world.root.add(this.globe.group);
      this.world.frame(5.2, { az: 0, polar: Math.PI / 2 - 0.05, target: new THREE.Vector3(0, 0, 0) });
    } else {
      this.slab = new SlabView(d);
      this.world.root.add(this.slab.group);
      const sl = this.slab;
      const r = Math.hypot(sl.halfW, sl.halfD * 0.8, 2.4) * 0.9;
      this.world.frame(r, { az: -0.3, polar: 0.95, target: new THREE.Vector3(0, -1.9, 0) });
      this.syncTerrain(true);
      this.buildLevelActors();
      this.syncHeats(); // heat already burning in the level is drawn from the start
    }
    postToHost({ type: 'level-start', level: id });
    this.touch();
  }

  exitToSelect() {
    this.teardown();
    this.screen = 'select';
    this.world.fitR = 0;
    this.world.setOrbit({ az: 0.0, polar: 1.05, dist: 22, target: new THREE.Vector3(0, -1, 0) }, true);
    this.touch();
  }

  private teardown() {
    for (const a of this.actors) a.dispose();
    this.actors = [];
    this.villagerActors.clear();
    this.houseActors.clear();
    this.collapsing = [];
    for (const l of this.labels) l.el.remove();
    this.labels = [];
    this.pieceMeshes.clear();
    this.extra.clear();
    this.wave = null;
    this.waveT = -1;
    if (this.slab) {
      this.world.root.remove(this.slab.group);
      this.slab.dispose();
      this.slab = null;
    }
    if (this.globe) {
      this.world.root.remove(this.globe.group);
      this.globe.dispose();
      this.globe = null;
    }
    this.session = null;
  }

  // ───────── verbs (the HUD and keys call these) ─────────

  setTool(t: Tool) {
    this.tool = this.tool === t ? null : t;
    this.selectedHeat = null;
    this.audio.unlock();
    this.audio.click();
    this.touch();
  }

  placeHeat(kind: HeatKind, x: number, z: number) {
    const s = this.session!;
    const h = s.placeHeat(kind, x, z);
    if (h) {
      this.selectedHeat = h.id;
      if (s.heatLeft(kind) <= 0) this.tool = null;
    }
    this.afterAction();
  }

  removeSelectedHeat() {
    if (!this.session || !this.selectedHeat) return;
    this.session.removeHeat(this.selectedHeat);
    this.selectedHeat = null;
    this.afterAction();
  }

  setDuration(myr: number) {
    this.session?.setDuration(myr);
    this.afterAction();
  }

  stepDuration(dir: 1 | -1) {
    const s = this.session;
    if (!s) return;
    s.setDuration(s.duration + dir * s.def.duration.step);
    this.audio.click();
    this.afterAction();
  }

  run() {
    const s = this.session;
    if (!s || !s.run()) return;
    this.audio.unlock();
    this.tool = null;
    this.selectedHeat = null;
    this.paused = false;
    this.afterAction();
  }

  restart() {
    const s = this.session;
    if (!s || !s.restart()) return;
    this.rebuildAfterRestart();
    this.afterAction();
  }

  hint() {
    const s = this.session;
    if (!s || s.def.noHints || s.outcome) return;
    s.hint();
    this.hintShown = true;
    this.afterAction();
  }

  toggleHeatView() {
    this.heatView = !this.heatView;
    this.touch();
  }

  toggleMute() {
    this.audio.unlock();
    this.audio.setMuted(!this.audio.muted);
    this.progress.settings.muted = this.audio.muted;
    this.touch();
  }

  toggleReducedMotion() {
    this.reducedMotion = !this.reducedMotion;
    this.world.reducedMotion = this.reducedMotion;
    this.progress.settings.reducedMotion = this.reducedMotion;
    this.touch();
  }

  /** Any session call from the HUD goes through here so the scene follows. */
  act(fn: (s: Session) => void) {
    if (!this.session) return;
    this.audio.unlock();
    fn(this.session);
    this.afterAction();
  }

  private afterAction() {
    this.syncTerrain(true);
    this.syncHeats();
    this.drainEvents();
    this.touch();
  }

  // ───────── scene sync ─────────

  private syncTerrain(force = false) {
    const s = this.session;
    if (!s || !this.slab) return;
    const now = performance.now();
    if (!force && now - this.lastTerrainAt < 70) return;
    const input = s.terrainInput();
    const key = JSON.stringify([input.boundaries, Math.round(input.tMyr * 100), input.deposits]);
    if (key === this.terrainKey) return;
    this.terrainKey = key;
    this.lastTerrainAt = now;
    const ter = s.terrain();
    this.slab.setTerrain(ter);
    this.slab.setVolcanoes(ter.volcanoes);
    const bs = s.boundaries();
    this.slab.setSeams((s.def.seams ?? []).map((sm) => ({ p0: sm.p0, p1: sm.p1, formed: s.t > 0 ? bs.find((b) => b.id === sm.id) ?? null : null })));
    this.placeActors();
  }

  private syncHeats() {
    const s = this.session;
    if (!s || !this.slab) return;
    this.slab.setHeats(s.heats, this.selectedHeat);
    const planning = s.phase === 'plan' && s.def.kind !== 'wegener';
    // in a prediction level the arrows would give the answer away: they come only with the hint
    const free = s.heats.length > 0 && s.def.kind !== 'predict';
    const showFlow = planning && (free || (this.hintShown && s.def.hintShows === 'flow'));
    this.slab.setFlow(showFlow ? (x, z) => s.flowAt(x, z) : null, this.hintShown && s.def.hintShows === 'flow');
  }

  // ───────── actors ─────────

  private addActor(id: ModelId, height: number, x: number, z: number, opts: { tint?: string; yaw?: number; faceYaw?: number } = {}): Actor {
    const a = new Actor(id, height, { tint: opts.tint, faceYaw: opts.faceYaw });
    const p = this.slab!.toWorld(x, z);
    a.group.position.set(p.x, this.slab!.surfaceY(x, z), p.z);
    a.group.rotation.y = opts.yaw ?? 0;
    a.group.userData.km = { x, z };
    this.world.root.add(a.group);
    this.actors.push(a);
    return a;
  }

  private label(html: string, at: () => THREE.Vector3 | null, cls = 'pin passive', onClick?: () => void, until?: number): HTMLElement {
    const el = document.createElement(onClick ? 'button' : 'div');
    el.className = cls;
    el.innerHTML = html;
    if (onClick) {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onClick();
      });
    }
    this.labelLayer.appendChild(el);
    this.labels.push({ el, at, until });
    return el;
  }

  private kmPoint(x: number, z: number, lift = 0.35) {
    return () => {
      if (!this.slab) return null;
      const p = this.slab.toWorld(x, z);
      p.y = this.slab.surfaceY(x, z) + lift;
      return p;
    };
  }

  private buildLevelActors() {
    const s = this.session!;
    const d = s.def;
    const slab = this.slab!;
    const unit = slab.S; // world units per km
    const vh = 0.34; // villager height (world units)
    // villagers
    for (const vl of d.villagers ?? []) {
      const a = this.addActor('pebble', vh, vl.x, vl.z, { yaw: Math.random() * 0.6 - 0.3, tint: vl.id === 'b' || vl.id === 'e' ? '#e8d8c8' : undefined });
      a.group.userData.villager = vl.id;
      this.villagerActors.set(vl.id, a);
      if (vl.says) {
        const el = this.label(vl.says, () => {
          const p = a.group.position.clone();
          p.y += vh * 1.6;
          return p;
        }, 'bubble');
        el.dataset.villager = vl.id;
      }
      // a couple of houses and trees around each villager
      for (let i = 0; i < 2; i++) {
        const ang = i * 2.4 + vl.x;
        const r = 0.45 / unit;
        this.addActor('house', 0.26, vl.x + Math.cos(ang) * r, vl.z + Math.sin(ang) * r, { yaw: ang }).group.userData.carry = true;
      }
      this.addActor(Math.random() < 0.5 ? 'olive' : 'cypress', 0.3, vl.x - 0.3 / unit, vl.z + 0.25 / unit).group.userData.carry = true;
    }
    if (d.fields) {
      const t = d.fields.town;
      for (let i = 0; i < 5; i++) this.addActor('house', 0.26, t.x + (i % 3) * 0.28 / unit - 0.28 / unit, t.z + Math.floor(i / 3) * 0.3 / unit, { yaw: i });
      this.label('העיר', this.kmPoint(t.x, t.z, 0.55));
      this.label('השדות', this.kmPoint(d.fields.x, d.fields.z + 60, 0.2));
    }
    if (d.ring) {
      for (const vl of d.ring.villages) {
        this.addActor('house', 0.26, vl.x, vl.z);
        this.addActor('pebble', vh, vl.x + 0.3 / unit, vl.z);
        this.label(vl.he, this.kmPoint(vl.x, vl.z, 0.6));
      }
    }
    if (d.kind === 'site' && d.site?.kind === 'quakes') {
      for (const vl of [{ x: 300, z: 30 }, { x: 1150, z: 260 }, { x: 760, z: 760 }]) this.addActor('house', 0.26, vl.x, vl.z);
      this.addActor('pebble', vh, 40, 350, { yaw: 1.2 });
      this.label('איפה לבנות את עיר הנמל?', this.kmPoint(40, 350, 0.7), 'bubble');
    }
    if (d.copy) {
      for (const h of s.copyHouses()) {
        const a = this.addActor(h.code413 ? 'house413' : 'house', 0.3, h.x, h.z, { yaw: Math.atan2(h.x, h.z) });
        this.houseActors.set(h.id, a);
        if (h.code413) {
          const b = badge413();
          b.position.y = 0.55;
          a.group.add(b);
        }
      }
      for (const t of d.copy.towns) this.label(t.he, this.kmPoint(t.x, t.z - 20, 0.8));
    }
    if (d.site?.kind === 'tsunami') {
      for (const c of d.site.sites) this.addActor('boat', 0.3, c.x - 0.7, c.z, { yaw: Math.PI / 2 });
      this.villagerActors.set('crowd', this.addActor('pebble', 0.3, 5.2, 4.6));
    }
    if (d.kind === 'site' && (d.site?.kind === 'rebuild')) {
      this.label('קו השבר', this.kmPoint(118, 120, 0.3));
    }
    if (d.kind === 'israel') {
      this.label('הים התיכון', this.kmPoint(10, 40, 0.3));
      this.label('המדבר', this.kmPoint(190, 230, 0.3));
    }
    if (d.road) {
      this.label('הכביש', this.kmPoint(d.road.northX + 25, 120, 0.25));
    }
    if (d.kind === 'dig') {
      this.addActor('scientist', 0.42, 600, 40, { yaw: 0.3 });
      this.label('הרכס', this.kmPoint(d.dig!.ridgeX, 40, 0.3));
    }
    if (d.kind === 'fossil') {
      const a = this.addActor('pebble', vh, 104, 40, { yaw: -1.2 });
      this.villagerActors.set('f', a);
      this.label('צדפים על ההר? הים היה עמוק 700 מ׳!', () => {
        const p = a.group.position.clone();
        p.y += vh * 1.6;
        return p;
      }, 'bubble');
    }
    if (d.kind === 'rocks') {
      this.addActor('pebble', vh, 820, 420, { yaw: -0.6 });
      this.label('הזמנה: בזלת, גרניט, גיר, שיש', this.kmPoint(820, 420, 0.7), 'bubble');
    }
    this.buildProps();
    if (d.wegener) this.buildPieces();
    if (d.kind === 'heat' || d.kind === 'predict' || d.kind === 'rocks' || d.kind === 'israel' || d.kind === 'fossil') {
      // a compass on the slab: north up (away), east right
      const c = document.createElement('div');
      c.className = 'compass';
      c.innerHTML = 'צפון ↑<br><span class="ltr">W ← → E</span>';
      this.labelLayer.appendChild(c);
      this.labels.push({ el: c, at: () => (this.slab ? new THREE.Vector3(-this.slab.halfW - 0.5, 0.2, -this.slab.halfD + 0.3) : null) });
    }
    if (d.kind === 'site' && d.site?.kind === 'rebuild') this.buildSitePins();
    if (d.kind === 'site' && d.site?.kind === 'tsunami') this.buildTsunamiPins();
    if (d.kind === 'israel') this.buildSitePins();
    this.placeActors();
  }

  /** Instruments and landmarks that belong to a level's story (Tripo models). */
  private buildProps() {
    const d = this.session!.def;
    const unit = this.slab!.S;
    const near = (x: number, z: number, dx: number, dz: number) => [x + dx / unit, z + dz / unit] as const;
    if (d.fields) {
      // volcano observatory beside the town, watching the arc
      const [x, z] = near(d.fields.town.x, d.fields.town.z, 0.35, -0.55);
      this.addActor('observatory', 0.42, x, z, { yaw: -2.2 });
    }
    if (d.ring) {
      const v0 = d.ring.villages[1];
      const [x, z] = near(v0.x, v0.z, -0.1, 0.5);
      this.addActor('observatory', 0.42, x, z, { yaw: -1.6 });
    }
    if (d.copy) {
      for (const t of d.copy.towns) {
        const [x, z] = near(t.x, t.z, -0.7, -0.35);
        this.addActor('seismograph', 0.3, x, z, { yaw: 0.6 });
      }
      this.addDog(d.copy.towns[1].x, d.copy.towns[1].z + 0.45 / unit);
    }
    if (d.kind === 'site' && d.site?.kind === 'quakes') {
      this.addActor('seismograph', 0.3, 300 + 0.5 / unit, 30 + 0.4 / unit, { yaw: 0.4 });
    }
    if (d.site?.kind === 'tsunami') {
      const cliff = d.site.hills!.find((h) => h.id === 'cliff') ?? d.site.hills![0];
      this.addActor('warning_tower', 0.6, cliff.x + 0.2, cliff.z + 0.2, { yaw: -1.4 });
    }
    if (d.kind === 'site' && d.site?.kind === 'rebuild') {
      this.addActor('seismograph', 0.3, 96, 60, { yaw: 0.8 });
      this.addDog(100, 158);
    }
    if (d.kind === 'fossil') this.addActor('ammonite', 0.22, 104 + 0.35 / unit, 40 + 0.2 / unit, { yaw: 0.7 });
    if (d.kind === 'israel') this.addActor('hot_spring', 0.22, 136, 128, { yaw: 0.3 });
  }

  /** The dog feels a quake first: it bolts when the ground shakes. */
  private addDog(x: number, z: number) {
    const dog = this.addActor('dog', 0.2, x, z, { faceYaw: Math.PI / 2, yaw: 0.8 });
    dog.group.userData.dog = true;
  }

  /** Keep villagers and houses riding the ground as it moves and rises. */
  private placeActors() {
    const s = this.session;
    const slab = this.slab;
    if (!s || !slab) return;
    for (const vl of s.def.villagers ?? []) {
      const a = this.villagerActors.get(vl.id);
      if (!a) continue;
      const p = s.villagerPos(vl);
      const w = slab.toWorld(p.x, p.z);
      a.group.position.set(w.x, slab.surfaceY(p.x, p.z), w.z);
    }
    for (const a of this.actors) {
      if (a.group.userData.villager) continue;
      const km = a.group.userData.km as Vec2 | undefined;
      if (!km || a.id === 'boat') continue;
      // a village's houses and trees ride its plate like the villagers do
      if (!a.group.userData.carry) {
        a.group.position.y = slab.surfaceY(km.x, km.z);
        continue;
      }
      const p = s.villagerPos(km);
      const w = slab.toWorld(p.x, p.z);
      a.group.position.set(w.x, slab.surfaceY(p.x, p.z), w.z);
    }
  }

  private buildPieces() {
    const s = this.session!;
    const slab = this.slab!;
    for (const pc of s.def.wegener!.pieces) {
      const g = new THREE.Group();
      const shape = new THREE.Shape(pc.outline.map((q) => new THREE.Vector2(q.x * slab.S, -q.z * slab.S)));
      const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.25, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 2 });
      geo.rotateX(-Math.PI / 2);
      const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: pc.color, roughness: 0.85 }));
      mesh.castShadow = true;
      mesh.userData.piece = pc.id;
      g.add(mesh);
      // rock belt stripe across the piece, and fossil tokens near the join
      const belt = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.04, 0.14), new THREE.MeshStandardMaterial({ color: pc.rockBelt === 'red' ? '#c0392b' : '#3b6fd4' }));
      belt.position.set(0, 0.3, 0.2);
      belt.userData.piece = pc.id;
      g.add(belt);
      pc.fossils.forEach((f, i) => {
        const tok = new THREE.Mesh(
          f === 'mesosaurus' ? new THREE.CapsuleGeometry(0.06, 0.22, 4, 8) : f === 'glossopteris' ? new THREE.ConeGeometry(0.1, 0.22, 3) : new THREE.TorusGeometry(0.09, 0.035, 6, 12),
          new THREE.MeshStandardMaterial({ color: f === 'mesosaurus' ? '#2e8b57' : f === 'glossopteris' ? '#6b8e23' : '#9b59b6', emissive: '#111' }),
        );
        tok.rotation.z = Math.PI / 2;
        tok.position.set(-0.2 + i * 0.4, 0.38, -0.35);
        tok.userData.piece = pc.id;
        g.add(tok);
      });
      this.extra.add(g);
      this.pieceMeshes.set(pc.id, g);
      this.label(pc.he, () => {
        const p = g.position.clone();
        p.y += 0.9;
        return p;
      });
    }
    // the critics (scientist model; the critic is a tinted copy)
    this.addActor('scientist', 0.55, 600, 3200, { yaw: 0.4 });
    const critic = this.addActor('scientist', 0.55, 1100, 3250, { yaw: -0.3, tint: '#8a8aa0' });
    critic.play('skeptic');
    this.syncPieces();
  }

  private syncPieces() {
    const s = this.session;
    if (!s?.def.wegener || !this.slab) return;
    for (const [id, g] of this.pieceMeshes) {
      const pose = s.piecePose(id);
      const w = this.slab.toWorld(pose.x, pose.z);
      g.position.set(w.x, 0.02, w.z);
      g.rotation.y = -pose.rot;
      const sel = id === this.selectedPiece;
      (g.children[0] as THREE.Mesh).material = new THREE.MeshStandardMaterial({
        color: s.def.wegener.pieces.find((p) => p.id === id)!.color,
        emissive: sel ? '#665522' : '#000000',
        roughness: 0.85,
      });
    }
  }

  private buildSitePins() {
    const s = this.session!;
    const d = s.def;
    const sites = d.site?.sites ?? d.israel?.sites ?? [];
    const towns = d.site?.towns ?? d.israel?.towns ?? [];
    for (const t of towns) {
      for (const sid of t.sites) {
        const st = sites.find((x) => x.id === sid)!;
        const el = this.label(`${t.he}: ${st.he}`, this.kmPoint(st.x, st.z, 0.35), 'pin', () => {
          if (s.phase !== 'sites') return;
          this.act((ss) => ss.chooseTownSite(t.id, sid));
        });
        el.dataset.site = sid;
        el.dataset.town = t.id;
      }
    }
  }

  private buildTsunamiPins() {
    const s = this.session!;
    const st = s.def.site!;
    for (const c of st.sites) {
      const el = this.label(`⚓ ${c.he}`, this.kmPoint(c.x, c.z, 0.25), 'pin', () => this.act((ss) => ss.chooseCove(c.id)));
      el.dataset.cove = c.id;
    }
    for (const h of st.hills!) {
      const el = this.label(`⛰ ${h.he} <span class="ltr">${h.elev}</span> מ׳`, this.kmPoint(h.x, h.z, 0.45), 'pin', () => this.act((ss) => ss.chooseHill(h.id)));
      el.dataset.hill = h.id;
    }
  }

  private rebuildAfterRestart() {
    const s = this.session!;
    this.terrainKey = '';
    for (const l of this.labels.filter((x) => x.el.dataset.sample)) l.el.remove();
    this.labels = this.labels.filter((x) => !x.el.dataset.sample);
    for (const a of this.villagerActors.values()) a.play('idle');
    if (s.def.copy) {
      for (const c of this.collapsing) c.a.group.rotation.set(0, c.a.group.rotation.y, 0);
      this.collapsing = [];
    }
    this.syncTerrain(true);
  }

  // ───────── events → effects ─────────

  private drainEvents() {
    const s = this.session;
    if (!s) return;
    const evs = s.events.splice(0);
    for (const e of evs) this.effect(e);
    if (!s.outcome && evs.some((e) => e.type === 'mistake' || e.type === 'hint')) recordPending(this.progress, s.def.id, s.mistakes, s.hints);
  }

  private effect(e: GameEvent) {
    const s = this.session!;
    switch (e.type) {
      case 'run':
        this.audio.crackle();
        break;
      case 'boundary':
        this.audio.crackle();
        break;
      case 'flood':
        this.audio.whoosh();
        break;
      case 'volcano':
        this.audio.rumble(4.5);
        break;
      case 'quake': {
        this.world.quake(0.05 * Math.max(0, e.magnitude - 4.5));
        this.audio.rumble(e.magnitude);
        if (this.slab) {
          const el = this.label(`<span class="ltr">${e.magnitude.toFixed(1)}</span>`, this.kmPoint(e.x, e.z, 0.5), 'quakeburst', undefined, this.time + 1.6);
          el.setAttribute('aria-hidden', 'true');
        }
        for (const a of this.villagerActors.values()) a.play('panic');
        for (const a of this.actors) if (a.group.userData.dog) a.play('walk', { speed: 2.2 });
        window.setTimeout(() => {
          if (!this.session?.outcome) for (const a of this.villagerActors.values()) a.play('idle');
        }, 1400);
        break;
      }
      case 'mistake':
      case 'fail':
        this.audio.sting(false);
        this.audio.chirp(false);
        for (const a of this.villagerActors.values()) a.play(s.def.kind === 'heat' ? 'fall' : 'panic', { once: s.def.kind === 'heat' });
        if (e.type === 'fail') this.sulk(e.reason);
        break;
      case 'success':
        this.onSuccess();
        break;
      case 'collapse': {
        const a = this.houseActors.get(e.house);
        if (a) this.collapsing.push({ a, t: 0 });
        if (s.def.kind !== 'copy') this.collapseTownSite(e.house);
        break;
      }
      case 'wave':
        this.startWave();
        break;
      case 'sample':
        this.sampleLabel(e.x, e.z, e.value);
        break;
      case 'fire':
        this.globe?.showReadings(s.readings);
        this.audio.rumble(6);
        break;
      default:
        break;
    }
  }

  private sampleLabel(x: number, z: number, value: string | number) {
    const s = this.session!;
    let text = String(value);
    if (s.def.kind === 'dig') text = `<span class="ltr">${value}</span> מיליון שנה`;
    else if (s.def.seamAtPlume) text = `<span class="ltr">${value}°</span>`;
    else if (s.def.rocks) text = ROCK_HE[value as keyof typeof ROCK_HE] ?? text;
    const el = this.label(text, this.kmPoint(x, z, 0.3), 'pin passive');
    el.dataset.sample = '1';
    if (s.def.rocks) this.addActor('rocks', 0.12, x, z);
  }

  private collapseTownSite(townId: string) {
    const s = this.session!;
    const sites = s.def.site?.sites ?? s.def.israel?.sites ?? [];
    const st = sites.find((x) => x.id === s.townSites[townId]);
    if (!st || !this.slab) return;
    const a = this.addActor('house', 0.3, st.x, st.z);
    this.collapsing.push({ a, t: 0 });
  }

  private onSuccess() {
    const s = this.session!;
    this.audio.sting(true);
    this.audio.chirp(true);
    for (const a of this.villagerActors.values()) a.play('cheer');
    const d = s.def;
    if (this.slab && d.villagers?.length && d.villagers.some((vl) => vl.wish?.kind === 'seaBetween')) {
      // launch a boat on the new sea
      const a = s.villagerPos(d.villagers[0]);
      const b = s.villagerPos(d.villagers[1]);
      const mid = v((a.x + b.x) / 2, (a.z + b.z) / 2 + 20);
      this.addActor('boat', 0.32, mid.x, mid.z, { yaw: Math.PI / 2 });
    }
    if (d.kind === 'site' || d.kind === 'israel') {
      const sites = d.site?.sites ?? d.israel?.sites ?? [];
      for (const sid of Object.values(s.townSites)) {
        const st = sites.find((x) => x.id === sid);
        if (!st) continue;
        const a = this.addActor('house413', 0.32, st.x, st.z);
        const bdg = badge413();
        bdg.position.y = 0.55;
        a.group.add(bdg);
      }
      if (s.site) {
        this.addActor('house', 0.28, s.site.x, s.site.z);
        this.addActor('boat', 0.3, s.site.x + 30, s.site.z);
      }
    }
    if (!this.recorded && s.outcome) {
      this.recorded = true;
      recordResult(this.progress, { level: d.id, unaided: s.unaided, hinted: s.hints > 0, mistakes: s.mistakes, stars: s.outcome.stars, at: Date.now() });
      postToHost({ type: 'level-complete', level: d.id, stars: s.outcome.stars, durationMs: Math.round(performance.now() - this.startedAt) });
    }
  }

  private startWave() {
    if (!this.slab) return;
    const slab = this.slab;
    const g = new THREE.BoxGeometry(0.25, 12 * slab.yPerM * 1.4, slab.D * slab.S);
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: '#4fb6e8', transparent: true, opacity: 0.75, emissive: '#0a3550' }));
    this.wave = m;
    this.waveT = 0;
    this.extra.add(m);
    // the villagers run for the hill they were told to use
    const s = this.session!;
    const crowd = this.villagerActors.get('crowd');
    const cove = s.def.site!.sites.find((c) => c.id === s.cove);
    if (crowd && cove) {
      const w = slab.toWorld(cove.x + 0.3, cove.z);
      crowd.group.position.set(w.x, slab.surfaceY(cove.x + 0.3, cove.z), w.z);
      crowd.play('walk', { speed: 1.6 });
    }
  }

  // ───────── frame ─────────

  step(dt: number) {
    this.time += dt;
    const s = this.session;
    if (s && !this.paused && !this.showIntro) {
      if (s.phase === 'running') {
        const speed = s.duration / RUN_SECONDS(s.duration);
        s.advance(dt * speed);
        this.syncTerrain(s.phase !== 'running');
        this.drainEvents();
        if (s.phase !== 'running') this.afterAction();
        this.audio.setDrone(s.phase === 'running' ? 1 : 0);
      } else {
        this.audio.setDrone(0);
      }
      this.drainEvents();
    }
    for (const a of this.actors) a.update(this.paused ? 0 : dt);
    for (const c of this.collapsing) {
      c.t = Math.min(1, c.t + dt * 1.5);
      c.a.group.rotation.z = c.t * 1.2;
      c.a.group.scale.y = 1 - c.t * 0.6;
    }
    if (this.wave && this.slab && this.waveT >= 0) {
      this.waveT = Math.min(1, this.waveT + dt * 0.35);
      const slab = this.slab;
      const runup = (s?.def.site?.tsunami?.runupM ?? 12) * slab.yPerM;
      this.wave.position.set(-slab.halfW + this.waveT * slab.halfW * 1.1, runup * 0.5, 0);
      const crowd = this.villagerActors.get('crowd');
      const hill = s?.def.site?.hills?.find((h) => h.id === s.hill);
      if (crowd && hill) {
        const target = slab.toWorld(hill.x, hill.z);
        target.y = slab.surfaceY(hill.x, hill.z);
        crowd.group.position.lerp(target, Math.min(1, dt * (s?.evac?.safe ? 0.9 : 0.35)));
      }
      if (this.waveT >= 1) {
        this.extra.remove(this.wave);
        this.wave = null;
        this.waveT = -1;
      }
    }
    if (this.slab) {
      this.slab.heatView = this.heatView ? 1 : 0;
      this.slab.update(dt, this.time, this.world.camera);
    }
    this.globe?.update(dt, this.time);
    if (s?.def.wegener) this.syncPieces();
    if (this.screen === 'select') this.world.nudgeOrbit(dt * 0.04, 0);
    this.world.update(dt);
    this.updateLabels();
  }

  /** The villagers say, in a picture and a few words, what they got instead of what they wanted. */
  private sulk(reason: string) {
    const said = reason === 'sulkFishing' ? '🎣 רצינו הר…' : reason.startsWith('too') ? '🤔 לא מה שביקשנו' : '😞';
    for (const a of this.villagerActors.values()) {
      if (!a.group.userData.villager) continue;
      const el = this.label(said, () => {
        const p = a.group.position.clone();
        p.y += 0.6;
        return p;
      }, 'bubble sad', undefined, this.time + 8);
      el.setAttribute('aria-hidden', 'true');
    }
  }

  private updateLabels() {
    const w = this.world.container.clientWidth;
    const h = this.world.container.clientHeight;
    const cam = this.world.camera;
    this.labels = this.labels.filter((l) => {
      if (l.until !== undefined && this.time > l.until) {
        l.el.remove();
        return false;
      }
      return true;
    });
    for (const l of this.labels) {
      const p = l.at();
      if (!p || this.labelHidden(l.el)) {
        l.el.style.display = 'none';
        continue;
      }
      const q = p.clone().project(cam);
      if (q.z > 1) {
        l.el.style.display = 'none';
        continue;
      }
      l.el.style.display = '';
      let x = ((q.x + 1) / 2) * w;
      let y = ((1 - q.y) / 2) * h;
      // the compass sits on the slab corner, which can leave a narrow screen
      if (l.el.classList.contains('compass')) {
        x = Math.min(Math.max(x, 44), w - 44);
        y = Math.min(Math.max(y, 90), h - 40);
      }
      l.el.style.left = `${x}px`;
      l.el.style.top = `${y}px`;
      l.el.style.marginTop = '0px';
    }
    this.declutterLabels();
    // selection state on pins
    const s = this.session;
    if (!s) return;
    for (const l of this.labels) {
      const ds = l.el.dataset;
      if (ds.site) l.el.classList.toggle('sel', s.townSites[ds.town!] === ds.site);
      if (ds.cove) l.el.classList.toggle('sel', s.cove === ds.cove);
      if (ds.hill) l.el.classList.toggle('sel', s.hill === ds.hill);
      if (ds.villager && s.phase !== 'plan') l.el.style.opacity = '0';
    }
  }

  /** In the final, the town sites appear only once the land is built: no labels while you shape it. */
  private labelHidden(el: HTMLElement): boolean {
    const s = this.session;
    return !!s && s.def.kind === 'israel' && !!el.dataset.site && s.phase !== 'sites' && !s.outcome;
  }

  /** Pins that would overlap stack upward instead, nearest the camera first. */
  private declutterLabels() {
    const shown = this.labels.filter((l) => l.el.style.display !== 'none');
    const boxes = shown.map((l) => ({ l, r: l.el.getBoundingClientRect() }));
    boxes.sort((a, b) => b.r.bottom - a.r.bottom);
    const placed: { left: number; right: number; top: number; bottom: number }[] = [];
    for (const { l, r } of boxes) {
      let dy = 0;
      for (let k = 0; k < 10; k++) {
        const hit = placed.find((o) => r.left < o.right + 2 && r.right > o.left - 2 && r.top + dy < o.bottom + 2 && r.bottom + dy > o.top - 2);
        if (!hit) break;
        dy = hit.top - 3 - r.bottom;
      }
      // never drift far from the place a pin names: past two rows, overlap a little instead
      dy = Math.max(dy, -2.2 * r.height);
      if (dy) l.el.style.marginTop = `${dy}px`;
      placed.push({ left: r.left, right: r.right, top: r.top + dy, bottom: r.bottom + dy });
    }
  }

  render() {
    this.world.render();
  }

  // ───────── input ─────────

  private pick(clientX: number, clientY: number): { x: number; z: number; world: THREE.Vector3 } | null {
    const r = this.world.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.world.camera);
    if (this.globe) {
      const hit = this.raycaster.intersectObjects(this.globe.pickables(), false)[0];
      return hit ? { x: hit.point.x, z: hit.point.y, world: hit.point } : null;
    }
    if (!this.slab) return null;
    const hit = this.raycaster.intersectObjects(this.slab.pickables(), false)[0];
    if (!hit) {
      // allow aiming just past the shore: intersect the sea-level plane
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const p = new THREE.Vector3();
      if (!this.raycaster.ray.intersectPlane(plane, p)) return null;
      const km = this.slab.toKm(p);
      if (km.x < 0 || km.z < 0 || km.x > this.slab.W || km.z > this.slab.D) return null;
      return { ...km, world: p };
    }
    return { ...this.slab.toKm(hit.point), world: hit.point };
  }

  private heatUnder(clientX: number, clientY: number): string | null {
    if (!this.slab) return null;
    const r = this.world.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.world.camera);
    return this.slab.heatAt(this.raycaster);
  }

  private pieceUnder(clientX: number, clientY: number): string | null {
    if (!this.pieceMeshes.size) return null;
    const r = this.world.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.world.camera);
    const hit = this.raycaster.intersectObjects([...this.pieceMeshes.values()], true)[0];
    return (hit?.object.userData.piece as string) ?? null;
  }

  /** A tap on the scene with the current tool. */
  tapAt(clientX: number, clientY: number) {
    const s = this.session;
    if (!s || this.paused || this.showIntro) return;
    this.audio.unlock();
    if (this.globe) {
      const p = this.pick(clientX, clientY);
      if (!p) return;
      const r = Math.hypot(p.world.x, p.world.y);
      if (r > this.globe.radius * 0.93 || this.tool === 'station') {
        s.placeStation(this.globe.angleFromPoint(p.world));
        this.globe.setStations(s.stations);
      } else if (s.fired) {
        const layer = this.globe.layerFromPoint(p.world);
        s.mark(layer);
        this.globe.mark(layer);
      }
      this.afterAction();
      return;
    }
    const heatId = s.phase === 'plan' ? this.heatUnder(clientX, clientY) : null;
    if (heatId) {
      const h = s.heats.find((q) => q.id === heatId);
      if (h && !h.fixed) {
        this.selectedHeat = this.selectedHeat === heatId ? null : heatId;
        this.tool = null;
        this.syncHeats();
        this.touch();
        return;
      }
    }
    const piece = s.def.wegener && !s.accepted ? this.pieceUnder(clientX, clientY) : null;
    if (piece) {
      this.selectedPiece = piece;
      this.touch();
      return;
    }
    const p = this.pick(clientX, clientY);
    if (!p) return;
    const t = this.tool;
    if (t === 'plume' || t === 'drip') return this.placeHeat(t, p.x, p.z);
    if (t === 'probe') return this.act((ss) => ss.probe(p.x, p.z));
    if (t === 'age') return this.act((ss) => ss.sampleAge(p.x, p.z));
    if (t === 'dig') return this.act((ss) => ss.dig(p.x, p.z));
    if (t === 'hammer' || (s.phase === 'collect' && s.def.rocks)) return this.act((ss) => ss.hammer(p.x, p.z));
    if (t === 'site' || (s.def.site?.kind === 'quakes' && s.phase === 'sites')) return this.act((ss) => ss.adviseSite(p.x, p.z));
    if (s.def.wegener && !s.accepted && this.selectedPiece) {
      const pose = s.pieces[this.selectedPiece];
      return this.act((ss) => ss.movePiece(this.selectedPiece!, p.x, p.z, pose.rot));
    }
    if (this.selectedHeat) {
      this.selectedHeat = null;
      this.syncHeats();
      this.touch();
    }
  }

  private bindInput() {
    const el = this.world.renderer.domElement;
    const pointers = new Map<number, { x: number; y: number; sx: number; sy: number; button: number }>();
    let dragHeat: string | null = null;
    let dragPiece: string | null = null;
    let pinch = 0;
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    el.addEventListener('pointerdown', (e) => {
      el.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, button: e.button });
      const s = this.session;
      dragHeat = null;
      dragPiece = null;
      if (pointers.size === 1 && e.button === 0 && s?.phase === 'plan') {
        const id = this.heatUnder(e.clientX, e.clientY);
        const h = id ? s.heats.find((q) => q.id === id) : null;
        if (h && !h.fixed) dragHeat = id;
        if (!dragHeat && s.def.wegener && !s.accepted) dragPiece = this.pieceUnder(e.clientX, e.clientY);
      }
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinch = Math.hypot(a.x - b.x, a.y - b.y);
      }
    });
    el.addEventListener('pointermove', (e) => {
      const p = pointers.get(e.pointerId);
      if (!p) return;
      const dx = e.clientX - p.x;
      const dy = e.clientY - p.y;
      p.x = e.clientX;
      p.y = e.clientY;
      const moved = Math.hypot(e.clientX - p.sx, e.clientY - p.sy) > 6;
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch > 0) this.world.nudgeOrbit(0, 0, (pinch - d) / 300);
        pinch = d;
        this.world.nudgeOrbit(-dx * 0.002, -dy * 0.002);
        return;
      }
      if (dragHeat && moved && this.session) {
        const q = this.pick(e.clientX, e.clientY);
        if (q) {
          this.session.moveHeat(dragHeat, q.x, q.z);
          this.selectedHeat = dragHeat;
          this.syncHeats();
        }
        return;
      }
      if (dragPiece && moved && this.session) {
        const q = this.pick(e.clientX, e.clientY);
        if (q) {
          this.selectedPiece = dragPiece;
          this.session.movePiece(dragPiece, q.x, q.z, this.session.pieces[dragPiece].rot);
        }
        return;
      }
      if (moved) this.world.nudgeOrbit(-dx * 0.005, -dy * 0.004);
    });
    const end = (e: PointerEvent) => {
      const p = pointers.get(e.pointerId);
      pointers.delete(e.pointerId);
      if (!p) return;
      const moved = Math.hypot(e.clientX - p.sx, e.clientY - p.sy) > 6;
      if (dragHeat && moved) {
        dragHeat = null;
        this.afterAction();
        return;
      }
      if (dragPiece && moved) {
        dragPiece = null;
        this.touch();
        return;
      }
      dragHeat = null;
      dragPiece = null;
      if (!moved && p.button === 0 && pointers.size === 0) this.tapAt(e.clientX, e.clientY);
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', (e) => pointers.delete(e.pointerId));
    el.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        if (e.shiftKey && this.selectedPiece && this.session && !this.session.accepted) {
          this.act((s) => s.rotatePiece(this.selectedPiece!, e.deltaY > 0 ? 0.05 : -0.05));
          return;
        }
        this.world.nudgeOrbit(0, 0, e.deltaY * 0.001);
      },
      { passive: false },
    );
    // only a running simulation pauses when focus leaves; planning just waits
    window.addEventListener('blur', () => {
      if (this.session && this.screen === 'play' && this.session.phase === 'running') {
        this.paused = true;
        this.touch();
      }
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.session && this.screen === 'play' && this.session.phase === 'running') {
        this.paused = true;
        this.touch();
      }
    });
  }

  /** Keyboard: physical keys so a Hebrew layout works. */
  key(e: KeyboardEvent) {
    const s = this.session;
    const c = e.code;
    if (c === 'KeyM') return this.toggleMute();
    if (this.screen !== 'play' || !s) return;
    if (c === 'Escape' || c === 'KeyP') {
      if (this.showIntro) this.showIntro = false;
      else this.paused = !this.paused;
      return this.touch();
    }
    if (this.paused || this.showIntro) {
      if (c === 'Enter' || c === 'Space') {
        this.showIntro = false;
        this.paused = false;
        this.touch();
        e.preventDefault();
      }
      return;
    }
    if (c === 'KeyQ') return this.world.nudgeOrbit(-0.15, 0);
    if (c === 'KeyE') return this.world.nudgeOrbit(0.15, 0);
    if (c === 'Equal' || c === 'NumpadAdd') return this.world.nudgeOrbit(0, 0, -0.1);
    if (c === 'Minus' || c === 'NumpadSubtract') return this.world.nudgeOrbit(0, 0, 0.1);
    if (c === 'KeyH') return this.hint();
    if (c === 'KeyR') return this.restart();
    if (c === 'Space') {
      e.preventDefault();
      return this.run();
    }
    if (c === 'BracketLeft') return this.stepDuration(-1);
    if (c === 'BracketRight') return this.stepDuration(1);
    if (c === 'Digit1' && s.canPlaceHeat('plume')) return this.setTool('plume');
    if (c === 'Digit2' && s.canPlaceHeat('drip')) return this.setTool('drip');
    if ((c === 'Delete' || c === 'Backspace') && this.selectedHeat) return this.removeSelectedHeat();
    if (this.selectedHeat && c.startsWith('Arrow')) {
      const h = s.heats.find((q) => q.id === this.selectedHeat);
      if (!h) return;
      const step = (s.def.heatSnapKm ?? 10) * Math.max(1, Math.round(s.def.base.widthKm / 40 / (s.def.heatSnapKm ?? 10)));
      const dx = c === 'ArrowRight' ? step : c === 'ArrowLeft' ? -step : 0;
      const dz = c === 'ArrowDown' ? step : c === 'ArrowUp' ? -step : 0;
      e.preventDefault();
      s.moveHeat(h.id, h.x + dx, h.z + dz);
      return this.afterAction();
    }
    if (this.tool && (this.tool === 'plume' || this.tool === 'drip') && c === 'Enter') {
      // keyboard placement: drop in the north-west quarter (never a free answer), then move with the arrows
      return this.placeHeat(this.tool, s.def.base.widthKm / 4, s.def.base.depthKm / 4);
    }
  }

  /** Choice lists come in a new order on every attempt, so "always the first one" is not a strategy. */
  private orderSeed = Math.random();
  shuffled<T extends { id: string }>(xs: T[]): T[] {
    const h = (id: string) => {
      let v = Math.floor(this.orderSeed * 1e9);
      for (const ch of id) v = (v * 31 + ch.charCodeAt(0)) % 1000003;
      return v;
    };
    return [...xs].sort((a, b) => h(a.id) - h(b.id));
  }

  levels(): LevelDef[] {
    return LEVELS;
  }

  /** Deterministic stepping for tests: ms of game time in 60 Hz steps. */
  advanceTime(ms: number) {
    const steps = Math.max(1, Math.round(ms / (1000 / 60)));
    for (let i = 0; i < steps; i++) this.step(1 / 60);
    this.render();
  }

  textState(): string {
    const s = this.session;
    const base: Record<string, unknown> = {
      screen: this.screen,
      paused: this.paused,
      intro: this.showIntro,
      tool: this.tool,
      selectedHeat: this.selectedHeat,
      heatView: this.heatView,
      muted: this.audio.muted,
      stars: this.progress.stars,
    };
    if (s) Object.assign(base, s.snapshot());
    if (this.screen === 'select') base.levels = LEVELS.map((l) => ({ id: l.id, title: l.title, stars: this.progress.stars[l.id] ?? 0 }));
    return JSON.stringify(base);
  }
}

export { softDot };
