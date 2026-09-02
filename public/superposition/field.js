/*
  Superposition — five branching processes from the natural world.

  The companion to /interference, and built the same way: one file of physics,
  one page of furniture, no images and no video. The difference is what is being
  drawn. Interference evaluates a wave equation per pixel, so every field there
  is periodic and can be scrubbed. Nothing here is. These are GROWTH processes —
  they have a history rather than a period, they are stochastic, and the control
  that matters is the seed, not the clock.

  THE HONEST PART, which the page says out loud and which these notes must not
  quietly walk back: none of this is a quantum superposition. A branching river
  is not in several channels at once; it is in all of them, really, at the same
  time, which is an ordinary fact about water. What these patterns are good for
  is the OTHER half of the idea — the possibility space, the set of routes a
  process could take, drawn all at once so you can see its shape. They are a
  picture of the option set, not of a fuzzy object. Every field's read panel is
  required to say which of those two it is showing.

  All five are 2-D canvas simulations sharing one loop. A variant supplies:
    seed(st, w, h, rnd)   build the initial state
    step(st, dt, rnd)     advance it
    paint(ctx, st, w, h, stops)   draw the whole frame
*/
window.SUPER = (function () {
  "use strict";

  function hexToRgb(h) {
    var m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h.trim());
    return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : null;
  }
  function rgbToCss(c) { return "rgb(" + c[0] + "," + c[1] + "," + c[2] + ")"; }
  function mix(a, b, t) {
    return [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t)];
  }
  /* the palette as a ramp, 0 = ground, 1 = brightest — same contract as /interference */
  function ramp(stops, x) {
    x = x < 0 ? 0 : x > 1 ? 1 : x;
    var n = stops.length - 1, i = Math.min(n - 1, Math.floor(x * n));
    return mix(stops[i], stops[i + 1], x * n - i);
  }
  function rampCss(stops, x) { return rgbToCss(ramp(stops, x)); }

  var PALETTES = [
    { name: "Ice",       stops: ["#050710", "#141f4f", "#246a86", "#78d6c9", "#fcf5df"].map(hexToRgb) },
    { name: "Ember",     stops: ["#0a0405", "#3a0f14", "#94301c", "#e8853c", "#fff0c4"].map(hexToRgb) },
    { name: "Verdigris", stops: ["#040a08", "#0a2624", "#116655", "#66c68a", "#f5faec"].map(hexToRgb) },
    { name: "Bone",      stops: ["#070708", "#232326", "#59595e", "#a8a8a4", "#fbfaf6"].map(hexToRgb) }
  ];

  function rampFromHex(hex) {
    var c = hexToRgb(hex);
    if (!c) return null;
    var dark = [Math.round(c[0] * 0.06), Math.round(c[1] * 0.07), Math.round(c[2] * 0.10)];
    return [dark, mix(dark, c, 0.45), c, mix(c, [255, 255, 255], 0.45), mix(c, [255, 255, 255], 0.9)];
  }

  /* a seeded generator, so Reseed is repeatable and a field can be returned to */
  function mulberry(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  var TAU = Math.PI * 2;

  /* ============================================================= 1. mycelium */
  /*
     A tip walks, and at intervals it splits. Both children keep going, so the
     colony spreads into every direction at once rather than choosing. What is
     drawn is the whole search: every route the front has tried, thinning with
     age so the record of where it has been stays legible under where it is now.
  */
  var mycelium = {
    slug: "mycelium",
    title: "Mycelium",
    note: "A growing front that splits rather than chooses. The drawing is every route it has tried.",
    read: [
      ["What you are seeing",
       "One tip, at the centre, walking outward. Every so often it divides and both halves carry on, so the colony spreads into the whole space instead of picking a direction. The bright ends are the live front. Everything behind them is a record: the paths already taken, left in place and fading, so that what you end up looking at is the search itself rather than its result."],
      ["What it is not",
       "This is not a quantum superposition and the panel will not pretend otherwise. A fungus really is in all of those corridors, simultaneously and unmysteriously, in the way any spread-out object is in more than one place. What it shares with the quantum picture is narrower and more useful: the shape of a POSSIBILITY SPACE. Every branch is a route the organism could commit to, drawn at the same time, and the interesting quantity is the set, not any one line in it. Real slime moulds and fungi do go on to thicken the routes that pay and abandon the rest, which is a decision made after the exploring, not during it."],
      ["How it is built",
       "A list of tips, each with a position and a heading. Every step a tip moves a little, turns by a small random amount, and with a low probability splits in two with the children leaning either side of the parent. Tips die when they wander off the panel or when the colony reaches its cap, which is what stops it filling solid. Nothing is stored per pixel: the trail you see is the canvas itself, painted over with a faint wash each frame so old growth loses contrast without ever quite disappearing."]
    ],
    seed: function (st, w, h, rnd) {
      st.tips = [];
      var n = 5;
      for (var i = 0; i < n; i++) {
        st.tips.push({ x: w / 2, y: h / 2, a: (i / n) * TAU + rnd() * 0.6, w: 2.6, age: 0 });
      }
      st.count = n;
      st.wash = true;
    },
    step: function (st, dt, rnd, w, h) {
      var next = [];
      for (var i = 0; i < st.tips.length; i++) {
        var t = st.tips[i];
        t.px = t.x; t.py = t.y;
        var v = 46 * dt;
        t.a += (rnd() - 0.5) * 2.6 * dt * 6;
        t.x += Math.cos(t.a) * v;
        t.y += Math.sin(t.a) * v;
        t.age += dt;
        t.w = Math.max(0.5, 2.6 - t.age * 0.5);
        if (t.x < -20 || t.y < -20 || t.x > w + 20 || t.y > h + 20) continue;
        next.push(t);
        if (st.count < 900 && rnd() < 0.9 * dt * 6) {
          var spread = 0.5 + rnd() * 0.5;
          next.push({ x: t.x, y: t.y, px: t.x, py: t.y, a: t.a + spread, w: t.w * 0.85, age: t.age });
          t.a -= spread * 0.6;
          st.count++;
        }
      }
      st.tips = next;
    },
    paint: function (ctx, st, w, h, stops) {
      ctx.fillStyle = rampCss(stops, 0.0);
      /*
        A very light wash. The panel's whole claim is that what you are looking
        at is the RECORD of every route tried, so the record has to survive: at
        0.035 the colony had erased its own history within a few seconds and
        settled into a dim ring with a hollow middle.
      */
      ctx.globalAlpha = 0.010;
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1;
      ctx.lineCap = "round";
      for (var i = 0; i < st.tips.length; i++) {
        var t = st.tips[i];
        if (t.px === undefined) continue;
        ctx.strokeStyle = rampCss(stops, 0.42 + Math.min(0.55, t.w * 0.2));
        ctx.lineWidth = t.w;
        ctx.beginPath(); ctx.moveTo(t.px, t.py); ctx.lineTo(t.x, t.y); ctx.stroke();
      }
    }
  };

  /* =========================================================== 2. river delta */
  /*
     A flow losing its gradient. Each channel carries a discharge; where it
     splits, the discharge divides, and a channel too small to carry anything
     stops. Width follows discharge, which is why the picture thins downstream.
  */
  var delta = {
    slug: "delta",
    title: "River delta",
    note: "One flow losing its gradient, dividing until no channel is left to divide.",
    read: [
      ["What you are seeing",
       "A single channel arriving at the top with all of the water in it, and a shoreline at the bottom. As the gradient runs out the flow cannot hold one bed, so it splits, and splits again, each channel carrying a share of what came into it. Width follows discharge, so the trunk is broad and the last threads are hairlines. A channel whose share drops below what it needs to move sediment simply stops."],
      ["What it is not",
       "Water is not exploring alternatives here. Every channel is carrying real water at the same time, and the division is a matter of slope and sediment rather than of choice. What the panel is for is the shape it leaves: a fan of every route the flow found from one point to a whole coastline, drawn together. That fan is a possibility space in the only sense that survives translation — the set of paths available between a source and a boundary — and the reason it is worth putting beside a quantum picture is that the interesting object is the branching structure, not any single thread in it."],
      ["How it is built",
       "A queue of channel segments. Each carries a discharge, a heading biased downhill, and a width proportional to the square root of its discharge, which is roughly how real channels scale. A segment advances, wanders slightly, and splits with a probability that rises as its gradient falls; the two children divide the discharge unevenly, because an even split is the one thing deltas never do. Below a threshold discharge a channel is dropped."]
    ],
    seed: function (st, w, h, rnd) {
      st.ch = [{ x: w * (0.35 + rnd() * 0.3), y: -8, a: Math.PI / 2, q: 1, len: 0 }];
      st.done = [];
      st.wash = false;
      st.fresh = true;
    },
    step: function (st, dt, rnd, w, h) {
      var next = [];
      for (var i = 0; i < st.ch.length; i++) {
        var c = st.ch[i];
        c.px = c.x; c.py = c.y;
        var v = 30 * dt;
        c.a += (rnd() - 0.5) * 3.2 * dt * 6;
        c.a += (Math.PI / 2 - c.a) * 0.35 * dt;     // gravity pulls down, but weakly enough to let it spread
        c.x += Math.cos(c.a) * v;
        c.y += Math.sin(c.a) * v;
        c.len += v;
        if (c.y > h + 10 || c.x < -30 || c.x > w + 30 || c.q < 0.012) continue;
        next.push(c);
        // the flatter it gets, the readier it is to divide
        var flat = Math.min(1, c.y / h);
        if (rnd() < (0.35 + 1.5 * flat) * dt * 6 && c.q > 0.03 && next.length < 420) {
          var share = 0.32 + rnd() * 0.26;          // never an even split
          var spread = 0.5 + rnd() * 0.55;
          next.push({ x: c.x, y: c.y, px: c.x, py: c.y, a: c.a + spread, q: c.q * share, len: 0 });
          c.a -= spread * (1 - share) / share * 0.5;
          c.q *= (1 - share);
        }
      }
      st.ch = next;
    },
    paint: function (ctx, st, w, h, stops) {
      if (st.fresh) { ctx.fillStyle = rampCss(stops, 0.02); ctx.fillRect(0, 0, w, h); st.fresh = false; }
      ctx.lineCap = "round";
      for (var i = 0; i < st.ch.length; i++) {
        var c = st.ch[i];
        if (c.px === undefined) continue;
        ctx.strokeStyle = rampCss(stops, 0.30 + Math.sqrt(c.q) * 0.62);
        ctx.lineWidth = Math.max(0.6, Math.sqrt(c.q) * 13);
        ctx.beginPath(); ctx.moveTo(c.px, c.py); ctx.lineTo(c.x, c.y); ctx.stroke();
      }
    }
  };

  /* ============================================================ 3. breakdown */
  /*
     Dielectric breakdown, the Niemeyer-Pietronero-Wiesmann model: a discharge
     grows into the site where the field is strongest, with the probability of
     each candidate site weighted by the local potential raised to a power. It
     is the cleanest natural picture of the thing this project is about — every
     unlit site is a route the discharge could take, and exactly one of them
     ends up carrying it.
  */
  var breakdown = {
    slug: "breakdown",
    title: "Breakdown",
    note: "Every site the discharge could reach, and the one it does. The rest never happen.",
    read: [
      ["What you are seeing",
       "A discharge growing from a point towards the edge. At every moment there is a rim of candidate sites, each one somewhere the next step could go, and each is weighted by how strong the field is there. One is chosen and lights up; the others stay dark and are still candidates next time, or stop being candidates at all. Watch the rim rather than the branch and you are watching a set of options being narrowed."],
      ["What it is not",
       "Nothing here is in two states at once. The discharge has a definite shape at every instant, and the candidate rim is bookkeeping — our uncertainty about which site is next, not the spark's. The reason this panel is the centre of the argument is that it shows the distinction cleanly: the POSSIBILITY SPACE is real and has a shape you can draw, and it is a different object from the thing that eventually happens. Conflating the two is the mistake the whole page is trying to avoid."],
      ["How it is built",
       "A lattice. The potential is relaxed towards zero on the discharge and one at the boundary by repeated averaging, a few sweeps per frame rather than to convergence, which is enough to steer the growth and cheap enough to run live. Candidate sites are the unburnt neighbours of the burnt set, and one is drawn at random with probability proportional to its potential raised to eta. Eta is the whole character of the pattern: at 1 it is a fairly open bush, and higher values make it sparse and lightning-like."]
    ],
    seed: function (st, w, h, rnd) {
      var N = st.N = 132;
      st.pot = new Float32Array(N * N);
      st.burnt = new Uint8Array(N * N);
      for (var i = 0; i < N * N; i++) st.pot[i] = 1;
      var c = ((N >> 1) * N) + (N >> 1);
      st.burnt[c] = 1; st.pot[c] = 0;
      st.newly = [c];
      st.eta = 2.2;
      st.fresh = true;
      st.stalled = false;
    },
    step: function (st, dt, rnd, w, h) {
      var N = st.N, pot = st.pot, burnt = st.burnt;
      // a few relaxation sweeps: not to convergence, just enough to steer
      for (var s = 0; s < 3; s++) {
        for (var y = 1; y < N - 1; y++) {
          for (var x = 1; x < N - 1; x++) {
            var i = y * N + x;
            if (burnt[i]) { pot[i] = 0; continue; }
            pot[i] = 0.25 * (pot[i - 1] + pot[i + 1] + pot[i - N] + pot[i + N]);
          }
        }
      }
      var grow = Math.max(1, Math.round(60 * dt));
      st.newly = [];
      for (var g = 0; g < grow; g++) {
        // the candidate rim, weighted by potential^eta
        var cand = [], wsum = 0;
        for (var yy = 1; yy < N - 1; yy++) {
          for (var xx = 1; xx < N - 1; xx++) {
            var j = yy * N + xx;
            if (burnt[j]) continue;
            if (!(burnt[j - 1] || burnt[j + 1] || burnt[j - N] || burnt[j + N])) continue;
            var p = Math.pow(Math.max(0, pot[j]), st.eta);
            if (p <= 0) continue;
            cand.push(j); wsum += p;
          }
        }
        if (!cand.length || wsum <= 0) { st.stalled = true; return; }
        var r = rnd() * wsum, acc = 0, pick = cand[cand.length - 1];
        for (var k = 0; k < cand.length; k++) {
          acc += Math.pow(Math.max(0, pot[cand[k]]), st.eta);
          if (acc >= r) { pick = cand[k]; break; }
        }
        burnt[pick] = 1; pot[pick] = 0;
        st.newly.push(pick);
        var py = (pick / N) | 0, px = pick % N;
        if (px < 3 || py < 3 || px > N - 4 || py > N - 4) { st.stalled = true; return; }
      }
    },
    paint: function (ctx, st, w, h, stops) {
      /*
        Repainted whole every frame from the lattice, not accumulated.
        Translucent fills over the canvas were the first attempt and they build
        up: a 12% wash applied sixty times a second is an opaque one within a
        second, so the panel turned into a flat blue rectangle with a faint
        scribble on it. 17k cells is nothing to redraw.
      */
      var N = st.N, cw = w / N, ch = h / N, burnt = st.burnt, pot = st.pot;
      ctx.fillStyle = rampCss(stops, 0.02);
      ctx.fillRect(0, 0, w, h);
      // the candidate rim: every site the discharge could take next
      for (var y = 1; y < N - 1; y++) {
        for (var x = 1; x < N - 1; x++) {
          var j = y * N + x;
          if (burnt[j]) continue;
          if (!(burnt[j - 1] || burnt[j + 1] || burnt[j - N] || burnt[j + N])) continue;
          ctx.fillStyle = rampCss(stops, 0.26 + Math.min(0.40, pot[j] * 1.6));
          ctx.fillRect(x * cw, y * ch, cw, ch);
        }
      }
      // and the one that did
      ctx.fillStyle = rampCss(stops, 0.93);
      for (var k = 0; k < N * N; k++) {
        if (!burnt[k]) continue;
        ctx.fillRect((k % N) * cw, ((k / N) | 0) * ch, cw * 1.05, ch * 1.05);
      }
    }
  };

  /* ========================================================== 4. crack front */
  /*
     A crack running through a brittle sheet, splitting where it runs too fast.
     Branching in fracture is a real threshold effect: past about half the
     Rayleigh wave speed a single crack becomes unstable and divides.
  */
  var fracture = {
    slug: "fracture",
    title: "Fracture",
    note: "A crack running too fast to stay single. Each branch is a route the stress could take.",
    read: [
      ["What you are seeing",
       "A crack starting at one edge and running across a brittle sheet. Slow cracks stay single; a crack driven hard enough becomes unstable and divides, and the daughters divide in turn, which is why a shattered pane has a branching pattern rather than one long split. The tips are bright and the opened material behind them stays."],
      ["What it is not",
       "There is nothing indeterminate about a crack. It goes where the stress field sends it, and if you knew the sheet perfectly you could say where. The branching is real division, not superposed alternatives. What earns it a place here is that a fracture pattern is the most legible everyday record of a possibility space being resolved: the whole tree is visible at once in the finished pane, so you can see every route the failure took and, by implication, the far larger set it did not."],
      ["How it is built",
       "Tips with a speed and a heading. Speed rises while a tip is loaded and drops after it splits, which is the instability in miniature: above a threshold fraction of the sheet's wave speed, a tip divides into two at a shallow angle and both slow down. Headings are perturbed by a smooth noise field standing in for the grain of the material, so a crack curves the way a real one does rather than running straight."]
    ],
    seed: function (st, w, h, rnd) {
      st.tips = [{ x: 0, y: h * (0.35 + rnd() * 0.3), a: 0, v: 0.42, age: 0 }];
      st.n = 1;
      st.fresh = true;
      st.gx = rnd() * 100;
    },
    step: function (st, dt, rnd, w, h) {
      var next = [];
      for (var i = 0; i < st.tips.length; i++) {
        var t = st.tips[i];
        t.px = t.x; t.py = t.y;
        t.v = Math.min(1.35, t.v + 1.5 * dt);          // loading up
        var speed = 88 * t.v * dt;
        // a smooth grain, so the crack curves rather than running straight
        t.a += (Math.sin(t.x * 0.008 + st.gx) + Math.cos(t.y * 0.011 - st.gx)) * 0.055 * dt * 3;
        t.a += (rnd() - 0.5) * 0.07 * dt * 3;
        t.x += Math.cos(t.a) * speed;
        t.y += Math.sin(t.a) * speed;
        t.age += dt;
        if (t.x < -10 || t.y < -10 || t.x > w + 10 || t.y > h + 10) continue;
        next.push(t);
        // past the instability threshold a single crack cannot stay single
        if (t.v > 1.05 && st.n < 300 && rnd() < 1.5 * dt) {
          var half = 0.22 + rnd() * 0.16;
          next.push({ x: t.x, y: t.y, px: t.x, py: t.y, a: t.a + half, v: 0.55, age: t.age });
          t.a -= half; t.v = 0.42;
          st.n++;
        }
      }
      st.tips = next;
    },
    paint: function (ctx, st, w, h, stops) {
      if (st.fresh) { ctx.fillStyle = rampCss(stops, 0.03); ctx.fillRect(0, 0, w, h); st.fresh = false; }
      ctx.lineCap = "round";
      for (var i = 0; i < st.tips.length; i++) {
        var t = st.tips[i];
        if (t.px === undefined) continue;
        ctx.strokeStyle = rampCss(stops, 0.45 + t.v * 0.45);
        ctx.lineWidth = Math.max(0.7, 2.4 - t.age * 0.28);
        ctx.beginPath(); ctx.moveTo(t.px, t.py); ctx.lineTo(t.x, t.y); ctx.stroke();
      }
    }
  };

  /* ========================================================== 5. murmuration */
  /*
     Boids, drawn as the volume they might occupy rather than as birds. The
     flock has not settled: the same three rules admit an enormous number of
     configurations, and what is worth looking at is the envelope of them.
  */
  var murmuration = {
    slug: "murmuration",
    title: "Murmuration",
    note: "A flock before it settles. The same rules, an enormous number of shapes that satisfy them.",
    read: [
      ["What you are seeing",
       "A few hundred birds obeying three rules that have been known since 1986: steer away from anyone too close, match the heading of your neighbours, and drift towards the middle of them. Nobody is leading and nobody has a plan for the shape. The cloud is drawn with a long exposure, so what accumulates is not where the birds are but where they have lately been, which is the more honest picture of a flock."],
      ["What it is not",
       "Every bird has one position. The flock is not smeared across its options and there is no sense in which it occupies several shapes at once, so the analogy to a superposed state is decoration if you push on it. What survives is this: the rules do not fix the shape, they fix a very large family of shapes, and the family has structure you can see. Watching the envelope rather than the birds is the closest a starling comes to being a distribution, and a distribution is what the quantum picture is really about."],
      ["How it is built",
       "Standard Reynolds boids on a torus, so the flock never hits a wall. Each bird looks at neighbours within a radius, sums a separation, an alignment and a cohesion term, clamps its turn rate and moves. The trail is the canvas washed with a translucent ground each frame rather than any per-bird history, which is why the densest parts of the cloud are simply the places most passed through."]
    ],
    seed: function (st, w, h, rnd) {
      st.b = [];
      for (var i = 0; i < 320; i++) {
        st.b.push({ x: rnd() * w, y: rnd() * h, a: rnd() * TAU, v: 44 + rnd() * 18 });
      }
      st.wash = true;
    },
    step: function (st, dt, rnd, w, h) {
      var b = st.b, R = 42, R2 = R * R, SEP = 15, SEP2 = SEP * SEP;
      for (var i = 0; i < b.length; i++) {
        var p = b[i], sx = 0, sy = 0, ax = 0, ay = 0, cx = 0, cy = 0, n = 0;
        for (var j = 0; j < b.length; j++) {
          if (j === i) continue;
          var q = b[j], dx = q.x - p.x, dy = q.y - p.y;
          if (dx > w / 2) dx -= w; else if (dx < -w / 2) dx += w;
          if (dy > h / 2) dy -= h; else if (dy < -h / 2) dy += h;
          var d2 = dx * dx + dy * dy;
          if (d2 > R2) continue;
          n++;
          cx += dx; cy += dy;
          ax += Math.cos(q.a); ay += Math.sin(q.a);
          if (d2 < SEP2 && d2 > 0.0001) { sx -= dx / d2 * 40; sy -= dy / d2 * 40; }
        }
        var tx = Math.cos(p.a), ty = Math.sin(p.a);
        if (n) {
          tx = ax / n * 1.0 + cx / n * 0.012 + sx * 0.05;
          ty = ay / n * 1.0 + cy / n * 0.012 + sy * 0.05;
        }
        var want = Math.atan2(ty, tx), d = want - p.a;
        while (d > Math.PI) d -= TAU;
        while (d < -Math.PI) d += TAU;
        p.a += Math.max(-2.6 * dt, Math.min(2.6 * dt, d * 3.2 * dt * 6));
        p.px = p.x; p.py = p.y;
        p.x += Math.cos(p.a) * p.v * dt;
        p.y += Math.sin(p.a) * p.v * dt;
        if (p.x < 0) p.x += w; else if (p.x > w) p.x -= w;
        if (p.y < 0) p.y += h; else if (p.y > h) p.y -= h;
      }
    },
    paint: function (ctx, st, w, h, stops) {
      ctx.fillStyle = rampCss(stops, 0.02);
      ctx.globalAlpha = 0.10;
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1;
      ctx.fillStyle = rampCss(stops, 0.86);
      for (var i = 0; i < st.b.length; i++) {
        var p = st.b[i];
        ctx.fillRect(p.x - 1, p.y - 1, 2.2, 2.2);
      }
    }
  };

  var VARIANTS = [mycelium, delta, breakdown, fracture, murmuration];

  function bySlug(s) {
    for (var i = 0; i < VARIANTS.length; i++) if (VARIANTS[i].slug === s) return VARIANTS[i];
    return null;
  }

  /* ------------------------------------------------------------------- unit */
  function createUnit(canvas, variant, opts) {
    var ctx = canvas.getContext("2d");
    var unit = {
      variant: variant, canvas: canvas,
      speed: opts.speed, playing: opts.playing,
      pal: opts.pal, stops: opts.stops,
      seed: opts.seed === undefined ? ((Math.random() * 1e9) | 0) : opts.seed,
      st: {}, w: 0, h: 0, age: 0
    };
    var rnd = mulberry(unit.seed);

    unit.reseed = function (s) {
      unit.seed = s === undefined ? ((Math.random() * 1e9) | 0) : s;
      rnd = mulberry(unit.seed);
      unit.st = {};
      unit.age = 0;
      if (unit.w) variant.seed(unit.st, unit.w, unit.h, rnd);
      if (unit.w) { ctx.fillStyle = rampCss(unit.stops, 0.02); ctx.fillRect(0, 0, unit.w, unit.h); }
    };

    unit.resize = function (w, h) {
      if (canvas.width === w && canvas.height === h) return;
      canvas.width = w; canvas.height = h;
      unit.w = w; unit.h = h;
      unit.reseed(unit.seed);
    };

    unit.tick = function (dt) {
      if (!unit.playing || !unit.w) return;
      var d = Math.min(0.05, dt) * unit.speed;
      unit.age += d;
      variant.step(unit.st, d, rnd, unit.w, unit.h);
    };

    unit.paint = function () {
      if (!unit.w) return;
      variant.paint(ctx, unit.st, unit.w, unit.h, unit.stops);
    };

    unit.setPalette = function (i, stops) {
      unit.pal = i; unit.stops = stops;
      unit.reseed(unit.seed);      // the trail is painted, not stored, so a recolour has to redraw
    };

    return unit;
  }

  return {
    VARIANTS: VARIANTS, PALETTES: PALETTES, createUnit: createUnit,
    bySlug: bySlug, rampFromHex: rampFromHex, rgbToCss: rgbToCss, ramp: ramp
  };
})();
