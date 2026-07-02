/**
 * All DOM: HUD meters, build bar, contracts desk, toasts, selection card and
 * the intro / ending overlays. Pure presentation — reads Sim, emits callbacks.
 */

import { BUILD_ORDER, DEFS, VICTORY_IT_MW, fmtMoney, type BuildingDef, type DefId } from "./defs";
import type { Contract, Offer, Sim, Unit } from "./sim";

export type Tool = { kind: "build"; def: DefId } | { kind: "demolish" } | null;

export interface UICallbacks {
  onTool(tool: Tool): void;
  onSpeed(s: number): void;
  onAccept(id: number): void;
  onDecline(id: number): void;
  onSell(unitId: number): void;
  onStart(seed: string): void;
  onMute(): boolean; // returns the new muted state
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  cls?: string,
  html?: string,
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
}

function defStat(D: BuildingDef): string {
  if (D.gridMW) return `+${D.gridMW} MW grid import`;
  if (D.solarMW) return `+${D.solarMW} MW peak · day only`;
  if (D.windMW) return `${D.windMW} MW rated · clean`;
  if (D.gasMW) return `+${D.gasMW} MW · $${D.fuelPerMWh}/MWh · smog`;
  if (D.storeMWh) return `${D.storeMWh} MWh · ±${D.rateMW} MW`;
  if (D.itMW) return `${D.itMW} MW → ${D.pf} PF`;
  if (D.coolMW) return `${D.coolMW} MW cooling · ${D.waterMLpd ? "water" : "fans"}`;
  return "";
}

function aqiLabel(smog: number): string {
  if (smog < 0.12) return "clear";
  if (smog < 0.3) return "hazy";
  if (smog < 0.55) return "poor";
  return "hazardous";
}

interface Meter {
  fill: HTMLElement;
  text: HTMLElement;
  row: HTMLElement;
}

export class UI {
  private cb: UICallbacks;
  private root: HTMLElement;
  private cash!: HTMLElement;
  private net!: HTMLElement;
  private clock!: HTMLElement;
  private temp!: HTMLElement;
  private eventChip!: HTMLElement;
  private goal!: HTMLElement;
  private meters: Record<string, Meter> = {};
  private prices!: HTMLElement;
  private cards = new Map<string, HTMLElement>();
  private speedBtns: HTMLElement[] = [];
  private contractsBody!: HTMLElement;
  private toastBox!: HTMLElement;
  private selCard!: HTMLElement;
  private overlay!: HTMLElement;
  private muteBtn!: HTMLElement;
  private contractsSig = "";

  constructor(root: HTMLElement, cb: UICallbacks) {
    this.root = root;
    this.cb = cb;
    this.buildHud();
    this.buildBar();
    this.buildContracts();
    this.toastBox = el("div", "gw-toasts");
    root.append(this.toastBox);
    this.selCard = el("div", "gw-selcard gw-panel");
    this.selCard.style.display = "none";
    root.append(this.selCard);
    this.overlay = el("div", "gw-overlay");
    root.append(this.overlay);
  }

  // --- construction -------------------------------------------------------

  private buildHud(): void {
    const hud = el("div", "gw-hud gw-panel");
    const cashRow = el("div", "gw-cashrow");
    this.cash = el("div", "gw-cash", "$60.0M");
    this.net = el("div", "gw-net", "");
    const mute = el("button", "gw-mute", "🔊");
    mute.title = "toggle sound";
    mute.addEventListener("click", () => {
      mute.textContent = this.cb.onMute() ? "🔇" : "🔊";
    });
    this.muteBtn = mute;
    cashRow.append(this.cash, this.net, mute);
    hud.append(cashRow);

    const timeRow = el("div", "gw-timerow");
    this.clock = el("div", "gw-clock", "DAY 0 · 08:00");
    this.temp = el("div", "gw-temp", "22 °C");
    timeRow.append(this.clock, this.temp);
    hud.append(timeRow);

    const speeds = el("div", "gw-speeds");
    const labels = ["⏸", "1×", "4×", "12×"];
    [0, 1, 4, 12].forEach((s, i) => {
      const b = el("button", "gw-speed" + (s === 1 ? " is-on" : ""), labels[i]);
      b.addEventListener("click", () => this.cb.onSpeed(s));
      speeds.append(b);
      this.speedBtns.push(b);
    });
    hud.append(speeds);

    this.eventChip = el("div", "gw-event");
    this.eventChip.style.display = "none";
    hud.append(this.eventChip);
    this.goal = el("div", "gw-goal");
    hud.append(this.goal);
    this.root.append(hud);

    const kpis = el("div", "gw-kpis gw-panel");
    for (const [key, label] of [
      ["power", "POWER"],
      ["heat", "HEAT"],
      ["water", "WATER"],
      ["compute", "COMPUTE"],
      ["air", "AIR"],
      ["town", "TOWN"],
    ] as const) {
      const row = el("div", "gw-meter");
      const head = el("div", "gw-meter__head");
      head.append(el("span", "gw-meter__label", label));
      const text = el("span", "gw-meter__value", "—");
      head.append(text);
      const track = el("div", "gw-meter__track");
      const fill = el("div", "gw-meter__fill");
      track.append(fill);
      row.append(head, track);
      kpis.append(row);
      this.meters[key] = { fill, text, row };
    }
    this.prices = el("div", "gw-prices", "");
    kpis.append(this.prices);
    this.root.append(kpis);
  }

  private buildBar(): void {
    const bar = el("div", "gw-buildbar");
    BUILD_ORDER.forEach((id, i) => {
      const D = DEFS[id];
      const card = el("button", "gw-card");
      card.append(el("div", "gw-card__key", String(i + 1)));
      card.append(el("div", "gw-card__name", D.short));
      card.append(el("div", "gw-card__stat", defStat(D)));
      card.append(el("div", "gw-card__cost", fmtMoney(D.cost)));
      card.title = D.blurb;
      card.addEventListener("click", () => this.cb.onTool({ kind: "build", def: id }));
      bar.append(card);
      this.cards.set(id, card);
    });
    const demo = el("button", "gw-card gw-card--demo");
    demo.append(el("div", "gw-card__key", "X"));
    demo.append(el("div", "gw-card__name", "DEMOLISH"));
    demo.append(el("div", "gw-card__stat", "sell back 50 %"));
    demo.addEventListener("click", () => this.cb.onTool({ kind: "demolish" }));
    bar.append(demo);
    this.cards.set("demolish", demo);
    this.root.append(bar);
  }

  private buildContracts(): void {
    const panel = el("div", "gw-contracts gw-panel");
    panel.append(el("div", "gw-contracts__title", "CONTRACT DESK"));
    this.contractsBody = el("div", "gw-contracts__body");
    panel.append(this.contractsBody);
    this.root.append(panel);
  }

  // --- live updates ---------------------------------------------------------

  setTool(tool: Tool): void {
    for (const [k, c] of this.cards) {
      const on =
        (tool?.kind === "build" && k === tool.def) || (tool?.kind === "demolish" && k === "demolish");
      c.classList.toggle("is-armed", on);
    }
  }

  setSpeed(s: number): void {
    const idx = [0, 1, 4, 12].indexOf(s);
    this.speedBtns.forEach((b, i) => b.classList.toggle("is-on", i === idx));
  }

  update(sim: Sim): void {
    const r = sim.readout;
    this.cash.textContent = fmtMoney(sim.cash);
    this.cash.classList.toggle("is-bad", sim.cash < 0);
    const net = r.netPerDay;
    this.net.textContent = `${net >= 0 ? "+" : ""}${fmtMoney(net)}/day`;
    this.net.className = "gw-net " + (net >= 0 ? "is-good" : "is-bad");

    const h = sim.hourOfDay();
    const hh = String(Math.floor(h)).padStart(2, "0");
    const mm = String(Math.floor((h % 1) * 60)).padStart(2, "0");
    this.clock.textContent = `DAY ${sim.day()} · ${hh}:${mm}`;
    this.temp.textContent = `${r.tempC.toFixed(0)} °C`;
    this.temp.classList.toggle("is-bad", r.tempC >= 38);

    if (sim.event) {
      this.eventChip.style.display = "";
      const left = (sim.event.endsH - sim.timeH) / 24;
      this.eventChip.textContent = `⚠ ${sim.event.name} — ${left > 1 ? `${left.toFixed(1)} d` : `${Math.max(1, Math.round(left * 24))} h`} left`;
    } else {
      this.eventChip.style.display = "none";
    }
    this.goal.textContent = `IT load ${r.itInstalledMW.toFixed(0)} / ${VICTORY_IT_MW} MW`;

    this.meter("power", r.drawMW, Math.max(r.supplyMW, 1), `${r.drawMW.toFixed(0)} / ${r.supplyMW.toFixed(0)} MW`, r.powerOK < 0.999);
    this.meter("heat", r.heatGenMW, Math.max(r.coolCapMW, 1), `${r.heatGenMW.toFixed(0)} / ${r.coolCapMW.toFixed(0)} MW`, r.heatOK < 0.999);
    this.meter("water", 900 - r.waterML, 900, `${r.waterML.toFixed(0)} ML${r.waterUseMLpd > 0.5 ? ` · −${r.waterUseMLpd.toFixed(0)}/d` : ""}`, r.waterML < 180, true);
    this.meter("compute", r.pfLive, Math.max(r.pfInstalled, 1), `${r.pfLive.toFixed(0)} / ${r.pfInstalled.toFixed(0)} PF`, false);
    this.meter("air", r.smog, 1, aqiLabel(r.smog), r.smog > 0.45, true);
    this.meter(
      "town",
      r.sentiment, 100,
      r.moratorium ? `${r.sentiment.toFixed(0)} · MORATORIUM` : r.sentiment.toFixed(0),
      r.sentiment < 30,
    );

    this.prices.innerHTML =
      `<span>SPOT <b>${fmtMoney(r.spot)}</b>/PF·day</span>` +
      `<span>GRID <b>$${r.gridPrice.toFixed(0)}</b>/MWh</span>` +
      `<span>SUN <b>${(r.sun * 100).toFixed(0)}%</b> · WIND <b>${(r.windF * 100).toFixed(0)}%</b></span>` +
      `<span>NOISE <b>${r.noiseDb.toFixed(0)} dB</b> at town</span>`;

    for (const [id, card] of this.cards) {
      if (id === "demolish") continue;
      card.classList.toggle("is-poor", sim.cash < DEFS[id as DefId].cost);
    }

    this.renderContracts(sim);

    for (const t of sim.toasts.splice(0)) this.toast(t.text, t.kind);
  }

  private meter(key: string, v: number, max: number, text: string, alert: boolean, invert = false): void {
    const m = this.meters[key];
    const frac = Math.min(1, v / max);
    m.fill.style.width = `${((invert ? 1 - frac : frac) * 100).toFixed(1)}%`;
    m.text.textContent = text;
    m.row.classList.toggle("is-alert", alert);
  }

  /** Contracts + offers list. Rebuilt only when membership changes; live
   *  numbers inside rows update via data-bound spans. */
  private renderContracts(sim: Sim): void {
    const sig =
      sim.contracts.map((c) => c.id).join(",") + "|" + sim.offers.map((o) => o.id).join(",");
    if (sig !== this.contractsSig) {
      this.contractsSig = sig;
      this.contractsBody.innerHTML = "";
      if (!sim.contracts.length && !sim.offers.length) {
        this.contractsBody.append(el("div", "gw-empty", "No work yet — offers arrive as your campus grows."));
      }
      for (const c of sim.contracts) this.contractsBody.append(this.contractRow(c));
      for (const o of sim.offers) this.contractsBody.append(this.offerRow(o));
    }
    // live fields
    for (const c of sim.contracts) {
      const row = this.contractsBody.querySelector(`[data-cid="${c.id}"]`);
      if (!row) continue;
      const live = row.querySelector(".gw-live") as HTMLElement;
      if (c.kind === "inference") {
        const ok = c.delivered >= 0.8 * c.pf;
        live.innerHTML = `${c.delivered.toFixed(0)}/${c.pf} PF · ${fmtMoney((c.rate * c.pf) / 1)}­/day${ok ? "" : ` · <b class="is-bad">at risk ${c.strikeH.toFixed(1)}h</b>`}`;
      } else {
        const dLeft = Math.max(0, (c.deadlineH - sim.timeH) / 24);
        live.innerHTML = `${((c.donePFd / c.totalPFd) * 100).toFixed(0)}% · ${dLeft.toFixed(1)} d left`;
        const bar = row.querySelector(".gw-prog__fill") as HTMLElement;
        if (bar) bar.style.width = `${Math.min(100, (c.donePFd / c.totalPFd) * 100)}%`;
      }
    }
    for (const o of sim.offers) {
      const row = this.contractsBody.querySelector(`[data-oid="${o.id}"] .gw-expiry`) as HTMLElement;
      if (row) row.textContent = `expires ${Math.max(0, (o.expiresH - sim.timeH)).toFixed(0)} h`;
    }
  }

  private contractRow(c: Contract): HTMLElement {
    const row = el("div", "gw-row gw-row--active");
    row.dataset.cid = String(c.id);
    row.append(el("div", "gw-row__name", c.name));
    if (c.kind === "training") {
      const prog = el("div", "gw-prog");
      prog.append(el("div", "gw-prog__fill"));
      row.append(prog);
      row.append(el("div", "gw-row__terms", `${c.totalPFd.toLocaleString()} PF·d → ${fmtMoney(c.payout)} · miss: ${fmtMoney(-c.penalty)}`));
    } else {
      row.append(el("div", "gw-row__terms", `${c.pf} PF @ ${fmtMoney(c.rate)}/PF·d`));
    }
    row.append(el("div", "gw-live", ""));
    return row;
  }

  private offerRow(o: Offer): HTMLElement {
    const row = el("div", "gw-row gw-row--offer");
    row.dataset.oid = String(o.id);
    row.append(el("div", "gw-row__name", `OFFER · ${o.name}`));
    row.append(
      el(
        "div",
        "gw-row__terms",
        o.kind === "inference"
          ? `${o.pf} PF @ ${fmtMoney(o.rate)}/PF·d, cancels if <80 % for 12 h`
          : `${o.totalPFd.toLocaleString()} PF·d in ${o.days} d → ${fmtMoney(o.payout)} (miss: ${fmtMoney(-o.penalty)})`,
      ),
    );
    const foot = el("div", "gw-row__foot");
    const acc = el("button", "gw-btn gw-btn--acc", "Sign");
    acc.addEventListener("click", () => this.cb.onAccept(o.id));
    const dec = el("button", "gw-btn", "Pass");
    dec.addEventListener("click", () => this.cb.onDecline(o.id));
    foot.append(acc, dec, el("span", "gw-expiry", ""));
    row.append(foot);
    return row;
  }

  // --- selection card -------------------------------------------------------

  showSelection(u: Unit): void {
    const D = DEFS[u.def];
    this.selCard.style.display = "";
    this.selCard.innerHTML = "";
    this.selCard.append(el("div", "gw-selcard__name", D.name));
    this.selCard.append(el("div", "gw-selcard__stat", defStat(D)));
    const state = u.failed
      ? `<b class="is-bad">FAILED — repairing</b>`
      : `output ${(u.throttle * 100).toFixed(0)} %`;
    this.selCard.append(el("div", "gw-selcard__state", state));
    if (D.hot) {
      const hp = el("div", "gw-prog gw-prog--hp");
      const f = el("div", "gw-prog__fill");
      f.style.width = `${(u.health * 100).toFixed(0)}%`;
      if (u.health < 0.4) f.classList.add("is-bad");
      hp.append(f);
      this.selCard.append(el("div", "gw-selcard__hp", "condition"), hp);
    }
    const sell = el("button", "gw-btn", `Demolish · refund ${fmtMoney(D.cost * 0.5)}`);
    sell.addEventListener("click", () => this.cb.onSell(u.id));
    this.selCard.append(sell);
  }

  hideSelection(): void {
    this.selCard.style.display = "none";
  }

  // --- toasts / overlays -----------------------------------------------------

  toast(text: string, kind: "info" | "good" | "warn" | "bad"): void {
    const t = el("div", `gw-toast gw-toast--${kind}`, text);
    this.toastBox.append(t);
    requestAnimationFrame(() => t.classList.add("is-in"));
    setTimeout(() => {
      t.classList.remove("is-in");
      setTimeout(() => t.remove(), 400);
    }, 5200);
    while (this.toastBox.children.length > 5) this.toastBox.firstChild?.remove();
  }

  showIntro(seed: string): void {
    this.overlay.style.display = "";
    this.overlay.innerHTML = "";
    const card = el("div", "gw-modal");
    card.append(el("div", "gw-modal__kicker", "FUTURES ATLAS · SIMULATION"));
    card.append(el("h1", "gw-modal__title", "GIGAWATT"));
    card.append(
      el(
        "p",
        "gw-modal__lede",
        "An AI compute campus in a green river valley — with a town next door. Mix grid, solar, wind, gas and batteries; keep the halls cool through heat waves and dust storms; watch the aquifer, the smog and the neighbours; and grow to <b>one gigawatt</b> of IT load before a bad week bankrupts you.",
      ),
    );
    card.append(
      el(
        "p",
        "gw-modal__hints",
        "<b>Drag</b> to orbit · <b>scroll</b> to zoom · <b>1–9</b> build · <b>R</b> rotate · <b>X</b> demolish · <b>space</b> pause · click a building to inspect",
      ),
    );
    const seedRow = el("div", "gw-modal__seedrow");
    const label = el("label", "gw-modal__seedlabel", "SEED");
    const input = el("input", "gw-modal__seed") as HTMLInputElement;
    input.value = seed;
    input.spellcheck = false;
    seedRow.append(label, input);
    const start = el("button", "gw-btn gw-btn--big", "Break ground");
    start.addEventListener("click", () => this.cb.onStart(input.value.trim() || seed));
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") this.cb.onStart(input.value.trim() || seed);
    });
    card.append(seedRow, start);
    card.append(
      el(
        "p",
        "gw-modal__foot",
        "Runs are seeded — the same seed replays the same weather, prices and offers. Built end-to-end by Claude Fable 5 as a fresh-take companion to Hyperscale.",
      ),
    );
    this.overlay.append(card);
  }

  showEnd(kind: "bankrupt" | "victory", sim: Sim): void {
    this.overlay.style.display = "";
    this.overlay.innerHTML = "";
    const card = el("div", "gw-modal");
    card.append(el("div", "gw-modal__kicker", kind === "victory" ? "CAMPUS COMPLETE" : "RECEIVERSHIP"));
    card.append(el("h1", "gw-modal__title", kind === "victory" ? "ONE GIGAWATT" : "BANKRUPT"));
    card.append(
      el(
        "p",
        "gw-modal__lede",
        kind === "victory"
          ? `Day ${sim.day()}: the campus crossed ${VICTORY_IT_MW} MW of IT load — a fully-fledged gigasite. Final position: <b>${fmtMoney(sim.cash)}</b>.`
          : `Day ${sim.day()}: the creditors called it. The valley keeps the buildings; seed <b>${sim.seed}</b> keeps the story.`,
      ),
    );
    const again = el("button", "gw-btn gw-btn--big", "Run it back");
    again.addEventListener("click", () => window.location.reload());
    card.append(again);
    this.overlay.append(card);
  }

  hideOverlay(): void {
    this.overlay.style.display = "none";
  }
}
