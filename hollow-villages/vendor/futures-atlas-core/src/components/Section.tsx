import type { ReactNode } from "react";
import { Container } from "./Container";

/** A full-bleed vertical-rhythm band. Wraps children in a Container unless
 *  `bleed` is set. Variants: default | header (tighter) | band (dark feature). */
export function Section({
  children,
  id,
  variant = "default",
  bleed = false,
  className = "",
}: {
  children: ReactNode;
  id?: string;
  variant?: "default" | "header" | "band";
  bleed?: boolean;
  className?: string;
}) {
  const cls = [
    "fa-section",
    variant === "header" ? "fa-section--header" : "",
    variant === "band" ? "fa-section--band" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section id={id} className={cls}>
      {bleed ? children : <Container>{children}</Container>}
    </section>
  );
}
