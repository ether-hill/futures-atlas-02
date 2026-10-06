import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { Gallery, type GalleryEntry } from "@/components/standing-waves/Gallery";
import { ModeOrbital } from "@/components/standing-waves/ModeOrbital";
import { NodalFigure } from "@/components/standing-waves/NodalFigure";
import { SW_TITLE } from "@/data/standing-waves/meta";
import { MEDIA, captionFor } from "@/data/standing-waves/media";
import type { MediaItem } from "@/data/standing-waves/types";
import { commonsSrcSet } from "@/lib/standing-waves/commons";

export const metadata: Metadata = {
  title: `Gallery. ${SW_TITLE}. Futures Atlas`,
  description: "Computed plate modes, illustrative Faraday patterns and historical plates, every image with its credit and licence.",
  robots: { index: false },
};

function plate(m: MediaItem, eager: boolean) {
  if (m.kind === "generated") {
    return (
      <div className="aspect-square p-[6%]">
        <NodalFigure spec={m.src} res={110} stroke={0.8} label={m.alt} />
      </div>
    );
  }
  return (
    <div className="sw-plate-light">
      {/* Hot-linked from Wikimedia at the width the card needs, never copied into the repo. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={m.src}
        srcSet={commonsSrcSet(m.src)}
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        alt={m.alt}
        width={m.width}
        height={m.height}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : undefined}
        decoding="async"
        crossOrigin="anonymous" /* CORS mode: Wikimedia's tracking cookie is not stored */
        className="h-auto w-full"
      />
    </div>
  );
}

export default function GalleryPage() {
  // Archive plates first: the history is the hook, the computed sets follow.
  // Portraits belong to the profiles, not the gallery.
  const pictures = MEDIA.filter((m) => !m.tags.includes("portrait"));
  const ordered = [...pictures.filter((m) => m.kind !== "generated"), ...pictures.filter((m) => m.kind === "generated")];
  const entries: GalleryEntry[] = ordered.map((m, i) => ({ item: m, plate: plate(m, i < 2), caption: captionFor(m) }));
  return (
    <>
      <section className="py-[clamp(36px,5vw,72px)]">
        <Container>
          <div className="max-w-[62ch]">
            <p className="eyebrow mb-4">Gallery</p>
            <h1 className="text-[clamp(28px,4vw,52px)] font-extrabold leading-[1.04] tracking-[-0.02em] text-ink">Patterns, computed and collected</h1>
            <p className="mt-5 text-[15px] leading-[1.8] text-ink-70">
              Two kinds of picture. Historical plates and photographs that are free to show, each with its credit and
              licence. And figures computed in this page from the equations, which say exactly what they compute and
              where they simplify. Photographs from Hans Jenny&apos;s <em>Kymatik</em> and from the CymaScope are not
              ours to reproduce, so they are not shown here.
            </p>
          </div>
        </Container>
      </section>

      <section aria-labelledby="sw-pair-h" className="border-y border-ink/15 bg-panel py-[clamp(36px,5vw,72px)]">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
            <div className="max-w-[52ch]">
              <p className="eyebrow mb-4">Mode ↔ orbital</p>
              <h2 id="sw-pair-h" className="text-[clamp(24px,3vw,38px)] font-extrabold leading-[1.08] tracking-[-0.018em] text-ink">
                A drum and an atom, one slider
              </h2>
              <p className="mt-5 text-[15px] leading-[1.8] text-ink-70">
                Left, a round plate ringing in one of its allowed shapes. Right, a slice through a hydrogen atom in one of
                its allowed states. Move the slider and both step together. They always have the same number of still
                lines and still rings, because both are waves trapped in a circle.
              </p>
              <p className="mt-4 text-[13.5px] leading-[1.7] text-ink-70">
                The plate is drawn with the clamped-edge (drum-head) solution, J<sub>m</sub>(kr)·cos mθ. The orbital is the
                real form of the hydrogen wavefunction with |m| = l, sliced through its equator. The matching is by node
                count, which is a design decision, not a measurement: there is no physical link between any particular
                plate and any particular orbital.
              </p>
            </div>
            <ModeOrbital />
          </div>
        </Container>
      </section>

      <section className="py-[clamp(36px,5vw,72px)]">
        <Container>
          <Gallery entries={entries} />
        </Container>
      </section>
    </>
  );
}
