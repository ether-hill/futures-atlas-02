/**
 * The valley stage: grassland terrain carved by a winding river, distant
 * buttes, the campus plot with its security fence, gate and visitor parking,
 * plus the sky/sun/stars day-night rig. Everything cosmetic is seeded so a
 * given seed always looks the same.
 */

import * as THREE from "three";
import { CELL, GRID } from "./defs";
import { buildTreeField, makeCar, type TreeItem } from "./dressing";
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

// the river meanders down the east side of the valley
const riverX = (z: number) => 355 + 70 * Math.sin(z * 0.004) + 45 * Math.sin(z * 0.0013 + 2);
const riverW = (z: number) => 56 + 16 * Math.sin(z * 0.002 + 1);

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
  { h: 6.0, sky: "#3d3550", fog: "#7a5a5c", sun: "#ff9d5c", sunI: 0.55, hemiI: 0.3 },
  { h: 7.5, sky: "#8fb0cf", fog: "#cbbfa2", sun: "#ffd9a0", sunI: 1.1, hemiI: 0.5 },
  { h: 12.0, sky: "#a9c6de", fog: "#c9cdb0", sun: "#fff3dd", sunI: 1.45, hemiI: 0.62 },
  { h: 16.5, sky: "#9db8d3", fog: "#c5c2a0", sun: "#ffe3b0", sunI: 1.25, hemiI: 0.55 },
  { h: 18.5, sky: "#54425f", fog: "#a06a52", sun: "#ff7e45", sunI: 0.5, hemiI: 0.3 },
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

    this.fogExp = new THREE.FogExp2(0xc9cdb0, 0.00055);
    scene.fog = this.fogExp;

    // lights
    this.hemi = new THREE.HemisphereLight(0xcfe0f2, 0x5f7048, 0.6);
    scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xfff3dd, 1.4);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    const sc = this.sun.shadow.camera;
    sc.left = -330; sc.right = 330; sc.top = 330; sc.bottom = -330;
    sc.near = 50; sc.far = 1100;
    this.sun.shadow.bias = -0.0005;
    scene.add(this.sun);
    scene.add(this.sun.target);

    // --- terrain: flat plot + town, grassland valley, carved river ----------
    const tSeed = hashSeed(seedWord + "-terrain");
    const townFade = (x: number, z: number) => {
      const dx = Math.max(Math.abs(x) - 200, 0);
      const dz = Math.max(z - (PLOT / 2 + 195), (PLOT / 2 - 10) - z, 0);
      return THREE.MathUtils.smoothstep(Math.max(dx, dz), 4, 90);
    };
    const terrainH = (x: number, z: number): number => {
      const r = Math.max(Math.abs(x), Math.abs(z));
      const fade = Math.min(THREE.MathUtils.smoothstep(r, PLOT * 0.62, PLOT * 1.5), townFade(x, z));
      let h = vnoise(x / 95, z / 95, tSeed) * 7 * fade + vnoise(x / 24, z / 24, tSeed ^ 7) * 1.2 * fade;
      const rd = Math.abs(x - riverX(z));
      const rw = riverW(z);
      // wide flat floodplain so the water reads from a shallow camera angle,
      // then the carved channel itself
      h *= THREE.MathUtils.smoothstep(rd, rw * 0.6, rw + 140);
      h -= (1 - THREE.MathUtils.smoothstep(rd, rw * 0.35, rw + 55)) * 4.4;
      return h;
    };
    this.heightAt = terrainH;

    const size = 1700, seg = 170;
    const geo = new THREE.PlaneGeometry(size, size, seg, seg);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    const grass = new THREE.Color("#7d9955");
    const grassDry = new THREE.Color("#a3a06b");
    const grassDeep = new THREE.Color("#69894c");
    const marsh = new THREE.Color("#a5985e");
    const wetBank = new THREE.Color("#8a7d55");
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      pos.setY(i, terrainH(x, z));
      const n = vnoise(x / 16, z / 16, tSeed ^ 13) * 0.5 + 0.5;
      const patch = vnoise(x / 55, z / 55, tSeed ^ 29) * 0.5 + 0.5;
      c.copy(grass).lerp(patch > 0.55 ? grassDry : grassDeep, Math.abs(patch - 0.5) * 1.6);
      c.lerp(grassDry, n * 0.25);
      // marsh grasses + wet banks near the river, like a real floodplain
      const rd = Math.abs(x - riverX(z));
      const rw = riverW(z);
      const marshT = 1 - THREE.MathUtils.smoothstep(rd, rw * 0.9, rw + 95);
      if (marshT > 0) c.lerp(marsh, marshT * (0.45 + n * 0.4));
      const bankT = 1 - THREE.MathUtils.smoothstep(rd, rw * 0.5, rw * 0.95);
      if (bankT > 0) c.lerp(wetBank, bankT * 0.8);
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

    // --- the river itself: a ribbon following the meander --------------------
    {
      const steps: number[] = [];
      const verts: number[] = [];
      const idx: number[] = [];
      let n = 0;
      for (let z = -820; z <= 820; z += 22) steps.push(z);
      for (const z of steps) {
        const cx = riverX(z), hw = riverW(z) * 0.72;
        verts.push(cx - hw, -0.7, z, cx + hw, -0.7, z);
        if (n > 0) {
          const a = (n - 1) * 2;
          idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
        }
        n++;
      }
      const rGeo = new THREE.BufferGeometry();
      rGeo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
      rGeo.setIndex(idx);
      rGeo.computeVertexNormals();
      const water = new THREE.Mesh(
        rGeo,
        // DoubleSide: the strip's winding faces down; render both sides
        new THREE.MeshStandardMaterial({ color: "#4d7382", roughness: 0.2, metalness: 0.55, side: THREE.DoubleSide }),
      );
      water.receiveShadow = true;
      scene.add(water);
    }

    // distant buttes on the horizon, muted and half-lost in haze
    const butteMat = new THREE.MeshStandardMaterial({ color: "#77704f", roughness: 1, flatShading: true });
    for (let i = 0; i < 8; i++) {
      const ang = rng.range(0, Math.PI * 2);
      const dist = rng.range(660, 940);
      const w = rng.range(55, 150);
      const h = rng.range(24, 58);
      const butte = new THREE.Mesh(new THREE.CylinderGeometry(w * rng.range(0.5, 0.8), w, h, rng.int(5, 8)), butteMat);
      butte.position.set(Math.cos(ang) * dist, h / 2 - 8, Math.sin(ang) * dist);
      butte.rotation.y = rng.range(0, Math.PI);
      scene.add(butte);
    }

    // scattered rocks + bushes across the grassland (clear of town + river)
    const rockMat = new THREE.MeshStandardMaterial({ color: "#8d8676", roughness: 1, flatShading: true });
    const bushMat = new THREE.MeshStandardMaterial({ color: "#55703f", roughness: 1, flatShading: true });
    const rockGeo = new THREE.DodecahedronGeometry(1, 0);
    const bushGeo = new THREE.IcosahedronGeometry(1, 0);
    const dressing = new THREE.Group();
    const inTown = (x: number, z: number) => Math.abs(x) < 205 && z > PLOT / 2 - 12 && z < PLOT / 2 + 200;
    const inRiver = (x: number, z: number) => Math.abs(x - riverX(z)) < riverW(z) + 8;
    for (let i = 0; i < 220; i++) {
      const ang = rng.range(0, Math.PI * 2);
      const dist = rng.range(PLOT * 0.72, 680);
      const x = Math.cos(ang) * dist, z = Math.sin(ang) * dist;
      if (inTown(x, z) || inRiver(x, z)) continue;
      const isRock = rng.chance(0.35);
      const m = new THREE.Mesh(isRock ? rockGeo : bushGeo, isRock ? rockMat : bushMat);
      const s = isRock ? rng.range(0.5, 2.2) : rng.range(0.6, 1.4);
      m.scale.set(s * rng.range(0.7, 1.4), s * (isRock ? rng.range(0.5, 1) : rng.range(0.7, 1.1)), s);
      m.position.set(x, terrainH(x, z) + s * 0.3, z);
      m.rotation.set(rng.range(0, 3), rng.range(0, 3), rng.range(0, 3));
      m.castShadow = s > 1.2;
      dressing.add(m);
    }
    scene.add(dressing);

    // valley trees: thick riparian bands along the river + loose groves
    const trees: TreeItem[] = [];
    for (let i = 0; i < 190; i++) {
      const z = rng.range(-700, 700);
      const side = rng.chance(0.5) ? 1 : -1;
      const rd = riverW(z) + rng.range(10, 80);
      const x = riverX(z) + side * rd;
      if (inTown(x, z)) continue;
      trees.push({ x, y: terrainH(x, z), z, s: rng.range(0.9, 1.7), conifer: rng.chance(0.25) });
    }
    for (let i = 0; i < 110; i++) {
      const ang = rng.range(0, Math.PI * 2);
      const dist = rng.range(PLOT * 0.75, 700);
      const x = Math.cos(ang) * dist, z = Math.sin(ang) * dist;
      if (inTown(x, z) || inRiver(x, z)) continue;
      trees.push({ x, y: terrainH(x, z), z, s: rng.range(0.8, 1.5), conifer: rng.chance(0.4) });
    }
    scene.add(buildTreeField(trees));

    // access road from the campus gate through the town
    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 200),
      new THREE.MeshStandardMaterial({ color: "#43413d", roughness: 1 }),
    );
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.05, PLOT / 2 + 100);
    road.receiveShadow = true;
    scene.add(road);
    const dashMat = new THREE.MeshStandardMaterial({ color: "#cfcabb", roughness: 0.9 });
    for (let i = 0; i < 24; i++) {
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 3), dashMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(0, 0.065, PLOT / 2 + 6 + i * 8.2);
      scene.add(dash);
    }

    // plot apron: compacted campus ground inside the fence
    const apron = new THREE.Mesh(
      new THREE.PlaneGeometry(PLOT + 14, PLOT + 14),
      new THREE.MeshStandardMaterial({
        color: "#aaa596", roughness: 1,
        // wins the depth fight against the coplanar terrain at grazing angles
        polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
      }),
    );
    apron.rotation.x = -Math.PI / 2;
    apron.position.y = 0.04;
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

    // gate: guard hut + barrier arms + visitor parking with painted stalls
    {
      const hut = new THREE.Group();
      const hutBody = new THREE.Mesh(new THREE.BoxGeometry(3, 2.6, 2.4), new THREE.MeshStandardMaterial({ color: "#d9d6cc", roughness: 0.8 }));
      hutBody.position.y = 1.3;
      hutBody.castShadow = true;
      hut.add(hutBody);
      const hutRoof = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.2, 2.9), postMat);
      hutRoof.position.y = 2.7;
      hut.add(hutRoof);
      const glass = new THREE.Mesh(new THREE.BoxGeometry(3.04, 0.9, 2.44), new THREE.MeshStandardMaterial({ color: "#2e5d8f", roughness: 0.2, metalness: 0.8 }));
      glass.position.y = 1.8;
      hut.add(glass);
      hut.position.set(8.4, 0, fenceR);
      scene.add(hut);
      for (const bx of [-6.6, 6.4] as const) {
        const arm = new THREE.Mesh(new THREE.BoxGeometry(6, 0.14, 0.14), new THREE.MeshStandardMaterial({ color: "#c8483c", roughness: 0.6 }));
        arm.position.set(bx > 0 ? 3.4 : -3.4, 1.05, fenceR);
        scene.add(arm);
        const armPost = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.1, 6), postMat);
        armPost.position.set(bx, 0.55, fenceR);
        scene.add(armPost);
      }
      // visitor parking, west of the gate
      const lot = new THREE.Mesh(new THREE.PlaneGeometry(44, 17), new THREE.MeshStandardMaterial({ color: "#3d3d3b", roughness: 1 }));
      lot.rotation.x = -Math.PI / 2;
      lot.position.set(-33, 0.06, fenceR + 11);
      lot.receiveShadow = true;
      scene.add(lot);
      const stallMat = new THREE.MeshStandardMaterial({ color: "#d8d4c6", roughness: 0.9 });
      for (let i = 0; i < 9; i++) {
        const line = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 5.6), stallMat);
        line.rotation.x = -Math.PI / 2;
        line.position.set(-52 + i * 4.6, 0.075, fenceR + 6.5);
        scene.add(line);
        if (i < 8 && rng.chance(0.6)) {
          const car = makeCar(rng);
          car.scale.setScalar(0.9);
          car.rotation.y = Math.PI / 2 + rng.range(-0.04, 0.04);
          car.position.set(-49.7 + i * 4.6, 0.06, fenceR + 6.5);
          scene.add(car);
        }
      }
      for (const lx of [-50, -33, -16]) {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 6, 6), postMat);
        pole.position.set(lx, 3, fenceR + 18.5);
        scene.add(pole);
      }
    }

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

  /** terrain height sampler (0 across the plot + town) */
  heightAt: (x: number, z: number) => number = () => 0;

  /** Drive lighting/sky from sim time. `dust`/`smog` 0..1. */
  update(hour: number, dust: number, smog = 0): Env {
    const env = envAt(hour, dust, smog);
    this.scene.background = env.sky;
    this.fogExp.color.copy(env.fog);
    this.fogExp.density = 0.00055 + dust * 0.0045 + smog * 0.0014;
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
