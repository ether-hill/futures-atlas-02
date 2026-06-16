"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Container } from "./Container";
import { ThemeToggle } from "./ThemeToggle";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [navH, setNavH] = useState(0);
  const ref = useRef<HTMLElement>(null);
  const lastY = useRef(0);

  // not sticky: the nav slides away on scroll-down and returns on scroll-up
  useEffect(() => {
    const measure = () => setNavH(ref.current?.offsetHeight ?? 0);
    measure();
    window.addEventListener("resize", measure);

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const y = window.scrollY;
        if (y < 8) setHidden(false);
        else if (y > lastY.current + 4) {
          setHidden(true);
          setOpen(false);
        } else if (y < lastY.current - 4) setHidden(false);
        lastY.current = y;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <>
      {/* spacer keeps content clear of the fixed nav at the top of the page */}
      <div style={{ height: navH }} aria-hidden />
      <header
        ref={ref}
        className={`fixed inset-x-0 top-0 z-40 border-b border-ink bg-surface/92 backdrop-blur-md transition-transform duration-300 ${
          hidden ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        <Container className="flex items-center justify-between gap-4 py-[clamp(12px,1.6vw,16px)]">
          <Link href="/" className="flex items-baseline gap-3" aria-label="Futures Atlas — home">
            <span
              className="text-[clamp(14px,1.4vw,17px)] font-extrabold tracking-[0.02em] text-ink"
              style={{ fontFamily: "var(--font-archivo)" }}
            >
              FUTURES ATLAS
            </span>
            <span className="hidden font-mono text-[10.5px] uppercase tracking-[0.18em] text-graphite min-[1041px]:inline">
              Possible worlds
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
                    active ? "border-ink/40 text-ink" : "border-transparent text-graphite hover:text-ink"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
            <Link
              href="/about"
              className="rounded-[2px] bg-accent px-4 py-2.5 font-mono text-[11.5px] uppercase tracking-[0.14em] text-paper transition-colors hover:bg-accent-deep"
            >
              The Atlas
            </Link>
            <ThemeToggle />
          </nav>

          {/* mobile: toggle + menu */}
          <div className="flex items-center gap-2 sm:hidden">
            <ThemeToggle />
            <button
              type="button"
              aria-label="Menu"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="flex h-11 w-11 flex-col items-center justify-center gap-[5px] rounded-[3px] border border-ink/30"
            >
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-0.5 w-5 bg-ink" />
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
            </nav>
          </Container>
        )}
      </header>
    </>
  );
}
