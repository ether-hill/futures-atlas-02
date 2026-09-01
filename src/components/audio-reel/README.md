# Audio reel

Audio-driven horizontal story reel: an interview clip plays and scenes —
portrait, media, pull-quotes — slide right-to-left past a fixed playhead — an invisible line a third of the
way in; nothing is drawn there — in sync with the audio. **Audio time is the only source of truth**:
`useAudioClock` runs one rAF loop that reads `audio.currentTime` and writes
CSS custom properties; `audio-reel.css` turns those into all motion. Nothing
animates on scroll or its own clock; pause freezes the reel, seeking snaps it.

Mounted at `/listen` (internal, gated via `INTERNAL_PATHS` in middleware).

## Driving it by hand

The reel can be scrubbed directly — drag it, or swipe horizontally on a
trackpad — but the gesture **seeks the audio; it never moves the track**.
`useAudioClock` exposes the scene map both ways (`xAt(t)` and `tAt(x)`), so
a drag of *dx* px becomes `seek(tAt(xAt(t0) − dx))` and the reel follows the
clock as usual. A drag pauses for its duration and resumes on release; a
plain press on the reel toggles play. Vertical wheel is left to the page.

## Continuous play

When a clip ends the next voice in `index.json` order loads, an "Up next ·
Name" card holds for a beat, and it plays — looping back to the first. Pass
`continuous={false}` to stop at the end of each clip.

## Variants and schemes

Five designs share one DOM and one clock; only a stylesheet block differs
(`.ar[data-variant=…]`). V1 Editorial (the brief), V2 Ledger, V3 Cinema, V4
Deck, V5 Type. The top bar switches them, and they are linkable:
`/listen?v=cinema&scheme=dark`.

**Light / dark principle.** Every colour derives from a trio — `--ar-bg`,
`--ar-ink`, `--ar-line` — by `color-mix` or opacity. The light trio is the
default; the dark trio applies under `prefers-color-scheme: dark` (unless
pinned `light`) and when pinned `dark`. Nothing below the trios names a
colour, so every variant holds on either ground. Add a variant by adding a
block that uses the trio and its derivatives only.

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

- `AudioReel` — state (voice, play, countdown, up-next, variant, scheme),
  top bar, drag/wheel scrubbing, continuous play, transcript
- `useAudioClock` — the rAF clock; measures scene offsets, writes
  `--t --progress --reel-x --fade-w` (section) and `--d --active` (per scene);
  exposes `xAt` / `tAt` for scrubbing
- `Scene` — the three scene types; videos play only while audio plays and the
  scene is on screen
- `Waveform` — 240-peak strip; played bars clipped by `--progress`; the seek
  slider (click/drag, ←/→ ±5s, space toggles)
- `scripts/peaks.mts` — build-time peak extraction (ffmpeg-static → PCM →
  240 normalised peaks)

Reduced motion: the section gets `data-rm="1"` and scenes crossfade in place
at their `start` times — no horizontal movement.
