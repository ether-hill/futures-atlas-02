#!/usr/bin/env node
/**
 * Generate the soundscape loops from their prompts in src/scenes.ts.
 *
 *   node --experimental-strip-types scripts/sfx.mjs            # every missing loop
 *   node --experimental-strip-types scripts/sfx.mjs sadhguru   # one scene (or several ids)
 *   FORCE=1 …                                                  # regenerate even if present
 *
 * ElevenLabs sound generation, looped, 20 s each, written to
 * public/media/sfx/<scene>/<layer>.mp3 and committed. Reads ELEVENLABS_API_KEY
 * from the host's .env.local (one directory up) or the environment.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const { LAYERS } = await import(join(here, "../src/scenes.ts"));

let key = process.env.ELEVENLABS_API_KEY;
if (!key) {
  try {
    const env = readFileSync(join(here, "../../.env.local"), "utf8");
    const m = env.match(/^ELEVENLABS_API_KEY=(.*)$/m);
    key = m?.[1].trim().replace(/^["']|["']$/g, "");
  } catch { /* fall through */ }
}
if (!key) { console.error("ELEVENLABS_API_KEY not found"); process.exit(1); }

const only = process.argv.slice(2);
const force = !!process.env.FORCE;
const SECONDS = 20;

let made = 0, skipped = 0, failed = 0;
for (const [scene, layers] of Object.entries(LAYERS)) {
  if (only.length && !only.includes(scene)) continue;
  const dir = join(here, "../public/media/sfx", scene);
  mkdirSync(dir, { recursive: true });
  for (const l of layers) {
    const out = join(dir, `${l.id}.mp3`);
    if (existsSync(out) && !force) { skipped++; continue; }
    process.stdout.write(`${scene}/${l.id} … `);
    const res = await fetch("https://api.elevenlabs.io/v1/sound-generation", {
      method: "POST",
      headers: { "xi-api-key": key, "content-type": "application/json" },
      body: JSON.stringify({ text: l.prompt, duration_seconds: SECONDS, loop: true, prompt_influence: 0.4 }),
    });
    if (!res.ok) { failed++; console.log(`failed ${res.status}: ${(await res.text()).slice(0, 120)}`); continue; }
    writeFileSync(out, Buffer.from(await res.arrayBuffer()));
    made++;
    console.log("ok");
  }
}
console.log(`\n${made} generated, ${skipped} already present, ${failed} failed`);
