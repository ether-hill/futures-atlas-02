"use client";

/** V4 — "Hypergrid": Claude-homepage calm × Netflix shelf rows. */

import Link from "next/link";
import { Container } from "@/components/Container";
import { Reveal } from "@/components/Reveal";
import { projectsOrdered, type Project } from "@/data/projects";
import { Backdrop, LabBar, ScrollRow } from "@/components/homelab/shared";

function Card({ p, wide = false }: { p: Project; wide?: boolean }) {
  return (
    <Link
      href={p.path ?? "/projects"}
      className={`group relative shrink-0 snap-start overflow-hidden rounded-md border border-ink/10 bg-black transition-transform duration-300 hover:z-[1] hover:scale-[1.04] ${
        wide ? "w-[min(84vw,460px)]" : "w-[min(66vw,300px)]"
      }`}
    >
      <div className={`relative ${wide ? "aspect-[16/9]" : "aspect-[3/2]"}`}>
        {p.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(0,0,0,0.82)_0%,transparent_45%)] opacity-90" />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <p className="text-[15px] font-extrabold tracking-[-0.01em] text-white">{p.title}</p>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-white/55">{p.field}</p>
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="rounded-full border border-white/60 px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.12em] text-white">▶ Open</span>
        </div>
      </div>
    </Link>
  );
}

export default function V4() {
  const by = (field: string) => projectsOrdered.filter((p) => p.field === field);
  const sims = projectsOrdered.filter((p) => ["Simulation"].includes(p.field));
  const risk = by("AI & risk");
  const visuals = projectsOrdered.filter((p) => ["Generative visuals", "Quantum & computation", "Data visualisation", "Creative tools"].includes(p.field));
  const rest = projectsOrdered.filter((p) => !sims.includes(p) && !risk.includes(p) && !visuals.includes(p));

  return (
    <div>
      <LabBar current={4} />

      {/* Claude-calm hero: centered, serene, one statement, soft ambient field */}
      <section className="relative flex min-h-[74svh] items-center overflow-hidden border-b border-ink bg-[#0b0c10]">
        <Backdrop
          spec={{
            pieceId: "particle-nebula",
            seed: "hypergrid",
            params: { pointSize: 3 },
            meta: { complexity: 0.65, chaos: 0.3 },
            colors: { bg: "#0b0c10", lo: "#39508f", hi: "#8fc0f2" },
          }}
          opacity={0.9}
        />
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_45%,rgba(11,12,16,0.12)_0%,rgba(11,12,16,0.78)_100%)]" />
        {/* soft scrim behind the copy so the nebula core doesn't strike through the text */}
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(46%_38%_at_50%_52%,rgba(11,12,16,0.6)_0%,rgba(11,12,16,0)_100%)]" />
        <Container className="relative z-[1] py-[clamp(72px,12vh,140px)] text-center">
          <Reveal>
            <h1 className="mx-auto max-w-[16ch] text-[clamp(40px,6.4vw,92px)] font-extrabold leading-[0.98] tracking-[-0.028em] !text-paper text-balance">
              Futures, in working form
            </h1>
            <p className="mx-auto mt-6 max-w-[520px] font-mono text-[13.5px] leading-[1.8] text-paper/80">
              A library of playable foresight — simulations, instruments, and
              studies on quantum computing and emerging AI.
            </p>
            <div className="mx-auto mt-9 flex max-w-[420px] items-center gap-2 rounded-full border border-paper/25 bg-black/60 p-1.5 backdrop-blur-sm">
              <span className="flex-1 pl-4 text-left font-mono text-[12px] text-paper/45">What future are you weighing?</span>
              <Link href="/quantum-spark" className="rounded-full bg-accent px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.1em] text-paper hover:bg-accent-deep">
                Spark it
              </Link>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* Netflix shelf */}
      {/* ScrollRow's title/arrows use ink-tinted classes (fine on light bands);
          on this dark band remap them to paper without touching the shared component. */}
      <section className="bg-band py-[clamp(40px,6vw,80px)] text-paper [&_h3.text-ink\/60]:!text-paper/60 [&_button.text-ink\/70]:!border-paper/30 [&_button.text-ink\/70]:!text-paper/80">
        <Container>
          <Reveal className="flex flex-col gap-[clamp(32px,5vw,56px)]">
            <ScrollRow title="Because you liked arguing with the future">
              {risk.map((p) => <Card key={p.id} p={p} wide />)}
            </ScrollRow>
            <ScrollRow title="Simulations — build, break, rebuild">
              {[...sims, ...risk, ...rest.slice(0, 1)].map((p) => <Card key={p.id} p={p} />)}
            </ScrollRow>
            <ScrollRow title="Instruments & visual systems">
              {visuals.map((p) => <Card key={p.id} p={p} />)}
            </ScrollRow>
            <ScrollRow title="Everything else in the atlas">
              {rest.map((p) => <Card key={p.id} p={p} wide />)}
            </ScrollRow>
          </Reveal>
        </Container>
      </section>

      {/* Quiet close, Claude-style */}
      <section className="py-[clamp(48px,8vw,110px)] text-center">
        <Container>
          <Reveal>
            <p className="mx-auto max-w-[24ch] text-[clamp(22px,3vw,40px)] font-extrabold leading-[1.15] tracking-[-0.02em] text-ink">
              It&rsquo;s meant to be used.
            </p>
            <Link href="/projects" className="mt-7 inline-block rounded-[2px] border-[1.5px] border-ink/30 px-7 py-3.5 font-mono text-[12px] uppercase tracking-[0.1em] text-ink hover:border-ink">
              Browse all projects
            </Link>
          </Reveal>
        </Container>
      </section>
    </div>
  );
}
