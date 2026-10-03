"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Container } from "@/components/Container";

/**
 * The error boundary for the Atlas's own pages.
 *
 * It sits inside the (atlas) group rather than at the app root because that is
 * where it actually catches things: an error.tsx handles its own segment and
 * everything below it, and a root-level one would be a sibling of the root
 * layout and so could not use it. Here the group layout stays mounted while this
 * renders, which is what keeps the nav, the page fade and the footer in place —
 * this file supplies the content column only, and must not repeat any of that
 * chrome.
 *
 * The message is deliberately NOT shown. A render error's text is written for
 * whoever is reading the logs and can carry a file path, a query or an upstream
 * response; the console gets it, the visitor gets a sentence and a way out. The
 * digest is safe and is printed, because it is the one thing that lets someone
 * reporting a broken page be matched to the run that broke.
 */
export default function AtlasError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Atlas page failed to render:", error);
  }, [error]);

  return (
    <section className="flex min-h-[58svh] items-center py-[clamp(56px,10vw,120px)]">
      <Container>
        <p className="eyebrow mb-6">Error</p>
        <h1 className="max-w-[18ch] text-[clamp(34px,5.2vw,72px)] font-extrabold leading-[0.98] tracking-[-0.024em] text-ink text-balance">
          This page didn&rsquo;t load
        </h1>
        <p className="mt-7 max-w-[560px] text-[clamp(13px,1.4vw,16px)] leading-[1.75] text-ink-70">
          Something went wrong while building it. Loading it again often works.
          The rest of the site is unaffected.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2.5 rounded-[2px] bg-accent px-[22px] py-3.5 font-mono text-[12px] uppercase tracking-[0.1em] text-paper transition-colors hover:bg-accent-press"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 rounded-[2px] border-[1.5px] border-ink/25 px-[22px] py-3.5 font-mono text-[12px] uppercase tracking-[0.1em] text-ink transition-colors hover:border-ink"
          >
            Go to the homepage <span className="text-[14px]">→</span>
          </Link>
        </div>

        {error.digest && (
          <p className="mt-9 font-mono text-[11px] uppercase tracking-[0.14em] text-ink/45">
            Reference {error.digest}
          </p>
        )}
      </Container>
    </section>
  );
}
