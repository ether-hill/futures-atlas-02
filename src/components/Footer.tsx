"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Container } from "./Container";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Footer() {
  const home = usePathname() === "/";

  return (
    <footer
      className={`bg-band text-paper ${
        home ? "pt-[clamp(58px,9vw,130px)] pb-10" : "border-t border-paper/16 pb-10 pt-10"
      }`}
    >
      <Container>
        {home && (
          <>
            <p className="max-w-[18ch] text-[clamp(34px,6vw,96px)] font-extrabold leading-[0.96] tracking-[-0.028em] text-paper text-balance">
              The future is plural.
            </p>
            <p className="mt-[22px] max-w-[620px] font-mono text-[14px] leading-[1.7] text-paper/78">
              Futures Atlas collects speculative-design projects that each draw
              one possible world in full — grounded, specific, and built to be
              argued with.
            </p>
          </>
        )}

        <div
          className={`flex flex-wrap items-center justify-between gap-5 ${
            home ? "mt-[clamp(44px,8vw,90px)] border-t border-paper/22 pt-7" : ""
          }`}
        >
          <span
            className="text-[15px] font-extrabold tracking-[0.02em] text-paper"
            style={{ fontFamily: "var(--font-archivo)" }}
          >
            FUTURES ATLAS
          </span>
          <nav className="flex flex-wrap gap-[22px]">
            {links.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="font-mono text-[11px] uppercase tracking-[0.14em] text-paper/72 hover:text-paper"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-paper/50">
            A catalogue of possible worlds · MMXXVI
          </span>
        </div>
      </Container>
    </footer>
  );
}
