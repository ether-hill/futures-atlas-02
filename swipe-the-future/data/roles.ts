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

  // ── additional categories (research-sourced; see git log) ──────────────────
  {
    id: "doctor", name: "Doctor", blurb: "Diagnosis · admin burden · clinical AI",
    cards: [
      { id: "doc-1", claim: "An AI device can already diagnose a disease and report the result with no doctor reading it.", verdict: "already", note: "In 2018 the FDA cleared IDx-DR (now LumineticsCore), the first autonomous AI detecting diabetic retinopathy with no clinician interpreting the image.", source: { label: "FDA / Digital Diagnostics", url: "https://www.digitaldiagnostics.com/fda-permits-marketing-of-lumineticscore-formerly-known-as-idx-dr-for-automated-detection-of-diabetic-retinopathy-in-primary-care/" } },
      { id: "doc-2", claim: "AI 'scribes' that listen to visits and write the notes are already cutting doctor burnout.", verdict: "already", note: "A 2024 six-system study and a Stanford trial found ambient AI scribes significantly reduced documentation time and burnout; Kaiser logged ~15,791 hours saved.", source: { label: "JAMA-cited study (PMC)", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC12492056/" } },
      { id: "doc-3", claim: "In a controlled test, GPT-4 alone out-diagnosed physicians — even doctors who had GPT-4 to help.", verdict: "already", note: "A 2024 JAMA Network Open trial found GPT-4 alone beat physicians on clinical vignettes; giving doctors the tool didn't improve their reasoning much.", source: { label: "Stanford Medicine / JAMA", url: "https://medicine.stanford.edu/news/current-news/standard-news/GPT-diagnostic-reasoning.html" } },
      { id: "doc-4", claim: "AI in breast-screening can cut radiologists' reading workload by nearly half without missing more cancers.", verdict: "likely", note: "Sweden's 105,000-woman MASAI trial cut screen-reading workload 44% and raised cancer detection — still with a human radiologist in the loop.", source: { label: "Lancet Digital Health (MASAI)", url: "https://www.thelancet.com/journals/landig/article/PIIS2589-7500(24)00267-X/fulltext" } },
      { id: "doc-5", claim: "Whether AI net-replaces clinicians or just augments them is genuinely unsettled among experts.", verdict: "contested", note: "Strong diagnostic results exist, but clean vignettes flatter AI; real clinics face messy data, liability and integration gaps. Experts split on the net effect.", source: { label: "Univ. of Minnesota Medical School", url: "https://med.umn.edu/news/ai-healthcare-new-research-shows-promise-and-limitations-physicians-working-gpt-4-decision-making" } },
      { id: "doc-6", claim: "AI made radiologists obsolete, just as the 'Godfather of AI' predicted in 2016.", verdict: "unlikely", note: "Hinton said stop training radiologists; a decade on, demand surges, average pay hit ~$571K, and he has conceded he was wrong on timing.", source: { label: "Fortune", url: "https://fortune.com/2026/05/04/godfather-of-ai-geoffrey-hinton-radiologists-future-of-work-tech-ai-job-anxiety/" } },
    ],
  },
  {
    id: "teacher", name: "Teacher", blurb: "Tutoring AI · cheating · the classroom",
    cards: [
      { id: "tch-1", claim: "Roughly a quarter of US teens already use ChatGPT to help with their homework.", verdict: "already", note: "A 2024 Pew survey found about 26% of US teens aged 13–17 had used ChatGPT for schoolwork — double the share from the year before.", source: { label: "Pew Research / EdWeek", url: "https://www.edweek.org/technology/new-data-reveal-how-many-students-are-using-ai-to-cheat/2024/04" } },
      { id: "tch-2", claim: "AI-writing detectors are reliable enough to safely catch students cheating.", verdict: "unlikely", note: "A Stanford study found detectors flagged 61% of non-native-English essays as AI; Vanderbilt and others disabled Turnitin's detector over false positives.", source: { label: "Stanford (arXiv)", url: "https://arxiv.org/abs/2304.02819" } },
      { id: "tch-3", claim: "Khan Academy's GPT-4 tutor Khanmigo has scaled to hundreds of thousands of students.", verdict: "already", note: "Khanmigo grew from ~68,000 users in its 2023–24 pilot to over 700,000 in 2024–25, though rigorous learning-gain studies are still ongoing.", source: { label: "Khan Academy", url: "https://blog.khanacademy.org/khan-academy-efficacy-results-november-2024/" } },
      { id: "tch-4", claim: "AI tutors reliably boost students' test scores better than normal teaching.", verdict: "contested", note: "Early studies are mixed: some show learning gains, but controlled trials often find no significant test-score difference versus other methods. Evidence is thin.", source: { label: "J. of Teaching and Learning", url: "https://jtl.uwindsor.ca/index.php/jtl/article/view/10052" } },
      { id: "tch-5", claim: "Since ChatGPT launched, overall student cheating rates have surged far above historical levels.", verdict: "contested", note: "A multi-year high-school study found overall cheating stayed roughly stable (~72%) before and after ChatGPT, even as AI-specific use rose.", source: { label: "Computers & Education: AI", url: "https://www.sciencedirect.com/science/article/pii/S2666920X24000560" } },
      { id: "tch-6", claim: "AI grades student essays as consistently as human teachers do.", verdict: "unlikely", note: "Studies comparing AI and instructor grading of essays found little agreement, with AI tending to grade more leniently and inconsistently.", source: { label: "arXiv (instructor–AI grading)", url: "https://arxiv.org/abs/2501.06461" } },
    ],
  },
  {
    id: "journalist", name: "Journalist", blurb: "Automated copy · trust · investigations",
    cards: [
      { id: "jrn-1", claim: "A major newswire already auto-writes thousands of corporate earnings stories with no human writing them.", verdict: "already", note: "The AP has used natural-language generation since 2014, scaling earnings coverage from ~300 to thousands of stories per quarter straight from data feeds.", source: { label: "Poynter", url: "https://www.poynter.org/reporting-editing/2015/robot-writing-increased-aps-earnings-stories-by-tenfold/" } },
      { id: "jrn-2", claim: "A major magazine was caught publishing AI-written articles under fake, AI-generated author profiles.", verdict: "already", note: "In 2023 Futurism revealed Sports Illustrated ran articles bylined to invented writers with AI-generated headshots; CNET also corrected dozens of AI stories.", source: { label: "NPR", url: "https://www.npr.org/2023/11/28/1215693615/sports-illustrated-is-accused-of-posting-articles-by-writers-created-by-ai" } },
      { id: "jrn-3", claim: "AI chatbots can be trusted to summarise the news accurately.", verdict: "unlikely", note: "A 2025 BBC/EBU study of 3,000+ responses found 45% had a significant issue and 81% some error; ChatGPT, Gemini, Copilot and Perplexity all distorted news.", source: { label: "BBC / EBU", url: "https://www.theregister.com/2025/10/24/bbc_probe_ai_news/" } },
      { id: "jrn-4", claim: "Investigative reporters already use machine learning to dig through millions of leaked documents.", verdict: "already", note: "ICIJ used machine learning in the 2021 Pandora Papers to flag relevant files among 11.9 million records (2.94 TB) for 600+ journalists.", source: { label: "ICIJ", url: "https://www.icij.org/tags/machine-learning/" } },
      { id: "jrn-5", claim: "AI will let newsrooms cut most beat reporters within a few years.", verdict: "contested", note: "Automation has expanded routine output and triggered some cuts, but outlets argue AI frees reporters for investigations; the net staffing effect is disputed.", source: { label: "Nieman Lab", url: "https://www.niemanlab.org/2023/10/the-ap-announces-five-ai-tools-to-help-local-newsrooms-with-tasks-like-transcription-and-sorting-pitches/" } },
      { id: "jrn-6", claim: "AI can do the shoe-leather reporting — interviewing sources and verifying facts on the ground.", verdict: "unlikely", note: "AI assists with data and drafting, but field reporting, source relationships and verification remain human; the BBC study showed AI's own facts can't be trusted.", source: { label: "BBC / EBU (The Register)", url: "https://www.theregister.com/2025/10/24/bbc_probe_ai_news/" } },
    ],
  },
  {
    id: "accountant", name: "Accountant", blurb: "Bookkeeping · audit · advisory",
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
    id: "driver", name: "Driver", blurb: "Robotaxis · trucking · last mile",
    cards: [
      { id: "drv-1", claim: "Robotaxis already carry passengers with no human driver — half a million paid rides every week.", verdict: "already", note: "Waymo reported 500,000 paid driverless rides a week across 10 US cities by March 2026, up from 250,000 a year earlier.", source: { label: "TechCrunch (Mar 2026)", url: "https://techcrunch.com/2026/03/27/waymo-skyrocketing-ridership-in-one-chart/" } },
      { id: "drv-2", claim: "Driverless cars already crash far less than humans — roughly 90% fewer serious-injury wrecks.", verdict: "already", note: "A peer-reviewed 2025 study found Waymo had significantly lower injury-crash rates than humans over 56.7 million driverless miles.", source: { label: "Traffic Injury Prevention (2025)", url: "https://www.tandfonline.com/doi/full/10.1080/15389588.2025.2499887" } },
      { id: "drv-3", claim: "Long-haul trucks now drive themselves on public highways with no one in the cab.", verdict: "already", note: "Aurora launched commercial driverless freight between Dallas and Houston on May 1, 2025 — the first heavy-truck self-driving service on public roads.", source: { label: "Aurora Innovation", url: "https://ir.aurora.tech/news-events/press-releases/detail/119/aurora-begins-commercial-driverless-trucking-in-texas-ushering-in-a-new-era-of-freight" } },
      { id: "drv-4", claim: "Tesla's robotaxi has already replaced human drivers at scale across cities.", verdict: "unlikely", note: "Tesla's Austin service runs only a handful of cars; even its 2026 'no safety driver' launch mixed a few cars into a monitored fleet with a chase car.", source: { label: "Electrek", url: "https://electrek.co/2025/12/22/tesla-robotaxi-project-austin-much-smaller-than-musk-claims/" } },
      { id: "drv-5", claim: "Automation will gut America's 2.2 million trucking jobs within the next decade.", verdict: "contested", note: "BLS projects heavy-truck driver jobs to keep growing (~4% to 2034, ~238,000 openings a year); analysts say mainly the long-haul slice is exposed.", source: { label: "US Bureau of Labor Statistics", url: "https://www.bls.gov/ooh/transportation-and-material-moving/heavy-and-tractor-trailer-truck-drivers.htm" } },
      { id: "drv-6", claim: "Sidewalk robots are taking over last-mile delivery, displacing courier work.", verdict: "likely", note: "Starship passed 8 million autonomous deliveries by April 2025 with 2,700+ robots in 270+ locations — growing fast, but still niche versus human couriers.", source: { label: "The Robot Report", url: "https://www.therobotreport.com/starship-technologies-surpasses-8m-autonomous-deliveries/" } },
    ],
  },
  {
    id: "farmer", name: "Farmer", blurb: "Precision ag · robots · yields",
    cards: [
      { id: "frm-1", claim: "Robotic weeders now zap weeds with lasers on real commercial farms — no herbicide needed.", verdict: "already", note: "Carbon Robotics' LaserWeeders ran on 100+ farms across 14 countries, processing 250,000+ acres in 2024 using AI vision to laser-kill weeds.", source: { label: "RealAgriculture / Carbon Robotics", url: "https://www.realagriculture.com/2025/11/carbon-robotics-laser-weeder-targets-organic-corn-and-soybean-acres/" } },
      { id: "frm-2", claim: "AI sprayers can see individual weeds and cut a farm's herbicide use by more than half.", verdict: "already", note: "John Deere reports See & Spray averaged 59% herbicide savings in 2024, saving ~8 million gallons across more than a million acres.", source: { label: "John Deere", url: "https://www.deere.com/en/news/all-news/see-spray-herbicide-savings/" } },
      { id: "frm-3", claim: "Autonomous tractors are taking the driver out of the cab on large US farms.", verdict: "likely", note: "At CES 2025 John Deere expanded its driverless autonomy kit (16 cameras, AI vision) to a large 9RX tractor, orchard tractor, dump truck and mower.", source: { label: "John Deere", url: "https://www.deere.com/en/news/all-news/autonomous-9RX/" } },
      { id: "frm-4", claim: "Robots will soon replace the migrant workers who hand-pick fruits and vegetables.", verdict: "unlikely", note: "A UC Davis robotics expert says harvest aids may replace only ~15–25% of farm labor, gradually — delicate-crop picking still defeats robots.", source: { label: "UC Davis Engineering", url: "https://engineering.ucdavis.edu/news/stavros-vougioukas-future-farm-robotics" } },
      { id: "frm-5", claim: "AI and automation are already shrinking America's farm workforce.", verdict: "contested", note: "US hired farm employment rose 10% (2010–2024) and H-2A guest-worker visas grew ~sevenfold to ~385,000 in FY2024 — automation hasn't displaced labor.", source: { label: "USDA Economic Research Service", url: "https://www.ers.usda.gov/topics/farm-economy/farm-labor" } },
      { id: "frm-6", claim: "Robot milkers are quietly automating the dairy barn across America.", verdict: "contested", note: "Real but limited: USDA reported only ~6% of US milk came from robotic 'box' systems as of 2021, concentrated in mid-size herds, though adoption climbs.", source: { label: "USDA ERS (ERR-356)", url: "https://www.ers.usda.gov/publications/pub-details?pubid=113704" } },
    ],
  },
  {
    id: "support", name: "Support agent", blurb: "Chatbots · call centres · deflection",
    cards: [
      { id: "sup-1", claim: "One company's AI chatbot did the work of 700 full-time support agents in a single month.", verdict: "already", note: "In Feb 2024 Klarna said its OpenAI-powered assistant handled 2.3M chats — two-thirds of support volume, equal to 700 full-time agents.", source: { label: "Klarna", url: "https://www.klarna.com/international/press/klarna-ai-assistant-handles-two-thirds-of-customer-service-chats-in-its-first-month/" } },
      { id: "sup-2", claim: "AI will soon fully replace human support agents.", verdict: "unlikely", note: "Klarna reversed course in May 2025, rehiring humans after admitting cost-cutting hurt quality; its CEO said customers should 'always' reach a person.", source: { label: "Entrepreneur", url: "https://www.entrepreneur.com/business-news/klarna-ceo-reverses-course-by-hiring-more-humans-not-ai/491396" } },
      { id: "sup-3", claim: "Most companies' agentic-AI projects will be scrapped before they pay off.", verdict: "contested", note: "Gartner predicts over 40% of agentic-AI projects will be canceled by end-2027 over costs and weak value — but other firms forecast rapid adoption.", source: { label: "Gartner", url: "https://www.gartner.com/en/newsroom/press-releases/2025-06-25-gartner-predicts-over-40-percent-of-agentic-ai-projects-will-be-canceled-by-end-of-2027" } },
      { id: "sup-4", claim: "AI assistance makes support agents more productive — especially the newest beginners.", verdict: "likely", note: "A Stanford/MIT study of 5,000 agents found AI tools raised issues resolved per hour ~14% overall, and 34% for the least-experienced workers.", source: { label: "Brynjolfsson et al., NBER", url: "https://www.nber.org/papers/w31161" } },
      { id: "sup-5", claim: "Customer-service reps are the single job AI is shrinking fastest.", verdict: "contested", note: "WEF's 2025 report flags customer service as exposed, but ranks clerical/secretarial roles — not customer service — as the largest absolute decline.", source: { label: "WEF Future of Jobs 2025", url: "https://www.weforum.org/stories/2025/01/future-of-jobs-report-2025-the-fastest-growing-and-declining-jobs/" } },
      { id: "sup-6", claim: "Companies are already pausing back-office hiring, expecting AI to absorb the work.", verdict: "likely", note: "In May 2023 IBM's CEO said he expected ~7,800 back-office jobs replaceable by AI, slowing hiring across ~26,000 non-customer-facing roles.", source: { label: "Washington Post", url: "https://www.washingtonpost.com/technology/2023/05/02/ai-jobs-takeover-ibm/" } },
    ],
  },
  {
    id: "scientist", name: "Scientist", blurb: "AlphaFold · AI discovery · quantum sim",
    cards: [
      { id: "sci-1", claim: "An AI that predicts protein structures just won a Nobel Prize in Chemistry.", verdict: "already", note: "AlphaFold won the 2024 Chemistry Nobel; its free database now covers 200M+ protein structures used by 2M+ researchers worldwide.", source: { label: "NobelPrize.org", url: "https://www.nobelprize.org/prizes/chemistry/2024/press-release/" } },
      { id: "sci-2", claim: "An AI-designed drug has already proven itself in a human clinical trial.", verdict: "contested", note: "Insilico's AI-designed lung-fibrosis drug hit positive Phase 2a results (Nature Medicine, 2025) — a first proof, but no AI drug is fully approved yet.", source: { label: "Insilico / Nature Medicine", url: "https://www.prnewswire.com/news-releases/insilico-medicine-announces-nature-medicine-publication-of-phase-iia-results-evaluating-rentosertib-the-novel-tnik-inhibitor-for-idiopathic-pulmonary-fibrosis-ipf-discovered-and-designed-with-a-pioneering-ai-approach-302472070.html" } },
      { id: "sci-3", claim: "Quantum computers can already simulate useful molecules for drug design.", verdict: "unlikely", note: "Google's Willow chip simulated tiny molecules as a proof-of-principle. Hardware for practically useful quantum chemistry remains years away.", source: { label: "Google Research", url: "https://blog.google/innovation-and-ai/technology/research/quantum-echoes-willow-verifiable-quantum-advantage/" } },
      { id: "sci-4", claim: "AI discovered hundreds of thousands of new materials, some already made in labs.", verdict: "already", note: "DeepMind's GNoME predicted ~380,000 stable new materials (Nature, 2023); 736 were independently synthesized by experimental labs.", source: { label: "Google DeepMind (GNoME)", url: "https://deepmind.google/blog/millions-of-new-materials-discovered-with-deep-learning/" } },
      { id: "sci-5", claim: "AlphaFold reliably predicts every protein and antibody complex it's given.", verdict: "contested", note: "It struggles with disordered proteins, ligand-bound states and antibody–antigen complexes (~11% success), so wet-lab validation stays essential.", source: { label: "The Protein Journal (2025)", url: "https://link.springer.com/article/10.1007/s10930-025-10310-8" } },
      { id: "sci-6", claim: "Autonomous 'AI scientists' will soon replace human researchers in the lab.", verdict: "unlikely", note: "Autonomous research agents show shallow reviews and high failure rates; developers and Nature agree AI augments rather than replaces human judgment.", source: { label: "Nature (editorial, 2026)", url: "https://www.nature.com/articles/d41586-026-01557-x" } },
    ],
  },
  {
    id: "soldier", name: "Soldier", blurb: "Autonomous weapons · drones · decisions",
    cards: [
      { id: "sol-1", claim: "Drones that pick and strike their own targets are already used in combat.", verdict: "already", note: "Ukraine fields AI terminal-guidance FPV drones; Russia's V2U loitering munition autonomously searches and selects targets, first used in combat Feb 2025.", source: { label: "CSIS", url: "https://www.csis.org/analysis/ukraines-future-vision-and-current-capabilities-waging-ai-enabled-autonomous-warfare" } },
      { id: "sol-2", claim: "A binding global treaty now bans lethal autonomous 'killer robot' weapons.", verdict: "unlikely", note: "No binding treaty exists. The UN chief urged one by 2026, but consensus rules let major military states keep blocking it.", source: { label: "UN News", url: "https://news.un.org/en/story/2025/05/1163256" } },
      { id: "sol-3", claim: "A drone in Libya carried out the world's first confirmed autonomous kill of humans.", verdict: "contested", note: "A 2021 UN report described a Kargu-2 'hunting' fighters in fire-and-forget mode, but never confirmed a kill or autonomous operation — widely overstated.", source: { label: "ICRC Casebook / UN S/2021/229", url: "https://casebook.icrc.org/case-study/libya-use-lethal-autonomous-weapon-systems" } },
      { id: "sol-4", claim: "US policy still requires human judgment over any weapon's use of lethal force.", verdict: "already", note: "DoD Directive 3000.09 (updated 2023) mandates 'appropriate levels of human judgment,' even as the Replicator program fields thousands of autonomous systems.", source: { label: "US Dept. of Defense", url: "https://www.war.gov/News/Releases/Release/Article/3278076/dod-announces-update-to-dod-directive-300009-autonomy-in-weapon-systems/" } },
      { id: "sol-5", claim: "AI systems already generate kill lists of thousands of targets in active wars.", verdict: "already", note: "Israel reportedly used 'Lavender' to mark ~37,000 Gazans for strikes; sources alleged officers spent ~20 seconds rubber-stamping each target.", source: { label: "The Guardian", url: "https://www.theguardian.com/world/2024/apr/03/israel-gaza-ai-database-hamas-airstrikes" } },
      { id: "sol-6", claim: "Soldiers will soon be fully removed from the decision to take a life.", verdict: "contested", note: "Policy still mandates a human in the loop, but analysts warn oversight is eroding into a rubber stamp under battlefield speed and scale.", source: { label: "Survival (IISS), 2025", url: "https://www.tandfonline.com/doi/full/10.1080/00396338.2025.2534284" } },
    ],
  },
  {
    id: "translator", name: "Translator", blurb: "Machine translation · interpreting · nuance",
    cards: [
      { id: "trn-1", claim: "Companies are already replacing human translators with AI for routine work.", verdict: "already", note: "Duolingo cut ~10% of its contractors in early 2024 — largely translators — replacing them with GPT-4 and keeping a few as quality curators.", source: { label: "TechCrunch", url: "https://techcrunch.com/2024/01/09/duolingo-cut-10-of-its-contractor-workforce-as-the-company-embraces-ai/" } },
      { id: "trn-2", claim: "Your earbuds can already translate a live conversation in 70+ languages.", verdict: "already", note: "Google's Gemini-powered Live Translate does real-time speech-to-speech through ordinary headphones in 70+ languages, live in the US, Mexico and India.", source: { label: "Google", url: "https://blog.google/products/translate/language-learning-live-translate/" } },
      { id: "trn-3", claim: "AI now translates as well as experienced professional human translators.", verdict: "contested", note: "A 2024 benchmark found GPT-4 matches junior translators on errors but trails senior humans on fluency and style, degrading on specialized languages.", source: { label: "arXiv (Yan et al., 2024)", url: "https://arxiv.org/abs/2407.03658" } },
      { id: "trn-4", claim: "A major publisher is using AI to translate novels into English.", verdict: "contested", note: "Dutch publisher Veen Bosch & Keuning will AI-translate up to 10 commercial titles; translators objected, citing a third already losing work to AI.", source: { label: "The Guardian", url: "https://www.theguardian.com/books/2024/nov/05/dutch-publisher-to-use-ai-to-translate-limited-number-of-books-into-english" } },
      { id: "trn-5", claim: "AI translation is safe enough to handle high-stakes asylum and court cases.", verdict: "unlikely", note: "AI mistranslations of Pashto/Dari have derailed asylum claims — one pronoun error helped sink a case — keeping certified humans essential.", source: { label: "Rest of World", url: "https://restofworld.org/2023/ai-translation-errors-afghan-refugees-asylum/" } },
      { id: "trn-6", claim: "AI will soon fully replace human translators across every domain.", verdict: "unlikely", note: "US labor data shows AI shrinking routine demand, but certification, liability and nuance keep humans indispensable for legal, medical and literary work.", source: { label: "US Bureau of Labor Statistics", url: "https://www.bls.gov/ooh/media-and-communication/interpreters-and-translators.htm" } },
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
