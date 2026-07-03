/**
 * odds-source.ts — pre-stocks the Social Composer library with "The Odds" screens
 * (desktop + mobile captures of the home, each game on load, and each game's
 * survival / annihilation end state). Wired into src/app/page.tsx so the studio
 * opens ready to compose odds posts instead of a blank canvas.
 *
 * Headline/subtext are intentionally EMPTY by default — the user writes their own
 * copy per post; the frames just supply the imagery (and a label to find them by).
 */
import type { ComposerSource, ComposerFrame } from "./source";

const IMG = (n: string) => `/social-composer/odds/${n}.jpg`;
const g = (id: string, label: string, img: string): ComposerFrame => ({
  id, kind: "gallery", label, headline: "", sub: "", imageUrl: IMG(img),
});

const players = [
  { k: "elon", name: "Elon Musk" },
  { k: "dario", name: "Dario Amodei" },
  { k: "tegmark", name: "Max Tegmark" },
];

function buildFrames(): ComposerFrame[] {
  const f: ComposerFrame[] = [
    g("home-d", "Home · desktop", "d-home"),
    g("home-m", "Home · mobile", "m-home"),
  ];
  for (const p of players) {
    f.push(g(`${p.k}-load-d`, `${p.name} · start · desktop`, `d-${p.k}-load`));
    f.push(g(`${p.k}-load-m`, `${p.name} · start · mobile`, `m-${p.k}-load`));
    f.push(g(`${p.k}-doom-d`, `${p.name} · annihilation · desktop`, `d-${p.k}-doom`));
    f.push(g(`${p.k}-doom-m`, `${p.name} · annihilation · mobile`, `m-${p.k}-doom`));
    f.push(g(`${p.k}-good-d`, `${p.name} · survival · desktop`, `d-${p.k}-good`));
    f.push(g(`${p.k}-good-m`, `${p.name} · survival · mobile`, `m-${p.k}-good`));
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
    headlineOptions: [],
    attribution: "Futures Atlas · The Odds",
    cards: [],
    listLabel: "Screens",
    hashtags: "#AIrisk #pdoom #AIsafety #FuturesAtlas #TheOdds",
  };
}
