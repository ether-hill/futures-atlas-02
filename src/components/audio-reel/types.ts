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
