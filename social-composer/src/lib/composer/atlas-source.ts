/**
 * atlas-source.ts — one stocked composer library per Atlas project.
 *
 * Every project in the atlas is captured by scripts/capture-project-shots.mjs
 * (desktop 16:9, desktop 3:2, mobile 9:16, plus scrolled views and known
 * sub-pages) into social-composer/public/shots/<id>/, listed in the generated
 * atlas-shots.ts. This turns an entry there into a ComposerSource, so picking a
 * project in the studio opens a library of that project's real screens instead
 * of the black text cards a DOM scrape produced for canvas-based pages.
 *
 * Headline and subtext load EMPTY, like the two hand-built sources: the frames
 * supply imagery, the copy is written per post.
 */
import type { ComposerSource, ComposerFrame } from "./source";
import { ATLAS_PROJECTS, type AtlasProject } from "./atlas-shots";
import { oddsSource } from "./odds-source";
import { villagesSource } from "./villages-source";

/** Screens captured before this script existed, kept because they reach states a
 *  generic capture can't (a game played to its end, a text-free 2050 render). */
const LEGACY: Record<string, () => ComposerSource> = {
  "odds-of-surviving-ai": oddsSource,
  "hollow-villages": villagesSource,
};

const SITE = "https://futures-atlas-02.vercel.app";

const shotUrl = (id: string, file: string) => `/social-composer/shots/${id}/${file}`;

/** #FuturesAtlas plus the project's own title and field, nothing invented. */
function hashtags(p: AtlasProject): string {
  const tag = (s: string) => "#" + s.replace(/[^A-Za-z0-9 ]/g, "").split(/\s+/).filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1)).join("");
  return ["#FuturesAtlas", tag(p.title), tag(p.field)].filter((t) => t.length > 1).join(" ");
}

function framesFor(p: AtlasProject): ComposerFrame[] {
  const frames: ComposerFrame[] = p.shots.map((s) => ({
    id: `shot-${p.id}-${s.file.replace(/\.jpg$/, "")}`,
    kind: "gallery" as const,
    label: s.label,
    headline: "",
    sub: "",
    imageUrl: shotUrl(p.id, s.file),
  }));
  // The card art already in public/projects — served from the site root, so it
  // needs no basePath and no capture.
  for (const [i, card] of p.cards.entries()) {
    frames.push({
      id: `card-${p.id}-${i}`, kind: "gallery", label: i === 0 ? "Card art" : `Card art ${i + 1}`,
      headline: "", sub: "", imageUrl: card,
    });
  }
  const legacy = LEGACY[p.id]?.();
  if (legacy) frames.push(...legacy.frames);
  return frames;
}

/** Only projects that actually have imagery — a capture can fail (a page moved,
 *  a build wasn't there) and an empty library in the picker is worse than absent. */
export function atlasProjects(): AtlasProject[] {
  return ATLAS_PROJECTS.filter((p) => p.shots.length || p.cards.length || LEGACY[p.id]);
}

export function atlasSource(id: string): ComposerSource {
  const p = ATLAS_PROJECTS.find((x) => x.id === id) ?? ATLAS_PROJECTS[0];
  if (!p) {
    return {
      kind: "person", name: "Untitled", description: "", summary: "", url: SITE,
      frames: [], headlineOptions: [], attribution: "Futures Atlas", cards: [],
      listLabel: "Screens", hashtags: "#FuturesAtlas",
    };
  }
  return {
    kind: "person",
    name: p.title,
    description: p.tagline,
    summary: p.tagline,
    // Keys the studio's saved drafts / working state, so each project keeps its own.
    url: `${SITE}${p.path}`,
    frames: framesFor(p),
    headlineOptions: [],
    attribution: `Futures Atlas · ${p.title}`,
    cards: [],
    listLabel: "Screens",
    hashtags: hashtags(p),
  };
}
