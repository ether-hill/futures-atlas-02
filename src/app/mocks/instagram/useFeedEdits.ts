"use client";

/**
 * The feed's arrangement: what order the grid is in, what is deleted, and how
 * each thumbnail is cropped.
 *
 * The posts in `fields.ts` and `posts.ts` are the source. This layer sits on
 * top and records what was changed by hand, because guessing crops from the
 * other side of a screenshot does not work — the framing of a still from a
 * running piece is a judgement call, and it should be made by the person
 * looking at it.
 *
 * It is SHARED, not per-browser. It began in localStorage and that was wrong:
 * two editors arranging the same feed saw two different feeds, and an
 * arrangement only one person can see is not an arrangement. The one copy now
 * lives in KV behind /api/mocks/instagram and everyone signed in reads it.
 *
 * localStorage stays for three jobs and no others:
 *  · local dev, where the Development env has no REDIS_URL, so there is no
 *    server store to share and the page keeps working per-browser;
 *  · a fallback when the fetch fails, so an edit is never simply lost;
 *  · the migration. A browser that arranged the feed before this existed still
 *    holds that arrangement. If the shared copy is empty it is seeded from the
 *    local one automatically, and if somebody else got there first the page
 *    says so and offers to publish yours over it.
 */

import { useCallback, useEffect, useRef, useState } from "react";

const KEY = "fa-instagram-edits-v1";
const API = "/api/mocks/instagram";
/** How long after the last change the shared copy is written. */
const SAVE_MS = 500;

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

/** Where the arrangement on screen came from, for the bar to say out loud. */
export type SyncState =
  /** No server store (local dev). This browser only, as it always was. */
  | { kind: "local" }
  | { kind: "loading" }
  /** The shared copy, and who last wrote it. */
  | { kind: "shared"; by: string | null; at: number | null }
  /** The server is there but did not answer; edits are held locally. */
  | { kind: "offline" };

function coerce(v: unknown): Edits {
  const o = (v ?? {}) as Partial<Edits>;
  return {
    order: Array.isArray(o.order) ? o.order : [],
    hidden: Array.isArray(o.hidden) ? o.hidden : [],
    crops: o.crops && typeof o.crops === "object" ? o.crops : {},
  };
}

function readLocal(): Edits {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? coerce(JSON.parse(raw)) : EMPTY;
  } catch {
    // A private window, cleared site data, or a browser blocking storage.
    return EMPTY;
  }
}

function writeLocal(e: Edits) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(e));
  } catch {
    /* storage unavailable; the edits still work for this session */
  }
}

const isEmpty = (e: Edits) =>
  !e.order.length && !e.hidden.length && !Object.keys(e.crops).length;

const same = (a: Edits, b: Edits) => JSON.stringify(a) === JSON.stringify(b);

export function useFeedEdits() {
  // Always start from EMPTY so the server and the first client render agree;
  // the stored edits arrive in an effect. Reading localStorage during render is
  // a hydration mismatch waiting to happen.
  const [edits, setEdits] = useState<Edits>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [sync, setSync] = useState<SyncState>({ kind: "loading" });
  /** This browser's own older arrangement, when it is not the shared one. */
  const [stranded, setStranded] = useState<Edits | null>(null);

  /** Set by every action, so merely LOADING the shared copy never writes it
   *  back and stamps whoever opened the page as its last author. */
  const dirty = useRef(false);

  const push = useCallback(async (e: Edits) => {
    try {
      const r = await fetch(API, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ edits: e }),
      });
      const j = await r.json();
      if (j?.ok && j.record) {
        setSync({ kind: "shared", by: j.record.by ?? null, at: j.record.at ?? null });
        setStranded(null);
        return true;
      }
    } catch {
      /* fall through */
    }
    setSync({ kind: "offline" });
    return false;
  }, []);

  useEffect(() => {
    let alive = true;
    const local = readLocal();

    (async () => {
      try {
        const r = await fetch(API, { cache: "no-store" });
        const j = await r.json();
        if (!alive) return;

        if (!j?.configured) {
          setEdits(local);
          setSync({ kind: "local" });
          setLoaded(true);
          return;
        }

        if (j.record) {
          const shared = coerce(j.record.state);
          setEdits(shared);
          setSync({ kind: "shared", by: j.record.by ?? null, at: j.record.at ?? null });
          setLoaded(true);
          // Somebody got here first with a different arrangement. Say so rather
          // than silently discarding what this browser was holding.
          if (!isEmpty(local) && !same(local, shared)) setStranded(local);
          return;
        }

        // Nothing shared yet, so this browser's arrangement becomes it. That is
        // the migration: whoever opens the page first with edits publishes them.
        setEdits(local);
        setLoaded(true);
        if (isEmpty(local)) setSync({ kind: "shared", by: null, at: null });
        else await push(local);
      } catch {
        if (!alive) return;
        setEdits(local);
        setSync({ kind: "offline" });
        setLoaded(true);
      }
    })();

    return () => {
      alive = false;
    };
  }, [push]);

  // Every change: this browser immediately, the shared copy on a short debounce
  // so dragging a tile across the grid is one write and not thirty.
  useEffect(() => {
    if (!loaded) return;
    writeLocal(edits);
    if (!dirty.current) return;
    dirty.current = false;
    if (sync.kind === "local") return;
    const t = window.setTimeout(() => void push(edits), SAVE_MS);
    return () => window.clearTimeout(t);
  }, [edits, loaded, sync.kind, push]);

  // Coming back to the tab picks up what the other person did while you were
  // away, so the two screens agree without a reload.
  const at = sync.kind === "shared" ? sync.at : null;
  const atRef = useRef<number | null>(at);
  atRef.current = at;

  useEffect(() => {
    if (sync.kind === "local") return;
    const refresh = async () => {
      if (document.hidden || dirty.current) return;
      try {
        const j = await (await fetch(API, { cache: "no-store" })).json();
        if (!j?.record) return;
        const next = j.record.at ?? null;
        // Only take a copy that is actually newer than the one on screen.
        if (atRef.current && next && next <= atRef.current) return;
        setEdits(coerce(j.record.state));
        setSync({ kind: "shared", by: j.record.by ?? null, at: next });
      } catch {
        /* leave what is on screen alone */
      }
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [sync.kind]);

  const mutate = useCallback((fn: (e: Edits) => Edits) => {
    dirty.current = true;
    setEdits(fn);
  }, []);

  const hide = useCallback((id: string) => {
    mutate((e) => ({ ...e, hidden: [...new Set([...e.hidden, id])] }));
  }, [mutate]);

  const restoreAll = useCallback(() => {
    mutate((e) => ({ ...e, hidden: [] }));
  }, [mutate]);

  /**
   * Put the feed in an explicit order. A drag knows exactly where every post
   * ended up, so it commits the whole list at once rather than replaying steps.
   */
  const reorder = useCallback((order: string[]) => {
    mutate((e) => ({ ...e, order }));
  }, [mutate]);

  /**
   * Step a post one place earlier or later. A plain swap with its neighbour,
   * which is the only reorder that is unambiguous to press and to undo — the
   * earlier "insert before X" needed a target and got fiddly at the ends. This
   * is the keyboard path now that dragging exists.
   */
  const step = useCallback((id: string, dir: -1 | 1, all: string[]) => {
    mutate((e) => {
      const base = e.order.length ? e.order.filter((x) => all.includes(x)) : all;
      const full = [...base, ...all.filter((x) => !base.includes(x))];
      const from = full.indexOf(id);
      const to = from + dir;
      if (from < 0 || to < 0 || to >= full.length) return e;
      [full[from], full[to]] = [full[to]!, full[from]!];
      return { ...e, order: full };
    });
  }, [mutate]);

  const setCrop = useCallback((id: string, patch: Partial<Crop>) => {
    mutate((e) => ({
      ...e,
      crops: { ...e.crops, [id]: { ...DEFAULT_CROP, ...e.crops[id], ...patch } },
    }));
  }, [mutate]);

  const resetCrop = useCallback((id: string) => {
    mutate((e) => {
      const crops = { ...e.crops };
      delete crops[id];
      return { ...e, crops };
    });
  }, [mutate]);

  const resetAll = useCallback(() => mutate(() => EMPTY), [mutate]);

  /** Publish this browser's stranded arrangement over the shared one. */
  const publishStranded = useCallback(() => {
    if (!stranded) return;
    dirty.current = false;
    setEdits(stranded);
    void push(stranded);
  }, [stranded, push]);

  /** Keep the shared arrangement and stop being asked about the local one. */
  const discardStranded = useCallback(() => setStranded(null), []);

  return {
    edits, loaded, sync, stranded: stranded !== null,
    hide, restoreAll, reorder, step, setCrop, resetCrop, resetAll,
    publishStranded, discardStranded,
  };
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
