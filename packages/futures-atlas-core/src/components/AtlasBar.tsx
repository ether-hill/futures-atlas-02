"use client";

import { useEffect, useRef, useState } from "react";
import { FaLogoMark } from "./FaLogoMark";

export interface AtlasProject {
  name: string;
  slug: string;
  href?: string; // defaults to `/${slug}`
}

/**
 * The persistent platform layer: the clickable "Futures Atlas" anchor (always a
 * link to home) + an optional project-switcher dropdown. Plain <a>s so it works
 * across the main app and basePath'd project zones alike.
 */
export function AtlasBar({
  currentProject,
  projects = [],
  homeHref = "/",
}: {
  currentProject?: { name: string; slug: string };
  projects?: AtlasProject[];
  homeHref?: string;
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
    <div className="fa-navbar__left">
      <a className="fa-atlas" href={homeHref} aria-label="Go to Futures Atlas home">
        <span className="fa-atlas__mark" aria-hidden="true">
          <FaLogoMark size={18} />
        </span>
        <span className="fa-atlas__word">Futures Atlas</span>
        <span className="fa-atlas__home" aria-hidden="true">
          <HomeIcon />
        </span>
        <span className="fa-atlas__tip" role="tooltip">
          Back to Futures Atlas home
        </span>
      </a>

      {currentProject && (
        <>
          <span className="fa-sep" aria-hidden="true">
            /
          </span>
          <div className="fa-switch-wrap" ref={wrap}>
            <button
              type="button"
              className="fa-switch"
              aria-haspopup="menu"
              aria-expanded={open}
              aria-label={`Current project: ${currentProject.name}. Switch project`}
              onClick={() => setOpen((o) => !o)}
            >
              <span className="fa-switch__name">{currentProject.name}</span>
              <span className="fa-switch__chev" aria-hidden="true">
                <Chevron />
              </span>
            </button>

            {open && (
              <div className="fa-menu fa-menu--left" role="menu" aria-label="Switch project">
                {projects.map((p) => {
                  const current = p.slug === currentProject.slug;
                  return (
                    <a
                      key={p.slug}
                      role="menuitem"
                      href={p.href ?? `/${p.slug}`}
                      className={`fa-menu__item${current ? " fa-menu__item--muted" : ""}`}
                      aria-current={current ? "true" : undefined}
                      onClick={() => setOpen(false)}
                    >
                      {p.name}
                    </a>
                  );
                })}
                <span className="fa-menu__sep" />
                <a role="menuitem" href={homeHref} className="fa-menu__item fa-menu__item--accent" onClick={() => setOpen(false)}>
                  All projects →
                </a>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function HomeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 11.5 12 4l9 7.5M5.5 10V20h13V10" />
    </svg>
  );
}
function Chevron() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
