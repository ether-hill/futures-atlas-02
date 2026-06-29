import * as THREE from "three";
import { COLORS, type Params } from "./config";

// Concentric ripples that bloom outward across the shell when a pulse reaches
// the surface. "Strength" = opacity (0 = off), "Spread" = how far they travel,
// "Ring Spacing" = how many concentric rings per ripple, "Fade" = lifetime.

const SEGMENTS = 96;
const Z = new THREE.Vector3(0, 0, 1);

interface Ring {
  loop: THREE.LineLoop;
  mat: THREE.LineBasicMaterial;
  age: number; // may start negative to stagger concentric rings
  active: boolean;
}

export class Rings {
  group = new THREE.Group();
  private pool: Ring[] = [];
  private geo: THREE.BufferGeometry;
  private life = 1.7;
  private maxScale = 3;
  private count = 3;
  private strength = 0.85;

  constructor(private max = 96) {
    const pts: number[] = [];
    for (let i = 0; i < SEGMENTS; i++) {
      const a = (i / SEGMENTS) * Math.PI * 2;
      pts.push(Math.cos(a), Math.sin(a), 0);
    }
    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  }

  setParams(p: Params, radius: number) {
    this.strength = p.rippleStrength;
    this.life = p.rippleFade;
    this.maxScale = p.rippleSpan * radius * 1.7;
    this.count = Math.max(1, Math.min(6, Math.round(p.rippleSpan / p.ringSpacing)));
  }
  get enabled() { return this.strength > 0.001; }

  private obtain(): Ring | null {
    for (const r of this.pool) if (!r.active) return r;
    if (this.pool.length >= this.max) return null;
    const mat = new THREE.LineBasicMaterial({
      color: new THREE.Color().fromArray(COLORS.ring),
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const loop = new THREE.LineLoop(this.geo, mat);
    loop.frustumCulled = false;
    const r: Ring = { loop, mat, age: 0, active: false };
    this.pool.push(r);
    this.group.add(loop);
    return r;
  }

  spawn(pos: THREE.Vector3) {
    if (!this.enabled) return;
    const q = new THREE.Quaternion().setFromUnitVectors(Z, pos.clone().normalize());
    for (let k = 0; k < this.count; k++) {
      const r = this.obtain();
      if (!r) return;
      r.active = true;
      r.age = -k * (this.life / (this.count + 1)); // stagger → concentric rings
      r.loop.visible = true;
      r.loop.position.copy(pos);
      r.loop.quaternion.copy(q);
      r.loop.scale.setScalar(0.0001);
    }
  }

  update(dt: number) {
    for (const r of this.pool) {
      if (!r.active) continue;
      r.age += dt;
      if (r.age < 0) { r.mat.opacity = 0; continue; }
      const k = r.age / this.life;
      if (k >= 1) { r.active = false; r.loop.visible = false; continue; }
      const s = 0.12 + k * this.maxScale;
      r.loop.scale.set(s, s, s);
      r.mat.opacity = (1 - k) * (1 - k) * this.strength;
    }
  }
}
