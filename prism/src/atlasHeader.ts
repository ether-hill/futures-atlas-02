// The one standard global nav (vanilla port of core's GlobalNav) so this
// project renders the identical black bar: white brand mark + "Futures Atlas",
// the project breadcrumb dropdown, the primary links (Home/Projects/About/
// Contact) and the theme toggle. Styles live under `.fa-shell*` in style.css
// (verbatim from core/shell.css).

const FA_HOME = "/";

interface FaProject {
  name: string;
  path: string;
}

// Mirror of the canonical list (social-composer/src/app/fa-projects.ts).
const FA_PROJECTS: FaProject[] = [
  { name: "Social Composer", path: "/social-composer" },
  { name: "Prism", path: "/prism" },
  { name: "Quantum Sandbox", path: "/quantum-sandbox" },
  { name: "The Odds", path: "/odds-of-surviving-ai" },
  { name: "Underground Intelligence", path: "/underground-intelligence" },
  { name: "The Hollow Villages", path: "/hollow-villages" },
];

const LINKS: FaProject[] = [
  { name: "Home", path: "/" },
  { name: "Projects", path: "/#projects" },
  { name: "About", path: "/about" },
  { name: "Contact", path: "/contact" },
];

const CHEVRON = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>`;
const MOON = `<svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M16 11.2A6.2 6.2 0 1 1 8.8 4a4.8 4.8 0 0 0 7.2 7.2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
const SUN = `<svg width="16" height="16" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="3.6" stroke="currentColor" stroke-width="1.5"/><path d="M10 2.2v2M10 15.8v2M2.2 10h2M15.8 10h2M4.6 4.6l1.4 1.4M14 14l1.4 1.4M15.4 4.6L14 6M6 14l-1.4 1.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;

/** Mount the standard global nav for the current project (name + its /path). */
export function mountAtlasHeader(current: FaProject): void {
  const base = import.meta.env.BASE_URL || "/";
  const mark = `<img src="${base}fa.svg" alt="" aria-hidden="true" style="display:block;height:20px;width:auto" />`;

  const items = FA_PROJECTS.map((p) => {
    const isCurrent = p.path === current.path;
    return `<a role="menuitem" href="${p.path}" class="fa-shell__item${isCurrent ? " is-current" : ""}"${isCurrent ? ' aria-current="true"' : ""}>${p.name}</a>`;
  }).join("");

  const navlinks = LINKS.map((l) => `<a class="fa-shell__navlink" href="${l.path}">${l.name}</a>`).join("");

  const header = document.createElement("header");
  header.className = "fa-shell";
  header.innerHTML = `
    <div class="fa-shell__left">
      <a class="fa-shell__home" href="${FA_HOME}" aria-label="Futures Atlas home">
        <span class="fa-shell__mark" aria-hidden="true">${mark}</span>
        <span class="fa-shell__word">Futures Atlas</span>
      </a>
      <span class="fa-shell__sep" aria-hidden="true">/</span>
      <div class="fa-shell__crumb">
        <button type="button" class="fa-shell__current" aria-haspopup="menu" aria-expanded="false" aria-label="Current project: ${current.name}. Switch project">
          <span>${current.name}</span>
          <span class="fa-shell__chev" aria-hidden="true">${CHEVRON}</span>
        </button>
        <div class="fa-shell__menu" role="menu" aria-label="Switch project" hidden>
          ${items}
          <span class="fa-shell__menusep"></span>
          <a role="menuitem" href="${FA_HOME}" class="fa-shell__item fa-shell__item--accent">View all projects →</a>
        </div>
      </div>
    </div>
    <nav class="fa-shell__right" aria-label="Primary">
      <div class="fa-shell__nav">${navlinks}</div>
      <button type="button" class="fa-shell__toggle" aria-label="Toggle theme"></button>
    </nav>`;

  document.body.insertBefore(header, document.body.firstChild);

  // shared footer (dark band) at the bottom of the page
  const foot = document.createElement("footer");
  foot.className = "fa-foot";
  foot.innerHTML =
    `<div class="fa-foot__inner">` +
    `<p class="fa-foot__lede">The future is plural.</p>` +
    `<p class="fa-foot__blurb">Futures Atlas collects speculative-design projects that each draw one possible world in full — grounded, specific, and built to be argued with.</p>` +
    `<div class="fa-foot__row">` +
    `<span class="fa-foot__brand">FUTURES ATLAS</span>` +
    `<nav class="fa-foot__nav">` +
    `<a class="fa-foot__link" href="/">Home</a>` +
    `<a class="fa-foot__link" href="/about">About</a>` +
    `<a class="fa-foot__link" href="/contact">Contact</a></nav>` +
    `<span class="fa-foot__tag">A catalogue of possible worlds · MMXXVI</span>` +
    `</div></div>`;
  document.body.appendChild(foot);

  // hide on scroll-down, reveal on scroll-up (frond-style)
  let lastY = window.scrollY;
  window.addEventListener(
    "scroll",
    () => {
      const y = window.scrollY;
      if (y > lastY && y > 90) header.classList.add("is-hidden");
      else header.classList.remove("is-hidden");
      lastY = y;
    },
    { passive: true },
  );

  // breadcrumb dropdown
  const crumb = header.querySelector<HTMLDivElement>(".fa-shell__crumb")!;
  const btn = header.querySelector<HTMLButtonElement>(".fa-shell__current")!;
  const menu = header.querySelector<HTMLDivElement>(".fa-shell__menu")!;
  const setOpen = (open: boolean) => {
    btn.setAttribute("aria-expanded", String(open));
    menu.hidden = !open;
  };
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    setOpen(menu.hidden);
  });
  document.addEventListener("mousedown", (e) => {
    if (!crumb.contains(e.target as Node)) setOpen(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });

  // theme toggle — DARK by default on the project tools; flips `html.dark` + persists "theme"
  const toggle = header.querySelector<HTMLButtonElement>(".fa-shell__toggle")!;
  const root = document.documentElement;
  const paint = () => (toggle.innerHTML = root.classList.contains("dark") ? SUN : MOON);
  try {
    if (localStorage.getItem("fa-theme") !== "light") root.classList.add("dark");
  } catch {
    /* ignore */
  }
  paint();
  toggle.addEventListener("click", () => {
    const dark = root.classList.toggle("dark");
    try {
      localStorage.setItem("fa-theme", dark ? "dark" : "light");
    } catch {
      /* ignore */
    }
    paint();
  });
}
