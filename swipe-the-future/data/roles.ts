// Swipe the Future — Calibration · data layer.
// Content lives here, not in components. Claims + reveal notes are ported VERBATIM
// from the source-checked prototype; each source carries a resolvable primary URL.
// Adding a 6th role or 7th card is a data edit — no component change.

export type Verdict = "unlikely" | "contested" | "likely" | "already";

export interface Card {
  id: string;
  claim: string;
  verdict: Verdict;
  note: string; // grounded reveal, ≤ ~30 words
  source: { label: string; url?: string };
}

export interface Role {
  id: string;
  name: string;
  blurb: string;
  cards: Card[]; // exactly 6 for v1
}

// Verdict config — positions on the meter, labels, colours. Imported everywhere.
export const POS: Record<Verdict, number> = { unlikely: 0.12, contested: 0.45, likely: 0.74, already: 0.95 };
export const VLABEL: Record<Verdict, string> = { unlikely: "Unlikely", contested: "Contested", likely: "Likely", already: "Already real" };
export const VCOLOR: Record<Verdict, string> = { unlikely: "var(--oxblood)", contested: "var(--slate)", likely: "var(--verdigris)", already: "var(--brass)" };

// resolved primary sources (see brief appendix)
const S = {
  ai2027: { label: "AI Futures Project — AI 2027", url: "https://ai-2027.com/" },
  ai2027debate: { label: "AI 2027 · expert debate", url: "https://ai-2027.com/" },
  nistPqc: { label: "NIST PQC · NIST IR 8547", url: "https://www.nist.gov/news-events/news/2024/08/nist-releases-first-3-finalized-post-quantum-encryption-standards" },
  nist: { label: "NIST", url: "https://csrc.nist.gov/pubs/fips/203/final" },
  nistNsa: { label: "NIST · NSA", url: "https://www.nist.gov/news-events/news/2024/08/nist-releases-first-3-finalized-post-quantum-encryption-standards" },
  googleQ: { label: "Google Quantum AI, 2026", url: "https://arxiv.org/abs/2505.15917" },
  goldmanWef: { label: "Goldman Sachs · WEF 2025", url: "https://www.weforum.org/publications/the-future-of-jobs-report-2025/" },
  gallup: { label: "Gallup · J. of Cultural Economics, 2026", url: "https://www.gallup.com/394373/indicator-artificial-intelligence.aspx" },
  labor: { label: "Industry labor data, 2026", url: "https://www.weforum.org/publications/the-future-of-jobs-report-2025/" },
  adobe: { label: "Adobe", url: "https://news.adobe.com/news/2024/09/090924-adobe-firefly" },
  creative: { label: "Creative-industry studies, 2025–26", url: "https://www.weforum.org/publications/the-future-of-jobs-report-2025/" },
  cvl: { label: "CVL Economics, 2024", url: "https://animationguild.org/wp-content/uploads/2024/01/Future-Unscripted.pdf" },
  bloombergLaw: { label: "Bloomberg Law · court records", url: "https://news.bloomberglaw.com/" },
  natLawReview: { label: "National Law Review, 2026", url: "https://natlawreview.com/" },
  iprulings: { label: "2025–26 rulings", url: "https://www.uspto.gov/initiatives/artificial-intelligence" },
  hallucinationDb: { label: "AI Hallucination Cases Database", url: "https://www.damiencharlotin.com/hallucinations/" },
  deloitte: { label: "Deloitte on-chain study", url: "https://www.deloitte.com/global/en/services/financial-advisory/perspectives/quantum-computers-and-the-bitcoin-blockchain.html" },
  webberGoogle: { label: "Webber et al. · Google, 2026", url: "https://arxiv.org/abs/2505.15917" },
  drake: { label: "J. Drake · expert estimates", url: "https://ethresear.ch/" },
  kent: { label: "University of Kent, 2024", url: "https://www.kent.ac.uk/news" },
  community: { label: "2026 community consensus", url: "https://bitcoin.org/en/" },
  goldmanIea: { label: "Goldman Sachs · IEA", url: "https://www.goldmansachs.com/insights/articles/ai-data-centers-and-the-coming-us-power-demand-surge" },
  grid: { label: "Goldman Sachs · grid analyses", url: "https://www.goldmansachs.com/insights/articles/ai-data-centers-and-the-coming-us-power-demand-surge" },
  qroadmaps: { label: "Quantum industry roadmaps", url: "https://quantumai.google/" },
  bnef: { label: "BloombergNEF, 2025", url: "https://about.bnef.com/" },
  bnefIea: { label: "BNEF · IEA", url: "https://www.iea.org/reports/energy-and-ai" },
} as const;

export const ROLES: Role[] = [
  {
    id: "programmer", name: "Programmer", blurb: "Code · crypto-migration · automation",
    cards: [
      { id: "prog-1", claim: "Within a few years, AI writes the majority of new production code.", verdict: "contested", note: "The AI 2027 forecast projected near-total coding automation by early 2027 — but its own authors have since pushed that toward the early 2030s.", source: S.ai2027 },
      { id: "prog-2", claim: "You'll spend years rewriting working code just to defend it against quantum computers.", verdict: "likely", note: "NIST finalized post-quantum encryption standards in 2024; US federal systems must migrate by 2035. Anything touching encryption is in scope.", source: S.nistPqc },
      { id: "prog-3", claim: "A quantum computer can already break the encryption your apps use today.", verdict: "unlikely", note: "The most powerful machines run ~1,500 qubits. Breaking the elliptic-curve crypto most apps rely on is estimated to need 500,000+ physical qubits.", source: S.googleQ },
      { id: "prog-4", claim: "Quantum-proof encryption standards already exist and are ready to deploy.", verdict: "already", note: "NIST published the first finalized standards — FIPS 203, 204, 205 — in August 2024. The tools are here; the migration isn't.", source: S.nist },
      { id: "prog-5", claim: "An 'intelligence explosion' — AI rapidly improving AI — happens this decade.", verdict: "contested", note: "It's the engine of the AI 2027 scenario and the claim safety researchers fight over — plausible to some, science fiction to critics.", source: S.ai2027debate },
      { id: "prog-6", claim: "Encrypted data stolen from your systems today could be cracked open years from now.", verdict: "already", note: "This is the live 'harvest now, decrypt later' threat: long-lived secrets taken today are already exposed to a future quantum machine.", source: S.nistNsa },
    ],
  },
  {
    id: "designer", name: "Designer", blurb: "Generative tools · craft · displacement",
    cards: [
      { id: "des-1", claim: "Within a decade, AI handles most production-level design work.", verdict: "likely", note: "Goldman Sachs estimates ~26% of design tasks are automatable; the World Economic Forum lists graphic design among its fastest-declining jobs.", source: S.goldmanWef },
      { id: "des-2", claim: "Generative AI has already collapsed designers' wages.", verdict: "unlikely", note: "Despite the fear, large workforce datasets through 2024 show little measurable wage decline for AI-exposed creative roles — so far.", source: S.gallup },
      { id: "des-3", claim: "Freelance design postings are already falling as businesses switch to AI.", verdict: "already", note: "Freelance graphic-design job postings have dropped roughly 21% as routine work shifts to AI tools.", source: S.labor },
      { id: "des-4", claim: "AI tools have already generated tens of billions of images.", verdict: "already", note: "Adobe reports 22 billion+ assets created with Firefly since launch — now baked into Creative Cloud.", source: S.adobe },
      { id: "des-5", claim: "What survives is taste, judgment and direction — not production.", verdict: "likely", note: "The recurring finding: routine production gets automated while hybrid roles built on concept, context and AI fluency grow.", source: S.creative },
      { id: "des-6", claim: "Over 200,000 entertainment-industry jobs could be disrupted by AI within a few years.", verdict: "likely", note: "A 2024 industry study projected 200,000+ US entertainment jobs materially disrupted by generative AI within three years.", source: S.cvl },
    ],
  },
  {
    id: "lawyer", name: "Lawyer", blurb: "Hallucinations · research · privilege",
    cards: [
      { id: "law-1", claim: "Lawyers are already being fined by courts for AI 'hallucinated' citations.", verdict: "already", note: "Bloomberg Law counted 280+ filings with fabricated AI citations since 2023 — up sevenfold in 2025 — with sanctions from $1,000 to $30,000+.", source: S.bloombergLaw },
      { id: "law-2", claim: "Within a decade, AI handles most entry-level legal research.", verdict: "contested", note: "AI already does research and contract review, but courts insist on human verification and the field is split on how far junior work shrinks.", source: S.natLawReview },
      { id: "law-3", claim: "Courts will create a brand-new rule built specifically for AI-fabricated filings.", verdict: "likely", note: "Legal observers expect the Advisory Committee on Civil Rules to propose a separate rule for AI-hallucination sanctions.", source: S.natLawReview },
      { id: "law-4", claim: "AI can be named as the inventor on a patent or the author of a copyright.", verdict: "unlikely", note: "Across major jurisdictions, courts have ruled AI cannot be an inventor or author under current intellectual-property law.", source: S.iprulings },
      { id: "law-5", claim: "Hundreds of AI fake-citation cases already span dozens of countries.", verdict: "already", note: "Trackers logged roughly 800 documented AI citation-error cases across 25+ jurisdictions by late 2025.", source: S.hallucinationDb },
      { id: "law-6", claim: "Your firm's privileged files could be decrypted retroactively once quantum matures.", verdict: "likely", note: "'Harvest now, decrypt later' applies to any long-confidential record — legal files are a prime target.", source: S.nistNsa },
    ],
  },
  {
    id: "crypto", name: "Crypto trader", blurb: "Q-Day · wallets · ECDSA",
    cards: [
      { id: "cry-1", claim: "A quantum computer could one day lift Bitcoin straight out of vulnerable wallets.", verdict: "likely", note: "Around 25% of all BTC — roughly 4 million coins — sit in addresses with exposed public keys, the part a quantum attacker could target.", source: S.deloitte },
      { id: "cry-2", claim: "Breaking Bitcoin's keys needs far more qubits than any machine has today.", verdict: "already", note: "Estimates run from hundreds of thousands to millions of qubits; today's best machines manage ~1,500. True — for now.", source: S.webberGoogle },
      { id: "cry-3", claim: "2026 research made breaking Bitcoin's encryption look closer than expected.", verdict: "already", note: "A March 2026 Google paper cut the estimate roughly 20-fold — from ~20 million qubits to under 500,000 — compressing the timeline.", source: S.webberGoogle },
      { id: "cry-4", claim: "There's a real chance a quantum computer cracks an exposed Bitcoin key by ~2032.", verdict: "contested", note: "Bitcoin researcher Justin Drake put it at 10%+ by 2032; others call it far off. Genuinely contested.", source: S.drake },
      { id: "cry-5", claim: "Even if Bitcoin upgrades, moving every coin to safety could take months of gridlock.", verdict: "likely", note: "Migrating all vulnerable coins is estimated at ~76 days of dedicated blockspace — and ~2 years at realistic network usage.", source: S.kent },
      { id: "cry-6", claim: "Moving your coins to a fresh address already lowers your quantum exposure.", verdict: "already", note: "Reused and legacy addresses expose the public key; a fresh, unspent address keeps it hidden. Good practice today.", source: S.community },
    ],
  },
  {
    id: "energy", name: "Energy sector", blurb: "Data-center demand · grid · materials",
    cards: [
      { id: "ene-1", claim: "AI data centers drive a massive jump in electricity demand this decade.", verdict: "already", note: "Goldman Sachs projects ~165% growth in data-center power demand by 2030; the IEA sees data-center electricity roughly doubling to ~945 TWh.", source: S.goldmanIea },
      { id: "ene-2", claim: "By 2030, AI data centers could consume as much power as a mid-sized country.", verdict: "likely", note: "Estimates add ~200 TWh of annual demand globally — comparable to the entire electricity use of Poland or Vietnam.", source: S.goldmanIea },
      { id: "ene-3", claim: "The grid can be expanded fast enough to keep pace with AI's demand.", verdict: "unlikely", note: "Roughly $720B of grid investment is needed by 2030, and interconnection queues already run past five years. The bottleneck is real.", source: S.grid },
      { id: "ene-4", claim: "Quantum computers could help design better batteries and clean-energy materials.", verdict: "likely", note: "Materials and chemistry simulation is one of the most credible near-term uses of quantum computing.", source: S.qroadmaps },
      { id: "ene-5", claim: "AI data-center demand is already colliding with the limits of the grid.", verdict: "already", note: "In the largest US grid (PJM), forecast data-center load is closing in on nearly all the new generation expected by 2030.", source: S.bnef },
      { id: "ene-6", claim: "AI's electricity appetite reshapes national energy policy this decade.", verdict: "likely", note: "Demand from data centers is already pushing utilities, regulators and governments to rethink generation and transmission.", source: S.bnefIea },
    ],
  },
];

// alignment + profiles (ported from prototype)
export function isAligned(verdict: Verdict, believe: boolean): boolean {
  if (verdict === "contested") return true; // never penalised
  if (verdict === "unlikely") return believe === false;
  return believe === true; // likely / already
}

export interface Profile { name: string; desc: string; lblNote: string }
export function profileFor(matched: number, total: number, over: number, under: number): Profile {
  const rate = total ? matched / total : 0;
  if (under >= 2 && under > over)
    return { name: "Caught Flat-Footed", desc: "The future you think you're waiting for is partly here already. You under-read how much has shipped.", lblNote: "but the present outran you" };
  if (over >= 2 && over > under)
    return { name: "The Accelerationist", desc: "You lean ahead of the evidence — quick to believe the bold claim before it's earned. Useful instinct, but check the qubit count.", lblNote: "running ahead of the proof" };
  if (rate >= 0.8)
    return { name: "Well Calibrated", desc: "Your gut tracks where the evidence actually sits — neither hyped nor in denial. Rare.", lblNote: "and your instincts held" };
  if (rate >= 0.5)
    return { name: "Roughly Tuned", desc: "You're in the right neighbourhood but a few cards slipped — usually the ones that are further along than they feel.", lblNote: "with a few blind spots" };
  return { name: "The Skeptic", desc: "You resist the narrative hard — sometimes past the point where the evidence has caught up. Doubt is cheap; calibration isn't.", lblNote: "but doubt overshot the data" };
}
