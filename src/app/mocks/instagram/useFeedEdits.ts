"use client";

/**
 * Your edits to the feed, kept in the browser.
 *
 * The posts in `fields.ts` and `posts.ts` are the source. This layer sits on top
 * and records what YOU changed: what order the grid is in, what you deleted, and
 * how each thumbnail is cropped. It exists because guessing crops from the other
 * side of a screenshot does not work — the framing of a still from a running
 * piece is a judgement call, and it should be made by the person looking at it.
 *
 * Everything lives in localStorage under one key, so it survives a reload and
 * never touches the repo. Reset puts it back to the authored order.
 */

import { useCallback, useEffect, useState } from "react";

const KEY = "fa-instagram-edits-v1";

export interface Crop {
  /** Scale, 1 = fit. */
  zoom: number;
  /** Pan, as a share of the frame: -0.5 … 0.5. */
  x: number;
  y: number;
}

export interface Edits {
  /** Post ids, in the order you put them. Ids not listed keep authored order. */
  order: string[];
  hidden: string[];
  crops: Record<string, Crop>;
}

export const EMPTY: Edits = { order: [], hidden: [], crops: {} };
export const DEFAULT_CROP: Crop = { zoom: 1, x: 0, y: 0 };

function read(): Edits {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const v = JSON.parse(raw) as Partial<Edits>;
    return {
      order: Array.isArray(v.order) ? v.order : [],
      hidden: Array.isArray(v.hidden) ? v.hidden : [],
      crops: v.crops && typeof v.crops === "object" ? v.crops : {},
    };
  } catch {
    // A private window, cleared site data, or a browser blocking storage.
    return EMPTY;
  }
}

export function useFeedEdits() {
  // Always start from EMPTY so the server and the first client render agree;
  // the stored edits are applied in an effect. Reading localStorage during
  // render is a hydration mismatch waiting to happen.
  const [edits, setEdits] = useState<Edits>(EMPTY);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setEdits(read());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(edits));
    } catch {
      /* storage unavailable; the edits still work for this session */
    }
  }, [edits, loaded]);

  const hide = useCallback((id: string) => {
    setEdits((e) => ({ ...e, hidden: [...new Set([...e.hidden, id])] }));
  }, []);

  const restoreAll = useCallback(() => {
    setEdits((e) => ({ ...e, hidden: [] }));
  }, []);

/**
   * Step a post one place earlier or later. A plain swap with its neighbour,
   * which is the only reorder that is unambiguous to press and to undo — the
   * earlier "insert before X" needed a target and got fiddly at the ends.
   */
  const step = useCallback((id: string, dir: -1 | 1, all: string[]) => {
    setEdits((e) => {
      const base = e.order.length ? e.order.filter((x) => all.includes(x)) : all;
      const full = [...base, ...all.filter((x) => !base.includes(x))];
      const from = full.indexOf(id);
      const to = from + dir;
      if (from < 0 || to < 0 || to >= full.length) return e;
      [full[from], full[to]] = [full[to]!, full[from]!];
      return { ...e, order: full };
    });
  }, []);

  const setCrop = useCallback((id: string, patch: Partial<Crop>) => {
    setEdits((e) => ({
      ...e,
      crops: { ...e.crops, [id]: { ...DEFAULT_CROP, ...e.crops[id], ...patch } },
    }));
  }, []);

  const resetCrop = useCallback((id: string) => {
    setEdits((e) => {
      const crops = { ...e.crops };
      delete crops[id];
      return { ...e, crops };
    });
  }, []);

  const resetAll = useCallback(() => setEdits(EMPTY), []);

  return { edits, loaded, hide, restoreAll, step, setCrop, resetCrop, resetAll };
}

/** Apply the stored order and deletions to the authored list. */
export function applyEdits<T>(items: T[], idOf: (t: T) => string, edits: Edits): T[] {
  const visible = items.filter((t) => !edits.hidden.includes(idOf(t)));
  if (!edits.order.length) return visible;
  const rank = new Map(edits.order.map((id, i) => [id, i]));
  return [...visible].sort(
    (a, b) => (rank.get(idOf(a)) ?? 1e6) - (rank.get(idOf(b)) ?? 1e6),
  );
}
