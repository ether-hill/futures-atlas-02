import * as THREE from "three";
import type { Kind } from "./config";

// Procedural, low-poly data-center buildings. No external assets — every mesh is
// generated here so the bundle stays self-contained. Each building exposes a
// small animation surface (spinning fans, steam, status LEDs, failure smoke).

export type BStatus = "ok" | "warn" | "failed";

export interface Building {
  group: THREE.Group;
  setStatus(s: BStatus): void;
  setLoad(x: number): void; // 0..1 activity
  update(dt: number, t: number): void;
  dispose(): void;
}

const STATUS_COLOR: Record<BStatus, number> = {
  ok: 0x3a86ff,
  warn: 0xffb02e,
  failed: 0xff3b30,
};

// ── shared materials ───────────────────────────────────────────────
const mat = {
  concrete: new THREE.MeshStandardMaterial({ color: 0x9298a2, roughness: 0.96, metalness: 0.04 }),
  pad: new THREE.MeshStandardMaterial({ color: 0x595f68, roughness: 0.9 }),
  panel: new THREE.MeshStandardMaterial({ color: 0x7a818c, roughness: 0.66, metalness: 0.22 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x454c58, roughness: 0.55, metalness: 0.5 }),
  steel: new THREE.MeshStandardMaterial({ color: 0x9aa1ab, roughness: 0.42, metalness: 0.7 }),
  tower: new THREE.MeshStandardMaterial({ color: 0xbcc1cb, roughness: 0.92, side: THREE.DoubleSide }),
  insulator: new THREE.MeshStandardMaterial({ color: 0xd9d4c6, roughness: 0.6 }),
  glass: new THREE.MeshStandardMaterial({ color: 0x16202b, roughness: 0.18, metalness: 0.4 }),
};

function led(color: number): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.4, roughness: 0.4 });
}

// ── steam / smoke particles ────────────────────────────────────────
let steamTex: THREE.Texture | null = null;
function getSteamTex(): THREE.Texture {
  if (steamTex) return steamTex;
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.5, "rgba(255,255,255,0.55)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  steamTex = new THREE.CanvasTexture(c);
  return steamTex;
}

class Puffs {
  group = new THREE.Group();
  private items: { s: THREE.Sprite; phase: number; speed: number; ox: number; oz: number; drift: number; max: number }[] = [];
  private rise: number;
  private base: number;
  intensity = 0;
  target = 0;
  constructor(count: number, color: number, rise: number, spread: number, baseScale: number) {
    this.rise = rise;
    this.base = baseScale;
    for (let i = 0; i < count; i++) {
      const m = new THREE.SpriteMaterial({ map: getSteamTex(), color, transparent: true, opacity: 0, depthWrite: false });
      const s = new THREE.Sprite(m);
      const phase = i / count;
      this.items.push({
        s, phase, speed: 0.32 + Math.random() * 0.18,
        ox: (Math.random() - 0.5) * spread, oz: (Math.random() - 0.5) * spread,
        drift: (Math.random() - 0.5) * 0.18, max: 0.55 + Math.random() * 0.35,
      });
      this.group.add(s);
    }
  }
  setColor(c: number) { for (const it of this.items) (it.s.material as THREE.SpriteMaterial).color.setHex(c); }
  update(dt: number) {
    this.intensity += (this.target - this.intensity) * Math.min(1, dt * 2.5);
    for (const it of this.items) {
      it.phase += dt * it.speed;
      if (it.phase >= 1) it.phase -= 1;
      const p = it.phase;
      const y = p * this.rise;
      const sc = this.base * (0.55 + p * 1.25);
      it.s.position.set(it.ox + it.drift * p, y, it.oz);
      it.s.scale.set(sc, sc, 1);
      (it.s.material as THREE.SpriteMaterial).opacity = Math.sin(p * Math.PI) * it.max * this.intensity;
    }
  }
  dispose() { for (const it of this.items) (it.s.material as THREE.SpriteMaterial).dispose(); }
}

// ── fan helper ─────────────────────────────────────────────────────
function makeFan(radius: number): { group: THREE.Group; blades: THREE.Group } {
  const g = new THREE.Group();
  const housing = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 0.05, 18), mat.dark);
  housing.castShadow = true;
  const blades = new THREE.Group();
  const bg = new THREE.BoxGeometry(radius * 1.75, 0.012, radius * 0.36);
  for (let i = 0; i < 4; i++) {
    const b = new THREE.Mesh(bg, mat.steel);
    b.rotation.y = (i * Math.PI) / 2;
    blades.add(b);
  }
  blades.position.y = 0.04;
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.2, radius * 0.2, 0.05, 8), mat.steel);
  hub.position.y = 0.04;
  g.add(housing, blades, hub);
  return { group: g, blades };
}

// ── generic assembled building ─────────────────────────────────────
interface Parts {
  group: THREE.Group;
  leds: THREE.MeshStandardMaterial[];
  fans: THREE.Group[];
  fanRate: number;
  okColor: number;
  beacon?: THREE.MeshStandardMaterial;
  steam?: Puffs;
  smoke?: Puffs;
  canFail: boolean;
}

function assemble(p: Parts): Building {
  let status: BStatus = "ok";
  let load = 0.5;
  const applyLed = () => {
    const c = status === "ok" ? p.okColor : STATUS_COLOR[status];
    for (const m of p.leds) { m.color.setHex(c); m.emissive.setHex(c); }
  };
  applyLed();
  return {
    group: p.group,
    setStatus(s) {
      status = s;
      applyLed();
      if (p.smoke) p.smoke.target = s === "failed" ? 0.95 : 0;
    },
    setLoad(x) { load = Math.max(0, Math.min(1, x)); if (p.steam) p.steam.target = 0.2 + load * 0.95; },
    update(dt, t) {
      const spin = status === "failed" ? 0 : p.fanRate * (0.28 + 0.72 * load);
      for (const f of p.fans) f.rotation.y += spin * dt;
      const inten = status === "failed"
        ? (Math.sin(t * 9) > 0 ? 1.7 : 0.15)
        : 1.05 + load * 0.7;
      for (const m of p.leds) m.emissiveIntensity = inten;
      if (p.beacon) {
        const c = status === "failed" ? STATUS_COLOR.failed : p.okColor;
        p.beacon.color.setHex(c); p.beacon.emissive.setHex(c);
        p.beacon.emissiveIntensity = status === "failed" ? (Math.sin(t * 9) > 0 ? 2 : 0.1) : 0.6 + 0.6 * Math.sin(t * 2.4);
      }
      if (p.steam) p.steam.update(dt);
      if (p.smoke) p.smoke.update(dt);
    },
    dispose() {
      p.group.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
      });
      for (const m of p.leds) m.dispose();
      p.steam?.dispose();
      p.smoke?.dispose();
    },
  };
}

function box(w: number, h: number, d: number, m: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// ── server hall ────────────────────────────────────────────────────
function serverHall(): Building {
  const g = new THREE.Group();
  g.add(box(0.86, 0.14, 0.86, mat.concrete, 0, 0.07));
  g.add(box(0.7, 0.4, 0.62, mat.panel, 0, 0.34));
  g.add(box(0.72, 0.05, 0.64, mat.dark, 0, 0.2));
  g.add(box(0.72, 0.05, 0.64, mat.dark, 0, 0.46));
  // glass entrance
  g.add(box(0.22, 0.26, 0.02, mat.glass, -0.18, 0.27, 0.32));
  // LED strip along the front
  const okColor = 0x3a86ff;
  const lmat = led(okColor);
  g.add(box(0.6, 0.03, 0.02, lmat, 0.08, 0.33, 0.322));
  // rooftop exhaust fans
  const fans: THREE.Group[] = [];
  for (let i = -1; i <= 1; i++) {
    const f = makeFan(0.1);
    f.group.position.set(i * 0.21, 0.55, 0.04);
    g.add(f.group);
    fans.push(f.blades);
  }
  return assemble({ group: g, leds: [lmat], fans, fanRate: 5.5, okColor, canFail: true });
}

// ── GPU pod ────────────────────────────────────────────────────────
function gpuPod(): Building {
  const g = new THREE.Group();
  g.add(box(0.86, 0.14, 0.86, mat.concrete, 0, 0.07));
  g.add(box(0.66, 0.66, 0.62, mat.dark, 0, 0.47));
  const okColor = 0x18e0c8;
  const leds: THREE.MeshStandardMaterial[] = [];
  // glowing vertical vents on the long faces
  for (const sx of [-1, 1]) {
    for (let i = -1; i <= 1; i++) {
      const lm = led(okColor);
      leds.push(lm);
      g.add(box(0.02, 0.52, 0.07, lm, sx * 0.335, 0.47, i * 0.19));
    }
  }
  // rooftop beacon
  const bmat = led(okColor);
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), bmat);
  beacon.position.set(0, 0.85, 0);
  g.add(beacon);
  // 2×2 rooftop fans
  const fans: THREE.Group[] = [];
  for (const fx of [-0.16, 0.16]) for (const fz of [-0.15, 0.15]) {
    const f = makeFan(0.1);
    f.group.position.set(fx, 0.81, fz);
    g.add(f.group);
    fans.push(f.blades);
  }
  const smoke = new Puffs(6, 0x2b2f36, 1.3, 0.12, 0.34);
  smoke.group.position.set(0, 0.8, 0);
  g.add(smoke.group);
  return assemble({ group: g, leds, fans, fanRate: 8, okColor, beacon: bmat, smoke, canFail: true });
}

// ── cooling tower ──────────────────────────────────────────────────
function coolingTower(): Building {
  const g = new THREE.Group();
  g.add(box(0.84, 0.12, 0.84, mat.concrete, 0, 0.06));
  // hyperboloid profile via lathe
  const profile = [
    [0.38, 0.12], [0.32, 0.3], [0.255, 0.52], [0.235, 0.62],
    [0.255, 0.74], [0.305, 0.88],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const tower = new THREE.Mesh(new THREE.LatheGeometry(profile, 32), mat.tower);
  tower.castShadow = true;
  tower.receiveShadow = true;
  g.add(tower);
  // dark inner rim at the mouth
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.025, 8, 28), mat.dark);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.88;
  g.add(rim);
  // base pump units + an active-glow strip
  g.add(box(0.18, 0.16, 0.5, mat.panel, 0.46, 0.1, 0));
  const okColor = 0x49b6ff;
  const lmat = led(okColor);
  g.add(box(0.02, 0.05, 0.4, lmat, 0.553, 0.12, 0));
  const steam = new Puffs(9, 0xeef2f6, 1.95, 0.2, 0.62);
  steam.group.position.set(0, 0.92, 0);
  steam.target = 0.6;
  g.add(steam.group);
  return assemble({ group: g, leds: [lmat], fans: [], fanRate: 0, okColor, steam, canFail: false });
}

// ── substation ─────────────────────────────────────────────────────
function substation(): Building {
  const g = new THREE.Group();
  g.add(box(0.86, 0.12, 0.86, mat.concrete, 0, 0.06));
  const okColor = 0xffc24a;
  const leds: THREE.MeshStandardMaterial[] = [];
  // two transformer cans
  for (const tx of [-0.22, 0.22]) {
    g.add(box(0.28, 0.32, 0.36, mat.dark, tx, 0.28, -0.12));
    // ribs
    for (let i = -1; i <= 1; i++) g.add(box(0.3, 0.04, 0.02, mat.steel, tx, 0.24 + i * 0.07, 0.07));
    // ceramic insulators on top
    for (const ix of [-0.07, 0, 0.07]) {
      const ins = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.03, 0.12, 8), mat.insulator);
      ins.position.set(tx + ix, 0.5, -0.12);
      g.add(ins);
      const lm = led(okColor);
      lm.emissiveIntensity = 0.5;
      leds.push(lm);
      g.add(new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), lm).translateX(tx + ix).translateY(0.57).translateZ(-0.12));
    }
  }
  // lattice pylon
  const legXs = [-0.26, 0.26];
  const topY = 1.18;
  for (const lx of legXs) {
    const leg = box(0.035, topY, 0.035, mat.steel, lx, topY / 2 + 0.06, 0.28);
    g.add(leg);
  }
  // cross-arms
  for (const ay of [0.55, 0.85, 1.12]) g.add(box(0.62, 0.03, 0.03, mat.steel, 0, ay, 0.28));
  // diagonal bracing (two crossed bars)
  for (const s of [1, -1]) {
    const d = box(0.025, 0.9, 0.025, mat.steel, 0, 0.6, 0.28);
    d.rotation.z = s * 0.5;
    g.add(d);
  }
  // drooping power lines from the top arm
  const lineMat = new THREE.MeshStandardMaterial({ color: 0x202228, roughness: 0.8 });
  for (const lz of [-0.24, 0, 0.24]) {
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-0.28, 1.12, 0.28),
      new THREE.Vector3(0, 0.9, 0.28 + lz * 0.2),
      new THREE.Vector3(0.28, 1.12, 0.28),
    );
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 14, 0.008, 5), lineMat);
    g.add(tube);
  }
  return assemble({ group: g, leds, fans: [], fanRate: 0, okColor, canFail: false });
}

export function createBuilding(kind: Kind): Building {
  switch (kind) {
    case "rack": return serverHall();
    case "pod": return gpuPod();
    case "cool": return coolingTower();
    case "power": return substation();
  }
}
