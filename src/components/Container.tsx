import type { ReactNode } from "react";

/**
 * The single source of truth for horizontal alignment. Every content block on
 * every page wraps in this — same max-width, same gutters — so left/right edges
 * line up across the whole site. Sections provide background + vertical padding
 * only; never their own horizontal padding.
 */
export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full px-4 min-[680px]:px-7 ${className}`}>
      {children}
    </div>
  );
}
