/** Shapes of content/voices/<id>.json — see the folder README for authoring. */

export interface PortraitScene {
  type: "portrait";
  start: number; // seconds into the clip when the scene centres on the playhead
  src: string;
  caption: string;
  parallax?: number;
}

export interface MediaScene {
  type: "media";
  start: number;
  src: string;
  kind?: "video"; // omit for image
  parallax?: number; // layer speed multiplier; <1 lags the track. Default 0.75
}

export interface QuoteScene {
  type: "quote";
  start: number;
  text: string;
  parallax?: number; // default 1
}

export type Scene = PortraitScene | MediaScene | QuoteScene;

export interface Voice {
  id: string;
  name: string;
  role: string;
  audio: string;
  peaks: string;
  scenes: Scene[];
}

/** Design variants — same DOM and clock, different stylesheet block. */
export const VARIANTS = [
  { id: "editorial", label: "V1", name: "Editorial" },
  { id: "ledger", label: "V2", name: "Ledger" },
  { id: "cinema", label: "V3", name: "Cinema" },
  { id: "deck", label: "V4", name: "Deck" },
  { id: "type", label: "V5", name: "Type" },
] as const;
export type Variant = (typeof VARIANTS)[number]["id"];

/** Colour scheme: light and dark are the two trios; auto follows the OS. */
export const SCHEMES = ["light", "auto", "dark"] as const;
export type Scheme = (typeof SCHEMES)[number];
