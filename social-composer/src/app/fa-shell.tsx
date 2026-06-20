"use client";

/**
 * Global Futures Atlas master header — the persistent platform breadcrumb above
 * every project. Left: the FA mark + back arrow (→ Atlas home) and a project
 * breadcrumb dropdown (up to 10 recent projects + "View all projects"). Right:
 * the project's own About + Contact links. Simple, black. The project interface
 * begins directly below. All links are raw <a> so they ignore the basePath and
 * resolve against the Atlas root.
 */
import { useEffect, useRef, useState } from "react";
import { FA_HOME, FA_PROJECTS, FA_CURRENT_PATH, FA_CURRENT_NAME } from "./fa-projects";

export function FaShell({
  aboutHref = "/social-composer/about",
  contactHref = `/contact?project=${encodeURIComponent(FA_CURRENT_NAME)}`,
}: {
  aboutHref?: string;
  contactHref?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <header className="fa-shell">
      <div className="fa-shell__left">
        <a className="fa-shell__home" href={FA_HOME} aria-label="Back to Futures Atlas">
          <span className="fa-shell__back" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
          </span>
          <span className="fa-shell__mark" aria-hidden="true"><FaMark /></span>
          <span className="fa-shell__word">Futures Atlas</span>
        </a>

        <span className="fa-shell__sep" aria-hidden="true">/</span>

        <div className="fa-shell__crumb" ref={wrap}>
          <button
            type="button"
            className="fa-shell__current"
            aria-haspopup="menu"
            aria-expanded={open}
            aria-label={`Current project: ${FA_CURRENT_NAME}. Switch project`}
            onClick={() => setOpen((o) => !o)}
          >
            <span>{FA_CURRENT_NAME}</span>
            <span className="fa-shell__chev" aria-hidden="true">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
            </span>
          </button>

          {open && (
            <div className="fa-shell__menu" role="menu" aria-label="Switch project">
              {FA_PROJECTS.map((p) => {
                const current = p.path === FA_CURRENT_PATH;
                return (
                  <a
                    key={p.path}
                    role="menuitem"
                    href={p.path}
                    className={`fa-shell__item${current ? " is-current" : ""}`}
                    aria-current={current ? "true" : undefined}
                    onClick={() => setOpen(false)}
                  >
                    {p.name}
                  </a>
                );
              })}
              <span className="fa-shell__menusep" />
              <a role="menuitem" href={FA_HOME} className="fa-shell__item fa-shell__item--accent" onClick={() => setOpen(false)}>
                View all projects →
              </a>
            </div>
          )}
        </div>
      </div>

      <nav className="fa-shell__right" aria-label="Project">
        <a className="fa-shell__link" href={aboutHref}>About this project</a>
        <a className="fa-shell__link" href={contactHref}>Contact</a>
      </nav>
    </header>
  );
}

/**
 * Futures Atlas mark — the brand logo (public/fa.svg, served at
 * /social-composer/fa.svg). The artwork is the bare mark on a transparent field,
 * viewBox-cropped tight; `invert(1)` flips the black mark to white for the
 * shell's black header. Sized to ~1em so it stands as tall as the wordmark.
 */
function FaMark() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/social-composer/fa.svg"
      alt=""
      aria-hidden="true"
      style={{ display: "block", height: "1.05em", width: "auto", filter: "invert(1)" }}
    />
  );
}
