"use client";

import { usePathname } from "next/navigation";
import { GlobalNav, type NavLink } from "futures-atlas-core";
import { ThemeToggle } from "./ThemeToggle";

// The one standard global nav. On the Atlas's own pages there's no current
// project, so no breadcrumb — just the primary links + theme toggle.
const LINKS: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Projects", href: "/#projects" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export function AtlasNav() {
  const pathname = usePathname();
  return <GlobalNav links={LINKS} activeHref={pathname} homeHref="/" trailing={<ThemeToggle overlay />} />;
}
