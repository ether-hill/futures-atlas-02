import { SECTORS, type Verdict } from "../../data/sectors";

/**
 * Synthetic tallies for /stats?demo.
 *
 * The real page needs traffic before it says anything, which makes it hard to
 * judge the layout, the colour split or whether the charts hold a full deck.
 * This fills every card with invented numbers so all of that can be looked at.
 * It is never the default and the page labels itself loudly when it is on.
 *
 * The pattern baked in is the one the game exists to look for, so the charts can
 * be read for shape rather than for findings: things that have not happened
 * still pull a third of the room, and things that have been running for decades
 * are doubted by nearly half of it.
 */
const LEAN: Record<Verdict, number> = {
  notyet: 0.36,  // hasn't happened, and a third of the room buys it anyway
  already: 0.58, // has happened, and only just over half will say so
};

/** Deterministic 0..1 from a string, so the demo looks the same every reload. */
function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 10000) / 10000;
}

export function demoCounters(): Record<string, string> {
  const out: Record<string, string> = {};
  let swipes = 0, real = 0, notyet = 0, aligned = 0;

  for (const sector of SECTORS) {
    for (const card of sector.cards) {
      const a = hash01(card.id), b = hash01(`${card.id}:n`);
      const n = 18 + Math.round(b * 90);                       // 18…108 swipes
      const p = Math.min(0.96, Math.max(0.04, LEAN[card.verdict] + (a - 0.5) * 0.42));
      const said = Math.round(n * p);
      const notSaid = n - said;

      out[`c:${card.id}:r`] = String(said);
      out[`c:${card.id}:n`] = String(notSaid);
      out[`cat:${sector.id}:r`] = String(Number(out[`cat:${sector.id}:r`] ?? 0) + said);
      out[`cat:${sector.id}:n`] = String(Number(out[`cat:${sector.id}:n`] ?? 0) + notSaid);

      swipes += n; real += said; notyet += notSaid;
      aligned += card.verdict === "already" ? said : notSaid;
    }
  }

  out.swipes = String(swipes);
  out.real = String(real);
  out.notyet = String(notyet);
  out.aligned = String(aligned);
  out.rounds = String(Math.round(swipes / 10));
  return out;
}
