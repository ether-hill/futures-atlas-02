/*
  Interference v02, the pond you drop into yourself.

  v01 (futures-atlas-02/public/interference) is fifteen fields that each loop
  exactly. This one does not loop at all: every drop is placed by a person, by
  pointer or by a pinch in front of the webcam (hands.js), so the field is a
  list of events rather than a schedule.

  Two kinds of thing go in the water, and the shader treats them differently:

  - DROPS are single wave packets, the same dropWave() as v01's Two droplets,
    aged on the CPU and handed over as (x, y, age, amp). A ring buffer of 32.
  - SOURCES are steady dippers, like v01's Ripple tank. They all share one
    clock (uPh), so any two of them are coherent and the dead lanes between
    them hold still. Each one switches on with a front that spreads out from
    where it was placed, so a new source arrives as a ring, not a flash.

  The water shading (WATER) and the palette ramps are copied from v01's
  field.js on purpose, so the two read as one piece. When this folds into the
  atlas, field.js could export them and this file would drop its copies.
*/
window.POND = (function () {
  "use strict";

  var TAU = 6.28318530718;
  var MAX_DROPS = 32, MAX_SRC = 8;
  var C = 0.20;          /* ring speed, field units per second */
  var K = 30.0;          /* carrier wavenumber, same as Two droplets */
  var W = C * K;         /* so a source's crests travel at the ring speed too */
  var WIN = 14.0;        /* a drop's lifetime; the oldest is faded out by then */

  function hexToRgb(h) {
    h = h.replace("#", "");
    return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255];
  }
  /* v01's four palettes, unchanged */
  var PALETTES = [
    { name: "Ice",       css: "#78d6c9", stops: ["#050710", "#141f4f", "#246a86", "#78d6c9", "#fcf5df"].map(hexToRgb) },
    { name: "Ember",     css: "#e8853c", stops: ["#0a0405", "#3a0f14", "#94301c", "#e8853c", "#fff0c4"].map(hexToRgb) },
    { name: "Verdigris", css: "#66c68a", stops: ["#040a08", "#0a2624", "#116655", "#66c68a", "#f5faec"].map(hexToRgb) },
    { name: "Bone",      css: "#a8a8a4", stops: ["#070708", "#232326", "#59595e", "#a8a8a4", "#fbfaf6"].map(hexToRgb) }
  ];

  /* ----------------------------------------------------------------- shader */

  var VS = "attribute vec2 a; void main(){ gl_Position = vec4(a,0.0,1.0); }";

  var FS = [
    "#extension GL_OES_standard_derivatives : enable",
    "precision highp float;",
    "uniform vec2 uRes;",
    "uniform float uPh;",
    "uniform float uGrainT;",
    "uniform vec3 uC0, uC1, uC2, uC3, uC4;",
    "uniform vec4 uD[" + MAX_DROPS + "];",
    "uniform vec4 uS[" + MAX_SRC + "];",
    "uniform int uND, uNS;",
    "#ifdef GL_OES_standard_derivatives",
    "#define FW(x) fwidth(x)",
    "#else",
    "#define FW(x) 0.006",
    "#endif",
    "const float C = " + C.toFixed(4) + ";",
    "const float K = " + K.toFixed(4) + ";",
    "const float WIN = " + WIN.toFixed(4) + ";",
    "",
    "vec3 rampI(float x){",
    "  x = clamp(x,0.0,1.0);",
    "  vec3 col = mix(uC0,uC1,smoothstep(0.00,0.30,x));",
    "  col = mix(col,uC2,smoothstep(0.24,0.58,x));",
    "  col = mix(col,uC3,smoothstep(0.54,0.82,x));",
    "  col = mix(col,uC4,smoothstep(0.80,1.00,x));",
    "  return col;",
    "}",
    "float hash21(vec2 p){",
    "  p = fract(p*vec2(123.34,345.45));",
    "  p += dot(p,p+34.345);",
    "  return fract(p.x*p.y);",
    "}",
    "",
    "/* v01's drop: a packet riding out from where it landed */",
    "float dropWave(vec2 p, vec2 s, float tau){",
    "  if(tau <= 0.0) return 0.0;",
    "  float r = length(p - s);",
    "  float d = r - C*tau;",
    "  float pack  = exp(-d*d*4.0);",
    "  float birth = smoothstep(0.0, 0.45, tau);",
    "  float fade  = smoothstep(WIN, WIN*0.72, tau)*birth;",
    "  float decay = exp(-tau*0.087)*exp(-r*0.62)/sqrt(0.30 + r*2.0);",
    "  return sin(K*d + 1.1)*pack*decay*fade;",
    "}",
    "",
    "/* a steady dipper: v01's ripple-tank source, switched on by a front that",
    "   spreads from where it was placed. Phase comes from the shared clock, not",
    "   from the moment it was placed, which is what makes sources coherent. */",
    "float srcWave(vec2 p, vec4 s){",
    "  float r = length(p - s.xy);",
    "  float on = smoothstep(C*s.z, C*s.z - 0.35, r);",
    "  return s.w*0.40*on*sin(K*r - uPh)*exp(-r*0.35)/sqrt(0.28 + r*3.0);",
    "}",
    "",
    "float height(vec2 p){",
    "  float h = 0.0;",
    "  for(int i=0;i<" + MAX_DROPS + ";i++){",
    "    if(i >= uND) break;",
    "    vec4 d = uD[i];",
    "    h += d.w*dropWave(p, d.xy, d.z);",
    "  }",
    "  for(int i=0;i<" + MAX_SRC + ";i++){",
    "    if(i >= uNS) break;",
    "    h += srcWave(p, uS[i]);",
    "  }",
    "  return h;",
    "}",
    "",
    "/* v01's WATER, verbatim apart from HGAIN */",
    "vec3 render(vec2 p){",
    "  float e = max(FW(p.x)*1.3, 0.0032);",
    "  float h  = height(p);",
    "  float hx = height(p+vec2(e,0.0)) - h;",
    "  float hy = height(p+vec2(0.0,e)) - h;",
    "  vec3 n = normalize(vec3(-hx*20.0, -hy*20.0, e*20.0));",
    "  vec3 L = normalize(vec3(-0.40, 0.55, 0.62));",
    "  float diff = max(dot(n,L), 0.0);",
    "  float fres = pow(1.0-n.z, 2.4);",
    "  vec3 col = mix(rampI(0.02), rampI(0.46), clamp(fres*1.9, 0.0, 1.0));",
    "  col += rampI(0.68)*diff*0.13;",
    "  col += rampI(clamp(h*h*6.5, 0.0, 1.0))*0.46;",
    "  return col;",
    "}",
    "",
    "void main(){",
    "  vec2 p = (gl_FragCoord.xy - 0.5*uRes)/min(uRes.x,uRes.y)*2.0;",
    "  vec3 col = render(p);",
    "  col += (hash21(gl_FragCoord.xy + uGrainT)-0.5)*0.020;",
    "  vec2 q = p*vec2(0.56,0.70);",
    "  col *= 1.0 - 0.26*dot(q,q);",
    "  gl_FragColor = vec4(max(col,0.0), 1.0);",
    "}"
  ].join("\n");

  /* ------------------------------------------------------------------ state */

  var canvas, gl, prog, U = {};
  var drops = [];     /* {x, y, born, amp} */
  var sources = [];   /* {x, y, born, amp, dying, el} */
  var palette = 0;
  var scale = 1, maxScale = 1;
  var listeners = [];

  function now() { return performance.now() / 1000; }

  /* Viewport CSS pixels -> field units, the same p the shader builds. The
     canvas sits below the atlas bar, so its own box is the origin. */
  function toField(x, y) {
    var r = canvas.getBoundingClientRect();
    x -= r.left; y -= r.top;
    var w = canvas.clientWidth, h = canvas.clientHeight, m = Math.min(w, h);
    return { x: (x - w / 2) / m * 2, y: -(y - h / 2) / m * 2 };
  }
  /* field units -> CSS pixels inside the canvas (the marks layer shares its box) */
  function toScreen(fx, fy) {
    var w = canvas.clientWidth, h = canvas.clientHeight, m = Math.min(w, h);
    return { x: fx * m / 2 + w / 2, y: -fy * m / 2 + h / 2 };
  }

  function drop(x, y, amp) {
    var f = toField(x, y);
    var d = { x: f.x, y: f.y, born: now(), amp: amp || 1 };
    if (drops.length >= MAX_DROPS) {
      /* replace the oldest; by then it has mostly faded */
      var oi = 0;
      for (var i = 1; i < drops.length; i++) if (drops[i].born < drops[oi].born) oi = i;
      drops[oi] = d;
    } else drops.push(d);
    emit("drop", d);
  }

  /* A source within this distance of a click is that source, and the click
     takes it out again rather than stacking a second one on top. */
  var HIT = 0.07;
  function toggleSource(x, y) {
    var f = toField(x, y);
    for (var i = 0; i < sources.length; i++) {
      var s = sources[i];
      if (!s.dying && Math.hypot(s.x - f.x, s.y - f.y) < HIT) { s.dying = now(); emit("change"); return; }
    }
    var live = sources.filter(function (s) { return !s.dying; });
    if (live.length >= MAX_SRC) { live[0].dying = now(); }
    var el = document.createElement("div");
    el.className = "src-mark";
    document.getElementById("marks").appendChild(el);
    sources.push({ x: f.x, y: f.y, born: now(), amp: 1, dying: 0, el: el });
    emit("change");
  }

  function clear() {
    var t = now();
    drops.forEach(function (d) { d.dying = t; d.ampAt = currentDropAmp(d, t); });
    sources.forEach(function (s) { if (!s.dying) s.dying = t; });
    emit("change");
  }

  function currentDropAmp(d, t) {
    if (!d.dying) return d.amp;
    return (d.ampAt || d.amp) * Math.max(0, 1 - (t - d.dying) / 0.6);
  }

  function liveSourceCount() { return sources.filter(function (s) { return !s.dying; }).length; }

  function on(fn) { listeners.push(fn); }
  function emit(type, data) { listeners.forEach(function (fn) { fn(type, data); }); }

  /* ------------------------------------------------------------------- GL */

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }

  function init(el) {
    canvas = el;
    gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "high-performance" });
    if (!gl) throw new Error("WebGL is not available");
    gl.getExtension("OES_standard_derivatives");
    prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    gl.useProgram(prog);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, "a");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    ["uRes", "uPh", "uGrainT", "uND", "uNS", "uC0", "uC1", "uC2", "uC3", "uC4"].forEach(function (n) {
      U[n] = gl.getUniformLocation(prog, n);
    });
    U.uD = gl.getUniformLocation(prog, "uD");
    U.uS = gl.getUniformLocation(prog, "uS");

    /* Every pixel walks every live drop three times (height plus two
       neighbours for the normal), so cost grows with the screen. Start near
       the device's own density and let frame time decide from there. */
    maxScale = Math.min(window.devicePixelRatio || 1, 1.5);
    scale = maxScale;
    resize();
    window.addEventListener("resize", resize);
    requestAnimationFrame(frame);
  }

  function resize() {
    var w = Math.max(1, Math.round(canvas.clientWidth * scale));
    var h = Math.max(1, Math.round(canvas.clientHeight * scale));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  }

  var dA = new Float32Array(MAX_DROPS * 4), sA = new Float32Array(MAX_SRC * 4);
  var slow = 0, fast = 0, last = 0;

  function frame(ms) {
    requestAnimationFrame(frame);
    var t = ms / 1000;

    /* adaptive resolution */
    if (last) {
      var dt = t - last;
      if (dt > 0.024) { slow++; fast = 0; } else if (dt < 0.0175) { fast++; slow = 0; }
      if (slow > 20 && scale > 0.5) { scale = Math.max(0.5, scale * 0.85); slow = 0; resize(); }
      if (fast > 180 && scale < maxScale) { scale = Math.min(maxScale, scale * 1.1); fast = 0; resize(); }
    }
    last = t;

    var tt = now();
    drops = drops.filter(function (d) { return tt - d.born < WIN && currentDropAmp(d, tt) > 0; });
    sources = sources.filter(function (s) {
      if (s.dying && tt - s.dying > 0.8) { s.el.remove(); return false; }
      return true;
    });

    for (var i = 0; i < drops.length; i++) {
      var d = drops[i];
      dA[i * 4] = d.x; dA[i * 4 + 1] = d.y; dA[i * 4 + 2] = tt - d.born; dA[i * 4 + 3] = currentDropAmp(d, tt);
    }
    for (var j = 0; j < sources.length; j++) {
      var s = sources[j];
      var amp = s.dying ? Math.max(0, 1 - (tt - s.dying) / 0.8) : 1;
      sA[j * 4] = s.x; sA[j * 4 + 1] = s.y; sA[j * 4 + 2] = tt - s.born; sA[j * 4 + 3] = amp;
      var sp = toScreen(s.x, s.y);
      s.el.style.transform = "translate(" + sp.x + "px," + sp.y + "px)";
      s.el.style.opacity = String(amp);
    }

    resize();
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(U.uRes, canvas.width, canvas.height);
    gl.uniform1f(U.uPh, (W * tt) % TAU);
    gl.uniform1f(U.uGrainT, (tt * 60 % 1) * 137);
    gl.uniform1i(U.uND, drops.length);
    gl.uniform1i(U.uNS, sources.length);
    if (drops.length) gl.uniform4fv(U.uD, dA);
    if (sources.length) gl.uniform4fv(U.uS, sA);
    var st = PALETTES[palette].stops;
    for (var c = 0; c < 5; c++) gl.uniform3f(U["uC" + c], st[c][0], st[c][1], st[c][2]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  return {
    init: init,
    drop: drop,
    toggleSource: toggleSource,
    clear: clear,
    on: on,
    liveSourceCount: liveSourceCount,
    PALETTES: PALETTES,
    setPalette: function (i) { palette = i; },
    stats: function () { return { drops: drops.length, sources: sources.length, scale: scale }; }
  };
})();
