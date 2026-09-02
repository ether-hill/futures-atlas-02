import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { formatProjectDate, liveProjects, month1Candidates, unscheduledDrafts, type Project } from "@/data/projects";
import { getEditor } from "@/lib/editor";

export const metadata: Metadata = {
  title: "Editor. Futures Atlas",
  robots: { index: false, follow: false },
};

/**
 * The editor's own view of the atlas: everything in it, split by what the
 * public can see. Reachable only through the middleware gate.
 *
 * Publication state lives in `src/data/projects.ts`, one `visibility` word per
 * project, so this page reports it rather than editing it.
 */
export default async function EditorPage() {
  const editor = await getEditor();

  return (
    <div className="min-h-[70vh] bg-surface py-[clamp(40px,6vw,90px)]">
      <Container>
        <p className="eyebrow mb-4">Editor</p>
        <h1 className="mb-3 max-w-[20ch] text-[clamp(30px,4.4vw,60px)] font-extrabold leading-[0.98] tracking-[-0.022em] text-ink text-balance">
          The whole atlas
        </h1>
        <p className="mb-[clamp(30px,5vw,56px)] max-w-[62ch] text-[13px] leading-[1.7] text-graphite">
          Signed in as {editor?.name ?? "an editor"}. Live projects are on the public
          site; drafts are listed and reachable only while you are signed in, a
          visitor who follows a draft link gets the sign-in form instead.
        </p>

        <Section
          title="Live"
          note="Public, listed on the homepage, the projects page and the nav switcher."
          items={liveProjects}
        />
        <Section
          title="Draft · month 1 candidates"
          note="Still drafts, gated like the rest, but the plan expects to publish these in the month after launch."
          items={month1Candidates}
        />
        <Section
          title="Draft"
          note="Editors only, hidden from every public listing, and their URLs are closed."
          items={unscheduledDrafts}
        />

        <p className="mt-[clamp(36px,5vw,64px)] max-w-[62ch] text-[12px] leading-[1.7] text-graphite">
          To publish or unpublish a project, change its{" "}
          <code className="text-ink">visibility</code> in{" "}
          <code className="text-ink">src/data/projects.ts</code> to{" "}
          <code className="text-ink">&quot;live&quot;</code> or{" "}
          <code className="text-ink">&quot;draft&quot;</code> and deploy. To mark a
          draft as a month 1 candidate, give it{" "}
          <code className="text-ink">stage: &quot;month-1&quot;</code>.
        </p>
      </Container>
    </div>
  );
}

function Section({ title, note, items }: { title: string; note: string; items: Project[] }) {
  return (
    <section className="mb-[clamp(34px,5vw,60px)]">
      <div className="mb-4 flex flex-wrap items-baseline gap-3 border-b border-ink/20 pb-3">
        <h2 className="font-mono text-[12px] uppercase tracking-[0.16em] text-ink">{title}</h2>
        <span className="font-mono text-[12px] text-graphite">{items.length}</span>
        <span className="text-[11.5px] leading-[1.6] text-graphite">{note}</span>
      </div>

      <ul className="flex flex-col">
        {items.map((p) => (
          <li
            key={p.id}
            className="flex flex-wrap items-baseline gap-x-5 gap-y-1 border-b border-ink/10 py-3"
          >
            <span className="min-w-[16ch] flex-1 text-[15px] font-extrabold leading-tight text-ink">
              {p.title}
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-graphite">
              {p.field}
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-graphite">
              {formatProjectDate(p.date)}
            </span>
            {p.path ? (
              <Link
                href={p.path}
                className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink underline-offset-4 hover:underline"
              >
                {p.path} →
              </Link>
            ) : (
              <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-faint">
                no page yet
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
