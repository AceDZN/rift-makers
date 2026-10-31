// The one WebGL canvas: renderer, camera rig, lights, starry void, resize,
// lost context. Works in any container size (the workbook iframe included).

import * as THREE from 'three';

export interface WorldOptions {
  container: HTMLElement;
}

export class World {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(38, 1, 0.05, 400);
  readonly root = new THREE.Group();
  readonly container: HTMLElement;
  /** Orbit around `target`: azimuth (rad, 0 = looking north from the south), polar from vertical, distance. */
  orbit = { az: -0.28, polar: 0.98, dist: 17, target: new THREE.Vector3(0, -0.6, 0) };
  private orbitGoal = { ...this.orbit, target: this.orbit.target.clone() };
  private shake = 0;
  contextLost = false;
  reducedMotion = false;
  private ro: ResizeObserver;

  constructor(opts: WorldOptions) {
    this.container = opts.container;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const canvas = this.renderer.domElement;
    canvas.setAttribute('aria-label', 'לוח כוכב צף: הקרום, המעטפת והנוף');
    canvas.tabIndex = 0;
    this.container.appendChild(canvas);
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      this.contextLost = true;
    });
    canvas.addEventListener('webglcontextrestored', () => {
      this.contextLost = false;
    });

    this.scene.background = new THREE.Color('#0a0c1c');
    this.scene.fog = new THREE.Fog('#0a0c1c', 40, 160);
    this.scene.add(this.root);
    this.addLights();
    this.addSky();
    this.addStars();
    this.addDebris();

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this.container);
    this.resize();
  }

  private addLights() {
    const hemi = new THREE.HemisphereLight('#cfe3ff', '#3a2a22', 1.1);
    this.scene.add(hemi);
    const sun = new THREE.DirectionalLight('#ffe2b8', 2.4);
    sun.position.set(-8, 14, 9);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const c = sun.shadow.camera as THREE.OrthographicCamera;
    c.left = -9;
    c.right = 9;
    c.top = 9;
    c.bottom = -9;
    c.near = 1;
    c.far = 40;
    sun.shadow.bias = -0.0008;
    this.scene.add(sun);
    const rim = new THREE.DirectionalLight('#ff8a4a', 0.9);
    rim.position.set(6, -2, 10);
    this.scene.add(rim);
  }

  /** A sunset glow low behind the slab that fades into the starry void. */
  private addSky() {
    const m = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      vertexShader: `varying vec3 vDir; void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `varying vec3 vDir;
        void main() {
          vec3 d = normalize(vDir);
          float back = 0.5 + 0.5 * dot(normalize(d.xz + 1e-4), vec2(0.25, -1.0));
          float band = exp(-pow((d.y + 0.01) / 0.07, 2.0)) * pow(back, 4.0);
          vec3 c = vec3(0.035, 0.045, 0.11);
          c = mix(c, vec3(0.16, 0.10, 0.24), exp(-pow((d.y - 0.05) / 0.12, 2.0)) * pow(back, 3.0) * 0.5);
          c += vec3(1.0, 0.48, 0.20) * band * 0.55;
          gl_FragColor = vec4(c, 1.0); // already display colours
        }`,
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(150, 32, 16), m);
    sky.renderOrder = -1;
    this.scene.add(sky);
  }

  private debris: THREE.Mesh[] = [];

  /** A few rock chunks drifting around the floating slab. */
  private addDebris() {
    const mat = new THREE.MeshStandardMaterial({ color: '#5a4636', roughness: 1, flatShading: true });
    let seed = 42;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 10; i++) {
      const g = new THREE.DodecahedronGeometry(0.1 + rnd() * 0.26, 0);
      const r = new THREE.Mesh(g, mat);
      // beside and behind the slab, never between it and the camera
      const a = Math.PI * (0.85 + rnd() * 1.3);
      const dist = 9 + rnd() * 8;
      r.position.set(Math.cos(a) * dist, -5 + rnd() * 6, Math.sin(a) * dist);
      r.userData.spin = new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(0.4);
      r.userData.y0 = r.position.y;
      r.userData.ph = rnd() * 6.28;
      this.scene.add(r);
      this.debris.push(r);
    }
  }

  private addStars() {
    const n = 1400;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = Math.random() * 2 - 1;
      const th = Math.random() * Math.PI * 2;
      const r = 90 + Math.random() * 40;
      const s = Math.sqrt(1 - u * u);
      pos.set([r * s * Math.cos(th), r * u, r * s * Math.sin(th)], i * 3);
      const warm = Math.random();
      col.set([0.8 + 0.2 * warm, 0.8 + 0.1 * warm, 1 - 0.2 * warm], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const m = new THREE.PointsMaterial({ size: 0.35, vertexColors: true, sizeAttenuation: true, fog: false, transparent: true, opacity: 0.85 });
    this.scene.add(new THREE.Points(g, m));
  }

  resize() {
    const w = Math.max(1, this.container.clientWidth);
    const h = Math.max(1, this.container.clientHeight);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // narrow screens: pull back so the slab fits
    this.camera.fov = w / h < 0.8 ? 58 : w / h < 1.2 ? 46 : 38;
    this.camera.updateProjectionMatrix();
    if (this.fitR > 0) this.orbitGoal.dist = this.fitDist(this.fitR);
  }

  /** Bounding radius the default view must show; 0 = leave distance alone. */
  fitR = 0;

  /** Distance at which a sphere of radius r fits the narrower field of view, with room for the HUD bars. */
  fitDist(r: number) {
    const v = THREE.MathUtils.degToRad(this.camera.fov);
    const hz = 2 * Math.atan(Math.tan(v / 2) * this.camera.aspect);
    const half = Math.min(v / (1 + 0.32), hz) / 2;
    return THREE.MathUtils.clamp(r / Math.sin(half), 7, 40);
  }

  /** Snap to a view that frames a sphere of radius r around target. */
  frame(r: number, o: { az: number; polar: number; target: THREE.Vector3 }) {
    this.fitR = r;
    this.setOrbit({ ...o, dist: this.fitDist(r) }, true);
  }

  setOrbit(o: Partial<{ az: number; polar: number; dist: number; target: THREE.Vector3 }>, snap = false) {
    Object.assign(this.orbitGoal, o);
    if (o.target) this.orbitGoal.target = o.target.clone();
    if (snap) {
      Object.assign(this.orbit, this.orbitGoal);
      this.orbit.target = this.orbitGoal.target.clone();
    }
  }

  nudgeOrbit(daz: number, dpolar: number, ddist = 0) {
    const g = this.orbitGoal;
    g.az = THREE.MathUtils.clamp(g.az + daz, -1.25, 1.25);
    g.polar = THREE.MathUtils.clamp(g.polar + dpolar, 0.45, 1.32);
    g.dist = THREE.MathUtils.clamp(g.dist * (1 + ddist), 7, 40);
    if (ddist) this.fitR = 0;
  }

  quake(strength: number) {
    if (this.reducedMotion) return;
    this.shake = Math.max(this.shake, Math.min(0.35, strength));
  }

  private clock = 0;

  update(dt: number) {
    this.clock += dt;
    if (!this.reducedMotion) {
      for (const r of this.debris) {
        r.rotation.x += r.userData.spin.x * dt;
        r.rotation.y += r.userData.spin.y * dt;
        r.position.y = r.userData.y0 + Math.sin(this.clock * 0.4 + r.userData.ph) * 0.15;
      }
    }
    const k = 1 - Math.exp(-dt * 6);
    const o = this.orbit;
    const g = this.orbitGoal;
    o.az += (g.az - o.az) * k;
    o.polar += (g.polar - o.polar) * k;
    o.dist += (g.dist - o.dist) * k;
    o.target.lerp(g.target, k);
    const sp = Math.sin(o.polar);
    const pos = new THREE.Vector3(o.dist * sp * Math.sin(o.az), o.dist * Math.cos(o.polar), o.dist * sp * Math.cos(o.az)).add(o.target);
    if (this.shake > 0.001) {
      pos.x += (Math.random() - 0.5) * this.shake;
      pos.y += (Math.random() - 0.5) * this.shake;
      this.shake *= Math.exp(-dt * 5);
    }
    this.camera.position.copy(pos);
    this.camera.lookAt(o.target);
  }

  render() {
    if (this.contextLost) return;
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.ro.disconnect();
  }
}
