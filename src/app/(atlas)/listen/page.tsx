import type { Metadata } from "next";
import { AudioReel } from "@/components/audio-reel/AudioReel";
import type { Voice } from "@/components/audio-reel/types";
import "@/components/audio-reel/audio-reel.css";
import order from "@/content/voices/index.json";
import amara from "@/content/voices/amara.json";
import scott from "@/content/voices/scott.json";

export const metadata: Metadata = {
  title: "Listen. Futures Atlas",
  description: "Audio-driven horizontal story reel — voices moving past a fixed playhead.",
};

/**
 * /listen — the audio-driven story reel (internal build page, gated via
 * INTERNAL_PATHS in src/middleware.ts). Voices are authored as JSON under
 * src/content/voices; index.json fixes the display order. See the component
 * folder's README for how to add one.
 */

const byId: Record<string, Voice> = {
  scott: scott as Voice,
  amara: amara as Voice,
};

export default function ListenPage() {
  const voices = (order as string[]).map((id) => byId[id]).filter(Boolean);
  return <AudioReel voices={voices} shareHref="/contact" />;
}
