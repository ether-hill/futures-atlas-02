/*
  One bumper, drawn: background, mark, words. Shared by index.html (one big,
  and what render.mjs records) and grid.html (every background side by side).

  Needs, loaded first: ../../public/interference/field.js (window.FIELD) and
  build/gen.js (window.GEN, the Generatives pieces; node build-gen.mjs).

  The mark is drawn by the logo animator's own engine, fetched from
  tools/logo-animator and run here, so the two cannot drift apart. Each motion
  is driven by eased whole turns over a fixed window, so the first and last
  frames of the mark are the logo at rest, pixel for pixel.
*/
window.BUMPERS = (function () {
  "use strict";

  var W = 1080, H = 1920, FPS = 30, DUR = 4;
  // the mark moves inside this window and is the logo before and after it
  var M0 = 0.1, M1 = 1.6;
  // the words arrive while the mark is still settling
  var WORDS = [0.5, 0.75, 0.95], RISE = 0.4;
  var LOGO = 500, CY = 760;
  var INK = "#17181b";

  function clamp(x) { return Math.max(0, Math.min(1, x)); }
  function smooth(x) { x = clamp(x); return x * x * (3 - 2 * x); }
  function ease(x) { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function blinkAt(t, at, len) {
    var b = (t - at) / len;
    if (b <= 0 || b >= 1) return 0;
    return b < 0.42 ? smooth(b / 0.42) : 1 - smooth((b - 0.42) / 0.58);
  }

  /* ------------------------------------------------------------- the mark */
  var E = null;
  async function loadEngine() {
    if (E) return E;
    var html = await (await fetch("../logo-animator/index.html")).text();
    var src = html.slice(html.indexOf("// >>> ENGINE"), html.indexOf("// <<< ENGINE"));
    // two hooks the animator does not need: a blink amount set from outside, and
    // the centre circle eased in and out of the plate
    src = src.replace("function blinkClose(t) {", "function blinkClose(t) {\n    if (scene.close != null) return scene.close;");
    src = src.replace("var carry = function (p) { return view(f(shift(p))); };",
      "var mixd = scene.plateMix == null ? 1 : scene.plateMix;\n" +
      "    var carry = function (p) { var a = view(shift(p)), b = view(f(shift(p))); " +
      "return [a[0] + (b[0] - a[0]) * mixd, a[1] + (b[1] - a[1]) * mixd, a[2] + (b[2] - a[2]) * mixd]; };");
    if (src.indexOf("scene.close") < 0 || src.indexOf("plateMix") < 0) throw new Error("engine hooks did not apply");
    E = new Function(src + "\nreturn { get els() { return els; }, scene: scene, drawScene: drawScene, set: set, MARK: MARK," +
      " RING: RING, LINE: LINE, CORE: CORE, BLINK: BLINK, SPHERE: SPHERE," +
      " setT: function (v) { T = v; }, reset: function () { base(false); } };")();
    return E;
  }

  var MOTIONS = {
    ringline: { name: "Ring and line", setup: function () {
      E.set(E.els, E.RING, { axisA: E.MARK.ringLean, axisB: 0 });
      E.set(E.els, E.LINE, { axisA: 0, axisB: 90 });
    }, set: function (u) {
      E.els[E.RING].phase = 360 * ease(u);
      E.els[E.LINE].phase = -360 * ease(u);
    } },
    coinflip: { name: "Coin flip", setup: function () {
      E.scene.plate = true;
      E.set(E.els, E.RING, { axisA: E.MARK.ringLean + 90, axisB: 0 });
    }, set: function (u) {
      // mid-flip the centre circle lies in the plate; it eases in and out so the
      // logo never jumps at either end
      E.scene.plateMix = smooth(u / 0.18) * smooth((1 - u) / 0.18);
      E.els[E.RING].phase = 720 * ease(u);
    } },
    edgeball: { name: "Edge on, ball centre", setup: function () {
      E.scene.plate = true; E.scene.coreSolid = true;
      E.set(E.els, E.RING, { axisA: E.MARK.ringLean, axisB: 0 });
    }, set: function (u) {
      E.els[E.RING].phase = 360 * ease(u);
    } },
    blink: { name: "Blink", setup: function () { E.els[E.BLINK].spin = true; }, set: function (u, s) {
      E.scene.close = blinkAt(s, 0.3, 0.34) + blinkAt(s, 0.95, 0.34);
    } },
    iris: { name: "Iris", setup: function () { E.els[E.BLINK].spin = true; }, set: function (u, s) {
      // opens wide, shuts like a shutter, holds, opens back to the logo
      var wide = smooth(s / 0.3) * (1 - smooth((s - 1.0) / 0.45));
      E.els[E.RING].tilt = E.MARK.ringTilt + (20 - E.MARK.ringTilt) * wide;
      E.scene.close = smooth((s - 0.32) / 0.28) * (1 - smooth((s - 0.85) / 0.45));
    } }
  };
  var MOTION_ORDER = ["ringline", "coinflip", "edgeball", "blink", "iris"];

  var markCanvas = document.createElement("canvas");
  function drawMark(motion, t, px) {
    if (markCanvas.width !== px) { markCanvas.width = markCanvas.height = px; }
    var mctx = markCanvas.getContext("2d");
    E.reset();
    E.scene.guide = "none";
    E.scene.close = null;
    E.scene.plateMix = 1;
    MOTIONS[motion].setup();
    var s = t - M0, span = M1 - M0;
    MOTIONS[motion].set(clamp(s / span), Math.max(0, Math.min(span, s)));
    E.setT(0);
    E.drawScene(mctx, px, { n: 720 });
    return markCanvas;
  }

  /* --------------------------------------------------------- backgrounds */
  // Rendered small and scaled up: soft is right for something meant to sit
  // behind the words, and every tile in the grid can afford to run live.
  var BW = 540, BH = 960;
  var LOOP_FADE = 1.2;
  var POST_LOOP = 271 / 30;  // the Futures in Figures videos' loop, in seconds
  var SITEART = null;
  var BACKGROUNDS = [
    { id: "none", name: "Plain" },
    { id: "i:wavefronts", name: "Wavefronts", from: "Interference", slug: "wavefronts", pal: 0 },
    { id: "i:ripple-tank", name: "Ripple tank", from: "Interference", slug: "ripple-tank", pal: 0 },
    { id: "i:nodal-lines", gain: 0.45, name: "Nodal lines", from: "Interference", slug: "nodal-lines", pal: 0 },
    { id: "i:contours", gain: 0.55, name: "Contours", from: "Interference", slug: "contours", pal: 3 },
    { id: "i:moire", gain: 0.8, name: "Moiré", from: "Interference", slug: "moire", pal: 3 },
    { id: "i:thin-film", gain: 0.6, name: "Thin film", from: "Interference", slug: "thin-film", pal: 0 },
    { id: "i:droplets", name: "Droplets", from: "Interference", slug: "droplets", pal: 0 },
    { id: "p:qubits", gain: 1, pool: false, name: "Qubits post", from: "Futures in Figures: Qubits vs quality", post: "qubits",
      box: [0, 0, 1080, 1350], corner: { cx: 1.02, cy: 0.02, r: 0.6 } },
    // The same mesh laid out for the bumper rather than for the post. The box
    // keeps the post's 1080x1350 proportions, so the grid has the post's fine
    // scale; it is centred on the mark, and for "full" scaled up to fill.
    { id: "p:qubits-centre", gain: 1, pool: false, name: "Qubits mesh, centred", from: "Futures in Figures: Qubits vs quality", post: "qubits",
      box: [0, 85, 1080, 1350], corner: { cx: 0.5, cy: 0.49, r: 0.55 } },
    { id: "p:qubits-full", gain: 1, pool: false, name: "Qubits mesh, full frame", from: "Futures in Figures: Qubits vs quality", post: "qubits",
      box: [-228, 0, 1536, 1920], corner: { cx: 0.5, cy: 0.47, r: 0.9 } },
    { id: "g:domain-warp", name: "Domain warp", from: "Generatives", gen: "domain-warp" },
    { id: "g:wave-interference", gain: 0.7, name: "Wave interference", from: "Generatives", gen: "wave-interference" },
    { id: "g:lattice-waves", gain: 1.3, name: "Lattice waves", from: "Generatives", gen: "lattice-waves" },
    { id: "g:curl-flow", gain: 1.3, name: "Curl flow", from: "Generatives", gen: "curl-flow" },
    { id: "g:physarum", gain: 2.0, name: "Physarum", from: "Generatives", gen: "physarum" },
    { id: "g:particle-constellation", gain: 2.0, name: "Constellation", from: "Generatives", gen: "particle-constellation" },
    { id: "g:organic-turbulence", gain: 2.0, name: "Organic turbulence", from: "Generatives", gen: "organic-turbulence" },
    { id: "g:moire-lattice", gain: 1.6, name: "Moiré lattice", from: "Generatives", gen: "moire-lattice" }
  ];
  // Generatives in the Atlas blue, dark end on the bumper's own ground
  var GEN_COLORS = { bg: INK, lo: "#1f4f7a", hi: "#8cc4ea" };

  function makeBackground(def) {
    if (!def || def.id === "none") return null;
    if (def.slug) {
      var v = window.FIELD.bySlug(def.slug), r = window.FIELD.renderer();
      var stops = window.FIELD.PALETTES[def.pal].stops;
      var c = document.createElement("canvas"); c.width = BW; c.height = BH;
      var x = c.getContext("2d");
      function paint(ft, alpha) {
        r.draw(v, ft, BW, BH, stops, false);
        x.globalAlpha = alpha;
        x.drawImage(r.canvas, 0, r.srcY(BH), BW, BH, 0, 0, BW, BH);
        x.globalAlpha = 1;
      }
      return {
        canvas: c,
        // a field is a function of time, so moving or still is just which t.
        // With `loop`, the last LOOP_FADE seconds blend into the field as it was
        // one bumper-length earlier, so frame DUR is frame 0 exactly and the
        // clip repeats with no seam, at the speed the grid shows.
        draw: function (t, loop) {
          paint(t * 0.6, 1);
          if (!loop) return;
          var a = smooth((t - (DUR - LOOP_FADE)) / LOOP_FADE);
          if (a > 0) paint((t - DUR) * 0.6, a);
        },
        dispose: function () {}
      };
    }
    if (def.post) {
      // The Qubits vs quality post's own background: site-art.js latticeWaves
      // with the exact arguments that post's Instagram slide uses, drawn in the
      // same 1080x1350 box at the top of the frame, so the mesh sits where it
      // sat on the post and the cut from post to bumper doesn't move it. It
      // runs at the post's speed (its loop is 271 frames).
      // box: where on the 1080x1920 frame the art is drawn; corner: the
      // latticeWaves anchor and fade, in that box's own fractions
      var A = SITEART, PW = def.box[2], PH = def.box[3];
      var fc = document.createElement("canvas"); fc.width = PW * 2; fc.height = PH * 2;
      var fx = fc.getContext("2d");
      var paintPost = function (ft, alpha) {
        fx.save(); fx.globalAlpha = alpha; fx.scale(2, 2);
        A.setLoop(POST_LOOP);
        A.latticeWaves(fx, PW, PH, ft, { corner: def.corner });
        fx.restore();
      };
      return {
        canvas: fc, box: def.box,
        draw: function (t, loop) {
          fx.clearRect(0, 0, fc.width, fc.height);
          // lines on a clear layer: the two moments are weighted 1-a and a, so
          // at the end only the opening frame is left
          var a = loop ? smooth((t - (DUR - LOOP_FADE)) / LOOP_FADE) : 0;
          if (a < 1) paintPost(t, 1 - a);
          if (a > 0) paintPost(t - DUR + POST_LOOP, a);
        },
        dispose: function () {}
      };
    }
    // Generatives pieces are simulations with state: they are stepped forward
    // one fixed frame at a time, and warmed up first so frame 0 is not empty
    var p = window.GEN.mount(def.gen, BW, BH, { colors: GEN_COLORS, seed: "futures-atlas" });
    for (var i = 0; i < 45; i++) p.step(1 / FPS);
    var last = 0;
    return {
      canvas: p.canvas,
      draw: function (t) {
        var dt = t - last; last = t;
        if (dt > 0) p.step(Math.min(dt, 0.1));
      },
      dispose: function () { p.dispose(); }
    };
  }

  /* -------------------------------------------------------------- the frame */
  function text(ctx, str, x, y, size, weight, colour, alpha, spacing) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = weight + " " + size + "px Archivo";
    ctx.letterSpacing = (spacing || 0) + "px";
    ctx.textAlign = "center";
    ctx.fillStyle = colour;
    ctx.fillText(str, x, y);
    ctx.restore();
  }

  /**
   * A bumper on a canvas of any 9:16 size.
   * opts: motion, bg (id), still (bool: background frozen), strength (0..1), cta
   */
  function create(canvas, opts) {
    var ctx = canvas.getContext("2d");
    var o = Object.assign({ motion: "ringline", bg: "i:wavefronts", still: false, strength: 0.45, cta: "Explore more at", staticText: false }, opts);
    var bgDef = BACKGROUNDS.filter(function (b) { return b.id === o.bg; })[0];
    var bg = makeBackground(bgDef);
    var stillDone = false;

    // t is the bumper's own clock; bgT lets a looping preview keep the
    // background running on rather than jumping back with every replay
    function draw(t, bgT) {
      if (bgT == null) bgT = t;
      var k = canvas.width / W;
      ctx.setTransform(k, 0, 0, k, 0, 0);
      ctx.fillStyle = INK;
      ctx.fillRect(0, 0, W, H);

      if (bg) {
        if (!o.still) bg.draw(bgT, o.loop);
        else if (!stillDone) { bg.draw(2.2); stillDone = true; }
        ctx.save();
        // gain evens the backgrounds out, so one strength reads alike on each
        ctx.globalAlpha = Math.min(1, o.strength * (bgDef && bgDef.gain || 1));
        var box = bg.box || [0, 0, W, H];
        ctx.drawImage(bg.canvas, box[0], box[1], box[2], box[3]);
        ctx.restore();
        if (bgDef.pool !== false) {
        // a soft pool of the ground colour behind the mark and the words, so
        // the background stays at the edges and never under a letter
        var g = ctx.createRadialGradient(W / 2, CY + 260, 80, W / 2, CY + 260, 820);
        g.addColorStop(0, "rgba(23,24,27,0.82)");
        g.addColorStop(0.55, "rgba(23,24,27,0.5)");
        g.addColorStop(1, "rgba(23,24,27,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
        }
      }

      var px = Math.round(LOGO * k);
      ctx.drawImage(drawMark(o.motion, t, px), (W - LOGO) / 2, CY - LOGO / 2, LOGO, LOGO);

      function rise(at) { return o.staticText ? 1 : smooth((t - at) / RISE); }
      var a1 = rise(WORDS[0]), a2 = rise(WORDS[1]), a3 = rise(WORDS[2]);
      text(ctx, "Futures Atlas", W / 2, CY + LOGO / 2 + 150 + 22 * (1 - a1), 92, 700, "#f2ede2", a1, -2);
      text(ctx, o.cta, W / 2, CY + LOGO / 2 + 330 + 22 * (1 - a2), 46, 500, "#b4b6bc", a2, 0);
      text(ctx, "futures-atlas.com", W / 2, CY + LOGO / 2 + 420 + 22 * (1 - a3), 68, 700, "oklch(0.68 0.13 245)", a3, -1);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    return {
      draw: draw,
      set: function (key, val) { o[key] = val; if (key === "still") stillDone = false; },
      dispose: function () { if (bg) bg.dispose(); }
    };
  }

  function ready() {
    return Promise.all([import("../../dataviz/templates/site-art.js").then(function (m) { SITEART = m; }), loadEngine(), document.fonts.load("700 92px Archivo"), document.fonts.load("500 46px Archivo")]);
  }

  return { W: W, H: H, FPS: FPS, DUR: DUR, MOTIONS: MOTIONS, MOTION_ORDER: MOTION_ORDER, BACKGROUNDS: BACKGROUNDS, create: create, ready: ready };
})();
