/**
 * ComposerSource — the content-neutral shape the Social Studio renders.
 *
 * A source is a library of ready-made `frames` plus the bits the composer
 * needs (headline pool, caption material, hashtags). This standalone build
 * ships an EMPTY library: the studio opens as a blank canvas and the user
 * uploads images/videos to build posts. Wire your own builder that returns a
 * populated `ComposerSource` to pre-stock the library from real content.
 */

export type ComposerImage = { url: string; label: string };

export type VideoItem = { thumbUrl: string; title: string; source: string };
export type PressItem = { imageUrl: string; outlet: string; date: string; title: string };
export type TimelineEvent = { date: string; label: string; detail: string };

/** A ready-made library frame. `headline`/`sub` are the editable text. */
export type ComposerFrame =
  | { id: string; kind: "mosaic-hero"; label: string; headline: string; sub: string; meta: string; thumbUrls: string[] }
  | { id: string; kind: "cover"; label: string; headline: string; sub: string; imageUrl: string | null }
  | { id: string; kind: "portrait"; label: string; headline: string; sub: string; imageUrl: string }
  | { id: string; kind: "gallery"; label: string; headline: string; sub: string; imageUrl: string }
  | { id: string; kind: "video"; label: string; headline: string; sub: string; videoUrl: string; posterUrl?: string }
  | { id: string; kind: "profile-banner"; label: string; headline: string; sub: string; role: string; imageUrl: string }
  | { id: string; kind: "finding"; label: string; date: string; headline: string; sub: string; body: string }
  | { id: string; kind: "quote"; label: string; headline: string; sub: string; thumbUrls?: string[] }
  | { id: string; kind: "banner"; label: string; headline: string; sub: string; thumbUrls?: string[] }
  | { id: string; kind: "summary"; label: string; headline: string; sub: string; thumbUrls?: string[] }
  | { id: string; kind: "stat"; label: string; value: string; headline: string; sub: string }
  | { id: string; kind: "timeline"; label: string; headline: string; sub: string; events: TimelineEvent[] }
  | { id: string; kind: "video-grid"; label: string; headline: string; sub: string; items: VideoItem[] }
  | { id: string; kind: "press-grid"; label: string; headline: string; sub: string; items: PressItem[] };

export type ComposerCard = { id: string; date: string; title: string; body: string };

export type ComposerSource = {
  kind: "person" | "corporation";
  name: string;
  description: string;
  summary: string;
  url: string;
  frames: ComposerFrame[];
  headlineOptions: string[];
  attribution: string;
  cards: ComposerCard[];
  listLabel: string;
  hashtags: string;
};

/** A blank source — the studio opens as an empty canvas; users upload to build. */
export function emptySource(): ComposerSource {
  return {
    kind: "person",
    name: "Untitled",
    description: "",
    summary: "",
    url: "",
    frames: [],
    headlineOptions: [],
    attribution: "",
    cards: [],
    listLabel: "",
    hashtags: "",
  };
}
