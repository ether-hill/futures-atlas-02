/**
 * odds-source.ts — pre-stocks the Social Composer library with "The Odds" screens
 * (desktop + mobile captures of the home, each game on load, and each game's
 * survival / annihilation end state). Wired into src/app/page.tsx so the studio
 * opens ready to compose odds posts instead of a blank canvas.
 */
import type { ComposerSource, ComposerFrame } from "./source";

const IMG = (n: string) => `/social-composer/odds/${n}.jpg`;

const players = [
  { k: "elon", name: "Elon Musk", odds: "20% chance of annihilation", mech: "the wheel" },
  { k: "dario", name: "Dario Amodei", odds: "a 25% chance it goes really, really badly", mech: "the die" },
  { k: "tegmark", name: "Max Tegmark", odds: "one of twelve possible futures", mech: "the deck" },
];

function buildFrames(): ComposerFrame[] {
  const f: ComposerFrame[] = [
    { id: "home-d", kind: "gallery", label: "Home · desktop", headline: "The people who build AI think it might end us.", sub: "Play three public p(doom) estimates as games of chance.", imageUrl: IMG("d-home") },
    { id: "home-m", kind: "gallery", label: "Home · mobile", headline: "What are your odds?", sub: "Choose your player: Amodei's die, Musk's wheel, Tegmark's deck.", imageUrl: IMG("m-home") },
  ];
  for (const p of players) {
    f.push({ id: `${p.k}-load-d`, kind: "gallery", label: `${p.name} · start · desktop`, headline: `${p.name}: ${p.odds}.`, sub: `Roll the dice on humanity with ${p.mech}.`, imageUrl: IMG(`d-${p.k}-load`) });
    f.push({ id: `${p.k}-load-m`, kind: "gallery", label: `${p.name} · start · mobile`, headline: `${p.name}: ${p.odds}.`, sub: "", imageUrl: IMG(`m-${p.k}-load`) });
    f.push({ id: `${p.k}-doom-d`, kind: "gallery", label: `${p.name} · annihilation · desktop`, headline: "Annihilation.", sub: "You kept playing until the world burned.", imageUrl: IMG(`d-${p.k}-doom`) });
    f.push({ id: `${p.k}-doom-m`, kind: "gallery", label: `${p.name} · annihilation · mobile`, headline: "Annihilation.", sub: "", imageUrl: IMG(`m-${p.k}-doom`) });
    f.push({ id: `${p.k}-good-d`, kind: "gallery", label: `${p.name} · survival · desktop`, headline: "Earth holds. This time.", sub: `${p.mech.charAt(0).toUpperCase() + p.mech.slice(1)} landed your way.`, imageUrl: IMG(`d-${p.k}-good`) });
    f.push({ id: `${p.k}-good-m`, kind: "gallery", label: `${p.name} · survival · mobile`, headline: "Earth holds. This time.", sub: "", imageUrl: IMG(`m-${p.k}-good`) });
  }
  return f;
}

export function oddsSource(): ComposerSource {
  return {
    kind: "person",
    name: "The Odds",
    description: "An interactive that plays three public p(doom) estimates as games of chance.",
    summary: "Amodei's die, Musk's wheel, Tegmark's deck, then it asks what your survival odds really are.",
    url: "https://futures-atlas-02.vercel.app/theodds",
    frames: buildFrames(),
    headlineOptions: [
      "The people who build AI think it might end us.",
      "What are your odds?",
      "Annihilation.",
      "Earth holds. This time.",
      "Only a 20% chance of annihilation.",
    ],
    attribution: "Futures Atlas · The Odds",
    cards: [],
    listLabel: "Screens",
    hashtags: "#AIrisk #pdoom #AIsafety #FuturesAtlas #TheOdds",
  };
}
