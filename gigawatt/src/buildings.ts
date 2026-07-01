/**
 * Procedural building meshes + their per-frame animation hooks. Each factory
 * returns a Group centred on its footprint plus an `update(t, dt, view)`
 * closure the render loop drives with live sim state.
 */

import * as THREE from "three";
import { CELL, type DefId } from "./defs";

export interface UnitView {
  throttle: number; // 0..1 effective output
  load: number; // 0..1 duty (coolers/solar/battery meaning varies)
  failed: boolean;
  charge: number; // batteries 0..1
  sun: number; // solar elevation 0..1
  night: number; // 0 day .. 1 night (drives window brightness)
}

export interface BuildingView {
  group: THREE.Group;
  update(t: number, dt: number, v: UnitView): void;
}

// --- shared materials (cloned only where per-unit state mutates them) -------
const M = {
  concrete: new THREE.MeshStandardMaterial({ color: "#b6a893", roughness: 0.95 }),
  slab: new THREE.MeshStandardMaterial({ color: "#8f8474", roughness: 1 }),
  dark: new THREE.MeshStandardMaterial({ color: "#23262b", roughness: 0.6, metalness: 0.3 }),
  darker: new THREE.MeshStandardMaterial({ color: "#191b1f", roughness: 0.55, metalness: 0.35 }),
  steel: new THREE.MeshStandardMaterial({ color: "#79818a", roughness: 0.45, metalness: 0.7 }),
  white: new THREE.MeshStandardMaterial({ color: "#e3e0d7", roughness: 0.7 }),
  panel: new THREE.MeshStandardMaterial({ color: "#16233a", roughness: 0.25, metalness: 0.75 }),
  pipe: new THREE.MeshStandardMaterial({ color: "#a9b0b8", roughness: 0.4, metalness: 0.8 }),
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

/** Soft round sprite texture for steam/heat puffs (built once). */
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

/** A rising column of fading puffs (chiller steam). */
class Steam {
  readonly points: THREE.Points;
  private mat: THREE.PointsMaterial;
  private phase: Float32Array;
  private n: number;
  private strength = 0;

  constructor(n = 12) {
    this.n = n;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    this.phase = new Float32Array(n);
    for (let i = 0; i < n; i++) this.phase[i] = i / n;
    this.mat = new THREE.PointsMaterial({
      map: getPuffTex(), size: 4.5, transparent: true, opacity: 0.0,
      depthWrite: false, color: 0xe8ecef,
    });
    this.points = new THREE.Points(geo, this.mat);
  }

  update(dt: number, on: number): void {
    this.strength += (on - this.strength) * Math.min(1, dt * 2);
    this.mat.opacity = 0.34 * this.strength;
    const pos = this.points.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < this.n; i++) {
      this.phase[i] = (this.phase[i] + dt * 0.35) % 1;
      const p = this.phase[i];
      const sway = Math.sin(p * 9 + i * 1.7) * (0.4 + p * 1.6);
      pos.setXYZ(i, sway, p * 10, Math.cos(p * 7 + i) * (0.3 + p * 1.2));
    }
    pos.needsUpdate = true;
  }
}

// --- factories ---------------------------------------------------------------

function substation(): BuildingView {
  const g = new THREE.Group();
  const W = 2 * CELL, D = 2 * CELL;
  g.add(box(W - 1.5, 0.5, D - 1.5, M.slab, 0, 0.25, 0));
  // two transformer units with cooling fins
  for (const sx of [-3.6, 3.6]) {
    const t = new THREE.Group();
    t.add(box(4.4, 3.6, 3.2, M.dark, 0, 2.3, 0));
    for (let i = -2; i <= 2; i++) t.add(box(0.22, 2.8, 3.6, M.steel, i * 0.9, 2.2, 0));
    t.add(cyl(0.3, 0.3, 1.6, M.pipe, -1.2, 4.9, 0.6));
    t.add(cyl(0.3, 0.3, 1.6, M.pipe, 1.2, 4.9, -0.6));
    t.add(cyl(0.16, 0.24, 1.1, M.white, 0, 4.7, 0));
    t.position.x = sx;
    g.add(t);
  }
  // lattice mast
  const mast = new THREE.Group();
  for (const [lx, lz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
    mast.add(cyl(0.09, 0.14, 11, M.steel, lx * 1.1, 5.5, lz * 1.1, 6));
  }
  mast.add(box(3.4, 0.18, 0.18, M.steel, 0, 8.6, 0));
  mast.add(box(0.18, 0.18, 3.4, M.steel, 0, 10.4, 0));
  mast.position.set(0, 0, -D / 4 + 1);
  g.add(mast);
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
  g.add(box(W - 2, 0.24, D - 2, M.slab, 0, 0.12, 0));
  const rows: THREE.Group[] = [];
  const nRows = 5, nCols = 4;
  for (let r = 0; r < nRows; r++) {
    for (let cI = 0; cI < nCols; cI++) {
      const row = new THREE.Group();
      const panel = box(4.6, 0.16, 2.6, M.panel, 0, 0, 0);
      panel.position.y = 0.1;
      row.add(panel);
      row.add(cyl(0.12, 0.12, 1.5, M.steel, 0, -0.8, 0, 8));
      row.position.set(-W / 2 + 3.4 + cI * 5.6, 1.7, -D / 2 + 3 + r * 4.4);
      row.rotation.x = -0.45;
      g.add(row);
      rows.push(row);
    }
  }
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

function battery(): BuildingView {
  const g = new THREE.Group();
  const W = 1 * CELL, D = 2 * CELL;
  g.add(box(W - 1, 0.3, D - 1, M.slab, 0, 0.15, 0));
  g.add(box(W - 2.4, 3, D - 3, M.white, 0, 1.8, 0));
  g.add(box(W - 2.2, 0.5, D - 5.4, M.dark, 0, 3.5, 0));
  // charge strip: emissive bar that fills with state-of-charge
  const stripMat = emissive(GLOW.green, 1.5);
  const strip = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.5, D - 4), stripMat);
  strip.position.set(W / 2 - 1.15, 2.2, 0);
  g.add(strip);
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

/** Shared body for hall/pod: dark monolith with a live window band. */
function hallLike(wCells: number, dCells: number, h: number, dense: boolean): BuildingView {
  const g = new THREE.Group();
  const W = wCells * CELL - 2, D = dCells * CELL - 2;
  g.add(box(W + 1, 0.4, D + 1, M.slab, 0, 0.2, 0));
  g.add(box(W, h, D, dense ? M.darker : M.dark, 0, h / 2 + 0.4, 0));
  // roof ribs
  for (let i = 0; i < Math.floor(D / 2.4); i++) {
    g.add(box(W - 1, 0.3, 0.7, M.steel, 0, h + 0.55, -D / 2 + 1.4 + i * 2.4));
  }
  // rooftop units
  const rtus = dense ? 2 : 3;
  for (let i = 0; i < rtus; i++) {
    g.add(box(2.4, 1.4, 2.4, M.steel, -W / 2 + 2.6 + i * (W - 4) / Math.max(rtus - 1, 1), h + 1.3, 0));
  }
  // the glowing compute band along both long faces
  const bandMat = emissive(GLOW.cyan, dense ? 3.0 : 2.2);
  for (const side of [-1, 1]) {
    const band = new THREE.Mesh(new THREE.BoxGeometry(W - 1.6, dense ? 1.8 : 1.2, 0.12), bandMat);
    band.position.set(0, dense ? h * 0.62 : h * 0.55, side * (D / 2 + 0.02));
    g.add(band);
  }
  if (dense) {
    // top vent glow
    const vent = new THREE.Mesh(new THREE.BoxGeometry(W - 3, 0.1, D - 3), bandMat);
    vent.position.y = h + 0.46;
    g.add(vent);
  }
  // door + bollards on the south face
  g.add(box(2.2, 3, 0.2, M.steel, -W / 2 + 2.6, 1.9, D / 2 + 0.05));
  const b = beacon(W / 2 - 0.8, h + 1.2, D / 2 - 0.8);
  g.add(b.mesh);
  const baseI = dense ? 3.0 : 2.2;
  let phase = Math.random() * 10; // visual only — desync window flicker between units
  return {
    group: g,
    update(t, _dt, v) {
      const nightLift = 0.75 + v.night * 0.7;
      if (v.failed) {
        bandMat.emissive.copy(GLOW.red);
        bandMat.emissiveIntensity = 0.15 + Math.max(0, Math.sin(t * 3)) * 0.25; // dying embers
      } else {
        const hot = v.throttle < 0.85;
        bandMat.emissive.copy(hot ? GLOW.amber : GLOW.cyan);
        const flicker = 0.94 + 0.06 * Math.sin(t * 13 + phase) * Math.sin(t * 5.1 + phase * 2);
        bandMat.emissiveIntensity = baseI * nightLift * Math.max(v.throttle, 0.12) * flicker;
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
  const rotors: THREE.Group[] = [];
  for (let i = 0; i < 3; i++) {
    const z = -D / 2 + 3.2 + i * 4.2;
    g.add(cyl(1.55, 1.7, 1.1, M.dark, 0, 3.4, z));
    const rotor = new THREE.Group();
    for (let bI = 0; bI < 3; bI++) {
      const blade = box(0.5, 0.08, 1.25, M.white, 0, 0, 0.8);
      const arm = new THREE.Group();
      arm.add(blade);
      arm.rotation.y = (bI / 3) * Math.PI * 2;
      rotor.add(arm);
    }
    rotor.position.set(0, 4.05, z);
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
  g.add(box(W - 4, 4.2, D - 6, M.concrete, 0, 2.5, 1.6));
  // twin evaporation stacks
  const steams: Steam[] = [];
  for (const sx of [-3.2, 3.2]) {
    g.add(cyl(1.5, 1.9, 5.4, M.white, sx, 2.7, -D / 2 + 3.2, 18));
    g.add(cyl(1.2, 1.35, 0.9, M.dark, sx, 5.6, -D / 2 + 3.2, 18));
    const s = new Steam();
    s.points.position.set(sx, 6, -D / 2 + 3.2);
    g.add(s.points);
    steams.push(s);
  }
  // pipe run between building and stacks
  g.add(cyl(0.28, 0.28, 6.4, M.pipe, 0, 1.3, -1).rotateX(Math.PI / 2));
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
    case "battery": return battery();
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
