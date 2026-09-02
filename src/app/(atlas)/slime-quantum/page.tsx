import type { Metadata } from "next";
import { ConceptOnly } from "@/components/ConceptOnly";

export const metadata: Metadata = {
  title: "Slime mould and quantum computing. Futures Atlas",
  description: "A concept, not a project: what a slime mould solving a maze and a quantum computer might have in common.",
};

export default function SlimeQuantumPage() {
  return (
    <ConceptOnly
      eyebrow="Concept"
      question="What do slime mould and quantum computing have in common?"
      premise="A slime mould sent into a maze spreads through every corridor at once, then withdraws from the dead ends until only a route remains. A quantum computer is often described the same way, as trying everything simultaneously — a description physicists spend a lot of time correcting. The concept is to put the two side by side and work out where the comparison holds and where it quietly becomes a category error."
    />
  );
}
