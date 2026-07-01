/**
 * The company town: a seeded neighbourhood south of the campus — lawns,
 * streets with dashed centrelines, gabled houses with windows that light up
 * at dusk, street trees, streetlights, parked cars, a playground and a tennis
 * court. Pure dressing, but it's who the sentiment system speaks for.
 */

import * as THREE from "three";
import { RNG, hashSeed } from "./rng";
import { PLOT } from "./world";

// town footprint (world units)
const TX = 170; // half-width either side of the main road
const Z0 = PLOT / 2 + 24;
const Z1 = PLOT / 2 + 172;
const CROSS = [Z0 + 16, Z0 + 66, Z0 + 116]; // east-west streets
const AVES = [-112, -56, 56, 112]; // north-south avenues

const asphalt = new THREE.MeshStandardMaterial({ color: "#3d3d3b", roughness: 1 });
const sidewalkMat = new THREE.MeshStandardMaterial({ color: "#9b968a", roughness: 1 });
const dashMat = new THREE.MeshStandardMaterial({ color: "#cfcabb", roughness: 0.9 });
const trunkMat = new THREE.MeshStandardMaterial({ color: "#5d4a35", roughness: 1 });
const leafMat = new THREE.MeshStandardMaterial({ color: "#4d7040", roughness: 1, flatShading: true });
const leafMat2 = new THREE.MeshStandardMaterial({ color: "#3c5c36", roughness: 1, flatShading: true });
const poleMat = new THREE.MeshStandardMaterial({ color: "#4a4e52", roughness: 0.6, metalness: 0.5 });

const WALLS = ["#ece6d6", "#ddd3c0", "#c9c2b4", "#b0574d", "#93a0ac", "#d9c49a", "#f2efe6", "#a8b09a"];
const ROOFS = ["#4a4642", "#6b5646", "#8a4438", "#3f4a52", "#55504a"];

/** Gable roof prism: width w (gable ends face ±x), depth d, rise h. */
function gableGeo(w: number, d: number, h: number): THREE.BufferGeometry {
  const hw = w / 2, hd = d / 2;
  // prettier-ignore
  const v = [
    // left slope
    -hw, 0, -hd,  -hw, 0, hd,  0, h, hd,   -hw, 0, -hd,  0, h, hd,  0, h, -hd,
    // right slope
    hw, 0, hd,  hw, 0, -hd,  0, h, -hd,   hw, 0, hd,  0, h, -hd,  0, h, hd,
    // front gable
    -hw, 0, hd,  hw, 0, hd,  0, h, hd,
    // back gable
    hw, 0, -hd,  -hw, 0, -hd,  0, h, -hd,
  ];
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(v, 3));
  geo.computeVertexNormals();
  return geo;
}

export function makeTree(rng: RNG, scale = 1): THREE.Group {
  const g = new THREE.Group();
  const conifer = rng.chance(0.3);
  const s = scale * rng.range(0.8, 1.3);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14 * s, 0.2 * s, 1.6 * s, 6), trunkMat);
  trunk.position.y = 0.8 * s;
  trunk.castShadow = true;
  g.add(trunk);
  if (conifer) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(1.1 * s, 3.4 * s, 7), leafMat2);
    cone.position.y = 2.9 * s;
    cone.castShadow = true;
    g.add(cone);
  } else {
    const blobs = rng.int(2, 3);
    for (let i = 0; i < blobs; i++) {
      const r = rng.range(0.9, 1.5) * s;
      const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), rng.chance(0.5) ? leafMat : leafMat2);
      blob.position.set(rng.range(-0.6, 0.6) * s, rng.range(1.9, 2.9) * s, rng.range(-0.6, 0.6) * s);
      blob.castShadow = true;
      g.add(blob);
    }
  }
  return g;
}

const CAR_COLORS = ["#b8bcc2", "#8e959c", "#742f2a", "#2e4a68", "#d8d5cc", "#3a3d40", "#7a6f52"];
export function makeCar(rng: RNG): THREE.Group {
  const g = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({ color: rng.pick(CAR_COLORS), roughness: 0.35, metalness: 0.5 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(4.1, 0.85, 1.8), paint);
  body.position.y = 0.65;
  body.castShadow = true;
  g.add(body);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.65, 1.6), new THREE.MeshStandardMaterial({ color: "#20242a", roughness: 0.2, metalness: 0.6 }));
  cab.position.set(-0.2, 1.35, 0);
  cab.castShadow = true;
  g.add(cab);
  const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.25, 8);
  const wheelMat = new THREE.MeshStandardMaterial({ color: "#15161a", roughness: 0.9 });
  for (const [wx, wz] of [[-1.35, 0.85], [1.35, 0.85], [-1.35, -0.85], [1.35, -0.85]] as const) {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.rotation.x = Math.PI / 2;
    w.position.set(wx, 0.32, wz);
    g.add(w);
  }
  return g;
}

export class Town {
  readonly group = new THREE.Group();
  private windowMat: THREE.MeshStandardMaterial;
  private lampMat: THREE.MeshStandardMaterial;

  constructor(seedWord: string) {
    const rng = new RNG(hashSeed(seedWord + "-town"));
    const g = this.group;

    this.windowMat = new THREE.MeshStandardMaterial({
      color: "#1b1a17", emissive: new THREE.Color("#ffc97e"), emissiveIntensity: 0, roughness: 0.4,
    });
    this.lampMat = new THREE.MeshStandardMaterial({
      color: "#1c1d20", emissive: new THREE.Color("#ffe2ad"), emissiveIntensity: 0, roughness: 0.5,
    });

    // --- irrigated lawn under the whole town (the desert stops here) --------
    const lawnGeo = new THREE.PlaneGeometry(TX * 2 + 40, Z1 - Z0 + 60, 48, 24);
    lawnGeo.rotateX(-Math.PI / 2);
    const lp = lawnGeo.attributes.position as THREE.BufferAttribute;
    const lc = new Float32Array(lp.count * 3);
    const gA = new THREE.Color("#7f9a55"), gB = new THREE.Color("#6a8a4a"), c = new THREE.Color();
    for (let i = 0; i < lp.count; i++) {
      const n = Math.sin(lp.getX(i) * 0.12 + 7) * Math.sin(lp.getZ(i) * 0.17 + 3) * 0.5 + 0.5;
      c.copy(gA).lerp(gB, n);
      lc[i * 3] = c.r; lc[i * 3 + 1] = c.g; lc[i * 3 + 2] = c.b;
    }
    lawnGeo.setAttribute("color", new THREE.BufferAttribute(lc, 3));
    const lawn = new THREE.Mesh(lawnGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
    lawn.position.set(0, 0.03, (Z0 + Z1) / 2);
    lawn.receiveShadow = true;
    g.add(lawn);

    // --- streets -------------------------------------------------------------
    const street = (w: number, len: number, x: number, z: number, alongX: boolean) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(alongX ? len : w, alongX ? w : len), asphalt);
      m.rotation.x = -Math.PI / 2;
      m.position.set(x, 0.06, z);
      m.receiveShadow = true;
      g.add(m);
      // dashed centreline
      const n = Math.floor(len / 7);
      for (let i = 0; i < n; i++) {
        const dash = new THREE.Mesh(new THREE.PlaneGeometry(alongX ? 2.6 : 0.28, alongX ? 0.28 : 2.6), dashMat);
        dash.rotation.x = -Math.PI / 2;
        const along = -len / 2 + 3.5 + i * 7;
        dash.position.set(alongX ? x + along : x, 0.075, alongX ? z : z + along);
        g.add(dash);
      }
      // sidewalks
      for (const side of [-1, 1]) {
        const sw = new THREE.Mesh(new THREE.PlaneGeometry(alongX ? len : 1.6, alongX ? 1.6 : len), sidewalkMat);
        sw.rotation.x = -Math.PI / 2;
        sw.position.set(alongX ? x : x + side * (w / 2 + 0.9), 0.065, alongX ? z + side * (w / 2 + 0.9) : z);
        sw.receiveShadow = true;
        g.add(sw);
      }
    };
    for (const cz of CROSS) street(7, TX * 2, 0, cz, true);
    for (const ax of AVES) street(6, Z1 - Z0 + 16, ax, (Z0 + Z1) / 2, false);

    // --- special lots (kept clear of houses) ---------------------------------
    const playground = { x: 84, z: CROSS[2] - 26, w: 34, d: 26 };
    const tennis = { x: -84, z: CROSS[2] - 26, w: 26, d: 32 };
    const inRect = (x: number, z: number, r: { x: number; z: number; w: number; d: number }) =>
      Math.abs(x - r.x) < r.w / 2 + 5 && Math.abs(z - r.z) < r.d / 2 + 5;

    this.addPlayground(g, rng, playground.x, playground.z);
    this.addTennis(g, tennis.x, tennis.z);

    // --- houses along the cross streets --------------------------------------
    for (const cz of CROSS) {
      for (const side of [-1, 1]) {
        for (let x = -TX + 12; x <= TX - 12; x += rng.range(15, 20)) {
          if (Math.abs(x) < 10) continue; // main road
          if (AVES.some((ax) => Math.abs(x - ax) < 8)) continue;
          const hz = cz + side * 12;
          if (hz > Z1 || hz < Z0 - 6) continue;
          if (inRect(x, hz, playground) || inRect(x, hz, tennis)) continue;
          if (rng.chance(0.18)) continue; // vacant lots
          g.add(this.makeHouse(rng, x, hz, side));
          // yard trees
          if (rng.chance(0.75)) {
            const t = makeTree(rng);
            t.position.set(x + rng.range(-7, 7), 0, hz + side * rng.range(3, 7));
            g.add(t);
          }
        }
      }
    }

    // street trees along the main road
    for (let z = Z0 - 4; z < Z1; z += 17) {
      for (const side of [-1, 1]) {
        if (rng.chance(0.25)) continue;
        const t = makeTree(rng, 1.15);
        t.position.set(side * rng.range(8.5, 11), 0, z + rng.range(-3, 3));
        g.add(t);
      }
    }

    // --- streetlights ----------------------------------------------------------
    const lampHeads: THREE.Vector3[] = [];
    for (let z = Z0 - 6; z <= Z1; z += 30) lampHeads.push(new THREE.Vector3(6.4, 0, z), new THREE.Vector3(-6.4, 0, z + 15));
    for (const cz of CROSS) for (let x = -TX + 20; x <= TX - 20; x += 46) lampHeads.push(new THREE.Vector3(x, 0, cz + 4.6));
    const headGeo = new THREE.SphereGeometry(0.28, 8, 8);
    for (const p of lampHeads) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 5.4, 6), poleMat);
      pole.position.set(p.x, 2.7, p.z);
      g.add(pole);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.09, 0.09), poleMat);
      arm.position.set(p.x + (p.x >= 0 ? -0.5 : 0.5), 5.35, p.z);
      g.add(arm);
      const head = new THREE.Mesh(headGeo, this.lampMat);
      head.position.set(p.x + (p.x >= 0 ? -1 : 1), 5.28, p.z);
      g.add(head);
    }

    // --- parked cars -------------------------------------------------------------
    for (let i = 0; i < 14; i++) {
      const car = makeCar(rng);
      const cz = rng.pick(CROSS);
      const x = rng.range(-TX + 14, TX - 14);
      if (Math.abs(x) < 12 || AVES.some((ax) => Math.abs(x - ax) < 7)) continue;
      car.position.set(x, 0.06, cz + rng.pick([-4.6, 4.6]));
      car.rotation.y = rng.chance(0.5) ? 0 : Math.PI;
      g.add(car);
    }
  }

  private makeHouse(rng: RNG, x: number, z: number, facing: number): THREE.Group {
    const g = new THREE.Group();
    const w = rng.range(6.5, 9.5); // along street
    const d = rng.range(5.5, 7.5);
    const h = rng.range(2.9, 3.5);
    const twoStorey = rng.chance(0.28);
    const H = twoStorey ? h * 1.8 : h;
    const wallMat = new THREE.MeshStandardMaterial({ color: rng.pick(WALLS), roughness: 0.9 });
    const roofMat = new THREE.MeshStandardMaterial({ color: rng.pick(ROOFS), roughness: 0.85 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(w, H, d), wallMat);
    body.position.y = H / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    g.add(body);

    const roof = new THREE.Mesh(gableGeo(w + 0.7, d + 0.7, rng.range(1.4, 2.1)), roofMat);
    roof.position.y = H;
    roof.castShadow = true;
    g.add(roof);

    if (rng.chance(0.35)) {
      const chim = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.6, 0.5), roofMat);
      chim.position.set(w * 0.28, H + 1.1, -d * 0.2);
      g.add(chim);
    }

    // windows on the street face + one gable end; door on the street face
    const winGeo = new THREE.PlaneGeometry(0.85, 1.05);
    const front = (d / 2 + 0.02) * -facing; // face toward the street
    const rows = twoStorey ? [H * 0.3, H * 0.72] : [H * 0.5];
    for (const wy of rows) {
      for (const wx of [-w * 0.28, w * 0.28]) {
        const win = new THREE.Mesh(winGeo, this.windowMat);
        win.position.set(wx, wy, front);
        win.rotation.y = facing < 0 ? 0 : Math.PI;
        g.add(win);
      }
    }
    const door = new THREE.Mesh(
      new THREE.PlaneGeometry(0.95, 1.9),
      new THREE.MeshStandardMaterial({ color: rng.pick(["#5d3b2e", "#33424e", "#6e2f2a", "#2f3a2c"]), roughness: 0.8 }),
    );
    door.position.set(0, 0.97, front);
    door.rotation.y = facing < 0 ? 0 : Math.PI;
    g.add(door);

    g.position.set(x, 0.04, z);
    g.rotation.y = rng.range(-0.03, 0.03);
    return g;
  }

  private addPlayground(g: THREE.Group, rng: RNG, x: number, z: number): void {
    const sand = new THREE.Mesh(new THREE.PlaneGeometry(30, 22), new THREE.MeshStandardMaterial({ color: "#d9c391", roughness: 1 }));
    sand.rotation.x = -Math.PI / 2;
    sand.position.set(x, 0.07, z);
    sand.receiveShadow = true;
    g.add(sand);
    const paint = (c: string) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.5 });
    const red = paint("#c8483c"), yellow = paint("#e2b33c"), blue = paint("#3c6ec8"), green = paint("#4f9b57");
    // climbing frame
    for (let i = 0; i < 4; i++) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 2.4, 6), i % 2 ? red : blue);
      post.position.set(x - 6 + (i % 2) * 3, 1.2, z - 4 + Math.floor(i / 2) * 3);
      g.add(post);
    }
    const deck = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.2, 3.6), yellow);
    deck.position.set(x - 4.5, 2.1, z - 2.5);
    deck.castShadow = true;
    g.add(deck);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.6, 1.4, 4), red);
    roof.position.set(x - 4.5, 3.6, z - 2.5);
    roof.rotation.y = Math.PI / 4;
    g.add(roof);
    // slide
    const slide = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 4.2), green);
    slide.position.set(x - 2.2, 1.35, z + 0.4);
    slide.rotation.x = 0.5;
    g.add(slide);
    // swings
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 5.2, 6), blue);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(x + 4.5, 2.5, z + 3);
    g.add(bar);
    for (const sx of [-1.4, 0, 1.4]) {
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.3), rng.pick([red, yellow, green]));
      seat.position.set(x + 4.5 + sx, 0.9, z + 3);
      g.add(seat);
      for (const cs of [-0.28, 0.28]) {
        const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.6, 4), poleMat);
        chain.position.set(x + 4.5 + sx + cs, 1.7, z + 3);
        g.add(chain);
      }
    }
  }

  private addTennis(g: THREE.Group, x: number, z: number): void {
    const court = new THREE.Mesh(new THREE.PlaneGeometry(14, 26), new THREE.MeshStandardMaterial({ color: "#3f7a52", roughness: 0.95 }));
    court.rotation.x = -Math.PI / 2;
    court.position.set(x, 0.07, z);
    court.receiveShadow = true;
    g.add(court);
    const lineMat = new THREE.MeshStandardMaterial({ color: "#e8e6da", roughness: 0.8 });
    const line = (w: number, len: number, lx: number, lz: number) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, len), lineMat);
      m.rotation.x = -Math.PI / 2;
      m.position.set(x + lx, 0.085, z + lz);
      g.add(m);
    };
    line(0.12, 22, -5, 0); line(0.12, 22, 5, 0);
    line(10.12, 0.12, 0, -11); line(10.12, 0.12, 0, 11); line(10.12, 0.12, 0, 0);
    const net = new THREE.Mesh(
      new THREE.PlaneGeometry(11, 0.9),
      new THREE.MeshStandardMaterial({ color: "#2a2c2e", transparent: true, opacity: 0.6, side: THREE.DoubleSide }),
    );
    net.position.set(x, 0.55, z);
    g.add(net);
  }

  /** Windows and lamps come on at dusk. */
  update(night: number): void {
    this.windowMat.emissiveIntensity = night * 1.7;
    this.lampMat.emissiveIntensity = night * 3.2;
  }
}
