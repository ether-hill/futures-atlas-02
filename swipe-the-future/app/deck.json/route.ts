import { SECTORS } from "../../data/sectors";

// Emitted at build time as /swipe-the-future/deck.json — a flat dump of every
// hand-written claim. The host's weekly freshness cron reads this rather than
// importing across the two Next projects, so the deck stays the single source
// of truth in data/sectors.ts.
export const dynamic = "force-static";

export function GET() {
  return Response.json({
    generatedAt: new Date().toISOString(),
    cards: SECTORS.flatMap((s) =>
      s.cards.map((c) => ({
        id: c.id,
        sectorId: s.id,
        sector: s.name,
        claim: c.claim,
        verdict: c.verdict,
        note: c.note,
        source: c.source,
        checked: c.checked ?? null,
      })),
    ),
  });
}
