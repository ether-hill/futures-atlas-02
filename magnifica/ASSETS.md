# Magnifica — media asset pipeline

The listen layer works today with zero assets (procedural Web Audio ambience,
ElevenLabs TTS via the host route, device-voice fallback). Two asset classes
upgrade it; both are generated with connected tools and **committed** under
`magnifica/public/media/` (Vite copies that folder into the bundle on build).

## Hard rules

- **No real-person likenesses, no cloned voices.** Hero loops are place-based
  (landscape / architecture / weather / light — prompts in `src/scenes.ts`, all
  ending "no people, no text"). TTS uses stock ElevenLabs narrators. This
  project's own content documents leaders condemning deepfakes of themselves
  (Adeboye, the Akal Takht directive) — we do not produce what they prohibit.
- Keep each loop ≤ ~6 MB (720p, 8–12 s, H.264, no audio). 16 loops ≈ 100 MB of
  repo weight if unmanaged — compress with
  `ffmpeg -i in.mp4 -an -vf scale=1280:-2 -c:v libx264 -crf 28 -movflags +faststart out.mp4`.

## 1 · Hero video loops → `public/media/loops/<id>.mp4`

Filenames = leader ids from `src/leaders/*.ts` (e.g. `dalai-lama.mp4`), plus
`home.mp4` for the landing page (not yet wired). Generation via the
**Higgsfield MCP** (hosted, OAuth, no API key):

```sh
claude mcp add --transport http higgsfield https://mcp.higgsfield.ai/mcp
# then in a session: authenticate when prompted, and for each scene in
# src/scenes.ts request a 10s seamless-loop clip with the scene's videoPrompt
# (Kling/Veo/Seedance — pick per scene), download, ffmpeg-compress, save here.
```

The page auto-detects each file: `app.ts#mountHero` tries
`/magnifica/media/loops/<id>.mp4` and silently skips missing ones.

## 2 · Soundscape loops → `public/media/sfx/<layer>.mp3`

Five layer names: `wind` `drone` `bells` `rain` `hum`. The sound board
(`src/soundscape.ts`) prefers these files and falls back to its synthesized
versions. Generate with the ElevenLabs sound-effects API (same
`ELEVENLABS_API_KEY` as TTS, `loop: true`, ~20 s each):

```sh
curl -s -X POST https://api.elevenlabs.io/v1/sound-generation \
  -H "xi-api-key: $ELEVENLABS_API_KEY" -H "content-type: application/json" \
  -d '{"text":"soft steady himalayan wind through a high mountain pass, smooth loopable ambience, no melody","duration_seconds":20,"loop":true}' \
  -o public/media/sfx/wind.mp3
```

## 3 · Experience view (v2) — layered plates

The immersive view (`src/experience.ts`) separates the layers, which cuts cost
sharply: **only the hero is a video loop**. Every other backdrop is a still.

- `public/media/loops/<id>-hero.mp4` — the one moving plate per leader.
- `public/media/stills/<name>.jpg` — section backdrops, parallaxed. Generate
  with `nano_banana_pro` at **~2 credits** each (vs ~15 for a 10s clip), 16:9,
  and encode to 1920px wide. Do **not** pass `resolution: "2k"` — it fails.
  Frames pulled out of an existing loop with ffmpeg are free and work fine
  behind a heavy scrim.
- `public/media/portraits/<leader>.jpg` — see licensing below.

Rough cost per leader at this treatment: one hero loop (~15) plus two or three
stills (~6) — call it **~21 credits**, against ~120 if every backdrop moved.

### Portrait licensing — read before touching the credit line

Portraits are **real photographs under real licences**, not generated. The
Dalai Lama portrait is [Christopher Michel's 2012 photograph][dl-src], **CC
BY-SA 4.0**. That licence is not optional decoration:

- the credit and the licence link must stay **visible on the page** — they are
  rendered inside the print itself (`.x-polaroid figcaption`), not hidden in a
  comment or an alt attribute;
- the crop is an adaptation, so the cropped file is itself CC BY-SA 4.0, and
  the caption says "cropped" to satisfy the indicate-changes term.

**If you restyle the print, keep the caption.** Removing it is a licence
breach, not a design choice. Same rule for any portrait added later — record
the source, author and licence in `src/portraits.ts`, which is the single
registry the hero print and the slide-out index both read from. Leaders with no
entry there show a monogram tile instead of a broken image.

[dl-src]: https://commons.wikimedia.org/wiki/File:The_Dalai_Lama_in_2012.jpg

## Env (host Vercel project)

- `ELEVENLABS_API_KEY` — read-aloud voices (route 503s gracefully without it).
- `ANTHROPIC_API_KEY` — non-English read-aloud (Haiku translation, KV-cached);
  already required by Signal Reactor.
