import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { SMAAPass } from "three/examples/jsm/postprocessing/SMAAPass.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { GRID_COLS, GRID_ROWS, type Kind } from "./config";
import { createBuilding, type Building, type BStatus } from "./buildings";

const CELL = 1;
const PLOT_W = GRID_COLS * CELL;
const PLOT_D = GRID_ROWS * CELL;
const SLAB_H = 0.3;
const PROP_Y = -SLAB_H; // the surrounding field surface

const GHOST_H: Record<Kind, number> = { rack: 0.6, pod: 0.9, cool: 1.0, power: 1.25 };

// gentle deterministic-ish scatter for cosmetic props (not gameplay)
function scatter(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

export class World {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  private container: HTMLElement;
  private composer!: EffectComposer;
  private sun!: THREE.DirectionalLight;
  private buildings = new Map<number, Building>();
  private plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private ray = new THREE.Raycaster();
  private ghostGroup = new THREE.Group();
  private ghostBox: THREE.Mesh;
  private ghostTile: THREE.Mesh;
  private hoverTile: THREE.Mesh;

  // community + noise pollution visuals
  private community = new THREE.Group();
  private houseWindows: THREE.MeshStandardMaterial[] = [];
  private noiseGroup = new THREE.Group();
  private noiseGeo!: THREE.BufferGeometry;
  private noiseRings: { loop: THREE.LineLoop; mat: THREE.LineBasicMaterial; age: number; active: boolean; inten: number }[] = [];
  private noiseI = 0;
  private noiseAcc = 0;
  private turbines: THREE.Group[] = [];

  constructor(container: HTMLElement) {
    this.container = container;
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    this.renderer.setSize(w, h);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    container.appendChild(this.renderer.domElement);

    // sky + fog
    this.scene.background = makeSky();
    this.scene.fog = new THREE.Fog(0xcadcec, 34, 82);

    // image-based lighting — gives metal, glass and painted surfaces real
    // reflections/shading instead of flat colour (a big fidelity lever)
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.5;

    this.camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 200);
    this.camera.position.set(9.5, 9.5, 13);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 0, 0);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 40;
    this.controls.maxPolarAngle = 1.21; // keep above the horizon
    this.controls.minPolarAngle = 0.15;
    this.controls.update();

    // post: crisp SMAA anti-aliasing (fidelity from IBL + shadows + materials)
    this.composer = new EffectComposer(this.renderer);
    this.composer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.composer.addPass(new SMAAPass(w, h));
    this.composer.addPass(new OutputPass());

    this.buildLights();
    this.buildGround();
    this.buildTrees();
    this.buildNeighborhood();
    this.buildCampus();
    this.initNoiseWaves();
    this.scene.add(this.community, this.noiseGroup);

    // ghost preview (translucent footprint box + tile) and hover tile
    this.ghostBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 1, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x39d353, transparent: true, opacity: 0.35, emissive: 0x39d353, emissiveIntensity: 0.4 }),
    );
    this.ghostTile = makeTile(0x39d353);
    this.ghostGroup.add(this.ghostBox, this.ghostTile);
    this.ghostGroup.visible = false;
    this.scene.add(this.ghostGroup);
    this.hoverTile = makeTile(0x8fd0ff);
    this.hoverTile.visible = false;
    this.scene.add(this.hoverTile);

    window.addEventListener("resize", this.resize);
  }

  private buildLights() {
    const hemi = new THREE.HemisphereLight(0xdcecff, 0x6a7a52, 0.7);
    this.scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff1d0, 2.6);
    sun.position.set(9, 11, 6); // lower, raking light for longer shadows
    sun.castShadow = true;
    sun.shadow.mapSize.set(4096, 4096);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 60;
    const s = 16; // cover the pad + the nearby community
    sun.shadow.camera.left = -s; sun.shadow.camera.right = s;
    sun.shadow.camera.top = s; sun.shadow.camera.bottom = -s;
    sun.shadow.bias = -0.00025;
    sun.shadow.normalBias = 0.025;
    sun.shadow.radius = 3;
    this.scene.add(sun);
    this.scene.add(sun.target);
    this.sun = sun;
  }

  private buildGround() {
    // wide grass field
    const field = new THREE.Mesh(
      new THREE.CircleGeometry(60, 48),
      new THREE.MeshStandardMaterial({ color: 0x6e9c4f, roughness: 1 }),
    );
    field.rotation.x = -Math.PI / 2;
    field.position.y = -SLAB_H;
    field.receiveShadow = true;
    this.scene.add(field);

    // raised build slab — grass top, soil sides (the facility pad)
    const grass = new THREE.MeshStandardMaterial({ color: 0x7cb058, roughness: 0.97 });
    const soil = new THREE.MeshStandardMaterial({ color: 0x836b4c, roughness: 1 });
    const slab = new THREE.Mesh(
      new THREE.BoxGeometry(PLOT_W + 1, SLAB_H, PLOT_D + 1),
      [soil, soil, grass, soil, soil, soil], // +x -x +y -y +z -z
    );
    slab.position.y = -SLAB_H / 2;
    slab.castShadow = true;
    slab.receiveShadow = true;
    this.scene.add(slab);

    // faint grid lines on the pad
    const pts: number[] = [];
    const x0 = -PLOT_W / 2, x1 = PLOT_W / 2, z0 = -PLOT_D / 2, z1 = PLOT_D / 2;
    for (let c = 0; c <= GRID_COLS; c++) { const x = x0 + c * CELL; pts.push(x, 0.004, z0, x, 0.004, z1); }
    for (let r = 0; r <= GRID_ROWS; r++) { const z = z0 + r * CELL; pts.push(x0, 0.004, z, x1, 0.004, z); }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    const grid = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0x52713f, transparent: true, opacity: 0.55 }));
    this.scene.add(grid);
  }

  private buildTrees() {
    const rnd = scatter(20260628);
    const trunkGeo = new THREE.CylinderGeometry(0.04, 0.055, 0.42, 6);
    const foliageGeo = new THREE.IcosahedronGeometry(0.32, 1); // rounded low-poly canopy
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6a5138, roughness: 1 });
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, flatShading: true });
    const N = 70;
    const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, N);
    const foliage = new THREE.InstancedMesh(foliageGeo, foliageMat, N);
    foliage.castShadow = true;
    const m = new THREE.Matrix4();
    const col = new THREE.Color();
    const halfW = PLOT_W / 2 + 1.4, halfD = PLOT_D / 2 + 1.4;
    let placed = 0, tries = 0;
    while (placed < N && tries < N * 12) {
      tries++;
      const ang = rnd() * Math.PI * 2;
      const rad = 6 + rnd() * 22;
      const x = Math.cos(ang) * rad * 1.15;
      const z = Math.sin(ang) * rad * 0.9;
      if (Math.abs(x) < halfW && Math.abs(z) < halfD) continue; // keep the pad clear
      const sc = 0.7 + rnd() * 0.9;
      m.makeScale(sc, sc, sc); m.setPosition(x, -SLAB_H + 0.21 * sc, z);
      trunks.setMatrixAt(placed, m);
      m.makeScale(sc, sc * 1.15, sc); m.setPosition(x, -SLAB_H + (0.42 + 0.26) * sc, z);
      foliage.setMatrixAt(placed, m);
      col.setHSL(0.26 + rnd() * 0.08, 0.5 + rnd() * 0.18, 0.32 + rnd() * 0.1);
      foliage.setColorAt(placed, col);
      placed++;
    }
    trunks.count = placed; foliage.count = placed;
    trunks.instanceMatrix.needsUpdate = true; foliage.instanceMatrix.needsUpdate = true;
    if (foliage.instanceColor) foliage.instanceColor.needsUpdate = true;
    this.scene.add(trunks, foliage);
  }

  // ── the surrounding community (what the noise pollution affects) ──
  private buildNeighborhood() {
    // roads first (they sit under everything)
    this.addRoad(0, 6.4, 19, 0.7, false);   // main road in front of the houses
    this.addRoad(6.6, 0.3, 14, 0.7, true);  // cross road out to the school
    this.addRoad(-6.2, 1.5, 9, 0.55, true); // residential lane

    // residential rows on the near side of the plot
    const wallColors = [0xd9cbb2, 0xcbb79a, 0xc9d2d8, 0xd6b9a6, 0xbfc7b4, 0xd8c9a0];
    let hi = 0;
    for (let row = 0; row < 2; row++) {
      const z = 7.2 + row * 1.7;
      for (let k = 0; k < 6; k++) {
        const x = -5 + k * 2.0 + (row ? 1.0 : 0);
        this.addHouse(x, z, row ? Math.PI : 0, wallColors[hi % wallColors.length], hi % 2 === 0);
        hi++;
      }
    }
    // a couple more houses down the lane
    this.addHouse(-7.6, 3.2, Math.PI / 2, 0xd0c3a8);
    this.addHouse(-7.6, 5.0, Math.PI / 2, 0xcbd2d6);

    this.addSchool(8.6, -1.5);
    this.addPlayground(5.4, 9.2);
  }

  private addRoad(cx: number, cz: number, length: number, width: number, vertical: boolean) {
    const road = new THREE.Mesh(
      new THREE.BoxGeometry(vertical ? width : length, 0.04, vertical ? length : width),
      new THREE.MeshStandardMaterial({ color: 0x3b3d42, roughness: 0.95 }),
    );
    road.position.set(cx, PROP_Y + 0.02, cz);
    road.receiveShadow = true;
    this.community.add(road);
    // dashed centre line along the road's length
    const dashN = Math.max(3, Math.floor(length / 1.4));
    const dashMat = new THREE.MeshStandardMaterial({ color: 0xd9d38a, roughness: 0.9 });
    for (let i = 0; i < dashN; i++) {
      const dash = new THREE.Mesh(new THREE.BoxGeometry(vertical ? 0.06 : 0.5, 0.01, vertical ? 0.5 : 0.06), dashMat);
      const off = -length / 2 + 0.7 + i * (length / dashN);
      dash.position.set(vertical ? cx : cx + off, PROP_Y + 0.045, vertical ? cz + off : cz);
      this.community.add(dash);
    }
  }

  private addHouse(x: number, z: number, rot: number, wall: number, solar = false) {
    const g = new THREE.Group();
    g.position.set(x, PROP_Y, z);
    g.rotation.y = rot;
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.62, 0.8), new THREE.MeshStandardMaterial({ color: wall, roughness: 0.9 }));
    body.position.y = 0.31; body.castShadow = true; body.receiveShadow = true;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.72, 0.44, 4), new THREE.MeshStandardMaterial({ color: 0x8a4b3a, roughness: 0.85 }));
    roof.rotation.y = Math.PI / 4; roof.position.y = 0.62 + 0.22; roof.castShadow = true;
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.32, 0.03), new THREE.MeshStandardMaterial({ color: 0x5a4636, roughness: 0.9 }));
    door.position.set(-0.24, 0.16, 0.41);
    g.add(body, roof, door);
    if (solar) {
      const panelMat = new THREE.MeshStandardMaterial({ color: 0x1c3a6e, metalness: 0.4, roughness: 0.35 });
      for (const px of [-0.16, 0.16]) {
        const panel = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.02, 0.3), panelMat);
        panel.position.set(px, 0.78, 0.18); panel.rotation.x = -0.62;
        g.add(panel);
      }
    }
    // two lit windows (their glow is tinted by community sentiment)
    for (const wx of [0.14, 0.36]) {
      const wm = new THREE.MeshStandardMaterial({ color: 0xffe6b0, emissive: 0xffd591, emissiveIntensity: 0.8, roughness: 0.4 });
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.02), wm);
      win.position.set(wx, 0.34, 0.41);
      g.add(win);
      this.houseWindows.push(wm);
    }
    this.community.add(g);
  }

  private addSchool(x: number, z: number) {
    const g = new THREE.Group();
    g.position.set(x, PROP_Y, z);
    g.rotation.y = -Math.PI / 2;
    const body = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.98, 1.4), new THREE.MeshStandardMaterial({ color: 0xe4dcc6, roughness: 0.9 }));
    body.position.y = 0.49; body.castShadow = true; body.receiveShadow = true;
    const roof = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.08, 1.5), new THREE.MeshStandardMaterial({ color: 0x9a5648, roughness: 0.9 }));
    roof.position.y = 1.0;
    g.add(body, roof);
    // window row
    for (let i = 0; i < 6; i++) {
      const wm = new THREE.MeshStandardMaterial({ color: 0xbfe6ff, emissive: 0x8fd0ff, emissiveIntensity: 0.5, roughness: 0.4 });
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.3, 0.02), wm);
      win.position.set(-1.5 + i * 0.6, 0.55, 0.71);
      g.add(win);
      this.houseWindows.push(wm);
    }
    // entrance + flagpole
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.62, 0.06), new THREE.MeshStandardMaterial({ color: 0x6b5240 }));
    door.position.set(0, 0.31, 0.72);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.5, 8), new THREE.MeshStandardMaterial({ color: 0xb8bcc4, metalness: 0.5, roughness: 0.5 }));
    pole.position.set(-1.9, 0.75, 0.5); pole.castShadow = true;
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.3), new THREE.MeshStandardMaterial({ color: 0xd94c4c, roughness: 0.8, side: THREE.DoubleSide }));
    flag.position.set(-1.64, 1.35, 0.5);
    g.add(door, pole, flag);
    this.community.add(g);
  }

  private addPlayground(x: number, z: number) {
    const g = new THREE.Group();
    g.position.set(x, PROP_Y, z);
    const pad = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.05, 2.4), new THREE.MeshStandardMaterial({ color: 0xc7a878, roughness: 1 }));
    pad.position.y = 0.025; pad.receiveShadow = true;
    g.add(pad);
    // slide
    const platform = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.5), new THREE.MeshStandardMaterial({ color: 0x4aa3d6 }));
    platform.position.set(-0.8, 0.5, -0.6);
    const legs = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.06), new THREE.MeshStandardMaterial({ color: 0x9aa1ab }));
    legs.position.set(-0.8, 0.25, -0.82);
    const slide = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.04, 0.9), new THREE.MeshStandardMaterial({ color: 0xe0503a }));
    slide.position.set(-0.8, 0.3, -0.15); slide.rotation.x = 0.7;
    g.add(platform, legs, slide);
    // swing set
    const barMat = new THREE.MeshStandardMaterial({ color: 0x3f7fb0, metalness: 0.3, roughness: 0.6 });
    for (const sx of [0.4, 1.4]) {
      const a = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.7, 0.05), barMat); a.position.set(sx, 0.35, -0.25); a.rotation.z = 0.2;
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.7, 0.05), barMat); b.position.set(sx, 0.35, 0.25); b.rotation.z = 0.2;
      g.add(a, b);
    }
    const topBar = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.05, 0.05), barMat); topBar.position.set(0.9, 0.68, 0);
    g.add(topBar);
    for (const sx of [0.65, 1.15]) {
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 0.1), new THREE.MeshStandardMaterial({ color: 0xf2c14e }));
      seat.position.set(sx, 0.28, 0); g.add(seat);
    }
    // roundabout
    const round = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.1, 16), new THREE.MeshStandardMaterial({ color: 0x6fbf73 }));
    round.position.set(0.7, 0.08, 0.8); g.add(round);
    this.community.add(g);
  }

  // ── the wider campus: fence, turbines, sports field, parking, water ──
  private buildCampus() {
    this.addFence();
    // wind turbines on the far side (clean-power backdrop)
    this.addTurbine(-9, -13, 7.5);
    this.addTurbine(-2.5, -15, 8.6);
    this.addTurbine(5.5, -14, 7.0);
    this.addSportsField(13.5, 4);
    this.addParking(-2, -8.5);
    this.addPond(15, -8);
  }

  private addFence() {
    const hw = PLOT_W / 2 + 0.9, hd = PLOT_D / 2 + 0.9;
    const postMat = new THREE.MeshStandardMaterial({ color: 0x555b63, metalness: 0.5, roughness: 0.6 });
    const meshMat = new THREE.MeshStandardMaterial({ color: 0x8f9aa4, metalness: 0.3, roughness: 0.7, transparent: true, opacity: 0.28, side: THREE.DoubleSide });
    const H = 0.7;
    const run = (x1: number, z1: number, x2: number, z2: number) => {
      const len = Math.hypot(x2 - x1, z2 - z1);
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(len, H), meshMat);
      panel.position.set((x1 + x2) / 2, PROP_Y + H / 2, (z1 + z2) / 2);
      panel.rotation.y = -Math.atan2(z2 - z1, x2 - x1);
      this.community.add(panel);
      const n = Math.round(len / 1.3);
      for (let i = 0; i <= n; i++) {
        const px = x1 + (x2 - x1) * (i / n), pz = z1 + (z2 - z1) * (i / n);
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, H + 0.06, 6), postMat);
        post.position.set(px, PROP_Y + (H + 0.06) / 2, pz);
        this.community.add(post);
      }
    };
    run(-hw, -hd, hw, -hd); run(-hw, hd, hw, hd);
    run(-hw, -hd, -hw, hd); run(hw, -hd, hw, hd);
  }

  private addTurbine(x: number, z: number, height: number) {
    const g = new THREE.Group();
    g.position.set(x, PROP_Y, z);
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, height, 12), new THREE.MeshStandardMaterial({ color: 0xf2f4f7, roughness: 0.6 }));
    tower.position.y = height / 2; tower.castShadow = true;
    const nacelle = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.28, 0.28), new THREE.MeshStandardMaterial({ color: 0xe8ebef, roughness: 0.5 }));
    nacelle.position.set(0, height, 0.1);
    const hub = new THREE.Group();
    hub.position.set(0, height, 0.28);
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0xf6f8fa, roughness: 0.5 });
    for (let i = 0; i < 3; i++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.6, 0.04), bladeMat);
      blade.position.y = 1.3;
      const holder = new THREE.Group();
      holder.rotation.z = (i * Math.PI * 2) / 3;
      holder.add(blade);
      hub.add(holder);
    }
    hub.castShadow = true;
    g.add(tower, nacelle, hub);
    this.community.add(g);
    this.turbines.push(hub);
  }

  private addSportsField(x: number, z: number) {
    const g = new THREE.Group();
    g.position.set(x, PROP_Y + 0.02, z);
    // red running track surround
    const track = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.03, 5.2), new THREE.MeshStandardMaterial({ color: 0xb2543f, roughness: 1 }));
    g.add(track);
    // green pitch
    const pitch = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.04, 4.0), new THREE.MeshStandardMaterial({ color: 0x4f9e52, roughness: 1 }));
    pitch.position.y = 0.02; g.add(pitch);
    // white markings: outline, halfway line, centre circle
    const lineMat = new THREE.MeshStandardMaterial({ color: 0xf0f4f0, roughness: 0.9 });
    const edge = (w: number, d: number, px: number, pz: number) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, 0.01, d), lineMat); b.position.set(px, 0.05, pz); g.add(b); };
    edge(5.6, 0.06, 0, 1.9); edge(5.6, 0.06, 0, -1.9); edge(0.06, 3.8, 2.8, 0); edge(0.06, 3.8, -2.8, 0); edge(0.06, 3.8, 0, 0);
    const circle = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.03, 6, 24), lineMat); circle.rotation.x = Math.PI / 2; circle.position.y = 0.05; g.add(circle);
    this.community.add(g);
  }

  private addParking(x: number, z: number) {
    const g = new THREE.Group();
    g.position.set(x, PROP_Y, z);
    const lot = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.04, 3.2), new THREE.MeshStandardMaterial({ color: 0x53565c, roughness: 0.95 }));
    lot.position.y = 0.02; lot.receiveShadow = true; g.add(lot);
    const lineMat = new THREE.MeshStandardMaterial({ color: 0xd7dade, roughness: 0.9 });
    for (let i = 0; i <= 8; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.01, 1.2), lineMat); b.position.set(-3 + i * 0.75, 0.05, 0.8); g.add(b); }
    // trucks (cab + trailer) and cars
    const truck = (tx: number, col: number) => {
      const t = new THREE.Group(); t.position.set(tx, 0.04, -0.6);
      const trailer = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.34, 1.6), new THREE.MeshStandardMaterial({ color: 0xe8ebef, roughness: 0.6 }));
      trailer.position.set(0, 0.25, 0.2); trailer.castShadow = true;
      const cab = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.3, 0.5), new THREE.MeshStandardMaterial({ color: col, roughness: 0.5, metalness: 0.2 }));
      cab.position.set(0, 0.22, -0.85); cab.castShadow = true;
      t.add(trailer, cab); g.add(t);
    };
    truck(-1.4, 0x2f5fb0); truck(-0.2, 0x9aa1ab); truck(1.0, 0x2f5fb0);
    const car = (cx: number, cz: number, col: number) => {
      const c = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.7), new THREE.MeshStandardMaterial({ color: col, roughness: 0.4, metalness: 0.3 }));
      c.position.set(cx, 0.14, cz); c.castShadow = true; g.add(c);
    };
    car(-2.6, 0.8, 0xcc4444); car(2.4, 0.8, 0xffffff); car(2.9, 0.8, 0x333a44);
    this.community.add(g);
  }

  private addPond(x: number, z: number) {
    const water = new THREE.Mesh(
      new THREE.CircleGeometry(4.2, 40),
      new THREE.MeshStandardMaterial({ color: 0x3f7fa8, roughness: 0.25, metalness: 0.3 }),
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(x, PROP_Y + 0.015, z);
    water.scale.set(1.3, 1, 0.85);
    this.community.add(water);
  }

  // ── noise waves — pulses of "sound" spreading across the ground ──
  private initNoiseWaves() {
    const pts: number[] = [];
    const seg = 80;
    for (let i = 0; i < seg; i++) { const a = (i / seg) * Math.PI * 2; pts.push(Math.cos(a), 0, Math.sin(a)); }
    this.noiseGeo = new THREE.BufferGeometry();
    this.noiseGeo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  }

  /** intensity 0..1 from the current fence-line noise level */
  setNoise(intensity: number) { this.noiseI = Math.max(0, Math.min(1, intensity)); }

  /** sentiment 0..1 tints the houses' window glow from warm/happy to dark/red */
  setSentiment(s01: number) {
    const s = Math.max(0, Math.min(1, s01));
    for (const m of this.houseWindows) {
      // warm gold when content, dim red when the neighbourhood is unhappy
      m.emissive.setRGB(1.0, 0.35 + 0.55 * s, 0.15 + 0.6 * s);
      m.emissiveIntensity = 0.15 + 0.85 * s;
    }
  }

  private updateNoiseWaves(dt: number) {
    // spawn rate climbs steeply with noise
    this.noiseAcc += dt * (this.noiseI * this.noiseI * 5.5);
    while (this.noiseAcc >= 1) {
      this.noiseAcc -= 1;
      this.spawnNoiseRing();
    }
    const LIFE = 3.4, MAXR = 26;
    for (const r of this.noiseRings) {
      if (!r.active) continue;
      r.age += dt;
      const k = r.age / LIFE;
      if (k >= 1) { r.active = false; r.loop.visible = false; continue; }
      const rad = 1 + k * MAXR;
      r.loop.scale.set(rad, 1, rad);
      r.mat.opacity = (1 - k) * 0.5 * (0.35 + 0.65 * r.inten);
    }
  }

  private spawnNoiseRing() {
    let r = this.noiseRings.find((x) => !x.active);
    if (!r && this.noiseRings.length < 40) {
      const mat = new THREE.LineBasicMaterial({ transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
      const loop = new THREE.LineLoop(this.noiseGeo, mat);
      loop.position.y = PROP_Y + 0.04;
      loop.frustumCulled = false;
      r = { loop, mat, age: 0, active: false, inten: 0 };
      this.noiseRings.push(r);
      this.noiseGroup.add(loop);
    }
    if (!r) return;
    r.active = true; r.age = 0; r.inten = this.noiseI; r.loop.visible = true;
    // amber when moderate, red when loud
    r.mat.color.setRGB(1.0, 0.62 - 0.42 * this.noiseI, 0.2 - 0.12 * this.noiseI);
  }

  // ── grid <-> world ──────────────────────────────────────────────
  cellToPos(i: number): THREE.Vector3 {
    const col = i % GRID_COLS, row = Math.floor(i / GRID_COLS);
    const x = (col - (GRID_COLS - 1) / 2) * CELL;
    const z = (row - (GRID_ROWS - 1) / 2) * CELL;
    return new THREE.Vector3(x, 0, z);
  }
  private cellFromPoint(p: THREE.Vector3): number | null {
    const col = Math.round(p.x / CELL + (GRID_COLS - 1) / 2);
    const row = Math.round(p.z / CELL + (GRID_ROWS - 1) / 2);
    if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) return null;
    return row * GRID_COLS + col;
  }
  raycast(ndcX: number, ndcY: number): number | null {
    this.ray.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera);
    const hit = new THREE.Vector3();
    if (!this.ray.ray.intersectPlane(this.plane, hit)) return null;
    return this.cellFromPoint(hit);
  }

  // ── buildings ───────────────────────────────────────────────────
  add(i: number, kind: Kind) {
    if (this.buildings.has(i)) return;
    const b = createBuilding(kind);
    b.group.position.copy(this.cellToPos(i));
    this.scene.add(b.group);
    this.buildings.set(i, b);
  }
  remove(i: number) {
    const b = this.buildings.get(i);
    if (!b) return;
    this.scene.remove(b.group);
    b.dispose();
    this.buildings.delete(i);
  }
  setState(i: number, status: BStatus, load: number) {
    const b = this.buildings.get(i);
    if (!b) return;
    b.setStatus(status);
    b.setLoad(load);
  }
  has(i: number) { return this.buildings.has(i); }

  // ── ghost + hover ───────────────────────────────────────────────
  showGhost(i: number, kind: Kind, ok: boolean) {
    const pos = this.cellToPos(i);
    const h = GHOST_H[kind];
    this.ghostBox.scale.set(1, h, 1);
    this.ghostBox.position.set(pos.x, h / 2, pos.z);
    this.ghostTile.position.set(pos.x, 0.012, pos.z);
    const c = ok ? 0x39d353 : 0xff4d4d;
    (this.ghostBox.material as THREE.MeshStandardMaterial).color.setHex(c);
    (this.ghostBox.material as THREE.MeshStandardMaterial).emissive.setHex(c);
    (this.ghostTile.material as THREE.MeshBasicMaterial).color.setHex(c);
    this.ghostGroup.visible = true;
    this.hoverTile.visible = false;
  }
  showHover(i: number, color = 0x8fd0ff) {
    const pos = this.cellToPos(i);
    this.hoverTile.position.set(pos.x, 0.012, pos.z);
    (this.hoverTile.material as THREE.MeshBasicMaterial).color.setHex(color);
    this.hoverTile.visible = true;
    this.ghostGroup.visible = false;
  }
  clearGhost() { this.ghostGroup.visible = false; this.hoverTile.visible = false; }

  // ── loop ────────────────────────────────────────────────────────
  update(dt: number, t: number) {
    this.controls.update();
    for (const b of this.buildings.values()) b.update(dt, t);
    for (const hub of this.turbines) hub.rotation.z += dt * 0.5;
    this.updateNoiseWaves(dt);
    this.sun.target.position.set(0, 0, 0);
    this.composer.render();
  }

  resize = () => {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);
  };

  dispose() {
    window.removeEventListener("resize", this.resize);
    this.renderer.dispose();
  }
}

// ── helpers ───────────────────────────────────────────────────────
function makeTile(color: number): THREE.Mesh {
  const t = new THREE.Mesh(
    new THREE.PlaneGeometry(0.94, 0.94),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.4, depthWrite: false }),
  );
  t.rotation.x = -Math.PI / 2;
  return t;
}

function makeSky(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = 8; c.height = 256;
  const g = c.getContext("2d")!;
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, "#4a86c8");
  grad.addColorStop(0.5, "#9cc4e4");
  grad.addColorStop(1, "#d7e8f2");
  g.fillStyle = grad;
  g.fillRect(0, 0, 8, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.mapping = THREE.EquirectangularReflectionMapping;
  return tex;
}
