import type { Rec } from "../types.ts";

/** Shape of the committed JSON snapshots written by scripts/harvest.mjs. */
export type Snapshot = {
  retrieved: string;
  sourceUrl: string;
  meta: Record<string, number>;
  records: Rec[];
};
