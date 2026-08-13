import type { ReactNode } from "react";
import { Section } from "./Section";

/** Top-level page wrapper. Optional `title`/`eyebrow`/`intro` render a
 *  standard page header (in its own header-rhythm Section); `children` follow. */
export function Page({
  title,
  eyebrow,
  intro,
  children,
}: {
  title?: ReactNode;
  eyebrow?: ReactNode;
  intro?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <>
      {(title || eyebrow || intro) && (
        <Section variant="header">
          <div style={{ maxWidth: "48rem" }}>
            {eyebrow && (
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
                <span className="fa-eyebrow">{eyebrow}</span>
                <span style={{ height: 1, flex: 1, background: "var(--hairline)" }} />
              </div>
            )}
            {title && <h1 className="fa-t-display-l">{title}</h1>}
            {intro && (
              <p className="fa-t-lead" style={{ marginTop: "var(--space-6)", maxWidth: "40ch", color: "var(--text-body)" }}>
                {intro}
              </p>
            )}
          </div>
        </Section>
      )}
      {children}
    </>
  );
}
