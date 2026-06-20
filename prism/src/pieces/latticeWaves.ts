// latticeWaves — a 3D grid surface rippling under a sum of wave functions, drawn
// as a glowing wireframe with a slowly orbiting camera. Vertices are displaced
// on the CPU each frame (a few thousand — light); the loop is seamless via
// integer-frequency phases. complexity = grid resolution, chaos = wave amplitude.

import * as THREE from "three";
import type { Piece, PieceContext, PieceFactory, ParamSchema } from "../core/piece";
import type { ThreeSurface } from "../core/surface";
import { sample } from "../core/color/theme";
import { count } from "../core/meta";

const TAU = Math.PI * 2;

class LatticeWaves implements Piece {
  id = "lattice-waves";
  title = "Lattice Waves";
  tags = ["physics", "math"];
  backend = "three" as const;
  loopSeconds = 24;
  schema: ParamSchema = {
    spin: { type: "number", min: 0, max: 1, step: 0.05, default: 0.4, label: "camera spin" },
  };
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private mesh!: THREE.Mesh;
  private base!: Float32Array;
  private posAttr!: THREE.BufferAttribute;
  private colAttr!: THREE.BufferAttribute;
  private res = 60;
  private amp = 1;
  private waves: number[] = [];
  private w = 1;
  private h = 1;
  private spin = 0.4;
  private palStops: [number, number, number][] = [];

  init(ctx: PieceContext): void {
    const s = ctx.surface as ThreeSurface;
    const canvasAny = s.canvas as HTMLCanvasElement & { __prismRenderer?: THREE.WebGLRenderer };
    this.renderer = canvasAny.__prismRenderer ?? new THREE.WebGLRenderer({ canvas: s.canvas, antialias: true });
    canvasAny.__prismRenderer = this.renderer;
    this.w = ctx.width;
    this.h = ctx.height;
    this.renderer.setSize(this.w, this.h, false);
    this.renderer.setClearColor(new THREE.Color(ctx.palette.bg), 1);
    this.spin = Number(ctx.params.spin);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, this.w / this.h, 0.1, 100);
    this.camera.position.set(0, 3.2, 4.2);
    this.camera.lookAt(0, 0, 0);

    this.res = count(ctx.meta.complexity, 36, 96);
    this.amp = 0.4 + ctx.meta.chaos * 1.4;
    // a few seeded wave directions (integer angular freqs → seamless)
    this.waves = [];
    for (let i = 0; i < 4; i++) {
      this.waves.push(ctx.rng.range(0.6, 2.2), ctx.rng.range(0, TAU), Math.max(1, Math.round(ctx.rng.range(1, 3))));
    }
    for (let i = 0; i <= 8; i++) this.palStops.push(sample(ctx.palette, i / 8));

    const geo = new THREE.PlaneGeometry(5, 5, this.res, this.res);
    geo.rotateX(-Math.PI / 2);
    this.base = (geo.getAttribute("position").array as Float32Array).slice();
    const col = new Float32Array(this.base.length);
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    this.posAttr = geo.getAttribute("position") as THREE.BufferAttribute;
    this.colAttr = geo.getAttribute("color") as THREE.BufferAttribute;
    const mat = new THREE.MeshBasicMaterial({ wireframe: true, vertexColors: true });
    this.mesh = new THREE.Mesh(geo, mat);
    this.scene.add(this.mesh);
  }
  applyMeta(): void {
    /* resolution/amplitude change needs remount */
  }
  private colorAt(t: number): [number, number, number] {
    const x = Math.max(0, Math.min(1, t)) * 8;
    const i = Math.min(7, Math.floor(x));
    const f = x - i;
    const a = this.palStops[i]!;
    const b = this.palStops[i + 1]!;
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
  }
  update(_dt: number, t: number): void {
    const ph = (t / this.loopSeconds) * TAU;
    const pos = this.posAttr.array as Float32Array;
    const col = this.colAttr.array as Float32Array;
    const base = this.base;
    let minZ = 1e9;
    let maxZ = -1e9;
    for (let k = 0; k < pos.length; k += 3) {
      const x = base[k]!;
      const z = base[k + 2]!;
      let y = 0;
      for (let wv = 0; wv < this.waves.length; wv += 3) {
        const freq = this.waves[wv]!;
        const ang = this.waves[wv + 1]!;
        const cyc = this.waves[wv + 2]!;
        y += Math.sin((x * Math.cos(ang) + z * Math.sin(ang)) * freq + ph * cyc);
      }
      y *= this.amp * 0.18;
      pos[k + 1] = y;
      if (y < minZ) minZ = y;
      if (y > maxZ) maxZ = y;
    }
    const span = maxZ - minZ || 1;
    for (let k = 0; k < pos.length; k += 3) {
      const c = this.colorAt((pos[k + 1]! - minZ) / span);
      col[k] = c[0] / 255;
      col[k + 1] = c[1] / 255;
      col[k + 2] = c[2] / 255;
    }
    this.posAttr.needsUpdate = true;
    this.colAttr.needsUpdate = true;
    const cam = ph * this.spin;
    this.camera.position.set(Math.sin(cam) * 4.4, 3.2, Math.cos(cam) * 4.4);
    this.camera.lookAt(0, 0, 0);
  }
  render(): void {
    this.renderer.render(this.scene, this.camera);
  }
  resize(w: number, h: number): void {
    this.w = w;
    this.h = h;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }
  reseed(): void {}
  dispose(): void {
    this.mesh?.geometry?.dispose();
  }
}

export const createLatticeWaves: PieceFactory = () => new LatticeWaves();
