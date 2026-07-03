/**
 * villages-source.ts — pre-stocks a second composer (at /social-composer/hollow-villages)
 * with Village Oracle screens: the home, the 2050 vision, consultation body sections,
 * and consult-again, each in desktop 16:9 and 3:2, plus clean text-free 2050 renders.
 * Headline/subtext load empty by default — write your own copy per post.
 */
import type { ComposerSource, ComposerFrame } from "./source";

const IMG = (n: string) => `/social-composer/villages/${n}.jpg`;
const g = (id: string, label: string, img: string): ComposerFrame => ({
  id, kind: "gallery", label, headline: "", sub: "", imageUrl: IMG(img),
});

const ASPECTS: Array<[string, string]> = [["169", "16:9"], ["32", "3:2"]];
const SECTIONS: Array<[string, string]> = [
  ["home", "Home"],
  ["vision", "2050 vision"],
  ["change", "What can change"],
  ["body1", "Consultation section 1"],
  ["body2", "Consultation section 2"],
  ["body3", "Consultation section 3"],
  ["again", "Consult again"],
];
// clean, text-free 2050 render art — the "no headline / no subtext" variants
const RENDERS = ["anna-8", "giorgio-72", "mara-34", "yusuf-45", "henrik-58"];

function buildFrames(): ComposerFrame[] {
  const f: ComposerFrame[] = [];
  for (const [sec, label] of SECTIONS)
    for (const [sfx, a] of ASPECTS)
      f.push(g(`${sec}-${sfx}`, `${label} · ${a}`, `${sec}-${sfx}`));
  for (const id of RENDERS)
    f.push(g(`render-${id}`, `2050 render · ${id} · no text`, `render-${id}`));
  return f;
}

export function villagesSource(): ComposerSource {
  return {
    kind: "person",
    name: "Village Oracle",
    description: "An AI oracle that forecasts how depopulating rural villages could be revived.",
    summary: "People write it letters; it answers with grounded, cited plans and a picture of the place in 2050.",
    url: "https://futures-atlas-02.vercel.app/hollow-villages",
    frames: buildFrames(),
    headlineOptions: [],
    attribution: "Futures Atlas · Village Oracle",
    cards: [],
    listLabel: "Screens",
    hashtags: "#ruralfutures #villageoracle #depopulation #FuturesAtlas",
  };
}
