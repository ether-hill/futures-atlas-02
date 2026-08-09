import { SECTORS, EXPECTED, type Verdict } from "../../data/sectors";

/**
 * Synthetic tallies for `?demo`, so the page can be judged with a full deck
 * behind it before it has that much real traffic.
 *
 * Deliberately not a uniform crowd. It bakes in the two failure modes the page
 * exists to show, so the shapes on the map are the shapes real data would make:
 * people over-believe confident-sounding false claims, and under-believe things
 * that already shipped quietly.
 */
const LEAN: Record<Verdict, number> = {
  unlikely: 0.34,   // false claims still pull a third of the room
  contested: 0.58,  // split, tilted to yes
  likely: 0.74,     // right idea, short of full agreement
  already: 0.55,    // the blind spot: half refuse what has already happened
};

/** Deterministic 0..1 from a string, so the demo looks the same every reload. */
function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 10000) / 10000;
}

export function demoCounters(): Record<string, string> {
  const c: Record<string, string> = {};
  let swipes = 0, believe = 0, doubt = 0, aligned = 0, scored = 0;

  for (const sector of SECTORS) {
    // some decks are played far more than others, as they are in practice
    const pull = 0.35 + hash01(sector.id) * 0.9;
    for (const card of sector.cards) {
      const r = hash01(card.id);
      const n = Math.max(6, Math.round((30 + r * 190) * pull));
      const p = Math.min(0.97, Math.max(0.03, LEAN[card.verdict] + (hash01(card.id + "x") - 0.5) * 0.38));
      const yes = Math.round(n * p);
      const no = n - yes;
      c[`c:${card.id}:b`] = String(yes);
      c[`c:${card.id}:d`] = String(no);
      c[`cat:${sector.id}:b`] = String(Number(c[`cat:${sector.id}:b`] ?? 0) + yes);
      c[`cat:${sector.id}:d`] = String(Number(c[`cat:${sector.id}:d`] ?? 0) + no);
      swipes += n; believe += yes; doubt += no;
      if (card.verdict !== "contested") {
        scored += n;
        aligned += EXPECTED[card.verdict] === 0 ? no : yes;
      }
    }
  }
  Object.assign(c, {
    swipes: String(swipes), believe: String(believe), doubt: String(doubt),
    aligned: String(aligned), scored: String(scored),
    rounds: String(Math.round(swipes / 10)),
  });
  return c;
}
