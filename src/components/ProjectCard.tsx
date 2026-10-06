import Link from "next/link";
import {
  liveProjects,
  formatProjectDate,
  KIND_LABEL,
  STAGE_LABEL,
  type Project,
  type ProjectStage,
} from "@/data/projects";

// Fully token-driven (futures-atlas-core): every size/space/colour/font references
// a semantic token, so the style-guide panel drives every dimension. Structural
// utilities (flex/grid/absolute/aspect) are layout, not design values.

/**
 * The flag on a card, only ever rendered for a signed-in editor. Four states:
 * Live, Ready, Needs work, Draft. The two staged ones take a categorical token
 * each so they read apart from Live's accent and from a plain draft's ink at a
 * glance; those tokens sit at a middle lightness in both themes, so their text
 * is the always-dark ink rather than a colour that flips.
 */
const STAGE_TONE: Record<ProjectStage, string> = {
  ready: "var(--data-3)",
  "needs-work": "var(--data-4)",
};

function VisibilityTag({ project }: { project: Project }) {
  const draft = project.visibility === "draft";
  const stage = draft ? project.stage : undefined;
  const label = !draft ? "Live" : stage ? STAGE_LABEL[stage] : "Draft";
  return (
    <span
      className="absolute left-0 top-0 z-[2] inline-flex items-center gap-1.5"
      style={{
        margin: "var(--space-4)",
        padding: "5px 10px",
        borderRadius: "2px",
        background: stage ? STAGE_TONE[stage] : draft ? "var(--text)" : "var(--accent)",
        color: stage ? "var(--fa-ink)" : draft ? "var(--bg)" : "var(--paper, #fff)",
        fontFamily: "var(--font-mono)",
        fontSize: "var(--text-label)",
        textTransform: "uppercase",
        letterSpacing: "var(--track-label)",
      }}
    >
      {label}
    </span>
  );
}

export function ProjectCard({
  project,
  index,
  showVisibility = false,
}: {
  project: Project;
  index: number;
  /** Editor mode: flag each card as live or draft. Never set for the public. */
  showVisibility?: boolean;
}) {
  const n = String(index + 1).padStart(2, "0");
  const live = project.status === "live";

  const inner = (
    <>
      {/* plate */}
      <div
        className={`group/plate relative flex aspect-[3/2] items-end overflow-hidden ${project.image ? "" : "fa-hatch"}`}
        style={{ borderBottom: "var(--border-hairline) solid var(--hairline)", padding: "var(--space-5)" }}
      >
        {showVisibility && <VisibilityTag project={project} />}
        {project.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.image}
            alt={`${project.title}, preview`}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <span
            className="fa-year"
            style={{ fontSize: "var(--text-stat)", lineHeight: 0.8, color: "color-mix(in srgb, var(--text) 15%, transparent)" }}
          >
            {n}
          </span>
        )}
      </div>

      {/* body */}
      <div className="flex flex-1 flex-col" style={{ padding: "var(--space-card)" }}>
        <div className="flex items-center justify-between" style={{ gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
          {/* The caption is `kind`, not `field`. `field` was free text and had
              grown to 22 values across 32 projects, 16 of them used once, so it
              said something different on every card and nothing across the set.
              It was also wrong on the live ones: "AI & risk" captioned both
              briefing tools, neither of which is about risk. `kind` is four
              typed values and answers the question someone scanning an index
              actually has, which is what they will be doing here. */}
          <span className="fa-card__meta">{KIND_LABEL[project.kind]}</span>
          <span
            style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-label)", textTransform: "uppercase", letterSpacing: "var(--track-label)", color: "var(--muted)" }}
          >
            {formatProjectDate(project.date)}
          </span>
        </div>
        <h3 className="fa-card__title">{project.title}</h3>
        <p
          style={{ marginTop: "var(--space-3)", maxWidth: "52ch", fontSize: "var(--text-body-size)", lineHeight: "var(--lh-body)", color: "var(--text-body)" }}
        >
          {project.tagline}
        </p>
        <span
          className="self-start"
          style={{
            marginTop: "var(--space-6)",
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--space-2)",
            borderBottom: "var(--border-emphasis) solid var(--text)",
            paddingBottom: "2px",
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-label)",
            textTransform: "uppercase",
            letterSpacing: "var(--track-label)",
            color: "var(--text)",
          }}
        >
          {live ? project.cta ?? "Open the project" : "Forthcoming"}
          {live && <span>{project.path ? "→" : "↗"}</span>}
        </span>
      </div>
    </>
  );

  if (project.path) {
    return (
      <Link href={project.path} prefetch={false} className="fa-card fa-card--link group">
        {inner}
      </Link>
    );
  }
  if (project.url) {
    return (
      <a href={project.url} target="_blank" rel="noopener noreferrer" className="fa-card fa-card--link group">
        {inner}
      </a>
    );
  }
  return (
    <div className="fa-card group" style={{ opacity: 0.9 }}>
      {inner}
    </div>
  );
}

export function ProjectGrid({
  items = liveProjects,
  showVisibility = false,
}: {
  items?: Project[];
  showVisibility?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ gap: "clamp(24px, 2.2vw, 40px)" }}>
      {items.map((p, i) => (
        <ProjectCard key={p.id} project={p} index={i} showVisibility={showVisibility} />
      ))}
    </div>
  );
}
