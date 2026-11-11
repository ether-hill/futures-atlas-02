/**
 * Where an action applies: a flag and a name for any jurisdiction code, and the
 * region it is filed under on the Response page. Codes are ISO 3166 alpha-2,
 * "US-XX" for US states, "EU", "INTL" for intergovernmental bodies and
 * "INDUSTRY" for the labs.
 */
const SPECIAL: Record<string, [string, string]> = {
  EU: ["🇪🇺", "European Union"],
  INTL: ["🌐", "International"],
  INDUSTRY: ["◆", "AI companies"],
  GB: ["🇬🇧", "United Kingdom"],
  US: ["🇺🇸", "United States"],
  HK: ["🇭🇰", "Hong Kong"],
  MO: ["🇲🇴", "Macau"],
  TW: ["🇹🇼", "Taiwan"],
  PS: ["🇵🇸", "Palestine"],
};
const US_STATES: Record<string, string> = { AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming", DC: "District of Columbia" };

const flagOf = (cc: string) => (/^[A-Z]{2}$/.test(cc) ? String.fromCodePoint(...[...cc].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)) : "");
let names: Intl.DisplayNames | null = null;
const nameOf = (cc: string) => {
  try {
    names ??= new Intl.DisplayNames(["en-GB"], { type: "region" });
    return names.of(cc) ?? cc;
  } catch {
    return cc;
  }
};

export function placeOf(j: string): [string, string] {
  if (SPECIAL[j]) return SPECIAL[j];
  if (j.startsWith("US-")) return ["🇺🇸", `${US_STATES[j.slice(3)] ?? j.slice(3)}, US`];
  return [flagOf(j), nameOf(j)];
}

/*
 * Continents follow the UN's M49 regions, the neutral standard, so no country
 * gets a row of its own and none is filed as "the rest". M49 puts the Middle
 * East, Turkey, Cyprus and the Caucasus in Asia, and Russia in Europe.
 */
const AFRICA = "AO BF BI BJ BW CD CF CG CI CM CV DJ DZ EG EH ER ET GA GH GM GN GQ GW KE KM LR LS LY MA MG ML MR MU MW MZ NA NE NG RW SC SD SL SN SO SS ST SZ TD TG TN TZ UG ZA ZM ZW".split(" ");
const AMERICAS = "AG AR BB BO BR BS BZ CA CL CO CR CU DM DO EC GD GT GY HN HT JM KN LC MX NI PA PE PY SR SV TT US UY VC VE".split(" ");
const EUROPE = "AD AL AT BA BE BG BY CH CZ DE DK EE ES EU FI FR GB GR HR HU IE IS IT LI LT LU LV MC MD ME MK MT NL NO PL PT RO RS RU SE SI SK SM UA VA XK".split(" ");
const OCEANIA = "AU FJ FM KI MH NR NZ PG PW SB TO TV VU WS".split(" ");

const ASIA = "AE AF AM AZ BD BH BN BT CN CY GE ID IL IN IQ IR JO JP KG KH KP KR KW KZ LA LB LK MM MN MV MY NP OM PH PK PS QA SA SG SY TH TJ TL TM TR UZ VN YE".split(" ");
const NOT_STATES = new Set(["EU", "XK", "EH"]);
/** The 193 UN member states plus the two observer states, the Holy See and Palestine. */
export const ALL_STATES = [...AFRICA, ...AMERICAS, ...ASIA, ...EUROPE, ...OCEANIA].filter((c) => !NOT_STATES.has(c));

/** The continent an action is filed under, or the international bodies, or the companies. */
export function regionOf(j: string): string {
  if (j === "INTL") return "intl";
  if (j === "INDUSTRY") return "industry";
  if (j.startsWith("US-")) return "americas";
  if (AFRICA.includes(j)) return "africa";
  if (AMERICAS.includes(j)) return "americas";
  if (EUROPE.includes(j) || j === "UK") return "europe";
  if (OCEANIA.includes(j)) return "oceania";
  return "asia";
}
