"use client";

/*
 * USAGE EXAMPLE — how The Hollow Villages wires the shared Navbar to its own pages.
 *
 * Drop a component like this in the project's root layout. It supplies:
 *   - currentProject  (this project's name + slug)
 *   - projects        (the dropdown list — shared across the platform)
 *   - pages           (THIS project's page links)
 *   - activeHref      (the live path, so the current page underlines)
 *
 * Note on project "zones": The Hollow Villages is served under a basePath
 * (/hollow-villages), and next/navigation's usePathname() returns the path with
 * the basePath stripped (e.g. "/research"). Since the Navbar uses plain <a>s with
 * full hrefs, we prefix the basePath back on when computing activeHref.
 */

import { usePathname } from "next/navigation";
import { Navbar } from "futures-atlas-core";

// shared across the platform (could live in a shared data file / be fetched)
const PROJECTS = [
  { name: "The Hollow Villages", slug: "hollow-villages" },
  { name: "Underground Intelligence", slug: "underground-intelligence" },
];

const BASE = "/hollow-villages";

// this project's own pages
const PAGES = [
  { label: "Home", href: `${BASE}` },
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
    />
  );
}

/*
 * On the Atlas home itself (futures-atlas-02), there is no current project — just
 * the persistent anchor + the Atlas's own pages on the right:
 *
 *   <Navbar
 *     pages={[
 *       { label: "Home", href: "/" },
 *       { label: "About", href: "/about" },
 *       { label: "Contact", href: "/contact" },
 *     ]}
 *     activeHref={usePathname()}
 *     trailing={<ThemeToggle />}   // optional extra controls
 *   />
 *
 * Then in the project's layout:  <SiteNav />
 */
