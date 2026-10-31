// Procedural WebAudio only: mantle drone, rumbles, seam crackle, sea whoosh,
// villager chirps, success sting. Nothing is loaded.

export class Audio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private drone: GainNode | null = null;
  private droneOsc: OscillatorNode[] = [];
  muted = false;

  private ensure(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.7;
    this.master.connect(this.ctx.destination);
    // low mantle drone
    this.drone = this.ctx.createGain();
    this.drone.gain.value = 0.04;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 220;
    for (const f of [41, 61.5, 82.3]) {
      const o = this.ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = f;
      o.connect(lp);
      o.start();
      this.droneOsc.push(o);
    }
    lp.connect(this.drone);
    this.drone.connect(this.master);
    return this.ctx;
  }

  /** Call from a user gesture. */
  unlock() {
    const c = this.ensure();
    if (c && c.state === 'suspended') void c.resume();
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.7, this.ctx.currentTime, 0.05);
  }

  /** Drone intensity 0..1 (rises while deep time runs). */
  setDrone(level: number) {
    if (!this.ctx || !this.drone) return;
    this.drone.gain.setTargetAtTime(0.03 + level * 0.09, this.ctx.currentTime, 0.2);
    for (const [i, o] of this.droneOsc.entries()) o.detune.setTargetAtTime(level * 120 + i * 4, this.ctx.currentTime, 0.3);
  }

  private noise(dur: number): AudioBufferSourceNode | null {
    const c = this.ctx;
    if (!c) return null;
    const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const s = c.createBufferSource();
    s.buffer = buf;
    return s;
  }

  private env(g: GainNode, peak: number, attack: number, decay: number) {
    const t = this.ctx!.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }

  rumble(magnitude: number) {
    const c = this.ensure();
    if (!c || !this.master) return;
    const n = this.noise(2.2)!;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 90 + magnitude * 8;
    const g = c.createGain();
    this.env(g, Math.min(0.9, 0.08 * (magnitude - 3)), 0.05, 1.8);
    n.connect(lp).connect(g).connect(this.master);
    n.start();
  }

  crackle() {
    const c = this.ensure();
    if (!c || !this.master) return;
    for (let i = 0; i < 8; i++) {
      const n = this.noise(0.05)!;
      const hp = c.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 1800;
      const g = c.createGain();
      const t = c.currentTime + i * 0.06 + Math.random() * 0.04;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.25, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      n.connect(hp).connect(g).connect(this.master);
      n.start(t);
    }
  }

  whoosh() {
    const c = this.ensure();
    if (!c || !this.master) return;
    const n = this.noise(1.6)!;
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 0.8;
    bp.frequency.setValueAtTime(300, c.currentTime);
    bp.frequency.exponentialRampToValueAtTime(1800, c.currentTime + 0.6);
    bp.frequency.exponentialRampToValueAtTime(400, c.currentTime + 1.5);
    const g = c.createGain();
    this.env(g, 0.35, 0.3, 1.2);
    n.connect(bp).connect(g).connect(this.master);
    n.start();
  }

  chirp(happy: boolean) {
    const c = this.ensure();
    if (!c || !this.master) return;
    for (let i = 0; i < 3; i++) {
      const o = c.createOscillator();
      o.type = 'triangle';
      const g = c.createGain();
      const t = c.currentTime + i * 0.11;
      const f = happy ? 660 + i * 180 : 520 - i * 90;
      o.frequency.setValueAtTime(f, t);
      o.frequency.exponentialRampToValueAtTime(f * (happy ? 1.4 : 0.7), t + 0.09);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.12, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
      o.connect(g).connect(this.master);
      o.start(t);
      o.stop(t + 0.12);
    }
  }

  sting(good: boolean) {
    const c = this.ensure();
    if (!c || !this.master) return;
    const notes = good ? [523.25, 659.25, 783.99, 1046.5] : [392, 349.23, 311.13];
    notes.forEach((f, i) => {
      const o = c.createOscillator();
      o.type = good ? 'square' : 'sine';
      const g = c.createGain();
      const t = c.currentTime + i * 0.12;
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(good ? 0.08 : 0.12, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      o.connect(g).connect(this.master!);
      o.start(t);
      o.stop(t + 0.4);
    });
  }

  click() {
    const c = this.ensure();
    if (!c || !this.master) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.frequency.value = 880;
    this.env(g, 0.06, 0.005, 0.06);
    o.connect(g).connect(this.master);
    o.start();
    o.stop(c.currentTime + 0.08);
  }
}
