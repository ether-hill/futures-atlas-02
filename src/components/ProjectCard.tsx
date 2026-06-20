import Link from "next/link";
import { projects, statusLabel, formatProjectDate, type Project } from "@/data/projects";

// Fully token-driven (futures-atlas-core): every size/space/colour/font references
// a semantic token, so the style-guide panel drives every dimension. Structural
// utilities (flex/grid/absolute/aspect) are layout, not design values.

export function ProjectCard({ project, index }: { project: Project; index: number }) {
  const n = String(index + 1).padStart(2, "0");
  const live = project.status === "live";

  const inner = (
    <>
      {/* plate */}
      <div
        className={`group/plate relative flex aspect-[3/2] items-end overflow-hidden ${project.image ? "" : "fa-hatch"}`}
        style={{ borderBottom: "var(--border-hairline) solid var(--hairline)", padding: "var(--space-5)" }}
      >
        {project.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.image}
            alt={`${project.title} — preview`}
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
        <span
          style={{
            position: "absolute",
            right: "var(--space-4)",
            top: "var(--space-4)",
            padding: "var(--space-1) var(--space-2)",
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-micro)",
            textTransform: "uppercase",
            letterSpacing: "var(--track-label)",
            color: "var(--paper)",
            background: live ? "var(--accent-deep)" : "var(--band)",
          }}
        >
          {statusLabel[project.status]}
        </span>
      </div>

      {/* body */}
      <div className="flex flex-1 flex-col" style={{ padding: "var(--space-card)" }}>
        <div className="flex items-center justify-between" style={{ gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
          <span className="fa-card__meta">{project.field}</span>
          <span
            style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-label)", textTransform: "uppercase", letterSpacing: "var(--track-label)", color: "var(--muted)" }}
          >
            {formatProjectDate(project.date)}
          </span>
        </div>
        <h3 className="fa-card__title">{project.title}</h3>
        <p
          style={{ marginTop: "var(--space-3)", maxWidth: "52ch", fontFamily: "var(--font-mono)", fontSize: "var(--text-body-size)", lineHeight: "var(--lh-body)", color: "var(--text-body)" }}
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
          {live ? "Open the project" : "Forthcoming"}
          {live && <span>{project.path ? "→" : "↗"}</span>}
        </span>
      </div>
    </>
  );

  if (project.path) {
    return (
      <Link href={project.path} className="fa-card fa-card--link group">
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

export function ProjectGrid({ items = projects }: { items?: Project[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ gap: "var(--space-5)" }}>
      {items.map((p, i) => (
        <ProjectCard key={p.id} project={p} index={i} />
      ))}
    </div>
  );
}
