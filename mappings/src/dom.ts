export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  cls?: string,
  html?: string
): HTMLElementTagNameMap[K] {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html !== undefined) n.innerHTML = html;
  return n;
}

export const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* one shared tooltip */
let tip: HTMLDivElement | null = null;
export function showTip(x: number, y: number, html: string) {
  if (!tip) {
    tip = el("div", "tip");
    document.body.appendChild(tip);
  }
  tip.innerHTML = html;
  tip.style.display = "block";
  const w = tip.offsetWidth;
  const left = Math.min(x + 14, window.innerWidth - w - 10);
  const top = Math.min(y + 14, window.innerHeight - tip.offsetHeight - 10);
  tip.style.left = `${left}px`;
  tip.style.top = `${top}px`;
}
export function hideTip() {
  if (tip) tip.style.display = "none";
}
