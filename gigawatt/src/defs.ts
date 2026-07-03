/**
 * Building catalogue + shared constants. All the balance numbers live here.
 * Units: MW (power/heat), PF (petaflops of sellable compute), ML (megalitres
 * of water), $ (plain dollars), hours (sim time).
 */

export const CELL = 8; // metres per grid cell
export const GRID = 30; // buildable cells per side (240 m square plot)

export type DefId =
  | "substation" | "solar" | "wind" | "battery" | "gas"
  | "hall" | "pod" | "drycool" | "chiller";

export interface BuildingDef {
  id: DefId;
  name: string;
  short: string; // build-bar label
  blurb: string;
  cost: number; // $
  w: number; // footprint, cells (x before rotation)
  d: number; // footprint, cells (z before rotation)
  h: number; // approx visual height, metres (for selection ring / camera)
  // producers / consumers — leave unset where not applicable
  gridMW?: number; // substation import capacity
  solarMW?: number; // peak output at solar noon
  windMW?: number; // rated turbine output (× live wind factor)
  gasMW?: number; // peaker dispatchable capacity
  fuelPerMWh?: number; // peaker marginal cost
  storeMWh?: number; // battery capacity
  rateMW?: number; // battery max charge/discharge
  itMW?: number; // IT draw (halls/pods)
  pf?: number; // compute produced at full tilt
  coolMW?: number; // nominal heat rejection
  coolDrawMW?: number; // parasitic power at full load
  waterMLpd?: number; // water draw at full load, ML/day (chillers)
  hot?: boolean; // suffers thermal damage when cooling falls behind
  noise?: number; // dB-ish nuisance contribution at full load
  smogPerMWh?: number; // smog units emitted per MWh generated on site
}

export const DEFS: Record<DefId, BuildingDef> = {
  substation: {
    id: "substation",
    name: "Grid substation",
    short: "SUBSTATION",
    blurb: "50 MW of utility import. Reliable, but you pay the grid's spot price — and brownouts cut it.",
    cost: 8_000_000,
    w: 2, d: 2, h: 12,
    gridMW: 50,
  },
  solar: {
    id: "solar",
    name: "Solar field",
    short: "SOLAR",
    blurb: "Up to 20 MW of free energy at solar noon, nothing at night. Dust storms all but blind it. The town approves.",
    cost: 5_000_000,
    w: 3, d: 3, h: 3,
    solarMW: 20,
  },
  wind: {
    id: "wind",
    name: "Wind turbine",
    short: "WIND",
    blurb: "10 MW rated, swinging with the wind. Clean, quiet-ish, and the town loves the skyline.",
    cost: 9_000_000,
    w: 1, d: 1, h: 46,
    windMW: 10,
    noise: 0.8,
  },
  battery: {
    id: "battery",
    name: "Battery bank",
    short: "BATTERY",
    blurb: "40 MWh of storage at ±20 MW. Soaks up midday solar and bridges the night.",
    cost: 6_000_000,
    w: 1, d: 2, h: 4,
    storeMWh: 40,
    rateMW: 20,
  },
  gas: {
    id: "gas",
    name: "Gas peaker plant",
    short: "GAS PEAKER",
    blurb: "35 MW on demand, any hour, any weather — burning fuel at ~$95/MWh and smearing smog over the valley.",
    cost: 7_000_000,
    w: 2, d: 2, h: 15,
    gasMW: 35, fuelPerMWh: 95,
    noise: 4.5, smogPerMWh: 1,
  },
  hall: {
    id: "hall",
    name: "Server hall",
    short: "SERVER HALL",
    blurb: "The workhorse: 25 MW of IT load producing 40 PF. Every megawatt in becomes a megawatt of heat.",
    cost: 12_000_000,
    w: 2, d: 3, h: 8,
    itMW: 25, pf: 40, hot: true, noise: 0.8,
  },
  pod: {
    id: "pod",
    name: "GPU pod",
    short: "GPU POD",
    blurb: "Dense accelerator racks: 30 MW for 90 PF. Premium compute, and it runs viciously hot.",
    cost: 20_000_000,
    w: 2, d: 2, h: 7,
    itMW: 30, pf: 90, hot: true, noise: 1.2,
  },
  drycool: {
    id: "drycool",
    name: "Dry cooler bank",
    short: "DRY COOLER",
    blurb: "Fan-driven heat rejection, ~30 MW in mild air — but capacity derates hard on hot afternoons.",
    cost: 4_000_000,
    w: 1, d: 2, h: 4,
    coolMW: 30, coolDrawMW: 3, noise: 2.4,
  },
  chiller: {
    id: "chiller",
    name: "Chiller plant",
    short: "CHILLER",
    blurb: "55 MW of cooling in any weather — by evaporating ~30 ML of aquifer water a day at full load.",
    cost: 9_000_000,
    w: 2, d: 2, h: 6,
    coolMW: 55, coolDrawMW: 8, waterMLpd: 30, noise: 1.6,
  },
};

export const BUILD_ORDER: DefId[] = [
  "substation", "solar", "wind", "battery", "gas", "hall", "pod", "drycool", "chiller",
];

// --- economy / world constants -------------------------------------------

export const START_CASH = 60_000_000;
export const BANKRUPT_AT = -5_000_000;
export const VICTORY_IT_MW = 1000; // a gigawatt of IT load

export const AQUIFER_ML = 900; // finite basin under the plot
export const AQUIFER_RECHARGE_MLPD = 4;
export const WATER_PRICE_PER_ML = 2_500;

export const GRID_PRICE_BASE = 60; // $/MWh
export const SPOT_PF_BASE = 9_000; // $/PF-day at day 0
export const SPOT_DRIFT_PER_DAY = 0.004; // the boom: +0.4 %/day
export const MAINT_PCT_PER_DAY = 0.004; // 0.4 %/day of installed capex
export const REPAIR_PCT = 0.15; // slice of build cost per failure
export const REPAIR_HOURS = 36;
export const SELL_BACK = 0.5;

// --- town / environment ------------------------------------------------------
// The company town sits SOUTH of the plot (high z), so noisy or smoggy kit
// placed on the southern rows lands hardest on sentiment.
export const NOISE_BASE_DB = 32;
export const NOISE_LIMIT_DB = 55; // complaints start past this
export const SENTIMENT_START = 70;
export const MORATORIUM_BELOW = 30; // county blocks new construction
export const PROTEST_BELOW = 18; // road blockades cut deliveries

export const fmtMoney = (v: number): string => {
  const sign = v < 0 ? "−" : "";
  const a = Math.abs(v);
  if (a >= 1e9) return `${sign}$${(a / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `${sign}$${(a / 1e6).toFixed(1)}M`;
  if (a >= 1e3) return `${sign}$${(a / 1e3).toFixed(0)}k`;
  return `${sign}$${a.toFixed(0)}`;
};
