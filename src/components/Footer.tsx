import Link from "next/link";
import { Container } from "./Container";
import { liveProjects } from "@/data/projects";
import { formatPostDate, livePosts } from "@/data/posts";
import { GLOSSARY } from "@/data/glossary";

/**
 * The footer is the sitemap.
 *
 * Everything reachable on this site should be reachable from the bottom of any
 * page, so the columns are generated from the same data the pages are — add a
 * project or publish a post and it appears here, with no second list to keep in
 * step. The only hand-written column is the one describing what the site is.
 *
 * BUILD_DATE is baked at build time (see next.config.ts) so "last updated"
 * means the current deployment, not the viewer's clock.
 */

const SECTIONS = [
  { href: "/", label: "Home" },
  { href: "/feed", label: "Feed" },
  { href: "/projects", label: "Projects" },
  { href: "/glossary", label: "Glossary" },
  { href: "/design-system", label: "Design system" },
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
const navLink =
  "font-mono text-[12px] leading-[1.55] text-paper/70 transition-colors hover:text-paper";

export function Footer() {
  const updated = buildDate();
  const recent = livePosts.slice(0, 6);
  const projects = liveProjects.filter((p) => p.path || p.url).slice(0, 12);

  return (
    <footer className="bg-band pb-10 pt-[clamp(48px,7vw,96px)] text-paper">
      <Container>
        {/* brand + the four link columns */}
        <div className="grid grid-cols-1 gap-x-[clamp(24px,3.4vw,56px)] gap-y-[clamp(32px,4vw,48px)] sm:grid-cols-2 lg:grid-cols-[1.5fr_0.9fr_1.1fr_1.6fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5 text-paper">
              {/* the header's brand lockup, mark inverted for the dark band */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/fa.svg" alt="" aria-hidden="true" className="block h-5 w-auto invert" />
              <span className="text-[19px] font-medium tracking-[-0.01em]">Futures Atlas</span>
            </Link>
            <p className={colBody}>
              Speculative-design projects, open-source tools and research on
              quantum computing, emerging AI, and the organisations driving
              them.{" "}
              <span className="text-paper">It&rsquo;s meant to be used.</span>
            </p>
            <p className="mt-4 font-mono text-[12.5px] text-paper/72">
              <a
                href="https://github.com/ether-hill"
                target="_blank"
                rel="noopener"
                className={colLink}
              >
                GitHub ↗
              </a>{" "}
              · <Link href="/about" className={colLink}>License</Link> ·{" "}
              <Link href="/contact" className={colLink}>Contact</Link>
            </p>
          </div>

          <nav aria-label="Sections">
            <p className={colHead}>Sections</p>
            <ul className="mt-4 flex flex-col gap-2.5">
              {SECTIONS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={navLink}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-5 font-mono text-[11px] leading-[1.6] text-paper/45">
              {GLOSSARY.length} terms in the glossary
            </p>
          </nav>

          <nav aria-label="Projects">
            <p className={colHead}>Projects</p>
            <ul className="mt-4 flex flex-col gap-2.5">
              {projects.map((p) => (
                <li key={p.id}>
                  {p.path ? (
                    <Link href={p.path} className={navLink}>
                      {p.title}
                    </Link>
                  ) : (
                    <a href={p.url} target="_blank" rel="noopener" className={navLink}>
                      {p.title} ↗
                    </a>
                  )}
                </li>
              ))}
            </ul>
            <Link
              href="/projects"
              className="mt-4 inline-block font-mono text-[11px] uppercase tracking-[0.14em] text-paper/55 hover:text-paper"
            >
              All projects →
            </Link>
          </nav>

          <div>
            <p className={colHead}>Recent from the feed</p>
            <ul className="mt-4 flex flex-col gap-3.5">
              {recent.map((p) => (
                <li key={p.slug}>
                  <Link href={`/feed/${p.slug}`} className="group block">
                    <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-paper/40">
                      {formatPostDate(p.posted)} · {p.topics[0]}
                    </span>
                    <span className="mt-0.5 block text-[13px] font-medium leading-[1.4] text-paper/80 transition-colors group-hover:text-paper">
                      {p.title}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/feed"
              className="mt-4 inline-block font-mono text-[11px] uppercase tracking-[0.14em] text-paper/55 hover:text-paper"
            >
              The whole feed →
            </Link>
          </div>
        </div>

        {/* the two prose columns that used to sit in the grid */}
        <div className="mt-[clamp(32px,4.5vw,56px)] grid gap-x-[clamp(24px,3.4vw,56px)] gap-y-8 border-t border-paper/15 pt-[clamp(28px,4vw,44px)] sm:grid-cols-2">
          <div>
            <p className={colHead}>Use the work</p>
            <p className={colBody}>
              Open by default. Fork it, adapt it, wire it into your own work.
              Attribution appreciated, permission not required. Research is
              free to cite and every source is linked. The{" "}
              <Link href="/design-system" className={colLink}>design system</Link> and the{" "}
              <Link href="/glossary" className={colLink}>glossary</Link> are part of that —
              take them.
            </p>
          </div>
          <div>
            <p className={colHead}>Get in touch</p>
            <p className={colBody}>
              Used something from the Atlas in a workshop, a project or a
              classroom? We&rsquo;d like to hear how it went. Collaboration
              inquiries welcome.
            </p>
            <p className="mt-3 font-mono text-[12.5px]">
              <Link href="/contact" className={colLink}>
                Contact form →
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-[clamp(32px,5vw,56px)] flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3 border-t border-paper/22 pt-6">
          <span className="font-mono text-[11px] leading-[1.7] text-paper/55">
            © 2026 Futures Atlas · A living project. Things change, break and
            improve.{updated ? ` Last updated ${updated}.` : ""}
          </span>
          <span className="font-mono text-[11px] leading-[1.7] text-paper/55">
            Built with Next.js, Claude Code and an evolving stack.{" "}
            <Link href="/about#stack" className={colLink}>
              see the full inventory →
            </Link>
          </span>
        </div>
      </Container>
    </footer>
  );
}
