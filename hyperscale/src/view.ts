import { Game } from "./game";
import { BUILDS, BUILD_ORDER, GRID_COLS, GRID_ROWS, SPEEDS, type Kind } from "./config";

type Tool = Kind | "demolish" | null;

const fmtK = (n: number) => {
  const r = Math.round(n);
  return Math.abs(r) >= 1000 ? `${(r / 1000).toFixed(r % 1000 === 0 ? 0 : 1)}M` : `${r}`;
};
const sign = (n: number) => (n >= 0 ? "+" : "−");

export function boot(root: HTMLElement) {
  const startSeed = readSeedFromUrl() || randomSeed();
  const game = new Game(startSeed);
  let tool: Tool = "rack";
  let timer: number | null = null;

  root.innerHTML = `
    <div class="wrap">
      <header class="head">
        <h1 class="title">Hyperscale</h1>
        <p class="intro">Run an AI data center. Lay racks, substations and cooling on the floor, then keep four things in balance — <b>power</b>, <b>heat</b>, <b>compute</b> and <b>cash</b> — while demand for compute climbs day after day. Underfeed power or fall behind on cooling and machines throttle, then fail.</p>
      </header>

      <section class="hud" id="hud"></section>

      <section class="bar">
        <button class="btn play" id="play"></button>
        <div class="seg" id="speed"></div>
        <div class="grow"></div>
        <label class="ctl seedctl"><span>Seed</span>
          <input id="seed" class="seedin" value="${game.seed}" spellcheck="false" />
        </label>
        <button class="btn" id="newrun">New run</button>
      </section>

      <section class="stage">
        <aside class="palette" id="palette"></aside>
        <div class="floorwrap">
          <div class="floor" id="floor"></div>
          <p class="tip" id="tip"></p>
          <div class="over" id="over" hidden></div>
        </div>
      </section>

      <section class="feed">
        <div class="lbl">Operations feed</div>
        <ul class="log" id="log"></ul>
      </section>

      <section class="about">
        <div class="lbl">About this build</div>
        <p>Hyperscale is a small, seeded management sim about the physical reality behind the compute boom. Substations supply megawatts; racks and GPU pods turn power into compute and heat; cooling units pull the heat back out. Sell as much compute as the market wants — but every machine you starve of power or cooling degrades, and a dark machine earns nothing until you repair it. Same seed, same run: events, demand and faults all replay identically.</p>
      </section>
    </div>
  `;

  const $ = <T extends HTMLElement = HTMLElement>(id: string) => root.querySelector<T>(`#${id}`)!;
  const hud = $("hud"), palette = $("palette"), floor = $("floor"), log = $("log");
  const playBtn = $<HTMLButtonElement>("play"), speedSeg = $("speed"), tip = $("tip");
  const seedIn = $<HTMLInputElement>("seed"), over = $("over");

  // ---- speed segmented control ----
  speedSeg.innerHTML = SPEEDS.map((s, i) => `<button class="seg-b${i === game.speed ? " on" : ""}" data-s="${i}">${s.label}</button>`).join("");
  speedSeg.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>("[data-s]");
    if (!b) return;
    game.speed = Number(b.dataset.s);
    speedSeg.querySelectorAll(".seg-b").forEach((el, i) => el.classList.toggle("on", i === game.speed));
    if (game.running) schedule();
  });

  // ---- palette ----
  function renderPalette() {
    const items = BUILD_ORDER.map((k) => {
      const d = BUILDS[k];
      const on = tool === k ? " on" : "";
      const poor = game.canAfford(k) ? "" : " poor";
      const stat =
        k === "power" ? `+${d.capacity} MW` :
        k === "cool" ? `−${d.cooling} heat` :
        `+${d.compute} CU · ${d.draw} MW`;
      return `<button class="pal${on}${poor}" data-k="${k}">
        <span class="pg">${d.glyph}</span>
        <span class="pn">${d.short}</span>
        <span class="pc">$${d.cost}k</span>
        <span class="ps">${stat}</span>
      </button>`;
    }).join("");
    const demo = `<button class="pal demo${tool === "demolish" ? " on" : ""}" data-k="demolish">
      <span class="pg">⌫</span><span class="pn">Demolish</span><span class="pc">refund</span>
      <span class="ps">sell a tile back</span></button>`;
    palette.innerHTML = items + demo;
  }
  palette.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>("[data-k]");
    if (!b) return;
    tool = b.dataset.k as Tool;
    renderPalette();
    render();
  });

  // ---- floor grid ----
  floor.style.gridTemplateColumns = `repeat(${GRID_COLS}, 1fr)`;
  for (let i = 0; i < GRID_COLS * GRID_ROWS; i++) {
    const cell = document.createElement("button");
    cell.className = "cell";
    cell.dataset.i = String(i);
    cell.innerHTML = `<span class="g"></span><i class="hp"></i>`;
    floor.appendChild(cell);
  }
  floor.addEventListener("click", (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>(".cell");
    if (!el || game.over) return;
    const i = Number(el.dataset.i);
    const c = game.grid[i];
    if (tool === "demolish") game.demolish(i);
    else if (tool && c.kind === null) game.place(i, tool);
    else if (c.kind && c.integrity <= 0) game.repair(i);
    else if (tool && c.kind) { /* occupied — ignore */ }
    render();
  });
  floor.addEventListener("contextmenu", (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>(".cell");
    if (!el) return;
    e.preventDefault();
    if (game.over) return;
    game.demolish(Number(el.dataset.i));
    render();
  });

  // ---- controls ----
  playBtn.addEventListener("click", () => {
    if (game.over) return;
    game.running = !game.running;
    if (game.running) schedule(); else stop();
    render();
  });
  $("newrun").addEventListener("click", () => newRun(seedIn.value.trim() || randomSeed()));
  seedIn.addEventListener("keydown", (e) => {
    if ((e as KeyboardEvent).key === "Enter") newRun(seedIn.value.trim() || randomSeed());
  });

  function newRun(seed: string) {
    stop();
    game.reset(seed);
    tool = "rack";
    seedIn.value = seed;
    try { history.replaceState(null, "", `?seed=${encodeURIComponent(seed)}`); } catch { /* sandboxed */ }
    renderPalette();
    render();
  }

  // keyboard: space toggles, 1-4 pick tools
  window.addEventListener("keydown", (e) => {
    if ((e.target as HTMLElement)?.tagName === "INPUT") return;
    if (e.key === " ") { e.preventDefault(); playBtn.click(); }
    else if (e.key >= "1" && e.key <= "4") { tool = BUILD_ORDER[Number(e.key) - 1]; renderPalette(); render(); }
    else if (e.key.toLowerCase() === "x") { tool = "demolish"; renderPalette(); render(); }
  });

  // ---- loop ----
  function schedule() {
    stop();
    timer = window.setTimeout(function tick() {
      game.step();
      render();
      if (game.running && !game.over) timer = window.setTimeout(tick, SPEEDS[game.speed].ms);
      else stop();
    }, SPEEDS[game.speed].ms);
  }
  function stop() { if (timer !== null) { clearTimeout(timer); timer = null; } }

  // ---- render ----
  function render() {
    const m = game.metrics();

    // play button
    playBtn.textContent = game.over ? "Game over" : game.running ? "❚❚ Pause" : "▶ Play";
    playBtn.classList.toggle("on", game.running && !game.over);
    playBtn.disabled = game.over;

    // HUD
    const profitTone = m.profit >= 0 ? "good" : "bad";
    const profitSub = `<span class="s-${profitTone}">${sign(m.profit)}$${fmtK(Math.abs(m.profit))}k</span> / day`;
    hud.innerHTML = [
      card("Cash", `$${fmtK(game.cash)}k`, profitSub, game.cash < 0 ? "bad" : "good", 0),
      card("Power", `${m.draw.toFixed(1)}`, `of ${m.capacity.toFixed(0)} MW`,
        m.powerRatio < 0.999 ? "bad" : m.draw / Math.max(m.capacity, 1) > 0.85 ? "warn" : "good",
        m.capacity > 0 ? m.draw / m.capacity : (m.draw > 0 ? 1 : 0)),
      card("Heat", `${m.heatGen.toFixed(0)}`, `cooling ${m.coolCap.toFixed(0)}`,
        m.heatRatio < 0.999 ? "bad" : m.heatGen / Math.max(m.coolCap, 1) > 0.85 ? "warn" : "good",
        m.coolCap > 0 ? m.heatGen / m.coolCap : (m.heatGen > 0 ? 1 : 0)),
      card("Compute", `${m.delivered.toFixed(0)}`, `${m.healthyCompute.toFixed(0)} CU online`,
        "accent", m.totalCompute > 0 ? m.delivered / Math.max(m.demand, m.totalCompute) : 0),
      card("Demand", `${m.demand.toFixed(0)}`, `CU wanted today`, "neutral",
        m.healthyCompute > 0 ? Math.min(1, m.demand / m.healthyCompute) : 1),
      card("Day", `${game.day}`, `${fmtK(game.served)} CU served`, "neutral", 0, true),
    ].join("");

    // floor
    const stressed = m.deliverFactor < 0.985;
    floor.classList.toggle("hot", m.heatRatio < 0.999);
    floor.classList.toggle("brown", m.powerRatio < 0.999);
    const cells = floor.children;
    for (let i = 0; i < game.grid.length; i++) {
      const c = game.grid[i];
      const el = cells[i] as HTMLElement;
      const g = el.querySelector(".g")!;
      const hp = el.querySelector<HTMLElement>(".hp")!;
      const isMachine = c.kind === "rack" || c.kind === "pod";
      let cls = "cell";
      if (c.kind) {
        cls += ` k-${c.kind}`;
        g.textContent = BUILDS[c.kind].glyph;
        if (isMachine) {
          if (c.integrity <= 0) cls += " failed";
          else if (c.integrity < 40) cls += " warn";
          else { cls += " ok"; if (stressed && game.running) cls += " strain"; }
          hp.style.width = `${Math.max(0, c.integrity)}%`;
          hp.hidden = false;
        } else { hp.hidden = true; }
      } else {
        g.textContent = "";
        hp.hidden = true;
        if (tool && tool !== "demolish") cls += " placeable";
      }
      el.className = cls;
    }

    // tip
    tip.innerHTML = game.over ? "" : tipFor(tool, m);

    // palette affordability
    palette.querySelectorAll<HTMLElement>("[data-k]").forEach((b) => {
      const k = b.dataset.k as Tool;
      if (k && k !== "demolish") b.classList.toggle("poor", !game.canAfford(k as Kind));
    });

    // log
    log.innerHTML = game.log.slice(0, 28).map((e) =>
      `<li class="le ${e.tone}"><span class="ld">D${e.day}</span><span>${e.text}</span></li>`).join("");

    // game over panel
    if (game.over) {
      over.hidden = false;
      over.innerHTML = `
        <div class="overcard">
          <div class="lbl bad">Game over · day ${game.day}</div>
          <p class="oreason">${game.overReason}</p>
          <div class="ostats">
            ${ostat("Days run", String(game.day))}
            ${ostat("Compute served", `${fmtK(game.served)} CU`)}
            ${ostat("Peak online", `${game.peakCompute.toFixed(0)} CU`)}
            ${ostat("Peak load", `${game.peakMW.toFixed(1)} MW`)}
            ${ostat("Peak cash", `$${fmtK(game.peakCash)}k`)}
          </div>
          <button class="btn on" id="again">New run →</button>
        </div>`;
      over.querySelector("#again")!.addEventListener("click", () => newRun(randomSeed()));
    } else {
      over.hidden = true;
      over.innerHTML = "";
    }
  }

  renderPalette();
  render();
}

// ---- small render helpers ----
function card(label: string, value: string, sub: string, tone: string, fill: number, noBar = false) {
  const bar = noBar ? "" : `<div class="cbar"><i class="t-${tone}" style="width:${Math.min(100, Math.max(0, fill * 100)).toFixed(0)}%"></i></div>`;
  return `<div class="kc t-${tone}">
    <div class="kl">${label}</div>
    <div class="kv">${value}</div>
    <div class="ksub">${sub}</div>
    ${bar}
  </div>`;
}
function ostat(l: string, v: string) {
  return `<div class="os"><span>${l}</span><b>${v}</b></div>`;
}
function tipFor(tool: Tool, m: { powerRatio: number; heatRatio: number; failed: number }): string {
  if (m.failed > 0) return `<b class="bad">${m.failed} machine${m.failed > 1 ? "s" : ""} down.</b> Click a dark tile to repair it.`;
  if (m.powerRatio < 0.999) return `<b class="bad">Brownout.</b> Power draw exceeds capacity — add a Substation or the floor throttles.`;
  if (m.heatRatio < 0.999) return `<b class="bad">Overheating.</b> Cooling can't keep up — add a Cooling Unit before machines degrade.`;
  if (tool === "demolish") return `<b>Demolish:</b> click a tile to sell it back. (Right-click any tile works too.)`;
  if (tool) return `<b>${BUILDS[tool as Kind].name}:</b> ${BUILDS[tool as Kind].blurb} — click an empty tile to place.`;
  return `Pick something from the palette, then click the floor. Keys: <b>1–4</b> tools · <b>X</b> demolish · <b>space</b> play.`;
}

// ---- seed helpers ----
function readSeedFromUrl(): string | null {
  try { return new URLSearchParams(location.search).get("seed"); } catch { return null; }
}
function randomSeed(): string {
  const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const buf = new Uint32Array(6);
  crypto.getRandomValues(buf);
  let s = "";
  for (let i = 0; i < 6; i++) s += a[buf[i] % a.length];
  return s;
}
