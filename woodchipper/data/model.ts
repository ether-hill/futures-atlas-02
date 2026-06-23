// Woodchipper Futures — the cited model. Everything the engine projects and the
// dashboard shows reads from here. Death figures are MODELED projections, never
// observed body counts; ranges and scenarios are carried explicitly. Sources are
// the peer-reviewed + agency figures gathered in projects/woodchipper/RESEARCH.md.

export interface Cite { label: string; url: string }

// ── decision flow ───────────────────────────────────────────────────────────
export type StageId = "approach" | "protect" | "backfill" | "horizon";

export interface Choice {
  id: string;
  label: string;
  sub: string;
  detail: string; // cited one-liner shown on the node
  cite?: Cite;
}

// APPROACH — the headline lever. kills = share of the modeled baseline toll that
// still lands; wasteRecoveredM = real documented waste a path actually addresses;
// budgetCutB = dollars withheld; skipProtect = programs already kept.
export interface Approach extends Choice { kills: number; wasteRecoveredM: number; budgetCutB: number; skipProtect: boolean; tone: "destroy" | "mixed" | "reform" }
export const APPROACHES: Approach[] = [
  { id: "woodchipper", label: "The woodchipper", sub: "Abolish — cancel ~83% of awards, fold USAID into State", detail: "What happened: ~83–86% of 6,200+ awards terminated, agency dissolved by Jul 1 2025.", cite: { label: "KFF — the terminated list", url: "https://www.kff.org/global-health-policy/the-usaid-list-of-terminated-global-health-awards-what-does-it-tell-us/" }, kills: 1, wasteRecoveredM: 0, budgetCutB: 54, skipProtect: false, tone: "destroy" },
  { id: "freeze", label: "Freeze & walk away", sub: "90-day pause, stop-work, then cut most of it anyway", detail: "The Jan-2025 pause + stop-work froze lifesaving programs immediately; a 90-day HIV pause alone modeled >100,000 excess deaths.", cite: { label: "JIAS — Tram et al.", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11851316/" }, kills: 0.85, wasteRecoveredM: 0, budgetCutB: 48, skipProtect: false, tone: "destroy" },
  { id: "audit", label: "Targeted audit", sub: "Audit the portfolio, cut proven waste, keep the programs", detail: "Documented questioned costs ran ~$8.6M–$39.5M per half-year — a fraction a real audit could recover without ending programs.", cite: { label: "USAID OIG — Spring 2025 report", url: "https://oig.usaid.gov/sites/default/files/2025-05/Spring%202025%20Semiannual%20Report%20to%20Congress_0.pdf" }, kills: 0.03, wasteRecoveredM: 40, budgetCutB: 0.05, skipProtect: true, tone: "reform" },
  { id: "reform", label: "Reform & localize", sub: "Consolidate, cut contractor overhead, fund local orgs", detail: "Only ~6% of funds reached local organisations; experts' fix was localization + procurement reform, not abolition.", cite: { label: "CGD — four practical steps", url: "https://www.cgdev.org/blog/four-practical-steps-to-jump-start-foreign-assistance-reform" }, kills: 0, wasteRecoveredM: 60, budgetCutB: 2, skipProtect: true, tone: "reform" },
];

// PROTECT — which programs you spare (only if the approach actually cuts). Values
// are each bundle's share of the modeled toll (from the disease breakdown).
export interface Protect extends Choice { sparedShare: number }
export const PROTECTS: Protect[] = [
  { id: "none", label: "Protect nothing", sub: "Everything goes into the chipper", detail: "No carve-outs — HIV, malaria, TB, vaccines, food and the rest all stop.", sparedShare: 0 },
  { id: "health", label: "Spare lifesaving health", sub: "Keep HIV, malaria, TB, vaccines", detail: "These four are ~73% of the modeled toll; the real waiver was meant to do this but failed in practice.", cite: { label: "The Intercept — the waiver that failed", url: "https://theintercept.com/2025/02/06/marco-rubio-usaid-humanitarian-waiver/" }, sparedShare: 0.73 },
  { id: "healthfood", label: "Spare health + food", sub: "Keep the above plus famine relief & nutrition", detail: "Adds food aid, RUTF and maternal health — ~95% of the modeled toll spared.", cite: { label: "UNICEF — children's nutrition cut", url: "https://www.unicef.org/press-releases/least-14-million-children-face-disruptions-critical-nutrition-services-2025-unicef" }, sparedShare: 0.95 },
];

// BACKFILL — do other donors / host governments fill the gap?
export interface Backfill extends Choice { factor: number }
export const BACKFILLS: Backfill[] = [
  { id: "none", label: "No one backfills", sub: "The US was 40%+ of global humanitarian aid", detail: "The US funded ~40%+ of global humanitarian aid and ~46% of WFP — no donor can absorb that quickly.", cite: { label: "Pew — US foreign aid", url: "https://www.pewresearch.org/short-reads/2025/02/06/what-the-data-says-about-us-foreign-aid/" }, factor: 1 },
  { id: "partial", label: "Partial backfill", sub: "Other donors cover about half", detail: "Optimistic: other donors and host budgets cover ~half of the gap over time.", factor: 0.5 },
  { id: "full", label: "Full backfill", sub: "Someone fully replaces the funding", detail: "Near best-case — the gap is largely closed; residual harm from the disruption itself.", factor: 0.12 },
];

// HORIZON — and the baseline modeled toll (full cut, no backfill) at each.
export interface Horizon extends Choice { base: { low: number; central: number; high: number }; cite: Cite }
export const HORIZONS: Horizon[] = [
  { id: "oneyear", label: "One year", sub: "The toll by early 2026", detail: "Lower-bound trackers: CGD ~0.5–1.6M lives lost; BU Impact Counter ~757,000 at the one-year mark.", cite: { label: "CGD — lives lost update", url: "https://www.cgdev.org/blog/update-lives-lost-usaid-cuts" }, base: { low: 500_000, central: 1_000_000, high: 1_600_000 } },
  { id: "to2030", label: "Through 2030", sub: "If the cuts persist to 2030", detail: "The Lancet's peer-reviewed projection: >14 million additional deaths by 2030 (8.5–19.7M), incl. 4.5M children under 5.", cite: { label: "The Lancet — Cavalcanti & Rasella et al.", url: "https://www.thelancet.com/article/S0140-6736(25)01186-9/fulltext" }, base: { low: 8_475_990, central: 14_051_750, high: 19_662_191 } },
];

export interface Outcome {
  deaths: { low: number; central: number; high: number };
  budgetCutB: number;
  budgetPct: number; // % of one year's federal outlays
  wasteRecoveredM: number;
  verdict: { title: string; body: string; tone: "destroy" | "mixed" | "reform" };
  cites: Cite[];
}

const FEDERAL_OUTLAYS_B = 6800; // ~$6.8T

export function project(aId: string, pId: string, bId: string, hId: string): Outcome {
  const a = APPROACHES.find((x) => x.id === aId)!;
  const p = PROTECTS.find((x) => x.id === pId) ?? PROTECTS[0]!;
  const b = BACKFILLS.find((x) => x.id === bId)!;
  const h = HORIZONS.find((x) => x.id === hId)!;
  const spared = a.skipProtect ? 1 : p.sparedShare; // reform/audit keep everything
  const f = a.kills * (1 - spared) * b.factor;
  const deaths = {
    low: Math.round(h.base.low * f),
    central: Math.round(h.base.central * f),
    high: Math.round(h.base.high * f),
  };
  const cites: Cite[] = [h.cite];
  if (a.cite) cites.push(a.cite);
  if (!a.skipProtect && p.cite) cites.push(p.cite);
  if (b.cite) cites.push(b.cite);

  let title: string, body: string;
  if (a.tone === "reform") {
    title = a.id === "audit" ? "You did what they said they were doing." : "You reformed it instead of ending it.";
    body = `You recovered ~$${a.wasteRecoveredM}M of documented waste and trimmed overhead, while the lifesaving programs kept running. Net withheld: ~$${a.budgetCutB}B — about ${((a.budgetCutB / FEDERAL_OUTLAYS_B) * 100).toFixed(2)}% of the federal budget. Modeled additional deaths on this path round to near zero.`;
  } else if (deaths.central < 50_000) {
    title = "Mostly spared — but you still broke the machine.";
    body = `Carve-outs and backfill held the modeled toll to roughly ${fmt(deaths.low)}–${fmt(deaths.high)}. You still withheld ~$${a.budgetCutB}B (~${((a.budgetCutB / FEDERAL_OUTLAYS_B) * 100).toFixed(2)}% of the budget) and addressed $0 of the actual documented waste.`;
  } else {
    title = a.id === "woodchipper" ? "Into the woodchipper." : "Frozen, then abandoned.";
    body = `Your path projects roughly ${fmt(deaths.low)}–${fmt(deaths.high)} additional deaths (modeled, central ${fmt(deaths.central)}). You withheld ~$${a.budgetCutB}B — about ${((a.budgetCutB / FEDERAL_OUTLAYS_B) * 100).toFixed(2)}% of one year's federal budget — and addressed essentially none of the ~$40M/half-year of documented waste a real audit targets.`;
  }
  return { deaths, budgetCutB: a.budgetCutB, budgetPct: (a.budgetCutB / FEDERAL_OUTLAYS_B) * 100, wasteRecoveredM: a.wasteRecoveredM, verdict: { title, body, tone: a.tone }, cites };
}

export function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1) + "M";
  if (n >= 1_000) return Math.round(n / 1_000) + "k";
  return String(Math.round(n));
}

// ── dashboard: the cut record ────────────────────────────────────────────────
export interface Program { name: string; funded: string; scale: string; cut: string; effect: string; projection: string; cite: Cite }
export const PROGRAMS: Program[] = [
  { name: "PEPFAR / HIV", funded: "Antiretroviral treatment, prevention, PMTCT", scale: "20.6M people on treatment", cut: "71% of 379 HIV awards terminated", effect: "Mozambique −14% new ART starts; PrEP initiation −41% (KFF FY25 Q4)", projection: "4.4–10.8M additional infections, 0.77–2.93M deaths by 2030 [modeled]", cite: { label: "WHO / Lancet HIV — ten Brink et al.", url: "https://www.who.int/news/item/26-03-2025-new-study-highlights-the-potential-impact-of-funding-cuts-on-the-hiv-response" } },
  { name: "Malaria (PMI)", funded: "Bed nets, antimalarials, spraying, diagnostics", scale: "$777.7M (2023); 37% of global malaria financing", cut: "80% of 157 awards terminated", effect: "~$76M of supplies undelivered; DRC Haut-Katanga >600 deaths in H1 2025", projection: "~14.9M additional cases, ~107,000 deaths in 2025 [modeled]", cite: { label: "Malaria Atlas Project (PMI 2025)", url: "https://malariaatlas.org/project-resources/pmi-2025/" } },
  { name: "Tuberculosis", funded: "Screening, treatment, labs, supply chains", scale: "Largest bilateral TB donor", cut: "79% of 162 awards terminated", effect: "Uganda TB notifications −14% (WHO, H1 2025)", projection: "Central 1.66M cases / 268,600 deaths by 2030 [modeled]", cite: { label: "PLOS Global Public Health — Stop TB", url: "https://journals.plos.org/globalpublichealth/article?id=10.1371/journal.pgph.0004899" } },
  { name: "Gavi / vaccines", funded: "Routine childhood immunization", scale: "US ~13% of Gavi", cut: "Future US funding withdrawn (Jun 2025)", effect: "Immunization campaigns delayed across low-income countries", projection: "75M children miss vaccination over 5 yrs → >1.2M child deaths [modeled]", cite: { label: "KFF — status of US support for Gavi", url: "https://www.kff.org/global-health-policy/the-trump-administrations-foreign-aid-review-status-of-u-s-support-for-gavi-the-vaccine-alliance/" } },
  { name: "Food for Peace", funded: "Emergency & famine food aid", scale: "US = ~46% of WFP funding (2024)", cut: "Program proposed for elimination; WFP stop-work", effect: "~66,000 MT / $98M food stranded; ~500 MT (27,000 kids' rations) set to be destroyed", projection: "WFP rations cut to a fraction of need across Somalia, DRC, Afghanistan", cite: { label: "Al Jazeera — food to be destroyed", url: "https://www.aljazeera.com/news/2025/7/16/usaid-food-for-nearly-30000-hungry-kids-to-be-destroyed-official" } },
  { name: "Nutrition (RUTF)", funded: "Therapeutic food for acute malnutrition", scale: "USAID ~half of global RUTF supply", cut: "Contracts to US makers Edesia & MANA cut", effect: "~5,000 t of Plumpy'Nut (484,000 children) stuck in storage", projection: ">2.4M severely malnourished children without RUTF in 2025 [modeled]", cite: { label: "UNICEF", url: "https://www.unicef.org/press-releases/least-14-million-children-face-disruptions-critical-nutrition-services-2025-unicef" } },
  { name: "Family planning", funded: "Contraception, maternal & reproductive health", scale: "Served 47.6M women/couples per year", cut: "85% of 233 awards terminated", effect: "~$9.7M of contraceptives slated for incineration in France", projection: "17.1M unintended pregnancies, 34,000 maternal deaths in one year [modeled]", cite: { label: "Guttmacher Institute", url: "https://www.guttmacher.org/2025/02/just-numbers-impact-us-international-family-planning-assistance-2024" } },
  { name: "Pandemic prep / Ebola", funded: "Disease surveillance & outbreak response", scale: "50-country surveillance network", cut: "615 of 770 global-health awards (80%) terminated", effect: "Musk said Ebola work was 'restored immediately'; AP found ≥4 of 5 Uganda contracts cut", projection: "66% of countries reported disrupted surveillance (WHO survey)", cite: { label: "NPR — Musk, Ebola & USAID", url: "https://www.npr.org/sections/goats-and-soda/2025/02/27/g-s1-50929/elon-musk-ebola-usaid" } },
];

// ── dashboard: the justification, fact-checked ───────────────────────────────
export interface FactCheck { claim: string; who: string; verdict: "False" | "Misleading" | "Accurate" | "Lacks context"; note: string; cite: Cite }
export const FACTCHECKS: FactCheck[] = [
  { claim: "$50 million in condoms to Gaza", who: "White House / Musk", verdict: "False", note: "No evidence any such spending existed; global condom spend was ~$8.2M. Musk later: 'some of the things I say will be incorrect.'", cite: { label: "PolitiFact", url: "https://www.politifact.com/factchecks/2025/jan/30/karoline-leavitt/no-the-us-did-not-spend-50-million-to-fund-condoms/" } },
  { claim: "$8 million to Politico", who: "Trump / DOGE", verdict: "Misleading", note: "USAID paid ~$44k for subscriptions; the $8M was the entire federal government's spend.", cite: { label: "FactCheck.org", url: "https://www.factcheck.org/2025/02/trump-online-posts-misrepresent-government-subscriptions-to-news-services/" } },
  { claim: "$20M for 'Sesame Street' in Iraq", who: "DOGE", verdict: "Misleading", note: "Funded 'Ahlan Simsim', an early-childhood-development program — not a TV show.", cite: { label: "FactCheck.org", url: "https://www.factcheck.org/2025/02/sorting-out-the-facts-on-waste-and-abuse-at-usaid/" } },
  { claim: "Transgender opera / comic / Ireland musical", who: "White House", verdict: "Misleading", note: "These were State Department grants, not USAID — and some were mischaracterized.", cite: { label: "FactCheck.org", url: "https://www.factcheck.org/2025/02/sorting-out-the-facts-on-waste-and-abuse-at-usaid/" } },
  { claim: "$1.5M to advance DEI in Serbia", who: "White House", verdict: "Accurate", note: "The one verified example of the 12 the White House cited — USAID did commit ~$1.5M.", cite: { label: "FactCheck.org", url: "https://www.factcheck.org/2025/02/sorting-out-the-facts-on-waste-and-abuse-at-usaid/" } },
  { claim: "USAID is 'a criminal organization' fed 'into the wood chipper'", who: "Elon Musk", verdict: "Lacks context", note: "Verified quotes (Feb 2–3 2025); rhetoric, not a finding. WaPo: 11 of 12 cited waste examples were false or misleading.", cite: { label: "WaPo Fact Checker (via summary)", url: "https://www.washingtonpost.com/politics/2025/02/07/usaid-trump-fact-checker/" } },
];

export const BUDGET = {
  usaidB: 43.8, // FY2023 disbursements
  allAidB: 71.9,
  federalB: 6800,
  publicGuessPct: 26, // what the public thinks foreign aid is
  realPct: 0.64, // USAID as % of federal budget
  wasteM: 40, // documented questioned costs, ~per half-year
  cite: { label: "Pew Research", url: "https://www.pewresearch.org/short-reads/2025/02/06/what-the-data-says-about-us-foreign-aid/" } as Cite,
  pollCite: { label: "KFF tracking poll", url: "https://www.kff.org/global-health-policy/kff-health-tracking-poll-february-2025-the-publics-views-on-global-health-and-usaid/" } as Cite,
};

export const STUDIES: { name: string; finding: string; kind: "Peer-reviewed" | "Agency" | "Think tank" | "Tracker"; cite: Cite }[] = [
  { name: "The Lancet (Cavalcanti, Rasella et al.)", finding: ">14M additional deaths by 2030 (8.5–19.7M); 4.5M children. USAID prevented ~91M deaths 2001–2021.", kind: "Peer-reviewed", cite: { label: "thelancet.com", url: "https://www.thelancet.com/article/S0140-6736(25)01186-9/fulltext" } },
  { name: "Center for Global Development", finding: "Lower-bound estimate of 0.5–1.6M lives lost in FY2025; authors call it 'guesswork'.", kind: "Think tank", cite: { label: "cgdev.org", url: "https://www.cgdev.org/blog/update-lives-lost-usaid-cuts" } },
  { name: "BU Impact Counter (Brooke Nichols)", finding: "~757,000 projected deaths at the one-year mark; an advocacy tracker built on peer-reviewed models. Disputed by Rubio & Musk.", kind: "Tracker", cite: { label: "impactcounter.com", url: "https://www.impactcounter.com/dashboard" } },
  { name: "USAID OIG / GAO", finding: "Clean financial audits; improper-payments compliant; documented questioned costs a fraction of 1% of spend.", kind: "Agency", cite: { label: "USAID OIG", url: "https://oig.usaid.gov/our-work/semiannual-report" } },
];
