/**
 * Bounded scroll parallax, shared by the overview and the experience view.
 *
 * **The amplitude is the whole design.** The previous version drove each layer
 * from its distance to the viewport centre — `(sectionCentre − viewportCentre)
 * × rate` — so travel scaled with the section: a full-height section at rate
 * 0.22 moved its plate about 400px. At an ordinary trackpad fling that is ~9px
 * of plate movement per frame, so one dropped frame reads as a visible jump.
 * The motion was not slow, it was coarse, and it also outran the plate's own
 * 14% overhang at each extreme.
 *
 * Travel is bounded here instead: `±AMPLITUDE × rate` across the trigger's
 * whole pass through the viewport, whatever its height. That is the figure
 * a portfolio site uses on the same kind of plate (±120 × 0.08–0.12, so ~24px
 * of drift), and it is the reason that page glides where this one stepped.
 * Depth then comes from the slow push-in on `scale` rather than from distance
 * travelled — a dropped frame is a fraction of a pixel and the eye cannot find
 * it.
 *
 * The rest is compositor hygiene:
 *
 *  · Geometry is measured once, and on resize — never inside the frame, where
 *    getBoundingClientRect() forces a synchronous reflow.
 *  · One rAF loop reads a single scrollY. Transforming straight from the
 *    scroll event ties movement to event cadence, which is coarser than the
 *    compositor during momentum scrolling, so layers step rather than glide.
 *  · `will-change: transform` is set on the layers actually near the viewport
 *    and removed as they leave, so a plate is composited while it moves
 *    without promoting every plate on the page at once. Writing a 3D transform
 *    from JS has not been a compositing trigger since CompositeAfterPaint —
 *    without this hint the browser repaints a full-viewport image every frame,
 *    on the main thread, which is most of what "chuggy" was.
 *
 * There is deliberately no easing toward the target. An earlier version eased,
 * which looked smooth in isolation and felt broken in the hand: the image
 * visibly lagged the page and kept drifting after you stopped. Position is not
 * the place for smoothing — the frame cadence already provides it.
 */

/** Full travel is ±AMPLITUDE × rate px, whatever the trigger's height. */
export const AMPLITUDE = 120;

export interface ParLayer {
  el: HTMLElement;
  /** The element whose pass through the viewport drives this layer. */
  trigger: HTMLElement;
  /** Travel, as a multiple of AMPLITUDE. Plates want 0.08–0.14. */
  rate: number;
  /** Push-in: scale runs 1 → 1 + this across the pass. 0 disables it. */
  scale: number;
}

export interface Parallax {
  /** Re-read geometry — after a resize, or when a late image changes a height. */
  measure(): void;
  /** Restart the frame loop (it parks itself when nothing is moving). */
  kick(): void;
  /** Swap the layer set; anything dropped is reset to no transform. */
  refresh(next: ParLayer[]): void;
  destroy(): void;
}

interface Tracked extends ParLayer {
  top: number;
  height: number;
  near: boolean;
  last: string;
}

/**
 * Reads `data-par` (rate) and `data-par-scale` (push-in) off every marked
 * element under `root`. `triggerOf` says whose viewport pass drives each one —
 * its own section for the experience view, the whole hero for the overview.
 */
export function readLayers(
  root: HTMLElement,
  triggerOf: (el: HTMLElement) => HTMLElement | null,
): ParLayer[] {
  return Array.from(root.querySelectorAll<HTMLElement>("[data-par]"))
    .map((el) => {
      const trigger = triggerOf(el);
      if (!trigger) return null;
      return {
        el,
        trigger,
        rate: parseFloat(el.dataset.par || "0") || 0,
        scale: parseFloat(el.dataset.parScale || "0") || 0,
      };
    })
    .filter((l): l is ParLayer => l !== null);
}

const track = (l: ParLayer): Tracked => ({ ...l, top: 0, height: 0, near: false, last: "" });

const clear = (l: Tracked) => {
  l.el.style.transform = "";
  l.el.style.willChange = "";
};

export function mountParallax(initial: ParLayer[]): Parallax {
  let layers = initial.map(track);

  const measure = () => {
    const y = window.scrollY;
    for (const l of layers) {
      const r = l.trigger.getBoundingClientRect();
      l.top = r.top + y;
      l.height = r.height;
      // geometry moved under it; the cached transform is no longer a match
      l.last = "";
    }
  };

  let running = false;
  let lastY = -1;
  let idle = 0;

  const frame = () => {
    const y = window.scrollY;

    if (y !== lastY) {
      lastY = y;
      idle = 0;
      const vh = window.innerHeight;

      for (const l of layers) {
        // Only pay for what is anywhere near the viewport, and only hold a
        // compositor layer for as long as that is true.
        const near = l.top - y < vh * 1.5 && l.top + l.height - y > -vh * 0.5;
        if (near !== l.near) {
          l.near = near;
          l.el.style.willChange = near ? "transform" : "";
        }
        if (!near) continue;

        // 0 as the trigger's top meets the viewport floor, 1 as its bottom
        // clears the viewport top. Clamped, so a layer that re-enters from
        // either end starts from the right place rather than from a wild value.
        const p = (y + vh - l.top) / (l.height + vh);
        const c = p < 0 ? 0 : p > 1 ? 1 : p;
        const dy = (1 - c * 2) * AMPLITUDE * l.rate;

        const t = l.scale
          ? `translate3d(0, ${dy.toFixed(2)}px, 0) scale(${(1 + c * l.scale).toFixed(4)})`
          : `translate3d(0, ${dy.toFixed(2)}px, 0)`;
        if (t !== l.last) {
          l.last = t;
          l.el.style.transform = t;
        }
      }
    } else if (++idle > 4) {
      // nothing has moved for a few frames; park until the next scroll
      running = false;
      return;
    }

    requestAnimationFrame(frame);
  };

  const kick = () => {
    if (running) return;
    running = true;
    idle = 0;
    lastY = -1; // force one pass, so a resize or a refresh always repaints
    requestAnimationFrame(frame);
  };

  const onResize = () => {
    measure();
    kick();
  };

  measure();
  kick();
  window.addEventListener("scroll", kick, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });

  return {
    measure,
    kick,
    refresh(next) {
      const keep = new Set(next.map((l) => l.el));
      for (const l of layers) if (!keep.has(l.el)) clear(l);
      layers = next.map(track);
      measure();
      kick();
    },
    destroy() {
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", onResize);
      running = false;
      for (const l of layers) clear(l);
      layers = [];
    },
  };
}
