#!/usr/bin/env node
/**
 * ElevenLabs asset generator — a BUILD-TIME tool, never part of a deploy.
 *
 * The runtime read-aloud path is src/app/api/magnifica/tts/route.ts; that route
 * hand-rolls one fetch and stays lean. This script is the other half: the whole
 * ElevenLabs surface (sound effects, music, speech, voice design) reached
 * through the official SDK, run locally, writing files you then commit.
 *
 *   node scripts/elevenlabs.mjs balance                 what the key can still spend
 *   node scripts/elevenlabs.mjs sfx [layer...]          magnifica sound board loops
 *   node scripts/elevenlabs.mjs music "<prompt>" [ms]   an instrumental bed
 *   node scripts/elevenlabs.mjs say "<text>" [voice]    one-off narration
 *   node scripts/elevenlabs.mjs voices                  list available voices
 *
 * Flags: --force (overwrite existing files), --out=<path> (music/say target).
 *
 * Every generating command prints the credits it actually consumed, measured
 * against the account before and after — nothing here estimates a price.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SFX_DIR = join(ROOT, "magnifica/public/media/sfx");

/** The five sound board layers in magnifica/src/soundscape.ts. Each file here
 *  replaces that layer's procedural Web Audio fallback. Prompts stay place-like
 *  and unmelodic so five layers can overlap without turning into a chord. */
const LAYERS = {
  wind: "soft steady wind through a high mountain pass, distant and continuous, smooth loopable ambience, no melody, no music",
  drone: "a low sustained cathedral organ drone, deep and still, barely moving, smooth loopable ambience, no melody",
  bells: "distant temple bells at irregular intervals across a wide valley, soft decay, sparse, loopable ambience",
  rain: "steady rain on stone steps and a courtyard, no thunder, even and calm, smooth loopable ambience",
  hum: "a faint room tone of a vast empty stone basilica, air moving, almost silent, smooth loopable ambience, no melody",
};

const SFX_SECONDS = 22; // API allows 0.5–30; long enough that the loop is not obvious
const VOICES = {
  daniel: "onwK4e9ZLuTAKqWW03F9",
  george: "JBFqnCBsd6RMkjVDRZzb",
  charlotte: "XB0fDUnXU5powFXDhCwa",
  lily: "pFZP5JQG7iQjIQuC4Bku",
};

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith("--")));
const outFlag = args.find((a) => a.startsWith("--out="))?.slice(6);
const positional = args.filter((a) => !a.startsWith("--"));
const [command, ...rest] = positional;
const force = flags.has("--force");

function loadKey() {
  if (process.env.ELEVENLABS_API_KEY) return process.env.ELEVENLABS_API_KEY;
  const envFile = join(ROOT, ".env.local");
  if (existsSync(envFile)) {
    const line = readFileSync(envFile, "utf8")
      .split("\n")
      .find((l) => l.startsWith("ELEVENLABS_API_KEY="));
    if (line) return line.slice("ELEVENLABS_API_KEY=".length).trim().replace(/^["']|["']$/g, "");
  }
  console.error(
    "No ELEVENLABS_API_KEY.\n" +
      "  Add it to .env.local, or run:  vercel env pull .env.local\n" +
      "  The key needs Sound Generation / Music / Text to Speech scopes enabled.",
  );
  process.exit(1);
}

const client = new ElevenLabsClient({ apiKey: loadKey() });

/** Remaining credits, or null if the key cannot read its own subscription. */
async function credits() {
  try {
    const s = await client.user.subscription.get();
    const used = s.characterCount ?? s.character_count;
    const limit = s.characterLimit ?? s.character_limit;
    if (typeof used !== "number" || typeof limit !== "number") return null;
    return limit - used;
  } catch {
    return null;
  }
}

async function toBuffer(res) {
  // The SDK returns a web ReadableStream for audio endpoints.
  if (res instanceof Uint8Array) return Buffer.from(res);
  if (res?.audioBase64 ?? res?.audio_base64) return Buffer.from(res.audioBase64 ?? res.audio_base64, "base64");
  const chunks = [];
  for await (const chunk of res) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

function save(path, buf) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, buf);
  const rel = path.replace(`${ROOT}/`, "");
  console.log(`  wrote ${rel}  (${(buf.length / 1024).toFixed(0)} KB)`);
}

/** Wrap a generating command so the real credit cost is always reported. */
async function metered(fn) {
  const before = await credits();
  if (before !== null) console.log(`credits before: ${before.toLocaleString()}\n`);
  await fn();
  const after = await credits();
  if (before !== null && after !== null) {
    console.log(`\ncredits after: ${after.toLocaleString()}  (spent ${(before - after).toLocaleString()})`);
  }
}

const commands = {
  async balance() {
    const c = await credits();
    if (c === null) {
      console.log("Could not read the subscription — the key may lack the User Read scope.");
      return;
    }
    console.log(`${c.toLocaleString()} credits remaining.`);
  },

  async voices() {
    const { voices } = await client.voices.getAll();
    for (const v of voices) console.log(`${v.voiceId ?? v.voice_id}  ${v.name}  ${v.labels?.description ?? ""}`);
  },

  async sfx() {
    const wanted = rest.length ? rest : Object.keys(LAYERS);
    const unknown = wanted.filter((l) => !(l in LAYERS));
    if (unknown.length) {
      console.error(`Unknown layer(s): ${unknown.join(", ")}. Known: ${Object.keys(LAYERS).join(", ")}`);
      process.exit(1);
    }
    await metered(async () => {
      for (const layer of wanted) {
        const path = join(SFX_DIR, `${layer}.mp3`);
        if (existsSync(path) && !force) {
          console.log(`  skip ${layer} — already exists (--force to regenerate)`);
          continue;
        }
        console.log(`  generating ${layer} …`);
        const res = await client.textToSoundEffects.convert({
          text: LAYERS[layer],
          modelId: "eleven_text_to_sound_v2", // required for loop:true
          loop: true,
          durationSeconds: SFX_SECONDS,
          promptInfluence: 0.5,
          outputFormat: "mp3_44100_128",
        });
        save(path, await toBuffer(res));
      }
    });
  },

  async music() {
    const [prompt, ms] = rest;
    if (!prompt) {
      console.error('Usage: node scripts/elevenlabs.mjs music "<prompt>" [lengthMs] [--out=path]');
      process.exit(1);
    }
    const lengthMs = Number(ms) || 30000; // API accepts 3000–600000
    const out = resolve(ROOT, outFlag ?? "magnifica/public/media/music/bed.mp3");
    if (existsSync(out) && !force) {
      console.error(`${out} exists — pass --force to overwrite.`);
      process.exit(1);
    }
    await metered(async () => {
      console.log(`  composing ${lengthMs / 1000}s …`);
      const res = await client.music.compose({ prompt, musicLengthMs: lengthMs, forceInstrumental: true });
      save(out, await toBuffer(res));
    });
  },

  async say() {
    const [text, voice = "daniel"] = rest;
    if (!text) {
      console.error('Usage: node scripts/elevenlabs.mjs say "<text>" [voice] [--out=path]');
      process.exit(1);
    }
    const voiceId = VOICES[voice] ?? voice;
    const out = resolve(ROOT, outFlag ?? `magnifica/public/media/vo/${voice}.mp3`);
    if (existsSync(out) && !force) {
      console.error(`${out} exists — pass --force to overwrite.`);
      process.exit(1);
    }
    await metered(async () => {
      const res = await client.textToSpeech.convert(voiceId, {
        text,
        modelId: "eleven_multilingual_v2",
        outputFormat: "mp3_44100_128",
      });
      save(out, await toBuffer(res));
    });
  },
};

const run = commands[command];
if (!run) {
  console.error(
    `Usage: node scripts/elevenlabs.mjs <command>\n\n` +
      `  balance                       credits remaining\n` +
      `  voices                        list voices on the account\n` +
      `  sfx [layer...]                sound board loops → magnifica/public/media/sfx/\n` +
      `  music "<prompt>" [lengthMs]   instrumental bed\n` +
      `  say "<text>" [voice]          one-off narration\n\n` +
      `  --force   overwrite existing files\n` +
      `  --out=…   target path for music / say\n`,
  );
  process.exit(1);
}

run().catch((e) => {
  console.error(`\nFailed: ${e?.message ?? e}`);
  if (e?.statusCode === 401) console.error("The key was rejected — check it, and check its scopes.");
  if (e?.statusCode === 402) console.error("Out of credits for this operation.");
  process.exit(1);
});
