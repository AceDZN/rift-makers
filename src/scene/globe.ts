// Level 2: the whole planet cut in half. Seismograph stations sit on the rim;
// waves travel as straight chords from the quake at the top.

import * as THREE from 'three';
import { LAYERS, EARTH_RADIUS_KM, CORE_RADIUS_KM, type LayerId, type StationReading } from '../model/earth.ts';
import { Actor } from './actors.ts';

const R = 4.2;
const LAYER_COLORS: Record<LayerId, string> = {
  crust: '#8a7560',
  upperMantle: '#c2401d',
  lowerMantle: '#8c1e12',
  outerCore: '#ffb12e',
  innerCore: '#fff2c4',
};

export class GlobeView {
  readonly group = new THREE.Group();
  private rings: THREE.Mesh[] = [];
  private stationActors = new Map<number, Actor>();
  private rays = new THREE.Group();
  private marked: THREE.Mesh | null = null;
  private pulses: { line: THREE.Line; t: number; len: number }[] = [];
  readonly radius = R;

  constructor() {
    // layers from the outside in
    for (const L of LAYERS) {
      const outer = (R * (EARTH_RADIUS_KM - L.top)) / EARTH_RADIUS_KM;
      const inner = (R * Math.max(0, EARTH_RADIUS_KM - L.bottom)) / EARTH_RADIUS_KM;
      const g = inner > 0 ? new THREE.RingGeometry(Math.max(inner, 0.001), outer, 96, 1) : new THREE.CircleGeometry(outer, 96);
      const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: LAYER_COLORS[L.id], side: THREE.DoubleSide }));
      m.userData.layer = L.id;
      m.position.z = 0.001 * LAYERS.indexOf(L);
      this.rings.push(m);
      this.group.add(m);
    }
    // the crust is drawn thicker than true scale so it can be seen
    const crust = this.rings[0];
    crust.geometry.dispose();
    crust.geometry = new THREE.RingGeometry(R - 0.12, R, 128, 1);
    // back half: a dark dome so it reads as a sphere cut open
    const back = new THREE.Mesh(new THREE.SphereGeometry(R, 48, 32, 0, Math.PI), new THREE.MeshStandardMaterial({ color: '#2d5f86', roughness: 0.8 }));
    back.rotation.y = Math.PI / 2;
    back.position.z = -0.01;
    back.rotation.y = Math.PI;
    this.group.add(back);
    // the quake at the top
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.16), new THREE.MeshBasicMaterial({ color: '#ff3b2f' }));
    star.position.set(0, R + 0.05, 0.05);
    star.name = 'quake';
    this.group.add(star);
    this.group.add(this.rays);
  }

  /** Point on the rim at `deg` from the quake (measured clockwise, toward the east). */
  rimPoint(deg: number, r = R): THREE.Vector3 {
    const a = (deg * Math.PI) / 180;
    return new THREE.Vector3(r * Math.sin(a), r * Math.cos(a), 0.06);
  }

  angleFromPoint(p: THREE.Vector3): number {
    return Math.abs((Math.atan2(p.x, p.y) * 180) / Math.PI);
  }

  pickables() {
    return this.rings;
  }

  layerFromPoint(p: THREE.Vector3): LayerId {
    const r = Math.hypot(p.x, p.y);
    const depth = EARTH_RADIUS_KM * (1 - r / R);
    for (const L of LAYERS) if (depth < L.bottom) return L.id;
    return 'innerCore';
  }

  setStations(angles: number[]) {
    for (const [a, act] of this.stationActors) {
      if (!angles.includes(a)) {
        act.dispose();
        this.stationActors.delete(a);
      }
    }
    for (const a of angles) {
      if (this.stationActors.has(a)) continue;
      const act = new Actor('seismograph', 0.5);
      const p = this.rimPoint(a, R + 0.02);
      act.group.position.copy(p);
      act.group.rotation.z = (-a * Math.PI) / 180;
      this.group.add(act.group);
      this.stationActors.set(a, act);
    }
  }

  showReadings(readings: StationReading[]) {
    while (this.rays.children.length) (this.rays.children.pop() as THREE.Line).geometry.dispose();
    this.pulses = [];
    const top = this.rimPoint(0);
    for (const r of readings) {
      const end = this.rimPoint(r.angleDeg);
      // the wave that passes everything
      const a = new THREE.Line(new THREE.BufferGeometry().setFromPoints([top, end]), new THREE.LineBasicMaterial({ color: '#ffffff' }));
      this.rays.add(a);
      this.pulses.push({ line: a, t: 0, len: 1 });
      // the wave that stops at liquid: dashed, and cut where it meets the outer core
      const chordMin = Math.cos(((r.angleDeg / 2) * Math.PI) / 180) * R;
      const coreR = (CORE_RADIUS_KM / EARTH_RADIUS_KM) * R;
      let stop = end;
      if (chordMin <= coreR) {
        // first point where the chord enters the core
        for (let k = 0; k <= 200; k++) {
          const p = top.clone().lerp(end, k / 200);
          if (Math.hypot(p.x, p.y) <= coreR) {
            stop = p;
            break;
          }
        }
      }
      const off = new THREE.Vector3(0.06, 0, 0.01);
      const b = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([top.clone().add(off), stop.clone().add(off)]),
        new THREE.LineDashedMaterial({ color: '#7fe3ff', dashSize: 0.12, gapSize: 0.08 }),
      );
      b.computeLineDistances();
      this.rays.add(b);
      if (stop !== end) {
        const x = new THREE.Mesh(new THREE.RingGeometry(0.06, 0.11, 16), new THREE.MeshBasicMaterial({ color: '#7fe3ff' }));
        x.position.copy(stop).add(off);
        this.rays.add(x as unknown as THREE.Line);
      }
    }
  }

  mark(layer: LayerId | null) {
    if (this.marked) {
      this.group.remove(this.marked);
      this.marked = null;
    }
    if (!layer) return;
    const ring = this.rings.find((r) => r.userData.layer === layer)!;
    const m = new THREE.Mesh(ring.geometry, new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.35, side: THREE.DoubleSide }));
    m.position.z = 0.02;
    this.marked = m;
    this.group.add(m);
  }

  update(dt: number, time: number) {
    for (const a of this.stationActors.values()) a.update(dt);
    const q = this.group.getObjectByName('quake');
    if (q) q.scale.setScalar(1 + 0.2 * Math.sin(time * 6));
  }

  dispose() {
    for (const a of this.stationActors.values()) a.dispose();
    this.group.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
    });
  }
}
