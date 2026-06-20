"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { FaLogoMark } from "./FaLogoMark";

export interface NavLink {
  label: string;
  href: string;
}
export interface SwitcherProject {
  name: string;
  path: string;
}

/**
 * The one standard global nav (black bar) shared everywhere.
 *   left  — white brand mark + "Futures Atlas"; on a project page, the project
 *           name with a switcher dropdown.
 *   right — the primary links (Home, Projects, About, Contact) + theme toggle.
 */
export function GlobalNav({
  links,
  activeHref,
  homeHref = "/",
  currentProject,
  projects = [],
  trailing,
}: {
  links: NavLink[];
  activeHref?: string;
  homeHref?: string;
  currentProject?: SwitcherProject;
  projects?: SwitcherProject[];
  trailing?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header className="fa-shell">
      <div className="fa-shell__left">
        <a className="fa-shell__home" href={homeHref} aria-label="Futures Atlas home">
          <span className="fa-shell__mark" aria-hidden="true">
            <FaLogoMark size={18} />
          </span>
          <span className="fa-shell__word">Futures Atlas</span>
        </a>

        {currentProject && (
          <>
            <span className="fa-shell__sep" aria-hidden="true">
              /
            </span>
            <div className="fa-shell__crumb" ref={wrap}>
              <button
                type="button"
                className="fa-shell__current"
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label={`Current project: ${currentProject.name}. Switch project`}
                onClick={() => setOpen((o) => !o)}
              >
                <span>{currentProject.name}</span>
                <span className="fa-shell__chev" aria-hidden="true">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </span>
              </button>
              <div className="fa-shell__menu" role="menu" aria-label="Switch project" hidden={!open}>
                {projects.map((p) => {
                  const current = p.path === currentProject.path;
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
                <a role="menuitem" href={homeHref} className="fa-shell__item fa-shell__item--accent" onClick={() => setOpen(false)}>
                  View all projects →
                </a>
              </div>
            </div>
          </>
        )}
      </div>

      <nav className="fa-shell__right" aria-label="Primary">
        <div className="fa-shell__nav">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`fa-shell__navlink${l.href === activeHref ? " is-active" : ""}`}
              aria-current={l.href === activeHref ? "page" : undefined}
            >
              {l.label}
            </a>
          ))}
        </div>
        {trailing}
      </nav>
    </header>
  );
}
