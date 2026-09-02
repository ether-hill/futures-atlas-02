import type { Metadata } from "next";
import { AudioReel } from "@/components/audio-reel/AudioReel";
import type { Voice } from "@/components/audio-reel/types";
import "@/components/audio-reel/audio-reel.css";
import order from "@/content/issues/index.json";
import care from "@/content/issues/care.json";
import control from "@/content/issues/control.json";
import work from "@/content/issues/work.json";

export const metadata: Metadata = {
  title: "Listen: issues. Futures Atlas",
  description: "Audio-driven horizontal story reel — the issues edition, one sector after another.",
};

/**
 * /listen/issues — the second edition of the reel. Same line, same clock,
 * but each entry is an issue or a sector rather than a person: it opens on a
 * pull quote instead of a name, and carries a couple of extra pictures set
 * back in depth. Authored as JSON under src/content/issues; the audio is the
 * same placeholder clips as the people edition until real cuts exist.
 */

const byId: Record<string, Voice> = {
  work: work as Voice,
  care: care as Voice,
  control: control as Voice,
};

export default function ListenIssuesPage() {
  const voices = (order as string[]).map((id) => byId[id]).filter(Boolean);
  return <AudioReel voices={voices} shareHref="/contact" label="On" editions={[
        { href: "/listen", label: "People" },
        { href: "/listen/issues", label: "Issues", current: true },
      ]} />;
}
