"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * The site's arrival: every page fades up rather than snapping in.
 *
 * Keyed on the pathname, so it replays on client-side navigation too — without
 * the key React reuses the wrapper and the animation runs exactly once, on the
 * first page you happen to land on, which is the version of this that always
 * looks broken after the second click.
 *
 * OPACITY ONLY, deliberately. A transform on a wrapper this high up makes it
 * the containing block for every position:fixed descendant, so anything pinned
 * inside a page (the reports' VersionSwitch, for one) would jump out of place
 * for the length of the animation and then snap back. The rise comes from
 * <Reveal> on the individual blocks instead, which is also what staggers them.
 */
export function PageIn({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="fa-page-in">
      {children}
    </div>
  );
}
