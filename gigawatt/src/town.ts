/**
 * The company town: a seeded neighbourhood south of the campus — lawns,
 * streets with sidewalks and dashed centrelines, gabled houses with
 * driveways, hedges and back fences, apartment blocks, a school, street
 * trees, streetlights, crosswalks, parked cars, a playground and a tennis
 * court. Pure dressing, but it's who the sentiment system speaks for.
 */

import * as THREE from "three";
import { buildTreeField, makeCar, type TreeItem } from "./dressing";
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
const drivewayMat = new THREE.MeshStandardMaterial({ color: "#8b867a", roughness: 1 });
const poleMat = new THREE.MeshStandardMaterial({ color: "#4a4e52", roughness: 0.6, metalness: 0.5 });
const hedgeMat = new THREE.MeshStandardMaterial({ color: "#43613a", roughness: 1, flatShading: true });
const fenceMat = new THREE.MeshStandardMaterial({ color: "#c9bfa8", roughness: 0.9 });
const brickMat = new THREE.MeshStandardMaterial({ color: "#9c5243", roughness: 0.9 });
const creamMat = new THREE.MeshStandardMaterial({ color: "#e6ddc6", roughness: 0.9 });

const WALLS = ["#ece6d6", "#ddd3c0", "#c9c2b4", "#b0574d", "#93a0ac", "#d9c49a", "#f2efe6", "#a8b09a"];
const ROOFS = ["#4a4642", "#6b5646", "#8a4438", "#3f4a52", "#55504a"];

/** Gable roof prism: width w (gable ends face ±x), depth d, rise h. */
function gableGeo(w: number, d: number, h: number): THREE.BufferGeometry {
  const hw = w / 2, hd = d / 2;
  // prettier-ignore
  const v = [
    -hw, 0, -hd,  -hw, 0, hd,  0, h, hd,   -hw, 0, -hd,  0, h, hd,  0, h, -hd,
    hw, 0, hd,  hw, 0, -hd,  0, h, -hd,   hw, 0, hd,  0, h, -hd,  0, h, hd,
    -hw, 0, hd,  hw, 0, hd,  0, h, hd,
    hw, 0, -hd,  -hw, 0, -hd,  0, h, -hd,
  ];
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(v, 3));
  geo.computeVertexNormals();
  return geo;
}

interface Lot {
  x: number;
  z: number;
  facing: THREE.Vector2; // unit vector pointing from house toward its street
}

export class Town {
  readonly group = new THREE.Group();
  private windowMat: THREE.MeshStandardMaterial;
  private lampMat: THREE.MeshStandardMaterial;
  private trees: TreeItem[] = [];

  constructor(seedWord: string) {
    const rng = new RNG(hashSeed(seedWord + "-town"));
    const g = this.group;

    this.windowMat = new THREE.MeshStandardMaterial({
      color: "#1b1a17", emissive: new THREE.Color("#ffc97e"), emissiveIntensity: 0, roughness: 0.4,
    });
    this.lampMat = new THREE.MeshStandardMaterial({
      color: "#1c1d20", emissive: new THREE.Color("#ffe2ad"), emissiveIntensity: 0, roughness: 0.5,
    });

    // --- irrigated lawn under the whole town --------------------------------
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
      const n = Math.floor(len / 7);
      for (let i = 0; i < n; i++) {
        const dash = new THREE.Mesh(new THREE.PlaneGeometry(alongX ? 2.6 : 0.28, alongX ? 0.28 : 2.6), dashMat);
        dash.rotation.x = -Math.PI / 2;
        const along = -len / 2 + 3.5 + i * 7;
        dash.position.set(alongX ? x + along : x, 0.075, alongX ? z : z + along);
        g.add(dash);
      }
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

    // crosswalks where the cross streets meet the main road
    for (const cz of CROSS) {
      for (const side of [-1, 1]) {
        for (let i = 0; i < 6; i++) {
          const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 3.2), dashMat);
          stripe.rotation.x = -Math.PI / 2;
          stripe.position.set(-4.3 + i * 1.7, 0.08, cz + side * 5.6);
          g.add(stripe);
        }
      }
    }

    // --- special lots (kept clear of houses) ---------------------------------
    const reserved = [
      { x: 84, z: CROSS[2] - 26, w: 40, d: 30 }, // playground
      { x: -84, z: CROSS[2] - 26, w: 32, d: 36 }, // tennis
      { x: 30, z: CROSS[2] - 27, w: 34, d: 22 }, // school
      { x: -22, z: CROSS[0] + 14, w: 26, d: 16 }, // apartments A
      { x: 24, z: CROSS[1] + 14, w: 26, d: 16 }, // apartments B
    ];
    const inReserved = (x: number, z: number) =>
      reserved.some((r) => Math.abs(x - r.x) < r.w / 2 + 4 && Math.abs(z - r.z) < r.d / 2 + 4);

    this.addPlayground(g, rng, reserved[0].x, reserved[0].z);
    this.addTennis(g, reserved[1].x, reserved[1].z);
    this.addSchool(g, reserved[2].x, reserved[2].z);
    this.addApartments(g, rng, reserved[3].x, reserved[3].z, brickMat);
    this.addApartments(g, rng, reserved[4].x, reserved[4].z, creamMat);

    // --- house lots: along cross streets AND avenues --------------------------
    const lots: Lot[] = [];
    for (const cz of CROSS) {
      for (const side of [-1, 1]) {
        for (let x = -TX + 12; x <= TX - 12; x += rng.range(14, 18)) {
          if (Math.abs(x) < 11) continue;
          if (AVES.some((ax) => Math.abs(x - ax) < 9)) continue;
          const hz = cz + side * 12;
          if (hz > Z1 || hz < Z0 - 6) continue;
          lots.push({ x, z: hz, facing: new THREE.Vector2(0, -side) });
        }
      }
    }
    for (const ax of AVES) {
      for (const side of [-1, 1]) {
        for (let z = Z0 + 4; z <= Z1 - 6; z += rng.range(15, 19)) {
          if (CROSS.some((cz) => Math.abs(z - cz) < 11)) continue;
          const hx = ax + side * 11.5;
          if (Math.abs(hx) < 11 || Math.abs(hx) > TX - 6) continue;
          lots.push({ x: hx, z, facing: new THREE.Vector2(-side, 0) });
        }
      }
    }

    for (const lot of lots) {
      if (inReserved(lot.x, lot.z) || rng.chance(0.14)) continue; // some vacant lots
      g.add(this.makeHouse(rng, lot));
      if (rng.chance(0.8)) {
        this.trees.push({
          x: lot.x + rng.range(-8, 8) - lot.facing.x * 4,
          y: 0, z: lot.z + rng.range(-4, 4) - lot.facing.y * 4,
          s: rng.range(0.75, 1.3), conifer: rng.chance(0.3),
        });
      }
    }

    // street trees: main road + cross streets
    for (let z = Z0 - 4; z < Z1; z += 15) {
      for (const side of [-1, 1]) {
        if (rng.chance(0.2)) continue;
        this.trees.push({ x: side * rng.range(8.5, 11), y: 0, z: z + rng.range(-3, 3), s: rng.range(1, 1.4), conifer: false });
      }
    }
    for (const cz of CROSS) {
      for (let x = -TX + 10; x < TX - 10; x += 22) {
        if (Math.abs(x) < 12 || rng.chance(0.35)) continue;
        this.trees.push({ x: x + rng.range(-3, 3), y: 0, z: cz + rng.pick([-6.2, 6.2]), s: rng.range(0.9, 1.3), conifer: false });
      }
    }
    g.add(buildTreeField(this.trees));

    // --- streetlights ----------------------------------------------------------
    const lampHeads: THREE.Vector3[] = [];
    for (let z = Z0 - 6; z <= Z1; z += 30) lampHeads.push(new THREE.Vector3(6.4, 0, z), new THREE.Vector3(-6.4, 0, z + 15));
    for (const cz of CROSS) for (let x = -TX + 20; x <= TX - 20; x += 40) lampHeads.push(new THREE.Vector3(x, 0, cz + 4.6));
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
    for (let i = 0; i < 26; i++) {
      const car = makeCar(rng);
      if (rng.chance(0.35)) {
        // along an avenue
        const ax = rng.pick(AVES);
        const z = rng.range(Z0 + 6, Z1 - 6);
        if (CROSS.some((cz) => Math.abs(z - cz) < 8)) continue;
        car.position.set(ax + rng.pick([-4.1, 4.1]), 0.06, z);
        car.rotation.y = Math.PI / 2 + (rng.chance(0.5) ? 0 : Math.PI);
      } else {
        const cz = rng.pick(CROSS);
        const x = rng.range(-TX + 14, TX - 14);
        if (Math.abs(x) < 12 || AVES.some((ax) => Math.abs(x - ax) < 7)) continue;
        car.position.set(x, 0.06, cz + rng.pick([-4.6, 4.6]));
        car.rotation.y = rng.chance(0.5) ? 0 : Math.PI;
      }
      g.add(car);
    }
  }

  private makeHouse(rng: RNG, lot: Lot): THREE.Group {
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

    // windows + door on the street face
    const winGeo = new THREE.PlaneGeometry(0.85, 1.05);
    const front = d / 2 + 0.02;
    const rows = twoStorey ? [H * 0.3, H * 0.72] : [H * 0.5];
    for (const wy of rows) {
      for (const wx of [-w * 0.28, w * 0.28]) {
        const win = new THREE.Mesh(winGeo, this.windowMat);
        win.position.set(wx, wy, front);
        g.add(win);
      }
    }
    const door = new THREE.Mesh(
      new THREE.PlaneGeometry(0.95, 1.9),
      new THREE.MeshStandardMaterial({ color: rng.pick(["#5d3b2e", "#33424e", "#6e2f2a", "#2f3a2c"]), roughness: 0.8 }),
    );
    door.position.set(0, 0.97, front);
    g.add(door);

    // driveway out to the street + a hedge or picket fence along one lot line
    const drive = new THREE.Mesh(new THREE.PlaneGeometry(3, 6.5), drivewayMat);
    drive.rotation.x = -Math.PI / 2;
    drive.position.set(w / 2 + 2.2, 0.045, front + 2.4);
    drive.receiveShadow = true;
    g.add(drive);
    if (rng.chance(0.55)) {
      const car = makeCar(rng);
      car.scale.setScalar(0.9);
      car.rotation.y = Math.PI / 2;
      car.position.set(w / 2 + 2.2, 0.05, front + 1.6);
      g.add(car);
    }
    if (rng.chance(0.5)) {
      const hedge = new THREE.Mesh(new THREE.BoxGeometry(0.8, rng.range(0.7, 1.1), d + 3), hedgeMat);
      hedge.position.set(-w / 2 - 1.6, 0.5, 0);
      hedge.castShadow = true;
      g.add(hedge);
    } else if (rng.chance(0.5)) {
      const back = new THREE.Mesh(new THREE.BoxGeometry(w + 4, 0.85, 0.08), fenceMat);
      back.position.set(0, 0.45, -d / 2 - 3);
      g.add(back);
    }

    // orient the whole lot so its front faces the street it belongs to
    g.position.set(lot.x, 0.04, lot.z);
    g.rotation.y = Math.atan2(lot.facing.x, lot.facing.y) + rng.range(-0.02, 0.02);
    return g;
  }

  /** Flat-roofed walk-up like the reference image's civic blocks. */
  private addApartments(g: THREE.Group, rng: RNG, x: number, z: number, wall: THREE.Material): void {
    const W = 20, D = 10, H = 8.6;
    const body = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), wall);
    body.position.set(x, H / 2, z);
    body.castShadow = true;
    body.receiveShadow = true;
    g.add(body);
    const parapet = new THREE.Mesh(new THREE.BoxGeometry(W + 0.5, 0.4, D + 0.5), poleMat);
    parapet.position.set(x, H + 0.2, z);
    g.add(parapet);
    const winGeo = new THREE.PlaneGeometry(1.1, 1.3);
    for (let f = 0; f < 3; f++) {
      const wy = 1.6 + f * 2.7;
      for (let i = 0; i < 6; i++) {
        const wx = x - W / 2 + 2 + i * 3.2;
        for (const side of [-1, 1]) {
          const win = new THREE.Mesh(winGeo, this.windowMat);
          win.position.set(wx, wy, z + side * (D / 2 + 0.02));
          win.rotation.y = side < 0 ? Math.PI : 0;
          g.add(win);
        }
      }
    }
    const entry = new THREE.Mesh(new THREE.BoxGeometry(3, 2.4, 1), rng.chance(0.5) ? creamMat : poleMat);
    entry.position.set(x, 1.2, z + D / 2 + 0.4);
    g.add(entry);
  }

  private addSchool(g: THREE.Group, x: number, z: number): void {
    const W = 28, D = 14, H = 6.8;
    const body = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), creamMat);
    body.position.set(x, H / 2, z);
    body.castShadow = true;
    body.receiveShadow = true;
    g.add(body);
    const glass = new THREE.MeshStandardMaterial({ color: "#2e5d8f", roughness: 0.2, metalness: 0.8 });
    for (const side of [-1, 1]) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(W - 3, 1.6, 0.14), glass);
      strip.position.set(x, 4.6, z + side * (D / 2 + 0.05));
      g.add(strip);
      const strip2 = new THREE.Mesh(new THREE.BoxGeometry(W - 3, 1.6, 0.14), glass);
      strip2.position.set(x, 2, z + side * (D / 2 + 0.05));
      g.add(strip2);
    }
    const entrance = new THREE.Mesh(new THREE.BoxGeometry(6, 4.2, 2.4), brickMat);
    entrance.position.set(x - 4, 2.1, z + D / 2 + 1);
    entrance.castShadow = true;
    g.add(entrance);
    const flag = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 7, 6), poleMat);
    flag.position.set(x + 10, 3.5, z + D / 2 + 3);
    g.add(flag);
  }

  private addPlayground(g: THREE.Group, rng: RNG, x: number, z: number): void {
    const sand = new THREE.Mesh(new THREE.PlaneGeometry(30, 22), new THREE.MeshStandardMaterial({ color: "#d9c391", roughness: 1 }));
    sand.rotation.x = -Math.PI / 2;
    sand.position.set(x, 0.07, z);
    sand.receiveShadow = true;
    g.add(sand);
    const paint = (c: string) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.5 });
    const red = paint("#c8483c"), yellow = paint("#e2b33c"), blue = paint("#3c6ec8"), green = paint("#4f9b57");
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
    const slide = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 4.2), green);
    slide.position.set(x - 2.2, 1.35, z + 0.4);
    slide.rotation.x = 0.5;
    g.add(slide);
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
    // perimeter fence posts
    for (const [fx, fz] of [[-8, -14], [8, -14], [-8, 14], [8, 14], [-8, 0], [8, 0]] as const) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3, 5), poleMat);
      post.position.set(x + fx, 1.5, z + fz);
      g.add(post);
    }
  }

  /** Windows and lamps come on at dusk. */
  update(night: number): void {
    this.windowMat.emissiveIntensity = night * 1.7;
    this.lampMat.emissiveIntensity = night * 3.2;
  }
}
