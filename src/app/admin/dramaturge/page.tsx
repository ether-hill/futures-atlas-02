import type { Metadata } from "next";
import { Studio } from "@/components/dramaturge/Studio";
import "@/components/dramaturge/dramaturge.css";

export const metadata: Metadata = {
  title: "Dramaturge studio",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * The Dramaturge studio. Gated with the rest of /admin by the middleware.
 *
 * Collect the material, storyboard it, photograph the frames. The two long
 * steps run locally — the panel says so on the deployed site rather than
 * offering a button that would be killed at the function ceiling.
 */
export default function DramaturgeStudioPage() {
  return <Studio />;
}
