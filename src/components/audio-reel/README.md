# Audio reel

Audio-driven horizontal story reel: an interview clip plays and scenes —
portrait, media, pull-quotes — slide right-to-left past a fixed playhead — an invisible line a third of the
way in; nothing is drawn there — in sync with the audio. **Audio time is the only source of truth**:
`useAudioClock` runs one rAF loop that reads `audio.currentTime` and writes
CSS custom properties; `audio-reel.css` turns those into all motion. Nothing
animates on scroll or its own clock; pause freezes the reel, seeking snaps it.

Mounted at `/listen` (internal, gated via `INTERNAL_PATHS` in middleware).

## One line

Every voice sits on a single timeline, back to back in `index.json` order:
Scott's scenes, then Amara's, and so on, one long strip. Global time is the
current clip's time plus the clips before it (`offsetRef`); each clip's
length comes from its metadata (preloaded for all voices at mount, a
`start + 6s` guess until then). A seek that lands in another person's
stretch swaps the clip underneath: the reel holds at the target second
(`overrideRef`) until the new metadata lands, then the pending seek applies
and playback resumes if it was running. Between two people the line carries
`GAP` seconds of silence: the reel keeps moving at its one speed, nothing
plays, and the next name arrives well clear of the last picture. When a clip
ends the silence runs and then the next clip plays. After the last clip the
reel keeps its speed until the audio has actually stopped, then glides to a
halt over `GLIDE` seconds. The "Voice of" select is a jump list and follows
the line.

**One speed.** The reel moves at a constant px/s for the whole line and
every scene is placed at `start × speed`, so its centre reaches the playhead
exactly at its start time. The speed is the smallest that keeps neighbouring
scenes from overlapping (measured from their widths), never below a floor —
nothing speeds up or slows down between scenes and the motion runs steadily
through a clip's tail and the silence. Spacing allows for parallax, so a
lagging picture is never pulled back over the quote after it. Nothing on
the reel fades. Each clip's volume fades in over its first second and out
over its last, and the waveform strip goes with it.

## Two editions

`/listen` is people: each entry a person, opening on their portrait and
name. `/listen/issues` is the same line and clock over issues and sectors
(`src/content/issues/*.json`): each entry opens on a pull quote rather than a
name, and carries a couple of extra pictures set back in depth. Both pages
mount `AudioReel`; the `label` prop is the word before the jump list
("Voice of" / "On") and `editions` renders the switch between them.

## Depth

Any scene may carry `depth` (0–1). The near track keeps 3D
(`transform-style: preserve-3d`) inside the viewport's perspective, whose
origin is the playhead, so a deep scene is pushed back along z: it renders
smaller and moves slower by perspective alone, is lifted into a band above
the main row, and still lands on the playhead at its start. The speed
calculation only holds apart neighbours in the same band, so deep pictures
can sit near the row without forcing the whole line faster. (The older
whole-row depth layers of the Cinema/Deck/Type variants remain as they were.)

## Silence

While no clip is sounding — the silence between people, the glide after the
last — the section carries `data-silent="1"` and the waveform strip fades
out, coming back as the next clip starts. Nothing else fades: words and
pictures are solid throughout.

## Driving it by hand

The wheel drives the line — scrolling down moves it on, up brings it back;
horizontal deltas count too — and so does a drag on the reel. Either way the
gesture **seeks the audio; it never moves the track**: `useAudioClock`
exposes the scene map both ways (`xAt(t)` and `tAt(x)`), so a gesture of
*dx* px becomes `seek(tAt(xAt(t0) − dx))` and the reel follows the clock as
usual. At either end of the line the wheel goes back to the page, so the
rest of the site stays reachable. A drag pauses for its duration and
resumes on release; a plain press on the reel toggles play. On touch,
horizontal swipes scrub and vertical ones scroll the page (`touch-action:
pan-y`).

## Depth

Cinema, Deck and Type repeat the scene row as extra layers pushed back on
the z axis (`.ar-track--far`, `DEPTH` in `AudioReel`) under a real CSS
perspective whose origin sits on the playhead. The browser shrinks and
slows them, and the vanishing point stays where a scene lands, so the
distance shows what has passed and what is coming, small and dim,
converging behind the scene that is playing. Editorial and Ledger stay
flat; reduced motion hides the layers.

## Variants, light and dark

Five designs share one DOM and one clock; only a stylesheet block differs
(`.ar[data-variant=…]`). V1 Editorial (the brief), V2 Ledger, V3 Cinema, V4
Deck, V5 Type. V1 is the piece; the switch appears in the top bar only when
the page is opened with a `?v=` link (`/listen?v=cinema`).

**Light / dark principle.** Every colour derives from a trio — `--ar-bg`,
`--ar-ink`, `--ar-line` — by `color-mix` or opacity. The light trio is the
default; the dark trio applies under `html.dark`, the site's own theme class
(the nav toggle; `atlas-nav.js` stores it as `fa-theme`). The reel has no
toggle of its own. Nothing below the trios names a colour, so every variant
holds on either ground. Add a variant by adding a block that uses the trio
and its derivatives only.

## Authoring a new voice

1. Drop the clip at `public/audio-reel/<id>.mp3` and its media alongside.
2. Generate the waveform: `npm run peaks -- public/audio-reel/<id>.mp3`
   (writes `<id>.peaks.json` next to it — commit both).
3. Create `src/content/voices/<id>.json`:

```json
{
  "id": "…", "name": "…", "role": "…",
  "audio": "/audio-reel/….mp3",
  "peaks": "/audio-reel/….peaks.json",
  "scenes": [
    { "type": "portrait", "start": 0, "src": "…", "caption": "…" },
    { "type": "media", "start": 6, "src": "…", "parallax": 0.75 },
    { "type": "media", "start": 12, "src": "….mp4", "kind": "video" },
    { "type": "quote", "start": 18, "text": "…" }
  ]
}
```

- `start` — seconds into the clip when the scene should be centred on the
  playhead. Keep them ascending.
- `parallax` — layer speed multiplier (1 moves with the track, <1 lags).
  Defaults: 1 for quotes/portrait, 0.75 for media.
4. Add the id to `src/content/voices/index.json` (display order) and register
   the import in `src/app/(atlas)/listen/page.tsx`.

## Pieces

- `AudioReel` — the line (timeline, global seek, clip swap), state (voice,
  play, countdown, variant), top bar, drag/wheel scrubbing, depth layers,
  transcript
- `useAudioClock` — the rAF clock; measures scene offsets, writes
  `--t --progress --reel-x --fade-w` (section) and `--d --active` (per scene);
  reads global time via `offsetRef` / `overrideRef`; exposes `xAt` / `tAt`
  for scrubbing
- `Scene` — the three scene types; videos play only while audio plays and the
  scene is on screen
- `Waveform` — 240-peak strip; played bars clipped by `--progress`; the seek
  slider (click/drag, ←/→ ±5s, space toggles)
- `scripts/peaks.mts` — build-time peak extraction (ffmpeg-static → PCM →
  240 normalised peaks)

Reduced motion: the section gets `data-rm="1"` and scenes crossfade in place
at their `start` times — no horizontal movement.
