import type { Mapping } from "../types.ts";
import { compute } from "./compute.ts";
import { investment } from "./investment.ts";

/**
 * The registry. Adding a mapping = write a module fulfilling the `Mapping`
 * contract (usually: extend scripts/harvest.mjs to emit its snapshot, then a
 * small .ts wrapper like compute.ts) and list it here. Everything else — the
 * switcher, the URL, the widgets — picks it up.
 */
export const MAPPINGS: Mapping[] = [compute, investment];

export const bySlug = (slug: string): Mapping | undefined =>
  MAPPINGS.find((m) => m.slug === slug);
