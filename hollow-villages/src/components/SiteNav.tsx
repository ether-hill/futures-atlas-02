"use client";

import { usePathname } from "next/navigation";

const BASE = "/hollow-villages";

// this project's own pages — rendered as the slim sub-nav below the one global
// master bar (the shared /atlas-nav.js fa-shell, which owns brand + project
// switcher + global links + theme toggle).
const PAGES = [
  { label: "Home", href: BASE },
  { label: "Oracle", href: `${BASE}/oracle` },
  { label: "Research", href: `${BASE}/research` },
  { label: "Contact", href: `${BASE}/contact` },
];

export function SiteNav() {
  const pathname = usePathname(); // basePath-stripped, e.g. "/research" or "/"
  const activeHref = pathname === "/" ? BASE : `${BASE}${pathname}`;
  return (
    <nav className="fa-subnav" aria-label="The Hollow Villages">
      {PAGES.map((p) => (
        <a
          key={p.href}
          href={p.href}
          className={`fa-subnav__link${p.href === activeHref ? " is-active" : ""}`}
          aria-current={p.href === activeHref ? "page" : undefined}
        >
          {p.label}
        </a>
      ))}
    </nav>
  );
}
