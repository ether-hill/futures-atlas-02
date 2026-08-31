/*
  Interference — the shared field library.

  One place for the fields, their explainers, and the rendering. Loaded by both
  surfaces of this bundle:
    • index.html  — the gallery, with global and per-field controls
    • embed.html  — one field, full bleed, driven by the query string

  Three things are worth knowing before editing:

  1. ONE WebGL CONTEXT. Every field draws into a single offscreen GL canvas and
     is then blitted into that card's own 2D canvas. Browsers cap live WebGL
     contexts (~16), so a page of fifteen fields each holding its own context is
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
    "  float e = 0.006;",
    "  float h  = height(p);",
    "  float hx = height(p+vec2(e,0.0)) - h;",
    "  float hy = height(p+vec2(0.0,e)) - h;",
    "  vec3 n = normalize(vec3(-hx*30.0, -hy*30.0, e*30.0));",
    "  vec3 L = normalize(vec3(-0.40, 0.55, 0.62));",
    "  float diff = max(dot(n,L), 0.0);",
    "  float spec = pow(max(dot(reflect(-L,n), vec3(0.0,0.0,1.0)), 0.0), 90.0);",
    "  float fres = pow(1.0-n.z, 2.4);",
    "  vec3 col = mix(rampI(0.02), rampI(0.40), clamp(fres*1.7, 0.0, 1.0));",
    "  col += rampI(0.60)*diff*0.06;",
    "  col += rampI(1.00)*spec*(0.9 + 0.55*HGAIN);",
    "  col += rampI(clamp(h*h*6.5*HGAIN, 0.0, 1.0))*0.46;",
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
    "  float decay = exp(-tau*0.13)*exp(-r*0.50)/sqrt(0.30 + r*2.0);",
    "  return sin(KD*d + 1.1)*pack*decay*fade;",
    "}",
    ""
  ].join("\n");

  /* ------------------------------------------------------------------ fields */

  var VARIANTS = [

  {
    slug: "droplets",
    title: "Two droplets",
    loop: 6.0,
    note: "Two drips into still water, landing together. Where the rings cross, they add.",
    read: [
      ["What you are seeing",
       "Two drops land on still water at the same instant, and each sends out a ring. Where a crest from the left meets a crest from the right the water rises higher than either drop could manage alone; where a crest meets a trough it barely moves at all. The chequered lobes above and below the pair are the first kind of place. The calm lanes fanning out from between them are the second, and they hold still while everything around them travels."],
      ["Where the quantum comes in",
       "Nothing quantum is happening here, which is the useful part. Adding waves is a property of waves, not of quantum mechanics, so this is already the geometry of the double slit: bright where the two path lengths differ by a whole wavelength, dead where they differ by half of one. What changes in the quantum case is what does the adding. Here it is the height of the water, measurable everywhere at once. There it is an amplitude nobody ever sees directly, which shows itself only in where the detections land."],
      ["How it is built",
       "Each drop is a wave packet expanding at a fixed speed: a sine in the distance behind the ring front, inside a Gaussian envelope that rides along with it, with amplitude falling as one over the square root of the distance, which is how energy spreads across a surface. Five drops per source stay in flight and the oldest is tapered to nothing, so the loop closes without a step. Real water is dispersive and would let short ripples outrun the packet; this one is not. The surface is then shaded by its own slope rather than plotted as a height."]
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
       "Two points on the surface driven up and down together, at one frequency, without stopping. This is the apparatus a physics department keeps in a cupboard: a shallow tray, two dippers on a bar, a lamp above and a screen below. Because the driving never stops the picture reaches a steady state, so the ripples keep travelling outwards while the calm channels between them stand perfectly still."],
      ["Where the quantum comes in",
       "This is the double slit in a tray of water, with each dipper playing a slit. Count the calm channels against the dipper spacing and you have measured the wavelength, which is exactly the arithmetic used to get the wavelength of an electron out of a fringe pattern. What the tray cannot show you is the part that matters: what happens when the waves arrive one lump at a time."],
      ["How it is built",
       "The height is the sum of two circular waves, each a sine in distance minus a sine in time, with amplitude falling as one over the square root of the distance and a little extra damping. The calm channels are where the path difference is an odd number of half wavelengths, which makes them hyperbolas with the dippers as foci. The whole field repeats every wave period, and that period is the loop."]
    ],
    frag: [
      "const float HGAIN = 0.42;",
      "const float W = TAU/6.0;",
      "const float K = 26.0;",
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
    note: "Five drops on a cycle, out of step with each other. Every crossing is an interference.",
    read: [
      ["What you are seeing",
       "Five drops falling in sequence rather than together, so the surface is never carrying only one pattern. Rings from a drop that landed seconds ago cross rings from one that landed a moment ago, and those crossings are as real as the tidy symmetric ones a matched pair produces. Nothing lines up and nothing is centred."],
      ["Where the quantum comes in",
       "This is what interference looks like when nobody has arranged the apparatus. Amplitudes add wherever they meet, so the clean two source figure elsewhere on this page is the special case rather than the general one. It is also why isolating a clean quantum interference experiment takes so much work: the ordered version is something you build, and the messy version is what you get for free."],
      ["How it is built",
       "The same drop model as the first panel, with five sources whose drop times are spread evenly through one period. Each source's age is taken modulo that period so the sequence repeats exactly, and the oldest ripple in every stack is faded out before it would fall out of the window. Three generations per source, so fifteen expanding rings are on the surface at any moment."]
    ],
    frag: DROP + [
      "const float HGAIN = 0.75;",
      "const float TR = 9.0;",
      "vec2 src(int i){",
      "  if(i==0) return vec2(-0.72, 0.34);",
      "  if(i==1) return vec2( 0.58, 0.52);",
      "  if(i==2) return vec2( 0.06,-0.28);",
      "  if(i==3) return vec2(-0.34,-0.62);",
      "  return vec2( 0.86,-0.14);",
      "}",
      "float height(vec2 p){",
      "  float h = 0.0;",
      "  for(int i=0;i<5;i++){",
      "    float off = TR*float(i)/5.0;",
      "    float tau0 = mod(uT - off + TR, TR);",
      "    for(int n=0;n<3;n++){",
      "      h += dropWave(p, src(i), tau0 + float(n)*TR, 0.30, 28.0, 3.0*TR);",
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
       "A wave arrives at a wall from below and finds two narrow openings. Each opening becomes a new source spreading in every direction, and the region beyond the wall carries one pattern built from both. The bright fans are the directions where the two path lengths differ by a whole number of wavelengths. The faint steady glow beneath the moving crests is the time average, which is all a photographic plate ever records."],
      ["Where the quantum comes in",
       "This is the experiment. Thomas Young ran it with sunlight around 1801 and used it to argue that light is a wave, and it has since been run with electrons, neutrons, whole atoms and molecules of several hundred atoms, each of which draws this same figure. The fringe spacing is set by the ratio of the wavelength to the gap between the openings, which is what turns the picture into an instrument: measure the spacing and you have the wavelength of whatever went through."],
      ["How it is built",
       "Each slit is treated as a point source, so the field is the sum of two circular waves with amplitude falling as one over the square root of the distance. The picture is the square of the instantaneous sum, with the time averaged intensity laid faintly underneath. A real slit has width, which multiplies the fringes by a sinc squared envelope and dims the outer fans. That term is not modelled, so the outer fans here are brighter than a real apparatus would give."]
    ],
    frag: [
      "const float K = 30.0;",
      "const float W = TAU/2.5;",
      "const float D = 0.22;",
      "const float YB = -0.80;",
      "",
      "vec3 render(vec2 p){",
      "  vec2 F = vec2(0.0);",
      "  for(int i=0;i<2;i++){",
      "    vec2 s = vec2((float(i)*2.0-1.0)*D, YB);",
      "    float r = length(p-s);",
      "    F += (1.0/sqrt(0.16+r*2.4))*vec2(cos(K*r), sin(K*r));",
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
       "The same wall with seven openings. Adding slits does not add fringes, it sharpens them: broad fans become narrow spikes with dim gaps between them, because a direction only stays bright if all seven contributions arrive in step, and that is a far harder condition than agreement between two. The strip along the top is the time averaged intensity at that height, which is what a detector placed there would read."],
      ["Where the quantum comes in",
       "The width of each maximum falls roughly as one over the number of slits. That is why a grating ruled with thousands of lines separates colours differing by a fraction of a nanometre, and it is the same reason an interferometer with more arms measures more finely. More amplitudes have to agree, so the agreement is a sharper condition."],
      ["How it is built",
       "Seven point sources, one sum, exactly as in the two slit panel. The screen strip samples the same sum along a fixed height and squares it. This is the near field rather than the far field a spectrograph works in, and again there is no slit width envelope, so read the relative brightness of the outer spikes as illustrative rather than measured."]
    ],
    frag: [
      "const float K = 34.0;",
      "const float W = TAU/2.5;",
      "",
      "vec2 fieldAt(vec2 q){",
      "  vec2 F = vec2(0.0);",
      "  for(int i=0;i<7;i++){",
      "    vec2 s = vec2((float(i)-3.0)*0.145, -0.80);",
      "    float r = length(q-s);",
      "    F += (1.0/sqrt(0.16+r*2.2))*vec2(cos(K*r), sin(K*r));",
      "  }",
      "  return F;",
      "}",
      "",
      "vec3 render(vec2 p){",
      "  vec2 F = fieldAt(p);",
      "  float inst = F.x*cos(W*uT) + F.y*sin(W*uT);",
      "  vec3 col = rampI(tm(inst*inst*0.30));",
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
    slug: "nodal-lines",
    title: "Nodal lines",
    loop: 20.0,
    note: "Only the silence, drawn. The sources drift apart and the fan opens.",
    read: [
      ["What you are seeing",
       "Everything else stripped away, leaving only the dead curves: the places where the two paths differ by an odd number of half wavelengths, so the two arrivals cancel and the surface never moves. As the sources drift apart another pair of curves has to appear, and you can watch them peel off the centre line one at a time."],
      ["Where the quantum comes in",
       "These are the dark fringes of every other panel, drawn on their own. In a quantum version they are the places a particle is never found, and the reason is worth stating carefully: nothing steers the particle away from them. The amplitude for arriving by one path and the amplitude for arriving by the other cancel exactly, and the probability is the square of that sum, so it is zero."],
      ["How it is built",
       "No waves are computed at all. This is pure geometry: a line is inked wherever the cosine of half the path difference crosses zero, anti-aliased against the screen space derivative of that phase so the curves keep one weight across the frame. They are hyperbolas with the sources as foci, and their number is set by how many half wavelengths fit between the sources, which is why the count changes as the separation is animated."]
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
    title: "Contours",
    loop: 4.0,
    note: "The same field as a survey map. Every line is one height of water.",
    read: [
      ["What you are seeing",
       "A contour map of the same two source field, one line per height of water, drawn the way an ordnance map draws a hill. Close lines mean a steep slope and wide lines a gentle one; the small closed ovals are level ground, which is either a crest, a trough or a genuinely dead spot."],
      ["Where the quantum comes in",
       "The spacing of the lines is the local wavelength, and for a quantum wavefunction the local wavelength is the momentum, through de Broglie's relation. A map like this drawn from a wavefunction shows you where the particle is moving fast, which is wherever the contours crowd. It also makes plain that there is one field across the whole frame rather than two patterns overlapping."],
      ["How it is built",
       "The same sum of two circular waves. The field is scaled and split into bands, and a line is drawn wherever a band boundary falls, with the threshold divided by the screen space gradient so the lines stay even in weight whether the surface there is steep or flat."]
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
    slug: "one-at-a-time",
    kind: "2d",
    loop: null,
    title: "One at a time",
    note: "Detections arriving singly. No fringe exists in any one of them.",
    read: [
      ["What you are seeing",
       "Each dot is one arrival. Early on the screen looks like scatter, and the bands only assemble once enough of them have landed. No fringe is visible in any single detection and none can be, because one particle lands in exactly one place."],
      ["Where the quantum comes in",
       "This is the strange part, and it is quantum all the way down. Send the particles so slowly that only one is ever inside the apparatus and the pattern still builds, so the pattern is not particles interfering with each other. It is the amplitude for each available path contributing to where that one particle can land. It has been done for real, though not always with slits: G. I. Taylor photographed a needle's diffraction shadow in 1909 with light so feeble that the exposure ran for three months, and Tonomura's team at Hitachi filmed single electrons accumulating into fringes in 1989."],
      ["How it is built",
       "The only panel here that is not a shader. Candidate positions are drawn at random and kept with a probability proportional to the two slit intensity, the squared cosine of half the path difference with a falloff for distance, at a few thousand attempts a second, onto a 2D canvas that fades very slowly so the record settles instead of filling in solid. It is also the only panel without a loop, because an accumulating record has no period, only a history."]
    ]
  },

  {
    slug: "vortex",
    title: "Vortex lattice",
    loop: 24.0,
    note: "Three plane waves at 120 degrees, coloured by phase. Each dark point is a singularity.",
    read: [
      ["What you are seeing",
       "Three plane waves of one wavelength and one frequency, crossing at 120 degrees to each other. Brightness is amplitude and hue is phase, so one trip around the colour cycle is one trip around the wave cycle. The dark points are not gaps in the drawing."],
      ["Where the quantum comes in",
       "Walk a small circle around one of those points and the hue passes through every value exactly once. The phase has no single value at the centre, and the only way a wave can stay continuous around such a point is for its amplitude to be zero there. Nye and Berry catalogued these in 1974. They are everywhere: laser speckle off a rough wall, radio in a room with walls, and, carrying the same winding as a quantized vortex, in superfluids and Bose Einstein condensates."],
      ["How it is built",
       "The sum of three unit plane waves, coloured by the argument of that sum and dimmed by its magnitude. One frequency for all three is what makes it a lattice: the amplitude pattern holds still while the phase advances everywhere at once. The motion is geometric rather than optical, the three beam directions turning through a third of a revolution per loop, which is a symmetry of the triangle and therefore brings the same field back."]
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
    slug: "carpet",
    title: "Quantum carpet",
    loop: 20.0,
    note: "A particle in a square box. Eight standing modes, beating in and out of step.",
    read: [
      ["What you are seeing",
       "A quantum particle confined to a square box. What is drawn is the probability density, the thing that says where it would be found if you looked. It sloshes about in a way that looks disorderly, gathers itself, and returns exactly to where it started."],
      ["Where the quantum comes in",
       "Only certain standing waves fit inside a box, and each has an energy proportional to the sum of the squares of its two mode numbers. A particle in a superposition of eight of them has eight phases advancing at eight different rates, which is the disorder you are watching. Because those rates are whole numbers times one common unit they all come back into step at once, and the state revives. Revivals like this have been observed in Rydberg atoms and in cold atoms held in optical lattices."],
      ["How it is built",
       "The exact eigenfunctions of the box, a sine in x times a sine in y, summed with fixed weights, each turning in phase at a rate proportional to n squared plus m squared. The picture is the squared magnitude of that sum. Nothing here is approximated, which is why the loop is precisely the revival time rather than a convenient place to cut."]
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
       "Two Gaussian humps swing towards each other, pass through one another and separate again, twice per cycle. Fringes appear in the overlap and are at their finest exactly as the two coincide, then vanish completely when the humps reach the far ends of the swing."],
      ["Where the quantum comes in",
       "A coherent state is as close as a quantum particle comes to behaving classically: a Gaussian that swings in a harmonic trap at the trap frequency without spreading, which is the one case where a wavepacket does not. Two of them released in antiphase are the textbook Schrodinger cat state, and the fringes in the middle are the part that says superposition rather than mixture. A coin flip between one packet and the other would give two humps with smooth nothing in between."],
      ["How it is built",
       "Position runs on a cosine and momentum on a sine, a quarter cycle behind it, exactly as a classical oscillator does, and each packet carries the phase factor belonging to its own momentum. That is why the fringes disappear at the turning points, where both packets are momentarily at rest, and are finest at the crossing, where they are moving fastest in opposite directions. The spacing is set by the momentum difference and by nothing else. Remove the trap and the packets spread and never return, which is why the loop is a trapped one."]
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
       "Twenty four emitters on a circle, all at one frequency. While they are in step, everything they emit arrives at the centre together and the middle is the brightest point in the field. Then a phase is added that climbs once, twice, three times around the ring, and the bright centre hollows out into a ring of its own."],
      ["Where the quantum comes in",
       "That hollow centre is the same object as the dark cores in the vortex lattice. A field whose phase winds around a point cannot have a single value there, so the amplitude has to vanish. The number of turns is the beam's orbital angular momentum, one unit of h-bar per photon per turn, and it is a property a single photon can carry and a detector can measure."],
      ["How it is built",
       "Twenty four point sources summed, with the winding number times the angle around the ring added to each source's phase. That number steps from zero to three across the loop and starts again. The array is a real technique rather than a picture of one: phasing an array like this is how radar, ultrasound and radio telescopes focus and steer without moving anything."]
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
    slug: "twisted",
    title: "Twisted light",
    loop: 20.0,
    note: "Two beams carrying opposite twist, added. The petals turn because the frequencies differ.",
    read: [
      ["What you are seeing",
       "A rosette of six petals with a fainter ring outside it, turning slowly. The petals are not objects. They are the places where two beams agree, and the agreement is what moves."],
      ["Where the quantum comes in",
       "Each beam is a Laguerre Gauss mode, a doughnut whose phase winds three times around a dark centre. Add one twisted one way to one twisted the other and the windings cancel into six fixed petals, because plus l and minus l agree at 2l angles. Detune the two slightly and the agreement condition rotates, so the petals turn at the difference frequency rather than at the frequency of the light, and trapped particles follow them round. That is the optical spanner. A single photon in the same superposition of plus and minus l has these petals as its detection probability."],
      ["How it is built",
       "The radial profile is the genuine mode with p equal to 1 and l equal to 3: the radius cubed, times four minus two radii squared, times a Gaussian, which is the correct associated Laguerre polynomial and is where the outer ring comes from. That is multiplied by the cosine of three times the angle, offset in time, and squared. The rotation is one full revolution per loop."]
    ],
    frag: [
      "vec3 render(vec2 p){",
      "  float r = length(p), th = atan(p.y, p.x);",
      "  float w = 0.42;",
      "  float u = r/w;",
      "  float rad = pow(u, 3.0) * (4.0 - 2.0*u*u) * exp(-u*u) * 0.90;",
      "  float amp = rad * cos(3.0*th - TAU*uT/20.0);",
      "  float dens = amp*amp*9.0;",
      "  vec3 col = rampI(tm(dens*1.6));",
      "  col += rampC(0.5*(1.0 - sign(amp))) * min(dens,1.0) * 0.10;",
      "  return col;",
      "}"
    ].join("\n")
  },

  {
    slug: "beats",
    title: "Beats",
    loop: 24.0,
    note: "Two sources detuned by a twelfth. The pattern never settles.",
    read: [
      ["What you are seeing",
       "Two sources, one detuned from the other by a twelfth. Nothing in the picture ever settles: the whole fringe pattern sweeps across the frame and comes back."],
      ["Where the quantum comes in",
       "The sweep rate is the difference between the two frequencies and nothing else, which is the trick behind a great deal of measurement: heterodyne detection, laser frequency combs, gravitational wave interferometers, and a piano tuner listening to two strings. In atomic physics the same arithmetic is a quantum beat, with one difference worth stating plainly. A quantum beat is one emitter in a superposition of two levels, not two separate sources, and its fluorescence carries the difference frequency. This is the classical version of it."],
      ["How it is built",
       "Two circular waves, each with its own frequency and its own wavenumber in the same twelve to thirteen ratio, so both travel at one speed, as they must if they share a medium. The picture is the squared magnitude of the sum. The beat period, one over the frequency difference, is the loop."]
    ],
    frag: [
      "const float B = TAU/24.0;",
      "",
      "vec3 render(vec2 p){",
      "  vec2 s1 = vec2(-0.92, -0.52), s2 = vec2(0.92, -0.52);",
      "  float r1 = length(p-s1), r2 = length(p-s2);",
      "  float a1 = 1.0/sqrt(0.24+r1*1.6), a2 = 1.0/sqrt(0.24+r2*1.6);",
      "  /* one medium: k is proportional to omega, 12:13 in both */",
      "  float ph1 = 30.0*r1 - 12.0*B*uT;",
      "  float ph2 = 32.5*r2 - 13.0*B*uT;",
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
       "The two slit pattern with one number changed. The fringes fade until the dark bands are as bright as the light ones, then come back. The bar along the bottom is that number. Nothing else moves: the sources stay where they are and each delivers the same intensity throughout."],
      ["Where the quantum comes in",
       "The number is visibility, the contrast of the fringes. Losing it is what decoherence does, and it needs nothing dramatic: sources that drift out of step will do it, and so will anything in the environment that records which path was taken. The trade is quantitative rather than philosophical. Englert's relation holds that visibility squared plus path distinguishability squared cannot exceed one, so partial information about the path costs exactly this much contrast."],
      ["How it is built",
       "The intensity is the sum of the two separate intensities plus an interference term, two gamma times the square root of their product times the cosine of the path difference. Gamma is swept from one to zero and back across the loop. Only that one term is touched, and at gamma equal to zero what is left is the plain sum of the two sources, which is exactly what a mixture would give."]
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

      unit.intensity = function (x, y) {
        if (y < -0.72) return 0;
        var d = 0.22, k = 30.0;
        var r1 = Math.hypot(x + d, y + 0.8), r2 = Math.hypot(x - d, y + 0.8);
        var c = Math.cos(k * (r1 - r2) * 0.5);
        return (c * c) / (0.35 + 1.6 * Math.min(r1, r2));
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
