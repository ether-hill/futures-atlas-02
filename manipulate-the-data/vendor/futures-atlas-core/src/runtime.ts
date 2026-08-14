/*
 * Runtime theming layer (framework-agnostic, SSR-safe).
 *
 * The store holds overrides keyed by token id -> value. `buildOverrideCss`
 * turns them into a stylesheet that re-sets the semantic vars on :root (and
 * html.dark for dark-mode colours), to be injected AFTER tokens.css. The same
 * function is used server-side (SSR, no flash) and client-side (live preview).
 */

import { TOKENS, tokenById } from "./tokens";

export type Overrides = Record<string, string>;

export const OVERRIDE_STYLE_ID = "fa-overrides";

/** Build the override stylesheet text from a map of token id -> value. */
export function buildOverrideCss(overrides: Overrides): string {
  const root: string[] = [];
  const dark: string[] = [];
  for (const [id, value] of Object.entries(overrides)) {
    if (value == null || value === "") continue;
    const def = tokenById(id);
    if (!def) continue;
    const decl = `${def.cssVar}: ${value};`;
    if (def.mode === "dark") dark.push(decl);
    else root.push(decl);
  }
  let css = "";
  if (root.length) css += `:root{${root.join("")}}`;
  if (dark.length) css += `html.dark{${dark.join("")}}`;
  return css;
}

/** Client: write the override stylesheet into <head> (creating it if needed). */
export function applyOverrides(overrides: Overrides): void {
  if (typeof document === "undefined") return;
  let el = document.getElementById(OVERRIDE_STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = OVERRIDE_STYLE_ID;
    document.head.appendChild(el);
  }
  el.textContent = buildOverrideCss(overrides);
}

/** Client: set a single token live (merges into the current override sheet). */
export function setTokenLive(current: Overrides, id: string, value: string): Overrides {
  const next = { ...current, [id]: value };
  applyOverrides(next);
  return next;
}

/** Client: clear one override live (falls back to the tokens.css default). */
export function clearTokenLive(current: Overrides, id: string): Overrides {
  const next = { ...current };
  delete next[id];
  applyOverrides(next);
  return next;
}

/** Client: fetch the saved overrides from the consumer's API route. */
export async function fetchOverrides(endpoint = "/api/tokens"): Promise<Overrides> {
  try {
    const res = await fetch(endpoint, { cache: "no-store" });
    if (!res.ok) return {};
    const data = await res.json();
    return (data?.overrides ?? data ?? {}) as Overrides;
  } catch {
    return {};
  }
}

/** Validate an incoming id (so the API only ever writes known tokens). */
export function isKnownToken(id: string): boolean {
  return TOKENS.some((t) => t.id === id);
}
