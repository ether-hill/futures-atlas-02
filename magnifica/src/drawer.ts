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

export function mountDrawer() {
  if (root) {
    markDrawerRoute();
    return;
  }

  root = document.createElement("div");
  root.className = "mg-drawer-root";
  root.innerHTML = `
    <button type="button" class="mg-burger" aria-expanded="false" aria-controls="mg-drawer" aria-label="Open menu">
      <span></span><span></span><span></span>
    </button>
    <div class="mg-scrim" hidden></div>
    <aside class="mg-drawer" id="mg-drawer" hidden aria-label="Contents">
      <a class="mg-overview" href="#/">
        <span class="mg-over-lbl">Project Overview</span>
        <span class="mg-over-sub">The real encyclical, and how these were made</span>
      </a>
      <p class="mg-heading">The voices — speculative</p>
      <ul class="mg-list">${itemsHtml()}</ul>
    </aside>`;
  document.body.appendChild(root);

  const burger = root.querySelector<HTMLButtonElement>(".mg-burger")!;
  const drawer = root.querySelector<HTMLElement>(".mg-drawer")!;
  const scrim = root.querySelector<HTMLElement>(".mg-scrim")!;

  const setOpen = (open: boolean) => {
    root!.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    // hidden is removed before the transition so it can animate in
    if (open) {
      drawer.hidden = false;
      scrim.hidden = false;
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
}
