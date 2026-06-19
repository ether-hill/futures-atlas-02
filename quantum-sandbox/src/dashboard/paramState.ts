// Serialize {system, seed, params} to the URL hash and restore on load, so every
// render is reproducible and shareable. Params are base64-JSON in the hash.

import type { Params } from "../harness/GenerativeSystem";

export interface SharedState {
  systemId?: string;
  seed?: string;
  params?: Params;
}

const b64encode = (s: string): string => btoa(unescape(encodeURIComponent(s)));
const b64decode = (s: string): string => decodeURIComponent(escape(atob(s)));

export function readState(): SharedState {
  const hash = location.hash.replace(/^#/, "");
  if (!hash) return {};
  const q = new URLSearchParams(hash);
  const out: SharedState = {};
  const sys = q.get("sys");
  const seed = q.get("seed");
  const p = q.get("p");
  if (sys) out.systemId = sys;
  if (seed) out.seed = seed;
  if (p) {
    try {
      out.params = JSON.parse(b64decode(p)) as Params;
    } catch {
      /* malformed hash — ignore */
    }
  }
  return out;
}

let writeTimer = 0;

export function writeState(systemId: string, seed: string, params: Params): void {
  clearTimeout(writeTimer);
  writeTimer = window.setTimeout(() => {
    const q = new URLSearchParams();
    q.set("sys", systemId);
    q.set("seed", seed);
    q.set("p", b64encode(JSON.stringify(params)));
    history.replaceState(null, "", `#${q.toString()}`);
  }, 120);
}
