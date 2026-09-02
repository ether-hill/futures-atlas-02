"use client";

/**
 * Drag a tile to a new place in the grid.
 *
 * This page used HTML5 drag-and-drop once and it was pulled out for arrow
 * buttons, for real reasons: the drop target depended on where inside a tile
 * you happened to grab, and the browser's own drag image sat on top of the
 * thing you were aiming at. Both are properties of that API rather than of
 * dragging, so this is pointer events instead and each one goes away.
 *
 *  · The target is the slot whose CENTRE is nearest the pointer. Where inside
 *    the tile you grabbed it stops mattering.
 *  · Nothing is cloned. The tile itself lifts and follows your hand, and the
 *    rest of the grid slides out of the way, so the arrangement under the
 *    pointer is already the arrangement you are going to get.
 *  · A press has to travel four pixels before it counts as a drag.
 *  · The lifted tile flies to its slot on release rather than teleporting.
 *  · Dragging near the top or bottom of the window scrolls the page, so a tile
 *    can reach a row that is off-screen.
 *  · Escape cancels mid-drag and everything goes home.
 *
 * The arrow buttons stay. They are the keyboard path, and a drag is not.
 *
 * The drag runs off refs and writes transforms straight to the DOM. Routing
 * pointermove through React state would re-render every tile in the grid sixty
 * times a second, and each tile here renders a whole slide.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

/** How far a press must travel before it is a drag and not a press. */
const THRESHOLD = 4;
/** Distance from the window edge where the page starts scrolling itself. */
const EDGE = 90;
/** Auto-scroll speed at the very edge, px per frame. */
const EDGE_SPEED = 16;
/** How long the lifted tile takes to land. */
const SETTLE_MS = 180;

const EASE = "cubic-bezier(.2,.7,.3,1)";

interface Run {
  from: number;
  over: number;
  /** Every slot's box in DOCUMENT coordinates, frozen at drag start. The page
   *  can scroll under the drag, so viewport coordinates would go stale. */
  slots: { left: number; top: number; cx: number; cy: number }[];
  startX: number;
  startY: number;
  clientX: number;
  clientY: number;
  started: boolean;
  raf: number;
}

export interface Sortable {
  /** Ref for tile i's outer element, the one that occupies the grid slot. */
  register: (i: number) => (el: HTMLDivElement | null) => void;
  /** Pointer-down handler for tile i's drag surface. */
  handle: (i: number) => (e: React.PointerEvent) => void;
  /** The lifted tile's index, or null when nothing is being dragged. */
  dragging: number | null;
}

function move<T>(list: T[], from: number, to: number): T[] {
  const out = [...list];
  const [x] = out.splice(from, 1);
  out.splice(to, 0, x!);
  return out;
}

/** Where tile `i` sits while `from` is being held over `over`. */
function displayIndex(i: number, from: number, over: number): number {
  if (i === from) return over;
  if (from < over && i > from && i <= over) return i - 1;
  if (over < from && i >= over && i < from) return i + 1;
  return i;
}

export function useSortableGrid({
  ids,
  onCommit,
  enabled,
}: {
  /** Ids in the order they are currently displayed. */
  ids: string[];
  /** Called once, on drop, with the whole new order. */
  onCommit: (order: string[]) => void;
  /** Drag only while this is true. */
  enabled: boolean;
}): Sortable {
  const els = useRef<(HTMLDivElement | null)[]>([]);
  const [dragging, setDragging] = useState<number | null>(null);

  // The handlers outlive the render that made them, so they read these rather
  // than closing over a value that is one drag out of date.
  const idsRef = useRef(ids);
  idsRef.current = ids;
  const commitRef = useRef(onCommit);
  commitRef.current = onCommit;

  const run = useRef<Run | null>(null);
  /** True while a dropped tile is still flying to its slot. */
  const settling = useRef(false);

  const clearAll = useCallback(() => {
    for (const el of els.current) {
      if (!el) continue;
      el.style.transform = "";
      el.style.transition = "";
      el.style.willChange = "";
    }
  }, []);

  /** Put every tile except the held one where it belongs right now. */
  const layout = useCallback((from: number, over: number, slots: Run["slots"]) => {
    for (let i = 0; i < slots.length; i++) {
      if (i === from) continue;
      const el = els.current[i];
      if (!el) continue;
      const d = displayIndex(i, from, over);
      const dx = slots[d]!.left - slots[i]!.left;
      const dy = slots[d]!.top - slots[i]!.top;
      el.style.transform = dx || dy ? `translate3d(${dx}px, ${dy}px, 0)` : "";
    }
  }, []);

  // One live drag at a time, so the listeners live here and are torn down by
  // whatever ends it: a drop, a cancelled pointer, Escape, or unmounting.
  const teardown = useRef<(() => void) | null>(null);

  const finish = useCallback(
    (commit: boolean) => {
      const r = run.current;
      if (!r) return;
      run.current = null;
      cancelAnimationFrame(r.raf);
      teardown.current?.();
      teardown.current = null;

      // Never passed the threshold: it was a press, not a drag.
      if (!r.started) {
        setDragging(null);
        clearAll();
        return;
      }

      const to = commit ? r.over : r.from;
      const order = commit && r.over !== r.from ? move(idsRef.current, r.from, r.over) : null;

      const land = () => {
        settling.current = false;
        // flushSync so React has already put the tiles in their new order by
        // the time the transforms come off. Do it the other way round and the
        // old arrangement shows for a frame.
        flushSync(() => {
          if (order) commitRef.current(order);
          setDragging(null);
        });
        clearAll();
      };

      const el = els.current[r.from];
      if (!el) {
        land();
        return;
      }

      settling.current = true;
      if (!commit) layout(r.from, r.from, r.slots);
      el.style.transition = `transform ${SETTLE_MS}ms ${EASE}`;
      const dx = r.slots[to]!.left - r.slots[r.from]!.left;
      const dy = r.slots[to]!.top - r.slots[r.from]!.top;
      el.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
      window.setTimeout(land, SETTLE_MS);
    },
    [clearAll, layout],
  );

  const tick = useCallback(() => {
    const r = run.current;
    if (!r) return;

    // Reach for a row that is off the bottom of the window by pushing into the
    // edge, the way a long selection scrolls.
    const h = window.innerHeight;
    if (r.clientY < EDGE) window.scrollBy(0, -EDGE_SPEED * (1 - r.clientY / EDGE));
    else if (r.clientY > h - EDGE) window.scrollBy(0, EDGE_SPEED * (1 - (h - r.clientY) / EDGE));

    const x = r.clientX + window.scrollX;
    const y = r.clientY + window.scrollY;

    if (!r.started) {
      if (Math.abs(x - r.startX) < THRESHOLD && Math.abs(y - r.startY) < THRESHOLD) {
        r.raf = requestAnimationFrame(tick);
        return;
      }
      r.started = true;
      setDragging(r.from);
      for (let i = 0; i < r.slots.length; i++) {
        const el = els.current[i];
        if (!el) continue;
        el.style.willChange = "transform";
        el.style.transition = i === r.from ? "none" : `transform 180ms ${EASE}`;
      }
    }

    // Nearest slot centre. Not "the slot the pointer is inside", which leaves
    // the gutters dead and makes the last slot in a row hard to hit.
    let best = r.over;
    let bestD = Infinity;
    for (let i = 0; i < r.slots.length; i++) {
      const s = r.slots[i]!;
      const d = (s.cx - x) ** 2 + (s.cy - y) ** 2;
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    if (best !== r.over) {
      r.over = best;
      layout(r.from, r.over, r.slots);
    }

    const el = els.current[r.from];
    if (el) {
      el.style.transform =
        `translate3d(${x - r.startX}px, ${y - r.startY}px, 0) scale(1.04)`;
    }

    r.raf = requestAnimationFrame(tick);
  }, [layout]);

  const handle = useCallback(
    (i: number) => (e: React.PointerEvent) => {
      // Left button or touch only, and not while the last drop is still landing.
      if (!enabled || e.button !== 0 || run.current || settling.current) return;

      const n = idsRef.current.length;
      const slots: Run["slots"] = [];
      for (let k = 0; k < n; k++) {
        const el = els.current[k];
        if (!el) return; // a tile has not mounted yet; leave the press alone
        const b = el.getBoundingClientRect();
        slots.push({
          left: b.left + window.scrollX,
          top: b.top + window.scrollY,
          cx: b.left + b.width / 2 + window.scrollX,
          cy: b.top + b.height / 2 + window.scrollY,
        });
      }

      e.preventDefault();
      run.current = {
        from: i,
        over: i,
        slots,
        startX: e.clientX + window.scrollX,
        startY: e.clientY + window.scrollY,
        clientX: e.clientX,
        clientY: e.clientY,
        started: false,
        raf: requestAnimationFrame(tick),
      };

      const onMove = (ev: PointerEvent) => {
        const r = run.current;
        if (!r) return;
        r.clientX = ev.clientX;
        r.clientY = ev.clientY;
      };
      const onUp = () => finish(true);
      const onCancel = () => finish(false);
      const onKey = (ev: KeyboardEvent) => {
        if (ev.key === "Escape") finish(false);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onCancel);
      window.addEventListener("keydown", onKey);
      teardown.current = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onCancel);
        window.removeEventListener("keydown", onKey);
      };
    },
    [enabled, finish, tick],
  );

  // Leaving edit mode, or unmounting, mid-drag.
  useEffect(() => {
    if (!enabled && run.current) finish(false);
  }, [enabled, finish]);

  useEffect(
    () => () => {
      if (run.current) cancelAnimationFrame(run.current.raf);
      teardown.current?.();
    },
    [],
  );

  const register = useCallback(
    (i: number) => (el: HTMLDivElement | null) => {
      els.current[i] = el;
    },
    [],
  );

  return { register, handle, dragging };
}
