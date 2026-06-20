// The embeddable player: read the Config from the URL hash and play it,
// chrome-free, filling the iframe. This is what "copy embed code" points at.

import { Player } from "./runtime/Player";
import { readHashConfig } from "./core/config";
import { firstDescriptor, defaultConfig } from "./runtime/Registry";

const stage = document.getElementById("stage")!;
const cfg = readHashConfig() ?? (firstDescriptor() ? defaultConfig(firstDescriptor()!.id) : null);

if (cfg) {
  const player = new Player(stage, cfg, { sizing: "fit" });
  let t = 0;
  window.addEventListener("resize", () => {
    clearTimeout(t);
    t = window.setTimeout(() => player.refit(), 150) as unknown as number;
  });
} else {
  stage.textContent = "Prism: no config";
}
