import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";

export const metadata: Metadata = {
  title: "Home Lab — Futures Atlas",
  description: "Four exploratory homepage design variants.",
  robots: { index: false },
};

const VARIANTS = [
  {
    v: 1,
    name: "Signal Desk",
    visual: "Curl-flow streams",
    idea: "Feature-banner carousel up top, live mini-demos of real projects with CTAs, and a quotes strip. The homepage as a working desk.",
  },
  {
    v: 2,
    name: "Observatory",
    visual: "Trajectories (after Jeongho Park)",
    idea: "The filament sphere as the hero, a design-workflow carousel, and a published studies & white papers section. The homepage as an instrument.",
  },
  {
    v: 3,
    name: "Journal",
    visual: "Physarum growth",
    idea: "Editorial-first: a news & articles carousel, featured research, a pull-quote. The homepage as a periodical front page.",
  },
  {
    v: 4,
    name: "Hypergrid",
    visual: "Domain-warp ambient",
    idea: "Claude-homepage calm up top, Netflix-style category rows below. One serene statement, then infinite shelf.",
  },
];

export default function HomeLabIndex() {
  return (
    <section className="py-[clamp(48px,8vw,110px)]">
      <Container>
        <p className="eyebrow tick mb-6">Design exploration · not linked from the site</p>
        <h1 className="max-w-[16ch] text-[clamp(36px,5.4vw,80px)] font-extrabold leading-[0.96] tracking-[-0.025em] text-ink">
          Homepage lab
        </h1>
        <p className="mt-6 max-w-[620px] font-mono text-[14px] leading-[1.8] text-ink-70">
          Four alternative homepages, each with a different generative visual and a
          different theory of what the front page is for. Kick the tires; nothing
          here touches the real homepage.
        </p>
        <div className="mt-[clamp(32px,5vw,56px)] grid grid-cols-1 gap-3 md:grid-cols-2">
          {VARIANTS.map((x) => (
            <Link
              key={x.v}
              href={`/home-lab/v${x.v}`}
              className="group border border-ink/15 p-7 transition-colors hover:border-ink/50"
            >
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent-deep">V{x.v}</span>
                <span className="font-mono text-[11px] text-ink/40">{x.visual}</span>
              </div>
              <h2 className="mt-3 text-[26px] font-extrabold tracking-[-0.02em] text-ink group-hover:text-accent-deep">
                {x.name}
              </h2>
              <p className="mt-3 font-mono text-[13px] leading-[1.7] text-ink-70">{x.idea}</p>
              <span className="mt-5 inline-block font-mono text-[11.5px] uppercase tracking-[0.12em] text-ink/60 group-hover:text-ink">
                Open variant →
              </span>
            </Link>
          ))}
        </div>
        <div className="mt-[clamp(28px,4vw,44px)] border-t border-ink/15 pt-8">
          <p className="eyebrow tick mb-5">Design handoff — Claude × Netflix browse UI (own chrome, full-screen)</p>
          <div className="flex flex-wrap gap-3">
            {[
              { name: "Observatory", href: "/mocks/observatory", note: "dark indigo · particle nebula" },
              { name: "Gallery", href: "/mocks/gallery", note: "light swiss · lattice waves" },
              { name: "Signal", href: "/mocks/signal", note: "terminal green · boids" },
            ].map((m) => (
              <Link key={m.name} href={m.href} className="group border border-ink/15 px-6 py-4 transition-colors hover:border-ink/50">
                <span className="block text-[18px] font-extrabold tracking-[-0.015em] text-ink group-hover:text-accent-deep">{m.name}</span>
                <span className="mt-1 block font-mono text-[11px] text-ink/50">{m.note}</span>
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
