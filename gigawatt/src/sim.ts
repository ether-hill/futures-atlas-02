/**
 * The whole economy/physics loop, deterministic per seed and free of any
 * rendering concern. Fixed-step ticks (fractions of a sim-hour); the view
 * reads `Sim` + `Readout` each frame.
 *
 * Systems: power dispatch (renewables → cheapest of grid/gas → battery),
 * thermal chain, water, the compute market, and the civic layer — smog from
 * on-site generation, noise drifting toward the town on the southern edge,
 * and a sentiment score with teeth (construction moratorium, road blockades).
 */

import {
  AQUIFER_ML, AQUIFER_RECHARGE_MLPD, BANKRUPT_AT, DEFS, GRID, GRID_PRICE_BASE,
  MAINT_PCT_PER_DAY, MORATORIUM_BELOW, NOISE_BASE_DB, NOISE_LIMIT_DB,
  PROTEST_BELOW, REPAIR_HOURS, REPAIR_PCT, SELL_BACK, SENTIMENT_START,
  SPOT_DRIFT_PER_DAY, SPOT_PF_BASE, START_CASH, VICTORY_IT_MW,
  WATER_PRICE_PER_ML, fmtMoney, type DefId,
} from "./defs";
import { RNG, hashSeed } from "./rng";

// --- state types -----------------------------------------------------------

export interface Unit {
  id: number;
  def: DefId;
  x: number; // cell origin
  z: number;
  w: number; // rotated footprint
  d: number;
  health: number; // 0..1, thermal wear on `hot` buildings
  throttle: number; // 0..1 smoothed effective output
  failed: boolean;
  repairH: number; // hours of repair remaining (when failed)
  charge: number; // MWh (batteries)
  load: number; // 0..1 visual duty (coolers: capacity in use; gas: dispatch; wind: wind factor)
}

export type EventKind = "heatwave" | "duststorm" | "pricesurge" | "brownout" | "boom" | "protest";

export interface WorldEvent {
  kind: EventKind;
  name: string;
  blurb: string;
  endsH: number;
}

export interface Offer {
  id: number;
  kind: "inference" | "training";
  name: string;
  pf: number; // capacity the contract wants
  rate: number; // inference: $/PF-day
  totalPFd: number; // training: PF-days to deliver
  days: number; // training: window length
  payout: number; // training: lump on completion
  penalty: number; // training: charged on miss
  expiresH: number;
}

export interface Contract extends Offer {
  acceptedH: number;
  deadlineH: number; // training
  donePFd: number; // training progress
  strikeH: number; // inference: consecutive under-delivery hours
  delivered: number; // PF allocated this tick (for UI)
}

export interface Toast {
  text: string;
  kind: "info" | "good" | "warn" | "bad";
}

/** Per-tick aggregates the HUD reads. */
export interface Readout {
  supplyMW: number;
  gridMW: number;
  gridUsedMW: number;
  solarMW: number;
  windOutMW: number;
  gasCapMW: number;
  gasUsedMW: number;
  battMW: number; // +discharge / −charge
  battCharge: number;
  battCap: number;
  drawMW: number;
  itMW: number;
  itInstalledMW: number;
  coolDrawMW: number;
  heatGenMW: number;
  coolCapMW: number;
  waterML: number;
  waterUseMLpd: number;
  pfInstalled: number;
  pfLive: number;
  pfContracted: number;
  tempC: number;
  sun: number; // 0..1 solar elevation factor
  windF: number; // 0..1 live wind
  gridPrice: number;
  spot: number;
  netPerDay: number; // smoothed cash rate
  powerOK: number; // 0..1 (1 = fully fed)
  heatOK: number; // 0..1 (1 = fully cooled)
  smog: number; // 0..1 haze over the valley
  noiseDb: number; // at the town edge
  sentiment: number; // 0..100
  cleanShare: number; // 0..1 of draw covered by renewables
  moratorium: boolean;
}

const EVENT_META: Record<EventKind, { name: string; blurb: string; days: [number, number] }> = {
  heatwave: { name: "Heat wave", blurb: "Ambient +11 °C — dry coolers derate hard.", days: [2.5, 4.5] },
  duststorm: { name: "Dust storm", blurb: "Solar collapses to 15 %; at least the wind picks up.", days: [1, 2] },
  pricesurge: { name: "Grid price surge", blurb: "Utility power at 4× spot.", days: [1.5, 3] },
  brownout: { name: "Grid brownout", blurb: "Substation imports cut to 40 %.", days: [0.4, 0.8] },
  boom: { name: "Compute boom", blurb: "Spot compute pays 1.7× for a few days.", days: [3, 5] },
  protest: { name: "Road blockade", blurb: "Residents block the access road — deliveries cut 30 %.", days: [0.8, 1.6] },
};

const INFER_CLIENTS = ["Cascade Search", "Loomwork AI", "Vantage Maps", "Parlance Labs", "Fieldnote Health", "Orrery Games"];
const TRAIN_CLIENTS = ["Meridian Frontier Lab", "Aperture Foundation Models", "Southline Robotics", "Halcyon Bio", "Tessellate AI"];

// --- the sim ---------------------------------------------------------------

export class Sim {
  readonly seed: string;
  private rng: RNG; // schedule/market stream — NOT for cosmetics

  timeH = 8; // start at 08:00, day 0
  cash = START_CASH;
  units: Unit[] = [];
  contracts: Contract[] = [];
  offers: Offer[] = [];
  event: WorldEvent | null = null;
  aquiferML = AQUIFER_ML;
  spot = SPOT_PF_BASE;
  gridPrice = GRID_PRICE_BASE;
  smog = 0;
  sentiment = SENTIMENT_START;
  moratorium = false;

  gameOver: "bankrupt" | "victory" | null = null;
  toasts: Toast[] = []; // drained by the UI each frame
  readout: Readout = emptyReadout();

  private nextId = 1;
  private nextEventH: number;
  private nextOfferH: number;
  private nextProtestH = 0;
  private occupied = new Map<string, number>(); // "x,z" -> unit id
  private capex = 0;
  private cashRate = 0; // smoothed $/day
  private lastCash = START_CASH;

  constructor(seed: string) {
    this.seed = seed;
    this.rng = new RNG(hashSeed(seed) ^ 0x9e3779b9);
    this.nextEventH = 24 * this.rng.range(5, 8);
    this.nextOfferH = 24 * 0.15; // first offer lands within hours
  }

  // --- geometry ---------------------------------------------------------

  canPlace(x: number, z: number, w: number, d: number): boolean {
    if (x < 0 || z < 0 || x + w > GRID || z + d > GRID) return false;
    for (let i = x; i < x + w; i++)
      for (let j = z; j < z + d; j++) if (this.occupied.has(`${i},${j}`)) return false;
    return true;
  }

  place(def: DefId, x: number, z: number, w: number, d: number): Unit | null {
    const D = DEFS[def];
    if (this.moratorium) {
      this.toasts.push({ text: "County moratorium — no permits until the town comes around.", kind: "bad" });
      return null;
    }
    if (!this.canPlace(x, z, w, d) || this.cash < D.cost) return null;
    const u: Unit = {
      id: this.nextId++, def, x, z, w, d,
      health: 1, throttle: 0, failed: false, repairH: 0,
      charge: 0, load: 0,
    };
    this.units.push(u);
    for (let i = x; i < x + w; i++) for (let j = z; j < z + d; j++) this.occupied.set(`${i},${j}`, u.id);
    this.cash -= D.cost;
    this.capex += D.cost;
    this.lastCash -= D.cost; // keep capex out of the smoothed net/day readout
    return u;
  }

  demolish(id: number): Unit | null {
    const idx = this.units.findIndex((u) => u.id === id);
    if (idx < 0) return null;
    const u = this.units[idx];
    this.units.splice(idx, 1);
    for (const [k, v] of this.occupied) if (v === id) this.occupied.delete(k);
    const D = DEFS[u.def];
    this.cash += D.cost * SELL_BACK;
    this.capex -= D.cost;
    this.lastCash += D.cost * SELL_BACK; // sale proceeds aren't operating income
    this.toasts.push({ text: `${D.name} sold for ${fmtMoney(D.cost * SELL_BACK)}`, kind: "info" });
    return u;
  }

  unitAt(x: number, z: number): Unit | undefined {
    const id = this.occupied.get(`${x},${z}`);
    return id === undefined ? undefined : this.units.find((u) => u.id === id);
  }

  // --- environment ------------------------------------------------------

  hourOfDay(): number {
    return this.timeH % 24;
  }
  day(): number {
    return Math.floor(this.timeH / 24);
  }
  /** Solar elevation factor, 0..1 (0 outside 06–18h). */
  sunFactor(): number {
    const h = this.hourOfDay();
    if (h < 6 || h > 18) return 0;
    return Math.sin(((h - 6) / 12) * Math.PI);
  }
  /** Ambient °C: 13 at 03:00 → 34 at 15:00, +11 in a heat wave. */
  tempC(): number {
    const base = 23.5 + 10.5 * Math.cos(((this.hourOfDay() - 15) / 24) * Math.PI * 2);
    return base + (this.event?.kind === "heatwave" ? 11 : 0);
  }
  /** Live wind 0..1 — smooth deterministic gusts; dust storms blow hard. */
  windFactor(): number {
    const h = this.timeH;
    let w =
      0.55 +
      0.42 * Math.sin(h * 0.23) * Math.sin(h * 0.061 + 1.7) +
      0.1 * Math.sin(h * 0.9 + 0.5);
    if (this.event?.kind === "duststorm") w = Math.min(1, w * 1.5 + 0.2);
    return clamp(w, 0.05, 1);
  }

  // --- contracts ----------------------------------------------------------

  accept(offerId: number): void {
    const i = this.offers.findIndex((o) => o.id === offerId);
    if (i < 0) return;
    const o = this.offers.splice(i, 1)[0];
    this.contracts.push({
      ...o,
      acceptedH: this.timeH,
      deadlineH: this.timeH + o.days * 24,
      donePFd: 0,
      strikeH: 0,
      delivered: 0,
    });
    this.toasts.push({ text: `Signed: ${o.name}`, kind: "good" });
  }

  decline(offerId: number): void {
    this.offers = this.offers.filter((o) => o.id !== offerId);
  }

  private makeOffer(): void {
    if (this.offers.length >= 3) return;
    const pfInstalled = this.units.reduce((s, u) => s + (DEFS[u.def].pf ?? 0), 0);
    const scale = Math.max(30, pfInstalled);
    const training = this.rng.chance(0.4);
    if (training) {
      const days = this.rng.int(10, 18);
      const pf = Math.round(scale * this.rng.range(0.35, 0.7));
      const totalPFd = Math.round(pf * days * this.rng.range(0.55, 0.75));
      const payout = Math.round(totalPFd * this.spot * this.rng.range(1.5, 1.9) / 1000) * 1000;
      this.offers.push({
        id: this.nextId++, kind: "training",
        name: `${this.rng.pick(TRAIN_CLIENTS)} · training run`,
        pf, rate: 0, totalPFd, days, payout,
        penalty: Math.round(payout * 0.35),
        expiresH: this.timeH + 24 * this.rng.range(2, 3.5),
      });
    } else {
      const pf = Math.round(scale * this.rng.range(0.3, 0.6));
      const rate = Math.round((this.spot * this.rng.range(1.15, 1.4)) / 100) * 100;
      this.offers.push({
        id: this.nextId++, kind: "inference",
        name: `${this.rng.pick(INFER_CLIENTS)} · inference`,
        pf, rate, totalPFd: 0, days: 0, payout: 0, penalty: 0,
        expiresH: this.timeH + 24 * this.rng.range(2, 3.5),
      });
    }
  }

  // --- events -------------------------------------------------------------

  private rollEvent(): void {
    const kinds: EventKind[] = ["heatwave", "duststorm", "pricesurge", "brownout", "boom"];
    const kind = this.rng.pick(kinds);
    this.startEvent(kind);
  }

  private startEvent(kind: EventKind): void {
    const meta = EVENT_META[kind];
    this.event = {
      kind,
      name: meta.name,
      blurb: meta.blurb,
      endsH: this.timeH + 24 * this.rng.range(meta.days[0], meta.days[1]),
    };
    this.toasts.push({ text: `${meta.name} — ${meta.blurb}`, kind: kind === "boom" ? "good" : kind === "protest" ? "bad" : "warn" });
  }

  // --- the tick -------------------------------------------------------------

  tick(dtH: number): void {
    if (this.gameOver) return;
    this.timeH += dtH;
    const sun = this.sunFactor();
    const temp = this.tempC();
    const windF = this.windFactor();

    // event lifecycle
    if (this.event && this.timeH >= this.event.endsH) {
      this.toasts.push({ text: `${this.event.name} has passed.`, kind: "info" });
      this.event = null;
    }
    if (!this.event && this.timeH >= this.nextEventH) {
      this.rollEvent();
      this.nextEventH = this.timeH + 24 * this.rng.range(4, 9);
    }
    // civic unrest jumps the queue when the town is furious
    if (!this.event && this.sentiment < PROTEST_BELOW && this.timeH >= this.nextProtestH) {
      this.startEvent("protest");
      this.nextProtestH = this.timeH + 24 * this.rng.range(2, 4);
    }

    // market walk (hourly-ish noise, sub-stepped safely)
    const boom = this.event?.kind === "boom" ? 1.7 : 1;
    this.spot = Math.max(
      2000,
      this.spot * (1 + SPOT_DRIFT_PER_DAY * (dtH / 24) + this.rng.range(-0.004, 0.004) * dtH),
    );
    const surge = this.event?.kind === "pricesurge" ? 4 : 1;
    this.gridPrice = Math.max(
      25,
      this.gridPrice + (GRID_PRICE_BASE - this.gridPrice) * 0.02 * dtH + this.rng.range(-1.5, 1.5) * dtH,
    );
    const gridPriceNow = this.gridPrice * surge;

    // offers
    if (this.timeH >= this.nextOfferH) {
      this.makeOffer();
      this.nextOfferH = this.timeH + 24 * this.rng.range(1.5, 4);
    }
    this.offers = this.offers.filter((o) => o.expiresH > this.timeH);

    // --- power & thermal chain --------------------------------------------
    const alive = (u: Unit) => !u.failed;
    const gridCapFactor = this.event?.kind === "brownout" ? 0.4 : 1;
    const dustFactor = this.event?.kind === "duststorm" ? 0.15 : 1;

    const gridMW = this.units.filter((u) => u.def === "substation" && alive(u))
      .reduce((s, u) => s + (DEFS[u.def].gridMW ?? 0), 0) * gridCapFactor;
    const solarMW = this.units.filter((u) => u.def === "solar" && alive(u))
      .reduce((s, u) => s + (DEFS[u.def].solarMW ?? 0), 0) * sun * dustFactor;
    const windOutMW = this.units.filter((u) => u.def === "wind" && alive(u))
      .reduce((s, u) => s + (DEFS[u.def].windMW ?? 0), 0) * windF;
    const gasCapMW = this.units.filter((u) => u.def === "gas" && alive(u))
      .reduce((s, u) => s + (DEFS[u.def].gasMW ?? 0), 0);
    const renewMW = solarMW + windOutMW;

    const batts = this.units.filter((u) => u.def === "battery" && alive(u));
    const battCap = batts.reduce((s, u) => s + (DEFS[u.def].storeMWh ?? 0), 0);
    const battCharge = batts.reduce((s, u) => s + u.charge, 0);
    const battRate = batts.reduce((s, u) => s + (DEFS[u.def].rateMW ?? 0), 0);
    const battAvailMW = Math.min(battRate, battCharge / Math.max(dtH, 1e-6));

    const itUnits = this.units.filter((u) => (DEFS[u.def].itMW ?? 0) > 0);
    const itInstalledMW = itUnits.reduce((s, u) => s + (DEFS[u.def].itMW ?? 0), 0);
    const itWantMW = itUnits.filter(alive).reduce((s, u) => s + (DEFS[u.def].itMW ?? 0), 0);

    // cooling capacity (dry coolers derate with ambient; chillers need water)
    const dryDerate = clamp(1.35 - 0.018 * temp, 0.35, 1.15);
    const coolers = this.units.filter((u) => (DEFS[u.def].coolMW ?? 0) > 0 && alive(u));
    let coolCapMW = 0;
    let coolDrawFullMW = 0;
    for (const u of coolers) {
      const D = DEFS[u.def];
      const cap = u.def === "drycool" ? (D.coolMW ?? 0) * dryDerate : this.aquiferML > 0.5 ? D.coolMW ?? 0 : 0;
      coolCapMW += cap;
      coolDrawFullMW += cap > 0 ? D.coolDrawMW ?? 0 : 0;
    }

    // power balance: can we feed IT + cooling? (batteries help; grid is capped)
    const nonBattSupply = renewMW + gridMW + gasCapMW;
    const supplyMW = nonBattSupply + battAvailMW;
    const wantMW = itWantMW + coolDrawFullMW;
    const powerOK = wantMW > 0 ? Math.min(1, supplyMW / wantMW) : 1;

    // per-unit throttles: power shortage hits everything; heat shortage hits IT
    const heatGenPrelim = itUnits.filter(alive).reduce((s, u) => s + (DEFS[u.def].itMW ?? 0) * u.throttle, 0);
    const heatOK = heatGenPrelim > 0 ? Math.min(1, coolCapMW / heatGenPrelim) : 1;

    let heatGenMW = 0;
    let pfLive = 0;
    for (const u of this.units) {
      const D = DEFS[u.def];
      if (u.failed) {
        u.throttle = 0;
        u.load = 0;
        u.repairH -= dtH;
        if (u.repairH <= 0) {
          u.failed = false;
          u.health = 1;
          this.toasts.push({ text: `${D.name} back online.`, kind: "good" });
        }
        continue;
      }
      if (D.itMW) {
        const target = Math.min(powerOK, heatOK);
        u.throttle += (target - u.throttle) * Math.min(1, 2.5 * dtH);
        u.load = u.throttle;
        heatGenMW += D.itMW * u.throttle;
        pfLive += (D.pf ?? 0) * u.throttle;
        // thermal wear: sustained under-cooling burns health
        if (D.hot && heatOK < 0.92) {
          u.health -= (0.95 - heatOK) * 0.055 * dtH;
          if (u.health <= 0) {
            u.failed = true;
            u.repairH = REPAIR_HOURS;
            const bill = D.cost * REPAIR_PCT;
            this.cash -= bill;
            this.toasts.push({ text: `${D.name} cooked itself — offline ${REPAIR_HOURS} h, ${fmtMoney(bill)} repair.`, kind: "bad" });
          }
        } else if (D.hot) {
          u.health = Math.min(1, u.health + 0.02 * dtH);
        }
      } else if (D.coolMW) {
        u.load = coolCapMW > 0 ? Math.min(1, heatGenMW > 0 ? heatGenPrelim / coolCapMW : 0) : 0;
        u.throttle = u.load;
      } else if (D.solarMW) {
        u.load = sun * dustFactor;
      } else if (D.windMW) {
        u.load = windF;
      }
    }

    // actual electric draw + battery flow (batteries store renewable surplus only)
    const coolDrawMW = coolDrawFullMW * (heatGenPrelim > 0 ? clamp(heatGenPrelim / Math.max(coolCapMW, 1e-6), 0.15, 1) : 0.05);
    const drawMW = itUnits.filter(alive).reduce((s, u) => s + (DEFS[u.def].itMW ?? 0) * u.throttle, 0) + coolDrawMW;
    let battMW = 0;
    if (drawMW > nonBattSupply && battCharge > 0) {
      battMW = Math.min(battRate, drawMW - nonBattSupply, battCharge / Math.max(dtH, 1e-6)); // discharge
    } else if (drawMW < renewMW && battCharge < battCap) {
      battMW = -Math.min(battRate, renewMW - drawMW, (battCap - battCharge) / Math.max(dtH, 1e-6)); // charge
    }
    if (batts.length && battMW !== 0) {
      const perBank = (battMW * dtH) / batts.length;
      for (const b of batts) b.charge = clamp(b.charge - perBank, 0, DEFS[b.def].storeMWh ?? 0);
    }
    for (const b of batts) b.load = battCap > 0 ? b.charge / (DEFS[b.def].storeMWh ?? 1) : 0;

    // paid dispatch: whatever renewables + battery don't cover, buy from the
    // cheaper of grid and gas first
    const paidNeed = clamp(drawMW - renewMW - Math.max(battMW, 0), 0, gridMW + gasCapMW);
    const gasFuel = DEFS.gas.fuelPerMWh ?? 95;
    let gridUsedMW: number, gasUsedMW: number;
    if (gridPriceNow <= gasFuel) {
      gridUsedMW = Math.min(paidNeed, gridMW);
      gasUsedMW = Math.min(paidNeed - gridUsedMW, gasCapMW);
    } else {
      gasUsedMW = Math.min(paidNeed, gasCapMW);
      gridUsedMW = Math.min(paidNeed - gasUsedMW, gridMW);
    }
    const gasLoad = gasCapMW > 0 ? gasUsedMW / gasCapMW : 0;
    for (const u of this.units) if (u.def === "gas" && !u.failed) u.load = gasLoad;

    // water
    const chillerLoad = coolCapMW > 0 ? clamp(heatGenPrelim / coolCapMW, 0, 1) : 0;
    const waterUseMLpd = this.units
      .filter((u) => u.def === "chiller" && alive(u))
      .reduce((s, u) => s + (DEFS[u.def].waterMLpd ?? 0), 0) * chillerLoad;
    this.aquiferML = clamp(this.aquiferML + (AQUIFER_RECHARGE_MLPD - waterUseMLpd) * (dtH / 24), 0, AQUIFER_ML);

    // --- civic layer: smog, noise, sentiment --------------------------------
    // smog accumulates from on-site combustion (plus a whiff from grid import)
    // and disperses with the wind
    const emit = gasUsedMW * 1.0e-3 + gridUsedMW * 0.2e-4;
    this.smog = clamp(this.smog + emit * dtH - this.smog * (0.03 + 0.13 * windF) * dtH, 0, 1);

    // noise at the town edge: each source weighted by how far south it sits
    let noiseDb = NOISE_BASE_DB;
    for (const u of this.units) {
      const D = DEFS[u.def];
      if (!D.noise || u.failed) continue;
      const prox = 0.45 + 1.15 * ((u.z + u.d / 2) / GRID); // z=GRID edge faces the town
      noiseDb += D.noise * Math.max(u.load, u.def === "wind" ? 0.3 : 0) * prox;
    }

    const waterStress = 1 - this.aquiferML / AQUIFER_ML;
    const cleanShare = drawMW > 1 ? clamp(renewMW / drawMW, 0, 1) : 0;
    const sentimentTarget = clamp(
      78 - this.smog * 52 - Math.max(0, noiseDb - NOISE_LIMIT_DB) * 1.7 - waterStress * 18 + cleanShare * 14,
      0, 100,
    );
    this.sentiment += (sentimentTarget - this.sentiment) * Math.min(1, dtH * (4 / 24));

    if (!this.moratorium && this.sentiment < MORATORIUM_BELOW) {
      this.moratorium = true;
      this.toasts.push({ text: "The county has frozen your permits — construction moratorium until sentiment recovers.", kind: "bad" });
    } else if (this.moratorium && this.sentiment > MORATORIUM_BELOW + 10) {
      this.moratorium = false;
      this.toasts.push({ text: "Moratorium lifted — the county will issue permits again.", kind: "good" });
    }

    // a blockade cuts what actually reaches customers
    if (this.event?.kind === "protest") pfLive *= 0.7;

    // --- compute market -----------------------------------------------------
    let pfFree = pfLive;
    let revenue = 0;
    const doneContracts: Contract[] = [];
    for (const c of this.contracts) {
      const alloc = Math.min(c.pf, pfFree);
      pfFree -= alloc;
      c.delivered = alloc;
      if (c.kind === "inference") {
        revenue += alloc * (c.rate / 24) * dtH;
        if (alloc < 0.8 * c.pf) {
          c.strikeH += dtH;
          if (c.strikeH > 12) {
            this.toasts.push({ text: `${c.name} walked — sustained under-delivery.`, kind: "bad" });
            doneContracts.push(c);
          }
        } else {
          c.strikeH = Math.max(0, c.strikeH - dtH * 2);
        }
      } else {
        c.donePFd += (alloc * dtH) / 24;
        if (c.donePFd >= c.totalPFd) {
          this.cash += c.payout;
          this.toasts.push({ text: `${c.name} delivered — ${fmtMoney(c.payout)} paid.`, kind: "good" });
          doneContracts.push(c);
        } else if (this.timeH >= c.deadlineH) {
          this.cash -= c.penalty;
          this.toasts.push({ text: `${c.name} missed its deadline — ${fmtMoney(c.penalty)} penalty.`, kind: "bad" });
          doneContracts.push(c);
        }
      }
    }
    this.contracts = this.contracts.filter((c) => !doneContracts.includes(c));
    // leftover capacity sells on spot (thinner than contract rates)
    revenue += pfFree * ((this.spot * 0.6 * boom) / 24) * dtH;

    // --- costs ---------------------------------------------------------------
    const energyCost = gridUsedMW * gridPriceNow * dtH + gasUsedMW * gasFuel * dtH;
    const waterCost = waterUseMLpd * (dtH / 24) * WATER_PRICE_PER_ML;
    const maint = this.capex * MAINT_PCT_PER_DAY * (dtH / 24);
    this.cash += revenue - energyCost - waterCost - maint;

    // smoothed net-per-day for the HUD
    const instRate = (this.cash - this.lastCash) / (dtH / 24);
    this.cashRate += (instRate - this.cashRate) * Math.min(1, dtH * 2);
    this.lastCash = this.cash;

    // --- endings ---------------------------------------------------------------
    if (this.cash < BANKRUPT_AT) {
      this.gameOver = "bankrupt";
    } else if (itInstalledMW >= VICTORY_IT_MW) {
      this.gameOver = "victory";
    }

    this.readout = {
      supplyMW, gridMW, gridUsedMW, solarMW, windOutMW, gasCapMW, gasUsedMW, battMW,
      battCharge: batts.reduce((s, u) => s + u.charge, 0), battCap,
      drawMW, itMW: drawMW - coolDrawMW, itInstalledMW, coolDrawMW,
      heatGenMW, coolCapMW,
      waterML: this.aquiferML, waterUseMLpd,
      pfInstalled: this.units.reduce((s, u) => s + (DEFS[u.def].pf ?? 0), 0),
      pfLive, pfContracted: this.contracts.reduce((s, c) => s + c.pf, 0),
      tempC: temp, sun, windF,
      gridPrice: gridPriceNow, spot: this.spot * boom,
      netPerDay: this.cashRate,
      powerOK, heatOK,
      smog: this.smog, noiseDb,
      sentiment: this.sentiment, cleanShare,
      moratorium: this.moratorium,
    };
  }
}

function clamp(v: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, v));
}

function emptyReadout(): Readout {
  return {
    supplyMW: 0, gridMW: 0, gridUsedMW: 0, solarMW: 0, windOutMW: 0, gasCapMW: 0, gasUsedMW: 0,
    battMW: 0, battCharge: 0, battCap: 0,
    drawMW: 0, itMW: 0, itInstalledMW: 0, coolDrawMW: 0, heatGenMW: 0, coolCapMW: 0,
    waterML: AQUIFER_ML, waterUseMLpd: 0, pfInstalled: 0, pfLive: 0, pfContracted: 0,
    tempC: 20, sun: 0.5, windF: 0.5, gridPrice: GRID_PRICE_BASE, spot: SPOT_PF_BASE, netPerDay: 0,
    powerOK: 1, heatOK: 1, smog: 0, noiseDb: NOISE_BASE_DB, sentiment: SENTIMENT_START,
    cleanShare: 0, moratorium: false,
  };
}
