import * as THREE from "three";
import { COLORS } from "./config";

// Concentric ripples that bloom outward across the shell when a pulse reaches
// the surface. A small recycled pool of expanding, fading circles.

const SEGMENTS = 72;
const LIFE = 1.7; // seconds
const MAX_SCALE = 4.4;
const Z = new THREE.Vector3(0, 0, 1);

interface Ring {
  loop: THREE.LineLoop;
  mat: THREE.LineBasicMaterial;
  age: number;
  active: boolean;
}

export class Rings {
  group = new THREE.Group();
  private pool: Ring[] = [];
  private geo: THREE.BufferGeometry;

  constructor(private max = 64) {
    const pts: number[] = [];
    for (let i = 0; i < SEGMENTS; i++) {
      const a = (i / SEGMENTS) * Math.PI * 2;
      pts.push(Math.cos(a), Math.sin(a), 0);
    }
    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  }

  private obtain(): Ring | null {
    for (const r of this.pool) if (!r.active) return r;
    if (this.pool.length >= this.max) return null;
    const mat = new THREE.LineBasicMaterial({
      color: new THREE.Color().fromArray(COLORS.ring),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const loop = new THREE.LineLoop(this.geo, mat);
    loop.frustumCulled = false;
    const r: Ring = { loop, mat, age: 0, active: false };
    this.pool.push(r);
    this.group.add(loop);
    return r;
  }

  /** Spawn a ripple at a surface point, lying tangent to the sphere there. */
  spawn(pos: THREE.Vector3) {
    const r = this.obtain();
    if (!r) return;
    r.active = true;
    r.age = 0;
    r.loop.visible = true;
    r.loop.position.copy(pos);
    r.loop.quaternion.setFromUnitVectors(Z, pos.clone().normalize());
  }

  update(dt: number) {
    for (const r of this.pool) {
      if (!r.active) continue;
      r.age += dt;
      const k = r.age / LIFE;
      if (k >= 1) { r.active = false; r.loop.visible = false; continue; }
      const s = 0.15 + k * MAX_SCALE;
      r.loop.scale.set(s, s, s);
      r.mat.opacity = (1 - k) * (1 - k) * 0.9;
    }
  }
}
