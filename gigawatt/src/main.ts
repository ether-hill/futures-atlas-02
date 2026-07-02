/**
 * Bootstrap: renderer + camera + controls, placement/selection interaction,
 * and the fixed-step sim ↔ per-frame render loop.
 */

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import "./style.css";
import { BUILD_ORDER, DEFS, GRID, type DefId } from "./defs";
import { buildMesh, makeGhost, tintGhost, type BuildingView } from "./buildings";
import { Sim, type Unit } from "./sim";
import { UI, type Tool } from "./ui";
import { World, cellToWorld, worldToCell, PLOT } from "./world";
import { Town } from "./town";
import { AudioEngine } from "./audio";
import { randomSeedWord } from "./rng";

const app = document.getElementById("app")!;

// --- seed ------------------------------------------------------------------
const urlSeed = new URLSearchParams(location.search).get("seed");
const seed = urlSeed || randomSeedWord();

// --- three ------------------------------------------------------------------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
app.append(renderer.domElement);

const camera = new THREE.PerspectiveCamera(46, 1, 1, 2600);
// default frame: town in the foreground, campus centre, river on the horizon
// (camera south-west, looking north-east) — the reference composition
camera.position.set(-205, 225, 315);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.rotateSpeed = 0.85;
controls.maxPolarAngle = 1.38;
controls.minDistance = 28;
controls.maxDistance = 620;
controls.target.set(85, 0, 15);

// debug handle for scripted screenshots / camera checks
(window as unknown as Record<string, unknown>).__gw = { camera, controls };

const world = new World(seed);
const sim = new Sim(seed);
// optional start-of-run clock override (e.g. ?hour=20.5 for a dusk screenshot)
const hourParam = Number(new URLSearchParams(location.search).get("hour"));
if (Number.isFinite(hourParam) && hourParam > 0) sim.timeH = hourParam % 24;
const town = new Town(seed);
world.scene.add(town.group);
const audio = new AudioEngine();

// post: render → bloom (night glow) → tonemap/output, on an MSAA target
const rtSize = new THREE.Vector2();
renderer.getSize(rtSize);
const composer = new EffectComposer(
  renderer,
  new THREE.WebGLRenderTarget(rtSize.x, rtSize.y, { samples: 4, type: THREE.HalfFloatType }),
);
composer.addPass(new RenderPass(world.scene, camera));
const bloom = new UnrealBloomPass(rtSize.clone(), 0.32, 0.65, 0.9);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// --- unit meshes -------------------------------------------------------------
const views = new Map<number, BuildingView>();
const unitRoot = new THREE.Group();
world.scene.add(unitRoot);

function addUnitMesh(u: Unit): void {
  const v = buildMesh(u.def);
  const D = DEFS[u.def];
  const p = cellToWorld(u.x, u.z, u.w, u.d);
  v.group.position.copy(p);
  if (u.w !== D.w) v.group.rotation.y = Math.PI / 2; // rotated footprint
  v.group.userData.unitId = u.id;
  unitRoot.add(v.group);
  views.set(u.id, v);
}

function removeUnitMesh(id: number): void {
  const v = views.get(id);
  if (v) {
    unitRoot.remove(v.group);
    views.delete(id);
  }
}

// --- tools / placement ---------------------------------------------------------
let tool: Tool = null;
let rotated = false;
let ghost: THREE.Group | null = null;
let ghostDef: DefId | null = null;
let ghostValid = false;
let ghostCell = { x: 0, z: 0 };
let speed = 1;
let started = false;
let selectedId: number | null = null;

const ui = new UI(app, {
  onTool: setTool,
  onSpeed: (s) => {
    speed = s;
    ui.setSpeed(s);
  },
  onAccept: (id) => sim.accept(id),
  onDecline: (id) => sim.decline(id),
  onSell: (unitId) => {
    if (sim.demolish(unitId)) {
      removeUnitMesh(unitId);
      audio.blip("demolish");
    }
    select(null);
  },
  onStart: (s) => {
    audio.start(); // user gesture — safe to spin up WebAudio here
    if (s !== seed) {
      const u = new URL(location.href);
      u.searchParams.set("seed", s);
      location.href = u.toString();
      return;
    }
    started = true;
    const u = new URL(location.href);
    u.searchParams.set("seed", seed);
    history.replaceState(null, "", u.toString());
    ui.hideOverlay();
  },
  onMute: () => audio.toggleMute(),
});
ui.showIntro(seed);
ui.setSpeed(1);

function setTool(t: Tool): void {
  // toggling the same tool disarms it
  if (t && tool && JSON.stringify(t) === JSON.stringify(tool)) t = null;
  tool = t;
  ui.setTool(t);
  select(null);
  world.grid.visible = t?.kind === "build";
  if (ghost) {
    world.scene.remove(ghost);
    ghost = null;
    ghostDef = null;
  }
  if (t?.kind === "build") {
    ghostDef = t.def;
    ghost = makeGhost(t.def);
    ghost.visible = false;
    world.scene.add(ghost);
  }
  renderer.domElement.style.cursor = t ? "crosshair" : "";
}

function footprint(def: DefId): { w: number; d: number } {
  const D = DEFS[def];
  return rotated ? { w: D.d, d: D.w } : { w: D.w, d: D.d };
}

const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const hitPoint = new THREE.Vector3();

function pointerGround(e: PointerEvent): THREE.Vector3 | null {
  const r = renderer.domElement.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  return raycaster.ray.intersectPlane(groundPlane, hitPoint) ? hitPoint : null;
}

function updateGhost(e: PointerEvent): void {
  if (!ghost || !ghostDef) return;
  const p = pointerGround(e);
  if (!p || Math.abs(p.x) > PLOT / 2 + 30 || Math.abs(p.z) > PLOT / 2 + 30) {
    ghost.visible = false;
    return;
  }
  const { w, d } = footprint(ghostDef);
  const c = worldToCell(p);
  const x = Math.min(Math.max(c.x - Math.floor(w / 2), 0), GRID - w);
  const z = Math.min(Math.max(c.z - Math.floor(d / 2), 0), GRID - d);
  ghostCell = { x, z };
  ghost.visible = true;
  ghost.position.copy(cellToWorld(x, z, w, d));
  ghost.rotation.y = w !== DEFS[ghostDef].w ? Math.PI / 2 : 0;
  ghostValid = sim.canPlace(x, z, w, d) && sim.cash >= DEFS[ghostDef].cost;
  tintGhost(ghost, ghostValid);
}

function unitFromObject(o: THREE.Object3D | null): Unit | null {
  let cur: THREE.Object3D | null = o;
  while (cur) {
    if (typeof cur.userData.unitId === "number") {
      return sim.units.find((u) => u.id === cur!.userData.unitId) ?? null;
    }
    cur = cur.parent;
  }
  return null;
}

const selRing = new THREE.Mesh(
  new THREE.RingGeometry(1, 1.08, 40).rotateX(-Math.PI / 2),
  new THREE.MeshBasicMaterial({ color: 0x6fdcff, transparent: true, opacity: 0.9, depthWrite: false }),
);
selRing.visible = false;
world.scene.add(selRing);

function select(u: Unit | null): void {
  selectedId = u?.id ?? null;
  if (!u) {
    selRing.visible = false;
    ui.hideSelection();
    return;
  }
  const span = (Math.max(u.w, u.d) * 8) / 2 + 3.5;
  selRing.scale.setScalar(span);
  selRing.position.copy(cellToWorld(u.x, u.z, u.w, u.d)).setY(0.15);
  selRing.visible = true;
  ui.showSelection(u);
}

// click vs drag discrimination so orbiting never places a building
let downAt: { x: number; y: number } | null = null;
renderer.domElement.addEventListener("pointerdown", (e) => {
  if (e.button === 0) downAt = { x: e.clientX, y: e.clientY };
});
renderer.domElement.addEventListener("pointermove", (e) => updateGhost(e));
renderer.domElement.addEventListener("pointerup", (e) => {
  if (e.button === 2 && tool) {
    setTool(null);
    return;
  }
  if (e.button !== 0 || !downAt) return;
  const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
  downAt = null;
  if (moved > 6 || !started) return;

  if (tool?.kind === "build" && ghost && ghostDef && ghost.visible) {
    if (!ghostValid) return;
    const { w, d } = footprint(ghostDef);
    const u = sim.place(ghostDef, ghostCell.x, ghostCell.z, w, d);
    if (u) {
      addUnitMesh(u);
      audio.blip("place");
      updateGhost(e); // re-validate for chained placement
    }
    return;
  }

  // demolish or select
  const r = renderer.domElement.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const hits = raycaster.intersectObjects(unitRoot.children, true);
  const u = hits.length ? unitFromObject(hits[0].object) : null;
  if (tool?.kind === "demolish") {
    if (u && sim.demolish(u.id)) {
      removeUnitMesh(u.id);
      audio.blip("demolish");
    }
    return;
  }
  select(u);
});
renderer.domElement.addEventListener("contextmenu", (e) => e.preventDefault());

window.addEventListener("keydown", (e) => {
  if ((e.target as HTMLElement).tagName === "INPUT") return;
  const idx = "123456789".indexOf(e.key);
  if (idx >= 0 && idx < BUILD_ORDER.length) {
    setTool({ kind: "build", def: BUILD_ORDER[idx] });
  } else if (e.key === "r" || e.key === "R") {
    rotated = !rotated;
  } else if (e.key === "x" || e.key === "X") {
    setTool({ kind: "demolish" });
  } else if (e.key === "Escape") {
    setTool(null);
    select(null);
  } else if (e.key === " ") {
    e.preventDefault();
    speed = speed === 0 ? 1 : 0;
    ui.setSpeed(speed);
  }
});

// --- resize --------------------------------------------------------------------
function resize(): void {
  const w = app.clientWidth, h = app.clientHeight;
  renderer.setSize(w, h);
  composer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);
resize();

// --- loop ------------------------------------------------------------------------
const H_PER_S = 0.5; // sim-hours per real second at 1× (a day in 48 s)
const STEP = 0.02; // fixed sim step, sim-hours
let acc = 0;
let last = performance.now();
let ended = false;

function frame(now: number): void {
  requestAnimationFrame(frame);
  const dtReal = Math.min((now - last) / 1000, 0.1);
  last = now;

  if (started && !ended) {
    acc += dtReal * speed * H_PER_S;
    let guard = 0;
    while (acc >= STEP && guard++ < 60) {
      sim.tick(STEP);
      acc -= STEP;
    }
  }

  const dust = sim.event?.kind === "duststorm" ? 1 : 0;
  const env = world.update(sim.hourOfDay(), dust, sim.smog);
  town.update(env.night);
  bloom.strength = 0.16 + env.night * 0.4;
  controls.update();

  // soundscape follows the sim; one-shot cues ride on the toast stream
  const r = sim.readout;
  audio.update({
    itLoad: r.itInstalledMW > 0 ? r.itMW / r.itInstalledMW : 0,
    coolLoad: r.coolCapMW > 0 ? Math.min(1, r.heatGenMW / r.coolCapMW) : 0,
    gasLoad: r.gasCapMW > 0 ? r.gasUsedMW / r.gasCapMW : 0,
    windF: r.windF,
    night: env.night,
  });
  for (const toast of sim.toasts) {
    audio.blip(toast.kind === "bad" ? "alarm" : toast.kind === "warn" ? "warn" : toast.kind === "good" ? "cash" : "click");
  }

  // drive building animations from live unit state
  const t = now / 1000;
  for (const u of sim.units) {
    const v = views.get(u.id);
    if (!v) continue;
    v.update(t, dtReal, {
      throttle: u.throttle,
      load: u.load,
      failed: u.failed,
      charge: u.def === "battery" ? u.load : 0,
      sun: sim.readout.sun,
      night: env.night,
    });
  }

  ui.update(sim);
  if (selectedId !== null) {
    const u = sim.units.find((x) => x.id === selectedId);
    if (u) ui.showSelection(u);
    else select(null);
  }
  if (sim.gameOver && !ended) {
    ended = true;
    ui.showEnd(sim.gameOver, sim);
  }

  composer.render();
}
requestAnimationFrame(frame);
