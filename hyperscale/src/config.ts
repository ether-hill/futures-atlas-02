// All game tuning lives here. Money is in $k (so 120 = $120,000). One tick = one
// "day". Power is MW. Compute is "CU" (compute units). Heat is an abstract load
// where one cooling unit's output offsets some number of rack heat units.

export const GRID_COLS = 12;
export const GRID_ROWS = 8;

export type Kind = "power" | "rack" | "cool" | "pod";

export interface BuildDef {
  kind: Kind;
  name: string;
  short: string; // palette label
  glyph: string; // grid glyph
  cost: number; // $k to build
  refund: number; // fraction returned on demolish
  capacity: number; // MW supplied (power only)
  draw: number; // MW drawn at full load (consumers)
  compute: number; // CU produced at full utilisation
  heat: number; // heat units produced at full load
  cooling: number; // heat units removed
  blurb: string;
}

// The four things you can place. Kept deliberately small so the loop is legible.
export const BUILDS: Record<Kind, BuildDef> = {
  power: {
    kind: "power", name: "Substation", short: "Power", glyph: "⚡",
    cost: 26, refund: 0.5, capacity: 8, draw: 0, compute: 0, heat: 0, cooling: 0,
    blurb: "+8 MW of power capacity. Everything else draws against it.",
  },
  rack: {
    kind: "rack", name: "Server Rack", short: "Rack", glyph: "▤",
    cost: 15, refund: 0.4, capacity: 0, draw: 1.2, compute: 12, heat: 14, cooling: 0,
    blurb: "+12 CU compute. Draws 1.2 MW and throws off heat under load.",
  },
  pod: {
    kind: "pod", name: "GPU Pod", short: "GPU Pod", glyph: "◫",
    cost: 58, refund: 0.4, capacity: 0, draw: 4.6, compute: 52, heat: 58, cooling: 0,
    blurb: "+52 CU compute. Dense and hungry — 4.6 MW and a lot of heat.",
  },
  cool: {
    kind: "cool", name: "Cooling Unit", short: "Cooling", glyph: "❄",
    cost: 11, refund: 0.5, capacity: 0, draw: 0.6, compute: 0, heat: 0, cooling: 28,
    blurb: "Removes 28 heat. Needs 0.6 MW itself — cooling isn't free.",
  },
};

export const BUILD_ORDER: Kind[] = ["power", "rack", "pod", "cool"];

// Economy (per day) ---------------------------------------------------------
export const START_CASH = 130;
export const PRICE_PER_CU = 0.235; // $k earned per CU of compute actually delivered
export const POWER_COST = 0.21; // $k per MW drawn
export const MAINT_PER_TILE = 0.07; // $k upkeep per built tile
export const STAFF_BASE = 0.45; // $k/day fixed overhead (ops staff)
export const STAFF_PER_8_TILES = 0.4; // +staff for every 8 built tiles

// Demand (the AI compute boom) ---------------------------------------------
export const DEMAND_BASE = 42; // CU of market demand on day 0
export const DEMAND_GROWTH = 1.0135; // compounding daily growth
export const DEMAND_NOISE = 0.12; // ± fractional jitter each day

// Idle machines still draw/heat a baseline fraction of their rating.
export const IDLE_POWER = 0.34;
export const IDLE_HEAT = 0.3;

// Reliability ---------------------------------------------------------------
export const DAMAGE_RATE = 11; // integrity lost per day at full starvation
export const REGEN_RATE = 3.5; // integrity regained per day when healthy
export const REPAIR_COST = 7; // $k to repair a failed machine
export const DELIVER_OK = 0.985; // above this deliver factor, machines are "fine"

// Bankruptcy: you can run in the red, but not forever.
export const RED_LIMIT = 12; // consecutive days below zero cash → game over
export const BANKRUPT_FLOOR = -90; // instant game over if cash dips below this

// Tick speeds (ms per day) for ▶ / speed control.
export const SPEEDS = [
  { label: "1×", ms: 850 },
  { label: "2×", ms: 430 },
  { label: "4×", ms: 210 },
];

// Random events. weight is relative; days is duration. Fired roughly once every
// EVENT_GAP days on average once past the grace period.
export const EVENT_GRACE_DAYS = 8;
export const EVENT_GAP = 9; // avg days between events (lower = more chaos)

export interface EventDef {
  id: string;
  label: string;
  glyph: string;
  weight: number;
  days: number;
  tone: "bad" | "good" | "warn";
  blurb: string;
}

export const EVENTS: EventDef[] = [
  { id: "heatwave", label: "Heat wave", glyph: "☀", weight: 5, days: 6, tone: "bad",
    blurb: "Outside air is hot — cooling output drops 35% until it passes." },
  { id: "powerspike", label: "Power-price spike", glyph: "＄", weight: 5, days: 7, tone: "warn",
    blurb: "Wholesale power doubles in price. Idle racks cost you now." },
  { id: "gridhit", label: "Grid outage", glyph: "⌁", weight: 3, days: 4, tone: "bad",
    blurb: "The grid sags — substation capacity is halved. Brownout risk." },
  { id: "surge", label: "Demand surge", glyph: "↑", weight: 5, days: 9, tone: "good",
    blurb: "A model launch spikes demand. Sell everything you can deliver." },
  { id: "fault", label: "Hardware fault", glyph: "✸", weight: 4, days: 1, tone: "bad",
    blurb: "A machine took a hit — its integrity dropped sharply." },
  { id: "efficiency", label: "Cooling tune-up", glyph: "✦", weight: 3, days: 8, tone: "good",
    blurb: "Ops retuned the loops — cooling runs 25% more effective." },
];
