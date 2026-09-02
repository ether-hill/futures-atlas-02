import type { Metadata } from "next";
import { ConceptOnly } from "@/components/ConceptOnly";

export const metadata: Metadata = {
  title: "Feynman's Tuva. Futures Atlas",
  description:
    "A concept, not a project: Richard Feynman's decade-long attempt to reach Tuva, and the throat singing that came back instead.",
};

export default function FeynmanTuvaPage() {
  return (
    <ConceptOnly
      eyebrow="Concept"
      question="What do Mongolian throat singing and quantum mechanics have in common?"
      premise="Richard Feynman spent the last decade of his life trying to get to Tuva, a republic on the Mongolian border then inside the Soviet Union, after asking Ralph Leighton “Whatever happened to Tannu Tuva?”. They never managed it: Feynman died in 1988, shortly before the visas came through. What did reach him was the music. Tuvan khoomei is one voice sounding several pitches at once, a fundamental with particular harmonics above it picked out and made audible. The concept is to follow the obsession rather than the pun, and to be honest about which half is physics and which half is a man who liked a puzzle."
      sources={[
        { label: "Tuva or Bust! (Ralph Leighton, 1991)", href: "https://en.wikipedia.org/wiki/Tuva_or_Bust!" },
        { label: "The Quest for Tannu Tuva, BBC Horizon, 4 July 1988", href: "https://en.wikipedia.org/wiki/Tuva_or_Bust!" },
      ]}
      credit="Card photograph: Richard Feynman, 1984, by Tamiko Thiel. CC BY-SA 3.0, via Wikimedia Commons."
    />
  );
}
