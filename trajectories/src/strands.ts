import * as THREE from "three";
import { SPHERE_R, COLORS, type Params } from "./config";

// The filament field: thousands of strands reaching from the sphere centre to
// its surface. Strand directions are spread with a Fibonacci spiral; each strand
// bends through layered noise that grows with radius. Brightness is computed in
// the shader as a U-shaped envelope (bright at core + tip, dim mid — so a strand
// never looks broken) plus a pulse that flows outward along the filament.
// Original implementation; concept after Jeongho Park's "Collective Trajectories".

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const VERT = /* glsl */ `
  attribute float aT;
  attribute vec3 aBasisA;
  attribute vec3 aBasisB;
  attribute float aPhase;
  attribute float aDelay;
  uniform float uTime, uReveal, uFlow, uShimmer, uAmp;
  varying float vBright;
  varying float vT;
  void main() {
    float t = aT;
    float rev = clamp((uReveal - aDelay) / 0.35, 0.0, 1.0);
    float amp = uAmp * pow(t, 1.35);
    float ph = aPhase * 6.2831853;
    float a = sin(t * 9.0 + uTime * uShimmer + ph) + 0.5 * sin(t * 17.0 - uTime * uShimmer * 0.7 + ph * 1.7);
    float b = cos(t * 11.0 + uTime * uShimmer * 0.8 + ph * 1.3) + 0.5 * cos(t * 15.0 + uTime * uShimmer + ph * 0.6);
    vec3 pos = position * rev + (aBasisA * a + aBasisB * b) * amp * rev;

    float u = pow(abs(2.0 * t - 1.0), 1.3);          // U-shaped envelope
    float base = 0.11 + 0.26 * u;
    float pp = fract(t - uTime * uFlow + aPhase);     // pulse flowing outward
    float d = min(pp, 1.0 - pp);
    float pulse = exp(-d * d * 70.0);
    vBright = (base + pulse * 1.5) * rev;
    vT = t;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;
  uniform vec3 uCore;
  uniform vec3 uTip;
  varying float vBright;
  varying float vT;
  void main() {
    vec3 col = mix(uCore, uTip, smoothstep(0.0, 1.0, vT));
    gl_FragColor = vec4(col * vBright, 1.0);
  }
`;

export class StrandField {
  group = new THREE.Group();
  private mesh: THREE.LineSegments | null = null;
  private mat: THREE.ShaderMaterial;
  private dirs: THREE.Vector3[] = [];
  private time = 0;
  private reveal = 0;

  constructor(params: Params, seed: number) {
    this.mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uReveal: { value: 0 },
        uFlow: { value: params.flow },
        uShimmer: { value: params.shimmer },
        uAmp: { value: params.amp },
        uCore: { value: new THREE.Color().fromArray(COLORS.core) },
        uTip: { value: new THREE.Color().fromArray(COLORS.tip) },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.build(params, seed);
  }

  build(params: Params, seed: number) {
    if (this.mesh) {
      this.group.remove(this.mesh);
      this.mesh.geometry.dispose();
    }
    const N = Math.max(1, Math.floor(params.strands));
    const M = Math.max(6, Math.floor(params.points));
    const rng = mulberry32(seed);
    const golden = Math.PI * (3 - Math.sqrt(5));
    const R0 = 1.95; // strands emanate from the orb surface, not a single point
    const span = SPHERE_R - R0;

    const positions = new Float32Array(N * M * 3);
    const aT = new Float32Array(N * M);
    const aBasisA = new Float32Array(N * M * 3);
    const aBasisB = new Float32Array(N * M * 3);
    const aPhase = new Float32Array(N * M);
    const aDelay = new Float32Array(N * M);
    const index: number[] = [];

    const up = new THREE.Vector3();
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    const dir = new THREE.Vector3();
    this.dirs = [];

    for (let s = 0; s < N; s++) {
      const y = 1 - (s / Math.max(1, N - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const th = s * golden;
      dir.set(Math.cos(th) * r, y, Math.sin(th) * r).normalize();
      this.dirs.push(dir.clone());

      up.set(0, 1, 0);
      if (Math.abs(dir.y) > 0.985) up.set(1, 0, 0);
      a.copy(up).cross(dir).normalize();
      b.copy(dir).cross(a).normalize();

      const phase = rng();
      const delay = rng() * 0.6;
      const base = s * M;
      for (let j = 0; j < M; j++) {
        const t = j / (M - 1);
        const vi = base + j;
        const rad = R0 + t * span;
        positions[vi * 3] = dir.x * rad;
        positions[vi * 3 + 1] = dir.y * rad;
        positions[vi * 3 + 2] = dir.z * rad;
        aT[vi] = t;
        aBasisA[vi * 3] = a.x; aBasisA[vi * 3 + 1] = a.y; aBasisA[vi * 3 + 2] = a.z;
        aBasisB[vi * 3] = b.x; aBasisB[vi * 3 + 1] = b.y; aBasisB[vi * 3 + 2] = b.z;
        aPhase[vi] = phase;
        aDelay[vi] = delay;
        if (j < M - 1) index.push(vi, vi + 1);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aT", new THREE.BufferAttribute(aT, 1));
    geo.setAttribute("aBasisA", new THREE.BufferAttribute(aBasisA, 3));
    geo.setAttribute("aBasisB", new THREE.BufferAttribute(aBasisB, 3));
    geo.setAttribute("aPhase", new THREE.BufferAttribute(aPhase, 1));
    geo.setAttribute("aDelay", new THREE.BufferAttribute(aDelay, 1));
    geo.setIndex(index);
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), SPHERE_R * 1.7);

    this.mesh = new THREE.LineSegments(geo, this.mat);
    this.mesh.frustumCulled = false;
    this.group.add(this.mesh);
  }

  setParams(p: Params) {
    this.mat.uniforms.uFlow.value = p.flow;
    this.mat.uniforms.uShimmer.value = p.shimmer;
    this.mat.uniforms.uAmp.value = p.amp;
  }

  resetReveal() { this.reveal = 0; }

  update(dt: number) {
    this.time += dt;
    this.reveal += (1.15 - this.reveal) * Math.min(1, dt * 0.6);
    this.mat.uniforms.uTime.value = this.time;
    this.mat.uniforms.uReveal.value = this.reveal;
  }

  /** A random surface point (world position) for spawning a ripple ring. */
  surfacePoint(rand: number): THREE.Vector3 {
    if (this.dirs.length === 0) return new THREE.Vector3(0, SPHERE_R, 0);
    const d = this.dirs[Math.floor(rand * this.dirs.length) % this.dirs.length];
    return d.clone().multiplyScalar(SPHERE_R);
  }

  get revealed(): number { return Math.min(1, this.reveal); }
}
