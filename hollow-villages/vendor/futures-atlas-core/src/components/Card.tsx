import type { ReactNode } from "react";

/** A token-styled card. With `href` it becomes a hover-lit link. */
export function Card({
  children,
  href,
  className = "",
}: {
  children: ReactNode;
  href?: string;
  className?: string;
}) {
  const cls = `fa-card ${href ? "fa-card--link" : ""} ${className}`;
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children}
      </a>
    );
  }
  return <div className={cls}>{children}</div>;
}

export function CardBody({ children }: { children: ReactNode }) {
  return <div className="fa-card__body">{children}</div>;
}
