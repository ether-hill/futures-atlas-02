"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "futures-atlas-core";
import { projects } from "@/data/projects";
import { ThemeToggle } from "./ThemeToggle";

// The Atlas's own pages (no current project here — this is the index/home).
const PAGES = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

// shared switcher list (slug = the in-site path), live projects first
const SWITCHER = projects
  .filter((p) => p.path)
  .map((p) => ({ name: p.title, slug: p.path!.replace(/^\//, "") }));

export function AtlasNav() {
  const pathname = usePathname();
  return (
    <Navbar
      projects={SWITCHER}
      pages={PAGES}
      activeHref={pathname}
      homeHref="/"
      trailing={<ThemeToggle />}
    />
  );
}
