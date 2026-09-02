/*
  Interference — the shared field library.

  One place for the fields, their explainers, and the rendering. Loaded by both
  surfaces of this bundle:
    • index.html  — the gallery, with global and per-field controls
    • embed.html  — one field, full bleed, driven by the query string

  Three things are worth knowing before editing:

  1. ONE WebGL CONTEXT. Every field draws into a single offscreen GL canvas and
     is then blitted into that card's own 2D canvas. Browsers cap live WebGL
     contexts (~16), so a page of eighteen fields each holding its own context is
     one variant away from breaking. The scratch buffer is sized once and each
     draw takes the lower-left w×h corner of it.

  2. EVERY FIELD LOOPS. `loop` is the exact period in seconds at speed 1, and
     each shader is built so that t and t+loop are identical: temporal
     frequencies are integer multiples of TAU/loop, drop schedules divide it,
     and the oldest ripple in a drop stack is tapered to zero before it would
     fall out of the window. The timeline scrubs within that period, and
     "record one loop" writes a clip that cuts back to its own first frame.
     `loop: null` marks the one field where looping is meaningless.

  3. PALETTES ARE DATA. Five stops per palette, passed as uniforms, so
     re-colouring never recompiles and a custom colour is just another set of
     stops built from one hex value.
*/
window.FIELD = (function () {
  "use strict";

  var TAU = 6.28318530718;

  /* ---------------------------------------------------------------- palettes */

  function hexToRgb(hex) {
    var h = String(hex).trim().replace(/^#/, "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
    return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255];
  }

  function rgbToCss(c) {
    return "#" + c.map(function (v) {
      return ("0" + Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16)).slice(-2);
    }).join("");
  }

  function rgbToHsl(c) {
    var r = c[0], g = c[1], b = c[2];
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    var h = 0, s = 0, l = (mx + mn) / 2;
    if (d) {
      s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      if (mx === r) h = ((g - b) / d + (g < b ? 6 : 0));
      else if (mx === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h /= 6;
    }
    return [h, s, l];
  }

  function hslToRgb(h, s, l) {
    h = ((h % 1) + 1) % 1;
    if (!s) return [l, l, l];
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;
    var f = function (t) {
      t = ((t % 1) + 1) % 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    return [f(h + 1 / 3), f(h), f(h - 1 / 3)];
  }

  /** Five stops from one colour: a near-black ground through the colour itself
   *  to a tinted near-white, so any hex the reader types still reads as a ramp. */
  function rampFromHex(hex) {
    var rgb = hexToRgb(hex);
    if (!rgb) return null;
    var hsl = rgbToHsl(rgb), h = hsl[0], s = Math.max(0.12, hsl[1]);
    return [
      hslToRgb(h, s * 0.55, 0.045),
      hslToRgb(h, s * 0.92, 0.165),
      hslToRgb(h, s, 0.42),
      hslToRgb(h + 0.022, s * 0.72, 0.68),
      hslToRgb(h + 0.04, s * 0.28, 0.945)
    ];
  }

  var PALETTES = [
    { name: "Ice",       stops: ["#050710", "#141f4f", "#246a86", "#78d6c9", "#fcf5df"].map(hexToRgb) },
    { name: "Ember",     stops: ["#0a0405", "#3a0f14", "#94301c", "#e8853c", "#fff0c4"].map(hexToRgb) },
    { name: "Verdigris", stops: ["#040a08", "#0a2624", "#116655", "#66c68a", "#f5faec"].map(hexToRgb) },
    { name: "Bone",      stops: ["#070708", "#232326", "#59595e", "#a8a8a4", "#fbfaf6"].map(hexToRgb) }
  ];

  /* ----------------------------------------------------------------- shaders */

  var VS = "attribute vec2 a; void main(){ gl_Position = vec4(a,0.0,1.0); }";

  var PRELUDE = [
    "#extension GL_OES_standard_derivatives : enable",
    "precision highp float;",
    "uniform vec2 uRes;",
    "uniform float uT;",
    "uniform float uGrain;",
    "uniform vec3 uC0, uC1, uC2, uC3, uC4;",
    "#define PI 3.14159265359",
    "#define TAU 6.28318530718",
    "#ifdef GL_OES_standard_derivatives",
    "#define FW(x) fwidth(x)",
    "#else",
    "#define FW(x) 0.006",
    "#endif",
    "",
    "float tm(float x){ return x/(1.0+x); }",
    "",
    "/* the palette as a ramp: 0 = ground, 1 = the brightest stop */",
    "vec3 rampI(float x){",
    "  x = clamp(x,0.0,1.0);",
    "  vec3 col = mix(uC0,uC1,smoothstep(0.00,0.30,x));",
    "  col = mix(col,uC2,smoothstep(0.24,0.58,x));",
    "  col = mix(col,uC3,smoothstep(0.54,0.82,x));",
    "  col = mix(col,uC4,smoothstep(0.80,1.00,x));",
    "  return col;",
    "}",
    "",
    "/* the same palette as a closed cycle, for phase: once round is once round */",
    "vec3 rampC(float t){",
    "  float f = fract(t)*4.0;",
    "  vec3 a = uC1, b = uC2;",
    "  if(f >= 3.0){ a = uC4; b = uC1; }",
    "  else if(f >= 2.0){ a = uC3; b = uC4; }",
    "  else if(f >= 1.0){ a = uC2; b = uC3; }",
    "  return mix(a, b, smoothstep(0.0,1.0,fract(f)));",
    "}",
    "",
    "float hash21(vec2 p){",
    "  p = fract(p*vec2(123.34,345.45));",
    "  p += dot(p,p+34.345);",
    "  return fract(p.x*p.y);",
    "}",
    ""
  ].join("\n");

  var MAIN = [
    "",
    "void main(){",
    "  vec2 p = (gl_FragCoord.xy - 0.5*uRes)/min(uRes.x,uRes.y)*2.0;",
    "  vec3 col = render(p);",
    "  col += (hash21(gl_FragCoord.xy + fract(uT)*137.0)-0.5)*0.020*uGrain;",
    "  vec2 q = p*vec2(0.56,0.70);",
    "  col *= 1.0 - 0.26*dot(q,q);",
    "  gl_FragColor = vec4(max(col,0.0), 1.0);",
    "}"
  ].join("\n");

  /* Shared water shading, appended after a field's own height(). Reads the
     surface as a surface: slope becomes a normal, the normal becomes a glancing
     reflection and a thin specular, and the interference itself is added back as
     a faint intensity so the crossing lobes still read as crossing lobes. */
  var WATER = [
    "",
    "vec3 render(vec2 p){",
    "  /* one pixel wide, not one fixed distance: a fixed epsilon undersamples",
    "     the ripples as the panel gets smaller and the highlight aliases into",
    "     streaks that all lean the same way, towards the light */",
    "  float e = max(FW(p.x)*1.3, 0.0032);",
    "  float h  = height(p);",
    "  float hx = height(p+vec2(e,0.0)) - h;",
    "  float hy = height(p+vec2(0.0,e)) - h;",
    "  vec3 n = normalize(vec3(-hx*20.0, -hy*20.0, e*20.0));",
    "  vec3 L = normalize(vec3(-0.40, 0.55, 0.62));",
    "  float diff = max(dot(n,L), 0.0);",
    "  /* No mirror highlight. On a surface this finely rippled the specular",
    "     condition is met along a band thinner than a pixel, so it samples as",
    "     broken white dashes that all lean towards the light: scratches, not",
    "     glints. The glancing-angle term below carries the sheen instead. */",
    "  float fres = pow(1.0-n.z, 2.4);",
    "  vec3 col = mix(rampI(0.02), rampI(0.46), clamp(fres*1.9, 0.0, 1.0));",
    "  col += rampI(0.68)*diff*0.13;",
    "  col += rampI(clamp(h*h*6.5*HGAIN, 0.0, 1.0))*0.46;",
    "  return col;",
    "}"
  ].join("\n");

  /* Shared oblique shading: the same field, seen from the side.

     Every other panel here is a plan view, straight down. This one puts a
     camera low and behind and marches each pixel's ray until it drops below
     the surface, so crests foreshorten into the distance and stand in front of
     what is behind them. It is the ripple tank as you actually meet one, on a
     bench, at eye level.

     A field opting into this defines two functions instead of render():
       height(vec2 q)  the surface, roughly -1 to 1
       wall(vec2 q)    0 or 1, where an obstacle stands out of it

     The march is bounded analytically rather than by patience. Nothing exists
     outside the slab z within +/- TOP, so the ray is started where it enters
     that slab and abandoned where it leaves: on a low camera that is most of
     the distance to the horizon skipped before the first sample. */
  var OBLIQUE = [
    "",
    "const float AMP   = 0.052;   /* how tall the water actually is */",
    "const float WALLH = 0.30;",
    "const float TOP   = 0.30;    /* max(AMP, WALLH), for the slab test */",
    "",
    "const vec2 CAM = vec2(-1.00, -1.80);   /* where the camera stands, in plan */",
    "",
    "/* The surface, with the distance the eye is from it folded in.",
    "",
    "   Far ripples are finer on screen than the march can resolve, and an",
    "   unresolved ripple does not read as a fine ripple: it reads as a lattice",
    "   of stair-steps that crawls when the field moves. Flattening the surface",
    "   with distance is what a real tank does anyway, so the fix and the",
    "   photograph agree. The wall does not fade; it is an object, not detail. */",
    "float T(vec2 q){",
    "  vec2 d = q - CAM;",
    "  float fade = 1.0/(1.0 + dot(d,d)*0.10);",
    "  return max(AMP*height(q)*fade, WALLH*wall(q));",
    "}",
    "",
    "/* the surface normal, from a step that grows with distance: a fixed one",
    "   undersamples the far ripples and they alias into a moving lattice */",
    "vec3 nrm(vec2 q, float e){",
    "  return normalize(vec3(T(q-vec2(e,0.0)) - T(q+vec2(e,0.0)),",
    "                        T(q-vec2(0.0,e)) - T(q+vec2(0.0,e)), 2.0*e));",
    "}",
    "",
    "vec3 render(vec2 p){",
    "  /* Off the axis on purpose. Head-on, a symmetric field renders as its own",
    "     mirror and reads as an elevation drawing; from the corner the wall runs",
    "     away across the frame and the near fans sit in front of the far ones,",
    "     which is the whole reason for looking from the side. */",
    "  vec3 ro = vec3(-1.00, -1.80, 0.74);",
    "  vec3 ta = vec3( 0.16,  0.52, 0.02);",
    "  vec3 ww = normalize(ta - ro);",
    "  vec3 uu = normalize(cross(ww, vec3(0.0,0.0,1.0)));",
    "  vec3 vv = cross(uu, ww);",
    "  vec3 rd = normalize(p.x*uu + p.y*vv + 1.80*ww);",
    "",
    "  vec3 col = rampI(0.015);",
    "  if(rd.z < -0.001){",
    "    float t0 = max((ro.z - TOP)/(-rd.z), 0.0);",
    "    float t1 = (ro.z + TOP)/(-rd.z);",
    "    float t  = t0;",
    "    float hit = 0.0;",
    "    for(int i=0;i<96;i++){",
    "      vec3 q = ro + rd*t;",
    "      float d = q.z - T(q.xy);",
    "      if(d < 0.0018){ hit = 1.0; break; }",
    "      t += clamp(d*0.55, 0.006, 0.048);",
    "      if(t > t1) break;",
    "    }",
    "    if(hit > 0.5){",
    "      vec3 q = ro + rd*t;",
    "      vec3 n = nrm(q.xy, max(0.0016*t, 0.0016));",
    "      vec3 L = normalize(vec3(-0.42, -0.34, 0.84));",
    "      float diff = max(dot(n, L), 0.0);",
    "      float fres = pow(1.0 - max(dot(n, -rd), 0.0), 2.6);",
    "      if(wall(q.xy) > 0.5){",
    "        col = rampI(0.09) + rampI(0.52)*diff*0.30;",
    "      } else {",
    "        float h = height(q.xy);",
    "        col = mix(rampI(0.03), rampI(0.44), clamp(fres*1.7, 0.0, 1.0));",
    "        col += rampI(0.70)*diff*0.17;",
    "        col += rampI(clamp(h*h*1.3, 0.0, 1.0))*0.44;",
    "      }",
    "      /* into the distance everything washes back to the ground colour, so",
    "         the horizon is a fade rather than the line the march gave up on */",
    "      col = mix(col, rampI(0.015), smoothstep(2.6, 6.4, t));",
    "    }",
    "  }",
    "  return col;",
    "}"
  ].join("\n");

  /* One falling drop's ring, as a wave packet expanding from where it landed.
     `fade` tapers the oldest generation to nothing before it leaves the stack,
     which is what makes a repeating drip exactly periodic. */
  var DROP = [
    "float dropWave(vec2 p, vec2 s, float tau, float C, float KD, float win){",
    "  if(tau <= 0.0) return 0.0;",
    "  float r = length(p - s);",
    "  float d = r - C*tau;",
    "  float pack  = exp(-d*d*4.0);",
    "  float birth = smoothstep(0.0, 0.45, tau);",
    "  float fade  = smoothstep(win, win*0.72, tau)*birth;",
    "  float decay = exp(-tau*0.13)*exp(-r*0.62)/sqrt(0.30 + r*2.0);",
    "  return sin(KD*d + 1.1)*pack*decay*fade;",
    "}",
    ""
  ].join("\n");

  /* ------------------------------------------------------------------ fields */

  /* draft: true = unpublished. Everything below "Losing coherence" is still
     being worked on, so index.html lists those panels only for a signed-in
     editor (the readable "fa_editor" cookie, same hint atlas-nav.js uses).
     Drop the flag to publish one; the card numbering follows what is shown. */

  var VARIANTS = [

  {
    slug: "droplets",
    title: "Two droplets",
    loop: 6.0,
    note: "Two drips into still water, landing together. Where the rings cross, they add.",
    read: [
      ["What you are seeing",
       "Two drops hit at the same moment and the rings run into each other. Watch the middle. Some spots are jumping twice as high as one drop could manage on its own, and between them are lanes where the water is dead flat, because two ripples arrive there at opposite moments and wipe each other out."],
      ["Where the quantum comes in",
       "This is the whole idea, and you can do it in a sink. Waves add up where they meet, and they can add up to nothing. Fire electrons at a wall with two holes in it, one electron at a time, and they land in exactly this pattern of stripes, including the dead lanes where none of them ever arrive. Whatever an electron is, it went through both holes and got in its own way."],
      ["How it is built",
       "There is no video and no image file. A tiny program runs on your graphics card once for every pixel of the panel, sixty times a second. Each pixel measures how far it is from the two impact points, works out how high each ring lifts the water right there, and adds the two together. That number becomes a colour. No pixel knows what any other is doing, which is why a graphics card can do millions of them at once."]
    ],
    frag: DROP + [
      "const float HGAIN = 1.0;",
      "const float TD = 6.0;",
      "float height(vec2 p){",
      "  float h = 0.0;",
      "  for(int i=0;i<2;i++){",
      "    vec2 s = mix(vec2(-0.55, 0.06), vec2(0.55,-0.06), float(i));",
      "    for(int n=0;n<5;n++){",
      "      h += dropWave(p, s, uT + float(n)*TD, 0.30, 30.0, 5.0*TD);",
      "    }",
      "  }",
      "  return h;",
      "}"
    ].join("\n") + WATER
  },

  {
    slug: "ripple-tank",
    title: "Ripple tank",
    loop: 6.0,
    note: "Two dippers held at one frequency. The dead channels never move.",
    read: [
      ["What you are seeing",
       "Two paddles bobbing in a tray of water, in time with each other. The bright bands are where the two sets of ripples reinforce. The dark channels between them are where they cancel, and the water along those channels stays flat permanently, even though ripples are pouring in from both sides."],
      ["Where the quantum comes in",
       "This tray is the famous double slit experiment with the strangeness taken out. Each paddle plays the part of one hole. How far apart the dark channels sit depends on the wavelength, so you can run the logic backwards: measure the spacing, and you know the wavelength of whatever made the pattern. That is how anybody knows the wavelength of an electron."],
      ["How it is built",
       "Every pixel asks how far it is from each paddle, puts both distances into a sine wave, and adds them up to get a height. To make that look like water, the pixel then compares its own height with the one next door to work out which way the surface tilts, and shades it as though a lamp were hanging over the tray."]
    ],
    frag: [
      "const float HGAIN = 0.42;",
      "const float W = TAU/6.0;",
      "const float K = 52.0;",
      "float height(vec2 p){",
      "  float h = 0.0;",
      "  for(int i=0;i<2;i++){",
      "    vec2 s = mix(vec2(-0.44, 0.0), vec2(0.44, 0.0), float(i));",
      "    float r = length(p-s);",
      "    h += 0.62*sin(K*r - W*uT)*exp(-r*0.35)/sqrt(0.28 + r*3.0);",
      "  }",
      "  return h;",
      "}"
    ].join("\n") + WATER
  },

  {
    slug: "rain",
    title: "Rain",
    loop: 9.0,
    note: "Seven drops of different sizes, out of step with each other. Every crossing is an interference.",
    read: [
      ["What you are seeing",
       "Seven drops falling one after another instead of together, all different sizes. Rings from a drop that landed a while ago are still crossing rings from one that just hit. Nothing is symmetrical and no two crossings look the same."],
      ["Where the quantum comes in",
       "Interference is not a special effect that needs a tidy laboratory. Any two waves reaching the same place add up, and this is what that looks like when nobody is arranging it. The clean striped patterns everywhere else on this page had to be built, with two matched sources and nothing else nearby. Getting a picture that clean out of a quantum experiment mostly means shutting out everything that would scribble over it."],
      ["How it is built",
       "The same idea as the first panel, seven times over. Each pixel runs through seven drop points, and for each one adds up the last two rings it sent out. Every drop gets its own strength, wavelength and ring speed, worked out from its number rather than stored, so a bigger drop really does make longer, stronger ripples. Fourteen expanding rings summed at every pixel of every frame, and the graphics card gets through it in about a millisecond."]
    ],
    frag: DROP + [
      "const float HGAIN = 0.75;",
      "const float TR = 9.0;",
      "",
      "/* every drop is a different size: its own strength, wavelength and ring",
      "   speed, all fixed functions of its index so the loop still repeats */",
      "float rnd(float i, float k){ return fract(sin(i*12.9898 + k*7.233)*43758.5453); }",
      "vec2  srcOf(float i){ return vec2(rnd(i,1.0)*2.7 - 1.35, rnd(i,2.0)*1.7 - 0.85); }",
      "float ampOf(float i){ return 0.55 + 0.70*rnd(i,3.0); }",
      "float kOf(float i){ return 22.0 + 14.0*rnd(i,4.0); }",
      "float cOf(float i){ return 0.24 + 0.12*rnd(i,5.0); }",
      "",
      "float height(vec2 p){",
      "  float h = 0.0;",
      "  for(int j=0;j<7;j++){",
      "    float i = float(j);",
      "    float tau0 = mod(uT - TR*i/7.0 + TR, TR);",
      "    for(int n=0;n<2;n++){",
      "      h += ampOf(i)*dropWave(p, srcOf(i), tau0 + float(n)*TR, cOf(i), kOf(i), 2.0*TR);",
      "    }",
      "  }",
      "  return h;",
      "}"
    ].join("\n") + WATER
  },

  {
    slug: "two-slits",
    title: "Two slits",
    loop: 2.5,
    note: "A plane wave meets a wall with two gaps. Beyond it, one pattern instead of two.",
    read: [
      ["What you are seeing",
       "A wave rolls up from the bottom and hits a wall with two gaps in it. Each gap becomes a fresh source, and past the wall you get one pattern rather than two: bright fans with dark gaps between them. The faint steady glow under the moving crests is what a long camera exposure would catch."],
      ["Where the quantum comes in",
       "This is the experiment that will not go away. Light does it, and so do electrons, neutrons, whole atoms and molecules built from hundreds of atoms. A fan is bright where the two routes to it differ by a whole number of wavelengths, so the arrivals are in step, and dark where they differ by half a wavelength and cancel. Send the particles through one at a time and the stripes still appear, which is the part nobody has ever made comfortable."],
      ["How it is built",
       "Each gap is treated as a single point that emits circles. Every pixel adds two circular waves and squares the answer, because brightness goes as the square of a wave's height. The wall and the incoming wave beneath it are the same program with a couple of extra rules about which pixels count as solid. Real gaps have width, which would dim the outer fans, and that refinement is left out."]
    ],
    frag: [
      "const float K = 30.0;",
      "const float W = TAU/2.5;",
      "const float D = 0.22;",
      "const float YB = -0.80;",
      "const float AP = 0.045;   /* half-width of a gap, matching the one drawn */",
      "",
      "/* How strongly a gap radiates in a given direction.",
      "",
      "   A bare point source pushes out a full circle at equal strength, so the",
      "   arcs ran all the way along the wall and it read as if the whole barrier",
      "   were emitting rather than the two gaps. Two things fix that, and both",
      "   are real: cos(theta) from the wall normal, which is the obliquity of a",
      "   hole in a flat screen and goes to nothing along the wall; and the",
      "   single-slit envelope of a gap that has width, sin(u)/u across the",
      "   aperture. The second is what the note calls the missing refinement. */",
      "float lobe(vec2 d){",
      "  float ob = max(d.y, 0.0);",
      "  float u  = K*AP*d.x;",
      "  float sc = abs(u) < 1e-3 ? 1.0 : sin(u)/u;",
      "  return ob*sc;",
      "}",
      "",
      "vec3 render(vec2 p){",
      "  vec2 F = vec2(0.0);",
      "  for(int i=0;i<2;i++){",
      "    vec2 s = vec2((float(i)*2.0-1.0)*D, YB);",
      "    vec2 v = p-s;",
      "    float r = length(v);",
      "    F += lobe(v/max(r,1e-4))*(1.0/sqrt(0.16+r*2.4))*vec2(cos(K*r), sin(K*r));",
      "  }",
      "  float inst = F.x*cos(W*uT) + F.y*sin(W*uT);",
      "  vec3 col;",
      "  if(p.y < YB){",
      "    float pw = 0.5+0.5*cos(K*(p.y-YB) + W*uT);",
      "    col = mix(rampI(0.03), rampI(0.30), pw);",
      "  } else {",
      "    col = rampI(tm(inst*inst*0.80));",
      "    col += rampI(tm(dot(F,F)*0.26))*0.22;",
      "  }",
      "  float bar  = smoothstep(0.014, 0.0, abs(p.y-YB)-0.008);",
      "  float slit = smoothstep(0.050, 0.024, min(abs(p.x-D), abs(p.x+D)));",
      "  col = mix(col, rampI(0.0)*0.4, bar*(1.0-slit));",
      "  return col;",
      "}"
    ].join("\n")
  },

  {
    slug: "grating",
    title: "Seven slits",
    loop: 2.5,
    note: "The same wall with seven gaps. The strip along the top is the screen.",
    read: [
      ["What you are seeing",
       "The same wall with seven gaps instead of two. The wide fans have collapsed into narrow spikes with much more darkness between them. The strip along the top is a screen, showing what a detector placed up there would actually measure."],
      ["Where the quantum comes in",
       "Two sources only have to agree with each other. Seven have to agree all at once, which is a far harder condition, so only very particular directions survive. Sharper spikes mean a finer measurement: a grating ruled with thousands of lines can split light into colours a fraction of a nanometre apart, and that is how the ingredients of a star get read off its light."],
      ["How it is built",
       "The loop inside the shader runs seven times instead of twice. That is the only change from the panel before it, and it costs nothing you can feel, which is rather the point of doing this on a graphics card. The strip along the top is the same sum taken at one fixed height and averaged, so it holds still while the field below it moves."]
    ],
    frag: [
      "const float K = 34.0;",
      "const float W = TAU/2.5;",
      "const float YB = -0.80;",
      "const float AP = 0.030;   /* half-width of a gap, matching the ones drawn */",
      "",
      "/* Same aperture lobe as the two-slit panel: cos(theta) obliquity for a",
      "   hole in a flat screen, times the single-slit envelope of a gap with",
      "   width. Without it seven point sources radiate full circles and the",
      "   arcs run along the wall as if the whole grating were emitting. */",
      "float lobe(vec2 d){",
      "  float ob = max(d.y, 0.0);",
      "  float u  = K*AP*d.x;",
      "  float sc = abs(u) < 1e-3 ? 1.0 : sin(u)/u;",
      "  return ob*sc;",
      "}",
      "",
      "vec2 fieldAt(vec2 q){",
      "  vec2 F = vec2(0.0);",
      "  for(int i=0;i<7;i++){",
      "    vec2 s = vec2((float(i)-3.0)*0.145, YB);",
      "    vec2 v = q-s;",
      "    float r = length(v);",
      "    F += lobe(v/max(r,1e-4))*(1.0/sqrt(0.16+r*2.2))*vec2(cos(K*r), sin(K*r));",
      "  }",
      "  return F;",
      "}",
      "",
      "vec3 render(vec2 p){",
      "  vec2 F = fieldAt(p);",
      "  float inst = F.x*cos(W*uT) + F.y*sin(W*uT);",
      "  vec3 col;",
      "  /* Below the wall is the wave ARRIVING, not the diffracted one. This",
      "     panel had no such branch — the two-slit panel does — so the seven",
      "     circular sources were drawn under the barrier too, and the region",
      "     that should show a plane wave rolling in showed arcs fanning",
      "     backwards out of the slits. */",
      "  if(p.y < YB){",
      "    float pw = 0.5+0.5*cos(K*(p.y-YB) + W*uT);",
      "    return mix(rampI(0.03), rampI(0.30), pw);",
      "  }",
      "  col = rampI(tm(inst*inst*0.30));",
      "  col += rampI(tm(dot(F,F)*0.075))*0.22;",
      "  float band = smoothstep(0.855,0.870,p.y);",
      "  if(band > 0.0){",
      "    vec2 Fs = fieldAt(vec2(p.x, 0.855));",
      "    col = mix(col, rampI(tm(dot(Fs,Fs)*0.45)), band);",
      "    col = mix(col, rampI(0.0)*0.2, smoothstep(0.008,0.0,abs(p.y-0.862)));",
      "  }",
      "  float bar = smoothstep(0.013,0.0, abs(p.y+0.80)-0.008);",
      "  float slit = 1.0;",
      "  for(int i=0;i<7;i++){",
      "    slit = min(slit, smoothstep(0.018, 0.048, abs(p.x-(float(i)-3.0)*0.145)));",
      "  }",
      "  col = mix(col, rampI(0.0)*0.4, bar*slit);",
      "  return col;",
      "}"
    ].join("\n")
  },

  {
    slug: "carpet",
    title: "Quantum carpet",
    loop: 20.0,
    note: "A particle in a square box. Eight standing modes, beating in and out of step.",
    read: [
      ["What you are seeing",
       "One quantum particle shut inside a square box. The bright areas are where it is likely to be found if you look. It sloshes about, appears to fall apart completely, and then pulls itself back into the shape it started with."],
      ["Where the quantum comes in",
       "A trapped particle can only take certain wave shapes, in the same way a guitar string can only sound certain notes. Each shape cycles at its own speed, so a particle sharing itself between eight of them scrambles as they drift out of step. The speeds happen to be whole multiples of one rate, so sooner or later they all line up again and the original shape comes back. It has been watched happening in real trapped atoms."],
      ["How it is built",
       "The wave shapes for a box are ordinary sines, so each pixel works out eight of them, turns each by an angle set by its energy, adds them and squares the total. Nothing is approximated, so the loop here is exactly one full cycle of the physics: the moment when all eight are back where they started. It repeats because the particle repeats; the animation was never cut to fit."]
    ],
    frag: [
      "const float B = 0.88;",
      "const float C = TAU/20.0;",
      "",
      "vec2 mode(vec2 uv, float n, float m, float w){",
      "  float a = w*sin(n*PI*uv.x)*sin(m*PI*uv.y);",
      "  float ph = -(n*n+m*m)*uT*C;",
      "  return a*vec2(cos(ph), sin(ph));",
      "}",
      "",
      "vec3 render(vec2 p){",
      "  vec3 col = rampI(0.0);",
      "  vec2 uv = (p/B)*0.5+0.5;",
      "  if(uv.x>0.0 && uv.x<1.0 && uv.y>0.0 && uv.y<1.0){",
      "    vec2 s = vec2(0.0);",
      "    s += mode(uv,1.0,1.0,1.00);",
      "    s += mode(uv,3.0,1.0,0.86);",
      "    s += mode(uv,2.0,4.0,0.78);",
      "    s += mode(uv,5.0,2.0,0.70);",
      "    s += mode(uv,4.0,6.0,0.60);",
      "    s += mode(uv,7.0,3.0,0.52);",
      "    s += mode(uv,6.0,8.0,0.44);",
      "    s += mode(uv,9.0,7.0,0.36);",
      "    col = rampI(tm(dot(s,s)*1.15));",
      "  }",
      "  float e = max(abs(p.x),abs(p.y));",
      "  col += rampI(0.55)*smoothstep(0.008,0.0,abs(e-B))*0.5;",
      "  return col;",
      "}"
    ].join("\n")
  },

  {
    slug: "packets",
    title: "Cat state",
    loop: 16.0,
    note: "Two coherent states in one trap, swinging in antiphase. The fringes are finest as they pass.",
    read: [
      ["What you are seeing",
       "Two blobs swing towards each other, pass straight through, and swing apart again. Stripes appear between them while they overlap, at their sharpest the moment the two sit exactly on top of each other, and gone completely by the time they reach the ends of the swing."],
      ["Where the quantum comes in",
       "The two blobs are one particle, in two places at once. That is Schrodinger's cat, at a size where it genuinely happens. The stripes are the evidence. If the particle were really in one place or the other and you simply did not know which, you would see two humps with smooth nothing between them. The stripes only exist because both halves are actually there, meeting in the middle."],
      ["How it is built",
       "Each pixel adds two bell curves, and each curve carries a marker for how fast that blob is moving. Position follows a cosine and speed follows a sine, a quarter cycle behind it, exactly like a pendulum: quickest through the middle, stopped at the ends. So the tightest stripes at the crossing and none at the turning points are not a decision anyone made. They fall out of the sum."]
    ],
    frag: [
      "const float B = TAU/16.0;",
      "",
      "vec3 render(vec2 p){",
      "  /* a coherent state: position on the cosine, momentum on the sine */",
      "  float cx = 0.80*cos(B*uT);",
      "  float kx = 30.0*sin(B*uT);",
      "  float sx = 0.36, sy = 0.62;",
      "  vec2 d1 = (p - vec2( cx, 0.0)) / vec2(sx, sy);",
      "  vec2 d2 = (p - vec2(-cx, 0.0)) / vec2(sx, sy);",
      "  float g1 = exp(-dot(d1,d1)*0.85);",
      "  float g2 = exp(-dot(d2,d2)*0.85);",
      "  float p1 = -kx*p.x;",
      "  float p2 =  kx*p.x;",
      "  vec2 psi = g1*vec2(cos(p1),sin(p1)) + g2*vec2(cos(p2),sin(p2));",
      "  float dens = dot(psi,psi);",
      "  vec3 col = rampI(tm(dens*1.70));",
      "  col += rampC(atan(psi.y,psi.x)/TAU + 0.5) * dens * 0.16;",
      "  return col;",
      "}"
    ].join("\n")
  },

  {
    slug: "ring",
    title: "Phased ring",
    loop: 24.0,
    note: "Twenty four emitters on a circle. The winding number climbs, and the focus opens.",
    read: [
      ["What you are seeing",
       "Twenty four sources spaced around a circle, all humming the same note. While they are in step everything arrives at the middle together and the centre is the brightest thing on screen. Then a twist is put through the timings, and the centre goes dark, leaving a bright ring around a hole."],
      ["Where the quantum comes in",
       "The hole is unavoidable. If the timing has to shift steadily as you travel around the circle, there is no consistent answer at the centre, so the wave has to be zero exactly there. The number of twists is a real property you can count and measure, and a single photon can carry it. Arrays like this are working technology rather than a demonstration: radar, ultrasound scanners and radio telescopes all aim by adjusting timings instead of turning anything."],
      ["How it is built",
       "Each pixel measures its distance to all twenty four sources and adds a wave from every one. The twist is one extra term, nudging each source's timing by its position around the circle. Twenty four distance calculations for every pixel of every frame is the sort of arithmetic that would be hopeless anywhere but a graphics card."]
    ],
    frag: [
      "const float K = 30.0;",
      "const float W = TAU*8.0/24.0;",
      "",
      "vec3 render(vec2 p){",
      "  float l = floor(mod(uT/6.0, 4.0));",
      "  vec2 F = vec2(0.0);",
      "  for(int i=0;i<24;i++){",
      "    float a = TAU*float(i)/24.0;",
      "    vec2 s = 0.96*vec2(cos(a), sin(a));",
      "    float r = length(p-s);",
      "    float ph = K*r + l*a;",
      "    F += vec2(cos(ph), sin(ph))/(4.0*sqrt(0.16+r*1.8));",
      "  }",
      "  float inst = F.x*cos(W*uT) + F.y*sin(W*uT);",
      "  vec3 col = rampI(tm(inst*inst*1.40));",
      "  col += rampI(tm(dot(F,F)*0.38))*0.26;",
      "  for(int i=0;i<24;i++){",
      "    float a = TAU*float(i)/24.0;",
      "    col += rampI(0.62)*smoothstep(0.014,0.003,length(p-0.96*vec2(cos(a),sin(a))))*0.55;",
      "  }",
      "  return col;",
      "}"
    ].join("\n")
  },

  {
    slug: "beats",
    title: "Beats",
    loop: 12.0,
    note: "Two sources detuned by a sixth. The pattern never settles.",
    read: [
      ["What you are seeing",
       "Two sources humming at slightly different pitches. Nothing settles: the whole set of stripes slides steadily across the frame, over and over."],
      ["Where the quantum comes in",
       "Two close frequencies produce a slow throb at the difference between them, which is what a piano tuner is listening for when they tune two strings against each other. It is also the basis of a great deal of precise measurement. Instead of measuring an enormous frequency directly, compare it against a known one and watch how slowly the pattern crawls. Radio receivers and gravitational wave detectors both live on that trick."],
      ["How it is built",
       "The same two source sum as the double slit panel, with one number different for each source. Each has its own frequency, and its wavelength has to change to match, because two waves in the same water travel at the same speed. The drift you see is just the shader handing each of the two waves a slightly different clock."]
    ],
    frag: [
      "const float B = TAU/12.0;",
      "",
      "vec3 render(vec2 p){",
      "  vec2 s1 = vec2(-0.92, -0.52), s2 = vec2(0.92, -0.52);",
      "  float r1 = length(p-s1), r2 = length(p-s2);",
      "  float a1 = 1.0/sqrt(0.24+r1*1.6), a2 = 1.0/sqrt(0.24+r2*1.6);",
      "  /* one medium: k is proportional to omega, 6:7 in both */",
      "  float ph1 = 30.0*r1 - 6.0*B*uT;",
      "  float ph2 = 35.0*r2 - 7.0*B*uT;",
      "  vec2 F = a1*vec2(cos(ph1),sin(ph1)) + a2*vec2(cos(ph2),sin(ph2));",
      "  vec3 col = rampI(tm(dot(F,F)*0.42));",
      "  col += rampI(0.22)*0.06;",
      "  return col;",
      "}"
    ].join("\n")
  },

  {
    slug: "coherence",
    title: "Losing coherence",
    loop: 24.0,
    note: "The same two slits, with the visibility dialled from one to zero and back.",
    read: [
      ["What you are seeing",
       "The two slit pattern with one dial being turned. The stripes fade until the light and dark bands are equally bright, then come back. The bar along the bottom is the dial. Nothing else changes: both sources stay where they are and both stay exactly as bright."],
      ["Where the quantum comes in",
       "The dial is how much the two routes still belong to the same wave. It slips for very ordinary reasons: a source that wobbles out of time, or anything nearby that happens to record which way the particle went. A single stray photon bouncing off it counts as a record. This is why cats and cricket balls never show any of this behaviour. They cannot help leaving traces, and the moment the information about which way exists anywhere, the stripes go. The trade is exact: the more you could tell, the fainter the stripes have to be."],
      ["How it is built",
       "The shader works the picture out in three parts: the brightness from one slit, the brightness from the other, and a third term that exists only because the two interfere. The dial multiplies that third term and leaves the other two alone. Turn it to zero and what is left on screen is two plain lamps."]
    ],
    frag: [
      "const float K = 30.0;",
      "const float D = 0.24;",
      "",
      "vec3 render(vec2 p){",
      "  float g = 0.5+0.5*cos(TAU*uT/24.0);",
      "  vec2 s1 = vec2(-D,-0.80), s2 = vec2(D,-0.80);",
      "  float r1 = length(p-s1), r2 = length(p-s2);",
      "  float a1 = 1.0/sqrt(0.16+r1*2.4), a2 = 1.0/sqrt(0.16+r2*2.4);",
      "  float I = a1*a1 + a2*a2 + 2.0*g*a1*a2*cos(K*(r1-r2));",
      "  vec3 col = rampI(tm(I*0.30));",
      "  float row  = smoothstep(0.011,0.005, abs(p.y+0.93));",
      "  float span = step(-0.87,p.x)*step(p.x,0.87);",
      "  col = mix(col, rampI(0.04), row*span*0.85);",
      "  col += rampI(0.90)*row*span*step(p.x, -0.86 + 1.72*g)*0.8;",
      "  return col;",
      "}"
    ].join("\n")
  },

  {
    slug: "vortex",
    draft: true,
    title: "Vortex lattice",
    loop: 24.0,
    note: "Three plane waves at 120 degrees, coloured by phase. Each dark point is a singularity.",
    read: [
      ["What you are seeing",
       "Three waves crossing at even angles make a honeycomb. Colour shows the timing of the wave at each spot, brightness shows how strong it is, and the black dots are places where the wave is exactly nothing."],
      ["Where the quantum comes in",
       "Walk a small circle around one of the black dots and the colour runs the whole way round the wheel. There is no consistent answer for the timing at the centre, and the only way a wave can deal with that is to have no height at all there. The same knots show up in laser light bounced off a rough wall, in radio inside a building, and in liquid helium cooled until it flows without friction, where each one is a whirlpool that can only spin at certain fixed rates."],
      ["How it is built",
       "Every pixel adds three plane waves together. Instead of using the height of the result it takes the angle of it, which is the timing, and looks that angle up on a colour wheel, with brightness from the size. The black dots are not drawn on. They appear because the three waves genuinely cancel there and the shader is left with nothing to colour."]
    ],
    frag: [
      "const float B = TAU/24.0;",
      "",
      "vec3 render(vec2 p){",
      "  float spin = (TAU/3.0)*uT/24.0;",
      "  vec2 F = vec2(0.0);",
      "  for(int i=0;i<3;i++){",
      "    float a = 2.0944*float(i) + spin;",
      "    vec2 kv = 13.5*vec2(cos(a), sin(a));",
      "    float ph = dot(kv,p) - 4.0*B*uT;",
      "    F += vec2(cos(ph), sin(ph));",
      "  }",
      "  float amp = length(F)/3.0;",
      "  vec3 col = rampC(atan(F.y, F.x)/TAU + 0.5) * pow(amp, 1.7) * 0.95;",
      "  col += rampI(1.0) * pow(amp, 7.0) * 0.30;",
      "  return max(col, rampI(0.0)*smoothstep(0.0,0.35,amp));",
      "}"
    ].join("\n")
  },

  {
    slug: "one-at-a-time",
    draft: true,
    kind: "2d",
    loop: null,
    title: "One at a time",
    note: "Detections arriving singly. No fringe exists in any one of them.",
    read: [
      ["What you are seeing",
       "Dots, arriving one at a time, each one a single particle hitting the screen. For a while it is nothing but speckle. Then the stripes turn up on their own."],
      ["Where the quantum comes in",
       "Nothing here is bumping into anything. Turn the source down until only one particle is inside the machine at a time and the stripes still build, so the pattern cannot be particles interfering with each other. Each one has to have taken both routes. Nobody has ever caught one doing it, because looking closely enough to tell which way it went is exactly what destroys the stripes. It was first done with dim light in 1909 and filmed with single electrons in 1989."],
      ["How it is built",
       "The only panel here not drawn by the graphics card. This is ordinary drawing code: pick a random spot, look up how likely a particle is to land there, keep it or throw it away, a few thousand times a second. Old dots fade slowly so the picture settles instead of filling in solid. It is also the only panel that does not loop, because a pile of dots that keeps growing has nothing to repeat."]
    ]
  },

  {
    slug: "nodal-lines",
    draft: true,
    title: "Nodal lines",
    loop: 20.0,
    note: "Only the silence, drawn. The sources drift apart and the fan opens.",
    read: [
      ["What you are seeing",
       "Only the dead places, inked in like a diagram. Along these curves the two waves always cancel, so the water never moves at all. Watch the two dots pull apart and every so often a new pair of curves peels off the middle."],
      ["Where the quantum comes in",
       "These are the dark stripes from the other panels, on their own. In the quantum version they are the places a particle is never found. Nothing is blocking it and both routes stay open, but the two ways of arriving cancel exactly, so the odds come out at zero. Two ways for something to happen, adding up to it never happening, is the bit with no everyday equivalent."],
      ["How it is built",
       "Nothing is waving here. Each pixel works out the difference between its two distances and asks whether that difference lands on a cancelling value. If it does the pixel is ink, and if not it is paper. The graphics card also tells each pixel how fast that difference is changing next door, and the line thickness is set from that, so the curves stay one weight even where they bunch together."]
    ],
    frag: [
      "const float K = 26.0;",
      "",
      "vec3 render(vec2 p){",
      "  float d = 0.30 + 0.13*sin(TAU*uT/20.0);",
      "  vec2 s1 = vec2(-d, 0.0), s2 = vec2(d, 0.0);",
      "  float phi = K*0.5*(length(p-s1) - length(p-s2));",
      "  float f = cos(phi);",
      "  float w = max(FW(phi), 0.004)*0.75;",
      "  float line = 1.0 - smoothstep(0.0, w + 0.02, abs(f));",
      "  vec3 ink = rampI(0.06), paper = rampI(0.97);",
      "  vec3 col = mix(paper, ink, line*0.92);",
      "  for(int i=0;i<2;i++){",
      "    vec2 s = mix(s1, s2, float(i));",
      "    col = mix(col, ink, smoothstep(0.028, 0.014, length(p-s)));",
      "  }",
      "  col = mix(col, paper, smoothstep(0.72, 1.05, length(p*vec2(0.62,1.0))));",
      "  return col;",
      "}"
    ].join("\n")
  },

  {
    slug: "contours",
    draft: true,
    title: "Contours",
    loop: 4.0,
    note: "The same field as a survey map. Every line is one height of water.",
    read: [
      ["What you are seeing",
       "The same two source pattern drawn as a hill map, the way a walking map draws a mountain: every line joins up places at the same height. The thing to look at is the spacing. From the middle of one cluster of rings to the middle of the next is one whole wavelength, so you can measure the wave off the map with a ruler."],
      ["Where the quantum comes in",
       "Faster particles have shorter waves. That one rule is why electron microscopes exist: get an electron moving quickly enough and its wave becomes thousands of times shorter than light, and the finest detail any microscope can show is limited by the wavelength it uses. So a map like this, drawn from a real particle, shows you where it is moving fast: wherever the pattern repeats over the shortest distance."],
      ["How it is built",
       "Each pixel adds the two waves, then throws away everything except the fractional part of the answer, which turns a smooth slope into a staircase. Wherever a pixel lands on the edge of a step, it draws a line. The graphics card can tell a pixel how different its value is from its neighbours, and that number keeps every line the same thickness whether the surface there is steep or flat."]
    ],
    frag: [
      "const float K = 11.0;",
      "const float W = TAU/4.0;",
      "",
      "vec3 render(vec2 p){",
      "  float f = 0.0;",
      "  for(int i=0;i<2;i++){",
      "    vec2 s = mix(vec2(-0.46,-0.10), vec2(0.46, 0.10), float(i));",
      "    float r = length(p-s);",
      "    f += sin(K*r - W*uT)*exp(-r*0.30)/sqrt(0.25 + r*2.2);",
      "  }",
      "  float bands = f*3.2;",
      "  float g = abs(fract(bands) - 0.5);",
      "  float w = max(FW(bands), 0.0015)*1.1;",
      "  float line = 1.0 - smoothstep(0.085 - w, 0.085 + w, g);",
      "  vec3 paper = rampI(0.96), ink = rampI(0.10);",
      "  vec3 col = mix(paper, ink, line*0.88);",
      "  col = mix(col, rampI(0.62), smoothstep(0.4,1.4,abs(f))*0.10);",
      "  return col;",
      "}"
    ].join("\n")
  },

  {
    slug: "moire",
    draft: true,
    title: "Moir\u00e9",
    loop: 8.0,
    note: "Two rulings of the same pitch, crossed by a degree. The pattern is far coarser than either.",
    read: [
      ["What you are seeing",
       "Two sets of straight lines, ruled at exactly the same spacing, laid one over the other and turned very slightly against each other. Broad pale bands sweep across as the angle changes. Nothing in the picture is that wide: both rulings are fine, and the bands are the difference between them."],
      ["Where the quantum comes in",
       "Nothing quantum, and that is the reason it is here. Interference does not need waves in a medium or particles in a beam, only two regular things sampled against each other. The same arithmetic sets the beat of two detuned notes, the wagon-wheel effect in film, and the fringes across a photographed screen. Metrology takes it seriously: crossing a ruling against a copy of itself turns a misalignment far too small to see into a band you can count."],
      ["How it is built",
       "Two cosines of identical frequency, one along a fixed direction and one along a direction that turns. Each is cut to hard bars against its own on-screen width, so the lines stay crisp at any size instead of dissolving into grey, and the two are multiplied: light passes only where both rulings are open. The wide bands are not drawn at all. They are what the product does on its own."]
    ],
    frag: [
      "const float N = 520.0;      /* rulings per unit, both gratings */",
      "const float W = TAU/8.0;",
      "",
      "/* One ruling, as hard bars. FW is the width of a pixel in p-space, so the",
      "   edges are one pixel wide whatever size the panel is drawn at; a fixed",
      "   width turns the whole thing to flat grey on a small panel. */",
      "float ruling(vec2 p, float a){",
      "  vec2 d = vec2(cos(a), sin(a));",
      "  float c = cos(N*dot(p,d));",
      "  float w = max(FW(c), 0.05);",
      "  return smoothstep(-w, w, c);",
      "}",
      "",
      "vec3 render(vec2 p){",
      "  /* the crossing angle breathes through a few tenths of a degree either",
      "     side of parallel; the closer to parallel, the wider the bands */",
      "  /* The swing never reaches parallel. At a few thousandths of a radian",
      "     the beat is wider than the panel and there is nothing to see but one",
      "     pale wash; held between these two the bands stay countable and the",
      "     picture reads as a beat rather than as a gradient. */",
      "  float a = 0.052 + 0.026*cos(W*uT);",
      "  float g1 = ruling(p, 0.0);",
      "  float g2 = ruling(p, a);",
      "  float open = g1*g2;",
      "  vec3 col = mix(rampI(0.03), rampI(0.88), open);",
      "  /* a wash keyed to the beat itself, so the bands still read when the",
      "     rulings are too fine for the screen to resolve one by one */",
      "  vec2 d2 = vec2(cos(a), sin(a));",
      "  float beat = 0.5+0.5*cos(N*(dot(p,vec2(1.0,0.0)) - dot(p,d2)));",
      "  col = mix(col, rampI(0.55), beat*0.10);",
      "  return col;",
      "}"
    ].join("\n")
  },

  {
    slug: "speckle",
    draft: true,
    title: "Speckle",
    loop: 6.0,
    note: "Thirty scatterers, no two in step. The grain is the interference itself rather than a noise floor.",
    read: [
      ["What you are seeing",
       "A field of hard bright grains with black between them. It looks like noise and is the opposite: every grain is a place where thirty waves happened to arrive in step, and every black gap is a place where they cancelled. Shine a laser on any rough wall and this is what you get."],
      ["Where the quantum comes in",
       "Speckle is the signature of coherence. A torch produces none, because its light has no fixed phase relationship to itself; a laser produces it immediately. That makes the grain a test rather than a nuisance: if a source can speckle, its parts are in step. The same reasoning runs through quantum optics, where whether two paths can interfere is exactly the question of whether anything could have told them apart."],
      ["How it is built",
       "Thirty scattering points, positions fixed by index rather than stored, each sending out a circular wave. Every pixel adds the thirty complex amplitudes and takes the square. Each scatterer is also given its own whole number of turns per loop, so the phases drift against one another and the field boils, and after one loop every one of them is back exactly where it began."]
    ],
    frag: [
      "const int NS = 30;",
      "const float K = 26.0;",
      "const float W = TAU/6.0;",
      "",
      "float h1(float i, float k){ return fract(sin(i*12.9898 + k*78.233)*43758.5453); }",
      "",
      "vec3 render(vec2 p){",
      "  vec2 F = vec2(0.0);",
      "  for(int j=0;j<NS;j++){",
      "    float i = float(j);",
      "    vec2 s = vec2(h1(i,1.0)*3.2 - 1.6, h1(i,2.0)*2.2 - 1.1);",
      "    float r = length(p-s);",
      "    /* an INTEGER number of turns per loop: anything else and the field",
      "       does not come back to itself at the seam */",
      "    float turns = floor(h1(i,3.0)*5.0) + 1.0;",
      "    float ph = K*r + W*turns*uT;",
      "    F += (1.0/sqrt(0.30 + r*1.6))*vec2(cos(ph), sin(ph));",
      "  }",
      "  float I = dot(F,F);",
      "  /* The gain is set from the distribution, not by eye: the median of I",
      "     over the panel lands about a quarter of the way up the ramp, so the",
      "     field reads mostly dark with the constructive grains standing out.",
      "     At 0.55 the whole panel sat at the top of the ramp and the thing",
      "     looked like marbling rather than speckle. */",
      "  vec3 col = rampI(tm(I*0.032));",
      "  return col;",
      "}"
    ].join("\n")
  },

  {
    slug: "thin-film",
    draft: true,
    title: "Thin film",
    loop: 10.0,
    note: "A soap film draining. Each band is one more half-wavelength of thickness.",
    read: [
      ["What you are seeing",
       "A film of liquid held in a ring, seen in reflection. Light bounces off the front surface and off the back, and the two reflections meet again having travelled different distances. Where the extra distance is a whole number of wavelengths they add and the film is bright; half a wavelength out and they cancel. As the film drains and thins, the bands slide."],
      ["Where the quantum comes in",
       "Reflection off the back of the film adds half a wavelength that no distance accounts for, which is why the very thinnest part goes black rather than white just before it breaks. The colours are the same effect run once per wavelength: a thickness that cancels red will not cancel blue, so white light comes back split. This is the whole of what an anti-reflection coating does, and it is the oldest quantitative evidence that light is a wave."],
      ["How it is built",
       "A thickness map: a slow drain from the top, plus a couple of standing undulations across the surface. The brightness is the square of the cosine of the round-trip phase through that thickness, and the colour is the fringe order read around the palette as a closed cycle, so the bands run through the full sequence and rejoin without a seam."]
    ],
    frag: [
      "const float W = TAU/10.0;",
      "",
      "/* thickness of the film at p, in units of half a wavelength */",
      "float thickness(vec2 p){",
      "  /* Gravity, not a ramp. A film held vertically pools at the bottom, so",
      "     thickness grows faster than linearly downwards — which is why the",
      "     bands crowd together low down and open out to a wide colourless",
      "     wedge at the top just before it breaks. */",
      "  float u = 0.5 - 0.5*p.y;                     /* 0 at the top, 1 at the foot */",
      "  float drain = 0.45 + 13.5*u*u;",
      "  drain += 0.40*cos(3.1*p.x + W*uT);           /* one turn per loop */",
      "  drain += 0.26*cos(2.2*p.y - 2.0*W*uT);       /* two turns per loop */",
      "  drain += 0.15*cos(5.3*p.x + 3.0*p.y + 3.0*W*uT);",
      "  return max(drain, 0.0);",
      "}",
      "",
      "vec3 render(vec2 p){",
      "  float t = thickness(p);",
      "  /* PI on reflection off the denser back surface: this is the term that",
      "     sends the thinnest film black rather than bright */",
      "  float phase = TAU*t + PI;",
      "  float amp = 0.5 + 0.5*cos(phase);",
      "  /* order around the palette as a closed cycle, so the bands rejoin */",
      "  vec3 col = rampC(t*0.34);",
      "  col *= 0.30 + 0.95*amp;",
      "  /* the film thins to nothing at the top edge and goes dark */",
      "  col *= smoothstep(0.0, 0.55, t);",
      "  return col;",
      "}"
    ].join("\n")
  },

  {
    slug: "wavefronts",
    draft: true,
    title: "Two sources",
    loop: 3.0,
    note: "The same pair as the first panel, drawn as the circles they are. Every bright bead is two crests arriving together.",
    read: [
      ["What you are seeing",
       "Two sources side by side, each sending out circles. There is no surface here and no water seen from above, just the crests themselves, drawn where they are. Two families of rings, and where a ring from one crosses a ring from the other, both are lifting at once and the crossing lights up. Follow those bright crossings outward and they line up along smooth curves fanning away from the pair."],
      ["Where the quantum comes in",
       "Those curves are the whole of it. A crossing happens where the two distances differ by a whole number of wavelengths, so the arrivals are in step; between them run the lanes where the difference is half a wavelength and nothing ever moves. Send electrons through two slits and they land on those same curves and never in the lanes. The pattern is fixed by geometry alone (two distances and one wavelength), which is why it comes out identical whether the thing doing the travelling is water, light or an atom."],
      ["How it is built",
       "For each pixel, the distance to each source, and a band drawn wherever that distance sits near a crest. The two bands are kept apart rather than added: the picture shows one set of circles, the other set, and separately the places where both are true at once. That last term is the only thing lit brightly, so the crossings do the work. The rings are cut against their own on-screen width, so they stay one clean line whatever size the panel is drawn at."]
    ],
    frag: [
      "const float K = 30.0;",
      "const float W = TAU/3.0;",
      "const float D = 0.52;      /* half the separation of the two sources */",
      "",
      "/* One family of circles: a band wherever the distance sits near a crest.",
      "   The threshold is cut against FW so a ring is one line wide on screen",
      "   rather than one line wide in the field \u2014 without it the circles thicken",
      "   into flat wash on a small panel and vanish on a large one. */",
      "float ring(float r){",
      "  float c = cos(K*r - W*uT);",
      "  float w = max(FW(c)*1.2, 0.10);",
      "  return smoothstep(0.58 - w, 0.58 + w, c);",
      "}",
      "",
      "/* circular waves in two dimensions thin out as 1/sqrt(r) */",
      "float fall(float r){ return 1.0/sqrt(0.45 + r*0.85); }",
      "",
      "vec3 render(vec2 p){",
      "  float r1 = length(p - vec2(-D, 0.0));",
      "  float r2 = length(p - vec2( D, 0.0));",
      "  float a = ring(r1)*fall(r1);",
      "  float b = ring(r2)*fall(r2);",
      "",
      "  vec3 col = rampI(0.02);",
      "  /* the two families, drawn as themselves */",
      "  col = mix(col, rampI(0.46), clamp(max(a,b), 0.0, 1.0));",
      "  /* and the crossings, which are the point of the panel */",
      "  col = mix(col, rampI(0.97), clamp(a*b*1.5, 0.0, 1.0));",
      "  return col;",
      "}"
    ].join("\n")
  },

  {
    slug: "point-slits",
    draft: true,
    title: "Point source, two slits",
    loop: 2.5,
    note: "One lamp on the left, and a wall with two gaps. What arrives at the wall is already curved.",
    read: [
      ["What you are seeing",
       "A single point on the left is sending out circles, and a wall stands in their way with two narrow gaps in it. On the near side two things are happening at once: the circles going out, and the same circles coming back off the wall, crossing the outgoing ones in a lattice of places that never move at all. Past the wall each gap is sending out circles of its own, and the two families overlap into fans."],
      ["Where the quantum comes in",
       "This is Young's experiment as it is actually done. A single small source first, then the pair of slits, because the two slits have to be lit by the same wave or there are no fringes to see at all: that is the coherence requirement, and it is the reason the lamp is a point rather than a strip. Beyond the wall the arithmetic is the familiar one. A fan is bright where the two routes to it differ by a whole number of wavelengths, dark where they differ by half. And because this lamp sits on the axis, the extra distance out to each gap is the same for both, cancels, and changes nothing about where the fans land. Slide the lamp off the axis and the whole pattern slides with it."],
      ["How it is built",
       "Each gap is treated as one point that re-emits with the phase the incoming wave hands it, so the phase carried out to a pixel is the whole path, lamp to gap to pixel. That total is what fixes where the fans go. Two direction terms shape what a gap radiates, and both are real: the obliquity of a hole in a flat screen, which falls to nothing along the wall, and the spreading of a gap that has width. The reflection on the near side is drawn as a second lamp the same distance behind the wall, which is exact for a flat mirror and ignores the fact that this one has holes in it. Nothing scatters back through the gaps: they are driven by the incoming wave alone."]
    ],
    frag: [
      "const float K  = 34.0;",
      "const float W  = TAU/2.5;",
      "const float XB = 0.10;     /* the wall */",
      "const float SX = -0.72;    /* the lamp, on the axis */",
      "const float D  = 0.155;    /* half the separation of the gaps */",
      "const float AP = 0.040;    /* half-width of a gap, matching the one drawn */",
      "",
      "/* circular waves in two dimensions thin out as 1/sqrt(r) */",
      "float fall(float r){ return 1.0/sqrt(0.30 + r*1.6); }",
      "",
      "/* One circular source as a phasor: amplitude and phase, no time in it yet. */",
      "vec2 circ(vec2 p, vec2 s){",
      "  float r = length(p - s);",
      "  return fall(r)*vec2(cos(K*r), sin(K*r));",
      "}",
      "",
      "/* A gap, radiating with the phase the incoming wave hands it. `ph` is the",
      "   WHOLE path, lamp to gap to pixel, which is what fixes where the fans",
      "   land. `ob` is the obliquity of a hole in a flat screen and goes to",
      "   nothing along the wall; sin(u)/u is the spreading of a gap that has",
      "   width, so a narrower gap throws its light wider. */",
      "vec2 gap(vec2 p, vec2 s, vec2 lamp, float ap){",
      "  vec2 v = p - s;",
      "  float r = length(v);",
      "  vec2 d = v/max(r, 1e-4);",
      "  float ob = max(d.x, 0.0);",
      "  float u  = K*ap*d.y;",
      "  float sc = abs(u) < 1e-3 ? 1.0 : sin(u)/u;",
      "  float ri = length(s - lamp);",
      "  float ph = K*(ri + r);",
      "  return 1.45*ob*sc*fall(ri)*(1.0/sqrt(0.16 + r*2.4))*vec2(cos(ph), sin(ph));",
      "}",
      "",
      "vec3 render(vec2 p){",
      "  vec2 lamp = vec2(SX, 0.0);",
      "  /* the lamp, and the lamp seen in the wall: an image the same distance",
      "     behind it. Adding the two is what stands the lattice of still points",
      "     on the near side. */",
      "  vec2 near = circ(p, lamp) + circ(p, vec2(2.0*XB - SX, 0.0));",
      "  vec2 far  = gap(p, vec2(XB, D), lamp, AP) + gap(p, vec2(XB, -D), lamp, AP);",
      "  /* crossfaded rather than switched: the two descriptions do not agree at",
      "     the wall, and a hard swap draws a seam straight across each gap. */",
      "  vec2 F = mix(near, far, smoothstep(XB-0.012, XB+0.012, p.x));",
      "",
      "  float inst = F.x*cos(W*uT) + F.y*sin(W*uT);",
      "  vec3 col = rampI(tm(inst*inst*0.90));",
      "  col += rampI(tm(dot(F,F)*0.30))*0.22;",
      "",
      "  float bar  = smoothstep(0.014, 0.0, abs(p.x-XB)-0.008);",
      "  float slit = smoothstep(0.050, 0.024, min(abs(p.y-D), abs(p.y+D)));",
      "  col = mix(col, rampI(0.0)*0.4, bar*(1.0-slit));",
      "  return col;",
      "}"
    ].join("\n")
  },

  {
    slug: "closing-a-slit",
    draft: true,
    title: "Closing a slit",
    loop: 12.0,
    note: "The same wall, with one gap shutting and opening again. Fringes into a single smear, and back.",
    read: [
      ["What you are seeing",
       "The lower gap narrows to nothing over the loop and opens again. With both gaps open you get the fans. With one, you get a single broad lobe and no stripes in it at all, and that lobe widens as the gap narrows, because a smaller opening throws its light further out to the sides."],
      ["Where the quantum comes in",
       "This is the move the experiment is famous for. The stripes are not a property of the particles, they are a property of there being two routes: shut one and they go, open it and they come back. Fire electrons through one at a time, slowly enough that only one is ever in the apparatus, and the stripes still build up hit by hit while both gaps are open, and stop the moment one is closed. Nothing is interacting with anything. A route was removed."],
      ["How it is built",
       "One number runs the whole loop: how far the lower gap is open. It sets the width drawn on the wall, the strength of what that gap radiates, and the width of that gap's own spreading envelope, so the picture and the arithmetic move together rather than the drawing being decorated afterwards. It is a slow dissolve rather than a shutter closing at any real speed. Each frame is a correct still; the passage between them is not a process."]
    ],
    frag: [
      "const float K  = 34.0;",
      "const float W  = TAU*5.0/12.0;   /* five turns to the loop */",
      "const float XB = 0.10;",
      "const float SX = -0.72;",
      "const float D  = 0.155;",
      "const float AP = 0.040;",
      "",
      "float fall(float r){ return 1.0/sqrt(0.30 + r*1.6); }",
      "",
      "vec2 circ(vec2 p, vec2 s){",
      "  float r = length(p - s);",
      "  return fall(r)*vec2(cos(K*r), sin(K*r));",
      "}",
      "",
      "vec2 gap(vec2 p, vec2 s, vec2 lamp, float ap){",
      "  vec2 v = p - s;",
      "  float r = length(v);",
      "  vec2 d = v/max(r, 1e-4);",
      "  float ob = max(d.x, 0.0);",
      "  float u  = K*ap*d.y;",
      "  float sc = abs(u) < 1e-3 ? 1.0 : sin(u)/u;",
      "  float ri = length(s - lamp);",
      "  float ph = K*(ri + r);",
      "  return 1.45*ob*sc*fall(ri)*(1.0/sqrt(0.16 + r*2.4))*vec2(cos(ph), sin(ph));",
      "}",
      "",
      "vec3 render(vec2 p){",
      "  vec2 lamp = vec2(SX, 0.0);",
      "  /* how far the lower gap is open, once round per loop. Everything about",
      "     that gap is this number: what is drawn, what it radiates, and how",
      "     wide it spreads what it radiates. */",
      "  float g = 0.5 + 0.5*cos(TAU*uT/12.0);",
      "",
      "  vec2 near = circ(p, lamp) + circ(p, vec2(2.0*XB - SX, 0.0));",
      "  vec2 far  = gap(p, vec2(XB, D), lamp, AP);",
      "  far += g*gap(p, vec2(XB, -D), lamp, AP*max(g, 0.06));",
      "  vec2 F = mix(near, far, smoothstep(XB-0.012, XB+0.012, p.x));",
      "",
      "  float inst = F.x*cos(W*uT) + F.y*sin(W*uT);",
      "  vec3 col = rampI(tm(inst*inst*0.90));",
      "  col += rampI(tm(dot(F,F)*0.30))*0.22;",
      "",
      "  /* the wall, with the lower opening drawn at its actual width. The soft",
      "     edge is cut against the pixel so a closed gap closes cleanly instead",
      "     of collapsing into a degenerate smoothstep. */",
      "  float e   = max(FW(p.y)*1.5, 0.004);",
      "  float o   = 0.050*g;",
      "  float sl1 = smoothstep(0.050, 0.024, abs(p.y - D));",
      "  float sl2 = smoothstep(o + e, max(o - e, -e), abs(p.y + D));",
      "  float bar = smoothstep(0.014, 0.0, abs(p.x-XB)-0.008);",
      "  col = mix(col, rampI(0.0)*0.4, bar*(1.0 - max(sl1, sl2)));",
      "  return col;",
      "}"
    ].join("\n")
  },

  {
    slug: "tank-oblique",
    draft: true,
    title: "Ripple tank, from the side",
    loop: 4.0,
    note: "The first panel again, at eye level. Two sources on a bench rather than two circles on a page.",
    read: [
      ["What you are seeing",
       "Two sources dipping in step, seen from low down and behind instead of from straight above. Everything about the pattern is the same as the plan view; what changes is that the crests now foreshorten into the distance and stand in front of each other, and the still lanes running out between the sources read as flat water rather than as dark lines. It is the ripple tank as you actually meet one, on a bench, at eye level."],
      ["Where the quantum comes in",
       "Nothing new, and that is the point of the panel. The lanes where nothing ever moves are fixed by two distances and one wavelength, and they do not care what angle you look from. A plan view makes the arithmetic obvious and makes it look like a diagram. This one makes it look like water, which is what it is, and the arithmetic is unchanged."],
      ["How it is built",
       "Each pixel casts a ray from the camera and walks it forward until it drops below the surface. The surface is the same sum of two circular waves the flat panels use, given an actual height in the scene, so the shading comes from its real slope rather than from a colour ramp. The march is bounded by arithmetic rather than by patience: nothing exists outside a thin slab around the water, so the ray starts where it enters that slab and is abandoned where it leaves. Far crests are sampled with a wider step than near ones, or the distance aliases into a lattice that crawls."]
    ],
    frag: [
      "const float K = 26.0;",
      "const float W = TAU/4.0;",
      "const float D = 0.40;      /* half the separation of the sources */",
      "",
      "float height(vec2 q){",
      "  float s = 0.0;",
      "  for(int i=0;i<2;i++){",
      "    vec2 c = vec2((float(i)*2.0-1.0)*D, 0.34);",
      "    float r = length(q - c);",
      "    s += sin(K*r - W*uT)/sqrt(0.35 + r*1.5);",
      "  }",
      "  return s*0.62;",
      "}",
      "",
      "float wall(vec2 q){ return 0.0; }"
    ].join("\n") + OBLIQUE
  },

  {
    slug: "slits-oblique",
    draft: true,
    title: "Two slits, from the side",
    loop: 2.4,
    note: "A wall standing in the water with two gaps in it, seen at a raking angle. The wave comes from behind it.",
    read: [
      ["What you are seeing",
       "A wall stands across the tank with two gaps cut in it, and straight ridges roll in from behind and break against it. Through each gap a set of circles spreads out toward you, and where the two sets cross you get the fans. Because you are looking along the water rather than down at it, the near fans stand up in front of the far ones and the still lanes between them read as flat lanes of water going away from the wall."],
      ["Where the quantum comes in",
       "Straight ridges arriving means both gaps are fed at the same instant, so the two sets of circles leave in step and the fans sit symmetrically about the middle. A fan is bright where the two routes to it differ by a whole number of wavelengths and dead where they differ by half. The same picture holds for light, for electrons and for molecules of a few hundred atoms, and it holds one particle at a time, which is the part that has never been made comfortable."],
      ["How it is built",
       "Behind the wall the surface is a plane wave. In front of it, each gap is treated as a point that re-emits, with the obliquity of a hole in a flat screen and the spreading of a gap that has width. The two halves are written on one clock, so the phase a gap hands on is the phase the incoming ridge arrived with and the crests join up across the opening rather than meeting at a seam. The wall itself is part of the surface the ray marches against, which is why it occludes what is behind it instead of being drawn on top afterwards."]
    ],
    frag: [
      "const float K  = 26.0;",
      "const float W  = TAU/2.4;",
      "const float YB = 0.58;     /* the wall */",
      "const float D  = 0.30;     /* half the separation of the gaps */",
      "const float AP = 0.075;    /* half-width of a gap, matching the one drawn */",
      "",
      "/* One clock for both halves. The incoming ridges are written as a path",
      "   length that decreases as they travel toward the viewer, so the phase a",
      "   gap hands on is the phase that arrived at it, and the crests join up",
      "   across the opening instead of meeting at a seam. */",
      "float height(vec2 q){",
      "  /* Behind the wall the ridges die away quickly. They are nearly edge-on",
      "     from this camera, so at full strength they are finer than the march",
      "     can resolve and stairstep across the horizon; and the wall hides most",
      "     of that ground anyway, which is what a wall in a tank does. */",
      "  if(q.y > YB) return sin(-K*q.y - W*uT)*0.90*exp(-(q.y - YB)*2.2);",
      "  float s = 0.0;",
      "  for(int i=0;i<2;i++){",
      "    vec2 c = vec2((float(i)*2.0-1.0)*D, YB);",
      "    vec2 v = q - c;",
      "    float r = length(v);",
      "    vec2 d = v/max(r, 1e-4);",
      "    float ob = max(-d.y, 0.0);",
      "    float u  = K*AP*d.x;",
      "    float sc = abs(u) < 1e-3 ? 1.0 : sin(u)/u;",
      "    s += ob*sc*sin(K*(r - YB) - W*uT)/sqrt(0.45 + r*1.6);",
      "  }",
      "  return s*1.30;",
      "}",
      "",
      "float wall(vec2 q){",
      "  float bar = smoothstep(0.058, 0.034, abs(q.y - YB));",
      "  float gap = smoothstep(0.100, 0.058, min(abs(q.x - D), abs(q.x + D)));",
      "  return bar*(1.0 - gap);",
      "}"
    ].join("\n") + OBLIQUE
  }

  ];

  /* ---------------------------------------------------------------- renderer */

  var MAXW = 1920, MAXH = 1200;

  function Renderer() {
    var canvas = document.createElement("canvas");
    canvas.width = MAXW; canvas.height = MAXH;
    var gl = canvas.getContext("webgl", {
      antialias: false, alpha: false, depth: false,
      preserveDrawingBuffer: true, powerPreference: "high-performance"
    });
    if (!gl) return null;
    gl.getExtension("OES_standard_derivatives");

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    var progs = {};

    function build(variant) {
      function sh(type, src) {
        var s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
          console.error(variant.slug, gl.getShaderInfoLog(s));
          return null;
        }
        return s;
      }
      var vs = sh(gl.VERTEX_SHADER, VS);
      var fs = sh(gl.FRAGMENT_SHADER, PRELUDE + variant.frag + MAIN);
      if (!vs || !fs) return null;
      var pr = gl.createProgram();
      gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
      if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) {
        console.error(variant.slug, gl.getProgramInfoLog(pr));
        return null;
      }
      var loc = gl.getAttribLocation(pr, "a");
      var u = {
        res: gl.getUniformLocation(pr, "uRes"),
        t: gl.getUniformLocation(pr, "uT"),
        grain: gl.getUniformLocation(pr, "uGrain"),
        c: [0, 1, 2, 3, 4].map(function (i) { return gl.getUniformLocation(pr, "uC" + i); })
      };
      return { prog: pr, loc: loc, u: u };
    }

    return {
      canvas: canvas,
      /** Draw one field into the lower-left w×h of the scratch buffer. */
      draw: function (variant, t, w, h, stops, grain) {
        var p = progs[variant.slug];
        if (p === undefined) { p = progs[variant.slug] = build(variant); }
        if (!p) return false;
        if (w > canvas.width || h > canvas.height) {
          canvas.width = Math.max(canvas.width, w);
          canvas.height = Math.max(canvas.height, h);
        }
        gl.useProgram(p.prog);
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.enableVertexAttribArray(p.loc);
        gl.vertexAttribPointer(p.loc, 2, gl.FLOAT, false, 0, 0);
        gl.viewport(0, 0, w, h);
        gl.uniform2f(p.u.res, w, h);
        gl.uniform1f(p.u.t, t);
        gl.uniform1f(p.u.grain, grain ? 1 : 0);
        for (var i = 0; i < 5; i++) {
          var c = stops[i];
          gl.uniform3f(p.u.c[i], c[0], c[1], c[2]);
        }
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        return true;
      },
      /** Where the last draw of size (w,h) sits inside the scratch canvas. */
      srcY: function (h) { return canvas.height - h; }
    };
  }

  var shared = null;
  function renderer() {
    if (!shared) shared = Renderer();
    return shared;
  }

  /* -------------------------------------------------------------------- units */

  /** A field bound to one visible 2D canvas. Owns its own clock. */
  function createUnit(canvas, variant, opts) {
    opts = opts || {};
    var ctx = canvas.getContext("2d");
    var unit = {
      canvas: canvas, ctx: ctx, variant: variant,
      t: 0, speed: opts.speed == null ? 0.7 : opts.speed,
      playing: opts.playing !== false,
      pal: opts.pal || 0, stops: opts.stops || PALETTES[0].stops,
      grain: opts.grain !== false,
      visible: true, dragging: false
    };

    if (variant.kind === "2d") {
      var carry = 0, lastT = -1, painted = false;

      /*
       * Where a particle is likely to land: the same two-slit field the wave
       * panels draw, summed as amplitudes and squared, so the two panels agree
       * about the same experiment.
       *
       * It used to be cos^2(k*dr/2) over a falloff, with no aperture term at
       * all. That is the right fringe pattern but the wrong envelope: a bare
       * pair of point sources radiates a full circle, so dots landed evenly out
       * along the wall to the far corners, where a screen behind a barrier
       * would catch almost nothing. Each gap now carries the cos(theta)
       * obliquity of a hole in a flat screen and the sin(u)/u envelope of a gap
       * with width, exactly as in the two-slit shader.
       *
       * NORM keeps the peak just under 1. The old form peaked at 1.6 after the
       * caller's 0.85, and everything above 1 is accepted unconditionally — a
       * saturated patch draws uniform speckle no matter what the fringes are
       * doing underneath it.
       */
      unit.intensity = function (x, y) {
        var YB = -0.80, D = 0.22, K = 30.0, AP = 0.045, NORM = 0.37;
        if (y < YB + 0.08) return 0;
        var re = 0, im = 0;
        for (var i = 0; i < 2; i++) {
          var vx = x - (i * 2 - 1) * D, vy = y - YB;
          var r = Math.hypot(vx, vy) || 1e-4;
          var ob = Math.max(vy / r, 0);
          var u = K * AP * (vx / r);
          var sc = Math.abs(u) < 1e-3 ? 1 : Math.sin(u) / u;
          var a = ob * sc / Math.sqrt(0.35 + 1.6 * r);
          re += a * Math.cos(K * r);
          im += a * Math.sin(K * r);
        }
        return (re * re + im * im) * NORM;
      };

      unit.paint = function (w, h) {
        var p = unit.stops.map(rgbToCss);
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w; canvas.height = h; painted = false;
        }
        if (!painted) { ctx.fillStyle = p[0]; ctx.fillRect(0, 0, w, h); painted = true; }

        var dt = lastT < 0 ? 0 : Math.min(0.1, Math.max(0, unit.t - lastT));
        lastT = unit.t;

        ctx.fillStyle = p[0];
        ctx.globalAlpha = Math.min(0.035, dt * 0.042);
        ctx.fillRect(0, 0, w, h);
        ctx.globalAlpha = 1;

        var scale = Math.min(w, h) / 2;
        carry += dt * 2600;
        var tries = Math.min(4000, Math.floor(carry));
        carry -= tries;
        for (var i = 0; i < tries; i++) {
          var px = (Math.random() * 2 - 1) * (w / scale);
          var py = (Math.random() * 2 - 1) * (h / scale);
          if (Math.random() > unit.intensity(px, py) * 0.85) continue;
          ctx.fillStyle = Math.random() < 0.12 ? p[4] : p[3];
          ctx.globalAlpha = 0.75;
          ctx.fillRect(w / 2 + px * scale, h / 2 - py * scale, 1.6, 1.6);
        }
        ctx.globalAlpha = 1;

        ctx.fillStyle = p[3];
        ctx.globalAlpha = 0.35;
        var by = h / 2 + 0.8 * scale;
        ctx.fillRect(0, by, w, 1);
        ctx.globalAlpha = 1;
        ctx.clearRect(w / 2 - 0.245 * scale, by - 1, 0.05 * scale, 3);
        ctx.clearRect(w / 2 + 0.195 * scale, by - 1, 0.05 * scale, 3);
      };
    } else {
      unit.paint = function (w, h) {
        var R = renderer();
        if (!R) return;
        if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
        if (!R.draw(variant, unit.t, w, h, unit.stops, unit.grain)) return;
        ctx.drawImage(R.canvas, 0, R.srcY(h), w, h, 0, 0, w, h);
      };
    }

    /** Advance the clock, wrapping inside the loop so time never drifts large. */
    unit.tick = function (dt) {
      if (!unit.playing || unit.dragging) return;
      unit.t += dt * unit.speed;
      if (variant.loop) unit.t = unit.t % variant.loop;
    };

    unit.setPalette = function (i, stops) { unit.pal = i; unit.stops = stops; };

    return unit;
  }

  function bySlug(slug) {
    for (var i = 0; i < VARIANTS.length; i++) if (VARIANTS[i].slug === slug) return VARIANTS[i];
    return null;
  }

  return {
    VARIANTS: VARIANTS,
    PALETTES: PALETTES,
    createUnit: createUnit,
    bySlug: bySlug,
    rampFromHex: rampFromHex,
    rgbToCss: rgbToCss,
    renderer: renderer
  };
})();
