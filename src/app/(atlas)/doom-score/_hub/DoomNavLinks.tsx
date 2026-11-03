"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function DoomNavLinks({ home, links }: { home: boolean; links: { href: string; label: string }[] }) {
  const path = usePathname();
  return (
    <nav className="ds-nav" aria-label="The Doom Score">
      {home ? (
        <Link href="/doom-score" className="ds-nav-home">
          The Doom Score
        </Link>
      ) : (
        <span className="ds-nav-home">The Doom Score</span>
      )}
      {links.map((l) => {
        const on = path === l.href || path.startsWith(`${l.href}/`);
        return (
          <Link key={l.href} href={l.href} className={on ? "is-on" : ""} aria-current={on ? "page" : undefined}>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
