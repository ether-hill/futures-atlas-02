// Swipe the Future. Calibration · data layer.
// Content lives here, not in components. Claims + reveal notes are ported VERBATIM
// from the source-checked prototype; each source carries a resolvable primary URL.
// Adding a sector or a card is a data edit, no component change.
//
// A deck is a Sector. `kind: "sector"` decks are lines of work / fields of
// activity (Military & Defence, Education, Agriculture & Food…); `kind: "wildcard"`
// decks are the themed ones (Curveballs, Hype check, The oracles). Sectors people
// type in themselves arrive at runtime from /api/swipe/sector with
// `kind: "generated"` and carry an "AI-drafted" badge until an editor approves them.

export type Verdict = "unlikely" | "contested" | "likely" | "already";
export type SectorKind = "sector" | "wildcard" | "generated";

export interface Card {
  id: string;
  claim: string;
  verdict: Verdict;
  note: string; // grounded reveal, ≤ ~30 words
  source: { label: string; url?: string };
  attribution?: string; // present on "quote" cards, who said it (renders as a quote)
  checked?: string; // ISO date the claim was last verified against its source
}

export interface Sector {
  id: string;
  kind: SectorKind;
  name: string;
  blurb: string;
  cards: Card[];
  approved?: boolean; // generated decks only, false until an editor signs off
}

// Verdict config, positions on the meter, labels, colours. Imported everywhere.
// The scale runs false → true; "contested" is the honest middle, shown as KINDA.
export const POS: Record<Verdict, number> = { unlikely: 0.12, contested: 0.45, likely: 0.74, already: 0.95 };
// Said in the same currency as the buttons. "Evidence: Not true" next to
// "50% said false" made people translate between two vocabularies for no reason.
export const VLABEL: Record<Verdict, string> = { unlikely: "False", contested: "Kinda", likely: "True", already: "Already real" };
export const VCOLOR: Record<Verdict, string> = { unlikely: "var(--oxblood)", contested: "var(--slate)", likely: "var(--verdigris)", already: "var(--brass)" };
// How true a claim is, 0 (false) → 1 (already real). Drives the stats page's x-axis.
// Two different things, kept apart on purpose.
//
// RUNG is the claim's position on the x axis: four ordinal steps, evenly spaced,
// because "false → kinda → true → already real" is a ladder, not a ruler.
//
// EXPECTED is how many people *should* say TRUE if they read the evidence right.
// It has to agree with how the game scores an answer: TRUE is the correct answer
// for both "true" and "already real", so both expect 100%. Putting "true" at 80%
// made a crowd that answered it correctly look over-credulous on the map.
export const RUNG: Record<Verdict, number> = { unlikely: 0, contested: 1, likely: 2, already: 3 };
export const EXPECTED: Record<Verdict, number> = { unlikely: 0, contested: 0.5, likely: 1, already: 1 };

// resolved primary sources (see brief appendix)
const S = {
  ai2027: { label: "AI Futures Project, AI 2027", url: "https://ai-2027.com/" },
  ai2027debate: { label: "AI Futures Project, AI 2027 and its critics", url: "https://ai-2027.com/" },
  nistPqc: { label: "NIST PQC · NIST IR 8547", url: "https://www.nist.gov/news-events/news/2024/08/nist-releases-first-3-finalized-post-quantum-encryption-standards" },
  nist: { label: "NIST, FIPS 203", url: "https://csrc.nist.gov/pubs/fips/203/final" },
  nistNsa: { label: "NIST · NSA", url: "https://www.nist.gov/news-events/news/2024/08/nist-releases-first-3-finalized-post-quantum-encryption-standards" },
  googleQ: { label: "Google Quantum AI, 2026", url: "https://arxiv.org/abs/2505.15917" },
  goldmanWef: { label: "Goldman Sachs · WEF 2025", url: "https://www.weforum.org/publications/the-future-of-jobs-report-2025/" },
  gallup: { label: "Gallup · J. of Cultural Economics, 2026", url: "https://www.gallup.com/394373/indicator-artificial-intelligence.aspx" },
  labor: { label: "Hui, Reshef and Zhou, 2024", url: "https://questromworld.bu.edu/platformstrategy/wp-content/uploads/sites/49/2024/06/PlatStrat2024_paper_119.pdf" },
  adobe: { label: "Adobe, Firefly (Sept 2024)", url: "https://news.adobe.com/news/2024/09/090924-adobe-firefly" },
  creative: { label: "WEF Future of Jobs 2025", url: "https://www.weforum.org/publications/the-future-of-jobs-report-2025/" },
  cvl: { label: "CVL Economics, 2024", url: "https://animationguild.org/wp-content/uploads/2024/01/Future-Unscripted.pdf" },
  bloombergLaw: { label: "Bloomberg Law · court records", url: "https://news.bloomberglaw.com/" },
  natLawReview: { label: "National Law Review, 2026", url: "https://natlawreview.com/" },
  iprulings: { label: "Thaler v. Vidal · Thaler v. Perlmutter (2026)", url: "https://www.hklaw.com/en/insights/publications/2026/03/the-final-word-supreme-court-refuses-to-hear-case-on-ai-authorship" },
  hallucinationDb: { label: "AI Hallucination Cases Database", url: "https://www.damiencharlotin.com/hallucinations/" },
  deloitte: { label: "Deloitte on-chain study", url: "https://www.deloitte.com/global/en/services/financial-advisory/perspectives/quantum-computers-and-the-bitcoin-blockchain.html" },
  webberGoogle: { label: "Webber et al. · Google, 2026", url: "https://arxiv.org/abs/2505.15917" },
  drake: { label: "Justin Drake, Ethereum Foundation", url: "https://ethresear.ch/" },
  kent: { label: "University of Kent, 2024", url: "https://www.kent.ac.uk/news" },
  community: { label: "River, Bitcoin and quantum computing", url: "https://river.com/learn/will-quantum-computing-break-bitcoin/" },
  goldmanIea: { label: "Goldman Sachs · IEA, power demand", url: "https://www.goldmansachs.com/insights/articles/ai-data-centers-and-the-coming-us-power-demand-surge" },
  grid: { label: "Goldman Sachs, AI data centers and US power demand", url: "https://www.goldmansachs.com/insights/articles/ai-data-centers-and-the-coming-us-power-demand-surge" },
  qroadmaps: { label: "Google Quantum AI, applications", url: "https://quantumai.google/" },
  bnef: { label: "BloombergNEF, 2025", url: "https://about.bnef.com/" },
  bnefIea: { label: "BNEF · IEA", url: "https://www.iea.org/reports/energy-and-ai" },
} as const;

export const SECTORS: Sector[] = [
  {
    id: "software", kind: "sector", name: "Software & Code", blurb: "Automation · crypto-migration · who writes the code",
    cards: [
      { id: "prog-1", claim: "Within a few years, AI writes the majority of new production code.", verdict: "contested", note: "The AI 2027 forecast projected near-total coding automation by early 2027, but its own authors have since pushed that toward the early 2030s.", source: S.ai2027 },
      { id: "prog-2", claim: "You'll spend years rewriting working code just to defend it against quantum computers.", verdict: "likely", note: "NIST finalized post-quantum encryption standards in 2024; US federal systems must migrate by 2035. Anything touching encryption is in scope.", source: S.nistPqc },
      { id: "prog-3", claim: "A quantum computer can already break the encryption your apps use today.", verdict: "unlikely", note: "The most powerful machines run ~1,500 qubits. Breaking the elliptic-curve crypto most apps rely on is estimated to need 500,000+ physical qubits.", source: S.googleQ },
      { id: "prog-4", claim: "Quantum-proof encryption standards already exist and are ready to deploy.", verdict: "already", note: "NIST published the first finalized standards, FIPS 203, 204, 205, in August 2024. The tools are here; the migration isn't.", source: S.nist },
      { id: "prog-5", claim: "An intelligence explosion, where AI rapidly improves itself, happens this decade.", verdict: "contested", note: "It's the engine of the AI 2027 scenario and the claim safety researchers fight over, plausible to some, science fiction to critics.", source: S.ai2027debate },
      { id: "prog-6", claim: "Encrypted data stolen from your systems today could be cracked open years from now.", verdict: "already", note: "This is the live 'harvest now, decrypt later' threat: long-lived secrets taken today are already exposed to a future quantum machine.", source: S.nistNsa },
    ],
  },
  {
    id: "design", kind: "sector", name: "Design & Creative", blurb: "Generative tools · craft · displacement",
    cards: [
      { id: "des-1", claim: "Within a decade, AI handles most production-level design work.", verdict: "likely", note: "Goldman Sachs estimates ~26% of design tasks are automatable; the World Economic Forum lists graphic design among its fastest-declining jobs.", source: S.goldmanWef },
      { id: "des-2", claim: "Generative AI has already collapsed designers' wages.", verdict: "unlikely", note: "Despite the fear, large workforce datasets through 2024 show little measurable wage decline for AI-exposed creative roles, so far.", source: S.gallup },
      { id: "des-3", claim: "Freelance design postings are already falling as businesses switch to AI.", verdict: "already", note: "A study of five million Upwork postings found graphic-design listings fell about 17% after the image generators arrived.", source: S.labor },
      { id: "des-4", claim: "AI tools have already generated tens of billions of images.", verdict: "already", note: "Adobe reports 22 billion+ assets created with Firefly since launch, now baked into Creative Cloud.", source: S.adobe },
      { id: "des-5", claim: "What survives in design is taste, judgment and direction, not production work.", verdict: "likely", note: "The recurring finding: routine production gets automated while hybrid roles built on concept, context and AI fluency grow.", source: S.creative },
      { id: "des-6", claim: "Over 200,000 entertainment-industry jobs could be disrupted by AI within a few years.", verdict: "likely", note: "A 2024 industry study projected 200,000+ US entertainment jobs materially disrupted by generative AI within three years.", source: S.cvl },
    ],
  },
  {
    id: "law", kind: "sector", name: "Law & Justice", blurb: "Hallucinations · research · privilege",
    cards: [
      { id: "law-1", claim: "Lawyers are already being fined by courts for AI 'hallucinated' citations.", verdict: "already", note: "Bloomberg Law counted 280+ filings with fabricated AI citations since 2023, up sevenfold in 2025, with sanctions from $1,000 to $30,000+.", source: S.bloombergLaw },
      { id: "law-2", claim: "Within a decade, AI handles most entry-level legal research.", verdict: "contested", note: "AI already does research and contract review, but courts insist on human verification and the field is split on how far junior work shrinks.", source: S.natLawReview },
      { id: "law-3", claim: "Courts will create a brand-new rule built specifically for AI-fabricated filings.", verdict: "likely", note: "Legal observers expect the Advisory Committee on Civil Rules to propose a separate rule for AI-hallucination sanctions.", source: S.natLawReview },
      { id: "law-4", claim: "AI can be named as the inventor on a patent or the author of a copyright.", verdict: "unlikely", note: "Thaler v. Vidal settled the patent side in 2022. In March 2026 the Supreme Court refused to hear the copyright appeal, leaving human authorship a hard requirement.", source: S.iprulings },
      { id: "law-5", claim: "Hundreds of AI fake-citation cases already span dozens of countries.", verdict: "already", note: "Trackers logged roughly 800 documented AI citation-error cases across 25+ jurisdictions by late 2025.", source: S.hallucinationDb },
      { id: "law-6", claim: "Your firm's privileged files could be decrypted retroactively once quantum matures.", verdict: "likely", note: "'Harvest now, decrypt later' applies to any long-confidential record. Legal files are a prime target.", source: S.nistNsa },
    ],
  },
  {
    id: "money", kind: "sector", name: "Money & Crypto", blurb: "Q-Day · wallets · ECDSA",
    cards: [
      { id: "cry-1", claim: "A quantum computer could one day lift Bitcoin straight out of vulnerable wallets.", verdict: "likely", note: "Around 25% of all BTC, roughly 4 million coins, sit in addresses with exposed public keys, the part a quantum attacker could target.", source: S.deloitte },
      { id: "cry-2", claim: "Breaking Bitcoin's keys needs far more qubits than any machine has today.", verdict: "already", note: "Estimates run from hundreds of thousands to millions of qubits; today's best machines manage ~1,500. True, for now.", source: S.webberGoogle },
      { id: "cry-3", claim: "2026 research made breaking Bitcoin's encryption look closer than expected.", verdict: "already", note: "A March 2026 Google paper cut the estimate roughly 20-fold, from ~20 million qubits to under 500,000, compressing the timeline.", source: S.webberGoogle },
      { id: "cry-4", claim: "There's a real chance a quantum computer cracks an exposed Bitcoin key by ~2032.", verdict: "contested", note: "Bitcoin researcher Justin Drake put it at 10%+ by 2032; others call it far off. Genuinely contested.", source: S.drake },
      { id: "cry-5", claim: "Even if Bitcoin upgrades, moving every coin to safety could take months of gridlock.", verdict: "likely", note: "Migrating all vulnerable coins is estimated at ~76 days of dedicated blockspace, and ~2 years at realistic network usage.", source: S.kent },
      { id: "cry-6", claim: "Moving your coins to a fresh address already lowers your quantum exposure.", verdict: "already", note: "Reused and legacy addresses expose the public key; a fresh, unspent address keeps it hidden. Good practice today.", source: S.community },
    ],
  },
  {
    id: "energy", kind: "sector", name: "Energy & Grid", blurb: "Data-center demand · grid · materials",
    cards: [
      { id: "ene-1", claim: "AI data centers drive a massive jump in electricity demand this decade.", verdict: "already", note: "Goldman Sachs projects ~165% growth in data-center power demand by 2030; the IEA sees data-center electricity roughly doubling to ~945 TWh.", source: S.goldmanIea },
      { id: "ene-2", claim: "By 2030, AI data centers could consume as much power as a mid-sized country.", verdict: "likely", note: "Estimates add ~200 TWh of annual demand globally, comparable to the entire electricity use of Poland or Vietnam.", source: S.goldmanIea },
      { id: "ene-3", claim: "The grid can be expanded fast enough to keep pace with AI's demand.", verdict: "unlikely", note: "Roughly $720B of grid investment is needed by 2030, and interconnection queues already run past five years. The bottleneck is real.", source: S.grid },
      { id: "ene-4", claim: "Quantum computers could help design better batteries and clean-energy materials.", verdict: "likely", note: "Materials and chemistry simulation is one of the most credible near-term uses of quantum computing.", source: S.qroadmaps },
      { id: "ene-5", claim: "AI data-center demand is already colliding with the limits of the grid.", verdict: "already", note: "In the largest US grid (PJM), forecast data-center load is closing in on nearly all the new generation expected by 2030.", source: S.bnef },
      { id: "ene-6", claim: "AI's electricity appetite reshapes national energy policy this decade.", verdict: "likely", note: "Demand from data centers is already pushing utilities, regulators and governments to rethink generation and transmission.", source: S.bnefIea },
    ],
  },

  // ── additional categories (research-sourced; see git log) ──────────────────
  {
    id: "health", kind: "sector", name: "Health & Medicine", blurb: "Diagnosis · admin burden · clinical AI",
    cards: [
      { id: "doc-1", claim: "An AI device can already diagnose a disease and report the result with no doctor reading it.", verdict: "already", note: "In 2018 the FDA cleared IDx-DR (now LumineticsCore), the first autonomous AI detecting diabetic retinopathy with no clinician interpreting the image.", source: { label: "FDA / Digital Diagnostics", url: "https://www.digitaldiagnostics.com/fda-permits-marketing-of-lumineticscore-formerly-known-as-idx-dr-for-automated-detection-of-diabetic-retinopathy-in-primary-care/" } },
      { id: "doc-2", claim: "AI 'scribes' that listen to visits and write the notes are already cutting doctor burnout.", verdict: "already", note: "A 2024 six-system study and a Stanford trial found ambient AI scribes significantly reduced documentation time and burnout; Kaiser logged ~15,791 hours saved.", source: { label: "JAMA-cited study (PMC)", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC12492056/" } },
      { id: "doc-3", claim: "In a controlled test, GPT-4 on its own out-diagnosed doctors, including doctors who had GPT-4 to help them.", verdict: "already", note: "A 2024 JAMA Network Open trial found GPT-4 alone beat physicians on clinical vignettes; giving doctors the tool didn't improve their reasoning much.", source: { label: "Stanford Medicine / JAMA", url: "https://medicine.stanford.edu/news/current-news/standard-news/GPT-diagnostic-reasoning.html" } },
      { id: "doc-4", claim: "AI in breast-screening can cut radiologists' reading workload by nearly half without missing more cancers.", verdict: "likely", note: "Sweden's 105,000-woman MASAI trial cut screen-reading workload 44% and raised cancer detection, still with a human radiologist in the loop.", source: { label: "Lancet Digital Health (MASAI)", url: "https://www.thelancet.com/journals/landig/article/PIIS2589-7500(24)00267-X/fulltext" } },
      { id: "doc-5", claim: "Whether AI net-replaces clinicians or just augments them is genuinely unsettled among experts.", verdict: "contested", note: "Strong diagnostic results exist, but clean vignettes flatter AI; real clinics face messy data, liability and integration gaps. Experts split on the net effect.", source: { label: "Univ. of Minnesota Medical School", url: "https://med.umn.edu/news/ai-healthcare-new-research-shows-promise-and-limitations-physicians-working-gpt-4-decision-making" } },
      { id: "doc-6", claim: "AI made radiologists obsolete, just as the 'Godfather of AI' predicted in 2016.", verdict: "unlikely", note: "Hinton said stop training radiologists; a decade on, demand surges, average pay hit ~$571K, and he has conceded he was wrong on timing.", source: { label: "Fortune", url: "https://fortune.com/2026/05/04/godfather-of-ai-geoffrey-hinton-radiologists-future-of-work-tech-ai-job-anxiety/" } },
    ],
  },
  {
    id: "education", kind: "sector", name: "Education", blurb: "Tutoring AI · cheating · the classroom",
    cards: [
      { id: "tch-1", claim: "Roughly a quarter of US teens already use ChatGPT to help with their homework.", verdict: "already", note: "A 2024 Pew survey found about 26% of US teens aged 13–17 had used ChatGPT for schoolwork, double the share from the year before.", source: { label: "Pew Research / EdWeek", url: "https://www.edweek.org/technology/new-data-reveal-how-many-students-are-using-ai-to-cheat/2024/04" } },
      { id: "tch-2", claim: "AI-writing detectors are reliable enough to safely catch students cheating.", verdict: "unlikely", note: "A Stanford study found detectors flagged 61% of non-native-English essays as AI; Vanderbilt and others disabled Turnitin's detector over false positives.", source: { label: "Stanford (arXiv)", url: "https://arxiv.org/abs/2304.02819" } },
      { id: "tch-3", claim: "Khan Academy's GPT-4 tutor Khanmigo has scaled to hundreds of thousands of students.", verdict: "already", note: "Khanmigo grew from ~68,000 users in its 2023–24 pilot to over 700,000 in 2024–25, though rigorous learning-gain studies are still ongoing.", source: { label: "Khan Academy", url: "https://blog.khanacademy.org/khan-academy-efficacy-results-november-2024/" } },
      { id: "tch-4", claim: "AI tutors reliably boost students' test scores better than normal teaching.", verdict: "contested", note: "Early studies are mixed: some show learning gains, but controlled trials often find no significant test-score difference versus other methods. Evidence is thin.", source: { label: "J. of Teaching and Learning", url: "https://jtl.uwindsor.ca/index.php/jtl/article/view/10052" } },
      { id: "tch-5", claim: "Since ChatGPT launched, overall student cheating rates have surged far above historical levels.", verdict: "contested", note: "A multi-year high-school study found overall cheating stayed roughly stable (~72%) before and after ChatGPT, even as AI-specific use rose.", source: { label: "Computers & Education: AI", url: "https://www.sciencedirect.com/science/article/pii/S2666920X24000560" } },
      { id: "tch-6", claim: "AI grades student essays as consistently as human teachers do.", verdict: "unlikely", note: "Studies comparing AI and instructor grading of essays found little agreement, with AI tending to grade more leniently and inconsistently.", source: { label: "arXiv (instructor–AI grading)", url: "https://arxiv.org/abs/2501.06461" } },
    ],
  },
  {
    id: "media", kind: "sector", name: "Media & Journalism", blurb: "Automated copy · trust · investigations",
    cards: [
      { id: "jrn-1", claim: "A major newswire already auto-writes thousands of corporate earnings stories with no human writing them.", verdict: "already", note: "The AP has used natural-language generation since 2014, scaling earnings coverage from ~300 to thousands of stories per quarter straight from data feeds.", source: { label: "Poynter", url: "https://www.poynter.org/reporting-editing/2015/robot-writing-increased-aps-earnings-stories-by-tenfold/" } },
      { id: "jrn-2", claim: "A major magazine was caught publishing AI-written articles under fake, AI-generated author profiles.", verdict: "already", note: "In 2023 Futurism revealed Sports Illustrated ran articles bylined to invented writers with AI-generated headshots; CNET also corrected dozens of AI stories.", source: { label: "NPR", url: "https://www.npr.org/2023/11/28/1215693615/sports-illustrated-is-accused-of-posting-articles-by-writers-created-by-ai" } },
      { id: "jrn-3", claim: "AI chatbots can be trusted to summarise the news accurately.", verdict: "unlikely", note: "A 2025 BBC/EBU study of 3,000+ responses found 45% had a significant issue and 81% some error; ChatGPT, Gemini, Copilot and Perplexity all distorted news.", source: { label: "BBC / EBU", url: "https://www.theregister.com/2025/10/24/bbc_probe_ai_news/" } },
      { id: "jrn-4", claim: "Investigative reporters already use machine learning to dig through millions of leaked documents.", verdict: "already", note: "ICIJ used machine learning in the 2021 Pandora Papers to flag relevant files among 11.9 million records (2.94 TB) for 600+ journalists.", source: { label: "ICIJ", url: "https://www.icij.org/tags/machine-learning/" } },
      { id: "jrn-5", claim: "AI will let newsrooms cut most beat reporters within a few years.", verdict: "contested", note: "Automation has expanded routine output and triggered some cuts, but outlets argue AI frees reporters for investigations; the net staffing effect is disputed.", source: { label: "Nieman Lab", url: "https://www.niemanlab.org/2023/10/the-ap-announces-five-ai-tools-to-help-local-newsrooms-with-tasks-like-transcription-and-sorting-pitches/" } },
      { id: "jrn-6", claim: "AI can do the shoe-leather reporting: interviewing sources and checking facts on the ground.", verdict: "unlikely", note: "AI assists with data and drafting, but field reporting, source relationships and verification remain human; the BBC study showed AI's own facts can't be trusted.", source: { label: "BBC / EBU (The Register)", url: "https://www.theregister.com/2025/10/24/bbc_probe_ai_news/" } },
    ],
  },
  {
    id: "accounting", kind: "sector", name: "Accounting & Audit", blurb: "Bookkeeping · audit · advisory",
    cards: [
      { id: "acc-1", claim: "A Big Four firm has already cut staff and credited new AI audit tools with the redundancy.", verdict: "already", note: "KPMG moved to lay off ~10% of US audit partners, citing AI audit tools that made some manager roles redundant; all Big Four firms cut jobs recently.", source: { label: "TheStreet", url: "https://www.thestreet.com/markets/big-four-accounting-faces-reckoning-theyre-choosing-ai-over-humans-cutting-benefits-and-hiring" } },
      { id: "acc-2", claim: "Routine bookkeeping and data-entry roles are among the jobs AI is set to shrink fastest.", verdict: "likely", note: "The WEF 2025 Future of Jobs Report lists accounting, bookkeeping and payroll clerks among the fastest-declining roles this decade as AI handles routine tasks.", source: { label: "World Economic Forum", url: "https://www.weforum.org/stories/2025/01/future-of-jobs-report-2025-the-fastest-growing-and-declining-jobs/" } },
      { id: "acc-3", claim: "Adoption of generative AI inside tax, audit and accounting firms roughly tripled in a single year.", verdict: "already", note: "Thomson Reuters found firms using generative AI jumped from 8% in 2024 to 21% in 2025.", source: { label: "Thomson Reuters", url: "https://tax.thomsonreuters.com/blog/how-will-ai-affect-accounting-jobs-tri/" } },
      { id: "acc-4", claim: "Despite AI, official US projections still show overall accountant employment growing this decade.", verdict: "likely", note: "BLS projects accountants and auditors growing ~5% from 2024–2034, with roughly 124,200 openings a year, even as entry-level bookkeeping declines.", source: { label: "US Bureau of Labor Statistics", url: "https://www.bls.gov/ooh/business-and-financial/accountants-and-auditors.htm" } },
      { id: "acc-5", claim: "AI can replace the human judgment in tax strategy, audit calls and client advisory work.", verdict: "unlikely", note: "AI automates data entry and reconciliation, but ambiguous transactions, regulatory nuance, ethics and advisory judgment still require accountants.", source: { label: "Stanford GSB", url: "https://www.gsb.stanford.edu/insights/ai-reshaping-accounting-jobs-doing-boring-stuff" } },
      { id: "acc-6", claim: "AI is the main reason fewer people are becoming accountants.", verdict: "contested", note: "The pipeline shrank since 2010 and CPA exam-takers fell ~33% from 2016–2021, but causes cited are pay, the 150-hour rule and burnout more than AI.", source: { label: "The CPA Journal", url: "https://www.cpajournal.com/2024/11/25/the-accounting-profession-is-in-crisis-2/" } },
    ],
  },
  {
    id: "transport", kind: "sector", name: "Transport & Logistics", blurb: "Robotaxis · trucking · last mile",
    cards: [
      { id: "drv-1", claim: "Robotaxis already carry paying passengers with no human driver, at around half a million rides a week.", verdict: "already", note: "Waymo reported 500,000 paid driverless rides a week across 10 US cities by March 2026, up from 250,000 a year earlier.", source: { label: "TechCrunch (Mar 2026)", url: "https://techcrunch.com/2026/03/27/waymo-skyrocketing-ridership-in-one-chart/" } },
      { id: "drv-2", claim: "Driverless cars already crash far less than humans do, with roughly 90% fewer serious-injury wrecks.", verdict: "already", note: "A peer-reviewed 2025 study found Waymo had significantly lower injury-crash rates than humans over 56.7 million driverless miles.", source: { label: "Traffic Injury Prevention (2025)", url: "https://www.tandfonline.com/doi/full/10.1080/15389588.2025.2499887" } },
      { id: "drv-3", claim: "Long-haul trucks now drive themselves on public highways with no one in the cab.", verdict: "already", note: "Aurora launched commercial driverless freight between Dallas and Houston on May 1, 2025, the first heavy-truck self-driving service on public roads.", source: { label: "Aurora Innovation", url: "https://ir.aurora.tech/news-events/press-releases/detail/119/aurora-begins-commercial-driverless-trucking-in-texas-ushering-in-a-new-era-of-freight" } },
      { id: "drv-4", claim: "Tesla's robotaxi has already replaced human drivers at scale across cities.", verdict: "unlikely", note: "Tesla's Austin service runs only a handful of cars; even its 2026 'no safety driver' launch mixed a few cars into a monitored fleet with a chase car.", source: { label: "Electrek", url: "https://electrek.co/2025/12/22/tesla-robotaxi-project-austin-much-smaller-than-musk-claims/" } },
      { id: "drv-5", claim: "Automation will gut America's 2.2 million trucking jobs within the next decade.", verdict: "contested", note: "BLS projects heavy-truck driver jobs to keep growing (~4% to 2034, ~238,000 openings a year); analysts say mainly the long-haul slice is exposed.", source: { label: "US Bureau of Labor Statistics", url: "https://www.bls.gov/ooh/transportation-and-material-moving/heavy-and-tractor-trailer-truck-drivers.htm" } },
      { id: "drv-6", claim: "Sidewalk robots are taking over last-mile delivery, displacing courier work.", verdict: "likely", note: "Starship passed 8 million autonomous deliveries by April 2025 with 2,700+ robots in 270+ locations, growing fast, but still niche versus human couriers.", source: { label: "The Robot Report", url: "https://www.therobotreport.com/starship-technologies-surpasses-8m-autonomous-deliveries/" } },
    ],
  },
  {
    id: "agriculture", kind: "sector", name: "Agriculture & Food", blurb: "Precision ag · robots · yields",
    cards: [
      { id: "frm-1", claim: "Robotic weeders kill weeds with lasers on real commercial farms, with no herbicide at all.", verdict: "already", note: "Carbon Robotics' LaserWeeders ran on 100+ farms across 14 countries, processing 250,000+ acres in 2024 using AI vision to laser-kill weeds.", source: { label: "RealAgriculture / Carbon Robotics", url: "https://www.realagriculture.com/2025/11/carbon-robotics-laser-weeder-targets-organic-corn-and-soybean-acres/" } },
      { id: "frm-2", claim: "AI sprayers can see individual weeds and cut a farm's herbicide use by more than half.", verdict: "already", note: "John Deere reports See & Spray averaged 59% herbicide savings in 2024, saving ~8 million gallons across more than a million acres.", source: { label: "John Deere", url: "https://www.deere.com/en/news/all-news/see-spray-herbicide-savings/" } },
      { id: "frm-3", claim: "Autonomous tractors are taking the driver out of the cab on large US farms.", verdict: "likely", note: "At CES 2025 John Deere expanded its driverless autonomy kit (16 cameras, AI vision) to a large 9RX tractor, orchard tractor, dump truck and mower.", source: { label: "John Deere", url: "https://www.deere.com/en/news/all-news/autonomous-9RX/" } },
      { id: "frm-4", claim: "Robots will soon replace the migrant workers who hand-pick fruits and vegetables.", verdict: "unlikely", note: "A UC Davis robotics expert says harvest aids may replace only ~15–25% of farm labor, gradually, delicate-crop picking still defeats robots.", source: { label: "UC Davis Engineering", url: "https://engineering.ucdavis.edu/news/stavros-vougioukas-future-farm-robotics" } },
      { id: "frm-5", claim: "AI and automation are already shrinking America's farm workforce.", verdict: "contested", note: "US hired farm employment rose 10% (2010–2024) and H-2A guest-worker visas grew ~sevenfold to ~385,000 in FY2024, automation hasn't displaced labor.", source: { label: "USDA Economic Research Service", url: "https://www.ers.usda.gov/topics/farm-economy/farm-labor" } },
      { id: "frm-6", claim: "Robot milkers are quietly automating the dairy barn across America.", verdict: "contested", note: "Real but limited: USDA reported only ~6% of US milk came from robotic 'box' systems as of 2021, concentrated in mid-size herds, though adoption climbs.", source: { label: "USDA ERS (ERR-356)", url: "https://www.ers.usda.gov/publications/pub-details?pubid=113704" } },
    ],
  },
  {
    id: "service", kind: "sector", name: "Retail & Service", blurb: "Chatbots · call centres · deflection",
    cards: [
      { id: "sup-1", claim: "One company's AI chatbot did the work of 700 full-time support agents in a single month.", verdict: "already", note: "In Feb 2024 Klarna said its OpenAI-powered assistant handled 2.3M chats, two-thirds of support volume, equal to 700 full-time agents.", source: { label: "Klarna", url: "https://www.klarna.com/international/press/klarna-ai-assistant-handles-two-thirds-of-customer-service-chats-in-its-first-month/" } },
      { id: "sup-2", claim: "AI will soon fully replace human support agents.", verdict: "unlikely", note: "Klarna reversed course in May 2025, rehiring humans after admitting cost-cutting hurt quality; its CEO said customers should 'always' reach a person.", source: { label: "Entrepreneur", url: "https://www.entrepreneur.com/business-news/klarna-ceo-reverses-course-by-hiring-more-humans-not-ai/491396" } },
      { id: "sup-3", claim: "Most companies' agentic-AI projects will be scrapped before they pay off.", verdict: "contested", note: "Gartner predicts over 40% of agentic-AI projects will be canceled by end-2027 over costs and weak value, but other firms forecast rapid adoption.", source: { label: "Gartner", url: "https://www.gartner.com/en/newsroom/press-releases/2025-06-25-gartner-predicts-over-40-percent-of-agentic-ai-projects-will-be-canceled-by-end-of-2027" } },
      { id: "sup-4", claim: "AI assistance makes support agents more productive, and helps the newest ones most.", verdict: "likely", note: "A Stanford/MIT study of 5,000 agents found AI tools raised issues resolved per hour ~14% overall, and 34% for the least-experienced workers.", source: { label: "Brynjolfsson et al., NBER", url: "https://www.nber.org/papers/w31161" } },
      { id: "sup-5", claim: "Customer-service reps are the single job AI is shrinking fastest.", verdict: "contested", note: "WEF's 2025 report flags customer service as exposed, but ranks clerical/secretarial roles, not customer service, as the largest absolute decline.", source: { label: "WEF Future of Jobs 2025", url: "https://www.weforum.org/stories/2025/01/future-of-jobs-report-2025-the-fastest-growing-and-declining-jobs/" } },
      { id: "sup-6", claim: "Companies are already pausing back-office hiring, expecting AI to absorb the work.", verdict: "likely", note: "In May 2023 IBM's CEO said he expected ~7,800 back-office jobs replaceable by AI, slowing hiring across ~26,000 non-customer-facing roles.", source: { label: "Washington Post", url: "https://www.washingtonpost.com/technology/2023/05/02/ai-jobs-takeover-ibm/" } },
    ],
  },
  {
    id: "science", kind: "sector", name: "Science & Research", blurb: "AlphaFold · AI discovery · quantum sim",
    cards: [
      { id: "sci-1", claim: "An AI that predicts protein structures just won a Nobel Prize in Chemistry.", verdict: "already", note: "AlphaFold won the 2024 Chemistry Nobel; its free database now covers 200M+ protein structures used by 2M+ researchers worldwide.", source: { label: "NobelPrize.org", url: "https://www.nobelprize.org/prizes/chemistry/2024/press-release/" } },
      { id: "sci-2", claim: "An AI-designed drug has already proven itself in a human clinical trial.", verdict: "contested", note: "Insilico's AI-designed lung-fibrosis drug hit positive Phase 2a results (Nature Medicine, 2025), a first proof, but no AI drug is fully approved yet.", source: { label: "Insilico / Nature Medicine", url: "https://www.prnewswire.com/news-releases/insilico-medicine-announces-nature-medicine-publication-of-phase-iia-results-evaluating-rentosertib-the-novel-tnik-inhibitor-for-idiopathic-pulmonary-fibrosis-ipf-discovered-and-designed-with-a-pioneering-ai-approach-302472070.html" } },
      { id: "sci-3", claim: "Quantum computers can already simulate useful molecules for drug design.", verdict: "unlikely", note: "Google's Willow chip simulated tiny molecules as a proof-of-principle. Hardware for practically useful quantum chemistry remains years away.", source: { label: "Google Research", url: "https://blog.google/innovation-and-ai/technology/research/quantum-echoes-willow-verifiable-quantum-advantage/" } },
      { id: "sci-4", claim: "AI discovered hundreds of thousands of new materials, some already made in labs.", verdict: "already", note: "DeepMind's GNoME predicted ~380,000 stable new materials (Nature, 2023); 736 were independently synthesized by experimental labs.", source: { label: "Google DeepMind (GNoME)", url: "https://deepmind.google/blog/millions-of-new-materials-discovered-with-deep-learning/" } },
      { id: "sci-5", claim: "AlphaFold reliably predicts every protein and antibody complex it's given.", verdict: "contested", note: "It struggles with disordered proteins, ligand-bound states and antibody–antigen complexes (~11% success), so wet-lab validation stays essential.", source: { label: "The Protein Journal (2025)", url: "https://link.springer.com/article/10.1007/s10930-025-10310-8" } },
      { id: "sci-6", claim: "Autonomous 'AI scientists' will soon replace human researchers in the lab.", verdict: "unlikely", note: "Autonomous research agents show shallow reviews and high failure rates; developers and Nature agree AI augments rather than replaces human judgment.", source: { label: "Nature (editorial, 2026)", url: "https://www.nature.com/articles/d41586-026-01557-x" } },
    ],
  },
  {
    id: "military", kind: "sector", name: "Military & Defence", blurb: "Autonomous weapons · drones · decisions",
    cards: [
      { id: "sol-1", claim: "Drones that pick and strike their own targets are already used in combat.", verdict: "already", note: "Ukraine fields AI terminal-guidance FPV drones; Russia's V2U loitering munition autonomously searches and selects targets, first used in combat Feb 2025.", source: { label: "CSIS", url: "https://www.csis.org/analysis/ukraines-future-vision-and-current-capabilities-waging-ai-enabled-autonomous-warfare" } },
      { id: "sol-2", claim: "A binding global treaty now bans lethal autonomous 'killer robot' weapons.", verdict: "unlikely", note: "No binding treaty exists. The UN chief urged one by 2026, but consensus rules let major military states keep blocking it.", source: { label: "UN News", url: "https://news.un.org/en/story/2025/05/1163256" } },
      { id: "sol-3", claim: "A drone in Libya carried out the world's first confirmed autonomous kill of humans.", verdict: "contested", note: "A 2021 UN report described a Kargu-2 'hunting' fighters in fire-and-forget mode, but never confirmed a kill or autonomous operation, widely overstated.", source: { label: "ICRC Casebook / UN S/2021/229", url: "https://casebook.icrc.org/case-study/libya-use-lethal-autonomous-weapon-systems" } },
      { id: "sol-4", claim: "US policy still requires human judgment over any weapon's use of lethal force.", verdict: "already", note: "DoD Directive 3000.09 (updated 2023) mandates 'appropriate levels of human judgment,' even as the Replicator program fields thousands of autonomous systems.", source: { label: "US Dept. of Defense", url: "https://www.war.gov/News/Releases/Release/Article/3278076/dod-announces-update-to-dod-directive-300009-autonomy-in-weapon-systems/" } },
      { id: "sol-5", claim: "AI systems already generate kill lists of thousands of targets in active wars.", verdict: "already", note: "Israel reportedly used 'Lavender' to mark ~37,000 Gazans for strikes; sources alleged officers spent ~20 seconds rubber-stamping each target.", source: { label: "The Guardian", url: "https://www.theguardian.com/world/2024/apr/03/israel-gaza-ai-database-hamas-airstrikes" } },
      { id: "sol-6", claim: "Soldiers will soon be fully removed from the decision to take a life.", verdict: "contested", note: "Policy still mandates a human in the loop, but analysts warn oversight is eroding into a rubber stamp under battlefield speed and scale.", source: { label: "Survival (IISS), 2025", url: "https://www.tandfonline.com/doi/full/10.1080/00396338.2025.2534284" } },
    ],
  },
  {
    id: "language", kind: "sector", name: "Language & Translation", blurb: "Machine translation · interpreting · nuance",
    cards: [
      { id: "trn-1", claim: "Companies are already replacing human translators with AI for routine work.", verdict: "already", note: "Duolingo cut ~10% of its contractors in early 2024, largely translators, replacing them with GPT-4 and keeping a few as quality curators.", source: { label: "TechCrunch", url: "https://techcrunch.com/2024/01/09/duolingo-cut-10-of-its-contractor-workforce-as-the-company-embraces-ai/" } },
      { id: "trn-2", claim: "Your earbuds can already translate a live conversation in 70+ languages.", verdict: "already", note: "Google's Gemini-powered Live Translate does real-time speech-to-speech through ordinary headphones in 70+ languages, live in the US, Mexico and India.", source: { label: "Google", url: "https://blog.google/products/translate/language-learning-live-translate/" } },
      { id: "trn-3", claim: "AI now translates as well as experienced professional human translators.", verdict: "contested", note: "A 2024 benchmark found GPT-4 matches junior translators on errors but trails senior humans on fluency and style, degrading on specialized languages.", source: { label: "arXiv (Yan et al., 2024)", url: "https://arxiv.org/abs/2407.03658" } },
      { id: "trn-4", claim: "A major publisher is using AI to translate novels into English.", verdict: "contested", note: "Dutch publisher Veen Bosch & Keuning will AI-translate up to 10 commercial titles; translators objected, citing a third already losing work to AI.", source: { label: "The Guardian", url: "https://www.theguardian.com/books/2024/nov/05/dutch-publisher-to-use-ai-to-translate-limited-number-of-books-into-english" } },
      { id: "trn-5", claim: "AI translation is safe enough to handle high-stakes asylum and court cases.", verdict: "unlikely", note: "AI mistranslations of Pashto/Dari have derailed asylum claims, one pronoun error helped sink a case, keeping certified humans essential.", source: { label: "Rest of World", url: "https://restofworld.org/2023/ai-translation-errors-afghan-refugees-asylum/" } },
      { id: "trn-6", claim: "AI will soon fully replace human translators across every domain.", verdict: "unlikely", note: "US labor data shows AI shrinking routine demand, but certification, liability and nuance keep humans indispensable for legal, medical and literary work.", source: { label: "US Bureau of Labor Statistics", url: "https://www.bls.gov/ooh/media-and-communication/interpreters-and-translators.htm" } },
    ],
  },

  {
    id: "environment", kind: "sector", name: "Environment & Climate", blurb: "Footprint · forecasting · what AI costs the planet",
    cards: [
      { id: "env-1", claim: "Data centres are on track to use about as much electricity as the whole of Japan.", verdict: "likely", note: "The IEA puts global data-centre demand at 415 TWh in 2024 and projects 945 TWh by 2030, roughly Japan's entire annual consumption today.", source: { label: "IEA. Energy and AI, 2025", url: "https://www.iea.org/reports/energy-and-ai/executive-summary" }, checked: "2026-08-08" },
      { id: "env-2", claim: "AI now forecasts the weather more accurately than the world's best physics supercomputer.", verdict: "already", note: "DeepMind's GenCast beat the ECMWF ensemble on 97.2% of 1,320 targets, and produces a 15-day global forecast in eight minutes on one chip.", source: { label: "DeepMind · Nature, Dec 2024", url: "https://deepmind.google/blog/gencast-predicts-weather-and-the-risks-of-extreme-conditions-with-sota-accuracy/" }, checked: "2026-08-08" },
      { id: "env-3", claim: "Big Tech's carbon emissions are coming down as they get better at running AI.", verdict: "unlikely", note: "The opposite. Microsoft's emissions are up roughly a quarter since 2020 and Google's climbed 48% from its 2019 baseline, both blamed on data-centre build-out.", source: { label: "Company sustainability reports, 2025–26", url: "https://www.datacenterdynamics.com/en/news/microsoft-emissions-up-23-since-2020-blames-ai-data-centers/" }, checked: "2026-08-08" },
      { id: "env-4", claim: "Most of a data centre's water footprint is nowhere near the building. It is at the power station.", verdict: "already", note: "The IEA attributes about 60% of data-centre water use to indirect consumption: the thermoelectric plants generating its electricity, not its cooling towers.", source: { label: "IEA. Energy and AI, 2025", url: "https://www.iea.org/reports/energy-and-ai" }, checked: "2026-08-08" },
      { id: "env-5", claim: "AI's water use is already measured in hundreds of billions of litres a year.", verdict: "already", note: "Peer-reviewed estimates put AI's 2025 water footprint at 312–765 billion litres; US data-centre expansion alone pushed consumption toward a trillion litres.", source: { label: "Cell Reports Sustainability, 2026", url: "https://www.sciencedirect.com/science/article/pii/S2666389925002788" }, checked: "2026-08-08" },
      { id: "env-6", claim: "The emissions AI helps the world avoid outweigh the emissions from running it.", verdict: "contested", note: "Industry modelling says yes; independent researchers say the avoided-emissions maths is unfalsifiable and the data-centre footprint is the only measured half.", source: { label: "IEA · independent reviews, 2025–26", url: "https://www.iea.org/reports/energy-and-ai" }, checked: "2026-08-08" },
    ],
  },

  // ── tricky / sarcastic curveballs (the gut answer is often wrong) ──────────
  {
    id: "curveballs", kind: "wildcard", name: "Curveballs", blurb: "Counterintuitive · gotchas · think twice",
    cards: [
      { id: "cur-1", claim: "A binding UN treaty bans weapons that pick their own targets without a human deciding.", verdict: "unlikely", note: "No binding treaty exists. A 2024 UN resolution passed 166–3, but the US, Russia, India and Israel have blocked actual negotiations.", source: { label: "Human Rights Watch, 2025", url: "https://www.hrw.org/news/2025/05/21/un-start-talks-treaty-ban-killer-robots" } },
      { id: "cur-2", claim: "GPT-4 scored in the top 10% of everyone who sits the bar exam.", verdict: "unlikely", note: "An MIT reanalysis found the 90th-percentile figure compared it to repeat failers; against actual passers it lands near the 48th percentile, ~15th on essays.", source: { label: "MIT, re-evaluating GPT-4's bar exam", url: "https://dspace.mit.edu/handle/1721.1/153986" } },
      { id: "cur-3", claim: "Experienced developers get their work done faster when they use AI coding tools.", verdict: "unlikely", note: "A 2025 METR randomized trial found experienced devs were 19% slower with AI tools, while believing they'd been 20% faster.", source: { label: "METR, July 2025", url: "https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/" } },
      { id: "cur-5", claim: "In a Turing test, an AI was judged to be human more often than the actual humans were.", verdict: "already", note: "In a 2025 UC San Diego study, GPT-4.5 with a persona prompt was judged human 73% of the time, beating the real humans it was paired against.", source: { label: "Jones & Bergen, arXiv 2503.23674", url: "https://arxiv.org/abs/2503.23674" } },
      { id: "cur-6", claim: "There is still no finalised, government-approved encryption designed to survive quantum computers.", verdict: "unlikely", note: "Wrong: NIST finalized three post-quantum standards (FIPS 203/204/205) in August 2024 and urges agencies to migrate now.", source: { label: "NIST, August 2024", url: "https://www.nist.gov/news-events/news/2024/08/nist-releases-first-3-finalized-post-quantum-encryption-standards" } },
    ],
  },
  {
    id: "hype", kind: "wildcard", name: "Hype check", blurb: "Marketing vs reality · myths · letdowns",
    cards: [
      { id: "hyp-1", claim: "Amazon's Just Walk Out shops ran on computer vision alone, with nobody watching what you picked up.", verdict: "unlikely", note: "Around 700 of every 1,000 sales were reviewed by ~1,000 workers in India. Amazon dropped the system for smart carts in 2024.", source: { label: "Bloomberg / The Information, 2024", url: "https://www.bloomberg.com/opinion/articles/2024-04-03/the-humans-behind-amazon-s-just-walk-out-technology-are-all-over-ai" } },
      { id: "hyp-2", claim: "The Tesla Optimus robots pouring drinks at the 2024 launch were acting on their own.", verdict: "unlikely", note: "At the October 2024 'We, Robot' event the bots walked via AI but were teleoperated by humans to chat and serve; Tesla later confirmed 'assisted.'", source: { label: "TechCrunch, October 2024", url: "https://techcrunch.com/2024/10/14/tesla-optimus-bots-were-controlled-by-humans-during-the-we-robot-event/" } },
      { id: "hyp-3", claim: "Language models read text letter by letter, so they can reliably count the letters in a word.", verdict: "unlikely", note: "Tokenization splits a word like strawberry into chunks such as [str, aw, berry], so the model never sees the individual letters. GPT-4 long insisted there were two Rs.", source: { label: "arXiv 2410.19730, tokenization", url: "https://arxiv.org/pdf/2410.19730" } },
      { id: "hyp-4", claim: "Data centres use only a rounding-error slice of the world's electricity.", verdict: "contested", note: "Data centres were ~1.5% of global electricity in 2024 (~415 TWh); the IEA projects that roughly doubling to ~945 TWh, near 3%, by 2030.", source: { label: "IEA. Energy and AI", url: "https://www.iea.org/reports/energy-and-ai/energy-demand-from-ai" } },
      { id: "hyp-5", claim: "Quantum computers are close to breaking the RSA-2048 encryption your bank relies on.", verdict: "unlikely", note: "The largest number factored by genuine Shor's algorithm is still 21. Breaking RSA-2048 would need on the order of a million error-corrected qubits.", source: { label: "IBM Quantum, factoring 15", url: "https://www.ibm.com/quantum/blog/factor-15-shors-algorithm" } },
      { id: "hyp-6", claim: "A Tesla on Full Self-Driving drives itself, with no need for the person in the seat to supervise.", verdict: "unlikely", note: "FSD is an SAE Level 2 driver-assist requiring constant supervision; US regulators have probed it after crashes. The name oversells the capability.", source: { label: "Reuters, NHTSA FSD probe", url: "https://www.reuters.com/business/autos-transportation/us-opens-investigation-into-29-million-tesla-vehicles-over-full-self-driving-2025-10-09/" } },
    ],
  },
  {
    id: "quantum", kind: "wildcard", name: "Quantum reality", blurb: "Q-Day · hype · what's actually true",
    cards: [
      { id: "qnt-1", claim: "A quantum chip has run in five minutes a task the best supercomputer would need longer than the age of the universe to finish.", verdict: "already", note: "Google's 105-qubit Willow ran a random-circuit benchmark in under five minutes in December 2024. Frontier would need about 10^25 years to match it.", source: { label: "Google. Willow", url: "https://blog.google/technology/research/google-willow-quantum-chip/" } },
      { id: "qnt-2", claim: "Today's quantum computers can run Shor's algorithm and break the RSA keys banks use.", verdict: "unlikely", note: "Breaking RSA-2048 needs roughly a million noisy qubits for days; the largest number reliably Shor-factored on hardware is still 21.", source: { label: "IBM Quantum", url: "https://www.ibm.com/quantum/blog/factor-15-shors-algorithm" } },
      { id: "qnt-3", claim: "Encrypted data stolen today could be read years from now, once quantum computers mature.", verdict: "likely", note: "'Harvest now, decrypt later': the NSA warns adversaries may already be collecting encrypted traffic to decrypt once quantum computers mature.", source: { label: "NIST / NSA, PQC migration", url: "https://www.nist.gov/news-events/news/2024/08/nist-releases-first-3-finalized-post-quantum-encryption-standards" } },
      { id: "qnt-4", claim: "Finalised, government-approved encryption built to survive quantum computers already exists.", verdict: "already", note: "NIST finalised FIPS 203, 204 and 205 in August 2024: published, deployable quantum-resistant encryption and signature standards.", source: { label: "NIST news release", url: "https://www.nist.gov/news-events/news/2024/08/nist-releases-first-3-finalized-post-quantum-encryption-standards" } },
      { id: "qnt-5", claim: "Microsoft has built and verified the first working topological qubit.", verdict: "contested", note: "Microsoft's Feb 2025 'Majorana 1' reveal drew heavy skepticism; the Nature paper carried an editor's note that it isn't evidence of Majorana zero modes.", source: { label: "Science (AAAS)", url: "https://www.science.org/content/article/doubling-down-controversial-claims-microsoft-accelerates-quantum-computing-plans" } },
      { id: "qnt-6", claim: "A quantum computer beats a classical one at essentially any hard computing problem.", verdict: "unlikely", note: "Large speedups are proven only for narrow problem classes (e.g. factoring). No general-purpose exponential quantum speedup is established for most tasks.", source: { label: "arXiv 2501.05694, myths in quantum", url: "https://arxiv.org/abs/2501.05694" } },
    ],
  },
  {
    id: "alreadyreal", kind: "wildcard", name: "Already real?", blurb: "It sounds fake. It shipped.",
    cards: [
      { id: "arl-1", claim: "The people behind an AI system have been awarded a Nobel Prize in Chemistry.", verdict: "already", note: "The 2024 Nobel in Chemistry went to DeepMind's Hassabis and Jumper for AlphaFold's protein-structure prediction (shared with David Baker).", source: { label: "NobelPrize.org. Chemistry 2024", url: "https://www.nobelprize.org/prizes/chemistry/2024/press-release/" } },
      { id: "arl-2", claim: "Research on neural networks has won a Nobel Prize in Physics.", verdict: "already", note: "The 2024 Nobel in Physics went to Hopfield and Hinton for foundational discoveries enabling machine learning with artificial neural networks.", source: { label: "NobelPrize.org. Physics 2024", url: "https://www.nobelprize.org/prizes/physics/2024/press-release/" } },
      { id: "arl-3", claim: "An AI has scored at gold-medal standard against humans at the International Mathematical Olympiad.", verdict: "already", note: "At IMO 2025, DeepMind's Gemini Deep Think and an OpenAI model each scored 35/42, gold-medal standard, within the contest time limit.", source: { label: "Google DeepMind, IMO gold", url: "https://deepmind.google/blog/advanced-version-of-gemini-with-deep-think-officially-achieves-gold-medal-standard-at-the-international-mathematical-olympiad/" } },
      { id: "arl-4", claim: "A regulator has approved an AI that diagnoses patients with no doctor reading the result.", verdict: "already", note: "In 2018 the FDA cleared IDx-DR, the first autonomous AI to diagnose diabetic retinopathy with no clinician interpreting the result.", source: { label: "npj Digital Medicine, pivotal trial", url: "https://www.nature.com/articles/s41746-018-0040-6" } },
      { id: "arl-5", claim: "You can pay for a taxi ride today in a car with nobody at the wheel.", verdict: "already", note: "Waymo runs paid, fully driverless rides in multiple US cities, reporting around 250,000 paid trips per week by mid-2025.", source: { label: "CNBC. Waymo", url: "https://www.cnbc.com/2025/11/12/waymo-robotaxi-starts-freeway-highway-rides.html" } },
      { id: "arl-6", claim: "A quantum computer has beaten a top supercomputer on a genuinely useful real-world problem.", verdict: "contested", note: "D-Wave's March 2025 Science paper claimed beyond-classical magnetic-materials simulation, but independent groups disputed the classical-hardness comparison.", source: { label: "Science / D-Wave", url: "https://www.dwavequantum.com/company/newsroom/press-release/beyond-classical-d-wave-first-to-demonstrate-quantum-supremacy-on-useful-real-world-problem/" } },
    ],
  },

  // ── quote cards (a different flavour, real on-the-record predictions) ──────
  {
    id: "quotes", kind: "wildcard", name: "The oracles", blurb: "Bold predictions · on the record · aging fast",
    cards: [
      { id: "quo-1", claim: "AI could wipe out half of all entry-level white-collar jobs and spike unemployment to 10–20% in the next one to five years.", verdict: "contested", note: "Amodei said this to Axios in May 2025, naming tech, finance, law and consulting. No bloodbath by 2026, but entry-level hiring has softened.", attribution: "Dario Amodei, Anthropic CEO", source: { label: "Axios (May 2025)", url: "https://www.axios.com/2025/05/28/ai-jobs-white-collar-unemployment-anthropic" } },
      { id: "quo-2", claim: "People should stop training radiologists now, within five years deep learning will obviously do better.", verdict: "unlikely", note: "Said in 2016. Radiologist demand instead rose; Hinton himself conceded in 2025 he was wrong on timing, the field is hiring, not vanishing.", attribution: "Geoffrey Hinton, AI pioneer / Nobel laureate", source: { label: "New Republic / NYT", url: "https://newrepublic.com/article/187203/ai-radiology-geoffrey-hinton-nobel-prediction" } },
      { id: "quo-3", claim: "It is our job to create computing technology such that nobody has to program, kids needn't learn to code.", verdict: "contested", note: "Huang, at the World Government Summit in February 2024. AI coding tools exploded, but demand for skilled engineers has not collapsed.", attribution: "Jensen Huang, Nvidia CEO", source: { label: "Tom's Hardware", url: "https://www.tomshardware.com/tech-industry/artificial-intelligence/jensen-huang-advises-against-learning-to-code-leave-it-up-to-ai" } },
      { id: "quo-4", claim: "In 2025 we'll have an AI that can effectively be a sort of mid-level engineer that writes code.", verdict: "contested", note: "Zuckerberg, on the Joe Rogan Experience in January 2025. AI now writes a lot of code, but autonomous 'mid-level engineers' replacing staff has not happened at scale.", attribution: "Mark Zuckerberg, Meta CEO", source: { label: "Joe Rogan Experience, via IT Pro", url: "https://www.itpro.com/software/development/a-sign-of-things-to-come-in-software-development-mark-zuckerberg-says-ai-will-be-doing-the-work-of-mid-level-engineers-this-year-and-hes-not-the-only-big-tech-exec-predicting-the-end-of-the-profession" } },
      { id: "quo-5", claim: "AI will probably be smarter than any single human next year. By 2029, smarter than all humans combined.", verdict: "contested", note: "Musk, posting on X in March 2024. The 2025 'smarter than any human' mark slipped and he later pushed it to under two years. His timelines routinely slide.", attribution: "Elon Musk, Tesla / xAI CEO", source: { label: "Musk on X (Mar 2024)", url: "https://x.com/elonmusk/status/1767738797276451090" } },
      { id: "quo-6", claim: "Autonomous driving is a solved problem, we're less than two years from complete autonomy, safer than humans.", verdict: "unlikely", note: "Musk in 2016, one of a decade of 'next year' robotaxi promises. As of 2026 Teslas still are not unsupervised Level 5, and the deadline keeps moving.", attribution: "Elon Musk, Tesla CEO", source: { label: "Predictions for autonomous Tesla vehicles", url: "https://en.wikipedia.org/wiki/List_of_predictions_for_autonomous_Tesla_vehicles_by_Elon_Musk" } },
      { id: "quo-7", claim: "We're now confident we know how to build AGI, and we're beginning to aim beyond it, at superintelligence.", verdict: "contested", note: "From Altman's Jan 2025 'Reflections' blog. A striking claim of confidence; no demonstrated AGI yet, and he has since softened the AGI framing.", attribution: "Sam Altman, OpenAI CEO", source: { label: "Sam Altman, 'Reflections'", url: "https://blog.samaltman.com/reflections" } },
      { id: "quo-8", claim: "Within 10 years AI will replace many doctors and teachers, humans won't be needed for most things.", verdict: "contested", note: "Gates, on The Tonight Show in February 2025, calling it the era of 'free intelligence'. It is a 2035 bet; doctors and teachers remain firmly in demand.", attribution: "Bill Gates, Microsoft co-founder", source: { label: "CNBC", url: "https://www.cnbc.com/2025/03/26/bill-gates-on-ai-humans-wont-be-needed-for-most-things.html" } },
      { id: "quo-9", claim: "Before worrying about AI smarter than us, we need a design for a system smarter than a house cat. We're nowhere near.", verdict: "contested", note: "LeCun, Meta's chief AI scientist, in 2024. The prominent contrarian: he argues LLMs are an off-ramp to human-level AI, not the road. Hotly disputed by rivals.", attribution: "Yann LeCun, Meta Chief AI Scientist", source: { label: "LeCun on X (May 2024)", url: "https://x.com/ylecun/status/1791890883425570823" } },
    ],
  },
];

// alignment + profiles (ported from prototype)
// `sayTrue` is the answer the player gave: true = "TRUE", false = "FALSE".
export function isAligned(verdict: Verdict, sayTrue: boolean): boolean {
  if (verdict === "contested") return true; // KINDA, never penalised either way
  if (verdict === "unlikely") return sayTrue === false;
  return sayTrue === true; // likely / already
}

export interface Profile { name: string; desc: string; lblNote: string }
export function profileFor(matched: number, total: number, over: number, under: number): Profile {
  const rate = total ? matched / total : 0;
  if (under >= 2 && under > over)
    return { name: "Caught Flat-Footed", desc: "The future you think you're waiting for is partly here already. You called things false that have already shipped.", lblNote: "but the present outran you" };
  if (over >= 2 && over > under)
    return { name: "The Accelerationist", desc: "You lean ahead of the evidence, quick to call the bold claim true before it's earned. Useful instinct, but check the qubit count.", lblNote: "running ahead of the proof" };
  if (rate >= 0.8)
    return { name: "Well Calibrated", desc: "Your gut tracks where the evidence actually sits, neither hyped nor in denial. Rare.", lblNote: "and your instincts held" };
  if (rate >= 0.5)
    return { name: "Roughly Tuned", desc: "You're in the right neighbourhood but a few cards slipped, usually the ones that are further along than they feel.", lblNote: "with a few blind spots" };
  return { name: "The Skeptic", desc: "You resist the narrative hard, sometimes past the point where the evidence has caught up. Calling things false is cheap; calibration isn't.", lblNote: "but doubt overshot the data" };
}

// ── deck helpers ──────────────────────────────────────────────────────────
export const SECTOR_DECKS = SECTORS.filter((s) => s.kind === "sector");
export const WILDCARD_DECKS = SECTORS.filter((s) => s.kind === "wildcard");
export const ALL_CARDS = SECTORS.flatMap((s) => s.cards.map((c) => ({ card: c, sector: s })));
export const cardById = new Map(ALL_CARDS.map(({ card, sector }) => [card.id, { card, sector }]));
