"use client";

import { useEffect, useRef, useState } from "react";

export interface NavPage {
  label: string;
  href: string;
}

/**
 * The current project's page links (right side). Active page underlined.
 * On mobile (<=720px) the links collapse into a hamburger menu; the Atlas layer
 * (anchor + project name) stays visible in the bar.
 */
export function ProjectNav({ pages, activeHref }: { pages: NavPage[]; activeHref?: string }) {
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

  if (!pages?.length) return null;

  return (
    <div ref={wrap} style={{ position: "relative", display: "flex", alignItems: "center" }}>
      <nav className="fa-pnav" aria-label="Project pages">
        {pages.map((p) => {
          const active = p.href === activeHref;
          return (
            <a
              key={p.href}
              href={p.href}
              className={`fa-pnav__link${active ? " fa-pnav__link--active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              {p.label}
            </a>
          );
        })}
      </nav>

      <button
        type="button"
        className="fa-burger"
        aria-label="Project menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span />
        <span />
        <span />
      </button>

      {open && (
        <div className="fa-menu fa-menu--right" role="menu" aria-label="Project pages">
          {pages.map((p) => {
            const active = p.href === activeHref;
            return (
              <a
                key={p.href}
                role="menuitem"
                href={p.href}
                className={`fa-menu__item${active ? " fa-menu__item--muted" : ""}`}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                {p.label}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
