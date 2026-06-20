"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "futures-atlas-core";
import { ThemeToggle } from "./ThemeToggle";

const BASE = "/hollow-villages";

// shared platform switcher list
const PROJECTS = [
  { name: "The Hollow Villages", slug: "hollow-villages" },
  { name: "Underground Intelligence", slug: "underground-intelligence" },
  { name: "The Odds", slug: "odds-of-surviving-ai" },
];

// this project's own pages
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
    <Navbar
      currentProject={{ name: "The Hollow Villages", slug: "hollow-villages" }}
      projects={PROJECTS}
      pages={PAGES}
      activeHref={activeHref}
      homeHref="/"
      trailing={<ThemeToggle />}
    />
  );
}
