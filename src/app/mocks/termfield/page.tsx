import type { Metadata } from "next";
import { TermField } from "@/components/about/TermField";

/**
 * The About page's term field, alone on the dark ground, full bleed.
 *
 * It exists so a social slide can embed the REAL component rather than a
 * screengrab or a reimplementation: this is the same `TermField` /about mounts,
 * reading the same `TERMS` and `TERM_LINKS`, so the reel stays in step with the
 * vocabulary. /about wraps it in a scrim and a column of copy, neither of which
 * belongs in a 4:5 crop, so the wrapper is what this route replaces.
 *
 * Gated and noindexed with the rest of /mocks.
 */
export const metadata: Metadata = {
  title: "Term field. Futures Atlas",
  robots: { index: false },
};

export default function TermFieldStage() {
  return (
    <div className="dark">
      <style>{`
        html, body { background: #17181b; }
        /* a stage for a post, so the site bar and the padding it reserves go */
        .fa-shell, .fa-share, .fa-foot { display: none !important; }
        body { padding-top: 0 !important; }
        .tf-stage { position: fixed; inset: 0; background: #17181b; overflow: hidden; }
      `}</style>
      <div className="tf-stage">
        <TermField />
      </div>
    </div>
  );
}
