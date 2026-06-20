// Honest geometric pictures of a qubit. "single": the Bloch vector for
// |ψ⟩ = cos(θ/2)|0⟩ + e^{iφ}sin(θ/2)|1⟩. "majorana": a spin-j state's
// constellation — the 2j roots of the Majorana polynomial, stereographically
// projected onto the sphere. A gate is a rigid rotation of the sphere, so the
// vector / constellation rotates as a body (norm preserved, point count = 2j).

import * as THREE from "three";
import type { GenerativeSystem, Params, RenderSurface, ThreeSurface } from "../harness/GenerativeSystem";
import { deviceSize } from "../harness/GenerativeSystem";
import type { RNG } from "../core/math/rng";

interface State {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  group: THREE.Group; // rotates under the gate
  axis: THREE.Vector3;
  speed: number;
  points: number;
  norm: number;
  w: number;
  h: number;
}

type Cx = [number, number];
const cmul = (a: Cx, b: Cx): Cx => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cadd = (a: Cx, b: Cx): Cx => [a[0] + b[0], a[1] + b[1]];
const csub = (a: Cx, b: Cx): Cx => [a[0] - b[0], a[1] - b[1]];
function cdiv(a: Cx, b: Cx): Cx {
  const d = b[0] * b[0] + b[1] * b[1] || 1e-18;
  return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d];
}

function binom(n: number, k: number): number {
  let r = 1;
  for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1);
  return r;
}

/** Durand–Kerner: roots of a monic polynomial given its coeffs (low→high). */
function roots(coeffs: Cx[]): Cx[] {
  // trim near-zero leading coeffs (roots at infinity → south pole later)
  let deg = coeffs.length - 1;
  while (deg > 0 && Math.hypot(coeffs[deg][0], coeffs[deg][1]) < 1e-9) deg--;
  if (deg <= 0) return [];
  const lead = coeffs[deg];
  const a: Cx[] = [];
  for (let i = 0; i <= deg; i++) a.push(cdiv(coeffs[i], lead)); // monic
  const horner = (z: Cx): Cx => {
    let r: Cx = a[deg];
    for (let i = deg - 1; i >= 0; i--) r = cadd(cmul(r, z), a[i]);
    return r;
  };
  const r: Cx[] = [];
  const seed: Cx = [0.4, 0.9];
  let p: Cx = [1, 0];
  for (let i = 0; i < deg; i++) {
    r.push(p);
    p = cmul(p, seed);
  }
  for (let iter = 0; iter < 80; iter++) {
    for (let i = 0; i < deg; i++) {
      let den: Cx = [1, 0];
      for (let j = 0; j < deg; j++) if (j !== i) den = cmul(den, csub(r[i], r[j]));
      r[i] = csub(r[i], cdiv(horner(r[i]), den));
    }
  }
  return r;
}

/** stereographic: complex root z → unit sphere point (north-pole projection). */
function rootToSphere(z: Cx): THREE.Vector3 {
  const mag = Math.hypot(z[0], z[1]);
  const theta = 2 * Math.atan(mag);
  const phi = Math.atan2(z[1], z[0]);
  return new THREE.Vector3(Math.sin(theta) * Math.cos(phi), Math.cos(theta), Math.sin(theta) * Math.sin(phi));
}

function buildSphere(scene: THREE.Scene): void {
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(1, 36, 24),
    new THREE.MeshBasicMaterial({ color: 0x2b3756, wireframe: true, transparent: true, opacity: 0.45 }),
  );
  scene.add(sphere);
  const axes = new THREE.AxesHelper(1.35);
  scene.add(axes);
  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  const pl = new THREE.PointLight(0xffffff, 80);
  pl.position.set(3, 4, 5);
  scene.add(pl);
}

function gateAxis(gate: string): THREE.Vector3 {
  switch (gate) {
    case "X":
      return new THREE.Vector3(1, 0, 0);
    case "Y":
      return new THREE.Vector3(0, 1, 0);
    case "Z":
      return new THREE.Vector3(0, 1, 0); // |0>/|1> axis is the sphere's vertical here
    case "H":
      return new THREE.Vector3(1, 1, 0).normalize();
    default:
      return new THREE.Vector3(0, 0, 0);
  }
}

function addStar(group: THREE.Group, dir: THREE.Vector3): void {
  const dot = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0x8fd3ff, emissive: 0x2a6fae, emissiveIntensity: 0.6 }),
  );
  dot.position.copy(dir);
  group.add(dot);
  const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), dir]);
  group.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x4a86b8 })));
}

export const blochMajorana: GenerativeSystem<State> = {
  id: "bloch-majorana",
  title: "Bloch / Majorana",
  blurb: "qubit geometry & constellations",
  backend: "three",
  schema: {
    mode: { type: "select", options: ["single", "majorana"], default: "single", label: "mode" },
    j: { type: "number", min: 0.5, max: 4, step: 0.5, default: 1, label: "spin j" },
    gate: { type: "select", options: ["X", "Y", "Z", "H", "none"], default: "Y", label: "gate" },
    speed: { type: "number", min: 0, max: 3, step: 0.1, default: 0.6, hot: true, label: "speed" },
  },

  init(surface: RenderSurface, params: Params, rng: RNG): State {
    const s = surface as ThreeSurface;
    const canvasAny = s.canvas as HTMLCanvasElement & { __qsRenderer?: THREE.WebGLRenderer };
    const renderer = canvasAny.__qsRenderer ?? new THREE.WebGLRenderer({ canvas: s.canvas, antialias: true });
    canvasAny.__qsRenderer = renderer;
    renderer.setClearColor(0x0b0d12, 1);
    const { w, h } = deviceSize(surface);
    renderer.setSize(w, h, false);

    const scene = new THREE.Scene();
    buildSphere(scene);
    const camera = new THREE.PerspectiveCamera(48, w / h, 0.1, 100);
    camera.position.set(2.4, 1.7, 2.7);
    camera.lookAt(0, 0, 0);

    const group = new THREE.Group();
    scene.add(group);

    const mode = String(params.mode);
    const j = Number(params.j);
    let points = 1;

    if (mode === "single") {
      // a seeded qubit |ψ> = cos(θ/2)|0> + e^{iφ} sin(θ/2)|1>
      const theta = rng.range(0.4, Math.PI - 0.4);
      const phi = rng.range(0, Math.PI * 2);
      const dir = new THREE.Vector3(
        Math.sin(theta) * Math.cos(phi),
        Math.cos(theta),
        Math.sin(theta) * Math.sin(phi),
      );
      addStar(group, dir);
      points = 1;
    } else {
      const twoJ = Math.round(2 * j);
      // seeded spin-j state, normalized
      const c: Cx[] = [];
      let nrm = 0;
      for (let k = 0; k <= twoJ; k++) {
        const re = rng.gaussian();
        const im = rng.gaussian();
        c.push([re, im]);
        nrm += re * re + im * im;
      }
      const inv = 1 / Math.sqrt(nrm || 1);
      for (let k = 0; k <= twoJ; k++) c[k] = [c[k][0] * inv, c[k][1] * inv];
      // Majorana polynomial coeffs a_k = (-1)^k * sqrt(C(2j,k)) * c_k
      const a: Cx[] = [];
      for (let k = 0; k <= twoJ; k++) {
        const w2 = Math.sqrt(binom(twoJ, k)) * (k % 2 === 0 ? 1 : -1);
        a.push([c[k][0] * w2, c[k][1] * w2]);
      }
      const rs = roots(a);
      for (const z of rs) addStar(group, rootToSphere(z));
      for (let m = rs.length; m < twoJ; m++) addStar(group, new THREE.Vector3(0, -1, 0)); // roots at ∞
      points = twoJ;
    }

    return {
      renderer,
      scene,
      camera,
      group,
      axis: gateAxis(String(params.gate)),
      speed: Number(params.speed),
      points,
      norm: 1,
      w,
      h,
    };
  },

  step(state, dt) {
    if (state.axis.lengthSq() > 0 && state.speed > 0) {
      state.group.rotateOnWorldAxis(state.axis, state.speed * dt);
    }
    return state;
  },

  render(state, surface) {
    const { w, h } = deviceSize(surface);
    if (w !== state.w || h !== state.h) {
      state.renderer.setSize(w, h, false);
      state.camera.aspect = w / h;
      state.camera.updateProjectionMatrix();
      state.w = w;
      state.h = h;
    }
    state.renderer.render(state.scene, state.camera);
  },

  isDone: () => false,

  diagnostics(state) {
    const first = state.group.children.find((c) => c instanceof THREE.Mesh) as THREE.Mesh | undefined;
    const p = first ? first.getWorldPosition(new THREE.Vector3()) : new THREE.Vector3(0, 1, 0);
    return {
      norm: state.norm,
      points: state.points,
      theta: Math.acos(Math.max(-1, Math.min(1, p.y))),
      phi: Math.atan2(p.z, p.x),
    };
  },
};
