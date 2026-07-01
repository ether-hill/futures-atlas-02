/**
 * The desert stage: terrain, mesas, rocks, road, sky/sun/stars and the
 * day-night lighting rig. Everything cosmetic is seeded from the world RNG so
 * a given seed always looks the same.
 */

import * as THREE from "three";
import { CELL, GRID } from "./defs";
import { RNG, hashSeed } from "./rng";

export const PLOT = GRID * CELL; // 240 m

// deterministic 2-octave value noise (no library, no Math.random)
function vnoise(x: number, z: number, seed: number): number {
  const hash = (ix: number, iz: number) => {
    let h = (ix * 374761393 + iz * 668265263 + seed * 962287) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return (((h ^ (h >>> 16)) >>> 0) / 4294967296) * 2 - 1;
  };
  const sm = (t: number) => t * t * (3 - 2 * t);
  let amp = 1, freq = 1, sum = 0, norm = 0;
  for (let o = 0; o < 2; o++) {
    const ix = Math.floor(x * freq), iz = Math.floor(z * freq);
    const fx = sm(x * freq - ix), fz = sm(z * freq - iz);
    const v =
      hash(ix, iz) * (1 - fx) * (1 - fz) +
      hash(ix + 1, iz) * fx * (1 - fz) +
      hash(ix, iz + 1) * (1 - fx) * fz +
      hash(ix + 1, iz + 1) * fx * fz;
    sum += v * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2.1;
  }
  return sum / norm;
}

export interface Env {
  sky: THREE.Color;
  fog: THREE.Color;
  sunI: number;
  hemiI: number;
  sunColor: THREE.Color;
  night: number; // 0 day .. 1 deep night
}

// hour keyframes for the sky — the whole mood of the piece lives here
const STOPS: { h: number; sky: string; fog: string; sun: string; sunI: number; hemiI: number }[] = [
  { h: 0.0, sky: "#0b1020", fog: "#131627", sun: "#8fa3c8", sunI: 0.14, hemiI: 0.26 },
  { h: 4.5, sky: "#0d1226", fog: "#181a2c", sun: "#8fa3c8", sunI: 0.14, hemiI: 0.26 },
  { h: 6.0, sky: "#3d3550", fog: "#7a4f57", sun: "#ff9d5c", sunI: 0.55, hemiI: 0.3 },
  { h: 7.5, sky: "#8fb0cf", fog: "#e0b18f", sun: "#ffd9a0", sunI: 1.1, hemiI: 0.5 },
  { h: 12.0, sky: "#a9c6de", fog: "#d9cdb4", sun: "#fff3dd", sunI: 1.45, hemiI: 0.62 },
  { h: 16.5, sky: "#9db8d3", fog: "#dcc3a2", sun: "#ffe3b0", sunI: 1.25, hemiI: 0.55 },
  { h: 18.5, sky: "#54425f", fog: "#b06a4e", sun: "#ff7e45", sunI: 0.5, hemiI: 0.3 },
  { h: 20.0, sky: "#131730", fog: "#1d1e33", sun: "#93a6cc", sunI: 0.15, hemiI: 0.27 },
  { h: 24.0, sky: "#0b1020", fog: "#131627", sun: "#8fa3c8", sunI: 0.14, hemiI: 0.26 },
];

export function envAt(hour: number, dust: number, smog = 0): Env {
  let a = STOPS[0], b = STOPS[STOPS.length - 1];
  for (let i = 0; i < STOPS.length - 1; i++) {
    if (hour >= STOPS[i].h && hour <= STOPS[i + 1].h) {
      a = STOPS[i];
      b = STOPS[i + 1];
      break;
    }
  }
  const t = (hour - a.h) / Math.max(b.h - a.h, 1e-6);
  const sky = new THREE.Color(a.sky).lerp(new THREE.Color(b.sky), t);
  const fog = new THREE.Color(a.fog).lerp(new THREE.Color(b.fog), t);
  const sunColor = new THREE.Color(a.sun).lerp(new THREE.Color(b.sun), t);
  let sunI = a.sunI + (b.sunI - a.sunI) * t;
  let hemiI = a.hemiI + (b.hemiI - a.hemiI) * t;
  // dust storm: everything sinks into an ochre murk
  if (dust > 0) {
    const murk = new THREE.Color("#a5713f");
    sky.lerp(murk, 0.55 * dust);
    fog.lerp(murk, 0.7 * dust);
    sunI *= 1 - 0.6 * dust;
    hemiI *= 1 - 0.25 * dust;
  }
  // lingering combustion smog: a grey-brown pall that flattens the light
  if (smog > 0) {
    const pall = new THREE.Color("#8a7657");
    sky.lerp(pall, 0.45 * smog);
    fog.lerp(pall, 0.55 * smog);
    sunI *= 1 - 0.35 * smog;
  }
  const night = THREE.MathUtils.clamp(1 - sunI / 0.5, 0, 1);
  return { sky, fog, sunI, hemiI, sunColor, night };
}

export class World {
  readonly scene = new THREE.Scene();
  readonly sun: THREE.DirectionalLight;
  readonly hemi: THREE.HemisphereLight;
  readonly grid: THREE.GridHelper;
  private stars: THREE.Points;
  private starsMat: THREE.PointsMaterial;
  private sunDisc: THREE.Mesh;
  private fogExp: THREE.FogExp2;
  private hazeMat!: THREE.MeshBasicMaterial;

  constructor(seedWord: string) {
    const rng = new RNG(hashSeed(seedWord));
    const scene = this.scene;

    this.fogExp = new THREE.FogExp2(0xd9cdb4, 0.001);
    scene.fog = this.fogExp;

    // lights
    this.hemi = new THREE.HemisphereLight(0xcfe0f2, 0x8a6f52, 0.6);
    scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xfff3dd, 1.4);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    const sc = this.sun.shadow.camera;
    sc.left = -220; sc.right = 220; sc.top = 220; sc.bottom = -220;
    sc.near = 50; sc.far = 900;
    this.sun.shadow.bias = -0.0004;
    scene.add(this.sun);
    scene.add(this.sun.target);

    // terrain: flat buildable plateau, noisy desert beyond
    const size = 1600, seg = 160;
    const geo = new THREE.PlaneGeometry(size, size, seg, seg);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    const sand = new THREE.Color("#c9a97e");
    const sandDark = new THREE.Color("#a5825c");
    const sandPale = new THREE.Color("#d8bf98");
    const c = new THREE.Color();
    const tSeed = hashSeed(seedWord + "-terrain");
    // the town rectangle south of the plot stays flat too
    const townFade = (x: number, z: number) => {
      const dx = Math.max(Math.abs(x) - 200, 0);
      const dz = Math.max(z - (PLOT / 2 + 195), (PLOT / 2 - 10) - z, 0);
      return THREE.MathUtils.smoothstep(Math.max(dx, dz), 4, 90);
    };
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const r = Math.max(Math.abs(x), Math.abs(z));
      // 0 inside the plot (+ small apron), ramping to full noise outside
      const fade = Math.min(
        THREE.MathUtils.smoothstep(r, PLOT * 0.62, PLOT * 1.5),
        townFade(x, z),
      );
      const h = vnoise(x / 90, z / 90, tSeed) * 9 * fade + vnoise(x / 22, z / 22, tSeed ^ 7) * 1.4 * fade;
      pos.setY(i, h);
      const n = vnoise(x / 14, z / 14, tSeed ^ 13) * 0.5 + 0.5;
      c.copy(sand).lerp(n > 0.5 ? sandPale : sandDark, Math.abs(n - 0.5) * 2 * 0.8);
      c.multiplyScalar(1 - fade * 0.12);
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    const ground = new THREE.Mesh(
      geo,
      new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 }),
    );
    ground.receiveShadow = true;
    scene.add(ground);

    // distant mesas — low-poly silhouettes on the horizon
    const mesaMat = new THREE.MeshStandardMaterial({ color: "#7a5940", roughness: 1, flatShading: true });
    for (let i = 0; i < 8; i++) {
      const ang = rng.range(0, Math.PI * 2);
      const dist = rng.range(640, 920);
      const w = rng.range(55, 150);
      const h = rng.range(26, 62);
      const mesa = new THREE.Mesh(new THREE.CylinderGeometry(w * rng.range(0.5, 0.8), w, h, rng.int(5, 8)), mesaMat);
      mesa.position.set(Math.cos(ang) * dist, h / 2 - 6, Math.sin(ang) * dist);
      mesa.rotation.y = rng.range(0, Math.PI);
      scene.add(mesa);
    }

    // scattered rocks + scrub outside the plot
    const rockMat = new THREE.MeshStandardMaterial({ color: "#9d7f5f", roughness: 1, flatShading: true });
    const scrubMat = new THREE.MeshStandardMaterial({ color: "#5f6244", roughness: 1, flatShading: true });
    const rockGeo = new THREE.DodecahedronGeometry(1, 0);
    const scrubGeo = new THREE.IcosahedronGeometry(1, 0);
    const dressing = new THREE.Group();
    for (let i = 0; i < 260; i++) {
      const ang = rng.range(0, Math.PI * 2);
      const dist = rng.range(PLOT * 0.72, 640);
      const x = Math.cos(ang) * dist, z = Math.sin(ang) * dist;
      // keep the town's lawns clear of desert litter
      if (Math.abs(x) < 205 && z > PLOT / 2 - 12 && z < PLOT / 2 + 200) continue;
      const isRock = rng.chance(0.45);
      const m = new THREE.Mesh(isRock ? rockGeo : scrubGeo, isRock ? rockMat : scrubMat);
      const s = isRock ? rng.range(0.5, 2.6) : rng.range(0.7, 1.5);
      m.scale.set(s * rng.range(0.7, 1.4), s * (isRock ? rng.range(0.5, 1) : rng.range(0.8, 1.3)), s);
      const y = vnoise(x / 90, z / 90, tSeed) * 9 * THREE.MathUtils.smoothstep(Math.max(Math.abs(x), Math.abs(z)), PLOT * 0.62, PLOT * 1.5);
      m.position.set(x, y + s * 0.3, z);
      m.rotation.set(rng.range(0, 3), rng.range(0, 3), rng.range(0, 3));
      m.castShadow = s > 1.2;
      dressing.add(m);
    }
    scene.add(dressing);

    // access road from the campus gate through the town
    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 200),
      new THREE.MeshStandardMaterial({ color: "#43413d", roughness: 1 }),
    );
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.05, PLOT / 2 + 100);
    road.receiveShadow = true;
    scene.add(road);
    // centreline dashes
    const dashMat = new THREE.MeshStandardMaterial({ color: "#cfcabb", roughness: 0.9 });
    for (let i = 0; i < 24; i++) {
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 3), dashMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(0, 0.065, PLOT / 2 + 6 + i * 8.2);
      scene.add(dash);
    }

    // plot apron + boundary
    const apron = new THREE.Mesh(
      new THREE.PlaneGeometry(PLOT + 14, PLOT + 14),
      new THREE.MeshStandardMaterial({ color: "#b99a72", roughness: 1 }),
    );
    apron.rotation.x = -Math.PI / 2;
    apron.position.y = 0.02;
    apron.receiveShadow = true;
    scene.add(apron);
    // security fence: posts + translucent chain-link panels + top rail
    const fenceR = PLOT / 2 + 5;
    const postMat = new THREE.MeshStandardMaterial({ color: "#5b6066", roughness: 0.5, metalness: 0.6 });
    const meshMat = new THREE.MeshStandardMaterial({
      color: "#aeb6bd", transparent: true, opacity: 0.16, side: THREE.DoubleSide,
      roughness: 0.4, metalness: 0.6, depthWrite: false,
    });
    const postGeo = new THREE.CylinderGeometry(0.07, 0.07, 2.6, 5);
    const fenceGrp = new THREE.Group();
    for (const side of [0, 1, 2, 3]) {
      const horiz = side % 2 === 0;
      const fixed = side < 2 ? fenceR : -fenceR;
      // wire panel + top rail for the whole side
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(fenceR * 2, 2.4), meshMat);
      panel.position.y = 1.2;
      const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, fenceR * 2, 5), postMat);
      rail.rotation.z = Math.PI / 2;
      rail.position.y = 2.45;
      if (horiz) {
        panel.position.set(0, 1.2, fixed);
        rail.position.set(0, 2.45, fixed);
      } else {
        panel.rotation.y = Math.PI / 2;
        panel.position.set(fixed, 1.2, 0);
        rail.rotation.set(Math.PI / 2, 0, 0);
        rail.position.set(fixed, 2.45, 0);
      }
      fenceGrp.add(panel, rail);
      for (let p = -fenceR; p <= fenceR; p += 12) {
        // leave a gate gap where the access road meets the south side
        if (horiz && fixed > 0 && Math.abs(p) < 7) continue;
        const post = new THREE.Mesh(postGeo, postMat);
        post.position.set(horiz ? p : fixed, 1.3, horiz ? fixed : p);
        fenceGrp.add(post);
      }
    }
    scene.add(fenceGrp);

    // placement grid (shown only while building)
    this.grid = new THREE.GridHelper(PLOT, GRID, 0x223244, 0x223244);
    (this.grid.material as THREE.LineBasicMaterial).transparent = true;
    (this.grid.material as THREE.LineBasicMaterial).opacity = 0.28;
    this.grid.position.y = 0.09;
    this.grid.visible = false;
    scene.add(this.grid);

    // stars
    const starGeo = new THREE.BufferGeometry();
    const N = 900;
    const sp = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const u = rng.next(), v = rng.next();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(1 - v); // upper hemisphere
      const R = 1200;
      sp[i * 3] = R * Math.sin(phi) * Math.cos(theta);
      sp[i * 3 + 1] = Math.abs(R * Math.cos(phi)) + 40;
      sp[i * 3 + 2] = R * Math.sin(phi) * Math.sin(theta);
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(sp, 3));
    this.starsMat = new THREE.PointsMaterial({ color: 0xdfe8ff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, fog: false });
    this.stars = new THREE.Points(starGeo, this.starsMat);
    scene.add(this.stars);

    // sun disc
    this.sunDisc = new THREE.Mesh(
      new THREE.SphereGeometry(22, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xffe9c4, fog: false }),
    );
    scene.add(this.sunDisc);

    // low brown pall that thickens over the campus as smog builds
    this.hazeMat = new THREE.MeshBasicMaterial({
      color: 0x6e5c40, transparent: true, opacity: 0, depthWrite: false,
    });
    const haze = new THREE.Mesh(new THREE.PlaneGeometry(PLOT * 2.6, PLOT * 2.6), this.hazeMat);
    haze.rotation.x = -Math.PI / 2;
    haze.position.y = 26;
    scene.add(haze);
  }

  /** Drive lighting/sky from sim time. `dust`/`smog` 0..1. */
  update(hour: number, dust: number, smog = 0): Env {
    const env = envAt(hour, dust, smog);
    this.scene.background = env.sky;
    this.fogExp.color.copy(env.fog);
    this.fogExp.density = 0.001 + dust * 0.0045 + smog * 0.0014;
    this.hazeMat.opacity = smog * 0.3;

    // sun path: rises east (+x), sets west; parks below horizon at night
    const ang = ((hour - 6) / 12) * Math.PI; // 0 at 06h → π at 18h
    const el = Math.sin(ang);
    const az = Math.cos(ang);
    const R = 620;
    const y = Math.max(el, -0.25) * R * 0.75;
    this.sun.position.set(az * R, y, R * 0.28);
    this.sun.target.position.set(0, 0, 0);
    this.sun.intensity = env.sunI;
    this.sun.color.copy(env.sunColor);
    this.hemi.intensity = env.hemiI;
    this.hemi.color.copy(env.sky).lerp(new THREE.Color(0xffffff), 0.4);

    this.sunDisc.position.copy(this.sun.position).multiplyScalar(1.6);
    this.sunDisc.visible = el > -0.05 && dust < 0.5;
    (this.sunDisc.material as THREE.MeshBasicMaterial).color.copy(env.sunColor);

    this.starsMat.opacity = env.night * 0.9 * (1 - dust);
    this.stars.rotation.y = hour * 0.01;
    return env;
  }
}

/** cell (x,z, footprint w,d) → world-space centre of that footprint. */
export function cellToWorld(x: number, z: number, w: number, d: number): THREE.Vector3 {
  return new THREE.Vector3(
    -PLOT / 2 + (x + w / 2) * CELL,
    0,
    -PLOT / 2 + (z + d / 2) * CELL,
  );
}

/** world point → cell coords (unclamped; caller validates). */
export function worldToCell(p: THREE.Vector3): { x: number; z: number } {
  return {
    x: Math.floor((p.x + PLOT / 2) / CELL),
    z: Math.floor((p.z + PLOT / 2) / CELL),
  };
}
