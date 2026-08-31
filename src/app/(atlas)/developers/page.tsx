import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { Reveal } from "@/components/Reveal";
import {
  ARCHITECTURE_INTRO,
  CONTACT,
  ENV_NOTE,
  HERO,
  LAYERS,
  LICENCE,
  OPENNESS,
  OPENNESS_INTRO,
  RUN_INTRO,
  RUN_STEPS,
  SOURCES_INTRO,
} from "@/content/developers";
import { draftProjects, liveProjects, type Project } from "@/data/projects";
import { ATLAS_REPO, BUILD_LABEL, githubUrl, sourceFor } from "@/data/source-map";
import { getEditor } from "@/lib/editor";

export const metadata: Metadata = {
  title: "For developers. Futures Atlas",
  description:
    "How the Atlas is built, where every project's source lives, how to run it yourself, and exactly what is open and what is closed.",
};

/**
 * The developer entry point, linked from the footer's "Use the work" block.
 *
 * The project index is JOINED from projects.ts (what exists, and who may see
 * it) and source-map.ts (where the code is), so it cannot drift from either.
 * The public sees live projects only, the same rule as /projects, and a
 * signed-in editor additionally gets the drafts, flagged as drafts. The source
 * is in a public repo either way; what the gate protects is the presentation of
 * unfinished work, and that reasoning is stated on the page rather than hidden.
 */

const head = "font-mono text-[11px] uppercase tracking-[0.18em] text-accent-deep";

function Section({
  id,
  label,
  title,
  lede,
  children,
}: {
  id: string;
  label: string;
  title: string;
  lede?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 border-t border-ink/15 py-[clamp(44px,7vw,96px)]"
    >
      <Container>
        <Reveal>
          <span className={head}>{label}</span>
          <h2 className="mt-3 text-[clamp(26px,3.4vw,44px)] font-extrabold leading-[1.02] tracking-[-0.022em] text-ink">
            {title}
          </h2>
          {lede && (
            <p className="mt-5 max-w-[70ch] font-mono text-[13.5px] leading-[1.85] text-ink-70">
              {lede}
            </p>
          )}
        </Reveal>
        <div className="mt-[clamp(26px,4vw,48px)]">{children}</div>
      </Container>
    </section>
  );
}

/** One row of the project source index. */
function SourceRow({ project, draft }: { project: Project; draft?: boolean }) {
  const src = sourceFor(project.id);
  const where = project.path ?? project.url;

  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-4 border-b border-ink/10 py-[clamp(18px,2.4vw,28px)] last:border-b-0 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1.35fr)]">
      <div>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
          <h3 className="text-[clamp(17px,1.9vw,22px)] font-extrabold tracking-[-0.018em] text-ink">
            {where ? (
              <Link href={where} className="underline-offset-4 hover:text-accent-deep hover:underline">
                {project.title}
              </Link>
            ) : (
              project.title
            )}
          </h3>
          {draft && (
            <span
              className="font-mono text-[10px] uppercase tracking-[0.14em]"
              style={{
                padding: "3px 7px",
                background: "var(--text)",
                color: "var(--bg)",
              }}
            >
              Draft
            </span>
          )}
        </div>
        {where && (
          <p className="mt-2 font-mono text-[12px] text-graphite">{where}</p>
        )}
        {src && (
          <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.12em] text-accent-deep">
            {BUILD_LABEL[src.build]}
          </p>
        )}
      </div>

      <div>
        {src ? (
          <>
            <a
              href={githubUrl(src)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block font-mono text-[13px] text-ink underline decoration-ink/30 underline-offset-4 transition-colors hover:text-accent-deep hover:decoration-accent-deep"
            >
              {src.dir}/ <span aria-hidden="true">↗</span>
            </a>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {src.stack.map((s) => (
                <span
                  key={s}
                  className="border border-ink/20 px-2 py-1 font-mono text-[11px] text-ink-70"
                >
                  {s}
                </span>
              ))}
            </div>
            {src.note && (
              <p className="mt-3 max-w-[62ch] font-mono text-[12.5px] leading-[1.75] text-ink-70">
                {src.note}
              </p>
            )}
          </>
        ) : (
          <p className="font-mono text-[12.5px] leading-[1.75] text-graphite">
            No source recorded yet.
          </p>
        )}
      </div>
    </div>
  );
}

/** One repository card. */
function RepoCard({
  repo,
  title,
  body,
}: {
  repo: string;
  title: string;
  body: string;
}) {
  return (
    <div className="flex h-full flex-col border border-ink/15 p-[clamp(20px,2.6vw,32px)] transition-colors hover:border-ink/45">
      <span className={head}>Public repository</span>
      <h3 className="mt-3 text-[clamp(19px,2.1vw,26px)] font-extrabold tracking-[-0.018em] text-ink">
        {title}
      </h3>
      <p className="mt-3 flex-1 font-mono text-[13px] leading-[1.8] text-ink-70">{body}</p>
      <a
        href={`https://github.com/${repo}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 inline-block font-mono text-[13px] text-ink underline decoration-ink/30 underline-offset-4 transition-colors hover:text-accent-deep hover:decoration-accent-deep"
      >
        github.com/{repo} <span aria-hidden="true">↗</span>
      </a>
    </div>
  );
}

const STATE_LABEL = { open: "Open", closed: "Closed", unlisted: "Unlisted" } as const;

export default async function DevelopersPage() {
  const editor = await getEditor();

  return (
    <div className="bg-surface">
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="border-b border-ink/15 py-[clamp(56px,9vw,120px)]">
        <Container>
          <Reveal>
            <div className="mb-3.5 flex flex-wrap items-baseline gap-4">
              <span className="h-px min-w-10 flex-1 bg-ink/[0.18]" />
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-graphite">
                {HERO.eyebrow}
              </span>
            </div>
            <h1 className="max-w-[16ch] text-[clamp(36px,5.6vw,80px)] font-extrabold leading-[0.98] tracking-[-0.026em] text-ink text-balance">
              {HERO.headline}
            </h1>
            <p className="mt-[clamp(16px,2vw,26px)] max-w-[66ch] font-mono text-[clamp(13px,1.4vw,15.5px)] leading-[1.85] text-ink-70">
              {HERO.standfirst}
            </p>
            <p className="mt-5 font-mono text-[clamp(15px,1.7vw,19px)] font-semibold text-accent-deep">
              {HERO.kicker}
            </p>

            <nav className="mt-[clamp(24px,3vw,40px)] flex flex-wrap gap-2.5">
              {[
                ["architecture", "How it's built"],
                ["repositories", "Repositories"],
                ["projects", "Project source"],
                ["run", "Run it yourself"],
                ["open", "Open & closed"],
                ["licence", "Licence"],
              ].map(([id, label]) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className="border border-ink/20 px-3 py-1.5 font-mono text-[12px] text-ink-70 transition-colors hover:border-ink/50 hover:text-ink"
                >
                  {label}
                </a>
              ))}
            </nav>
          </Reveal>
        </Container>
      </section>

      {/* ── How it's built ──────────────────────────────────────────────── */}
      <Section id="architecture" label="Architecture" title="How it's built" lede={ARCHITECTURE_INTRO}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {LAYERS.map((l, i) => (
            <Reveal key={l.n} delay={i * 80}>
              <div className="h-full border border-ink/15 p-[clamp(20px,2.4vw,30px)] transition-colors hover:border-ink/45">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-[clamp(18px,2vw,24px)] font-extrabold tracking-[-0.018em] text-ink">
                    {l.title}
                  </h3>
                  <span className="font-mono text-[11px] text-ink/35">{l.n}</span>
                </div>
                <p className="mt-3 font-mono text-[13px] leading-[1.8] text-ink-70">{l.body}</p>
                <p className="mt-4 border-t border-ink/10 pt-3 font-mono text-[11.5px] text-graphite">
                  {l.detail}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ── Repositories ────────────────────────────────────────────────── */}
      <Section
        id="repositories"
        label="Repository"
        title="One repository"
        lede="The site and every project bundled under it live in a single repo. Clone it, run it, take the parts the licence gives you."
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Reveal>
            <RepoCard
              repo={ATLAS_REPO}
              title="futures-atlas-02"
              body="The host app, every project's source, the research data files, the build scripts and the committed static bundles. If something is on the Atlas, it is in here."
            />
          </Reveal>
          <Reveal delay={80}>
            <div className="flex h-full flex-col border border-ink/15 p-[clamp(20px,2.6vw,32px)]">
              <span className={head}>Inside it</span>
              <h3 className="mt-3 text-[clamp(19px,2.1vw,26px)] font-extrabold tracking-[-0.018em] text-ink">
                The design system
              </h3>
              <p className="mt-3 flex-1 font-mono text-[13px] leading-[1.8] text-ink-70">
                Vendored at <span className="whitespace-nowrap">packages/futures-atlas-core</span>,
                with its own copy inside a few of the sub-apps. It is the Atlas&rsquo;s visual
                identity, so it is documented rather than offered. The live reference is at{" "}
                <Link href="/design-system" className="underline decoration-ink/30 underline-offset-4 hover:text-accent-deep">
                  /design-system
                </Link>.
              </p>
            </div>
          </Reveal>
          <Reveal delay={160}>
            <div className="flex h-full flex-col border border-ink/15 p-[clamp(20px,2.6vw,32px)]">
              <span className={head}>Never committed</span>
              <h3 className="mt-3 text-[clamp(19px,2.1vw,26px)] font-extrabold tracking-[-0.018em] text-ink">
                Keys and builds
              </h3>
              <p className="mt-3 flex-1 font-mono text-[13px] leading-[1.8] text-ink-70">
                Every environment file, every built sub-app bundle and the generated footer are
                git-ignored. No key or password has ever been in the tree, so a clone is safe to
                run and safe to fork.
              </p>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ── Project source index ────────────────────────────────────────── */}
      <Section
        id="projects"
        label="Source index"
        title="Where each project lives"
        lede={SOURCES_INTRO}
      >
        <div className="border-t border-ink/15">
          {liveProjects.map((p) => (
            <SourceRow key={p.id} project={p} />
          ))}
        </div>

        {editor && (
          <div className="mt-[clamp(32px,5vw,64px)]">
            <div className="border border-ink/25 p-[clamp(16px,2vw,24px)]">
              <span className={head}>Editors only</span>
              <p className="mt-2 max-w-[70ch] font-mono text-[12.5px] leading-[1.8] text-ink-70">
                {draftProjects.length} unpublished projects, hidden from the public listing above.
                Their source sits in the same public repository. The gate keeps unfinished
                work off the site, and that&rsquo;s all it does.
              </p>
            </div>
            <div className="mt-6 border-t border-ink/15">
              {draftProjects.map((p) => (
                <SourceRow key={p.id} project={p} draft />
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* ── Run it yourself ─────────────────────────────────────────────── */}
      <Section id="run" label="Getting started" title="Run it yourself" lede={RUN_INTRO}>
        <div className="flex flex-col divide-y divide-ink/10 border-y border-ink/15">
          {RUN_STEPS.map((s) => (
            <Reveal key={s.cmd} className="py-[clamp(16px,2.2vw,26px)]">
              <div className="grid grid-cols-1 gap-x-8 gap-y-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <code className="block overflow-x-auto whitespace-pre font-mono text-[13px] text-ink">
                  {s.cmd}
                </code>
                <p className="font-mono text-[12.5px] leading-[1.75] text-ink-70">{s.note}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <p className="mt-6 max-w-[70ch] font-mono text-[12.5px] leading-[1.85] text-graphite">
            {ENV_NOTE}
          </p>
        </Reveal>
      </Section>

      {/* ── What's open, what isn't ─────────────────────────────────────── */}
      <Section id="open" label="Transparency" title="What's open, what isn't" lede={OPENNESS_INTRO}>
        <div className="border-t border-ink/15">
          {OPENNESS.map((r) => (
            <Reveal
              key={r.thing}
              className="grid grid-cols-1 gap-x-8 gap-y-3 border-b border-ink/10 py-[clamp(16px,2.2vw,26px)] lg:grid-cols-[minmax(0,0.5fr)_auto_minmax(0,1.5fr)]"
            >
              <h3 className="text-[clamp(16px,1.7vw,20px)] font-extrabold tracking-[-0.016em] text-ink">
                {r.thing}
              </h3>
              <span
                className="justify-self-start self-start text-center font-mono text-[10px] uppercase tracking-[0.14em]"
                style={{
                  minWidth: "9ch",
                  padding: "4px 9px",
                  background: r.state === "open" ? "var(--accent)" : "transparent",
                  border: r.state === "open" ? "1px solid var(--accent)" : "1px solid var(--text)",
                  color: r.state === "open" ? "var(--paper, #fff)" : "var(--text)",
                }}
              >
                {STATE_LABEL[r.state]}
              </span>
              <p className="max-w-[68ch] font-mono text-[12.5px] leading-[1.8] text-ink-70">
                {r.detail}
              </p>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ── Licence ─────────────────────────────────────────────────────── */}
      <Section id="licence" label="Licence" title="What you may do with it" lede={LICENCE.intro}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {LICENCE.terms.map((t, i) => (
            <Reveal key={t.label} delay={i * 80}>
              <div className="h-full border border-ink/15 p-[clamp(20px,2.4vw,30px)]">
                <span className={head}>{t.label}</span>
                <p className="mt-3 text-[clamp(18px,2vw,24px)] font-extrabold tracking-[-0.018em] text-ink">
                  {t.licence}
                </p>
                <p className="mt-3 font-mono text-[12.5px] leading-[1.8] text-ink-70">{t.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <p className="mt-6 max-w-[70ch] font-mono text-[13px] leading-[1.85] text-ink-70">
            {LICENCE.closing}
          </p>
        </Reveal>
      </Section>

      {/* ── Contact ─────────────────────────────────────────────────────── */}
      <section className="border-t border-ink/15 py-[clamp(44px,7vw,90px)]">
        <Container>
          <Reveal>
            <h2 className="text-[clamp(22px,2.8vw,34px)] font-extrabold leading-[1.05] tracking-[-0.02em] text-ink">
              {CONTACT.title}
            </h2>
            <p className="mt-4 max-w-[68ch] font-mono text-[13.5px] leading-[1.85] text-ink-70">
              {CONTACT.body}
            </p>
            <Link
              href={CONTACT.cta.href}
              className="mt-7 inline-flex items-center gap-2.5 font-mono text-[14px] uppercase tracking-[0.1em] text-ink underline-offset-4 transition-colors hover:text-accent-deep hover:underline"
            >
              {CONTACT.cta.label} <span aria-hidden="true">→</span>
            </Link>
          </Reveal>
        </Container>
      </section>
    </div>
  );
}
