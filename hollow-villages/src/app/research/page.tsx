import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { ResearchExplorer } from "@/components/ResearchExplorer";

export const metadata: Metadata = {
  title: "Research — Village Oracle",
  description:
    "The full evidence base behind every forecast — real, verified sources, plus a problem→solution matrix mapping how each lever reaches across the crisis.",
};

export default function ResearchPage() {
  return (
    <section className="py-[clamp(44px,7vw,96px)]">
      <Container>
      <header className="max-w-3xl">
        <div className="mb-4 flex items-center gap-3">
          <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-accent-deep">
            The evidence base
          </span>
          <span className="h-px flex-1 bg-ink/15" />
        </div>
        <h1 className="text-[clamp(40px,6vw,88px)] font-extrabold leading-[0.94] tracking-[-0.028em] text-ink text-balance">
          Everything the oracle reads.
        </h1>
        <p className="oracle-voice mt-6 text-[clamp(18px,2.2vw,26px)] leading-snug text-ink">
          “The oracle speaks in possibility. Everything it draws on is real.”
        </p>
        <p className="mt-5 max-w-xl font-mono text-[14px] leading-[1.7] text-ink-70">
          The studies, schemes and case histories behind every forecast on this
          site. The villages are composite; the sources are not. Read the matrix
          to see how a handful of levers each answer several pressures — then
          trace any one back to its proof.
        </p>
      </header>

      <div className="mt-14">
        <ResearchExplorer />
      </div>
      </Container>
    </section>
  );
}
