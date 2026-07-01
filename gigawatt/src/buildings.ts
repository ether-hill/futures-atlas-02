/**
 * Procedural building meshes + their per-frame animation hooks. Each factory
 * returns a Group centred on its footprint plus an `update(t, dt, view)`
 * closure the render loop drives with live sim state.
 *
 * Design language follows real hyperscale campuses: light prefab-panel halls
 * with skylight roofs and blue-glass office ends, steel utility kit, white
 * turbine towers — with LED state bands so the sim stays legible at a glance.
 */

import * as THREE from "three";
import { CELL, type DefId } from "./defs";
import { RNG, hashSeed } from "./rng";
import { makeCar } from "./town";

export interface UnitView {
  throttle: number; // 0..1 effective output
  load: number; // 0..1 duty (coolers: capacity; gas: dispatch; wind: wind factor)
  failed: boolean;
  charge: number; // batteries 0..1
  sun: number; // solar elevation 0..1
  night: number; // 0 day .. 1 night (drives window brightness)
}

export interface BuildingView {
  group: THREE.Group;
  update(t: number, dt: number, v: UnitView): void;
}

// one cosmetic stream shared by all factories (phases, car colours, jitter)
const cosmetics = new RNG(hashSeed("gigawatt-cosmetics"));

// --- shared materials (cloned only where per-unit state mutates them) -------
const M = {
  slab: new THREE.MeshStandardMaterial({ color: "#8f8a7c", roughness: 1 }),
  gravel: new THREE.MeshStandardMaterial({ color: "#a29a88", roughness: 1 }),
  panel: new THREE.MeshStandardMaterial({ color: "#d9d6cc", roughness: 0.8 }),
  panelRib: new THREE.MeshStandardMaterial({ color: "#b9b6ac", roughness: 0.75 }),
  panelDark: new THREE.MeshStandardMaterial({ color: "#3a4148", roughness: 0.55, metalness: 0.3 }),
  louver: new THREE.MeshStandardMaterial({ color: "#2b3036", roughness: 0.5, metalness: 0.4 }),
  steel: new THREE.MeshStandardMaterial({ color: "#79818a", roughness: 0.45, metalness: 0.7 }),
  steelLight: new THREE.MeshStandardMaterial({ color: "#aab1b8", roughness: 0.4, metalness: 0.6 }),
  white: new THREE.MeshStandardMaterial({ color: "#e6e3da", roughness: 0.65 }),
  glass: new THREE.MeshStandardMaterial({ color: "#2e5d8f", roughness: 0.15, metalness: 0.85 }),
  mullion: new THREE.MeshStandardMaterial({ color: "#e8e6df", roughness: 0.5 }),
  pv: new THREE.MeshStandardMaterial({ color: "#16233a", roughness: 0.25, metalness: 0.75 }),
  pipe: new THREE.MeshStandardMaterial({ color: "#a9b0b8", roughness: 0.4, metalness: 0.8 }),
  dark: new THREE.MeshStandardMaterial({ color: "#23262b", roughness: 0.6, metalness: 0.3 }),
  turbine: new THREE.MeshStandardMaterial({ color: "#eceae4", roughness: 0.5 }),
};

const GLOW = {
  cyan: new THREE.Color("#6fdcff"),
  amber: new THREE.Color("#ffb14d"),
  red: new THREE.Color("#ff4a3d"),
  green: new THREE.Color("#57e88f"),
};

function box(w: number, h: number, d: number, mat: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function cyl(rt: number, rb: number, h: number, mat: THREE.Material, x = 0, y = 0, z = 0, seg = 14): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function emissive(color: THREE.Color, intensity = 1): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: "#0c0e10",
    emissive: color,
    emissiveIntensity: intensity,
    roughness: 0.6,
  });
}

/** Small status beacon every operational building carries. */
function beacon(x: number, y: number, z: number): { mesh: THREE.Mesh; mat: THREE.MeshStandardMaterial } {
  const mat = emissive(GLOW.green, 1.6);
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 10), mat);
  mesh.position.set(x, y, z);
  return { mesh, mat };
}

function driveBeacon(mat: THREE.MeshStandardMaterial, t: number, v: UnitView): void {
  if (v.failed) {
    mat.emissive.copy(GLOW.red);
    mat.emissiveIntensity = 1.2 + Math.sin(t * 9) * 1.1; // urgent blink
  } else if (v.throttle < 0.85 && v.throttle > 0) {
    mat.emissive.copy(GLOW.amber);
    mat.emissiveIntensity = 1.6;
  } else {
    mat.emissive.copy(GLOW.green);
    mat.emissiveIntensity = 1.4;
  }
}

/** Soft round sprite texture for steam/smoke puffs (built once). */
let puffTex: THREE.Texture | null = null;
function getPuffTex(): THREE.Texture {
  if (puffTex) return puffTex;
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(32, 32, 2, 32, 32, 30);
  grad.addColorStop(0, "rgba(255,255,255,0.85)");
  grad.addColorStop(0.5, "rgba(255,255,255,0.28)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  puffTex = new THREE.CanvasTexture(c);
  return puffTex;
}

/** A rising, swaying column of fading puffs (chiller steam / peaker smoke). */
class Plume {
  readonly points: THREE.Points;
  private mat: THREE.PointsMaterial;
  private phase: Float32Array;
  private n: number;
  private strength = 0;
  private rise: number;
  private maxOpacity: number;

  constructor(opts: { n?: number; color?: number; size?: number; rise?: number; opacity?: number } = {}) {
    this.n = opts.n ?? 12;
    this.rise = opts.rise ?? 10;
    this.maxOpacity = opts.opacity ?? 0.34;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(this.n * 3), 3));
    this.phase = new Float32Array(this.n);
    for (let i = 0; i < this.n; i++) this.phase[i] = i / this.n;
    this.mat = new THREE.PointsMaterial({
      map: getPuffTex(), size: opts.size ?? 4.5, transparent: true, opacity: 0,
      depthWrite: false, color: opts.color ?? 0xe8ecef,
    });
    this.points = new THREE.Points(geo, this.mat);
  }

  update(dt: number, on: number): void {
    this.strength += (on - this.strength) * Math.min(1, dt * 2);
    this.mat.opacity = this.maxOpacity * this.strength;
    const pos = this.points.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < this.n; i++) {
      this.phase[i] = (this.phase[i] + dt * 0.35) % 1;
      const p = this.phase[i];
      const sway = Math.sin(p * 9 + i * 1.7) * (0.4 + p * 2.2);
      pos.setXYZ(i, sway + p * 2.5, p * this.rise, Math.cos(p * 7 + i) * (0.3 + p * 1.4));
    }
    pos.needsUpdate = true;
  }
}

// --- factories ---------------------------------------------------------------

function substation(): BuildingView {
  const g = new THREE.Group();
  const W = 2 * CELL, D = 2 * CELL;
  g.add(box(W - 1.5, 0.4, D - 1.5, M.gravel, 0, 0.2, 0));
  // two transformer units with fins + bushings
  for (const sx of [-3.6, 3.6]) {
    const t = new THREE.Group();
    t.add(box(4.4, 3.6, 3.2, M.dark, 0, 2.3, 0));
    for (let i = -2; i <= 2; i++) t.add(box(0.22, 2.8, 3.6, M.steel, i * 0.9, 2.2, 0));
    for (const bx of [-1.2, 0, 1.2]) t.add(cyl(0.14, 0.2, 1.3, M.white, bx, 4.7, 0.5, 8));
    t.add(cyl(0.3, 0.3, 1.6, M.pipe, -1.2, 4.9, -0.8));
    t.add(box(0.9, 0.7, 0.9, M.steelLight, 1.6, 4.5, -0.8));
    t.position.x = sx;
    g.add(t);
  }
  // breaker row
  for (const bx of [-5, -2.5, 0, 2.5, 5]) {
    g.add(box(0.5, 2.2, 0.5, M.steelLight, bx, 1.5, D / 2 - 2.6));
    g.add(cyl(0.1, 0.14, 0.9, M.white, bx, 3, D / 2 - 2.6, 6));
  }
  // lattice mast + drop lines to the transformers
  const mast = new THREE.Group();
  for (const [lx, lz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
    mast.add(cyl(0.09, 0.14, 11, M.steel, lx * 1.1, 5.5, lz * 1.1, 6));
  }
  mast.add(box(3.4, 0.18, 0.18, M.steel, 0, 8.6, 0));
  mast.add(box(0.18, 0.18, 3.4, M.steel, 0, 10.4, 0));
  mast.position.set(0, 0, -D / 4 + 1);
  g.add(mast);
  for (const sx of [-3.6, 3.6]) {
    const wire = cyl(0.03, 0.03, 6.4, M.pipe, sx / 2, 7.4, -1.4, 4);
    wire.rotation.z = sx > 0 ? -0.55 : 0.55;
    wire.rotation.x = 0.35;
    g.add(wire);
  }
  const warn = emissive(GLOW.amber, 2);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), warn);
  lamp.position.set(0, 11.2, -D / 4 + 1);
  g.add(lamp);
  const b = beacon(W / 2 - 1.2, 1.1, D / 2 - 1.2);
  g.add(b.mesh);
  return {
    group: g,
    update(t, _dt, v) {
      warn.emissiveIntensity = 1.2 + Math.sin(t * 2.4) * 1.0;
      driveBeacon(b.mat, t, v);
    },
  };
}

function solar(): BuildingView {
  const g = new THREE.Group();
  const W = 3 * CELL, D = 3 * CELL;
  g.add(box(W - 2, 0.2, D - 2, M.gravel, 0, 0.1, 0));
  const rows: THREE.Group[] = [];
  const nRows = 5, nCols = 4;
  for (let r = 0; r < nRows; r++) {
    for (let cI = 0; cI < nCols; cI++) {
      const row = new THREE.Group();
      const panel = box(4.6, 0.14, 2.6, M.pv, 0, 0.1, 0);
      row.add(panel);
      row.add(box(4.6, 0.1, 0.1, M.steelLight, 0, -0.05, 0)); // torque tube
      row.add(cyl(0.12, 0.12, 1.5, M.steel, 0, -0.8, 0, 8));
      row.position.set(-W / 2 + 3.4 + cI * 5.6, 1.7, -D / 2 + 3 + r * 4.4);
      row.rotation.x = -0.45;
      g.add(row);
      rows.push(row);
    }
  }
  g.add(box(1.6, 1.4, 1.1, M.steelLight, W / 2 - 2.2, 0.9, D / 2 - 2)); // inverter skid
  const b = beacon(W / 2 - 1, 0.9, D / 2 - 1);
  g.add(b.mesh);
  return {
    group: g,
    update(t, _dt, v) {
      // panels lean east→west following the sun; rest flat at night
      const lean = v.sun > 0 ? (0.5 - v.sun) * 0.5 : 0;
      for (const r of rows) r.rotation.z = lean;
      driveBeacon(b.mat, t, v);
    },
  };
}

function wind(): BuildingView {
  const g = new THREE.Group();
  g.add(cyl(2.2, 2.6, 0.5, M.slab, 0, 0.25, 0, 16));
  const H = 40;
  g.add(cyl(0.62, 1.25, H, M.turbine, 0, H / 2 + 0.4, 0, 12));
  // nacelle + hub, yawed a touch off-axis
  const head = new THREE.Group();
  head.position.y = H + 0.4;
  head.rotation.y = -0.5;
  const nac = box(4, 1.9, 1.9, M.turbine, -0.7, 0, 0);
  head.add(nac);
  head.add(box(1.2, 0.8, 0.8, M.steel, -2.6, 0.2, 0));
  const hub = new THREE.Group();
  hub.position.set(1.6, 0, 0);
  head.add(hub);
  head.add(cyl(0.45, 0.55, 0.9, M.turbine, 1.35, 0, 0, 10).rotateZ(Math.PI / 2));
  for (let i = 0; i < 3; i++) {
    const blade = new THREE.Group();
    const seg1 = box(0.16, 8.5, 0.85, M.turbine, 0, 4.25, 0);
    const seg2 = box(0.12, 7.5, 0.5, M.turbine, 0, 11.6, 0);
    seg2.rotation.x = 0.06;
    blade.add(seg1, seg2);
    blade.rotation.x = (i / 3) * Math.PI * 2;
    hub.add(blade);
  }
  g.add(head);
  const beaconMat = emissive(GLOW.red, 0);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), beaconMat);
  tip.position.set(-0.7, 1.2, 0);
  head.add(tip);
  const b = beacon(2.2, 1, 2.2);
  g.add(b.mesh);
  const phase = cosmetics.range(0, Math.PI * 2);
  let spin = phase;
  return {
    group: g,
    update(t, dt, v) {
      spin += dt * (0.3 + v.load * 2.4) * (v.failed ? 0 : 1);
      hub.rotation.x = spin;
      beaconMat.emissiveIntensity = v.night > 0.4 ? 1.6 + Math.sin(t * 2 + phase) * 1.5 : 0;
      driveBeacon(b.mat, t, v);
    },
  };
}

function battery(): BuildingView {
  const g = new THREE.Group();
  const W = 1 * CELL, D = 2 * CELL;
  g.add(box(W - 1, 0.3, D - 1, M.slab, 0, 0.15, 0));
  // two container pairs with HVAC ends
  for (const dz of [-3.6, 3.6]) {
    g.add(box(W - 2.6, 2.9, 5.6, M.white, 0, 1.75, dz));
    g.add(box(W - 3, 0.5, 5.2, M.panelDark, 0, 3.4, dz));
    g.add(box(0.4, 2.1, 4.6, M.louver, -(W / 2 - 1.35), 1.6, dz));
  }
  // charge strip: emissive bar that fills with state-of-charge
  const stripMat = emissive(GLOW.green, 1.5);
  const strip = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.5, D - 4), stripMat);
  strip.position.set(W / 2 - 1.15, 2.2, 0);
  g.add(strip);
  g.add(box(1.4, 1.5, 1.2, M.dark, 0, 1, D / 2 - 1.6)); // step-up transformer
  const b = beacon(W / 2 - 0.9, 0.9, D / 2 - 0.9);
  g.add(b.mesh);
  const fullD = D - 4;
  return {
    group: g,
    update(t, _dt, v) {
      const c = Math.max(0.04, v.charge);
      strip.scale.z = c;
      strip.position.z = -(fullD * (1 - c)) / 2;
      stripMat.emissive.copy(v.charge > 0.25 ? GLOW.green : GLOW.amber);
      driveBeacon(b.mat, t, v);
    },
  };
}

function gas(): BuildingView {
  const g = new THREE.Group();
  const W = 2 * CELL, D = 2 * CELL;
  g.add(box(W - 1.2, 0.4, D - 1.2, M.slab, 0, 0.2, 0));
  // turbine hall
  g.add(box(9, 5.2, 7, M.panel, -1.5, 3, 1.8));
  for (let i = 0; i < 5; i++) g.add(box(0.18, 5, 7.06, M.panelRib, -4.9 + i * 1.7, 2.9, 1.8));
  g.add(box(9.2, 0.5, 7.2, M.steel, -1.5, 5.75, 1.8));
  // air-intake filter house
  g.add(box(4.2, 3.4, 3, M.steelLight, 3.6, 2.1, 3.4));
  g.add(box(4, 2.6, 0.3, M.louver, 3.6, 2.1, 4.95));
  // three exhaust stacks with dark caps + smoke
  const plumes: Plume[] = [];
  for (let i = 0; i < 3; i++) {
    const sx = -4 + i * 3.4, sz = -D / 2 + 2.6;
    g.add(cyl(0.8, 1, 12.5, M.steelLight, sx, 6.3, sz, 12));
    g.add(cyl(0.85, 0.85, 1.4, M.dark, sx, 12.6, sz, 12));
    const p = new Plume({ color: 0x8a857d, size: 6.5, rise: 15, opacity: 0.3, n: 14 });
    p.points.position.set(sx, 13.2, sz);
    g.add(p.points);
    plumes.push(p);
  }
  g.add(box(2.4, 2.2, 2, M.dark, W / 2 - 2.2, 1.4, -1)); // step-up transformer
  g.add(cyl(0.24, 0.24, 5, M.pipe, 0.5, 1.1, -1.5, 8).rotateZ(Math.PI / 2));
  const b = beacon(W / 2 - 1, 1, D / 2 - 1);
  g.add(b.mesh);
  return {
    group: g,
    update(t, dt, v) {
      for (const p of plumes) p.update(dt, v.failed ? 0 : v.load);
      driveBeacon(b.mat, t, v);
    },
  };
}

/** Shared body for hall/pod: prefab-panel monolith, skylight roof, LED band. */
function hallLike(wCells: number, dCells: number, h: number, dense: boolean): BuildingView {
  const g = new THREE.Group();
  const W = wCells * CELL - 2, D = dCells * CELL - 2;
  g.add(box(W + 1.6, 0.4, D + 1.6, M.slab, 0, 0.2, 0));
  const bodyMat = dense ? M.panelDark : M.panel;
  g.add(box(W, h, D, bodyMat, 0, h / 2 + 0.4, 0));
  // vertical panel ribs along both long faces
  const nRib = Math.floor(W / 2.1);
  for (let i = 0; i <= nRib; i++) {
    const rx = -W / 2 + (i * W) / nRib;
    g.add(box(0.16, h - 0.6, D + 0.12, dense ? M.dark : M.panelRib, rx, h / 2 + 0.3, 0));
  }
  // parapet + skylight/PV grid on the roof
  g.add(box(W + 0.4, 0.5, D + 0.4, dense ? M.dark : M.panelRib, 0, h + 0.55, 0));
  const skyMat = new THREE.MeshStandardMaterial({
    color: "#8fa5b8", roughness: 0.28, metalness: 0.85,
    emissive: GLOW.cyan, emissiveIntensity: 0.05,
  });
  const cols = Math.floor(W / 3.2), rowsN = Math.floor(D / 3.2);
  for (let cI = 0; cI < cols; cI++) {
    for (let r = 0; r < rowsN; r++) {
      const p = box(2.3, 0.14, 2.3, skyMat, -W / 2 + 2 + cI * 3.2, h + 0.86, -D / 2 + 2 + r * 3.2);
      p.castShadow = false;
      g.add(p);
    }
  }
  // rooftop units + duct run
  const rtus = dense ? 2 : 3;
  for (let i = 0; i < rtus; i++) {
    const rx = -W / 2 + 2.6 + (i * (W - 5.2)) / Math.max(rtus - 1, 1);
    g.add(box(2.4, 1.5, 2.4, M.steelLight, rx, h + 1.6, D / 2 - 2.4));
    g.add(cyl(0.3, 0.3, 1.8, M.steel, rx, h + 1.4, D / 2 - 4, 8).rotateX(Math.PI / 2));
  }
  // louvered intake wall inserts
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      g.add(box(W / 4.2, h * 0.42, 0.14, M.louver, -W / 4 + (i * W) / 4.2, h * 0.36, side * (D / 2 + 0.04)));
    }
  }
  // blue-glass office end with mullions + canopy
  const officeH = Math.min(h * 0.62, 5.4);
  g.add(box(3.6, officeH, D - 1.4, M.glass, W / 2 + 1.7, officeH / 2 + 0.4, 0));
  for (let i = 0; i < 4; i++) {
    g.add(box(3.64, 0.14, D - 1.36, M.mullion, W / 2 + 1.7, 0.6 + (i * officeH) / 3.6, 0));
  }
  g.add(box(3.8, 0.3, D - 1.2, M.white, W / 2 + 1.7, officeH + 0.6, 0));
  g.add(box(2.6, 0.14, 2.4, M.white, W / 2 + 3.6, 2.5, D / 2 - 3.4)); // entrance canopy
  // parked staff cars on the apron
  for (let i = 0; i < (dense ? 1 : 2); i++) {
    const car = makeCar(cosmetics);
    car.scale.setScalar(0.85);
    car.position.set(W / 2 - 1 - i * 4.6, 0.4, D / 2 + 0.1);
    car.rotation.y = Math.PI / 2;
    g.add(car);
  }
  // the glowing compute band along both long faces
  const bandMat = emissive(GLOW.cyan, dense ? 3.0 : 2.2);
  for (const side of [-1, 1]) {
    const band = new THREE.Mesh(new THREE.BoxGeometry(W - 1.6, dense ? 1.5 : 1.0, 0.12), bandMat);
    band.position.set(0, dense ? h * 0.68 : h * 0.6, side * (D / 2 + 0.06));
    g.add(band);
  }
  if (dense) {
    const vent = new THREE.Mesh(new THREE.BoxGeometry(W - 3, 0.1, D - 3), bandMat);
    vent.position.y = h + 0.78;
    g.add(vent);
  }
  const b = beacon(-W / 2 + 0.8, h + 1.2, D / 2 - 0.8);
  g.add(b.mesh);
  const baseI = dense ? 3.0 : 2.2;
  const phase = cosmetics.range(0, 10); // desync window flicker between units
  return {
    group: g,
    update(t, _dt, v) {
      const nightLift = 0.75 + v.night * 0.7;
      if (v.failed) {
        bandMat.emissive.copy(GLOW.red);
        bandMat.emissiveIntensity = 0.15 + Math.max(0, Math.sin(t * 3)) * 0.25; // dying embers
        skyMat.emissiveIntensity = 0.02;
      } else {
        const hot = v.throttle < 0.85;
        bandMat.emissive.copy(hot ? GLOW.amber : GLOW.cyan);
        const flicker = 0.94 + 0.06 * Math.sin(t * 13 + phase) * Math.sin(t * 5.1 + phase * 2);
        bandMat.emissiveIntensity = baseI * nightLift * Math.max(v.throttle, 0.12) * flicker;
        skyMat.emissiveIntensity = 0.05 + v.night * 0.5 * Math.max(v.throttle, 0.15);
      }
      driveBeacon(b.mat, t, v);
    },
  };
}

function drycool(): BuildingView {
  const g = new THREE.Group();
  const W = 1 * CELL, D = 2 * CELL;
  g.add(box(W - 1.6, 0.3, D - 1.6, M.slab, 0, 0.15, 0));
  g.add(box(W - 2.6, 2.6, D - 2.6, M.steel, 0, 1.6, 0));
  // finned coil faces
  for (const side of [-1, 1]) {
    for (let i = 0; i < 6; i++) {
      g.add(box(0.06, 2, D - 3.2, M.steelLight, side * (W / 2 - 1.32) + i * 0.001, 1.6, 0));
    }
    g.add(box(0.1, 2.2, D - 3, M.louver, side * (W / 2 - 1.28), 1.6, 0));
  }
  const rotors: THREE.Group[] = [];
  for (let i = 0; i < 3; i++) {
    const z = -D / 2 + 3.2 + i * 4.2;
    g.add(cyl(1.55, 1.7, 1.1, M.dark, 0, 3.4, z));
    const guard = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.05, 6, 20), M.steelLight);
    guard.rotation.x = Math.PI / 2;
    guard.position.set(0, 4.05, z);
    g.add(guard);
    const rotor = new THREE.Group();
    for (let bI = 0; bI < 3; bI++) {
      const blade = box(0.5, 0.08, 1.25, M.white, 0, 0, 0.8);
      const arm = new THREE.Group();
      arm.add(blade);
      arm.rotation.y = (bI / 3) * Math.PI * 2;
      rotor.add(arm);
    }
    rotor.position.set(0, 4, z);
    g.add(rotor);
    rotors.push(rotor);
  }
  const b = beacon(W / 2 - 0.8, 0.9, D / 2 - 0.8);
  g.add(b.mesh);
  let spin = 0;
  return {
    group: g,
    update(t, dt, v) {
      spin += dt * (0.6 + v.load * 11) * (v.failed ? 0 : 1);
      for (let i = 0; i < rotors.length; i++) rotors[i].rotation.y = spin * (1 + i * 0.07);
      driveBeacon(b.mat, t, v);
    },
  };
}

function chiller(): BuildingView {
  const g = new THREE.Group();
  const W = 2 * CELL, D = 2 * CELL;
  g.add(box(W - 1.5, 0.4, D - 1.5, M.slab, 0, 0.2, 0));
  g.add(box(W - 4, 4.2, D - 6, M.panel, 0, 2.5, 1.6));
  for (let i = 0; i < 5; i++) g.add(box(0.16, 4, D - 5.94, M.panelRib, -W / 2 + 2.8 + i * 2.4, 2.4, 1.6));
  // twin evaporation stacks + basin
  const steams: Plume[] = [];
  for (const sx of [-3.2, 3.2]) {
    g.add(cyl(1.5, 1.9, 5.4, M.white, sx, 2.7, -D / 2 + 3.2, 18));
    g.add(cyl(1.2, 1.35, 0.9, M.dark, sx, 5.6, -D / 2 + 3.2, 18));
    const s = new Plume();
    s.points.position.set(sx, 6, -D / 2 + 3.2);
    g.add(s.points);
    steams.push(s);
  }
  g.add(box(5.5, 0.8, 2.4, M.steelLight, 0, 0.8, -D / 2 + 5.4)); // condenser basin
  // manifold between building and stacks
  g.add(cyl(0.28, 0.28, 6.4, M.pipe, 0, 1.3, -1).rotateX(Math.PI / 2));
  g.add(cyl(0.2, 0.2, 6.2, M.pipe, 1.1, 1.9, -1).rotateX(Math.PI / 2));
  const b = beacon(W / 2 - 1, 1, D / 2 - 1);
  g.add(b.mesh);
  return {
    group: g,
    update(t, dt, v) {
      for (const s of steams) s.update(dt, v.failed ? 0 : v.load);
      driveBeacon(b.mat, t, v);
    },
  };
}

export function buildMesh(def: DefId): BuildingView {
  switch (def) {
    case "substation": return substation();
    case "solar": return solar();
    case "wind": return wind();
    case "battery": return battery();
    case "gas": return gas();
    case "hall": return hallLike(2, 3, 7.5, false);
    case "pod": return hallLike(2, 2, 6.5, true);
    case "drycool": return drycool();
    case "chiller": return chiller();
  }
}

/** Translucent single-colour clone used as the placement ghost. */
export function makeGhost(def: DefId): THREE.Group {
  const src = buildMesh(def).group;
  const ok = new THREE.MeshBasicMaterial({ color: 0x6fdcff, transparent: true, opacity: 0.4, depthWrite: false });
  src.traverse((o) => {
    if (o instanceof THREE.Mesh || o instanceof THREE.Points) {
      (o as THREE.Mesh).material = ok;
      o.castShadow = false;
      o.receiveShadow = false;
    }
  });
  return src;
}

export function tintGhost(ghost: THREE.Group, valid: boolean): void {
  ghost.traverse((o) => {
    if (o instanceof THREE.Mesh || o instanceof THREE.Points) {
      const m = (o as THREE.Mesh).material as THREE.MeshBasicMaterial;
      m.color.set(valid ? 0x6fdcff : 0xff4a3d);
    }
  });
}
