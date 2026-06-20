"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Container } from "./Container";
import { ThemeToggle } from "./ThemeToggle";

const links = [
  { href: "/", label: "Home" },
  { href: "/research", label: "Research" },
  { href: "/contact", label: "Contact" },
];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const overlay = pathname === "/";

  return (
    <header
      className={
        overlay
          ? "absolute inset-x-0 top-0 z-40"
          : "sticky top-0 z-40 border-b border-ink bg-surface/92 backdrop-blur-md"
      }
    >
      <Container className="flex items-center justify-between gap-4 py-[clamp(12px,1.6vw,16px)]">
        <Link href="/" className="flex items-baseline gap-3" aria-label="The Hollow Villages — home">
          <span
            className={`text-[clamp(14px,1.4vw,17px)] font-extrabold tracking-[0.02em] ${
              overlay ? "text-paper [text-shadow:0_1px_12px_rgba(0,0,0,0.45)]" : "text-ink"
            }`}
            style={{ fontFamily: "var(--font-archivo)" }}
          >
            THE HOLLOW VILLAGES
          </span>
          <span
            className={`hidden font-mono text-[10.5px] uppercase tracking-[0.18em] min-[1041px]:inline ${
              overlay ? "text-paper/75 [text-shadow:0_1px_10px_rgba(0,0,0,0.4)]" : "text-graphite"
            }`}
          >
            Forecast Instrument
          </span>
        </Link>

        {/* desktop */}
        <nav className="hidden items-center gap-[clamp(12px,2vw,26px)] sm:flex">
          {links.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`border-b-[1.5px] px-1 py-1.5 font-mono text-[11.5px] uppercase tracking-[0.14em] transition-colors ${
                  overlay
                    ? `text-paper/85 [text-shadow:0_1px_10px_rgba(0,0,0,0.4)] hover:text-paper ${active ? "border-paper/60" : "border-transparent"}`
                    : `${active ? "border-ink/40 text-ink" : "border-transparent text-graphite hover:text-ink"}`
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          <Link
            href="/oracle"
            className="rounded-[2px] bg-accent px-4 py-2.5 font-mono text-[11.5px] uppercase tracking-[0.14em] text-paper transition-colors hover:bg-accent-deep"
          >
            Consult the oracle
          </Link>
          <ThemeToggle overlay={overlay} />
        </nav>

        {/* mobile: toggle + menu */}
        <div className="flex items-center gap-2 sm:hidden">
          <ThemeToggle overlay={overlay} />
          <button
            type="button"
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className={`flex h-11 w-11 flex-col items-center justify-center gap-[5px] rounded-[3px] border ${
              overlay ? "border-paper/40" : "border-ink/30"
            }`}
          >
            {[0, 1, 2].map((i) => (
              <span key={i} className={`h-0.5 w-5 ${overlay ? "bg-paper" : "bg-ink"}`} />
            ))}
          </button>
        </div>
      </Container>

      {open && (
        <Container className="sm:hidden">
        <nav className="mt-3 flex flex-col gap-0.5 rounded-[4px] bg-band p-2 shadow-[0_18px_40px_-16px_rgba(20,16,10,0.5)]">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-[2px] px-4 py-3.5 font-mono text-[13px] uppercase tracking-[0.12em] text-paper/85 hover:text-paper"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/oracle"
            onClick={() => setOpen(false)}
            className="mt-1 rounded-[2px] border-l-[3px] border-ink bg-accent px-4 py-3.5 text-center font-mono text-[13px] uppercase tracking-[0.12em] text-paper"
          >
            Consult the oracle
          </Link>
        </nav>
        </Container>
      )}
    </header>
  );
}
