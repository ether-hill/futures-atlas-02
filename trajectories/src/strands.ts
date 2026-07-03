import * as THREE from "three";
import { POINTS_PER_STRAND, INNER_R, COLORS, type Params } from "./config";

// The filament field. Strand directions are spread with a Fibonacci spiral.
// Geometry is unit (direction + parametric t); the live radius, curl, pulse,
// envelope, extend-beyond-surface, intro growth and depth dimming are all
// computed in the shader from uniforms, so every GUI control updates instantly.
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
  attribute vec3 aDir;
  attribute float aT;
  attribute vec3 aBasisA;
  attribute vec3 aBasisB;
  attribute float aPhase;
  attribute float aDelay;
  attribute float aExtend;
  uniform float uTime, uRadius, uInner, uCurl, uFreq, uShimmer, uFlow, uPulse, uTipPow, uLineBase, uGrowDur, uGrowSpread, uExtendReach;
  varying float vBright;
  varying float vT;
  varying float vDepth;
  void main() {
    float t = aT;
    float maxR = mix(uRadius, uRadius * uExtendReach, aExtend);
    float rr = mix(uInner, maxR, t);

    float amp = uCurl * pow(t, 1.35) * (uRadius * 0.18);
    float ph = aPhase * 6.2831853;
    float a = sin(t * 9.0 * uFreq + uTime * uShimmer * 6.2831 + ph) + 0.5 * sin(t * 17.0 * uFreq - uTime * uShimmer * 4.0 + ph * 1.7);
    float b = cos(t * 11.0 * uFreq + uTime * uShimmer * 5.0 + ph * 1.3) + 0.5 * cos(t * 15.0 * uFreq + uTime * uShimmer * 6.0 + ph * 0.6);
    vec3 pos = aDir * rr + (aBasisA * a + aBasisB * b) * amp;

    // intro: each strand grows outward from the core
    float grow = clamp((uTime - aDelay * uGrowSpread) / uGrowDur, 0.0, 1.0);
    float frontFade = 1.0 - smoothstep(grow, grow + 0.06, t);

    // U-shaped envelope + outward-flowing pulses
    float u = pow(abs(2.0 * t - 1.0), uTipPow);
    float env = mix(1.0, uLineBase, 1.0 - u);
    float pp = fract(t * max(1.0, uPulse) - uTime * uFlow + aPhase);
    float d = min(pp, 1.0 - pp);
    float pulse = exp(-d * d * 70.0) * step(0.01, uPulse);
    float extendDim = mix(1.0, 0.5, aExtend);
    vBright = (env + pulse * 1.5) * extendDim * frontFade;
    vT = clamp(t * (uRadius / max(maxR, 0.001)), 0.0, 1.0);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAG = /* glsl */ `
  precision highp float;
  uniform vec3 uCore;
  uniform vec3 uTip;
  uniform float uOpacity, uDofDim, uFocus, uFocusRange, uFogStrength, uFogNear, uFogFar;
  varying float vBright;
  varying float vT;
  varying float vDepth;
  void main() {
    vec3 col = mix(uCore, uTip, smoothstep(0.0, 1.0, vT));
    float dim = 1.0 - uDofDim * clamp(abs(vDepth - uFocus) / uFocusRange, 0.0, 1.0);
    float fog = uFogStrength * clamp((vDepth - uFogNear) / max(0.001, uFogFar - uFogNear), 0.0, 1.0);
    gl_FragColor = vec4(col * vBright * uOpacity * dim * (1.0 - fog), 1.0);
  }
`;

export class StrandField {
  group = new THREE.Group();
  dirs: THREE.Vector3[] = [];
  private mesh: THREE.LineSegments | null = null;
  private mat: THREE.ShaderMaterial;
  private time = 0;

  constructor(params: Params, seed: number) {
    this.mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uTime: { value: 0 }, uRadius: { value: params.radius }, uInner: { value: INNER_R },
        uCurl: { value: params.curl }, uFreq: { value: params.freq }, uShimmer: { value: params.shimmer },
        uFlow: { value: params.flow }, uPulse: { value: params.pulse }, uTipPow: { value: params.tipPow },
        uLineBase: { value: params.lineBase }, uOpacity: { value: params.opacity },
        uExtendReach: { value: params.extendReach }, uGrowDur: { value: params.growDur }, uGrowSpread: { value: params.growSpread },
        uDofDim: { value: params.dofDim }, uFocus: { value: params.focus }, uFocusRange: { value: params.focusRange },
        uFogStrength: { value: params.fogStrength }, uFogNear: { value: params.fogNear }, uFogFar: { value: params.fogFar },
        uCore: { value: new THREE.Color().fromArray(COLORS.core) }, uTip: { value: new THREE.Color().fromArray(COLORS.tip) },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.build(params, seed);
  }

  build(params: Params, seed: number) {
    if (this.mesh) { this.group.remove(this.mesh); this.mesh.geometry.dispose(); }
    const N = Math.max(1, Math.floor(params.strands));
    const M = POINTS_PER_STRAND;
    const rng = mulberry32(seed);
    const golden = Math.PI * (3 - Math.sqrt(5));

    const aDir = new Float32Array(N * M * 3);
    const aT = new Float32Array(N * M);
    const aBasisA = new Float32Array(N * M * 3);
    const aBasisB = new Float32Array(N * M * 3);
    const aPhase = new Float32Array(N * M);
    const aDelay = new Float32Array(N * M);
    const aExtend = new Float32Array(N * M);
    const pos = new Float32Array(N * M * 3); // placeholder (shader computes real pos)
    const index: number[] = [];

    const up = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3(), dir = new THREE.Vector3();
    this.dirs = [];

    for (let s = 0; s < N; s++) {
      const y = 1 - (s / Math.max(1, N - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const th = s * golden;
      dir.set(Math.cos(th) * r, y, Math.sin(th) * r).normalize();
      this.dirs.push(dir.clone());
      up.set(0, 1, 0); if (Math.abs(dir.y) > 0.985) up.set(1, 0, 0);
      a.copy(up).cross(dir).normalize();
      b.copy(dir).cross(a).normalize();
      const phase = rng();
      const delay = rng();
      const extend = rng() < params.extendFrac ? 1 : 0;
      const base = s * M;
      for (let j = 0; j < M; j++) {
        const t = j / (M - 1);
        const vi = base + j;
        aDir[vi * 3] = dir.x; aDir[vi * 3 + 1] = dir.y; aDir[vi * 3 + 2] = dir.z;
        aT[vi] = t;
        aBasisA[vi * 3] = a.x; aBasisA[vi * 3 + 1] = a.y; aBasisA[vi * 3 + 2] = a.z;
        aBasisB[vi * 3] = b.x; aBasisB[vi * 3 + 1] = b.y; aBasisB[vi * 3 + 2] = b.z;
        aPhase[vi] = phase; aDelay[vi] = delay; aExtend[vi] = extend;
        if (j < M - 1) index.push(vi, vi + 1);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aDir", new THREE.BufferAttribute(aDir, 3));
    geo.setAttribute("aT", new THREE.BufferAttribute(aT, 1));
    geo.setAttribute("aBasisA", new THREE.BufferAttribute(aBasisA, 3));
    geo.setAttribute("aBasisB", new THREE.BufferAttribute(aBasisB, 3));
    geo.setAttribute("aPhase", new THREE.BufferAttribute(aPhase, 1));
    geo.setAttribute("aDelay", new THREE.BufferAttribute(aDelay, 1));
    geo.setAttribute("aExtend", new THREE.BufferAttribute(aExtend, 1));
    geo.setIndex(index);
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1000);

    this.mesh = new THREE.LineSegments(geo, this.mat);
    this.mesh.frustumCulled = false;
    this.group.add(this.mesh);
  }

  /** live uniform updates from the GUI */
  apply(p: Params) {
    const u = this.mat.uniforms;
    u.uRadius.value = p.radius; u.uCurl.value = p.curl; u.uFreq.value = p.freq;
    u.uShimmer.value = p.shimmer; u.uFlow.value = p.flow; u.uPulse.value = p.pulse;
    u.uTipPow.value = p.tipPow; u.uLineBase.value = p.lineBase; u.uOpacity.value = p.opacity;
    u.uExtendReach.value = p.extendReach; u.uGrowDur.value = p.growDur; u.uGrowSpread.value = p.growSpread;
    u.uDofDim.value = p.dofDim; u.uFocus.value = p.focus; u.uFocusRange.value = p.focusRange;
    u.uFogStrength.value = p.fogStrength; u.uFogNear.value = p.fogNear; u.uFogFar.value = p.fogFar;
  }

  setRadius(r: number) { this.mat.uniforms.uRadius.value = r; }
  restartGrowth() { this.time = 0; this.mat.uniforms.uTime.value = 0; }
  update(dt: number) { this.time += dt; this.mat.uniforms.uTime.value = this.time; }
  get radius() { return this.mat.uniforms.uRadius.value as number; }
}
