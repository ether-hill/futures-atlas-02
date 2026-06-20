import Link from "next/link";
import { crisisStats, type CrisisStat } from "@/data/research";
import { letters } from "@/data/letters";
import { Container } from "@/components/Container";
import { HeroSlider } from "@/components/HeroSlider";
import { HomeResearchPreview } from "@/components/HomeResearchPreview";
import { Reveal } from "@/components/Reveal";

const teaserIds = ["giorgio-72", "mara-34", "bianca-51"];

function firstSentence(body: string) {
  const stripped = body.replace(/^(Dear Oracle|To the Oracle|Oracle)\s*[—,.\-]*\s*/i, "");
  return stripped.split(/(?<=[.?!])\s/)[0];
}

export default function Home() {
  const teasers = teaserIds.map((id) => letters.find((l) => l.id === id)!).filter(Boolean);

  return (
    <div>
      <HeroSlider
        beforeImage="/hollow-villages/villages/giorgio-72-before.jpg"
        afterImage="/hollow-villages/villages/giorgio-72-after.jpg"
      />

      {/* 01 — Diagnosis */}
      <section className="border-t border-ink bg-surface py-[clamp(58px,9vw,140px)]">
        <Container>
          <Reveal>
            <div className="mb-3.5 flex flex-wrap items-baseline gap-4">
              <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-accent-deep">01 — Diagnosis</span>
              <span className="h-px min-w-10 flex-1 bg-ink/[0.18]" />
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-graphite">Present condition · observed</span>
            </div>
          </Reveal>
          <div className="flex flex-wrap items-end gap-[clamp(20px,5vw,80px)]">
            <Reveal as="h2" className="m-0 flex-[2_1_320px] text-[clamp(32px,4.6vw,68px)] font-extrabold leading-[0.98] tracking-[-0.022em] text-ink text-balance">
              Four figures, one system.
            </Reveal>
            <Reveal as="p" className="m-0 flex-[1_1_280px] font-mono text-[14px] leading-[1.7] text-ink-70">
              People are leaving small places. A handful of cities absorb them.
              The housing and the jobs where everyone lands were never built for
              the surge. The forecast starts with what is measured.
            </Reveal>
          </div>

          <div className="mt-[clamp(36px,6vw,80px)] grid gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,250px),1fr))]">
            {crisisStats.map((s) => (
              <StatCard key={s.figure} stat={s} />
            ))}
          </div>

          <Reveal as="p" className="mt-[26px] max-w-[760px] font-mono text-[12.5px] leading-[1.7] text-graphite">
            The same people counted as <span className="text-ink">lost</span> from
            a village are counted again as <span className="text-ink">pressure</span>{" "}
            in a city that cannot house or employ them all. The oracle treats
            both ends as one problem.
          </Reveal>
        </Container>
      </section>

      {/* 02 — Research preview */}
      <section className="bg-band py-[clamp(58px,9vw,130px)] text-paper">
        <HomeResearchPreview />
      </section>

      {/* 03 — Consult teaser */}
      <section className="border-t border-ink bg-surface py-[clamp(58px,9vw,130px)]">
        <Container>
          <Reveal>
            <div className="mb-3.5 flex flex-wrap items-baseline gap-4">
              <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-accent-deep">03 — Consult the oracle</span>
              <span className="h-px min-w-10 flex-1 bg-ink/[0.18]" />
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-graphite">Letters in · forecasts out</span>
            </div>
          </Reveal>
          <div className="mb-[clamp(30px,5vw,56px)] flex flex-wrap items-end gap-[clamp(20px,5vw,80px)]">
            <Reveal as="h2" className="m-0 flex-[2_1_320px] text-[clamp(32px,4.6vw,68px)] font-extrabold leading-[0.98] tracking-[-0.022em] text-ink text-balance">
              People write to the oracle.
            </Reveal>
            <Reveal as="p" className="m-0 flex-[1_1_280px] font-mono text-[14px] leading-[1.7] text-ink-70">
              A resident, a newcomer, a mayor. Each letter gets a forecast at
              every scale — what you can do, what the village can organise, the
              region, the nation — and a picture of the place in 2050.
            </Reveal>
          </div>

          <div className="grid gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr))]">
            {teasers.map((l) => (
              <Reveal as="figure" key={l.id} className="m-0 flex min-h-[260px] flex-col gap-[18px] border border-ink bg-panel p-6">
                <div className="flex items-center justify-between gap-2.5">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent-deep">{l.correspondent.role}</span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-graphite">{l.correspondent.place}</span>
                </div>
                <p className="oracle-voice m-0 flex-1 text-[clamp(18px,1.9vw,22px)] leading-[1.32] text-ink">
                  “{firstSentence(l.body)}”
                </p>
                <div className="flex items-center gap-2.5 border-t border-ink/[0.18] pt-3.5">
                  <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full border-[1.5px] border-accent-deep bg-accent-soft text-[12px] font-extrabold text-accent-deep" style={{ fontFamily: "var(--font-archivo)" }}>
                    {l.correspondent.name[0]}
                  </span>
                  <span className="text-[13.5px] font-bold text-ink" style={{ fontFamily: "var(--font-archivo)" }}>
                    {l.correspondent.name}, {l.correspondent.age}
                  </span>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-[clamp(28px,4vw,44px)] flex flex-wrap items-center gap-4">
            <Link
              href="/oracle"
              className="inline-flex items-center gap-2.5 rounded-[2px] bg-accent px-[26px] py-4 font-mono text-[12.5px] uppercase tracking-[0.1em] text-paper shadow-[0_10px_30px_-8px_rgba(33,30,24,0.35)] transition-colors hover:bg-accent-deep"
            >
              Consult the oracle <span className="text-[15px]">→</span>
            </Link>
            <span className="font-mono text-[11.5px] uppercase tracking-[0.1em] text-graphite">
              Begin a consultation &amp; see your village in 2050
            </span>
          </Reveal>
        </Container>
      </section>
    </div>
  );
}

function StatCard({ stat }: { stat: CrisisStat }) {
  const dark = stat.variant === "dark";
  const accent = stat.variant === "accent";

  const bg = dark ? "bg-band border-ink" : accent ? "bg-accent-soft border-accent" : "bg-panel border-ink";
  const source = dark ? "text-paper/65" : accent ? "text-accent-deep" : "text-graphite";
  const number = dark ? "text-paper" : "text-ink";
  const unitCol = dark ? "text-accent brightness-[1.45]" : "text-accent-deep";
  const lineCol = dark ? "bg-paper/35" : accent ? "bg-accent-deep/50" : "bg-ink/40";
  const divLabel = dark ? "text-accent brightness-[1.45]" : accent ? "text-accent-deep" : "text-graphite";
  const cap = dark ? "text-paper" : "text-ink";

  return (
    <figure className={`relative m-0 border p-[26px_24px_22px] ${bg}`}>
      <div className={`mb-1.5 font-mono text-[10px] uppercase tracking-[0.16em] ${source}`}>{stat.sourceLabel}</div>
      <div className="flex items-end gap-1.5">
        <span className={`text-[clamp(54px,7vw,86px)] font-black leading-[0.82] tracking-[-0.04em] ${number}`}>{stat.figure}</span>
        {stat.unit && <span className={`pb-3 font-mono text-[10px] uppercase tracking-[0.1em] ${unitCol}`}>{stat.unit}</span>}
      </div>
      <div className="my-3 flex items-center gap-2">
        <span className={`h-px flex-1 ${lineCol}`} />
        <span className={`font-mono text-[10px] uppercase tracking-[0.12em] ${divLabel}`}>{stat.dividerLabel}</span>
        <span className={`h-px flex-1 ${lineCol}`} />
      </div>
      <figcaption className={`text-[16px] font-medium leading-[1.38] ${cap}`} style={{ fontFamily: "var(--font-archivo)" }}>
        {stat.caption}
      </figcaption>
    </figure>
  );
}
