import { StudioApp } from "./studio-app";
import { emptySource, type ComposerFrame } from "@/lib/composer/source";

// Standalone tool: the composer is the homepage. We seed one blank canvas so the
// preview is live and every Compose control (layout, background, text colour…)
// works on first load — uploads simply add more frames alongside it.
const starter: ComposerFrame = {
  id: "starter",
  kind: "cover",
  label: "Blank canvas",
  headline: "Your headline",
  sub: "",
  imageUrl: null,
};

export default function Page() {
  return <StudioApp source={{ ...emptySource(), frames: [starter] }} />;
}
