import Link from "next/link";
import { Container } from "@/components/Container";
import { SwSubNav } from "@/components/standing-waves/SwSubNav";
import { SW_BASE, SW_TITLE } from "@/data/standing-waves/meta";
import { assertIntegrity } from "@/lib/standing-waves/integrity";
import "./standing-waves.css";

/**
 * Standing Waves — cymatics and quantum mechanics: the shared maths, the
 * walking droplets, and where the analogy breaks.
 *
 * Draft. `visibility: "draft"` in src/data/projects.ts gates this URL and
 * everything under it, mirrored in public/atlas-nav.js.
 *
 * The integrity check runs here, so every page of the project fails loudly
 * (and the build fails) if any record points at an id that is not there.
 */
export default function StandingWavesLayout({ children }: { children: React.ReactNode }) {
  assertIntegrity();
  return (
    <div className="sw">
      <Container>
        <div className="flex flex-wrap items-center justify-between gap-x-6 pt-4">
          <Link href={SW_BASE} className="sw-focus inline-flex min-h-[44px] items-center font-mono text-[11px] uppercase tracking-[0.16em] text-ink">
            {SW_TITLE}
          </Link>
          <Link href="/projects" className="sw-focus inline-flex min-h-[44px] items-center font-mono text-[11px] uppercase tracking-[0.14em] text-graphite hover:text-ink">
            ← All projects
          </Link>
        </div>
        <SwSubNav />
      </Container>
      {children}
    </div>
  );
}
