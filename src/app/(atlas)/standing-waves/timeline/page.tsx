import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { Timeline } from "@/components/standing-waves/Timeline";
import { LANE_LABEL, LANE_ORDER, STATUS_LABEL, SW_TITLE } from "@/data/standing-waves/meta";
import { EVENTS } from "@/data/standing-waves/timeline";
import { PEOPLE } from "@/data/standing-waves/people";
import { SOURCES } from "@/data/standing-waves/sources";
import { ARTICLES } from "@/data/standing-waves/articles";

export const metadata: Metadata = {
  title: `Timeline. ${SW_TITLE}. Futures Atlas`,
  description: "Key studies in cymatics, wave physics, quantum mechanics and pilot-wave hydrodynamics, 1680 to now, each with its status and sources.",
  robots: { index: false },
};

export default function TimelinePage() {
  const events = [...EVENTS].sort((a, b) => a.year - b.year || a.id.localeCompare(b.id));
  return (
    <section className="py-[clamp(36px,5vw,72px)]">
      <Container>
        <div className="max-w-[62ch]">
          <p className="eyebrow mb-4">Timeline</p>
          <h1 className="text-[clamp(28px,4vw,52px)] font-extrabold leading-[1.04] tracking-[-0.02em] text-ink">
            Three centuries of standing waves
          </h1>
          <p className="mt-5 text-[15px] leading-[1.8] text-ink-70">
            Four lanes run side by side: sand on plates, the physics of waves, quantum mechanics, and the walking
            droplets that tried to join the last two. Each study carries a status. {STATUS_LABEL.established} and{" "}
            {STATUS_LABEL.historical.toLowerCase()} results stand; {STATUS_LABEL.contested.toLowerCase()} ones are
            disputed in print; {STATUS_LABEL["not-replicated"].toLowerCase()} means a careful repeat did not get the
            same answer.
          </p>
          <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2" aria-label="Lane colours">
            {LANE_ORDER.map((l) => (
              <li key={l} data-lane={l} className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-ink">
                <span className="sw-dot" aria-hidden="true" /> {LANE_LABEL[l]}
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-10">
          <Timeline
            events={events}
            people={Object.fromEntries(PEOPLE.map((p) => [p.id, { id: p.id, name: p.name }]))}
            sources={Object.fromEntries(SOURCES.map((s) => [s.id, s]))}
            articles={Object.fromEntries(ARTICLES.filter((a) => a.state === "published").map((a) => [a.slug, a.title]))}
          />
        </div>
      </Container>
    </section>
  );
}
