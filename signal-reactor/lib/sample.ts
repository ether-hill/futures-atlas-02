/**
 * The sample fallback deck (brief §12) — pre-assembled into the Deck shape.
 * Loaded when generation fails in front of an audience, and the reference for
 * what "good, deflated, specific" output reads like.
 */

import type { Deck } from "./types";

export const SAMPLE_DECK: Deck = {
  sector: "Regional Credit Union",
  mode: "provocation",
  generatedAt: "2026-07-02T09:00:00.000Z",
  promptVersion: "1.0.0",
  slides: [
    {
      type: "cover",
      sector: "Regional Credit Union",
      one: "The real near-term threat isn't a quantum codebreaker — it's AI-native fintechs underwriting a loan in the time it takes you to open a case file.",
      verdict: "narrow",
    },
    {
      type: "signal",
      hype: "Quantum computers will break your encryption and revolutionize member banking overnight.",
      substance:
        "Quantum's only concrete near-term issue for you is cryptographic migration; the actual disruption is advanced AI in fraud, underwriting, and service — where nimble fintechs already outpace incumbents.",
      verdict: "narrow",
      qnote: "Real risk is 'harvest now, decrypt later' data theft, not an imminent live break of today's traffic.",
      ainote: "Fraud detection, member-service automation, and 90-second AI underwriting are reshaping competitiveness right now.",
    },
    {
      type: "horizons",
      near: "Post-quantum migration becomes a board-level compliance item; AI fraud tools and chat-based member service move from pilot to expected baseline.",
      mid: "AI-native lenders compress underwriting to near-instant; regulators formalize PQC mandates; differentiation shifts to trust and local relationship.",
      far: "Cryptographically-relevant quantum machines plausibly arrive; institutions that didn't migrate early face exposure on long-lived data.",
    },
    {
      type: "vectors",
      vectors: [
        { area: "Cryptographic Risk", note: "'Harvest now, decrypt later' puts today's long-lived member data at future risk.", severity: "medium" },
        { area: "Underwriting", note: "AI-native fintechs approve in seconds; manual review becomes a competitive liability.", severity: "high" },
        { area: "Fraud & AML", note: "AI both powers new synthetic-identity attacks and the best defenses against them.", severity: "high" },
        { area: "Workforce", note: "Routine member-service and back-office roles shift toward oversight of AI systems.", severity: "medium" },
        { area: "Regulation", note: "Post-quantum crypto standards move from guidance toward mandate on an uncertain clock.", severity: "low" },
      ],
    },
    {
      type: "considerations",
      items: [
        "Who owns the post-quantum migration timeline and budget?",
        "Whether to build, buy, or partner for AI underwriting",
        "How to defend relationship-banking as the durable moat",
        "What member data must be re-encrypted first",
      ],
    },
    {
      type: "discussion",
      items: [
        "If a fintech underwrites a comparable loan in 90 seconds, what is our honest answer to a member who asks why we take three days?",
        "Which of our services would a member genuinely miss if an AI-native competitor replaced us tomorrow?",
        "Who in this room could name the systems still relying on encryption we plan to retire?",
        "What would it take for us to treat 'harvest now, decrypt later' as a real risk rather than a headline?",
        "Where should AI never touch a member decision, no matter how good it gets?",
      ],
    },
    {
      type: "assumptions",
      items: [
        { claim: "AI underwriting becomes table-stakes by 2028.", condition: "regulators permit model-driven credit decisions at consumer scale.", provenance: "projection" },
        { claim: "Post-quantum migration is urgent now.", condition: "your data must stay confidential for 7+ years — which for financial records, it must.", provenance: "projection" },
        { claim: "Relationship banking remains a moat.", condition: "members keep valuing human trust over pure speed and price.", provenance: "projection" },
      ],
    },
    {
      type: "monday",
      items: [
        "Inventory every system and dataset that depends on soon-to-be-legacy encryption.",
        "Run one honest pilot benchmarking your underwriting speed against an AI-native competitor.",
        "Assign a named owner for post-quantum readiness before it becomes an examiner's question.",
      ],
    },
  ],
};
