// PORTED from the cymatics repo (components/projects/cymatics-v2/engine.ts at
// 680a369). Changed: imports (./kit, ./dish) and the two injected <style>
// blocks, which moved to the route's cymatics.css on Futures Atlas tokens.
// Everything else is upstream's; fix it there first.
//
// Cymatics Simulator V2 — the dish, in code. The physics and the picture
// live in dish.ts; this is the chrome around them: the v1 title bar and
// key-frequency tabs, the rack's controls, the drive tone on Web Audio.

import {
  panel, controlGrid, slider, segmented, powerButton,
  ensureAudio, suspendAudio, reduceMotion,
} from "./kit";
import { createRenderer, dispersionK, selectModes, slopeNormaliser, PALETTES, TAU, type Mode, type Selection } from "./dish";

export function mount(root: HTMLElement): () => void {

const TAU = Math.PI * 2;

// ---- state ------------------------------------------------------------------

interface Params {
  hz: number; hz2: number; two: boolean; mix: number;
  drive: number; dish: number; depth: number; damping: number; pin: number;
  lights: string; rotate: number; strobe: number; chaos: number; trails: number;
}
// The CymaScope cell of Sheldrake & Sheldrake (2017): 24.25 mm across, about
// 5.4 mm of water. In it the figures are clean; in a dish much wider the same
// frequencies give indistinct ones. The contact line slides freely by default,
// the setting that matches their measured symmetries best.
const P: Params = { hz: 82, hz2: 132, two: false, mix: 0.45, drive: 0.6, dish: 1.21, depth: 5.4, damping: 0.018, pin: 0, lights: "blue", rotate: 0.1, strobe: 0.5, chaos: 0.15, trails: 0.85 };

let modesA: Mode[] = [], modesB: Mode[] = [];
let selA: Selection = { modes: [], lead: null, rival: null };
let ampA = 1, ampB = 1;
const seedA = 1, seedB = 2;
function rebuild(): void {
  selA = selectModes(P.hz, P.dish / 100, P.depth / 1000, P.damping, P.pin, seedA);
  modesA = selA.modes;
  modesB = P.two ? selectModes(P.hz2, P.dish / 100, P.depth / 1000, P.damping, P.pin, seedB).modes : [];
  ampA = slopeNormaliser(modesA); ampB = slopeNormaliser(modesB);
}
rebuild();

// ---- audio: the drive tones ----------------------------------------------------

let ctx: AudioContext | null = null, master: GainNode | null = null;
let oscA: OscillatorNode | null = null, oscB: OscillatorNode | null = null, gainA: GainNode | null = null, gainB: GainNode | null = null;
let powered = false;
async function powerOn(): Promise<void> {
  ctx = await ensureAudio();
  if (ctx.state !== "running") await ctx.resume();
  if (!master) {
    master = ctx.createGain(); master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -12; comp.ratio.value = 3;
    master.connect(comp); comp.connect(ctx.destination);
    oscA = ctx.createOscillator(); gainA = ctx.createGain(); oscA.connect(gainA); gainA.connect(master); oscA.start();
    oscB = ctx.createOscillator(); gainB = ctx.createGain(); oscB.connect(gainB); gainB.connect(master); oscB.start();
  }
  powered = true; applyAudio();
  master.gain.setTargetAtTime(0.5, ctx.currentTime, 0.08);
  power.set(true);
}
function powerOff(): void {
  powered = false;
  if (master && ctx) master.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
  power.set(false);
  setTimeout(() => { if (!powered) suspendAudio(); }, 300);
}
function applyAudio(): void {
  if (!ctx || !oscA || !oscB || !gainA || !gainB) return;
  const t = ctx.currentTime;
  oscA.frequency.setTargetAtTime(P.hz, t, 0.02);
  oscB.frequency.setTargetAtTime(P.hz2, t, 0.02);
  gainA.gain.setTargetAtTime(P.drive * (P.two ? 1 - P.mix * 0.5 : 1), t, 0.03);
  gainB.gain.setTargetAtTime(P.two ? P.drive * P.mix : 0, t, 0.03);
}

// ---- DOM: the v1 chrome, then the rack's panels -----------------------------------

// The rack's stylesheet and this layout's rules (upstream injected both as
// <style> tags) live in src/app/(atlas)/cymatics-simulator/cymatics.css.
root.classList.add("inst-root");

const box = document.createElement("div"); box.className = "csim";
box.style.marginTop = "0";
const bar = document.createElement("div"); bar.className = "csim-bar";
const title = document.createElement("span"); title.className = "csim-title"; title.textContent = "Cymatics Simulator V2";
const status = document.createElement("span"); status.className = "csim-time"; status.textContent = "CODE-DRIVEN · WEBGL";
bar.append(title, status);
const stage = document.createElement("div"); stage.className = "cv2-stage";
const canvas = document.createElement("canvas");
const readout = document.createElement("div"); readout.className = "cv2-read";
const fullBtn = document.createElement("button"); fullBtn.type = "button"; fullBtn.className = "cv2-full"; fullBtn.textContent = "FULLSCREEN";
fullBtn.addEventListener("click", () => { if (document.fullscreenElement) document.exitFullscreen(); else stage.requestFullscreen?.(); });
stage.append(canvas, readout, fullBtn);

// the v1 key-frequency tabs
const PRESETS = [
  { hz: 66, hz2: 0, label: "66", sub: "" },
  { hz: 66, hz2: 98, label: "66", sub: "+ 98hz" },
  { hz: 82, hz2: 0, label: "82", sub: "" },
  { hz: 82, hz2: 132, label: "82", sub: "+ 132hz" },
  { hz: 102, hz2: 166, label: "102", sub: "+ 166hz" },
];
const tabs = document.createElement("div"); tabs.className = "csim-tabs cv2-tabs";
const tabEls = PRESETS.map((pr) => {
  const b = document.createElement("button"); b.type = "button"; b.className = "csim-tab";
  b.innerHTML = `<span class="hz">${pr.label}<i>hz</i></span>${pr.sub ? `<span class="sub">${pr.sub}</span>` : ""}`;
  b.addEventListener("click", () => { setParams({ hz: pr.hz, two: pr.hz2 > 0, hz2: pr.hz2 || P.hz2 }); refreshControls(); });
  tabs.append(b); return b;
});
box.append(bar, stage, tabs);
const layout = document.createElement("div"); layout.className = "cv2-layout";
layout.append(box);
root.append(layout);

// panels
const panels = document.createElement("div"); panels.className = "cv2-panels";
const drivePanel = panel("DRIVE · THE TONE UNDER THE DISH");
const drow = document.createElement("div"); drow.className = "cv2-row";
const power = powerButton(async (on) => { if (on) await powerOn(); else powerOff(); }, { on: "SOUND ON", off: "SOUND" });
const hzCtl = slider({ label: "FREQUENCY", min: 20, max: 200, step: 0.1, value: P.hz, format: (v) => `${v.toFixed(1)}Hz`, onInput: (v) => setParams({ hz: v }) });
hzCtl.el.style.cssText += ";flex:2 1 220px;min-width:200px";
const driveCtl = slider({ label: "DRIVE", min: 0, max: 1, step: 0.01, value: P.drive, format: pct, onInput: (v) => setParams({ drive: v }) });
driveCtl.el.style.cssText += ";flex:1 1 150px;min-width:140px";
drow.append(power.el, hzCtl.el, driveCtl.el);
const drow2 = document.createElement("div"); drow2.className = "cv2-row"; drow2.style.marginTop = "16px";
const twoSeg = segmented<string>({ label: "SECOND TONE", value: "off", options: [{ value: "off", label: "OFF" }, { value: "on", label: "ON" }], onChange: (v) => setParams({ two: v === "on" }) });
const hz2Ctl = slider({ label: "SECOND FREQUENCY", min: 20, max: 300, step: 0.1, value: P.hz2, format: (v) => `${v.toFixed(1)}Hz`, onInput: (v) => setParams({ hz2: v }) });
hz2Ctl.el.style.cssText += ";flex:2 1 220px;min-width:200px";
const mixCtl = slider({ label: "MIX", min: 0, max: 1, step: 0.01, value: P.mix, format: pct, onInput: (v) => setParams({ mix: v }) });
mixCtl.el.style.cssText += ";flex:1 1 150px;min-width:140px";
drow2.append(twoSeg.el, hz2Ctl.el, mixCtl.el);
drivePanel.body.append(drow, drow2);

const dishPanel = panel("THE DISH · WHAT PICKS THE FIGURE");
const dgrid = controlGrid(170);
const dishCtl = slider({ label: "DISH RADIUS", min: 0.5, max: 8, step: 0.01, value: P.dish, format: (v) => `${v.toFixed(1)}cm`, onInput: (v) => setParams({ dish: v }) });
const depthCtl = slider({ label: "WATER DEPTH", min: 2, max: 20, step: 0.1, value: P.depth, format: (v) => `${v.toFixed(1)}mm`, onInput: (v) => setParams({ depth: v }) });
const dampCtl = slider({ label: "DAMPING", min: 0.008, max: 0.1, step: 0.001, value: P.damping, format: (v) => `${(v * 100).toFixed(1)}%`, onInput: (v) => setParams({ damping: v }) });
const pinCtl = slider({ label: "CONTACT LINE · FREE → PINNED", min: 0, max: 1, step: 0.01, value: P.pin, format: pct, onInput: (v) => setParams({ pin: v }) });
const chaosCtl = slider({ label: "TURBULENCE", min: 0, max: 1, step: 0.01, value: P.chaos, format: pct, onInput: (v) => setParams({ chaos: v }) });
dgrid.append(dishCtl.el, depthCtl.el, dampCtl.el, pinCtl.el, chaosCtl.el);
const dishHint = document.createElement("p"); dishHint.className = "cv2-hint";
dishHint.textContent = "The water answers at half the drive frequency, and the figure is the dish mode whose own frequency sits nearest that — the wavelength from gravity, surface tension and depth, the shape from the wall. The camera blends both halves of the swing, so a mode of order m shows 2m petals. Whether the water's edge slides or sticks to the wall shifts which mode wins. Checked against measurements: Sheldrake & Sheldrake 2017 (3 of 5 symmetries, free edge) and Shao et al. 2021 (6 of 7 modes, pinned).";
dishPanel.body.append(dgrid, dishHint);

const lightPanel = panel("LIGHT · LED RINGS");
const lrow = document.createElement("div"); lrow.className = "cv2-row";
const lightSeg = segmented<string>({ label: "COLOUR", value: P.lights, options: Object.entries(PALETTES).map(([k, v]) => ({ value: k, label: v.name })), onChange: (v) => setParams({ lights: v }) });
const rotCtl = slider({ label: "ROTATE", min: 0, max: 1, step: 0.01, value: P.rotate, format: pct, onInput: (v) => setParams({ rotate: v }) });
rotCtl.el.style.cssText += ";flex:1 1 150px;min-width:140px";
const trailsCtl = slider({ label: "EXPOSURE", min: 0, max: 0.95, step: 0.01, value: P.trails, format: pct, onInput: (v) => setParams({ trails: v }) });
trailsCtl.el.style.cssText += ";flex:1 1 150px;min-width:140px";
const strobeCtl = slider({ label: "STROBE · BREATH", min: 0, max: 1.5, step: 0.01, value: P.strobe, format: (v) => `${v.toFixed(2)}×`, onInput: (v) => setParams({ strobe: v }) });
strobeCtl.el.style.cssText += ";flex:1 1 150px;min-width:140px";
lrow.append(lightSeg.el, rotCtl.el, trailsCtl.el, strobeCtl.el);
const lightHint = document.createElement("p"); lightHint.className = "cv2-hint";
lightHint.textContent = "Light gathers along the lines where the standing wave never moves — the spokes and rings of the figure — and the ring of LEDs round the lens throws a haze of reflections between them. The wave swings at half the drive frequency, faster than any shutter: EXPOSURE sets how much of that motion each frame keeps, STROBE the pace of the slow breathing the camera aliases it into. Tap the dish to drop a ripple.";
lightPanel.body.append(lrow, lightHint);

panels.append(drivePanel.el, dishPanel.el, lightPanel.el);
layout.append(panels);

function pct(v: number) { return `${Math.round(v * 100)}`; }

function setParams(patch: Partial<Params>): void {
  Object.assign(P, patch);
  if ("hz" in patch || "hz2" in patch || "two" in patch || "dish" in patch || "depth" in patch || "damping" in patch || "pin" in patch) rebuild();
  if (powered) applyAudio();
  refreshTabs();
}
function refreshControls(): void {
  hzCtl.set(P.hz); hz2Ctl.set(P.hz2); twoSeg.set(P.two ? "on" : "off"); mixCtl.set(P.mix); driveCtl.set(P.drive);
}
function refreshTabs(): void {
  tabEls.forEach((b, i) => {
    const pr = PRESETS[i];
    const on = Math.abs(P.hz - pr.hz) < 0.05 && (pr.hz2 > 0 ? P.two && Math.abs(P.hz2 - pr.hz2) < 0.05 : !P.two);
    b.classList.toggle("on", on);
  });
}

// ---- render loop -----------------------------------------------------------------

const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, premultipliedAlpha: false });
let raf = 0, visible = true, disposed = false;
if (!gl) {
  readout.textContent = "WEBGL2 NOT AVAILABLE";
} else {
  const renderer = createRenderer(gl);
  const ripples = [0, 0, -1, 0, 0, 0, -1, 0, 0, 0, -1, 0, 0, 0, -1, 0];
  let rippleIdx = 0;
  const t0 = performance.now();
  const now = () => (performance.now() - t0) / 1000;

  stage.addEventListener("pointerdown", (e) => {
    const r = canvas.getBoundingClientRect();
    const dpr = canvas.width / r.width;
    const rad = renderer.radius(canvas.width, canvas.height);
    const x = ((e.clientX - r.left) * dpr - canvas.width / 2) / rad, y = -(((e.clientY - r.top) * dpr) - canvas.height / 2) / rad;
    if (x * x + y * y > 1) return;
    ripples.splice(rippleIdx * 4, 4, x, y, now(), 0.9);
    rippleIdx = (rippleIdx + 1) % 4;
  });

  function frame(): void {
    if (disposed) return;
    raf = requestAnimationFrame(frame);
    if (!visible) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round(stage.clientWidth * dpr), h = Math.round(stage.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    const t = reduceMotion() ? 0 : now();
    renderer.frame(w, h, t, {
      modesA, modesB, ampA, ampB,
      mixB: P.two ? P.mix : 0, ratioB: P.hz2 / P.hz,
      drive: P.drive, strobe: P.strobe, chaos: P.chaos, spin: P.rotate * 0.15,
      trails: P.trails, hue: PALETTES[P.lights].hue, ripples,
    });
    const ld = selA.lead, rv = selA.rival;
    const fold = (m: number) => (m === 0 ? "RINGS" : `${2 * m}-FOLD`);
    readout.textContent = `${P.hz.toFixed(1)} HZ${P.two ? ` + ${P.hz2.toFixed(1)} HZ` : ""}  ·  ${ld ? `${fold(ld.m)} (m ${ld.m}, n ${ld.n})` : "NO STABLE FIGURE"}${rv ? `  ·  OR ${fold(rv.m)}` : ""}  ·  λ ${(TAU / dispersionK(TAU * P.hz / 2, P.depth / 1000) * 1000).toFixed(1)} MM`;
  }
  raf = requestAnimationFrame(frame);
  const io = new IntersectionObserver((es) => { visible = es[0]?.isIntersecting ?? true; }, { threshold: 0.01 });
  io.observe(stage);
}

refreshTabs();

return () => {
  disposed = true;
  cancelAnimationFrame(raf);
  if (powered) powerOff();
};
}
