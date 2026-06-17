import Link from "next/link";
import { projects, statusLabel, type Project } from "@/data/projects";

// per-card hatch tint, deterministic by index so the grid has quiet variety
const tints = ["#cbc6b6", "#c4c7bc", "#c9c3b3", "#c6c8be"];

export function ProjectCard({ project, index }: { project: Project; index: number }) {
  const n = String(index + 1).padStart(2, "0");
  const live = project.status === "live";
  const tint = tints[index % tints.length];

  const inner = (
    <>
      {/* plate */}
      <div
        className="relative flex aspect-[3/2] items-end overflow-hidden border-b border-ink p-5"
        style={
          project.image
            ? undefined
            : {
                backgroundColor: tint,
                backgroundImage:
                  "repeating-linear-gradient(128deg, rgba(33,30,24,0.05) 0 1px, transparent 1px 13px)",
              }
        }
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
          <span className="year text-[clamp(56px,7vw,96px)] leading-[0.8] text-[#211e18]/15">
            {n}
          </span>
        )}
        <span
          className="absolute right-4 top-4 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-paper"
          style={{ background: live ? "var(--color-accent-deep)" : "#211e18" }}
        >
          {statusLabel[project.status]}
        </span>
      </div>

      {/* body */}
      <div className="flex flex-1 flex-col p-[clamp(20px,2.4vw,32px)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-accent-deep">
            {project.field}
          </span>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-graphite">
            {project.year}
          </span>
        </div>
        <h3
          className="text-[clamp(22px,2.4vw,32px)] font-extrabold leading-[1.04] tracking-[-0.02em] text-ink"
          style={{ fontFamily: "var(--font-archivo)" }}
        >
          {project.title}
        </h3>
        <p className="mt-3 max-w-[52ch] font-mono text-[12.5px] leading-[1.7] text-ink-70">
          {project.tagline}
        </p>
        <span className="mt-6 inline-flex items-center gap-2 self-start border-b-[1.5px] border-ink pb-0.5 font-mono text-[11px] uppercase tracking-[0.12em] text-ink">
          {live ? "Open the project" : "Forthcoming"}
          {live && <span className="text-[13px]">{project.path ? "→" : "↗"}</span>}
        </span>
      </div>
    </>
  );

  const base =
    "group flex flex-col border border-ink bg-panel transition-colors";

  // internal proxied project (served within this site) — same-tab Link
  if (project.path) {
    return (
      <Link href={project.path} className={`${base} hover:border-accent`}>
        {inner}
      </Link>
    );
  }
  // external project — new tab
  if (project.url) {
    return (
      <a
        href={project.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`${base} hover:border-accent`}
      >
        {inner}
      </a>
    );
  }
  return <div className={`${base} opacity-90`}>{inner}</div>;
}

export function ProjectGrid() {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      {projects.map((p, i) => (
        <ProjectCard key={p.id} project={p} index={i} />
      ))}
    </div>
  );
}
