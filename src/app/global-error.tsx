"use client";

import { useEffect } from "react";

/**
 * The last resort: the boundary for errors thrown by the root layout itself.
 *
 * When this renders, the root layout is the thing that failed, so nothing it
 * normally provides exists — no fonts, no globals.css, no tokens.css, no nav
 * script, no footer. That is why this file replaces the whole document, <html>
 * and <body> included, and why it is the one component in the repo allowed to
 * write literal colours: there is no token to reference. The values below are
 * copied from futures-atlas-core's defaults (--fa-bone / --fa-ink and their dark
 * twins, plus the brand blue) so the page still reads as this site. If those
 * defaults are ever re-picked, re-copy them here; nothing links the two.
 *
 * Theme follows the same rule as the root layout: dark unless the reader has
 * explicitly chosen light, which is stored under `fa-theme`. The inline script
 * applies it before paint, so a light-mode reader never gets a dark flash on the
 * way to an error page. <html> carries suppressHydrationWarning for it.
 *
 * As in (atlas)/error.tsx, the error text goes to the console and not to the
 * page: it can carry internal detail, and here it would be the only thing on
 * screen anyone could read.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Futures Atlas failed to render:", error);
  }, [error]);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="robots" content="noindex" />
        <style
          dangerouslySetInnerHTML={{
            __html: `
:root {
  --ge-bg: #17181b;
  --ge-text: #f2ede2;
  --ge-body: #d3ccbe;
  --ge-muted: #9da0a8;
  --ge-line: rgba(242, 237, 226, 0.25);
  --ge-accent: oklch(0.565 0.13 245);
  --ge-accent-press: oklch(0.475 0.13 245);
  --ge-paper: #f4efe4;
  color-scheme: dark;
}
:root.fa-light {
  --ge-bg: #f4efe4;
  --ge-text: #17181b;
  --ge-body: #303237;
  --ge-muted: #63666c;
  --ge-line: rgba(23, 24, 27, 0.25);
  color-scheme: light;
}
* { box-sizing: border-box; }
html, body { margin: 0; background: var(--ge-bg); }
body {
  min-height: 100vh;
  display: flex;
  align-items: center;
  color: var(--ge-body);
  font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
  -webkit-font-smoothing: antialiased;
}
.ge-wrap { width: 100%; margin: 0 auto; padding: clamp(56px, 10vw, 120px) 28px; }
.ge-eyebrow {
  margin: 0 0 24px;
  font-family: ui-monospace, "SF Mono", Menlo, monospace;
  font-size: 0.7rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ge-accent);
}
.ge-title {
  margin: 0;
  max-width: 18ch;
  font-size: clamp(34px, 5.2vw, 72px);
  font-weight: 800;
  line-height: 0.98;
  letter-spacing: -0.024em;
  color: var(--ge-text);
  text-wrap: balance;
}
.ge-body { margin: 28px 0 0; max-width: 560px; font-size: clamp(13px, 1.4vw, 16px); line-height: 1.75; }
.ge-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 40px; }
.ge-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  border: 1.5px solid transparent;
  border-radius: 2px;
  padding: 14px 22px;
  font-family: ui-monospace, "SF Mono", Menlo, monospace;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.18s ease, border-color 0.18s ease;
}
.ge-btn--primary { background: var(--ge-accent); color: var(--ge-paper); }
.ge-btn--primary:hover { background: var(--ge-accent-press); }
.ge-btn--ghost { background: transparent; color: var(--ge-text); border-color: var(--ge-line); }
.ge-btn--ghost:hover { border-color: var(--ge-text); }
.ge-ref {
  margin: 36px 0 0;
  font-family: ui-monospace, "SF Mono", Menlo, monospace;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--ge-muted);
}
@media (prefers-reduced-motion: reduce) {
  * { transition-duration: 0.001ms !important; }
}
`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(localStorage.getItem('fa-theme')==='light'){document.documentElement.classList.add('fa-light');}}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <div className="ge-wrap">
          <p className="ge-eyebrow">Error</p>
          <h1 className="ge-title">The site didn&rsquo;t load</h1>
          <p className="ge-body">
            Something went wrong before the page could be built. Loading it again
            often works.
          </p>
          <div className="ge-actions">
            <button type="button" onClick={reset} className="ge-btn ge-btn--primary">
              Try again
            </button>
            {/* A plain anchor, not next/link: the router lives in the tree that
                just failed, so a client-side navigation would re-enter it. This
                has to be a full document load. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" className="ge-btn ge-btn--ghost">
              Go to the homepage
            </a>
          </div>
          {error.digest && <p className="ge-ref">Reference {error.digest}</p>}
        </div>
      </body>
    </html>
  );
}
