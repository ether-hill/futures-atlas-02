/**
 * The slide-out index: project overview plus every voice, with its portrait.
 *
 * Mounted once and kept across route changes — it is navigation, not page
 * content, so re-rendering it on every hashchange would drop focus and replay
 * its transition. It marks the current route instead.
 *
 * Leaders whose portrait has not been sourced yet show a monogram tile rather
 * than a gap; see portraits.ts for why the list is deliberately incomplete.
 */
import { LEADERS } from "./leaders";
import { portraitOf, monogram } from "./portraits";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

let root: HTMLElement | null = null;

function itemsHtml(): string {
  return LEADERS.map((l) => {
    const p = portraitOf(l.id);
    const thumb = p
      ? `<img src="/magnifica/media/portraits/${esc(p.file)}" alt="" loading="lazy" decoding="async" />`
      : `<span class="mg-mono" aria-hidden="true">${esc(monogram(l.name))}</span>`;
    return `
      <li>
        <a href="#/l/${esc(l.id)}" data-id="${esc(l.id)}">
          <span class="mg-thumb">${thumb}</span>
          <span class="mg-who">
            <b>${esc(l.name)}</b>
            <em>${esc(l.tradition)}</em>
          </span>
        </a>
      </li>`;
  }).join("");
}

/** A sidebar/panel glyph rather than a hamburger — this opens a panel. */
const PANEL_ICON = `
  <svg viewBox="0 0 20 20" width="19" height="19" aria-hidden="true" focusable="false">
    <rect x="1.6" y="3.4" width="16.8" height="13.2" rx="2.6" fill="none"
          stroke="currentColor" stroke-width="1.5" />
    <line x1="7.4" y1="3.4" x2="7.4" y2="16.6" stroke="currentColor" stroke-width="1.5" />
  </svg>`;

/** Reflect the current hash in the menu. */
export function markDrawerRoute() {
  if (!root) return;
  const m = location.hash.match(/^#\/(?:l|v1)\/([\w-]+)/);
  const id = m?.[1] ?? "";
  root.querySelector(".mg-overview")?.classList.toggle("on", !id);
  root.querySelectorAll<HTMLAnchorElement>("a[data-id]").forEach((a) => {
    a.classList.toggle("on", a.dataset.id === id);
  });
}

/**
 * Taken down when the reader leaves a voice for the project overview. The
 * overview is not "inside" the collection — it *is* the contents page, so a
 * contents drawer over the top of it is a second copy of the same navigation.
 * Moving between voices keeps the same instance (mountDrawer early-returns).
 */
export function unmountDrawer() {
  root?.remove();
  root = null;
}

export function mountDrawer() {
  if (root) {
    markDrawerRoute();
    return;
  }

  root = document.createElement("div");
  root.className = "mg-drawer-root";
  root.innerHTML = `
    <button type="button" class="mg-burger" aria-expanded="false" aria-controls="mg-drawer" aria-label="Open menu">
      ${PANEL_ICON}
    </button>
    <div class="mg-scrim" hidden></div>
    <aside class="mg-drawer" id="mg-drawer" hidden aria-label="Contents">
      <a class="mg-overview" href="#/"><span aria-hidden="true">&larr;</span> Back to project overview</a>
      <p class="mg-heading">The voices — speculative</p>
      <ul class="mg-list">${itemsHtml()}</ul>
    </aside>`;
  document.body.appendChild(root);

  const burger = root.querySelector<HTMLButtonElement>(".mg-burger")!;
  const drawer = root.querySelector<HTMLElement>(".mg-drawer")!;
  const scrim = root.querySelector<HTMLElement>(".mg-scrim")!;

  const setOpen = (open: boolean) => {
    if (!open) root!.classList.remove("open");
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    // hidden is removed before the transition so it can animate in
    if (open) {
      drawer.hidden = false;
      scrim.hidden = false;
      // Unhiding and adding .open in the same frame gives the browser no start
      // value to animate from, so it jumps. Let a frame pass first.
      requestAnimationFrame(() => requestAnimationFrame(() => root!.classList.add("open")));
    } else {
      const done = () => {
        if (!root!.classList.contains("open")) {
          drawer.hidden = true;
          scrim.hidden = true;
        }
        drawer.removeEventListener("transitionend", done);
      };
      drawer.addEventListener("transitionend", done);
    }
  };

  burger.addEventListener("click", () => setOpen(!root!.classList.contains("open")));
  scrim.addEventListener("click", () => setOpen(false));
  drawer.addEventListener("click", (e) => {
    if ((e.target as HTMLElement).closest("a")) setOpen(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && root!.classList.contains("open")) setOpen(false);
  });

  markDrawerRoute();
  markPinned(burger);
  pinFloatingControls();
}

/**
 * Fixed controls that ride up with the page until they reach a top margin,
 * then hold there. They cannot be `position: sticky` — both are appended
 * outside the content flow — so the same effect comes from translating them by
 * the scroll distance, capped. Transform only, one rAF, so it costs nothing.
 */
export function pinFloatingControls() {
  const MIN_GAP = 14;

  /**
   * How much room the Atlas bar is taking right now. It hides on scroll-down
   * and returns on scroll-up, so this is 0 or its height — never a constant.
   * Pinning these controls a flat 14px from the viewport top let the bar bury
   * them by 50px every time it came back; they are 42px tall, so they vanished
   * completely. atlas-nav.js publishes the live value.
   */
  const navNow = () => {
    const v = getComputedStyle(document.documentElement).getPropertyValue("--fa-nav-now");
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  };

  const apply = () => {
    const y = window.scrollY;
    const floor = navNow() + MIN_GAP;
    document.querySelectorAll<HTMLElement>("[data-pin-top]").forEach((el) => {
      const rest = Number(el.dataset.pinTop);
      const shift = Math.min(y, Math.max(0, rest - floor));
      el.style.transform = `translateY(${-shift}px)`;
    });
  };
  /*
   * Follow --fa-nav-now until it settles, not just on scroll.
   *
   * Going down, the bar is driven from scrollY and the variable is exact on the
   * same frame. Coming back UP it slides down over ~0.26s, and the nav publishes
   * its real edge frame by frame for the whole ride — which continues after the
   * last scroll event. A scroll-only handler therefore samples the variable at
   * 0, parks the control at the top, and never looks again: measured, the bar
   * then covered it by 50px of its 42px height.
   *
   * CSS consumers get this free, because a changing variable re-evaluates their
   * calc(). This is JS, so it has to watch.
   */
  // Run for a fixed window rather than "until the value stops changing". The
  // reveal does not begin the frame the scroll ends — the variable sits at its
  // old value for a frame or two first — so a stop-on-stable loop quits before
  // the bar has moved at all, which is exactly what it did. 500ms comfortably
  // covers the 260ms slide plus that startup gap, and each frame is one
  // getComputedStyle and a transform write on two elements.
  const FOLLOW_MS = 500;
  let followUntil = 0;
  let following = false;
  const follow = () => {
    apply();
    if (performance.now() >= followUntil) {
      following = false;
      return;
    }
    requestAnimationFrame(follow);
  };

  const onScroll = () => {
    followUntil = performance.now() + FOLLOW_MS;
    if (!following) {
      following = true;
      requestAnimationFrame(follow);
    }
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  // A resize changes the bar height and so the resting offset; without this the
  // button would hold at a margin measured for the old layout.
  window.addEventListener("resize", () => {
    document.querySelectorAll<HTMLElement>("[data-pin-top]").forEach(markPinned);
    apply();
  }, { passive: true });
  apply();
}

/**
 * Measure an element's resting offset, so the pin knows how far it may travel.
 *
 * These controls are `position: fixed`, so getBoundingClientRect().top IS the
 * resting offset — do NOT add scrollY to it. Adding it read as correct for a
 * long time because it is only wrong when the page is already scrolled, and
 * both controls are usually measured at the top. The drawer is not: it mounts
 * during the route change, while the overview is still scrolled where the
 * reader left it, so it recorded a rest of 2278 instead of 78 and allowed
 * itself 2264px of travel — straight off the top of the screen.
 */
export function markPinned(el: HTMLElement | null) {
  if (!el) return;
  el.style.transform = "";
  el.dataset.pinTop = String(Math.round(el.getBoundingClientRect().top));
}
