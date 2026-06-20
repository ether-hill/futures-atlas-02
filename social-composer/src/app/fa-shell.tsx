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
 * Futures Atlas mark — a faceted dome over a rising sun. Line art using
 * `currentColor`, so it inverts black/white with the surrounding text colour.
 */
function FaMark() {
  return (
    <svg width="22" height="15" viewBox="6 10 88 56" fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
      <path d="M12 60 L16.4 39.3 L31 21.9 L50 16 L69 21.9 L83.6 39.3 L88 60 Z" />
      <path d="M41.6 56.8 L21.5 49.2" />
      <path d="M43.6 53.7 L27 37.5" />
      <path d="M46.3 51.8 L35.9 29.1" />
      <path d="M50 51 L50 25" />
      <path d="M53.7 51.8 L64.1 29.1" />
      <path d="M56.4 53.7 L73 37.5" />
      <path d="M58.4 56.8 L78.5 49.2" />
      <path d="M41 60 A9 9 0 0 1 59 60" />
    </svg>
  );
}
