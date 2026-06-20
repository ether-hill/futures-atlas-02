// The global Futures Atlas master header — a thin platform bar above the tool,
// matching the one on the other Atlas projects: back link → Atlas home, the
// brand mark, and the project name. Vanilla DOM (this app isn't React).

export function mountAtlasHeader(project: string): void {
  const base = import.meta.env.BASE_URL || "/";
  const bar = document.createElement("header");
  bar.className = "atlas-bar";
  bar.innerHTML = `
    <a class="atlas-bar__home" href="/" aria-label="Back to Futures Atlas">
      <span class="atlas-bar__back" aria-hidden="true">‹</span>
      <img class="atlas-bar__mark" src="${base}fa.svg" alt="" aria-hidden="true" />
      <span class="atlas-bar__word">Futures Atlas</span>
    </a>
    <span class="atlas-bar__sep" aria-hidden="true">/</span>
    <span class="atlas-bar__project">${project}</span>`;
  document.body.insertBefore(bar, document.body.firstChild);
}
