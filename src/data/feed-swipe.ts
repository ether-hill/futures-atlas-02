/**
 * Ten cards copied verbatim from Swipe the Future's own deck, for the playable
 * taster in the feed. Keyed 5 already / 5 not-yet and spread across sectors,
 * exactly as that game keys a round — a deck where one answer keeps working is
 * a deck people stop reading.
 *
 * Copied rather than imported: swipe-the-future is a separate app with its own
 * build, and reaching into its data layer would couple the host to it. The
 * trade is that this can go stale — if a verdict or a source changes over
 * there, change it here. The full deck is always at /swipe-the-future.
 */

export interface SwipeSample {
  id: string;
  claim: string;
  verdict: "already" | "notyet";
  /** The reveal: a label, then the number or phrase it sets up. */
  bigLabel: string;
  big: string;
  /** One line explaining the verdict, then the caveat under it. */
  lede: string;
  note: string;
  source: { label: string; url: string };
}

/** When the sources were last checked, in the game's own data. */
export const SWIPE_CHECKED = "2026-08-09";

export const SWIPE_SAMPLE: SwipeSample[] = [
  {
    id: "h1",
    claim: "Software has been reading cervical smear slides in real clinics.",
    verdict: "already",
    bigLabel: "Already real since",
    big: "1995",
    lede: "PAPNET won FDA premarket approval for rescreening Pap smears.",
    note: "Generally counted as the first AI-enabled medical device anywhere.",
    source: { label: "FDA premarket approval, PAPNET (1995)", url: "https://link.springer.com/article/10.1007/s10462-023-10588-z" },
  },
  {
    id: "h6",
    claim: "A medical device that runs on a large language model has been approved for sale.",
    verdict: "notyet",
    bigLabel: "Devices approved, none generative",
    big: "1,500",
    lede: "The FDA has authorised roughly 1,500 AI-enabled medical devices.",
    note: "Not one of them is generative or built on a large language model.",
    source: { label: "FDA, AI-enabled medical device list", url: "https://www.fda.gov/medical-devices/software-medical-device-samd/artificial-intelligence-enabled-medical-devices" },
  },
  {
    id: "t1",
    claim: "Driverless passenger trains have carried the public with no staff on board.",
    verdict: "already",
    bigLabel: "Already real since",
    big: "1981",
    lede: "Kobe's Port Island Line opened driverless, and Lille's VAL followed in 1983.",
    note: "Lille was the first automated network under a major city. Trains and stations are unstaffed.",
    source: { label: "Railway Technology, Lille VAL", url: "https://www.railway-technology.com/projects/lille_val/" },
  },
  {
    id: "t6",
    claim: "A car has been sold to the public that needs no human supervision at any point.",
    verdict: "notyet",
    bigLabel: "Closest thing on sale",
    big: "Level 3",
    lede: "Mercedes Drive Pilot, the one eyes-off system sold to US drivers, worked only in narrow conditions.",
    note: "It was dropped from the 2026 S-Class for a supervised system.",
    source: { label: "InsideEVs, Mercedes Level 3 withdrawn", url: "https://insideevs.com/news/784404/mercedes-level-3-drive-pilot-canceled/" },
  },
  {
    id: "w1",
    claim: "Screenwriters have gone on strike and won contract limits on studios using AI.",
    verdict: "already",
    bigLabel: "Already real since",
    big: "2023",
    lede: "A 148-day writers' strike ended with AI terms in the contract.",
    note: "AI cannot be considered a writer, and AI material cannot undercut a writer's credit.",
    source: { label: "Writers Guild of America, AI provisions", url: "https://www.wga.org/contracts/know-your-rights/artificial-intelligence" },
  },
  {
    id: "h7",
    claim: "A drug designed by AI has completed late-stage trials and been approved for general prescription.",
    verdict: "notyet",
    bigLabel: "Furthest any has got",
    big: "Phase 2a",
    lede: "Insilico's lung-fibrosis drug reached positive phase 2a results in Nature Medicine in 2025, a first.",
    note: "Nothing AI-designed has been approved for general prescription.",
    source: { label: "Insilico / Nature Medicine (2025)", url: "https://www.prnewswire.com/news-releases/insilico-medicine-announces-nature-medicine-publication-of-phase-iia-results-evaluating-rentosertib-the-novel-tnik-inhibitor-for-idiopathic-pulmonary-fibrosis-ipf-discovered-and-designed-with-a-pioneering-ai-approach-302472070.html" },
  },
  {
    id: "l1",
    claim: "Lawyers have been fined by courts for citing cases an AI invented.",
    verdict: "already",
    bigLabel: "Already real since",
    big: "2023",
    lede: "Hundreds of filings have carried fabricated AI citations, up sevenfold in 2025.",
    note: "Sanctions run from $1,000 to more than $30,000.",
    source: { label: "Bloomberg Law · court records", url: "https://news.bloomberglaw.com/" },
  },
  {
    id: "t7",
    claim: "Cargo ships have crossed an ocean with no crew on board.",
    verdict: "notyet",
    bigLabel: "Closest crossing",
    big: "2022",
    lede: "The uncrewed Mayflower, a small research vessel, crossed the Atlantic.",
    note: "It was towed the last 25 miles. No cargo ship has crossed without a crew.",
    source: { label: "Maritime Executive, Mayflower crossing", url: "https://maritime-executive.com/article/mayflower-autonomous-ship-completes-historic-atlantic-crossing" },
  },
  {
    id: "h2",
    claim: "A regulator has approved an AI to diagnose patients with no doctor reading the result.",
    verdict: "already",
    bigLabel: "Already real since",
    big: "2018",
    lede: "The FDA cleared IDx-DR for diabetic retinopathy.",
    note: "The result goes straight into the patient's file, with no clinician interpreting the image.",
    source: { label: "FDA / Digital Diagnostics", url: "https://www.digitaldiagnostics.com/fda-permits-marketing-of-lumineticscore-formerly-known-as-idx-dr-for-automated-detection-of-diabetic-retinopathy-in-primary-care/" },
  },
  {
    id: "h10",
    claim: "Europe's dedicated AI rules for medical devices have taken effect.",
    verdict: "notyet",
    bigLabel: "Pushed back to",
    big: "2028",
    lede: "The EU deferred its high-risk AI obligations.",
    note: "December 2027 for standalone systems, August 2028 for AI inside regulated products such as medical devices.",
    source: { label: "EU AI Act, agreed delay to high-risk rules", url: "https://www.hlc.com/en/publications/eu-legislators-agree-to-delay-for-highrisk-ai-rules" },
  },
];
