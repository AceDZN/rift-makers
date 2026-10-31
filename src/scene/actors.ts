// Tripo models (ASSETS.md, public/models/manifest.json): loading, cloning
// rigged characters, and their animation. Models are decoration only; they
// are never colliders or geography.

import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';

export type ModelId =
  | 'pebble'
  | 'scientist'
  | 'dog'
  | 'house'
  | 'house413'
  | 'seismograph'
  | 'warning_tower'
  | 'hot_spring'
  | 'ammonite'
  | 'observatory'
  | 'boat'
  | 'rocks'
  | 'olive'
  | 'cypress';

interface ManifestEntry {
  file: string;
  clips: Record<string, string>;
  heightUnits: number;
  rigged?: boolean;
}

const loader = new GLTFLoader();
let manifest: Record<string, ManifestEntry> | null = null;
const cache = new Map<string, Promise<GLTF | null>>();

async function getManifest(): Promise<Record<string, ManifestEntry>> {
  if (manifest) return manifest;
  try {
    const r = await fetch('./models/manifest.json');
    manifest = (await r.json()) as Record<string, ManifestEntry>;
  } catch {
    manifest = {};
  }
  return manifest;
}

async function load(id: ModelId): Promise<{ gltf: GLTF; entry: ManifestEntry } | null> {
  const m = await getManifest();
  const entry = m[id];
  if (!entry) return null;
  if (!cache.has(id)) cache.set(id, loader.loadAsync('./' + entry.file).catch(() => null));
  const gltf = await cache.get(id)!;
  return gltf ? { gltf, entry } : null;
}

export function preloadModels(ids: ModelId[]) {
  for (const id of ids) void load(id);
}

/** A placed model; rigged ones animate through `play`. */
export class Actor {
  readonly group = new THREE.Group();
  mixer: THREE.AnimationMixer | null = null;
  private clips: Record<string, THREE.AnimationClip> = {};
  private names: Record<string, string> = {};
  private current: THREE.AnimationAction | null = null;
  private wanted: string | null = null;
  ready: Promise<void>;
  readonly id: ModelId;

  constructor(id: ModelId, height: number, opts: { tint?: string; faceYaw?: number } = {}) {
    this.id = id;
    this.ready = load(id).then((res) => {
      if (!res) {
        // a simple stand-in so the scene still reads if a model fails
        const s = new THREE.Mesh(new THREE.SphereGeometry(height * 0.4, 12, 10), new THREE.MeshStandardMaterial({ color: '#b9ad9b' }));
        s.position.y = height * 0.4;
        this.group.add(s);
        return;
      }
      const { gltf, entry } = res;
      const obj = entry.rigged ? cloneSkinned(gltf.scene) : gltf.scene.clone(true);
      const s = height / (entry.heightUnits || 1);
      obj.scale.setScalar(s);
      if (opts.faceYaw) obj.rotation.y = opts.faceYaw;
      obj.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) {
          m.castShadow = true;
          m.receiveShadow = true;
          if (opts.tint && m.material) {
            const mat = (m.material as THREE.MeshStandardMaterial).clone();
            mat.color = mat.color.clone().multiply(new THREE.Color(opts.tint));
            m.material = mat;
          }
        }
      });
      this.group.add(obj);
      if (gltf.animations.length) {
        this.mixer = new THREE.AnimationMixer(obj);
        for (const c of gltf.animations) this.clips[c.name] = c;
        this.names = entry.clips;
        if (this.wanted) this.play(this.wanted);
        else if (this.names.idle) this.play('idle');
        else if (this.names.walk) this.play('walk');
      }
    });
  }

  /** Play a role clip (idle, cheer, panic, fall, build, walk…), crossfading. */
  play(role: string, opts: { once?: boolean; speed?: number } = {}) {
    this.wanted = role;
    if (!this.mixer) return;
    const name = this.names[role] ?? role;
    const clip = this.clips[name] ?? Object.values(this.clips)[0];
    if (!clip) return;
    const a = this.mixer.clipAction(clip);
    if (a === this.current && !opts.once) return;
    a.reset();
    a.setLoop(opts.once ? THREE.LoopOnce : THREE.LoopRepeat, Infinity);
    a.clampWhenFinished = !!opts.once;
    a.timeScale = opts.speed ?? 1;
    a.time = Math.random() * 0.3;
    if (this.current) a.crossFadeFrom(this.current, 0.3, false);
    a.play();
    this.current = a;
  }

  update(dt: number) {
    this.mixer?.update(dt);
  }

  dispose() {
    this.group.removeFromParent();
    this.mixer?.stopAllAction();
  }
}

/** A floating green "413" shield over a reinforced house (the model has no text). */
export function badge413(): THREE.Sprite {
  if (badgeTex) return badgeSprite(badgeTex);
  const c = document.createElement('canvas');
  c.width = 96;
  c.height = 112;
  const g = c.getContext('2d')!;
  g.fillStyle = '#1f8a4c';
  g.beginPath();
  g.moveTo(48, 4);
  g.lineTo(90, 18);
  g.lineTo(84, 70);
  g.lineTo(48, 106);
  g.lineTo(12, 70);
  g.lineTo(6, 18);
  g.closePath();
  g.fill();
  g.strokeStyle = '#ffffff';
  g.lineWidth = 5;
  g.stroke();
  g.fillStyle = '#ffffff';
  g.font = 'bold 36px Rubik, sans-serif';
  g.textAlign = 'center';
  g.fillText('413', 48, 66);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  badgeTex = t;
  return badgeSprite(t);
}

let badgeTex: THREE.Texture | null = null;

function badgeSprite(t: THREE.Texture) {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false }));
  sp.scale.set(0.16, 0.19, 1);
  return sp;
}
