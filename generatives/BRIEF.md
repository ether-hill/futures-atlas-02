# Claude Code Brief — Generatives (Generative Visual Lab)

A dashboard for prototyping **generative, algorithmic, and quantum-flavoured visuals** — a smorgasbord of animated pieces built with p5.js, WebGL2/GLSL, three.js and the latest generative-art tooling. The objective is to develop the **visual language of an over-arching quantum-computing futures project**: each piece is a candidate treatment for banner backgrounds, hero sections, and web page visual treatments. Every piece is highly animated and shows the beauty of math, physics, and nature — and, crucially, can be **lifted out as a self-contained embed** and dropped into a real webpage. This brief is the full spec — apply it without further prompting. (Project name: **Generatives**, served at `/generatives`.)

---

## 0. The one non-negotiable principle

**A piece is a pure function `(seed, params, size, time) → frame`, and it is embeddable.** Any visual you make can be copied as an embed snippet and dropped into a banner, reproducing *exactly* — same seed + params + size ⇒ same look, animating in a clean seamless loop. A piece that can't be reproduced from a config, or can't be embedded, is a screensaver, not a treatment.

Build the **config + embed spine first**, then route every piece through it. Beauty is the goal, but beauty that can't be captured, reproduced, resized, and embedded is worthless here. Performance is part of beauty: 60fps at default sizes, loops with no visible seam, scales to any banner resolution.

---

## 1. Stack (decided)

- **Vite + TypeScript**, ESM, strict mode.
- **p5.js** (instance mode only, never global) for fast Canvas2D / particle pieces.
- **WebGL2 + raw GLSL** for shader fields — fragment-shader art, ping-pong feedback (reaction-diffusion, Physarum, fluid), float textures (`EXT_color_buffer_float`). Thin helper (`twgl.js` acceptable) or hand-rolled; no heavyweight engine.
- **three.js** for 3D pieces (particle nebulae, lattices).
- **Noise**: `simplex-noise` (or equivalent) + hand-rolled curl noise, fbm, and domain warping in `core/noise`.
- **Colour**: reuse the OKLCH utilities from the Frond Studio harness (`frond-algorithm-lab` / quantum-sandbox `core/color`). Drive every piece's palette from **theme tokens** so visuals can be brand-matched to the futures project.
- **Seeded PRNG** (`sfc32` + string-hash seed) for reproducibility — **no `Math.random()` in any piece**.
- **WebGPU** as a stretch path for the heaviest sims (feature-detect, fall back to WebGL2).
- **Export**: hi-res PNG, seamless WebM loop, optional GIF. **Embed**: an `<iframe>` to a standalone player route carrying the config in the URL hash.

Reuse Frond Studio harness conventions wherever they exist; the contract below should **extend**, not replace, the existing generative-system pattern (declarative param schema, pure `(seed, params) → output`).

---

## 2. Repo structure

```
generatives/
  index.html              # the dashboard
  embed.html              # the standalone embeddable player (iframe target)
  vite.config.ts          # two entries: dashboard + embed
  src/
    main.ts               # dashboard boot
    embed.ts              # player boot: read config from URL hash → play one piece
    dashboard/
      Dashboard.ts        # gallery grid + detail stage
      Gallery.ts          # live thumbnails of every piece
      Controls.ts         # per-piece panel: params + randomise/restart/resolution/complexity/chaos
      ExportBar.ts         # preview-in-tab, copy-embed, PNG, WebM-loop
      ResolutionPicker.ts  # W/H inputs + banner aspect presets
    runtime/
      Player.ts           # mounts a Piece from a Config; owns the loop; used by dashboard AND embed
      Registry.ts         # id -> Piece factory
    core/
      config.ts           # Config <-> URL hash; build embed iframe snippet
      rng.ts              # sfc32 seeded PRNG
      noise.ts            # simplex, curl, fbm, domain warp
      color/{oklch.ts, theme.ts}
      meta.ts             # the universal complexity/chaos model
      export/capture.ts    # PNG hi-res + seamless WebM loop + GIF
      surface.ts          # canvas2d / webgl2 / three surfaces
    pieces/
      curlFlow.ts  strangeAttractor.ts  phyllotaxis.ts  truchetWeave.ts
      differentialGrowth.ts  moireLattice.ts  particleConstellation.ts  superformula.ts
      domainWarp.ts  reactionDiffusion.ts  physarum.ts  waveInterference.ts
      phaseField.ts  plasma.ts  voronoiCells.ts  cymatics.ts
      particleNebula.ts  latticeWaves.ts
    shaders/
      *.frag / *.vert
```

---

## 3. The `Piece` contract

```ts
type Backend = 'p5' | 'canvas2d' | 'webgl2' | 'three';

interface Config {
  pieceId: string;
  seed: string;
  params: Record<string, ParamValue>;
  size: { w: number; h: number };
  meta: { complexity: number; chaos: number }; // 0..1 universal knobs
  theme: string;                                // palette id
}

interface Piece {
  id: string;
  title: string;
  tags: string[];                 // 'quantum' | 'nature' | 'math' | 'flow' | ...
  backend: Backend;
  schema: ParamSchema;            // medium-level, piece-specific controls
  loopSeconds?: number;           // animation period for a seamless loop (else continuous)

  init(ctx: PieceContext): void | Promise<void>;
  update(dt: number, t: number): void;   // advance; t = loop-phase time
  render(): void;
  resize(w: number, h: number): void;
  reseed(seed: string): void;
  applyMeta(complexity: number, chaos: number): void; // map the universal knobs
  exportFrame(scale: number): Promise<Blob>;          // true re-render at N×
  dispose(): void;
}
```

`PieceContext` provides: the surface/canvas, current size, the seeded `rng`, the noise field, the active theme palette, and the exporter. Every piece must read **`complexity`** (detail / iteration count / particle count / octaves) and **`chaos`** (turbulence / divergence / randomness / temperature) and respond visibly to both — these two sliders are the universal language across the whole gallery.

---

## 4. Shared core modules (build in M0)

- **`core/config.ts`** — encode/decode `Config` ↔ URL hash (base64 JSON). `buildEmbedSnippet(config)` returns an `<iframe>` string pointing at `embed.html#<config>` with width/height. This is the spine: the dashboard and the embeddable player both run the same `Player` from the same `Config`.
- **`runtime/Player.ts`** — given a `Config`, resolve the piece, build its surface at `size`, init, and run the loop (play/pause/seek). The embeddable player (`embed.ts`) is just `Player` with chrome stripped and autoplay on.
- **`core/meta.ts`** — defines how `complexity`/`chaos` normalise (0..1) and helpers for pieces to map them onto their own ranges.
- **`core/rng.ts`** — `sfc32` seeded PRNG + string→seed hash.
- **`core/noise.ts`** — simplex (2D/3D), curl noise, fbm, domain warp — the engine behind most organic pieces.
- **`core/color/`** — OKLCH conversion + a set of **theme palettes** (e.g. `quantum-ink`, `aurora`, `mono`, `spectral`) so a piece's colours can be swapped to match the futures-project brand.
- **`core/export/capture.ts`** — hi-res PNG (re-render at integer scale, not an upscale); **seamless WebM loop** capture (record exactly `loopSeconds`); optional GIF. Filenames encode `{piece}-{seed}-{paramsHash}`.

---

## 5. The pieces (the smorgasbord)

Grouped by tier. Each entry: concept (the beauty) → tech → key params → complexity/chaos mapping → banner notes (loop / alpha / aspect). Pick a spread across **quantum**, **nature**, and **pure-math** so the gallery reads as a real visual language, not one trick.

### Tier A — p5 / Canvas2D (prove the harness, fast wins)
- **`curlFlow`** — curl-noise flow field, thousands of trailing particles. *complexity*=particle count + trail length; *chaos*=noise turbulence + curl strength. Banner: gorgeous wide loops; alpha-trail fades. THE M0 reference piece.
- **`strangeAttractor`** — Clifford / de Jong / Lorenz attractors plotted as density. *complexity*=iterations; *chaos*=parameter jitter. 
- **`phyllotaxis`** — golden-angle spirals, growing/breathing. *complexity*=point count; *chaos*=angle deviation.
- **`truchetWeave`** — animated Truchet tilings / smith chart curves. *complexity*=grid density; *chaos*=tile randomness.
- **`differentialGrowth`** — organic growing lines that repel and subdivide. *complexity*=node budget; *chaos*=growth jitter.
- **`moireLattice`** — interfering line/dot lattices (quantum interference feel). *complexity*=layers; *chaos*=rotation drift.
- **`particleConstellation`** — a network/entanglement graph of drifting nodes with proximity links. *complexity*=node count; *chaos*=velocity. Quantum-flavoured.
- **`superformula`** — animated parametric supershapes. *complexity*=resolution; *chaos*=parameter wander.

### Tier B — WebGL2 / GLSL (the headline visuals)
- **`domainWarp`** — fbm domain-warped noise field, flowing like marbled ink/aurora. *complexity*=octaves; *chaos*=warp amount. Banner gold.
- **`reactionDiffusion`** — Gray–Scott on ping-pong float FBOs; growing coral/labyrinth patterns. *complexity*=resolution; *chaos*=feed/kill jitter.
- **`physarum`** — Physarum (slime-mold) agents on a WebGL2 trail map; emergent networks. *complexity*=agent count; *chaos*=sensor angle/turn noise.
- **`waveInterference`** — multi-source ripple-tank / double-slit interference; ties directly to the quantum theme. *complexity*=source count; *chaos*=phase noise.
- **`phaseField`** — **domain coloring of an evolving complex field** (phase→hue, magnitude→density) — the explicit bridge to the quantum-sandbox visual language. *complexity*=field detail; *chaos*=perturbation.
- **`plasma`** — classic/modern plasma & flow shaders, OKLCH-graded. *complexity*=harmonics; *chaos*=drift.
- **`voronoiCells`** — animated Voronoi / Worley cellular fields, glowing edges. *complexity*=cell count; *chaos*=jitter.
- **`cymatics`** — Chladni / standing-wave nodal figures, morphing modes (physics + nature). *complexity*=mode numbers; *chaos*=superposition mix.

### Tier C — three.js (3D depth pieces)
- **`particleNebula`** — a probability-cloud / orbital point-field in 3D, slow parallax drift (quantum). *complexity*=particles; *chaos*=dispersion.
- **`latticeWaves`** — a 3D lattice rippling under wave functions, camera slowly orbiting. *complexity*=grid; *chaos*=amplitude noise.

---

## 6. Dashboard UI

Two views, dark and gallery-forward; the visuals are the subject.

- **Gallery**: a responsive grid of **live, animated thumbnails** — every piece running small. Tags filter (quantum / nature / math / flow). Click → detail.
- **Detail**: large canvas stage centre; a right rail of **controls**:
  - **Piece params** (Tweakpane, medium-level — the controls that actually shape the look, not every internal).
  - **Randomise** (new seed) and **Restart** (re-init from current config).
  - **Resolution**: width / height inputs + **banner aspect presets** (e.g. 1500×500 hero, 1920×600 wide banner, 2560×1440, 1080×1080 square, 1080×1920 story, "fit screen", custom). The stage re-renders at the chosen size (letterboxed to fit).
  - **Complexity** and **Chaos** universal sliders.
  - **Theme** palette selector.
  - **Preview in tab** — opens `embed.html#<config>` fullscreen at the chosen resolution.
  - **Copy embed code** — copies the `<iframe>` snippet (the exact reproduction).
  - **Export**: PNG (hi-res) · WebM (seamless loop) · GIF.
- Top bar: play / pause / seek, fps + backend readout.

Active piece + full config serialised to the URL hash, so any state is shareable and is exactly what the embed reproduces.

---

## 7. Build order & acceptance

**M0 — Foundation + embed spine.** Scaffold (Vite, dashboard + embed entries); `Piece` contract + Registry; `Config` encode/decode; `Player` runtime; the `embed.html` player; Tweakpane wiring; rng + noise + OKLCH + theme; export (PNG + WebM loop); the universal complexity/chaos plumbing; resolution picker + preview-in-tab + copy-embed. Ship ONE reference piece: **`curlFlow`**.
*Done when:* `curlFlow` animates and loops seamlessly; changing resolution re-renders crisply at banner sizes; **copy-embed produces an `<iframe>` that, pasted into a blank HTML file, reproduces the exact visual**; preview-in-tab opens it fullscreen; same config ⇒ identical output.

**M1 — Tier A (p5/Canvas2D).** The eight Tier-A pieces. *Done when:* each animates, loops, honours complexity/chaos, and embeds.

**M2 — Tier B (WebGL2/GLSL).** The shader fields — the headline "quantum futures" look (`domainWarp`, `reactionDiffusion`, `phaseField`, `waveInterference` first). *Done when:* each holds 60fps at default size, loops, and embeds.

**M3 — Tier C (three.js).** The 3D depth pieces.

## 8. Definition of done (QA)

- Every piece is a pure `(seed, params, size, time) → frame`; same `Config` ⇒ identical look.
- Every piece **animates continuously and loops seamlessly** (no visible seam at the loop point).
- Every piece honours width/height and renders crisply at banner resolutions; 60fps target at default size; graceful degradation on heavy pieces.
- Every piece maps **complexity** and **chaos** to a visible, meaningful change.
- **Copy-embed** yields a self-contained `<iframe>` snippet that reproduces the exact visual; **preview-in-tab** opens it fullscreen at the chosen resolution.
- Colour runs through OKLCH + theme tokens, so any piece can be brand-matched.
- No `Math.random()` anywhere; seeded throughout.
- No console errors; TypeScript strict clean.

**Build first:** the M0 config/embed spine + `curlFlow`, then the M2 shader fields (`domainWarp`, `reactionDiffusion`, `phaseField`) — they carry the headline quantum-futures aesthetic and justify the whole lab.
