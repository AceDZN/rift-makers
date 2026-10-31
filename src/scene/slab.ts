// The floating slab: generated heightfield, sea, strata walls, the mantle box
// with its convection, heat markers, flow arrows and seams. Everything is
// drawn from model state; nothing here decides geography.

import * as THREE from 'three';
import type { Terrain, Boundary } from '../model/terrain.ts';
import { MAT, SNOWLINE_M } from '../model/terrain.ts';
import type { Heat } from '../model/heat.ts';
import type { LevelDef } from '../model/levels.ts';

const MAT_COLOR: Record<number, THREE.Color> = {
  [MAT.seafloor]: new THREE.Color('#5b6f7a'),
  [MAT.basalt]: new THREE.Color('#33333b'),
  [MAT.sand]: new THREE.Color('#e9d6a0'),
  [MAT.grass]: new THREE.Color('#6d9b43'),
  [MAT.rock]: new THREE.Color('#8c7b69'),
  [MAT.limestone]: new THREE.Color('#ddd2b2'),
  [MAT.fertile]: new THREE.Color('#556b25'),
  [MAT.fault]: new THREE.Color('#b8482a'),
  [MAT.desert]: new THREE.Color('#d4a86a'),
  [MAT.road]: new THREE.Color('#5a5550'),
  [MAT.river]: new THREE.Color('#3f7fb2'),
  [MAT.dunes]: new THREE.Color('#f1dfa6'),
  [MAT.canyon]: new THREE.Color('#a5653d'),
  [MAT.chalk]: new THREE.Color('#efede2'),
};
const SNOW = new THREE.Color('#f6f8ff');

export const CRUST_BOTTOM = -1.75;
export const MANTLE_BOTTOM = -4.6;

const MANTLE_VS = /* glsl */ `
varying vec2 vUv;
varying vec3 vPos;
void main() {
  vUv = uv;
  vPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

// Convection in the cutaway: a stream function from the heats, drawn as
// glowing ribbons that drift, plus hot columns over plumes and cold ones over drips.
const MANTLE_FS = /* glsl */ `
uniform vec4 uHeat[8];
uniform int uCount;
uniform float uTime;
uniform float uAxis; // 0: face runs along x, 1: along z
uniform float uOther; // this face's position on the other axis (0..1)
uniform float uHeatView;
varying vec2 vUv;
varying vec3 vPos;

vec3 ramp(float t) {
  vec3 a = vec3(0.30, 0.03, 0.02);
  vec3 b = vec3(0.72, 0.10, 0.03);
  vec3 c = vec3(1.00, 0.42, 0.08);
  vec3 d = vec3(1.00, 0.84, 0.42);
  if (t < 0.4) return mix(a, b, t / 0.4);
  if (t < 0.75) return mix(b, c, (t - 0.4) / 0.35);
  return mix(c, d, clamp((t - 0.75) / 0.25, 0.0, 1.0));
}

void main() {
  float u = vUv.x;
  float h = vUv.y; // 1 top, 0 bottom
  float s = sin(3.14159 * h);
  float psi = 0.03 * sin(u * 6.2831 * 1.5 + 0.7) * s;
  float hot = 0.0;
  float cold = 0.0;
  for (int i = 0; i < 8; i++) {
    if (i >= uCount) break;
    vec4 hh = uHeat[i];
    float a = uAxis < 0.5 ? hh.x : hh.z;
    float o = uAxis < 0.5 ? hh.z : hh.x;
    float w = exp(-pow((o - uOther) / 0.6, 2.0)) * hh.w;
    float dx = (u - a) / 0.16;
    psi += -hh.y * w * dx * exp(-dx * dx) * s * 1.6;
    float col = exp(-dx * dx * 6.0) * w;
    if (hh.y > 0.0) hot += col; else cold += col;
  }
  float stripes = fract(psi * 5.0 - uTime * 0.12);
  float ribbon = smoothstep(0.0, 0.08, stripes) * (1.0 - smoothstep(0.12, 0.3, stripes));
  ribbon *= smoothstep(0.015, 0.09, abs(psi)) * 0.8 + 0.2;
  float t = 0.38 + 0.32 * (1.0 - h) + 0.55 * hot * (0.6 + 0.4 * h) - 0.25 * cold;
  t += 0.5 * smoothstep(0.16, 0.0, h); // the core glows below
  t += ribbon * 0.22;
  vec3 c = ramp(clamp(t, 0.0, 1.0));
  vec3 blue = vec3(0.15, 0.45, 1.0);
  c = mix(c, blue * (0.6 + ribbon * 0.8), clamp(cold * 0.85, 0.0, 0.85));
  c += vec3(1.0, 0.7, 0.3) * hot * 0.45 * (0.7 + 0.3 * sin(uTime * 3.0 + h * 20.0));
  // grain
  float g = fract(sin(dot(floor(vPos.xy * 40.0 + vPos.z * 40.0), vec2(12.9898, 78.233))) * 43758.5453);
  c *= 0.9 + 0.1 * g;
  c *= mix(1.0, 1.25, uHeatView);
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`;

const WALL_VS = /* glsl */ `
attribute float topY;
attribute vec3 topColor;
varying float vDepth;
varying float vY;
varying vec3 vTop;
varying vec3 vPos;
void main() {
  vDepth = topY - position.y;
  vY = position.y;
  vTop = topColor;
  vPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const WALL_FS = /* glsl */ `
uniform float uBottom;
uniform float uTime;
varying float vDepth;
varying float vY;
varying vec3 vTop;
varying vec3 vPos;
void main() {
  vec3 soil = vTop * 0.8;
  vec3 sed1 = vec3(0.78, 0.68, 0.52);
  vec3 sed2 = vec3(0.62, 0.50, 0.38);
  vec3 crust = vec3(0.42, 0.36, 0.33);
  float band = step(0.5, fract(vY * 7.0 + sin(vPos.x * 3.0 + vPos.z * 2.0) * 0.08));
  vec3 c = mix(sed1, sed2, band);
  c = mix(soil, c, smoothstep(0.03, 0.09, vDepth));
  c = mix(c, crust, (1.0 - smoothstep(0.3, 0.9, vY - uBottom)) * 0.8);
  float glow = 1.0 - smoothstep(0.0, 0.35, vY - uBottom);
  c = mix(c, vec3(1.0, 0.35, 0.08), glow * 0.75);
  float g = fract(sin(dot(floor(vPos.xy * 30.0 + vPos.z * 30.0), vec2(12.9898, 78.233))) * 43758.5453);
  c *= 0.86 + 0.14 * g;
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`;

const WATER_VS = /* glsl */ `
attribute float wet;
attribute float depth;
uniform float uTime;
varying float vWet;
varying float vDepth;
varying vec3 vWorld;
void main() {
  vWet = wet;
  vDepth = depth;
  vec3 p = position;
  p.y += sin(p.x * 3.0 + uTime * 1.3) * 0.006 + cos(p.z * 2.6 + uTime) * 0.006;
  vec4 w = modelMatrix * vec4(p, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const WATER_FS = /* glsl */ `
uniform float uTime;
uniform vec3 uCam;
varying float vWet;
varying float vDepth;
varying vec3 vWorld;
void main() {
  if (vWet < 0.5) discard;
  vec3 shallow = vec3(0.18, 0.80, 0.82);
  vec3 deep = vec3(0.02, 0.16, 0.42);
  float k = clamp(vDepth / 3.0, 0.0, 1.0);
  vec3 c = mix(shallow, deep, pow(k, 0.6));
  vec3 v = normalize(uCam - vWorld);
  float fres = pow(1.0 - max(v.y, 0.0), 3.0);
  c = mix(c, vec3(0.75, 0.88, 1.0), fres * 0.35);
  float sparkle = pow(max(0.0, sin(vWorld.x * 18.0 + uTime * 2.0) * sin(vWorld.z * 15.0 - uTime * 1.7)), 12.0);
  c += sparkle * 0.35;
  float foam = 1.0 - smoothstep(0.0, 0.012, vDepth);
  c = mix(c, vec3(0.95, 0.98, 1.0), foam * 0.7);
  gl_FragColor = vec4(c, mix(0.72, 0.9, k));
  #include <colorspace_fragment>
}`;

export class SlabView {
  readonly group = new THREE.Group();
  readonly def: LevelDef;
  readonly W: number;
  readonly D: number;
  readonly S: number;
  yPerM: number;
  private terrainMesh: THREE.Mesh | null = null;
  private waterMesh: THREE.Mesh | null = null;
  private walls: THREE.Mesh | null = null;
  private waterWalls: THREE.Mesh | null = null;
  private mantle: THREE.Mesh[] = [];
  private mantleMats: THREE.ShaderMaterial[] = [];
  private wallMat: THREE.ShaderMaterial;
  private waterMat: THREE.ShaderMaterial;
  private heatGroup = new THREE.Group();
  private arrows: THREE.InstancedMesh | null = null;
  private seamGroup = new THREE.Group();
  private particles: THREE.Points | null = null;
  private partState: Float32Array | null = null;
  private heats: Heat[] = [];
  private smoke: THREE.Sprite[] = [];
  private smokeTex: THREE.Texture;
  terrain: Terrain | null = null;
  heatView = 0;

  constructor(def: LevelDef) {
    this.def = def;
    this.W = def.base.widthKm;
    this.D = def.base.depthKm;
    this.S = 10 / Math.max(this.W, this.D * 1.15);
    this.yPerM = 0.00024 * (def.relief ?? 1);
    this.wallMat = new THREE.ShaderMaterial({ vertexShader: WALL_VS, fragmentShader: WALL_FS, uniforms: { uBottom: { value: CRUST_BOTTOM }, uTime: { value: 0 } } });
    this.waterMat = new THREE.ShaderMaterial({
      vertexShader: WATER_VS,
      fragmentShader: WATER_FS,
      uniforms: { uTime: { value: 0 }, uCam: { value: new THREE.Vector3() } },
      transparent: true,
      depthWrite: false,
    });
    this.smokeTex = softDot();
    this.buildMantle();
    this.group.add(this.heatGroup, this.seamGroup);
  }

  get halfW() {
    return (this.W * this.S) / 2;
  }

  get halfD() {
    return (this.D * this.S) / 2;
  }

  toWorld(x: number, z: number, elevM = 0): THREE.Vector3 {
    return new THREE.Vector3((x - this.W / 2) * this.S, elevM * this.yPerM, (z - this.D / 2) * this.S);
  }

  toKm(p: THREE.Vector3): { x: number; z: number } {
    return { x: p.x / this.S + this.W / 2, z: p.z / this.S + this.D / 2 };
  }

  /** Surface height (world units) at km position, from the current terrain. */
  surfaceY(x: number, z: number): number {
    const t = this.terrain;
    if (!t) return 0;
    const fi = THREE.MathUtils.clamp((x / t.widthKm) * (t.nx - 1), 0, t.nx - 1);
    const fj = THREE.MathUtils.clamp((z / t.depthKm) * (t.nz - 1), 0, t.nz - 1);
    const i = Math.floor(fi);
    const j = Math.floor(fj);
    const i1 = Math.min(i + 1, t.nx - 1);
    const j1 = Math.min(j + 1, t.nz - 1);
    const a = fi - i;
    const b = fj - j;
    const e = (ii: number, jj: number) => {
      const k = jj * t.nx + ii;
      const w = t.water[k];
      return Number.isNaN(w) ? t.elev[k] : Math.max(t.elev[k], w);
    };
    const h = e(i, j) * (1 - a) * (1 - b) + e(i1, j) * a * (1 - b) + e(i, j1) * (1 - a) * b + e(i1, j1) * a * b;
    return h * this.yPerM;
  }

  /** Ground height (no water). */
  groundY(x: number, z: number): number {
    const t = this.terrain;
    if (!t) return 0;
    const i = Math.round(THREE.MathUtils.clamp((x / t.widthKm) * (t.nx - 1), 0, t.nx - 1));
    const j = Math.round(THREE.MathUtils.clamp((z / t.depthKm) * (t.nz - 1), 0, t.nz - 1));
    return t.elev[j * t.nx + i] * this.yPerM;
  }

  pickables(): THREE.Object3D[] {
    return [this.terrainMesh, this.waterMesh].filter(Boolean) as THREE.Object3D[];
  }

  // ───────── mantle ─────────

  private buildMantle() {
    const hw = this.halfW;
    const hd = this.halfD;
    const H = CRUST_BOTTOM - MANTLE_BOTTOM;
    const yMid = (CRUST_BOTTOM + MANTLE_BOTTOM) / 2;
    const faces: [number, number, THREE.Vector3, number, number][] = [
      // [width, axis, position, rotY, other]
      [hw * 2, 0, new THREE.Vector3(0, yMid, hd), 0, 1],
      [hw * 2, 0, new THREE.Vector3(0, yMid, -hd), Math.PI, 0],
      [hd * 2, 1, new THREE.Vector3(hw, yMid, 0), Math.PI / 2, 1],
      [hd * 2, 1, new THREE.Vector3(-hw, yMid, 0), -Math.PI / 2, 0],
    ];
    for (const [w, axis, pos, rot, other] of faces) {
      const g = new THREE.PlaneGeometry(w, H, 1, 1);
      const m = new THREE.ShaderMaterial({
        vertexShader: MANTLE_VS,
        fragmentShader: MANTLE_FS,
        uniforms: {
          uHeat: { value: Array.from({ length: 8 }, () => new THREE.Vector4()) },
          uCount: { value: 0 },
          uTime: { value: 0 },
          uAxis: { value: axis },
          uOther: { value: other },
          uHeatView: { value: 0 },
        },
      });
      // faces on the back/left run the other way; flip uv.x so u = x/W (or z/D) everywhere
      if (rot === Math.PI || rot === Math.PI / 2) {
        const uv = g.attributes.uv as THREE.BufferAttribute;
        for (let i = 0; i < uv.count; i++) uv.setX(i, 1 - uv.getX(i));
      }
      const mesh = new THREE.Mesh(g, m);
      mesh.position.copy(pos);
      mesh.rotation.y = rot;
      this.mantle.push(mesh);
      this.mantleMats.push(m);
      this.group.add(mesh);
    }
    // the glowing core below
    const core = new THREE.Mesh(
      new THREE.PlaneGeometry(hw * 2, hd * 2),
      new THREE.MeshBasicMaterial({ color: '#ffb347' }),
    );
    core.rotation.x = Math.PI / 2;
    core.position.y = MANTLE_BOTTOM;
    this.group.add(core);
    const glow = new THREE.PointLight('#ff7a2a', 6, 14, 1.6);
    glow.position.set(0, MANTLE_BOTTOM - 0.5, hd + 1);
    this.group.add(glow);

    // particles drifting with the flow on the front face
    const n = 220;
    const pos = new Float32Array(n * 3);
    this.partState = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      this.partState[i * 3] = Math.random();
      this.partState[i * 3 + 1] = Math.random();
      this.partState[i * 3 + 2] = Math.random() * 4;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.particles = new THREE.Points(
      g,
      new THREE.PointsMaterial({ size: 0.09, color: '#ffe0a0', transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, map: this.smokeTex }),
    );
    this.group.add(this.particles);
  }

  /** Stream function on the front face, same as the shader (for particles). */
  private psi(u: number, h: number): number {
    const s = Math.sin(Math.PI * h);
    let p = 0.18 * Math.sin(u * Math.PI * 2 * 1.5 + 0.7) * s;
    for (const hh of this.heats) {
      const a = hh.x / this.W;
      const o = hh.z / this.D;
      const w = Math.exp(-(((o - 1) / 0.6) ** 2));
      const dx = (u - a) / 0.16;
      p += -(hh.kind === 'plume' ? 1 : -1) * w * dx * Math.exp(-dx * dx) * s * 1.6;
    }
    return p;
  }

  private stepParticles(dt: number) {
    if (!this.particles || !this.partState) return;
    const st = this.partState;
    const pos = this.particles.geometry.attributes.position as THREE.BufferAttribute;
    const e = 0.002;
    const H = CRUST_BOTTOM - MANTLE_BOTTOM;
    const aspect = (this.W * this.S) / H;
    for (let i = 0; i < pos.count; i++) {
      let u = st[i * 3];
      let h = st[i * 3 + 1];
      // velocity = curl of psi (u along, h up)
      const dpu = (this.psi(u + e, h) - this.psi(u - e, h)) / (2 * e);
      const dph = (this.psi(u, h + e) - this.psi(u, h - e)) / (2 * e);
      const vu = dph / aspect;
      const vh = -dpu;
      u += vu * dt * 0.05;
      h += vh * dt * 0.05;
      st[i * 3 + 2] -= dt;
      if (u < 0.01 || u > 0.99 || h < 0.03 || h > 0.97 || st[i * 3 + 2] < 0) {
        u = 0.02 + Math.random() * 0.96;
        h = 0.05 + Math.random() * 0.9;
        st[i * 3 + 2] = 2 + Math.random() * 4;
      }
      st[i * 3] = u;
      st[i * 3 + 1] = h;
      pos.setXYZ(i, (u - 0.5) * this.W * this.S, MANTLE_BOTTOM + h * H, this.halfD + 0.02);
    }
    pos.needsUpdate = true;
  }

  // ───────── terrain ─────────

  setTerrain(t: Terrain) {
    this.terrain = t;
    const { nx, nz } = t;
    const N = nx * nz;
    if (!this.terrainMesh || (this.terrainMesh.geometry.attributes.position as THREE.BufferAttribute).count !== N) {
      this.disposeTerrain();
      const g = new THREE.PlaneGeometry(this.W * this.S, this.D * this.S, nx - 1, nz - 1);
      g.rotateX(-Math.PI / 2);
      g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
      const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0, flatShading: false });
      this.terrainMesh = new THREE.Mesh(g, m);
      this.terrainMesh.receiveShadow = true;
      this.terrainMesh.castShadow = true;
      this.group.add(this.terrainMesh);

      const wg = new THREE.PlaneGeometry(this.W * this.S, this.D * this.S, nx - 1, nz - 1);
      wg.rotateX(-Math.PI / 2);
      wg.setAttribute('wet', new THREE.BufferAttribute(new Float32Array(N), 1));
      wg.setAttribute('depth', new THREE.BufferAttribute(new Float32Array(N), 1));
      this.waterMesh = new THREE.Mesh(wg, this.waterMat);
      this.waterMesh.renderOrder = 2;
      this.group.add(this.waterMesh);
    }
    const pos = this.terrainMesh.geometry.attributes.position as THREE.BufferAttribute;
    const col = this.terrainMesh.geometry.attributes.color as THREE.BufferAttribute;
    const wpos = this.waterMesh!.geometry.attributes.position as THREE.BufferAttribute;
    const wet = this.waterMesh!.geometry.attributes.wet as THREE.BufferAttribute;
    const depth = this.waterMesh!.geometry.attributes.depth as THREE.BufferAttribute;
    const c = new THREE.Color();
    for (let j = 0; j < nz; j++) {
      for (let i = 0; i < nx; i++) {
        const k = j * nx + i;
        const e = t.elev[k];
        pos.setY(k, e * this.yPerM);
        c.copy(MAT_COLOR[t.mat[k]] ?? MAT_COLOR[MAT.grass]);
        if (e > SNOWLINE_M - 600) c.lerp(SNOW, THREE.MathUtils.smoothstep(e, SNOWLINE_M - 600, SNOWLINE_M + 200));
        else if (e > 1600 && t.mat[k] !== MAT.basalt) c.lerp(MAT_COLOR[MAT.rock], 0.5);
        if (e < 0) c.multiplyScalar(THREE.MathUtils.clamp(1 - -e / 9000, 0.35, 1));
        if (t.age[k] >= 0 && t.mat[k] === MAT.basalt) {
          // magnetic-stripe look on young sea floor: alternating bands by age
          const band = Math.floor(t.age[k] / 2.2) % 2;
          c.multiplyScalar(band ? 0.75 : 1.15);
        }
        col.setXYZ(k, c.r, c.g, c.b);
        const w = t.water[k];
        const isWet = !Number.isNaN(w);
        wet.setX(k, isWet ? 1 : 0);
        wpos.setY(k, (isWet ? w : Math.max(e, 0)) * this.yPerM + 0.004);
        depth.setX(k, isWet ? (w - e) / 1000 : 0); // km of water
      }
    }
    // a wet vertex next to dry ones keeps the shore crisp
    pos.needsUpdate = true;
    col.needsUpdate = true;
    wpos.needsUpdate = true;
    wet.needsUpdate = true;
    depth.needsUpdate = true;
    this.terrainMesh.geometry.computeVertexNormals();
    this.terrainMesh.geometry.computeBoundingSphere();
    this.placeTrees(t);
    this.waterMesh!.geometry.computeBoundingSphere();
    this.buildWalls(t);
  }

  private trees: THREE.InstancedMesh | null = null;

  /** Dark tree clumps on green land; fixed spots per level, so they ride nothing but stay believable. */
  private placeTrees(t: Terrain) {
    const N = 220;
    if (!this.trees) {
      const g = new THREE.IcosahedronGeometry(0.075, 0);
      g.scale(1, 1.35, 1);
      g.translate(0, 0.08, 0);
      this.trees = new THREE.InstancedMesh(g, new THREE.MeshStandardMaterial({ color: '#2f5a24', roughness: 0.9, flatShading: true }), N);
      this.trees.castShadow = true;
      this.group.add(this.trees);
    }
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const sc = new THREE.Vector3();
    let n = 0;
    let seed = this.def.id * 7919 + 17;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let tries = 0; tries < N * 6 && n < N; tries++) {
      const x = rnd() * this.W;
      const z = rnd() * this.D;
      const k = Math.round((z / t.depthKm) * (t.nz - 1)) * t.nx + Math.round((x / t.widthKm) * (t.nx - 1));
      const mat = t.mat[k];
      const scrub = mat === MAT.limestone; // olive and oak scrub on the limestone hills, thinner
      if ((mat !== MAT.grass && mat !== MAT.fertile && !scrub) || !Number.isNaN(t.water[k]) || t.elev[k] > 2200 || t.elev[k] < 2) continue;
      if (scrub && rnd() < 0.55) continue;
      // clumps: keep a tree only where low-frequency noise says forest
      if (Math.sin(x * 0.013 + this.def.id) * Math.cos(z * 0.017) < 0.15) continue;
      const p = this.toWorld(x, z);
      const s0 = 0.7 + rnd() * 0.7;
      sc.set(s0, s0, s0);
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rnd() * 6.28);
      m.compose(new THREE.Vector3(p.x, this.groundY(x, z), p.z), q, sc);
      this.trees.setMatrixAt(n++, m);
    }
    this.trees.count = n;
    this.trees.instanceMatrix.needsUpdate = true;
  }

  private buildWalls(t: Terrain) {
    const { nx, nz } = t;
    const edges: number[][] = [];
    // south (front), east, north, west: walk the perimeter
    const south: number[] = [];
    for (let i = 0; i < nx; i++) south.push((nz - 1) * nx + i);
    const east: number[] = [];
    for (let j = nz - 1; j >= 0; j--) east.push(j * nx + nx - 1);
    const north: number[] = [];
    for (let i = nx - 1; i >= 0; i--) north.push(i);
    const west: number[] = [];
    for (let j = 0; j < nz; j++) west.push(j * nx);
    edges.push(south, east, north, west);
    const pos: number[] = [];
    const top: number[] = [];
    const tc: number[] = [];
    const idx: number[] = [];
    const wpos: number[] = [];
    const widx: number[] = [];
    const tpos = this.terrainMesh!.geometry.attributes.position as THREE.BufferAttribute;
    const tcol = this.terrainMesh!.geometry.attributes.color as THREE.BufferAttribute;
    for (const edge of edges) {
      for (let a = 0; a < edge.length; a++) {
        const k = edge[a];
        const x = tpos.getX(k);
        const y = tpos.getY(k);
        const z = tpos.getZ(k);
        const base = pos.length / 3;
        pos.push(x, y, z, x, CRUST_BOTTOM, z);
        top.push(y, y);
        tc.push(tcol.getX(k), tcol.getY(k), tcol.getZ(k), tcol.getX(k), tcol.getY(k), tcol.getZ(k));
        if (a > 0) idx.push(base - 2, base - 1, base, base, base - 1, base + 1);
        // water column on the walls
        const w = t.water[k];
        const wb = wpos.length / 3;
        const wy = Number.isNaN(w) ? y : w * this.yPerM;
        wpos.push(x, Math.max(y, Math.min(wy, y + 99)), z, x, y, z);
        if (a > 0) widx.push(wb - 2, wb - 1, wb, wb, wb - 1, wb + 1);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('topY', new THREE.Float32BufferAttribute(top, 1));
    g.setAttribute('topColor', new THREE.Float32BufferAttribute(tc, 3));
    g.setIndex(idx);
    if (this.walls) {
      this.walls.geometry.dispose();
      this.walls.geometry = g;
    } else {
      this.walls = new THREE.Mesh(g, this.wallMat);
      this.group.add(this.walls);
    }
    const wg = new THREE.BufferGeometry();
    wg.setAttribute('position', new THREE.Float32BufferAttribute(wpos, 3));
    wg.setIndex(widx);
    if (this.waterWalls) {
      this.waterWalls.geometry.dispose();
      this.waterWalls.geometry = wg;
    } else {
      this.waterWalls = new THREE.Mesh(wg, new THREE.MeshBasicMaterial({ color: '#2a8fc0', transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false }));
      this.waterWalls.renderOrder = 3;
      this.group.add(this.waterWalls);
    }
  }

  // ───────── heat, flow arrows, seams ─────────

  setHeats(heats: Heat[], selected: string | null = null) {
    this.heats = heats;
    for (const m of this.mantleMats) {
      const arr = m.uniforms.uHeat.value as THREE.Vector4[];
      heats.slice(0, 8).forEach((h, i) => arr[i].set(h.x / this.W, h.kind === 'plume' ? 1 : -1, h.z / this.D, 1));
      m.uniforms.uCount.value = Math.min(8, heats.length);
    }
    while (this.heatGroup.children.length) {
      const c = this.heatGroup.children.pop()!;
      c.traverse((o) => {
        if ((o as THREE.Mesh).geometry) (o as THREE.Mesh).geometry.dispose();
      });
    }
    for (const h of heats) this.heatGroup.add(this.heatMarker(h, h.id === selected));
  }

  private heatMarker(h: Heat, selected: boolean): THREE.Object3D {
    const g = new THREE.Group();
    g.name = `heat:${h.id}`;
    g.userData.heatId = h.id;
    const plume = h.kind === 'plume';
    const color = plume ? '#ff6a1a' : '#3a8dff';
    const top = this.surfaceY(h.x, h.z);
    const p = this.toWorld(h.x, h.z);
    g.position.set(p.x, 0, p.z);
    // column through crust and mantle
    const colH = top - MANTLE_BOTTOM + 0.2;
    const column = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, plume ? 0.22 : 0.07, colH, 16, 1, true),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: h.fixed ? 0.22 : 0.32, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
    );
    column.position.y = MANTLE_BOTTOM + colH / 2;
    g.add(column);
    // the marker that sits on the surface
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.42, 20), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.6, roughness: 0.4 }));
    cone.position.y = top + 0.42;
    if (!plume) cone.rotation.x = Math.PI;
    cone.castShadow = true;
    cone.name = 'cone';
    g.add(cone);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.035, 8, 32), new THREE.MeshBasicMaterial({ color: selected ? '#ffffff' : color }));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = top + 0.05;
    ring.name = 'ring';
    g.add(ring);
    if (h.fixed) {
      const lock = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.02, 6, 32), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.6 }));
      lock.rotation.x = Math.PI / 2;
      lock.position.y = top + 0.05;
      g.add(lock);
    }
    const light = new THREE.PointLight(color, 2.2, 3, 2);
    light.position.y = top + 0.6;
    g.add(light);
    return g;
  }

  heatAt(ray: THREE.Raycaster): string | null {
    const hits = ray.intersectObjects(this.heatGroup.children, true);
    for (const h of hits) {
      let o: THREE.Object3D | null = h.object;
      while (o && !o.userData.heatId) o = o.parent;
      if (o) return o.userData.heatId as string;
    }
    return null;
  }

  /** Small arrows on the surface showing the mantle flow underneath. */
  setFlow(fn: ((x: number, z: number) => { x: number; z: number }) | null, bright = false) {
    if (this.arrows) {
      this.group.remove(this.arrows);
      this.arrows.geometry.dispose();
      this.arrows = null;
    }
    if (!fn) return;
    const nx = 11;
    const nz = Math.max(5, Math.round(nx * (this.D / this.W)));
    const shape = new THREE.Shape();
    shape.moveTo(0, 0.5);
    shape.lineTo(0.32, 0.05);
    shape.lineTo(0.12, 0.05);
    shape.lineTo(0.12, -0.45);
    shape.lineTo(-0.12, -0.45);
    shape.lineTo(-0.12, 0.05);
    shape.lineTo(-0.32, 0.05);
    shape.closePath();
    const geo = new THREE.ShapeGeometry(shape);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({ color: bright ? '#fff3c4' : '#ffe9b0', transparent: true, opacity: bright ? 0.95 : 0.55, depthWrite: false });
    const mesh = new THREE.InstancedMesh(geo, mat, nx * nz);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    let max = 0.01;
    const vals: { x: number; z: number; f: { x: number; z: number } }[] = [];
    for (let j = 0; j < nz; j++) {
      for (let i = 0; i < nx; i++) {
        const x = ((i + 0.5) / nx) * this.W;
        const z = ((j + 0.5) / nz) * this.D;
        const f = fn(x, z);
        max = Math.max(max, Math.hypot(f.x, f.z));
        vals.push({ x, z, f });
      }
    }
    vals.forEach((p, k) => {
      const mag = Math.hypot(p.f.x, p.f.z) / max;
      const s = mag < 0.06 ? 0.0001 : 0.18 + 0.32 * mag;
      const ang = Math.atan2(p.f.x, -p.f.z);
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -ang);
      const w = this.toWorld(p.x, p.z);
      w.y = this.surfaceY(p.x, p.z) + 0.06;
      m.compose(w, q, new THREE.Vector3(s, 1, s));
      mesh.setMatrixAt(k, m);
    });
    mesh.renderOrder = 4;
    this.arrows = mesh;
    this.group.add(mesh);
  }

  setSeams(seams: { p0: { x: number; z: number }; p1: { x: number; z: number }; formed: Boundary | null }[]) {
    while (this.seamGroup.children.length) {
      const c = this.seamGroup.children.pop() as THREE.Line;
      c.geometry.dispose();
    }
    for (const s of seams) {
      const pts: THREE.Vector3[] = [];
      const n = 40;
      for (let i = 0; i <= n; i++) {
        const x = s.p0.x + ((s.p1.x - s.p0.x) * i) / n;
        const z = s.p0.z + ((s.p1.z - s.p0.z) * i) / n;
        const w = this.toWorld(x, z);
        w.y = this.surfaceY(x, z) + 0.03;
        pts.push(w);
      }
      const g = new THREE.BufferGeometry().setFromPoints(pts);
      const formed = s.formed;
      const mat = formed
        ? new THREE.LineBasicMaterial({ color: formed.type === 'pull' ? '#ffb347' : formed.type === 'push' ? '#ff5533' : '#ffe066', transparent: true, opacity: 0.9 })
        : new THREE.LineDashedMaterial({ color: '#ffd9a0', dashSize: 0.12, gapSize: 0.1, transparent: true, opacity: 0.6 });
      const line = new THREE.Line(g, mat);
      if (!formed) line.computeLineDistances();
      this.seamGroup.add(line);
    }
  }

  // ───────── volcano smoke ─────────

  setVolcanoes(vs: { x: number; z: number; h: number }[]) {
    for (const s of this.smoke) this.group.remove(s);
    this.smoke = [];
    for (const v of vs.filter((q) => q.h > 400).slice(0, 10)) {
      for (let i = 0; i < 4; i++) {
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.smokeTex, color: '#cfc7c0', transparent: true, opacity: 0.5, depthWrite: false }));
        const top = this.toWorld(v.x, v.z, 0);
        top.y = this.groundY(v.x, v.z) + 0.05;
        sp.userData = { base: top.clone(), phase: i / 4 };
        sp.scale.setScalar(0.3);
        this.smoke.push(sp);
        this.group.add(sp);
      }
    }
  }

  update(dt: number, time: number, cam: THREE.Camera) {
    for (const m of this.mantleMats) {
      m.uniforms.uTime.value = time;
      m.uniforms.uHeatView.value = this.heatView;
    }
    this.waterMat.uniforms.uTime.value = time;
    (this.waterMat.uniforms.uCam.value as THREE.Vector3).copy(cam.position);
    this.stepParticles(dt);
    for (const c of this.heatGroup.children) {
      const cone = c.getObjectByName('cone');
      if (cone) cone.position.y += Math.sin(time * 3 + c.position.x) * 0.002;
      const ring = c.getObjectByName('ring');
      if (ring) ring.scale.setScalar(1 + 0.12 * Math.sin(time * 4));
    }
    for (const s of this.smoke) {
      const ph = (s.userData.phase + time * 0.25) % 1;
      const b = s.userData.base as THREE.Vector3;
      s.position.set(b.x + ph * 0.25, b.y + ph * 1.1, b.z);
      s.scale.setScalar(0.2 + ph * 0.7);
      (s.material as THREE.SpriteMaterial).opacity = 0.55 * (1 - ph);
    }
  }

  private disposeTerrain() {
    for (const m of [this.terrainMesh, this.waterMesh]) {
      if (!m) continue;
      this.group.remove(m);
      m.geometry.dispose();
    }
    this.terrainMesh = null;
    this.waterMesh = null;
  }

  dispose() {
    const mats = new Set<THREE.Material>();
    this.group.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      for (const mat of ([] as THREE.Material[]).concat(m.material ?? [])) mats.add(mat);
    });
    for (const m of mats) m.dispose();
    this.smokeTex.dispose();
  }
}

export function softDot(): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.4, 'rgba(255,255,255,0.6)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
