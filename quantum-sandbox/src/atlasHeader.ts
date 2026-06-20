// The global Futures Atlas master header — an exact vanilla port of the Social
// Composer `FaShell` (same markup, classes, dropdown and links), so every Atlas
// project renders the identical master nav. Styles live under `.fa-shell*` in
// style.css (copied verbatim from the canonical header).

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

const BACK_ARROW = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>`;
const CHEVRON = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>`;

/** Mount the master header for the current project (name + its /path). */
export function mountAtlasHeader(current: FaProject): void {
  const base = import.meta.env.BASE_URL || "/";
  const mark = `<img src="${base}fa.svg" alt="" aria-hidden="true" style="display:block;height:1.05em;width:auto;filter:invert(1)" />`;

  const items = FA_PROJECTS.map((p) => {
    const isCurrent = p.path === current.path;
    return `<a role="menuitem" href="${p.path}" class="fa-shell__item${isCurrent ? " is-current" : ""}"${isCurrent ? ' aria-current="true"' : ""}>${p.name}</a>`;
  }).join("");

  const header = document.createElement("header");
  header.className = "fa-shell";
  header.innerHTML = `
    <div class="fa-shell__left">
      <a class="fa-shell__home" href="${FA_HOME}" aria-label="Back to Futures Atlas">
        <span class="fa-shell__back" aria-hidden="true">${BACK_ARROW}</span>
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
    <nav class="fa-shell__right" aria-label="Project">
      <a class="fa-shell__link" href="/about">About this project</a>
      <a class="fa-shell__link" href="/contact?project=${encodeURIComponent(current.name)}">Contact</a>
    </nav>`;

  document.body.insertBefore(header, document.body.firstChild);

  // dropdown behaviour (click toggle + outside-click + escape)
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
}
