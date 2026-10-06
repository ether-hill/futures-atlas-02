"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SW_BASE, SW_PAGES, SW_TITLE } from "@/data/standing-waves/meta";

/** The project's own pages. Wraps at 360px instead of scrolling the page. */
export function SwSubNav() {
  const path = usePathname();
  const current = (href: string) => (href === SW_BASE ? path === SW_BASE : path === href || path.startsWith(`${href}/`));
  return (
    <nav aria-label={`${SW_TITLE} pages`} className="sw-subnav">
      <ul className="flex flex-wrap items-center gap-x-5 gap-y-0">
        {SW_PAGES.map((p) => (
          <li key={p.href}>
            <Link href={p.href} aria-current={current(p.href) ? "page" : undefined} className="sw-focus">
              {p.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
