import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GRID_COLS, GRID_ROWS, type Kind } from "./config";
import { createBuilding, type Building, type BStatus } from "./buildings";

const CELL = 1;
const PLOT_W = GRID_COLS * CELL;
const PLOT_D = GRID_ROWS * CELL;
const SLAB_H = 0.3;

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
  private sun!: THREE.DirectionalLight;
  private buildings = new Map<number, Building>();
  private plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private ray = new THREE.Raycaster();
  private ghostGroup = new THREE.Group();
  private ghostBox: THREE.Mesh;
  private ghostTile: THREE.Mesh;
  private hoverTile: THREE.Mesh;

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
    this.renderer.toneMappingExposure = 1.18;
    container.appendChild(this.renderer.domElement);

    // sky + fog
    this.scene.background = makeSky();
    this.scene.fog = new THREE.Fog(0xcadcec, 30, 70);

    this.camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 200);
    this.camera.position.set(7.5, 8.2, 10.5);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 0, 0);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 26;
    this.controls.maxPolarAngle = 1.21; // keep above the horizon
    this.controls.minPolarAngle = 0.15;
    this.controls.update();

    this.buildLights();
    this.buildGround();
    this.buildTrees();

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
    const hemi = new THREE.HemisphereLight(0xdcecff, 0x5a6b48, 1.05);
    this.scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff3da, 2.75);
    sun.position.set(7, 12, 4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 40;
    const s = 9;
    sun.shadow.camera.left = -s; sun.shadow.camera.right = s;
    sun.shadow.camera.top = s; sun.shadow.camera.bottom = -s;
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.02;
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
    const trunkGeo = new THREE.CylinderGeometry(0.045, 0.06, 0.32, 5);
    const foliageGeo = new THREE.ConeGeometry(0.24, 0.6, 7);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a4632, roughness: 1 });
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 });
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
      m.makeScale(sc, sc, sc); m.setPosition(x, -SLAB_H + 0.16 * sc, z);
      trunks.setMatrixAt(placed, m);
      m.makeScale(sc, sc, sc); m.setPosition(x, -SLAB_H + (0.32 + 0.3) * sc, z);
      foliage.setMatrixAt(placed, m);
      col.setHSL(0.27 + rnd() * 0.07, 0.45 + rnd() * 0.2, 0.32 + rnd() * 0.12);
      foliage.setColorAt(placed, col);
      placed++;
    }
    trunks.count = placed; foliage.count = placed;
    trunks.instanceMatrix.needsUpdate = true; foliage.instanceMatrix.needsUpdate = true;
    if (foliage.instanceColor) foliage.instanceColor.needsUpdate = true;
    this.scene.add(trunks, foliage);
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
    b.group.rotation.y = ((i * 1.3) % 4) * (Math.PI / 2); // vary facing a little
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
    this.sun.target.position.set(0, 0, 0);
    this.renderer.render(this.scene, this.camera);
  }

  resize = () => {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
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
