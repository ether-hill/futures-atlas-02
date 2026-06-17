import type { Metadata } from "next";
import { StyleGuide } from "futures-atlas-core";
import { Container } from "@/components/Container";
import { ProjectCard } from "@/components/ProjectCard";
import { projects } from "@/data/projects";

export const metadata: Metadata = {
  title: "Style guide — Futures Atlas",
  robots: { index: false, follow: false },
};

// the real cards from the site, shown live in the panel so token edits apply to them
const samples = [
  projects.find((p) => p.id === "hollow-villages")!,
  projects.find((p) => p.status !== "live")!,
].filter(Boolean);

export default function StyleGuidePage() {
  return (
    <section className="py-[clamp(28px,4vw,48px)]">
      <Container>
        <div className="mb-8 flex flex-wrap items-baseline gap-4">
          <h1 className="text-[clamp(28px,4vw,52px)] font-extrabold tracking-[-0.02em] text-ink">
            Style guide
          </h1>
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-graphite">
            Edit a token · it saves live for everyone
          </span>
        </div>
        <StyleGuide
          extraShowcase={
            <div className="grid max-w-[680px] gap-5 sm:grid-cols-2">
              {samples.map((p, i) => (
                <ProjectCard key={p.id} project={p} index={i} />
              ))}
            </div>
          }
        />
      </Container>
    </section>
  );
}
