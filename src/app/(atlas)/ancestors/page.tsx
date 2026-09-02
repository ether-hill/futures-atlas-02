import type { Metadata } from "next";
import { AncestorsShelf } from "./AncestorsShelf";

export const metadata: Metadata = {
  title: "Source Library × Futures Atlas Recommended Reading",
  description:
    "Fifty works from the Source Library read as early versions of what the Atlas works on: mechanical reasoning, automata, the physics that became quantum, forecasting as a practice, and built worlds.",
};

export default function AncestorsPage() {
  return <AncestorsShelf />;
}
