import type { Metadata } from "next";
import { ReadingGuide } from "./ReadingGuide";

export const metadata: Metadata = {
  title: "Source Library × Futures Atlas Recommended Reading",
  description:
    "A reading guide: fifty works from the Source Library read as early versions of what the Atlas works on. Mechanical reasoning, automata, the physics that became quantum, forecasting as a practice, and built worlds.",
};

export default function SourceLibraryPage() {
  return <ReadingGuide />;
}
