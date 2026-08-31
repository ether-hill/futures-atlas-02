import { COLLAB } from "@/content/about";
import { Reveal } from "@/components/Reveal";

/**
 * Who the Atlas is made with. Both marks render in currentColor so they hold
 * up under the runtime theme in either direction:
 *  - QDNL (the Centre for Quantum and Society sits inside Quantum Delta NL):
 *    their own lockup, the counter-shapes filled with the page surface token.
 *  - Frond Studio: their wordmark PNG used as a mask over `bg-current`.
 * Copy lives in content/about.ts; links open in a new tab.
 */

function QdnlMark() {
  return (
    <svg
      viewBox="18 18 210.89 64"
      role="img"
      aria-hidden="true"
      className="h-8 w-auto text-ink/75 transition-colors duration-200 group-hover:text-ink"
    >
      <g fill="currentColor">
        <path d="m127.36 62.37 4.73 6-3.59 2.68-4.82-6.23a16.64 16.64 0 0 1-7.23 1.64c-9.19 0-16.32-7.23-16.32-16.42s7.14-16.42 16.32-16.42 16.37 7.23 16.37 16.42c0 4.96-2.09 9.32-5.46 12.32Zm-10.92-.64c1.5 0 2.86-.23 4.14-.73l-4.96-6.32 3.55-2.68 5.18 6.59c2.09-2.09 3.27-5.09 3.27-8.55 0-6.68-4.5-11.69-11.19-11.69s-11.14 5-11.14 11.69 4.5 11.69 11.14 11.69ZM165.91 50.04c0 9.28-6.73 15.92-16.46 15.92h-10.19V34.13h10.19c9.73 0 16.46 6.64 16.46 15.92Zm-5.18 0c0-6.82-4.27-11.23-11.41-11.23h-5.05v22.46h5.05c7.14 0 11.41-4.41 11.41-11.23M172.32 34.13h4.77l17.28 23.55h.04V34.13h5v31.83h-4.77l-17.23-23.51h-.09v23.51h-5zM228.89 61.28v4.68h-20.78V34.13h5v27.15z" />
        <circle cx="50" cy="50" r="32" />
        <path d="M69.26 75.54c.15-.1.3-.21.44-.33-.15.11-.29.22-.44.33" />
      </g>
      <g fill="var(--c-surface)">
        <path d="M56.57 58.41c9.28-7.25 10.93-20.66 3.68-29.94s-20.66-10.93-29.94-3.68l26.27 33.62Z" />
        <path d="M56.57 58.41c-4.64 3.63-5.47 10.33-1.84 14.97 3.51 4.5 9.91 5.41 14.53 2.17.15-.11.3-.21.44-.33z" />
      </g>
    </svg>
  );
}

function FrondMark() {
  return (
    <span
      aria-hidden="true"
      className="block h-8 w-[60px] bg-current text-ink/75 transition-colors duration-200 group-hover:text-ink"
      style={{
        WebkitMaskImage: "url(/logos/frond-studio.png)",
        maskImage: "url(/logos/frond-studio.png)",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "left center",
        maskPosition: "left center",
        WebkitMaskSize: "contain",
        maskSize: "contain",
      }}
    />
  );
}

const MARKS: Record<string, () => React.ReactElement> = {
  cqs: QdnlMark,
  frond: FrondMark,
};

export function Collaborators() {
  return (
    <div className="grid grid-cols-1 gap-x-[clamp(24px,5vw,80px)] gap-y-8 lg:grid-cols-[1fr_1.6fr]">
      <Reveal>
        <p className="eyebrow tick mb-5">{COLLAB.intro}</p>
        <p className="max-w-[42ch] font-mono text-[13.5px] leading-[1.8] text-ink-70">{COLLAB.body}</p>
      </Reveal>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {COLLAB.partners.map((p, i) => {
          const Mark = MARKS[p.id];
          return (
            <Reveal key={p.id} delay={i * 90}>
              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-full flex-col border border-ink/15 p-6 transition-colors hover:border-ink/45"
              >
                <span className="flex min-h-[32px] items-center">{Mark ? <Mark /> : null}</span>
                <span className="mt-5 block text-[17px] font-extrabold leading-[1.2] tracking-[-0.015em] text-ink">
                  {p.name}
                </span>
                <span className="mt-1.5 block font-mono text-[11px] uppercase tracking-[0.14em] text-ink/45">
                  {p.org}
                </span>
                <span className="mt-3 block font-mono text-[13px] leading-[1.75] text-ink-70">{p.blurb}</span>
                <span className="mt-4 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-accent-deep">
                  Visit <span aria-hidden="true">↗</span>
                </span>
              </a>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
