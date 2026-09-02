/*
  Overtone — a quantum picture drawn from a singing voice.

  Built for /throat-singing-quantum, in honour of Richard Feynman, who spent
  the last decade of his life trying to reach Tuva and never got there. What
  reached him instead was khöömei, a voice that sounds several pitches at once:
  a low drone and, riding on it, one of its own harmonics picked out by the
  shape of the mouth and made loud enough to hear as a separate melody.

  The engine does three honest things and then draws three pictures of them.

    1. It finds the drone. A normalised autocorrelation (McLeod's NSDF, with
       the usual key-maximum pick and a parabolic touch-up) gives f0 from the
       time-domain buffer, every frame, for anything between 55 and 600 Hz.
    2. It measures the ladder. For n = 1..16 it reads the FFT in a narrow
       window around n·f0 and keeps the peak. Those sixteen numbers, smoothed
       with a fast attack and a slower release, ARE the singer: which rungs of
       the harmonic series are ringing, and how hard.
    3. It normalises them into weights, so the sixteen amplitudes can be read
       as the coefficients of a sum of modes. A sound is a sum of harmonics
       with weights. A quantum state is a sum of modes with weights. That is
       the whole analogy, and the views below are three ways of drawing it.

  THE VIEWS
    levels   Standing waves in a box. Mode n has n half-waves; the state is
             Σ aₙ φₙ(x) e^(−i n ω t), drawn as its real part and its density.
             The ladder on the left is the harmonic series and, spaced exactly
             like it, the energy levels of a quantum harmonic oscillator.
    orbit    Bohr's atom. An integer number of wavelengths must fit around the
             orbit, which is the same rule as an integer number of half-waves
             fitting a string. Each ringing harmonic n is drawn as an n-lobed
             standing wave on a ring.
    arrows   Feynman's arrows, from his 1985 book QED. Every harmonic is a
             little clock hand turning n times as fast as the first. Add them
             tip to tail and the tip traces the singer's actual waveform. In
             QED the arrows are probability amplitudes; here they are sound.
             Same arithmetic, different meaning, and the page says so.
    bars     The plain readout: sixteen bars, one per harmonic.

  THE HONEST PART, kept here so the pictures never quietly claim more than
  they should: nothing in a voice is quantum. Harmonic amplitudes are real
  numbers you hear all at once; quantum amplitudes are complex numbers whose
  squares are the odds of what you would find if you looked. The shared idea
  is the ladder, and the sum. The difference is what the sum means.

  No libraries. One AudioContext, one AnalyserNode, 2-D canvas.
*/
window.OVERTONE = (function () {
  "use strict";

  var N = 16;                 // harmonics tracked
  var FMIN = 55, FMAX = 600;  // drone search range, Hz
  var TAU = Math.PI * 2;

  /* ------------------------------------------------------------ colours */
  function cssVar(name, fallback) {
    try {
      var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return v || fallback;
    } catch (e) { return fallback; }
  }
  function isDark() { return document.documentElement.classList.contains("dark"); }
  /* the palette is read from the site's tokens so a re-theme carries into the
     canvas; the harmonic ramp runs from the brand blue to warm paper */
  function palette() {
    var dark = isDark();
    return {
      bg: cssVar("--bg", dark ? "#17181b" : "#f4efe4"),
      ink: cssVar("--text", dark ? "#f2ede2" : "#17181b"),
      muted: cssVar("--muted", dark ? "#9da0a8" : "#63666c"),
      accent: cssVar("--accent", "oklch(0.565 0.13 245)"),
      dark: dark
    };
  }
  /* harmonic n → colour. Low rungs cool blue, high rungs warm; lightness
     lifts in dark mode so the glow reads against near-black. */
  function hueFor(n, dark) {
    var t = (n - 1) / (N - 1);
    var h = 245 - 205 * t;            // 245 (blue) → 40 (amber)
    var l = dark ? 0.62 + 0.22 * t : 0.5 + 0.1 * t;
    var c = 0.13 + 0.05 * t;
    return "oklch(" + l.toFixed(3) + " " + c.toFixed(3) + " " + h.toFixed(1) + ")";
  }
  function withAlpha(oklch, a) {
    return oklch.replace(/\)$/, " / " + Math.max(0, Math.min(1, a)).toFixed(3) + ")");
  }

  /* ------------------------------------------------------------ analysis */
  var ctxAudio = null;
  function audioContext() {
    if (!ctxAudio) ctxAudio = new (window.AudioContext || window.webkitAudioContext)();
    return ctxAudio;
  }

  /* McLeod pitch method, trimmed: NSDF over the lag range, pick the first key
     maximum within 0.88 of the global one, refine with a parabola. */
  function detectPitch(buf, sr, out) {
    var n = buf.length;
    var minLag = Math.floor(sr / FMAX), maxLag = Math.min(n - 2, Math.ceil(sr / FMIN));
    var rms = 0, i, j;
    for (i = 0; i < n; i++) rms += buf[i] * buf[i];
    rms = Math.sqrt(rms / n);
    out.level = rms;
    if (rms < 0.006) { out.conf = 0; return out; }

    var nsdf = out._nsdf || (out._nsdf = new Float32Array(n));
    var best = 0;
    for (var lag = minLag; lag <= maxLag; lag++) {
      var acf = 0, m = 0, lim = n - lag;
      for (i = 0, j = lag; i < lim; i++, j++) {
        acf += buf[i] * buf[j];
        m += buf[i] * buf[i] + buf[j] * buf[j];
      }
      var v = m > 0 ? 2 * acf / m : 0;
      nsdf[lag] = v;
      if (v > best) best = v;
    }
    if (best < 0.35) { out.conf = 0; return out; }
    /* key maxima: local peaks in positive regions after the first zero crossing */
    var thr = best * 0.88, pick = -1, pos = false;
    for (lag = minLag + 1; lag < maxLag; lag++) {
      if (!pos) { if (nsdf[lag] <= 0) pos = true; continue; }
      if (nsdf[lag] > nsdf[lag - 1] && nsdf[lag] >= nsdf[lag + 1] && nsdf[lag] >= thr) { pick = lag; break; }
    }
    if (pick < 0) { out.conf = 0; return out; }
    var a = nsdf[pick - 1], b = nsdf[pick], c = nsdf[pick + 1];
    var denom = a - 2 * b + c;
    var shift = denom !== 0 ? 0.5 * (a - c) / denom : 0;
    var period = pick + shift;
    out.f0raw = sr / period;
    out.conf = Math.max(0, Math.min(1, (b - 0.35) / 0.65));
    return out;
  }

  /* amplitudes of harmonics 1..N from the dB spectrum around n·f0 */
  function measureHarmonics(spec, sr, fftSize, f0, target) {
    var binHz = sr / fftSize, half = spec.length;
    var peak = -200, n, k;
    for (n = 1; n <= N; n++) {
      var fc = n * f0, w = Math.max(1.5, fc * 0.035 / binHz);
      var lo = Math.max(1, Math.floor(fc / binHz - w)), hi = Math.min(half - 1, Math.ceil(fc / binHz + w));
      var m = -200;
      for (k = lo; k <= hi; k++) if (spec[k] > m) m = spec[k];
      target[n - 1] = m;
      if (m > peak) peak = m;
    }
    /* dB → linear, relative to the loudest rung; below −48 dB is silence */
    for (n = 0; n < N; n++) {
      var d = target[n] - peak;
      target[n] = d < -48 ? 0 : Math.pow(10, d / 20);
    }
    return target;
  }

  function noteName(f) {
    if (!(f > 0)) return "";
    var names = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];
    var midi = 69 + 12 * Math.log2(f / 440);
    var r = Math.round(midi), cents = Math.round((midi - r) * 100);
    return names[((r % 12) + 12) % 12] + (Math.floor(r / 12) - 1) + (cents ? (cents > 0 ? " +" : " ") + cents + "¢" : "");
  }

  /* ------------------------------------------------------------ state */
  function makeState() {
    return {
      f0: 0, f0raw: 0, conf: 0, level: 0,
      amps: new Float32Array(N),     // smoothed, 0..1, relative
      raw: new Float32Array(N),
      weights: new Float32Array(N),  // normalised so Σ w² = 1
      phase: new Float32Array(N),    // slow display phases per mode
      top: 1,                        // strongest harmonic above the drone
      live: false,                   // true when a real source is being read
      t: 0
    };
  }

  /* a synthetic khöömei for when there is nothing to listen to: a drone that
     drifts, a 1/n comb, and one high rung that wanders like a sygyt melody */
  function idle(state, dt) {
    state.t += dt;
    var t = state.t;
    var f0 = 138 + 12 * Math.sin(t * 0.13) + 4 * Math.sin(t * 0.71);
    var sel = 7 + 3 * Math.sin(t * 0.21) + 1.5 * Math.sin(t * 0.53);
    var selN = Math.round(sel);
    var hold = 0.5 + 0.5 * Math.cos((sel - selN) * Math.PI);
    for (var n = 1; n <= N; n++) {
      var a = 1 / (0.7 + n * 0.55);
      if (n === selN) a += 0.9 * hold;
      if (n === selN + 1 || n === selN - 1) a += 0.25 * (1 - hold);
      a *= 0.85 + 0.15 * Math.sin(t * (0.9 + n * 0.17) + n);
      state.raw[n - 1] = a;
    }
    var peak = 0;
    for (n = 0; n < N; n++) if (state.raw[n] > peak) peak = state.raw[n];
    for (n = 0; n < N; n++) state.raw[n] /= peak || 1;
    state.f0raw = f0; state.conf = 0.8; state.level = 0.12;
    state.live = false;
  }

  function settle(state, dt) {
    /* attack fast, release slow, so a struck harmonic shows at once and fades
       like a room rather than a meter */
    var n;
    for (n = 0; n < N; n++) {
      var tgt = state.raw[n], cur = state.amps[n];
      var k = tgt > cur ? 1 - Math.exp(-dt * 22) : 1 - Math.exp(-dt * 6);
      state.amps[n] = cur + (tgt - cur) * k;
    }
    if (state.conf > 0.2 && state.f0raw > 0) {
      state.f0 = state.f0 ? state.f0 + (state.f0raw - state.f0) * (1 - Math.exp(-dt * 10)) : state.f0raw;
    }
    var s = 0;
    for (n = 0; n < N; n++) s += state.amps[n] * state.amps[n];
    s = Math.sqrt(s) || 1;
    var top = 1, tv = 0;
    for (n = 0; n < N; n++) {
      state.weights[n] = state.amps[n] / s;
      if (n >= 1 && state.amps[n] > tv) { tv = state.amps[n]; top = n + 1; }
    }
    state.top = top;
    /* display phases: mode n turns n times as fast as the drone, slowed to the
       eye's speed. 0.16 turns/s for the fundamental. */
    for (n = 0; n < N; n++) state.phase[n] = (state.phase[n] + dt * TAU * 0.16 * (n + 1)) % TAU;
  }

  /* ------------------------------------------------------------ views */
  var VIEWS = {};

  /* --- levels: a box, its standing waves, and the ladder --------------- */
  VIEWS.levels = function (g, w, h, st, pal) {
    var padL = Math.round(w * 0.2), padR = Math.round(w * 0.06);
    var top = Math.round(h * 0.12), bot = Math.round(h * 0.86);
    var boxW = w - padL - padR, boxH = bot - top;
    var n, i;

    /* the ladder: rungs at equal spacing, glow by amplitude */
    var lx0 = Math.round(w * 0.055), lx1 = padL - Math.round(w * 0.035);
    for (n = 1; n <= N; n++) {
      var y = bot - (n - 0.5) / N * boxH;
      var a = st.amps[n - 1];
      g.strokeStyle = withAlpha(hueFor(n, pal.dark), 0.15 + 0.85 * a);
      g.lineWidth = 1 + 3 * a;
      g.beginPath(); g.moveTo(lx0, y); g.lineTo(lx1, y); g.stroke();
      if (a > 0.08) {
        g.shadowColor = hueFor(n, pal.dark); g.shadowBlur = 24 * a;
        g.stroke(); g.shadowBlur = 0;
      }
    }
    g.fillStyle = withAlpha(pal.ink.startsWith("oklch") ? pal.ink : "oklch(0.9 0 0)", pal.dark ? 0.45 : 0.55);
    g.font = "500 " + Math.max(10, Math.round(h * 0.022)) + "px Archivo, system-ui, sans-serif";
    g.textAlign = "left"; g.textBaseline = "middle";
    g.fillStyle = pal.muted;
    g.fillText("n = 1", lx0, bot - 0.5 / N * boxH + Math.round(h * 0.03));
    g.fillText("n = " + N, lx0, bot - (N - 0.5) / N * boxH - Math.round(h * 0.03));

    /* the box walls */
    g.strokeStyle = withAlpha(hueFor(1, pal.dark), 0.35);
    g.lineWidth = 1;
    g.beginPath(); g.moveTo(padL, top); g.lineTo(padL, bot); g.lineTo(padL + boxW, bot); g.lineTo(padL + boxW, top); g.stroke();

    /* ψ(x,t) = Σ wₙ sin(nπx/L) e^{iφₙ}; draw each mode faintly, then the sum */
    var S = 220, xs = new Float32Array(S), re = new Float32Array(S), im = new Float32Array(S);
    for (i = 0; i < S; i++) xs[i] = i / (S - 1);
    for (n = 1; n <= N; n++) {
      var wn = st.weights[n - 1];
      if (wn < 0.03) continue;
      var c = Math.cos(st.phase[n - 1]), s = Math.sin(st.phase[n - 1]);
      g.strokeStyle = withAlpha(hueFor(n, pal.dark), 0.08 + 0.35 * wn);
      g.lineWidth = 1;
      g.beginPath();
      for (i = 0; i < S; i++) {
        var phi = Math.sin(n * Math.PI * xs[i]);
        re[i] += wn * phi * c; im[i] += wn * phi * s;
        var yy = (top + bot) / 2 - wn * phi * c * boxH * 0.42;
        if (i === 0) g.moveTo(padL + xs[i] * boxW, yy); else g.lineTo(padL + xs[i] * boxW, yy);
      }
      g.stroke();
    }
    /* density |ψ|² as a filled glow from the floor, scaled to its own peak so
       a state concentrated in one mode never climbs out of the box */
    var mid = (top + bot) / 2, dmax = 1e-6;
    for (i = 0; i < S; i++) { var dd = re[i] * re[i] + im[i] * im[i]; if (dd > dmax) dmax = dd; }
    g.beginPath(); g.moveTo(padL, bot);
    for (i = 0; i < S; i++) {
      var d = (re[i] * re[i] + im[i] * im[i]) / dmax;
      g.lineTo(padL + xs[i] * boxW, bot - d * boxH * 0.86);
    }
    g.lineTo(padL + boxW, bot); g.closePath();
    var grad = g.createLinearGradient(0, top, 0, bot);
    grad.addColorStop(0, withAlpha(hueFor(st.top, pal.dark), 0.55));
    grad.addColorStop(1, withAlpha(hueFor(1, pal.dark), 0.04));
    g.fillStyle = grad; g.fill();
    /* Re ψ, the bright line */
    g.strokeStyle = pal.ink; g.lineWidth = 1.6;
    g.shadowColor = hueFor(st.top, pal.dark); g.shadowBlur = 14;
    g.beginPath();
    for (i = 0; i < S; i++) {
      var y2 = mid - re[i] * boxH * 0.42;
      if (i === 0) g.moveTo(padL + xs[i] * boxW, y2); else g.lineTo(padL + xs[i] * boxW, y2);
    }
    g.stroke(); g.shadowBlur = 0;
  };

  /* --- orbit: Bohr's standing waves on a ring ---------------------------- */
  VIEWS.orbit = function (g, w, h, st, pal, unit) {
    /* opts.shift moves the ring sideways on wide stages so a title can sit beside it */
    var shift = (unit.shift || 0) * (w > 860 ? 1 : 0);
    var cx = w * (0.5 + shift), cy = h / 2, R = Math.min(w, h) * 0.3, n, i, S = 360;
    /* shells: one faint ring per rung, radius growing with n, lit by amplitude */
    for (n = 1; n <= N; n++) {
      var a = st.amps[n - 1];
      var r = R * (0.55 + 0.75 * (n - 1) / (N - 1));
      g.strokeStyle = withAlpha(hueFor(n, pal.dark), 0.05 + 0.5 * a);
      g.lineWidth = 0.8 + 2.5 * a;
      g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.stroke();
    }
    /* the standing waves: r(θ) = R(1 + ε Σ wₙ cos(nθ − φₙ)), one pass per rung
       so each keeps its own colour, then the sum in ink */
    var eps = R * 0.22;
    for (n = 1; n <= N; n++) {
      var wn = st.weights[n - 1];
      if (wn < 0.04) continue;
      var rr = R * (0.55 + 0.75 * (n - 1) / (N - 1));
      g.strokeStyle = withAlpha(hueFor(n, pal.dark), 0.15 + 0.7 * wn);
      g.lineWidth = 1 + 2 * wn;
      g.shadowColor = hueFor(n, pal.dark); g.shadowBlur = 18 * wn;
      g.beginPath();
      for (i = 0; i <= S; i++) {
        var th = i / S * TAU;
        var rad = rr + eps * wn * Math.cos(n * th - st.phase[n - 1]);
        var x = cx + rad * Math.cos(th), y = cy + rad * Math.sin(th);
        if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.stroke(); g.shadowBlur = 0;
    }
    /* the nucleus: the drone */
    var core = g.createRadialGradient(cx, cy, 0, cx, cy, R * 0.5);
    core.addColorStop(0, withAlpha(hueFor(1, pal.dark), 0.9 * Math.min(1, st.level * 6 + 0.3)));
    core.addColorStop(1, withAlpha(hueFor(1, pal.dark), 0));
    g.fillStyle = core; g.beginPath(); g.arc(cx, cy, R * 0.5, 0, TAU); g.fill();
    /* the sum, in ink, drawn on the strongest shell */
    var rs = R * (0.55 + 0.75 * (st.top - 1) / (N - 1));
    g.strokeStyle = withAlpha(pal.ink.startsWith("oklch") ? pal.ink : "oklch(0.95 0 0)", 0.9);
    g.strokeStyle = pal.ink; g.lineWidth = 1.4;
    g.beginPath();
    for (i = 0; i <= S; i++) {
      var th2 = i / S * TAU, sum = 0;
      for (n = 1; n <= N; n++) sum += st.weights[n - 1] * Math.cos(n * th2 - st.phase[n - 1]);
      var rad2 = rs + eps * 0.8 * sum;
      var x2 = cx + rad2 * Math.cos(th2), y2 = cy + rad2 * Math.sin(th2);
      if (i === 0) g.moveTo(x2, y2); else g.lineTo(x2, y2);
    }
    g.stroke();
  };

  /* --- arrows: Feynman's clock hands, tip to tail ------------------------ */
  VIEWS.arrows = function (g, w, h, st, pal, unit) {
    var cx = w * 0.3, cy = h / 2, scale = Math.min(w * 0.22, h * 0.36), n;
    var x = cx, y = cy;
    /* the chain */
    for (n = 1; n <= N; n++) {
      var wn = st.weights[n - 1];
      var len = wn * scale, ph = st.phase[n - 1];
      var nx = x + len * Math.cos(ph), ny = y + len * Math.sin(ph);
      if (wn > 0.02) {
        g.strokeStyle = withAlpha(hueFor(n, pal.dark), 0.25 + 0.7 * wn);
        g.lineWidth = 1 + 2 * wn;
        g.beginPath(); g.moveTo(x, y); g.lineTo(nx, ny); g.stroke();
        /* the little circle each hand turns in, for the hands that matter */
        if (wn > 0.12) {
          g.strokeStyle = withAlpha(hueFor(n, pal.dark), 0.05 + 0.18 * wn);
          g.lineWidth = 0.8;
          g.beginPath(); g.arc(x, y, len, 0, TAU); g.stroke();
        }
      }
      x = nx; y = ny;
    }
    /* trail of the tip, kept on the unit so it persists between frames */
    var tr = unit.trail || (unit.trail = []);
    tr.push([x, y]);
    if (tr.length > 420) tr.shift();
    g.lineWidth = 1.5;
    for (var i = 1; i < tr.length; i++) {
      g.strokeStyle = withAlpha(hueFor(st.top, pal.dark), (i / tr.length) * 0.9);
      g.beginPath(); g.moveTo(tr[i - 1][0], tr[i - 1][1]); g.lineTo(tr[i][0], tr[i][1]); g.stroke();
    }
    g.fillStyle = pal.ink;
    g.shadowColor = hueFor(st.top, pal.dark); g.shadowBlur = 16;
    g.beginPath(); g.arc(x, y, 3.5, 0, TAU); g.fill(); g.shadowBlur = 0;

    /* the waveform the sum makes: y(t) = Σ wₙ sin(n·2πt + φₙ) over one period
       of the drone, drawn to the right; the moving dot is the current phase */
    var wx0 = w * 0.56, wx1 = w * 0.96, wy = cy, amp = h * 0.2, S = 300;
    g.strokeStyle = withAlpha(pal.muted, 0.35); g.lineWidth = 1;
    g.beginPath(); g.moveTo(wx0, wy); g.lineTo(wx1, wy); g.stroke();
    g.strokeStyle = pal.ink; g.lineWidth = 1.6;
    g.shadowColor = hueFor(st.top, pal.dark); g.shadowBlur = 10;
    g.beginPath();
    var base = st.phase[0];
    for (i = 0; i <= S; i++) {
      var t = i / S, s = 0;
      for (n = 1; n <= N; n++) s += st.weights[n - 1] * Math.sin(n * (TAU * t) + (st.phase[n - 1] - n * base));
      var px = wx0 + t * (wx1 - wx0), py = wy - s * amp;
      if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
    }
    g.stroke(); g.shadowBlur = 0;
    var tt = (base / TAU) % 1, sv = 0;
    for (n = 1; n <= N; n++) sv += st.weights[n - 1] * Math.sin(st.phase[n - 1]);
    g.fillStyle = hueFor(st.top, pal.dark);
    g.beginPath(); g.arc(wx0 + tt * (wx1 - wx0), wy - sv * amp, 3, 0, TAU); g.fill();
  };

  /* --- bars: the readout ------------------------------------------------- */
  VIEWS.bars = function (g, w, h, st, pal) {
    var pad = w * 0.04, gap = 4, bw = (w - pad * 2 - gap * (N - 1)) / N, n;
    var top = h * 0.12, bot = h * 0.82;
    g.font = "500 " + Math.max(9, Math.round(h * 0.09)) + "px Archivo, system-ui, sans-serif";
    g.textAlign = "center"; g.textBaseline = "top";
    for (n = 1; n <= N; n++) {
      var a = st.amps[n - 1], x = pad + (n - 1) * (bw + gap);
      var hh = (bot - top) * a;
      g.fillStyle = withAlpha(hueFor(n, pal.dark), 0.15 + 0.85 * a);
      g.fillRect(x, bot - hh, bw, hh);
      g.fillStyle = n === st.top ? pal.ink : pal.muted;
      g.fillText(String(n), x + bw / 2, bot + 4);
    }
  };

  /* ------------------------------------------------------------ stage */
  function createStage(canvas, opts) {
    opts = opts || {};
    var state = makeState();
    /* one analysis can feed several canvases: the main one, plus any panels
       added for a grid or stack layout. Each keeps its own view and trail. */
    var panels = [];
    function addPanel(cv, v, shift) {
      var p = { canvas: cv, g: cv.getContext("2d"), view: VIEWS[v] ? v : "levels", unit: { trail: null, shift: shift || 0 } };
      panels.push(p);
      return p;
    }
    var main = addPanel(canvas, opts.view || "levels", opts.shift || 0);
    var analyser = null, srcNode = null, srcKind = "idle", srcEl = null, stream = null;
    var timeBuf = null, freqBuf = null, gainOut = null;
    var last = performance.now(), running = true, raf = 0;
    var listeners = { source: [], frame: [] };
    var dprCap = opts.dprCap || 1.75;

    function emit(ev, x) { listeners[ev].forEach(function (f) { f(x); }); }

    function ensureAnalyser() {
      if (analyser) return analyser;
      var ac = audioContext();
      analyser = ac.createAnalyser();
      analyser.fftSize = 8192;
      analyser.smoothingTimeConstant = 0.5;
      timeBuf = new Float32Array(2048);
      freqBuf = new Float32Array(analyser.frequencyBinCount);
      gainOut = ac.createGain();
      gainOut.gain.value = 1;
      analyser.connect(gainOut);
      gainOut.connect(ac.destination);
      return analyser;
    }

    function disconnectSource() {
      if (srcNode) { try { srcNode.disconnect(); } catch (e) {} srcNode = null; }
      if (srcEl) { try { srcEl.pause(); } catch (e) {} }
      if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; }
      srcEl = null; srcKind = "idle";
      state.live = false;
    }

    /* play a bundled clip: one <audio> per clip, since a media element can be
       wired into the graph only once */
    var clipEls = {};
    function useClip(url, loop) {
      return audioContext().resume().then(function () {
        disconnectSource();
        var an = ensureAnalyser(), ac = audioContext();
        var el = clipEls[url];
        if (!el) {
          el = new Audio(url);
          el.loop = loop !== false;
          el.preload = "auto";
          el.crossOrigin = "anonymous";
          clipEls[url] = { el: el, node: ac.createMediaElementSource(el) };
          el = clipEls[url];
        }
        srcEl = el.el; srcNode = el.node; srcKind = "clip";
        gainOut.gain.value = 1;
        srcNode.connect(an);
        state.live = true;
        emit("source", { kind: "clip", url: url });
        return srcEl.play();
      });
    }

    function useMic() {
      return audioContext().resume().then(function () {
        return navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
        });
      }).then(function (s) {
        disconnectSource();
        var an = ensureAnalyser(), ac = audioContext();
        stream = s;
        srcNode = ac.createMediaStreamSource(s);
        srcKind = "mic";
        gainOut.gain.value = 0;      // never feed the room back to itself
        srcNode.connect(an);
        state.live = true;
        emit("source", { kind: "mic" });
      });
    }

    function stop() { disconnectSource(); emit("source", { kind: "idle" }); }

    function analyse(dt) {
      if (!analyser || srcKind === "idle") { idle(state, dt); return; }
      var ac = audioContext();
      analyser.getFloatTimeDomainData(timeBuf);
      detectPitch(timeBuf, ac.sampleRate, state);
      if (state.conf > 0.2 && state.f0raw > 0) {
        analyser.getFloatFrequencyData(freqBuf);
        measureHarmonics(freqBuf, ac.sampleRate, analyser.fftSize, state.f0raw, state.raw);
      } else {
        /* no drone found: let the rungs decay */
        for (var n = 0; n < N; n++) state.raw[n] = 0;
      }
    }

    function resize(p) {
      var r = p.canvas.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return null;     // hidden panel: skip
      var dpr = Math.min(window.devicePixelRatio || 1, dprCap);
      var W = Math.max(2, Math.round(r.width * dpr)), H = Math.max(2, Math.round(r.height * dpr));
      if (p.canvas.width !== W || p.canvas.height !== H) { p.canvas.width = W; p.canvas.height = H; p.unit.trail = null; }
      return { W: W, H: H, dpr: dpr };
    }

    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (!running) return;
      var dt = Math.min(0.05, (now - last) / 1000); last = now;
      analyse(dt);
      settle(state, dt);
      var pal = palette();
      for (var i = 0; i < panels.length; i++) {
        var p = panels[i], dim = resize(p);
        if (!dim) continue;
        var g = p.g;
        g.setTransform(dim.dpr, 0, 0, dim.dpr, 0, 0);
        var w = dim.W / dim.dpr, h = dim.H / dim.dpr;
        if (opts.clear !== false) {
          g.fillStyle = pal.bg; g.fillRect(0, 0, w, h);
        } else {
          g.clearRect(0, 0, w, h);
        }
        g.lineCap = "round"; g.lineJoin = "round";
        (VIEWS[p.view] || VIEWS.levels)(g, w, h, state, pal, p.unit);
      }
      emit("frame", state);
    }
    raf = requestAnimationFrame(frame);

    return {
      state: state,
      get view() { return main.view; },
      setView: function (v) { main.view = VIEWS[v] ? v : "levels"; main.unit.trail = null; },
      /* extra canvases painted from the same analysis (grid / stack layouts) */
      addPanel: function (cv, v) { return addPanel(cv, v, 0); },
      panels: panels,
      useClip: useClip,
      useMic: useMic,
      stop: stop,
      pause: function () { running = false; if (srcEl) srcEl.pause(); },
      resume: function () { running = true; last = performance.now(); if (srcEl && srcKind === "clip") srcEl.play(); },
      get kind() { return srcKind; },
      get clip() { return srcEl; },
      on: function (ev, f) { listeners[ev].push(f); return this; },
      destroy: function () { cancelAnimationFrame(raf); disconnectSource(); },
      noteName: noteName
    };
  }

  return { createStage: createStage, VIEWS: Object.keys(VIEWS), N: N, noteName: noteName, hueFor: hueFor };
})();
