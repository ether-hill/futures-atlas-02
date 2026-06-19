"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "futures-atlas-core";
import { projects } from "@/data/projects";
import { ThemeToggle } from "./ThemeToggle";

// Shared platform switcher (every project with an in-site path).
const SWITCHER = projects
  .filter((p) => p.path)
  .map((p) => ({ name: p.title, slug: p.path!.replace(/^\//, "") }));

/** Per-project consolidated nav for an in-hub project at `base` (e.g.
 *  "/coastlines-2100"): Atlas brand → home, project switcher, this project's
 *  Home / Research / Contact pages, theme toggle. */
export function ProjectSiteNav({ title, base }: { title: string; base: string }) {
  const pathname = usePathname();
  const pages = [
    { label: "Home", href: base },
    { label: "Research", href: `${base}/research` },
    { label: "Contact", href: `${base}/contact` },
  ];
  return (
    <Navbar
      currentProject={{ name: title, slug: base.replace(/^\//, "") }}
      projects={SWITCHER}
      pages={pages}
      activeHref={pathname}
      homeHref="/"
      trailing={<ThemeToggle />}
    />
  );
}
