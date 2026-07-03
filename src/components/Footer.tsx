import Link from "next/link";
import { Container } from "./Container";

/**
 * The hub footer, per the footer spec: four columns (brand / explore /
 * use-the-work / contact) over a bottom bar with the living-project line and
 * a stack pointer into /about#stack. BUILD_DATE is baked at build time (see
 * next.config.ts) so "last updated" means the current deployment, not the
 * viewer's clock.
 */

const EXPLORE = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

function buildDate(): string {
  const iso = process.env.NEXT_PUBLIC_BUILD_DATE ?? "";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  if (!y || !m || !d) return "";
  return `${d} ${months[m - 1]} ${y}`;
}

const colHead = "font-mono text-[11px] uppercase tracking-[0.18em] text-paper/50";
const colBody = "mt-4 font-mono text-[12.5px] leading-[1.75] text-paper/72";
const colLink = "text-paper/85 underline-offset-4 hover:text-paper hover:underline";

export function Footer() {
  const updated = buildDate();

  return (
    <footer className="bg-band pb-10 pt-[clamp(48px,7vw,96px)] text-paper">
      <Container>
        <div className="grid grid-cols-1 gap-x-[clamp(28px,4vw,64px)] gap-y-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_0.7fr_1.3fr_1fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5 text-paper">
              {/* the header's brand lockup — mark inverted for the dark band */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/fa.svg" alt="" aria-hidden="true" className="block h-5 w-auto invert" />
              <span className="text-[19px] font-medium tracking-[-0.01em]">Futures Atlas</span>
            </Link>
            <p className={colBody}>
              A growing collection of speculative-design projects — prototypes,
              open-source tools, and research on quantum computing, emerging
              AI, and the organisations driving them.{" "}
              <span className="text-paper">It&rsquo;s meant to be used.</span>
            </p>
          </div>

          <div>
            <p className={colHead}>Explore</p>
            <nav className="mt-4 flex flex-col gap-2.5">
              {EXPLORE.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  className="font-mono text-[12.5px] uppercase tracking-[0.1em] text-paper/72 hover:text-paper"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <p className={colHead}>Use the work</p>
            <p className={colBody}>
              Open by default. Prototypes and tools are published with
              copyable, replicatable code unless noted otherwise. Fork them,
              adapt them, wire them into your own workflows — attribution
              appreciated, permission not required. Research is free to cite;
              sources are linked in every piece.
            </p>
            <p className="mt-3 font-mono text-[12.5px] text-paper/72">
              <a
                href="https://github.com/ether-hill"
                target="_blank"
                rel="noopener"
                className={colLink}
              >
                GitHub ↗
              </a>{" "}
              · <Link href="/about" className={colLink}>License</Link>
            </p>
          </div>

          <div>
            <p className={colHead}>Contact</p>
            <p className={colBody}>
              Get in touch. If you&rsquo;ve used something from the Atlas — in
              a workshop, a project, a classroom — we&rsquo;d like to hear how
              it went. Collaboration inquiries welcome.
            </p>
            <p className="mt-3 font-mono text-[12.5px]">
              <Link href="/contact" className={colLink}>
                Contact form →
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-[clamp(36px,5vw,64px)] flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3 border-t border-paper/22 pt-6">
          <span className="font-mono text-[11px] leading-[1.7] text-paper/55">
            © 2026 Futures Atlas · A living project — things change, break,
            and improve.{updated ? ` Last updated ${updated}.` : ""}
          </span>
          <span className="font-mono text-[11px] leading-[1.7] text-paper/55">
            Built with Next.js, Claude Code, and an evolving stack —{" "}
            <Link href="/about#stack" className={colLink}>
              see the full inventory →
            </Link>
          </span>
        </div>
      </Container>
    </footer>
  );
}
