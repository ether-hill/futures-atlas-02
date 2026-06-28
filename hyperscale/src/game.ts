import {
  BUILDS, GRID_COLS, GRID_ROWS, START_CASH, PRICE_PER_CU, POWER_COST,
  MAINT_PER_TILE, STAFF_BASE, STAFF_PER_8_TILES, DEMAND_BASE, DEMAND_GROWTH,
  DEMAND_NOISE, IDLE_POWER, IDLE_HEAT, DAMAGE_RATE, REGEN_RATE, REPAIR_COST,
  DELIVER_OK, RED_LIMIT, BANKRUPT_FLOOR, EVENTS, EVENT_GRACE_DAYS, EVENT_GAP,
  type Kind, type EventDef,
} from "./config";
import { Rng } from "./rng";

export interface Cell {
  kind: Kind | null;
  integrity: number; // 0..100, only meaningful for rack/pod
}

export interface ActiveEvent {
  def: EventDef;
  daysLeft: number;
}

export interface LogEntry {
  day: number;
  text: string;
  tone: "good" | "bad" | "warn" | "info";
}

// Everything the HUD + floor need, derived from state without mutating it.
export interface Metrics {
  tiles: number;
  capacity: number;   // MW available
  draw: number;       // MW drawn
  powerRatio: number; // 0..1
  heatGen: number;
  coolCap: number;
  heatRatio: number;  // 0..1
  deliverFactor: number; // power*heat, 0..1
  totalCompute: number;  // CU if all machines fully utilised
  healthyCompute: number; // CU from non-failed machines
  util: number;       // 0..1 fraction of healthy compute the market wants
  delivered: number;  // CU actually sold today
  demand: number;     // CU the market wants today
  revenue: number;
  costs: number;
  profit: number;
  failed: number;     // count of failed machines
  coolMult: number;
  powerCapMult: number;
  powerPriceMult: number;
}

export class Game {
  seed = "";
  rng!: Rng;
  grid: Cell[] = [];
  cash = START_CASH;
  day = 0;
  baseDemand = DEMAND_BASE;
  demand = DEMAND_BASE;
  running = false;
  speed = 0;
  redDays = 0;
  over = false;
  overReason = "";
  events: ActiveEvent[] = [];
  eventTimer = 0;
  log: LogEntry[] = [];

  // lifetime stats
  served = 0;     // cumulative CU·days delivered
  peakMW = 0;
  peakCompute = 0;
  peakCash = START_CASH;

  constructor(seed: string) {
    this.reset(seed);
  }

  reset(seed: string) {
    this.seed = seed;
    this.rng = new Rng(seed);
    this.grid = Array.from({ length: GRID_COLS * GRID_ROWS }, () => ({ kind: null, integrity: 100 }));
    this.cash = START_CASH;
    this.day = 0;
    this.baseDemand = DEMAND_BASE;
    this.demand = DEMAND_BASE;
    this.running = false;
    this.speed = 0;
    this.redDays = 0;
    this.over = false;
    this.overReason = "";
    this.events = [];
    this.eventTimer = EVENT_GRACE_DAYS;
    this.log = [];
    this.served = 0;
    this.peakMW = 0;
    this.peakCompute = 0;
    this.peakCash = START_CASH;
    this.note("Floor leased. Lay down power, racks and cooling — then press play.", "info");
  }

  note(text: string, tone: LogEntry["tone"]) {
    this.log.unshift({ day: this.day, text, tone });
    if (this.log.length > 60) this.log.pop();
  }

  // --- event modifiers, read off the active list -------------------------
  private mods() {
    let coolMult = 1, powerCapMult = 1, powerPriceMult = 1, demandMult = 1;
    for (const e of this.events) {
      switch (e.def.id) {
        case "heatwave": coolMult *= 0.65; break;
        case "efficiency": coolMult *= 1.25; break;
        case "gridhit": powerCapMult *= 0.5; break;
        case "powerspike": powerPriceMult *= 2; break;
        case "surge": demandMult *= 1.6; break;
      }
    }
    return { coolMult, powerCapMult, powerPriceMult, demandMult };
  }

  // --- pure metrics over current state -----------------------------------
  metrics(): Metrics {
    const { coolMult, powerCapMult, powerPriceMult } = this.mods();
    let tiles = 0, capacity = 0, totalCompute = 0, healthyCompute = 0, coolBase = 0, failed = 0;
    for (const c of this.grid) {
      if (!c.kind) continue;
      tiles++;
      const d = BUILDS[c.kind];
      capacity += d.capacity;
      coolBase += d.cooling;
      if (c.kind === "rack" || c.kind === "pod") {
        totalCompute += d.compute;
        if (c.integrity > 0) healthyCompute += d.compute;
        else failed++;
      }
    }
    capacity *= powerCapMult;

    const util = healthyCompute > 0 ? Math.min(1, this.demand / healthyCompute) : 0;

    // power draw: compute machines scale with utilisation, cooling runs flat
    let draw = 0;
    for (const c of this.grid) {
      if (!c.kind) continue;
      const d = BUILDS[c.kind];
      if (c.kind === "cool") draw += d.draw;
      else if ((c.kind === "rack" || c.kind === "pod") && c.integrity > 0) {
        draw += d.draw * (IDLE_POWER + (1 - IDLE_POWER) * util);
      }
    }
    const powerRatio = draw > 0.0001 ? Math.min(1, capacity / draw) : 1;

    // heat scales with actual work (utilisation × power available); cooling
    // itself needs power, so a brownout weakens cooling too.
    let heatGen = 0;
    for (const c of this.grid) {
      if (!c.kind || c.integrity <= 0) continue;
      if (c.kind === "rack" || c.kind === "pod") {
        const d = BUILDS[c.kind];
        heatGen += d.heat * (IDLE_HEAT + (1 - IDLE_HEAT) * util) * powerRatio;
      }
    }
    const coolCap = coolBase * coolMult * powerRatio;
    const heatRatio = heatGen > 0.0001 ? Math.min(1, coolCap / heatGen) : 1;

    const deliverFactor = powerRatio * heatRatio;
    const delivered = Math.min(this.demand, healthyCompute) * deliverFactor;

    const revenue = delivered * PRICE_PER_CU;
    const staff = STAFF_BASE + Math.floor(tiles / 8) * STAFF_PER_8_TILES;
    const costs = draw * POWER_COST * powerPriceMult + tiles * MAINT_PER_TILE + staff;

    return {
      tiles, capacity, draw, powerRatio, heatGen, coolCap, heatRatio,
      deliverFactor, totalCompute, healthyCompute, util, delivered,
      demand: this.demand, revenue, costs, profit: revenue - costs, failed,
      coolMult, powerCapMult, powerPriceMult,
    };
  }

  // --- building ----------------------------------------------------------
  canAfford(kind: Kind): boolean {
    return this.cash >= BUILDS[kind].cost;
  }

  place(i: number, kind: Kind): boolean {
    const c = this.grid[i];
    if (!c || c.kind) return false;
    const def = BUILDS[kind];
    if (this.cash < def.cost) {
      this.note(`Not enough cash for a ${def.name} ($${def.cost}k).`, "warn");
      return false;
    }
    this.cash -= def.cost;
    c.kind = kind;
    c.integrity = 100;
    return true;
  }

  demolish(i: number): boolean {
    const c = this.grid[i];
    if (!c || !c.kind) return false;
    const def = BUILDS[c.kind];
    this.cash += Math.round(def.cost * def.refund);
    c.kind = null;
    c.integrity = 100;
    return true;
  }

  repair(i: number): boolean {
    const c = this.grid[i];
    if (!c || !c.kind || c.integrity > 0) return false;
    if (this.cash < REPAIR_COST) {
      this.note(`Can't repair — need $${REPAIR_COST}k.`, "warn");
      return false;
    }
    this.cash -= REPAIR_COST;
    c.integrity = 60;
    this.note(`Repaired a ${BUILDS[c.kind].name}.`, "good");
    return true;
  }

  // --- one simulated day -------------------------------------------------
  step() {
    if (this.over) return;
    this.day++;

    // advance + roll demand for the day
    this.baseDemand *= DEMAND_GROWTH;
    const { demandMult } = this.mods();
    const noise = 1 + (this.rng.f() * 2 - 1) * DEMAND_NOISE;
    this.demand = this.baseDemand * demandMult * noise;

    const m = this.metrics();

    // money
    this.cash += m.profit;
    this.served += m.delivered;
    this.peakMW = Math.max(this.peakMW, m.draw);
    this.peakCompute = Math.max(this.peakCompute, m.healthyCompute);
    this.peakCash = Math.max(this.peakCash, this.cash);

    // reliability: starvation damages machines, health regenerates them
    for (const c of this.grid) {
      if (c.kind !== "rack" && c.kind !== "pod") continue;
      if (c.integrity <= 0) continue;
      if (m.deliverFactor < DELIVER_OK) {
        c.integrity = Math.max(0, c.integrity - (1 - m.deliverFactor) * DAMAGE_RATE);
        if (c.integrity <= 0) this.note(`A ${BUILDS[c.kind].name} overheated and went dark. Click to repair.`, "bad");
      } else {
        c.integrity = Math.min(100, c.integrity + REGEN_RATE);
      }
    }

    // tick down active events
    for (const e of this.events) e.daysLeft--;
    const ended = this.events.filter((e) => e.daysLeft <= 0);
    this.events = this.events.filter((e) => e.daysLeft > 0);
    for (const e of ended) this.note(`${e.def.label} passed.`, "info");

    // maybe fire a new event
    this.eventTimer--;
    if (this.eventTimer <= 0) {
      this.fireEvent();
      // next event in a randomised window around EVENT_GAP
      this.eventTimer = Math.max(2, Math.round(EVENT_GAP * this.rng.range(0.6, 1.4)));
    }

    // solvency
    if (this.cash < 0) this.redDays++;
    else this.redDays = 0;

    if (this.cash < BANKRUPT_FLOOR) this.gameOver("Cash blew past the floor — the lenders pulled the plug.");
    else if (this.redDays >= RED_LIMIT) this.gameOver(`${RED_LIMIT} days underwater — the data center is insolvent.`);
  }

  private fireEvent() {
    const total = EVENTS.reduce((s, e) => s + e.weight, 0);
    let r = this.rng.f() * total;
    let def = EVENTS[0];
    for (const e of EVENTS) {
      r -= e.weight;
      if (r <= 0) { def = e; break; }
    }
    if (def.id === "fault") {
      // one-shot: hammer a random live machine
      const live = this.grid.filter((c) => (c.kind === "rack" || c.kind === "pod") && c.integrity > 0);
      if (live.length) {
        const c = this.rng.pick(live);
        c.integrity = Math.max(0, c.integrity - this.rng.range(45, 75));
        this.note(`${def.glyph} ${def.label} — ${def.blurb}`, "bad");
        if (c.integrity <= 0) this.note(`That machine failed outright.`, "bad");
      }
      return;
    }
    this.events.push({ def, daysLeft: def.days });
    this.note(`${def.glyph} ${def.label} — ${def.blurb}`, def.tone === "good" ? "good" : def.tone === "warn" ? "warn" : "bad");
  }

  private gameOver(reason: string) {
    this.over = true;
    this.running = false;
    this.overReason = reason;
    this.note(reason, "bad");
  }
}
