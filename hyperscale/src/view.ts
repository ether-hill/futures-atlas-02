import { Game, type Metrics } from "./game";
import { World } from "./world";
import { BUILDS, BUILD_ORDER, SPEEDS, type Kind } from "./config";
import type { BStatus } from "./buildings";

type Tool = Kind | "demolish" | null;

const fmtK = (n: number) => {
  const r = Math.round(n);
  return Math.abs(r) >= 1000 ? `${(r / 1000).toFixed(r % 1000 === 0 ? 0 : 1)}M` : `${r}`;
};
const sign = (n: number) => (n >= 0 ? "+" : "−");
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export function boot(root: HTMLElement) {
  const startSeed = readSeedFromUrl() || randomSeed();
  const game = new Game(startSeed);
  let tool: Tool = "rack";

  root.innerHTML = `
    <div class="scene" id="scene"></div>
    <div class="ui">
      <div class="topleft">
        <div class="brand">Hyperscale</div>
        <div class="sub">Data-center builder</div>
      </div>
      <section class="hud" id="hud"></section>

      <div class="feedwrap">
        <button class="feedtoggle" id="feedtoggle">Feed</button>
        <ul class="log" id="log"></ul>
      </div>

      <div class="dock">
        <div class="palette" id="palette"></div>
        <div class="transport">
          <button class="btn play" id="play"></button>
          <div class="seg" id="speed"></div>
          <label class="seedctl"><span>Seed</span><input id="seed" class="seedin" value="${game.seed}" spellcheck="false" /></label>
          <button class="btn" id="newrun">New run</button>
        </div>
      </div>

      <p class="tip" id="tip"></p>
      <div class="over" id="over" hidden></div>
    </div>
  `;

  const $ = <T extends HTMLElement = HTMLElement>(id: string) => root.querySelector<T>(`#${id}`)!;
  const sceneEl = $("scene");
  const hud = $("hud"), palette = $("palette"), log = $("log"), tip = $("tip"), over = $("over");
  const playBtn = $<HTMLButtonElement>("play"), speedSeg = $("speed"), seedIn = $<HTMLInputElement>("seed");

  const world = new World(sceneEl);
  const canvas = world.renderer.domElement;
  let m: Metrics = game.metrics();

  // ── speed control ──
  speedSeg.innerHTML = SPEEDS.map((s, i) => `<button class="seg-b${i === game.speed ? " on" : ""}" data-s="${i}">${s.label}</button>`).join("");
  speedSeg.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>("[data-s]");
    if (!b) return;
    game.speed = Number(b.dataset.s);
    speedSeg.querySelectorAll(".seg-b").forEach((el, i) => el.classList.toggle("on", i === game.speed));
  });

  // ── palette ──
  function renderPalette() {
    const items = BUILD_ORDER.map((k) => {
      const d = BUILDS[k];
      const stat = k === "power" ? `+${d.capacity} MW` : k === "cool" ? `−${d.cooling} heat` : `+${d.compute} CU`;
      return `<button class="pal${tool === k ? " on" : ""}${game.canAfford(k) ? "" : " poor"}" data-k="${k}">
        <span class="pg">${d.glyph}</span><span class="pn">${d.short}</span>
        <span class="pc">$${d.cost}k</span><span class="ps">${stat}</span></button>`;
    }).join("");
    palette.innerHTML = items +
      `<button class="pal demo${tool === "demolish" ? " on" : ""}" data-k="demolish"><span class="pg">⌫</span><span class="pn">Demolish</span><span class="pc">refund</span><span class="ps">sell back</span></button>`;
  }
  palette.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>("[data-k]");
    if (!b) return;
    tool = b.dataset.k as Tool;
    renderPalette();
    renderTip();
  });

  // ── feed toggle ──
  let feedOpen = true;
  $("feedtoggle").addEventListener("click", () => {
    feedOpen = !feedOpen;
    root.querySelector(".feedwrap")!.classList.toggle("closed", !feedOpen);
  });

  // ── transport ──
  playBtn.addEventListener("click", () => { if (!game.over) game.running = !game.running; renderHud(); });
  $("newrun").addEventListener("click", () => newRun(seedIn.value.trim() || randomSeed()));
  seedIn.addEventListener("keydown", (e) => { if ((e as KeyboardEvent).key === "Enter") newRun(seedIn.value.trim() || randomSeed()); });

  function newRun(seed: string) {
    // clear all 3D buildings
    for (let i = 0; i < game.grid.length; i++) if (world.has(i)) world.remove(i);
    game.reset(seed);
    tool = "rack";
    seedIn.value = seed;
    try { history.replaceState(null, "", `?seed=${encodeURIComponent(seed)}`); } catch { /* sandboxed */ }
    m = game.metrics();
    renderPalette(); renderAll();
  }

  // ── pointer: orbit vs click, ghost preview ──
  let downX = 0, downY = 0, downT = 0, moved = false;
  const ndc = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1] as const;
  };
  canvas.addEventListener("pointerdown", (e) => { downX = e.clientX; downY = e.clientY; downT = performance.now(); moved = false; });
  canvas.addEventListener("pointermove", (e) => {
    if (e.buttons && (Math.abs(e.clientX - downX) > 4 || Math.abs(e.clientY - downY) > 4)) moved = true;
    updateGhost(e);
  });
  canvas.addEventListener("pointerleave", () => world.clearGhost());
  canvas.addEventListener("pointerup", (e) => {
    if (moved || performance.now() - downT > 400) return; // was an orbit drag
    const [x, y] = ndc(e);
    const i = world.raycast(x, y);
    if (i == null || game.over) return;
    const c = game.grid[i];
    if (tool === "demolish") { if (c.kind) { world.remove(i); game.demolish(i); } }
    else if (tool && c.kind === null) { if (game.place(i, tool)) world.add(i, tool); }
    else if (c.kind && c.integrity <= 0) game.repair(i);
    m = game.metrics();
    syncStates(); renderHud(); renderTip(); renderPalette(); updateGhost(e);
  });

  function updateGhost(e: PointerEvent) {
    const [x, y] = ndc(e);
    const i = world.raycast(x, y);
    if (i == null || game.over) { world.clearGhost(); return; }
    const c = game.grid[i];
    if (tool && tool !== "demolish" && c.kind === null) world.showGhost(i, tool, game.canAfford(tool));
    else if (tool === "demolish" && c.kind) world.showHover(i, 0xff4d4d);
    else if (c.kind && c.integrity <= 0) world.showHover(i, 0xffb02e);
    else world.clearGhost();
  }

  // keyboard
  window.addEventListener("keydown", (e) => {
    if ((e.target as HTMLElement)?.tagName === "INPUT") return;
    if (e.key === " ") { e.preventDefault(); playBtn.click(); }
    else if (e.key >= "1" && e.key <= "4") { tool = BUILD_ORDER[Number(e.key) - 1]; renderPalette(); renderTip(); }
    else if (e.key.toLowerCase() === "x") { tool = "demolish"; renderPalette(); renderTip(); }
  });

  // ── sync 3D building visuals from sim state ──
  function syncStates() {
    const running = game.running;
    for (let i = 0; i < game.grid.length; i++) {
      const c = game.grid[i];
      if (!c.kind || !world.has(i)) continue;
      let status: BStatus = "ok";
      let load = 0.15;
      if (c.kind === "rack" || c.kind === "pod") {
        if (c.integrity <= 0) status = "failed";
        else if (c.integrity < 40 || (running && m.deliverFactor < 0.9)) status = "warn";
        load = running ? clamp01(m.util * (m.deliverFactor || 1)) : 0.12;
      } else if (c.kind === "cool") {
        load = m.coolCap > 0 ? clamp01(m.heatGen / m.coolCap) : (running ? 0.3 : 0.15);
      } else if (c.kind === "power") {
        load = m.capacity > 0 ? clamp01(m.draw / m.capacity) : 0.2;
      }
      world.setState(i, status, load);
    }
  }

  // ── HUD render ──
  function renderHud() {
    playBtn.textContent = game.over ? "Game over" : game.running ? "❚❚ Pause" : "▶ Play";
    playBtn.classList.toggle("on", game.running && !game.over);
    playBtn.disabled = game.over;

    const profitTone = m.profit >= 0 ? "good" : "bad";
    const profitSub = `<span class="s-${profitTone}">${sign(m.profit)}$${fmtK(Math.abs(m.profit))}k</span>/day`;
    hud.innerHTML = [
      card("Cash", `$${fmtK(game.cash)}k`, profitSub, game.cash < 0 ? "bad" : "good", 0),
      card("Power", m.draw.toFixed(1), `of ${m.capacity.toFixed(0)} MW`, m.powerRatio < 0.999 ? "bad" : m.draw / Math.max(m.capacity, 1) > 0.85 ? "warn" : "good", m.capacity > 0 ? m.draw / m.capacity : (m.draw > 0 ? 1 : 0)),
      card("Heat", m.heatGen.toFixed(0), `cooling ${m.coolCap.toFixed(0)}`, m.heatRatio < 0.999 ? "bad" : m.heatGen / Math.max(m.coolCap, 1) > 0.85 ? "warn" : "good", m.coolCap > 0 ? m.heatGen / m.coolCap : (m.heatGen > 0 ? 1 : 0)),
      card("Compute", m.delivered.toFixed(0), `${m.healthyCompute.toFixed(0)} CU online`, "accent", m.totalCompute > 0 ? m.delivered / Math.max(m.demand, m.totalCompute) : 0),
      card("Demand", m.demand.toFixed(0), `CU wanted`, "neutral", m.healthyCompute > 0 ? Math.min(1, m.demand / m.healthyCompute) : 1),
      card("Day", `${game.day}`, `${fmtK(game.served)} CU served`, "neutral", 0, true),
    ].join("");

    log.innerHTML = game.log.slice(0, 30).map((e) => `<li class="le ${e.tone}"><span class="ld">D${e.day}</span><span>${e.text}</span></li>`).join("");
    renderOver();
  }

  function renderTip() {
    if (game.over) { tip.innerHTML = ""; return; }
    if (m.failed > 0) tip.innerHTML = `<b class="bad">${m.failed} machine${m.failed > 1 ? "s" : ""} down.</b> Click a dark building to repair it.`;
    else if (m.powerRatio < 0.999) tip.innerHTML = `<b class="bad">Brownout.</b> Power draw exceeds capacity — add a Substation.`;
    else if (m.heatRatio < 0.999) tip.innerHTML = `<b class="bad">Overheating.</b> Add a Cooling Tower before machines degrade.`;
    else if (tool === "demolish") tip.innerHTML = `<b>Demolish</b> — click a building to sell it back. Drag to orbit · scroll to zoom.`;
    else if (tool) tip.innerHTML = `<b>${BUILDS[tool as Kind].name}</b> — ${BUILDS[tool as Kind].blurb} Click an empty tile. Drag to orbit.`;
    else tip.innerHTML = `Pick a building, then click the plot. Drag to orbit · scroll to zoom · keys 1–4 / X / space.`;
  }

  function renderOver() {
    if (!game.over) { over.hidden = true; over.innerHTML = ""; return; }
    over.hidden = false;
    over.innerHTML = `<div class="overcard">
      <div class="lbl bad">Game over · day ${game.day}</div>
      <p class="oreason">${game.overReason}</p>
      <div class="ostats">
        ${ostat("Days run", String(game.day))}${ostat("Compute served", `${fmtK(game.served)} CU`)}
        ${ostat("Peak online", `${game.peakCompute.toFixed(0)} CU`)}${ostat("Peak load", `${game.peakMW.toFixed(1)} MW`)}
        ${ostat("Peak cash", `$${fmtK(game.peakCash)}k`)}
      </div>
      <button class="btn on" id="again">New run →</button></div>`;
    over.querySelector("#again")!.addEventListener("click", () => newRun(randomSeed()));
  }

  function renderAll() { syncStates(); renderHud(); renderTip(); }

  // ── main loop: animate every frame, step the sim on its own cadence ──
  let last = performance.now();
  let stepAcc = 0;
  function frame(now: number) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (game.running && !game.over) {
      stepAcc += dt * 1000;
      const ms = SPEEDS[game.speed].ms;
      let steps = 0;
      while (stepAcc >= ms && steps < 4) {
        stepAcc -= ms; steps++;
        game.step();
        m = game.metrics();
        syncStates(); renderHud(); renderTip(); renderPalette();
        if (game.over) break;
      }
    }
    world.update(dt, now / 1000);
    requestAnimationFrame(frame);
  }

  renderPalette();
  renderAll();
  requestAnimationFrame(frame);
}

// ── small render helpers ──
function card(label: string, value: string, sub: string, tone: string, fill: number, noBar = false) {
  const bar = noBar ? "" : `<div class="cbar"><i class="t-${tone}" style="width:${clamp01(fill) * 100}%"></i></div>`;
  return `<div class="kc t-${tone}"><div class="kl">${label}</div><div class="kv">${value}</div><div class="ksub">${sub}</div>${bar}</div>`;
}
function ostat(l: string, v: string) { return `<div class="os"><span>${l}</span><b>${v}</b></div>`; }

function readSeedFromUrl(): string | null { try { return new URLSearchParams(location.search).get("seed"); } catch { return null; } }
function randomSeed(): string {
  const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const buf = new Uint32Array(6);
  crypto.getRandomValues(buf);
  let s = "";
  for (let i = 0; i < 6; i++) s += a[buf[i] % a.length];
  return s;
}
