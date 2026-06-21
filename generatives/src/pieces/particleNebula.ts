// particleNebula — a 3D probability-cloud point field (orbital-like shells),
// drifting and pulsing with a slow parallax rotation. GPU-drawn points, cheap.
// complexity = particle count, chaos = dispersion. Loops via a full rotation.

import * as THREE from "three";
import type { Piece, PieceContext, PieceFactory, ParamSchema } from "../core/piece";
import type { ThreeSurface } from "../core/surface";
import { sample } from "../core/color/theme";
import { count } from "../core/meta";

const TAU = Math.PI * 2;

class ParticleNebula implements Piece {
  id = "particle-nebula";
  title = "Particle Nebula";
  tags = ["quantum", "nature"];
  backend = "three" as const;
  loopSeconds = 32;
  schema: ParamSchema = {
    pointSize: { type: "number", min: 0.5, max: 4, step: 0.1, default: 1.6, label: "point size" },
  };
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private group!: THREE.Group;
  private w = 1;
  private h = 1;

  init(ctx: PieceContext): void {
    const s = ctx.surface as ThreeSurface;
    const canvasAny = s.canvas as HTMLCanvasElement & { __prismRenderer?: THREE.WebGLRenderer };
    this.renderer = canvasAny.__prismRenderer ?? new THREE.WebGLRenderer({ canvas: s.canvas, antialias: true });
    canvasAny.__prismRenderer = this.renderer;
    this.w = ctx.width;
    this.h = ctx.height;
    this.renderer.setSize(this.w, this.h, false);
    this.renderer.setClearColor(new THREE.Color(ctx.palette.bg), 1);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, this.w / this.h, 0.1, 100);
    this.camera.position.set(0, 0, 6);
    this.group = new THREE.Group();
    this.scene.add(this.group);

    const N = count(ctx.meta.complexity, 6000, 40000);
    const disp = 0.4 + ctx.meta.chaos * 1.2;
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      // gaussian shells → orbital-cloud feel
      const shell = ctx.rng.pick([1, 1.7, 2.5]);
      const r = shell + ctx.rng.gaussian(0, 0.35 * disp);
      const u = ctx.rng.range(-1, 1);
      const th = ctx.rng.range(0, TAU);
      const sr = Math.sqrt(1 - u * u);
      pos[i * 3] = r * sr * Math.cos(th);
      pos[i * 3 + 1] = r * sr * Math.sin(th);
      pos[i * 3 + 2] = r * u;
      const c = sample(ctx.palette, Math.min(1, (r - 0.6) / 2.2));
      col[i * 3] = c[0] / 255;
      col[i * 3 + 1] = c[1] / 255;
      col[i * 3 + 2] = c[2] / 255;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({
      size: Number(ctx.params.pointSize) * 0.012,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.group.add(new THREE.Points(geo, mat));
  }
  applyMeta(): void {
    /* count/dispersion change needs remount */
  }
  update(_dt: number, t: number): void {
    const ph = (t / this.loopSeconds) * TAU;
    this.group.rotation.y = ph;
    this.group.rotation.x = Math.sin(ph) * 0.15;
    const s = 1 + 0.03 * Math.sin(ph * 2.0);
    this.group.scale.setScalar(s);
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
    this.scene?.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose?.();
    });
  }
}

export const createParticleNebula: PieceFactory = () => new ParticleNebula();
