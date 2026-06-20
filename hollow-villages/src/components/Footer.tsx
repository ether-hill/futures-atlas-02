"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Container } from "./Container";

const links = [
  { href: "/", label: "Home" },
  { href: "/research", label: "Research" },
  { href: "/oracle", label: "Consult" },
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
            <p className="max-w-[15ch] text-[clamp(34px,6vw,96px)] font-extrabold leading-[0.96] tracking-[-0.028em] text-paper text-balance">
              Forecasts you can check.
            </p>
            <p className="mt-[22px] max-w-[620px] font-mono text-[14px] leading-[1.7] text-paper/78">
              Every scheme, statistic and case the oracle points to is real and
              sourced. The future it draws has already happened somewhere — it
              just hasn&rsquo;t reached your village yet.
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
            THE HOLLOW VILLAGES
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
            {home ? "Speculative forecast · MMXXVI" : "The oracle reads what is real · MMXXVI"}
          </span>
        </div>
      </Container>
    </footer>
  );
}
