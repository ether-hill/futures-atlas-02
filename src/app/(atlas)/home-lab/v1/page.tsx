"use client";

/** V1 — "Signal Desk": feature-banner carousel, live mini-demos + CTA, quotes. */

import Link from "next/link";
import { Container } from "@/components/Container";
import { Reveal } from "@/components/Reveal";
import { projectsOrdered } from "@/data/projects";
import { QUOTES } from "@/components/homelab/data";
import { Backdrop, Carousel, LabBar, embedSrc } from "@/components/homelab/shared";

const FEATURED = ["signal-reactor", "hyperscale", "odds-of-surviving-ai"];

// NOTE: the embed player does NOT default missing params (pieces read them
// raw and NaN out to a black canvas), so every piece gets its full schema
// defaults spelled out here.
const DEMOS: { pieceId: string; label: string; meta: { complexity: number; chaos: number }; params: Record<string, number> }[] = [
  {
    pieceId: "boids",
    label: "Boids",
    meta: { complexity: 0.55, chaos: 0.5 },
    params: { count: 380, speed: 11, separation: 1.4, wander: 0.4, directionalPause: 0.45, trail: 0.05 },
  },
  {
    pieceId: "particle-constellation",
    label: "Particle constellation",
    meta: { complexity: 0.55, chaos: 0.45 },
    params: { linkDist: 0.16, nodeSize: 1.8 },
  },
  {
    pieceId: "phyllotaxis",
    label: "Phyllotaxis",
    meta: { complexity: 0.55, chaos: 0.35 },
    params: { dotScale: 1 },
  },
];

export default function V1() {
  const featured = FEATURED.map((id) => projectsOrdered.find((p) => p.id === id)!).filter(Boolean);
  return (
    <div>
      <LabBar current={1} />

      {/* Hero — colored curl-flow streams over black */}
      <section className="relative flex min-h-[62svh] items-end overflow-hidden border-b border-ink bg-black">
        <Backdrop
          spec={{
            pieceId: "organic-turbulence",
            seed: "signal-desk",
            params: { speed: 1, fieldScale: 1, evolve: 0.4, trail: 0.045, lineWidth: 1.4 },
            meta: { complexity: 0.6, chaos: 0.55 },
            colors: { bg: "#05060a", lo: "#ff6a3d", hi: "#22d3ee" },
          }}
          opacity={0.9}
        />
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(100deg,rgba(5,6,10,0.85)_14%,transparent_60%)]" />
        {/* bottom scrim seats the headline + lede over the field (texture scrim, like the hero-scrim exception) */}
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_top,rgba(5,6,10,0.88),rgba(5,6,10,0.35)_38%,transparent_62%)]" />
        <Container className="relative z-[1] pb-[clamp(40px,6vh,72px)] pt-[clamp(80px,12vh,140px)]">
          <Reveal>
            <h1 className="max-w-[16ch] text-[clamp(38px,6.5vw,96px)] font-extrabold leading-[0.94] tracking-[-0.028em] !text-paper">
              The signal desk
            </h1>
            <p className="mt-5 max-w-[560px] font-mono text-[14px] leading-[1.75] text-paper/70">
              Prototypes, open tools, and research on quantum computing and
              emerging AI — laid out like a working desk, not a brochure.
            </p>
          </Reveal>
        </Container>
      </section>

      {/* Feature banner carousel */}
      <section className="py-[clamp(44px,7vw,96px)]">
        <Container>
          <Reveal>
            <p className="eyebrow tick mb-8">Featured this month</p>
            <Carousel intervalMs={7000}>
              {featured.map((p) => (
                <Link key={p.id} href={p.path ?? "/projects"} className="group block">
                  <div className="grid grid-cols-1 items-stretch gap-0 overflow-hidden border border-ink/20 md:grid-cols-[1.4fr_1fr]">
                    <div className="relative aspect-[16/9] overflow-hidden md:aspect-auto md:min-h-[380px]">
                      {p.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.image} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                      )}
                    </div>
                    <div className="flex flex-col justify-between bg-band p-8 text-paper">
                      <div>
                        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-paper/50">{p.field}</span>
                        <h2 className="mt-3 text-[clamp(24px,2.6vw,38px)] font-extrabold leading-[1.02] tracking-[-0.02em] !text-paper">{p.title}</h2>
                        <p className="mt-4 line-clamp-4 font-mono text-[12.5px] leading-[1.7] text-paper/70">{p.tagline}</p>
                      </div>
                      <span className="mt-6 inline-flex w-fit items-center gap-2 rounded-[2px] bg-accent px-5 py-3 font-mono text-[11.5px] uppercase tracking-[0.1em] text-paper transition-colors group-hover:bg-accent-deep">
                        Open the project →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </Carousel>
          </Reveal>
        </Container>
      </section>

      {/* Live mini-demos — the pieces themselves, running in the cards */}
      <section className="border-t border-ink/15 py-[clamp(44px,7vw,96px)]">
        <Container>
          <Reveal>
            <div className="mb-8 flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="text-[clamp(24px,3vw,40px)] font-extrabold tracking-[-0.02em] text-ink">Try a live system</h2>
              <p className="font-mono text-[12px] text-ink/55">These cards are running right now — not screenshots.</p>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {DEMOS.map((d) => (
                <div key={d.pieceId} className="group border border-ink/15 transition-colors hover:border-ink/50">
                  <div className="relative aspect-[4/3] overflow-hidden bg-black">
                    <iframe
                      src={embedSrc({ pieceId: d.pieceId, seed: `desk-${d.pieceId}`, params: d.params, meta: d.meta, colors: { bg: "#05060a", lo: "#7c5cff", hi: "#22d3ee" } })}
                      title={d.label}
                      tabIndex={-1}
                      className="pointer-events-none absolute inset-0 h-full w-full border-0"
                    />
                  </div>
                  <div className="flex items-center justify-between p-5">
                    <span className="font-mono text-[12.5px] text-ink">{d.label}</span>
                    <Link href="/generatives" className="font-mono text-[11px] uppercase tracking-[0.12em] text-accent-deep hover:underline">
                      Open in the lab →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </Container>
      </section>

      {/* Quotes strip */}
      <section className="border-t border-ink/15 bg-band py-[clamp(44px,7vw,96px)] text-paper">
        <Container>
          <Reveal>
            {/* The shared Carousel paints its controls with ink tokens, which are
                invisible on this dark band in the light theme — retint them to
                paper from here (dots keep the accent active state). */}
            <Carousel
              intervalMs={5500}
              className="[&_.bg-ink\/20]:bg-paper/25 [&_.hover\:bg-ink\/40:hover]:bg-paper/45 [&_button[aria-label=Next]]:border-paper/35 [&_button[aria-label=Next]]:text-paper/80 [&_button[aria-label=Next]:hover]:border-paper [&_button[aria-label=Next]:hover]:text-paper [&_button[aria-label=Previous]]:border-paper/35 [&_button[aria-label=Previous]]:text-paper/80 [&_button[aria-label=Previous]:hover]:border-paper [&_button[aria-label=Previous]:hover]:text-paper"
            >
              {QUOTES.map((q, i) => (
                <blockquote key={i} className="max-w-[860px]">
                  <p className="text-[clamp(20px,2.6vw,34px)] font-extrabold leading-[1.25] tracking-[-0.015em] !text-paper">“{q.text}”</p>
                  <footer className="mt-5 font-mono text-[12px] uppercase tracking-[0.14em] text-paper/55">
                    {q.who} · {q.role}
                  </footer>
                </blockquote>
              ))}
            </Carousel>
          </Reveal>
        </Container>
      </section>
    </div>
  );
}
