// Swipe the Future v2. Calibration · data layer.
// Content lives here, not in components. Adding a sector or a card is a data
// edit, no component change.
//
// THE QUESTION THE GAME ASKS
//
// Every card is a statement about the world as it stands, and there are exactly
// two answers: it has already happened, or it has not happened yet.
//
// That replaced v1's four-step true/false/kinda/already scale, which had a fatal
// flaw: TRUE was the right swipe on 67% of scorable cards, so a player who
// swiped TRUE on everything and thought about nothing scored 67%. A game meant
// to measure credulity was rewarding it. A binary question can be keyed 5/5 by
// construction, and it turns the deck into one honest test: do you know which
// futures already arrived and which ones are still brochure?
//
// v1 is preserved, unchanged, at /swipe-v1. It is a different game, not an
// older draft of this one.
//
// HOUSE STYLE FOR A CLAIM
//   1. Present tense, about the world as it is. Not "by 2030 X will happen" but
//      "X has happened". A claim in the future tense has no answer.
//   2. It has to be answerable wrong. If you cannot picture a well-read person
//      swiping the other way, the card is dead weight.
//   3. Aim for one of the two good surprises. Either it sounds like science
//      fiction and it shipped decades ago, or it sounds inevitable and it has
//      flatly not happened.
//   4. Something checkable: a number, a named organisation, a shipped product,
//      a ruling, a date.
//   5. One sentence, plain language, no em dashes.
//   6. Key every deck 5 already / 5 not yet. A deck where one answer keeps
//      working is a deck people stop reading.
//
// Some pairs sit either side of a single distinguishing word, and the reveal has
// to name that word or the player feels caught out rather than taught: w1/w10
// (writers won limits, no union won a ban), l4/l7 (AI assists a whole court
// system, it does not decide), h5/h10 (regulation moving in one place, stalled
// in another). Do not deal a pair adjacently.
//
// SOURCES
// Every card carries a resolvable primary source. No source, no card. The claims
// were authored separately from the sourcing, so a handful of reveals disagreed
// with what their source actually says once it was found. Those carry a
// `correction` field recording what was originally written, so the edit can be
// audited rather than taken on trust. It is an author's note: it appears on the
// admin desk and never on a card.

export type Verdict = "notyet" | "already";
export type SectorKind = "sector" | "wildcard" | "generated";

export interface Card {
  id: string;
  claim: string;
  /** Three to five words naming the same thing, for chart rows where the full
   *  claim will not fit. A label, not a second claim: it must not change what
   *  is being asserted. */
  short: string;
  verdict: Verdict;
  /** The reveal, in the order the card shows it.
   *  `bigLabel` + `big` is the headline fact, set large: for a card that has
   *  happened that is the year, and for one that hasn't it is the nearest
   *  approach ("1,500 devices, none generative", "Closest crossing 2022"), so
   *  the not-yet half teaches a boundary instead of just saying no.
   *  `lede` is the sentence that settles it, `note` the supporting detail. */
  /** Optional: only set when there is a value worth showing large. A bare
   *  "None" under a noun-phrase label ("Boards that have licensed one") reads
   *  as a riddle you solve at the last word, so those cards omit it and let
   *  `lede` be the headline instead. */
  bigLabel?: string;
  big?: string;
  lede: string;
  note: string;
  /** Set when the authored reveal disagreed with what its source actually says.
   *  An audit trail for whoever wrote the claim, NEVER shown to a player: it was
   *  leaking into the reveal, where "CORRECTED (authored as …)" reads as the
   *  game correcting itself mid-answer. Surfaced on the admin desk instead. */
  correction?: string;
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

// Verdict config: labels and colours, imported everywhere. Said in the same
// words as the buttons, so nobody has to translate between two vocabularies to
// read their own result.
export const VLABEL: Record<Verdict, string> = { notyet: "Not yet", already: "Already real" };
export const VCOLOR: Record<Verdict, string> = { notyet: "var(--oxblood)", already: "var(--verdigris)" };
// What share of a well-read crowd should answer ALREADY REAL. Binary, so it is
// the answer expressed as a number; the stats page subtracts it from what the
// crowd actually said to get the gap.
export const EXPECTED: Record<Verdict, number> = { notyet: 0, already: 1 };

const CHECKED = "2026-08-09";

export const SECTORS: Sector[] = [
  {
    id: "health", kind: "sector", name: "Health & medicine", blurb: "Diagnosis · approval · what a machine is allowed to do",
    cards: [
      { id: "h1", claim: "Software has been reading cervical smear slides in real clinics.", short: "Software reading smear slides", verdict: "already", note: "Generally counted as the first AI-enabled medical device anywhere.", bigLabel: "Already real since", big: "1995", lede: "PAPNET won FDA premarket approval for rescreening Pap smears.", source: { label: "FDA premarket approval, PAPNET (1995)", url: "https://link.springer.com/article/10.1007/s10462-023-10588-z" }, checked: CHECKED },
      { id: "h2", claim: "A regulator has approved an AI to diagnose patients with no doctor reading the result.", short: "AI diagnosis, no doctor", verdict: "already", note: "The result goes straight into the patient's file, with no clinician interpreting the image.", bigLabel: "Already real since", big: "2018", lede: "The FDA cleared IDx-DR for diabetic retinopathy.", source: { label: "FDA / Digital Diagnostics", url: "https://www.digitaldiagnostics.com/fda-permits-marketing-of-lumineticscore-formerly-known-as-idx-dr-for-automated-detection-of-diabetic-retinopathy-in-primary-care/" }, checked: CHECKED },
      { id: "h3", claim: "A health authority has recommended AI read chest X-rays instead of a human.", short: "AI reads chest X-rays officially", verdict: "already", note: "For people aged 15 and over.", bigLabel: "Already real since", big: "2021", lede: "The WHO recommended computer-aided detection as an alternative to a human reader for TB screening.", source: { label: "WHO, computer-aided detection for TB screening (2021)", url: "https://www.who.int/publications/b/79103" }, checked: CHECKED },
      { id: "h4", claim: "A multi-centre study has found doctors got worse at their own job after months of using AI.", short: "Doctors deskilled by AI", verdict: "already", note: "Published in Lancet Gastroenterology & Hepatology.", bigLabel: "Already real since", big: "2025", lede: "Endoscopists' unassisted adenoma detection fell from 28.4% to 22.4% after routine AI exposure.", source: { label: "Lancet Gastro & Hep, endoscopist deskilling (2025)", url: "https://www.thelancet.com/journals/langas/article/PIIS2468-1253(25)00289-4/abstract" }, checked: CHECKED },
      { id: "h5", claim: "It has been made illegal in some places for an AI to act as someone's therapist.", short: "AI therapy banned somewhere", verdict: "already", correction: "Authored as 'seven jurisdictions'", note: "Penalties run up to $15,000 a violation. Four more states regulate without banning.", bigLabel: "Already real since", big: "2025", lede: "Illinois banned AI from delivering therapy on its own, the first of four US states.", source: { label: "CNN, state AI therapy laws", url: "https://www.cnn.com/2025/08/27/health/ai-therapy-laws-state-regulation-wellness" }, checked: CHECKED },
      { id: "h6", claim: "A medical device that runs on a large language model has been approved for sale.", short: "LLM medical device approved", verdict: "notyet", note: "Not one of them is generative or built on a large language model.", bigLabel: "Devices approved, none generative", big: "1,500", lede: "The FDA has authorised roughly 1,500 AI-enabled medical devices.", source: { label: "FDA, AI-enabled medical device list", url: "https://www.fda.gov/medical-devices/software-medical-device-samd/artificial-intelligence-enabled-medical-devices" }, checked: CHECKED },
      { id: "h7", claim: "A drug designed by AI has completed late-stage trials and been approved for general prescription.", short: "AI-designed drug approved", verdict: "notyet", note: "Nothing AI-designed has been approved for general prescription.", bigLabel: "Furthest any has got", big: "Phase 2a", lede: "Insilico's lung-fibrosis drug reached positive phase 2a results in Nature Medicine in 2025, a first.", source: { label: "Insilico / Nature Medicine (2025)", url: "https://www.prnewswire.com/news-releases/insilico-medicine-announces-nature-medicine-publication-of-phase-iia-results-evaluating-rentosertib-the-novel-tnik-inhibitor-for-idiopathic-pulmonary-fibrosis-ipf-discovered-and-designed-with-a-pioneering-ai-approach-302472070.html" }, checked: CHECKED },
      { id: "h8", claim: "A national medical board has granted an AI system a licence to practise.", short: "AI licensed to practise medicine", verdict: "notyet", note: "The traffic runs the other way: US states have started legislating to stop AI practising a licensed health profession at all.", lede: "No medical board in any jurisdiction has licensed an AI to practise.", source: { label: "CNN, state AI therapy laws", url: "https://www.cnn.com/2025/08/27/health/ai-therapy-laws-state-regulation-wellness" }, checked: CHECKED },
      { id: "h9", claim: "A national health service has replaced its radiologists with AI.", short: "Radiologists replaced by AI", verdict: "notyet", note: "Demand rose over the same decade, pay reached about $571,000, and he has conceded the timing.", lede: "Hinton told people to stop training radiologists in 2016.", source: { label: "New Republic / NYT", url: "https://newrepublic.com/article/187203/ai-radiology-geoffrey-hinton-nobel-prediction" }, checked: CHECKED },
      { id: "h10", claim: "Europe's dedicated AI rules for medical devices have taken effect.", short: "EU AI device rules in force", verdict: "notyet", note: "December 2027 for standalone systems, August 2028 for AI inside regulated products such as medical devices.", bigLabel: "Pushed back to", big: "2028", lede: "The EU deferred its high-risk AI obligations.", source: { label: "EU AI Act, agreed delay to high-risk rules", url: "https://www.hlc.com/en/publications/eu-legislators-agree-to-delay-for-highrisk-ai-rules" }, checked: CHECKED },
    ],
  },
  {
    id: "transport", kind: "sector", name: "Transport", blurb: "Driverless everything · and the bits that stayed human",
    cards: [
      { id: "t1", claim: "Driverless passenger trains have carried the public with no staff on board.", short: "Driverless passenger trains", verdict: "already", correction: "Authored as 1981 France", note: "Lille was the first automated network under a major city. Trains and stations are unstaffed.", bigLabel: "Already real since", big: "1981", lede: "Kobe's Port Island Line opened driverless, and Lille's VAL followed in 1983.", source: { label: "Railway Technology, Lille VAL", url: "https://www.railway-technology.com/projects/lille_val/" }, checked: CHECKED },
      { id: "t2", claim: "Long-distance trucks have carried commercial freight on public roads with nobody in the cab.", short: "Driverless trucks on highways", verdict: "already", note: "The first heavy-truck self-driving service on public roads.", bigLabel: "Already real since", big: "2025", lede: "Aurora opened driverless freight between Dallas and Houston on 1 May.", source: { label: "Aurora Innovation", url: "https://ir.aurora.tech/news-events/press-releases/detail/119/aurora-begins-commercial-driverless-trucking-in-texas-ushering-in-a-new-era-of-freight" }, checked: CHECKED },
      { id: "t3", claim: "A peer-reviewed study has found driverless cars have fewer injury crashes than human drivers.", short: "Driverless cars crash less, proven", verdict: "already", note: "Peer-reviewed, in Traffic Injury Prevention.", bigLabel: "Already real since", big: "2025", lede: "A study across 56.7 million driverless miles found Waymo's injury-crash rate significantly below the human benchmark.", source: { label: "Traffic Injury Prevention (2025)", url: "https://www.tandfonline.com/doi/full/10.1080/15389588.2025.2499887" }, checked: CHECKED },
      { id: "t4", claim: "More than eight million deliveries have been completed by robots driving themselves along pavements.", short: "Eight million robot deliveries", verdict: "already", note: "More than 2,700 robots across 270+ locations.", bigLabel: "Already real since", big: "2025", lede: "Starship passed eight million autonomous deliveries by April.", source: { label: "The Robot Report", url: "https://www.therobotreport.com/starship-technologies-surpasses-8m-autonomous-deliveries/" }, checked: CHECKED },
      { id: "t5", claim: "Container terminals have moved cargo with no human operating the cranes.", short: "Automated container terminals", verdict: "already", note: "Driverless vehicles and automated stacking cranes, running around the clock.", bigLabel: "Already real since", big: "1993", lede: "Rotterdam's ECT Delta opened as the world's first automated container terminal.", source: { label: "ECT Hutchison Ports, 30 years of the first automated terminal", url: "https://www.ect.nl/en/news/fast-forward/30-years-ago-ect-opened-very-first-automated-terminal-world" }, checked: CHECKED },
      { id: "t6", claim: "A car has been sold to the public that needs no human supervision at any point.", short: "Car needing no supervision", verdict: "notyet", correction: "Authored as 'everything on sale requires constant attention', which skipped the Level 3 system that was on sale", note: "It was dropped from the 2026 S-Class for a supervised system.", bigLabel: "Closest thing on sale", big: "Level 3", lede: "Mercedes Drive Pilot, the one eyes-off system sold to US drivers, worked only in narrow conditions.", source: { label: "InsideEVs, Mercedes Level 3 withdrawn", url: "https://insideevs.com/news/784404/mercedes-level-3-drive-pilot-canceled/" }, checked: CHECKED },
      { id: "t7", claim: "Cargo ships have crossed an ocean with no crew on board.", short: "Crewless cargo ship crossing", verdict: "notyet", note: "It was towed the last 25 miles. No cargo ship has crossed without a crew.", bigLabel: "Closest crossing", big: "2022", lede: "The uncrewed Mayflower, a small research vessel, crossed the Atlantic.", source: { label: "Maritime Executive, Mayflower crossing", url: "https://maritime-executive.com/article/mayflower-autonomous-ship-completes-historic-atlantic-crossing" }, checked: CHECKED },
      { id: "t8", claim: "A country has set a date to phase out human-driven cars.", short: "Date set to end human driving", verdict: "notyet", note: "None has set one for the driver. The idea is proposed, and legislated nowhere.", lede: "Sixty-odd countries have set dates to phase out petrol and diesel cars.", source: { label: "Science and Engineering Ethics, should manual driving be outlawed", url: "https://link.springer.com/article/10.1007/s11948-020-00190-9" }, checked: CHECKED },
      { id: "t9", claim: "A commercial passenger flight has operated with no pilot on board.", short: "Pilotless passenger flight", verdict: "notyet", note: "Reliable Robotics is aiming at 2028 certification, and Merlin flies its system with a human safety pilot.", lede: "The work is all cargo first.", source: { label: "IEEE Spectrum, autonomous plane certification", url: "https://spectrum.ieee.org/autonomous-planes-certification" }, checked: CHECKED },
      { id: "t10", claim: "An autonomous vehicle company has been criminally prosecuted over a passenger death.", short: "AV firm prosecuted over a death", verdict: "notyet", correction: "Authored as 'no prosecution'", note: "Cruise took a deferred prosecution and a $500,000 fine, but for lying about a crash.", lede: "Prosecutors cleared Uber over the 2018 Tempe death and charged its safety driver instead.", source: { label: "US DOJ, Cruise false report agreement", url: "https://www.justice.gov/usao-ndca/pr/cruise-admits-submitting-false-report-influence-federal-investigation-and-agrees-pay" }, checked: CHECKED },
    ],
  },
  {
    id: "work", kind: "sector", name: "Work & employment", blurb: "Strikes · firings · the laws that did and didn't arrive",
    cards: [
      { id: "w1", claim: "Screenwriters have gone on strike and won contract limits on studios using AI.", short: "Writers struck, won AI limits", verdict: "already", note: "AI cannot be considered a writer, and AI material cannot undercut a writer's credit.", bigLabel: "Already real since", big: "2023", lede: "A 148-day writers' strike ended with AI terms in the contract.", source: { label: "Writers Guild of America, AI provisions", url: "https://www.wga.org/contracts/know-your-rights/artificial-intelligence" }, checked: CHECKED },
      { id: "w2", claim: "Workers have been dismissed by an automated system, with no manager involved in the decision.", short: "Fired by an algorithm", verdict: "already", note: "Roughly 300 people at one site. Amazon says managers can override.", bigLabel: "Already real since", big: "2019", lede: "Documents showed Amazon's system generating warnings and terminations from productivity metrics with no supervisor input.", source: { label: "MIT Technology Review", url: "https://www.technologyreview.com/2019/04/26/1021/amazons-system-for-tracking-its-warehouse-workers-can-automatically-fire-them/" }, checked: CHECKED },
      { id: "w3", claim: "A study of millions of freelance job listings found design work dropped after AI image tools arrived.", short: "Design listings fell after AI", verdict: "already", note: "Measured by Hui, Reshef and Zhou.", bigLabel: "Already real since", big: "2024", lede: "Across five million Upwork postings, graphic-design listings fell about 17% once the image generators launched.", source: { label: "Hui, Reshef and Zhou, 2024", url: "https://questromworld.bu.edu/platformstrategy/wp-content/uploads/sites/49/2024/06/PlatStrat2024_paper_119.pdf" }, checked: CHECKED },
      { id: "w4", claim: "A randomised trial has found experienced software developers work slower with AI tools than without.", short: "Devs slower with AI, trialled", verdict: "already", note: "They believed they had been 20% faster.", bigLabel: "Already real since", big: "2025", lede: "METR ran a randomised trial: experienced developers were 19% slower with AI tools.", source: { label: "METR, July 2025", url: "https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/" }, checked: CHECKED },
      { id: "w5", claim: "Employers have been banned by law from using AI to infer their workers' emotions.", short: "Emotion AI banned at work", verdict: "already", note: "An outright prohibited practice, not a regulated one. Fines reach 35 million euro or 7% of global turnover.", bigLabel: "Already real since", big: "2025", lede: "The EU ban on inferring workers' emotions took force on 2 February.", source: { label: "European Commission, AI Act", url: "https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai" }, checked: CHECKED },
      { id: "w6", claim: "A national government has introduced a tax on companies that replace workers with AI.", short: "Tax on replacing workers", verdict: "notyet", correction: "Authored as 'enacted nowhere'", note: "No direct tax exists anywhere, and the European Parliament voted one down.", lede: "South Korea trimmed a tax break for automation investment in 2017, widely miscalled a robot tax.", source: { label: "Stephensons, South Korea's robot tax", url: "https://www.stephensons.co.uk/site/news_and_events/uptodatenews/south-korea-introduces-worlds-first-robot-tax" }, checked: CHECKED },
      { id: "w7", claim: "A company of significant size has appointed an AI system as a director with legal authority.", short: "AI appointed company director", verdict: "notyet", note: "Precisely because Hong Kong law requires a director to be a natural person.", lede: "Deep Knowledge Ventures' VITAL was given board observer status in 2014.", source: { label: "Governance Institute of Australia", url: "https://www.governanceinstitute.com.au/news_media/ai-in-the-boardroom-could-robots-soon-be-running-companies/" }, checked: CHECKED },
      { id: "w8", claim: "A national labour force survey has recorded a fall in overall employment attributed to AI.", short: "Employment fall blamed on AI", verdict: "notyet", note: "Displacement shows up by occupation in forecasts like the WEF's declining-roles list, not in the headline figures.", lede: "No national labour force survey has recorded a fall attributed to AI.", source: { label: "WEF Future of Jobs 2025", url: "https://www.weforum.org/publications/the-future-of-jobs-report-2025/" }, checked: CHECKED },
      { id: "w9", claim: "A country has legislated a shorter standard working week and named AI productivity as the reason.", short: "Shorter week credited to AI", verdict: "notyet", note: "None of the trials rests its case on AI.", lede: "Twelve US states have proposed four-day-week bills and none has passed.", source: { label: "Harvard Business Review, what's stopping the 4-day week", url: "https://hbr.org/2026/04/whats-stopping-the-4-day-workweek" }, checked: CHECKED },
      { id: "w10", claim: "A trade union has won an agreement banning AI from a job category outright.", short: "Union ban on AI in a job", verdict: "notyet", note: "They constrain, and they protect against AI-driven layoffs. They do not ban.", lede: "The agreements that exist require bargaining before deployment and restrict named uses.", source: { label: "Partnership on AI, three union agreements", url: "https://partnershiponai.org/these-3-agreements-secured-ai-protections-for-30000-union-workers/" }, checked: CHECKED },
    ],
  },
  {
    id: "law", kind: "sector", name: "Law & justice", blurb: "Sanctions · settlements · what a machine may decide",
    cards: [
      { id: "l1", claim: "Lawyers have been fined by courts for citing cases an AI invented.", short: "Lawyers fined for AI citations", verdict: "already", note: "Sanctions run from $1,000 to more than $30,000.", bigLabel: "Already real since", big: "2023", lede: "Hundreds of filings have carried fabricated AI citations, up sevenfold in 2025.", source: { label: "Bloomberg Law · court records", url: "https://news.bloomberglaw.com/" }, checked: CHECKED },
      { id: "l2", claim: "An AI company has agreed to pay authors more than a billion dollars for training on their books without permission.", short: "Billion-dollar authors settlement", verdict: "already", correction: "Authored as 'a 2025 settlement'; agreed 2025, finally approved 2026", note: "Approved in 2026. About $3,000 a book across roughly 482,000 works.", bigLabel: "Already real since", big: "2025", lede: "Anthropic agreed $1.5 billion, the largest copyright class settlement on record.", source: { label: "Courthouse News Service", url: "https://www.courthousenews.com/anthropic-to-pay-1-5-billion-copyright-settlement-to-authors-publishers/" }, checked: CHECKED },
      { id: "l3", claim: "A national judiciary has issued official guidance telling judges they may use AI chatbots in their work.", short: "Judges told they may use AI", verdict: "already", note: "It permits summarising and drafting, warns against legal research, and bars putting anything confidential into a public chatbot.", bigLabel: "Already real since", big: "2023", lede: "England and Wales issued AI guidance to judges on 12 December.", source: { label: "Courts and Tribunals Judiciary, AI guidance", url: "https://www.judiciary.uk/wp-content/uploads/2023/12/AI-Judicial-Guidance.pdf" }, checked: CHECKED },
      { id: "l4", claim: "A country has run entire court proceedings online with AI assisting the judges, for years.", short: "Court systems online with AI", verdict: "already", note: "Filing to judgment happens online, with AI assistants added from 2019.", bigLabel: "Already real since", big: "2017", lede: "China opened its first internet court, in Hangzhou.", source: { label: "ABA Journal, China's internet courts", url: "https://www.abajournal.com/magazine/article/china-all-virtual-specialty-internet-courts" }, checked: CHECKED },
      { id: "l5", claim: "Landlords using a shared algorithm to set rents have been sued for price-fixing.", short: "Rent algorithm sued for price-fixing", verdict: "already", note: "It settled in 2025 with limits on the data the algorithm may use, and no admission.", bigLabel: "Already real since", big: "2024", lede: "The US Justice Department and eight states sued RealPage in August.", source: { label: "Wilson Sonsini, DOJ settles the RealPage case", url: "https://www.wsgr.com/en/insights/doj-settles-its-algorithmic-price-fixing-case-against-realpage.html" }, checked: CHECKED },
      { id: "l6", claim: "An AI system has been granted a licence to practise law.", short: "AI licensed to practise law", verdict: "notyet", note: "The live question runs the other way: whether a chatbot giving legal answers is already the unauthorised practice of law.", lede: "No jurisdiction has licensed an AI to practise law.", source: { label: "Thomson Reuters Institute, AI and unauthorized practice of law", url: "https://www.thomsonreuters.com/en-us/posts/government/ai-impacts-unauthorized-practice-of-law/" }, checked: CHECKED },
      { id: "l7", claim: "An AI has sat as a judge in a binding court proceeding.", short: "AI sat as a judge", verdict: "notyet", note: "The decision stays with the judge.", lede: "China runs whole court systems where AI assists the judge and speeds the paperwork.", source: { label: "ABA Journal, China's internet courts", url: "https://www.abajournal.com/magazine/article/china-all-virtual-specialty-internet-courts" }, checked: CHECKED },
      { id: "l8", claim: "An AI system has been granted legal personhood in any jurisdiction.", short: "AI granted legal personhood", verdict: "notyet", note: "Several US states are going the opposite way, with bills to bar courts from recognising it at all.", lede: "No jurisdiction has granted an AI legal personhood.", source: { label: "NPR, states considering bans on AI legal personhood", url: "https://www.npr.org/2026/05/11/nx-s1-5798754/several-states-considering-ban-on-legal-personhood-for-ai" }, checked: CHECKED },
      { id: "l9", claim: "A country has made AI-assisted legal research mandatory in public defence.", short: "AI research mandated in defence", verdict: "notyet", note: "Courts keep insisting on human verification.", lede: "AI is spreading through access-to-justice work by adoption and pilot, not by mandate.", source: { label: "Thomson Reuters Institute, AI-powered access to justice", url: "https://www.thomsonreuters.com/en-us/posts/government/ai-impacts-unauthorized-practice-of-law/" }, checked: CHECKED },
      { id: "l10", claim: "A conviction has been overturned because evidence turned out to be AI-generated.", short: "Conviction overturned over AI evidence", verdict: "notyet", note: "Courts are wrestling with how to authenticate video at all, and deepfake challenges are being raised.", lede: "No appellate reversal has turned on AI-generated evidence.", source: { label: "National Center for State Courts, AI-generated evidence", url: "https://www.ncsc.org/resources-courts/ai-generated-evidence-threat-public-trust-courts" }, checked: CHECKED },
    ],
  },
];

// The player answered ALREADY REAL (`sayReal`) or NOT YET. Binary, so alignment
// is just agreement: no card is unscorable and no answer is free.
export function isAligned(verdict: Verdict, sayReal: boolean): boolean {
  return sayReal === (verdict === "already");
}

export interface Profile { name: string; desc: string; lblNote: string }
/**
 * `over` is a hype trap: you said something had happened when it had not.
 * `under` is a blind spot: you said not yet about something already shipped.
 * Which one you do more says more about you than the score does.
 */
export function profileFor(matched: number, total: number, over: number, under: number): Profile {
  const rate = total ? matched / total : 0;
  if (under >= 2 && under > over)
    return { name: "Caught Flat-Footed", desc: "The future you think you're waiting for is partly here already. Some of what you called not yet has been running since before you were watching.", lblNote: "but the present outran you" };
  if (over >= 2 && over > under)
    return { name: "The Accelerationist", desc: "You buy the demo. Things that were announced, proposed or teleoperated read to you as things that happened.", lblNote: "running ahead of the evidence" };
  if (rate >= 0.8)
    return { name: "Well Calibrated", desc: "You can tell a shipped thing from a press release, in both directions. Rare.", lblNote: "and your instincts held" };
  if (rate >= 0.5)
    return { name: "Roughly Tuned", desc: "Right neighbourhood, a few misses, usually on the things that are further along than they feel.", lblNote: "with a few blind spots" };
  return { name: "The Sceptic", desc: "You resist the story hard, past the point where the thing actually happened. Doubt is cheap; calibration isn't.", lblNote: "but doubt overshot the facts" };
}

// ── deck helpers ──────────────────────────────────────────────────────────
export const SECTOR_DECKS = SECTORS.filter((s) => s.kind === "sector");
export const WILDCARD_DECKS = SECTORS.filter((s) => s.kind === "wildcard");
export const ALL_CARDS = SECTORS.flatMap((s) => s.cards.map((c) => ({ card: c, sector: s })));
export const cardById = new Map(ALL_CARDS.map(({ card, sector }) => [card.id, { card, sector }]));
