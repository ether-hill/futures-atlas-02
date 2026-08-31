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
       "Two drops hit the water at the same moment, and each one sends out a ring. Where two crests meet, the water piles up higher than either drop could manage on its own. Where a crest meets a dip, they cancel and the surface stays flat. The calm lanes fanning out from the middle are those cancellations, and they stay put while the rings travel through them."],
      ["Where the quantum comes in",
       "Waves add up. That is the whole rule, and it is the same rule for water, sound, light and electrons. The famous double slit experiment is this picture with two openings instead of two drops. The difference is that here you can watch the water itself, while in the quantum version you never see the wave at all. You only see where the particles land, and they land in this pattern."],
      ["How it is built",
       "There is no video and no image file. A short program runs on your graphics card once for every pixel of the panel, sixty times a second. Each pixel measures its own distance to the two impact points, works out how high each ring has lifted the water there, adds them, and turns the total into a colour. No pixel knows what any other pixel is doing, which is exactly why a graphics card can do a million of them at once."]
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
       "Two dippers bob up and down in a tray of water, always in step, never stopping. Rings spread from both and cross. The bright bands are where crests land on crests. The calm channels are where a crest always meets a dip, so the water along them never moves."],
      ["Where the quantum comes in",
       "This is the double slit with the mystery removed, each dipper standing in for a slit. Measure how far apart the calm channels are and you can work out the wavelength, which is exactly how the wavelength of an electron is read off a fringe pattern. The one thing a tray of water cannot show you is what happens when the wave arrives in single lumps."],
      ["How it is built",
       "Every pixel asks two questions: how far am I from this dipper, how far from that one. It puts each distance into a sine wave, adds the two, and gets a height. The shading is then honest fakery: the pixel compares its height with its neighbour's to work out which way the surface tilts, and lights it as if a lamp were hanging above the tray."]
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
       "Five drops falling one after another rather than together. Old rings from one drop cross fresh rings from another. It looks untidy because it is: nothing lines up, and no two crossings look the same."],
      ["Where the quantum comes in",
       "Interference is not a trick that only works in a tidy experiment. Any two waves arriving at the same place add up, every time. The neat symmetrical patterns elsewhere on this page are the rare case, built deliberately by putting two matched sources side by side. This is what you get when nobody arranges anything, and it is part of why quantum experiments need such careful isolation to show a clean result."],
      ["How it is built",
       "The same per pixel idea, five times over. Each pixel runs through five drop points, and for each one adds up the last three rings that drop has sent out, so fifteen expanding rings are being summed at every pixel of every frame. That is a few million sine waves per frame, which sounds absurd and takes the graphics card about a millisecond."]
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
       "A wave rolls in from the bottom and meets a wall with two gaps. Each gap acts as a fresh source, and beyond the wall the two spread into a single pattern of bright fans and dark gaps between them. The faint steady glow under the moving crests is the long exposure: the average over time, which is what a camera would actually record."],
      ["Where the quantum comes in",
       "This is the most famous experiment in physics. Thomas Young ran it with sunlight around 1801 to argue that light is a wave. It has since been run with electrons, neutrons, whole atoms and molecules made of hundreds of atoms, and every one of them draws this same figure. A fan is bright where the two routes to it differ by a whole number of wavelengths, so the two arrivals are in step and reinforce."],
      ["How it is built",
       "Each gap is treated as a point that emits circles. Every pixel adds two circular waves and squares the answer, because brightness goes as the square of a wave's height. The wall and the incoming wave below it are the same program with a couple of extra rules about which pixels count as barrier. Real gaps have width, which would dim the outer fans, and that refinement is left out."]
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
       "The same wall, now with seven gaps. The broad fans have tightened into narrow spikes with dark space between them. The strip across the top is a screen: it shows the average brightness that would land there, and unlike the field below it, it holds still."],
      ["Where the quantum comes in",
       "Two sources only have to agree with each other. Seven have to agree all at once, which is a far fussier condition, so the bright directions get narrower. That is why a grating ruled with thousands of lines can separate two colours a fraction of a nanometre apart, and it is a large part of how we know what stars are made of."],
      ["How it is built",
       "The loop inside the shader runs seven times instead of twice. That is the only change from the previous panel, and it is a good demonstration of why this is worth doing on a graphics card: seven times the work per pixel costs nothing you can feel. The strip along the top is the same sum taken at one fixed height, so each pixel up there is reporting a value from further down the field."]
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
       "Only the silent places, drawn as lines on paper. Along these curves the two waves always cancel, so the water there never moves at all. Watch the two dots drift apart and new curves peel away from the middle, one pair at a time."],
      ["Where the quantum comes in",
       "These are the dark bands from every other panel, on their own. In the quantum version they are the places a particle is never found, and it is worth being careful about why. Nothing pushes it away, and both routes stay open. The two contributions simply cancel, and the chance of landing there is zero. Cancelling is something waves do, and quantum mechanics says that chances follow wave rules."],
      ["How it is built",
       "No wave is drawn here at all. Each pixel works out the difference between its two distances and asks whether that difference sits on a half wavelength boundary. If it does, the pixel is ink; otherwise it is paper. To stop the curves getting fat where they run slowly and vanishing where they run fast, the pixel also asks the graphics card how quickly that difference is changing between it and the pixel next door, and sets the thickness from that."]
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
       "The same two source pattern drawn as a hill map. Every line joins places at the same water height, exactly like contour lines on a walking map. Lines packed close mean a steep slope, lines far apart mean gentle, and the small closed rings are the tops and the bottoms."],
      ["Where the quantum comes in",
       "You can read the wavelength off a map like this by eye: it is the distance from one ring to the next. For a quantum particle that spacing means something specific. A shorter wavelength means more momentum, which is de Broglie's idea, so crowded rings mean a fast particle. It also shows there is one single field across the whole frame, rather than two patterns lying on top of each other."],
      ["How it is built",
       "Each pixel adds the two waves, multiplies by a small number and keeps only the fractional part, which turns a smooth surface into a staircase. A line is drawn wherever a pixel lands on the edge of a step. Graphics cards can tell a pixel how different its value is from its neighbours, and that number sets the width of the test, so every line comes out the same weight."]
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
       "Dots arriving one at a time, each one a single particle hitting the screen. At first it looks like random speckle. Keep watching and the bands assemble themselves."],
      ["Where the quantum comes in",
       "This is the part that should bother you. Slow the source down until only one particle is inside the machine at a time and the stripes still build, so they cannot be particles bumping into one another. Each particle has to be described by something that passed through both openings, and that something sets the odds of where it lands. It has been done for real: G. I. Taylor in 1909, with light so dim his photograph took three months, and a team at Hitachi in 1989 who filmed single electrons piling up into fringes."],
      ["How it is built",
       "The only panel not drawn on the graphics card. This one is plain drawing code: pick a random spot, look up how likely a particle is to land there, keep it or throw it away, and do that a few thousand times a second. Old dots fade slowly so the picture settles instead of filling in solid, and it is the only panel with no loop, because a record that keeps growing has no natural repeat."]
    ]
  },

  {
    slug: "vortex",
    title: "Vortex lattice",
    loop: 24.0,
    note: "Three plane waves at 120 degrees, coloured by phase. Each dark point is a singularity.",
    read: [
      ["What you are seeing",
       "Three waves crossing at even angles make a honeycomb. Colour shows the phase, which is where in its up and down cycle the wave is at that spot, and brightness shows how strong it is. The black points are places where the wave has no strength at all."],
      ["Where the quantum comes in",
       "Circle one of those black points and the colour runs through the whole wheel exactly once. That means there is no single answer for the phase at the centre, and the only way out is for the wave to be precisely zero there. Physicists call them phase singularities. The same knot turns up in laser light bounced off a rough wall, in radio inside a room, and in superfluids, where it becomes a whirlpool that can only spin by fixed amounts."],
      ["How it is built",
       "Every pixel adds three plane waves, then does something the other panels do not. Instead of using the height of the result it uses the angle of it, which is the phase, and maps that angle around the colour wheel. Brightness comes from the size. So the black points are not drawn in: they appear because the three waves genuinely cancel there, and the shader has nothing left to colour."]
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
       "A quantum particle shut inside a square box. The glow shows where it would probably be found. It slops about, appears to lose its shape entirely, then gathers itself back into the pattern it started from."],
      ["Where the quantum comes in",
       "Only certain wave shapes fit inside a box, in the same way that only certain notes fit on a guitar string. Each shape has its own energy and cycles at its own speed, so a particle sharing itself between eight of them gets steadily more scrambled. The speeds are all whole number multiples of one basic rate, so sooner or later they line up again and the original shape returns. It is called a revival, and it has been watched in real atoms."],
      ["How it is built",
       "The textbook shapes for a box are just sines, so each pixel evaluates eight of them, turns each one by an angle set by its energy, adds them up and squares the total. Nothing is approximated, so the loop is exactly one revival: the moment when all eight angles arrive back where they started. That is why the animation repeats rather than being cut to repeat."]
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
       "Two blobs swing towards each other, pass straight through, and swing apart again. Stripes appear between them as they overlap, sharpest at the moment they sit exactly on top of each other, and gone completely when the blobs reach the ends of their swing."],
      ["Where the quantum comes in",
       "A single particle can be spread across two places at once, in the sense that the wave describing it has two humps. That is a Schrodinger cat state in miniature. The stripes are the giveaway. If the particle were really in one place or the other with a coin flip deciding which, you would see two humps and smooth nothing between them. The stripes exist only because both halves are there together, adding."],
      ["How it is built",
       "The blobs sit in a trap, the one situation where a quantum blob keeps its shape instead of spreading out. Each pixel adds two bell curves, each carrying a phase that depends on how fast that blob is moving. Position rides a cosine and speed rides a sine a quarter cycle behind, exactly like a pendulum, fastest in the middle and still at the ends. That is why the shader draws the finest stripes at the crossing and none at all at the turning points."]
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
       "Twenty four small sources arranged in a circle, all humming at the same pitch. While they are in step everything meets in the middle and the centre is the brightest point in the picture. Then the timings are given a twist, and the bright centre opens up into a ring with a hole in it."],
      ["Where the quantum comes in",
       "The hole is not a fault. If the phase has to wind around a point, there is no consistent value at the middle, so the wave has to be zero there. The number of turns is a real countable property of a beam, called orbital angular momentum, and a single photon can carry it. Arrays like this earn their keep in the world: radar, ultrasound scanners and radio telescopes all focus and steer by changing timings rather than moving anything."],
      ["How it is built",
       "Each pixel loops around twenty four source positions, measures its distance to every one and adds a wave from each. The twist is one extra term: each source has its phase nudged by its own angle around the circle, multiplied by a winding number that counts from zero to three across the loop. Twenty four distance calculations per pixel per frame is the sort of thing that would be slow anywhere except a graphics card."]
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
       "A six petal flower with a faint ring around it, turning slowly. The petals are not objects. They are the places where two beams agree with each other, and it is the agreement that rotates rather than the light."],
      ["Where the quantum comes in",
       "Both beams are doughnuts of light whose phase winds around a dark centre, one twisting one way and one the other. Added together the twists cancel into six fixed petals. Give one beam a slightly different frequency and the petals turn, at the difference between the two frequencies rather than at the enormous frequency of light itself, which is what makes it slow enough to watch. Physicists use exactly this to spin trapped particles, and call it an optical spanner."],
      ["How it is built",
       "Each pixel works out its distance from the centre and its angle around it, feeds both into the standard formula for this kind of beam, and squares the result. The formula carries an extra bump that produces the faint outer ring, which is a real feature of the mode rather than decoration. Only the angle term changes with time, which is why the flower turns instead of pulsing."]
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
       "Two sources humming at slightly different pitches. The pattern never settles: the whole set of stripes drifts steadily across the frame and comes back around."],
      ["Where the quantum comes in",
       "When two waves are close in frequency but not equal, the combination swells and fades at the difference between them. That is what a piano tuner is listening for. It is also behind a great deal of precise measurement, from radio receivers to gravitational wave detectors: instead of measuring an enormous frequency directly, you compare it against another and watch how slowly the pattern crawls. Atoms do their own version, called a quantum beat, where the two frequencies are two energy levels inside one atom."],
      ["How it is built",
       "The same two source sum as the double slit panel, with one number changed per source. Each has its own frequency, and its wavelength set to match, because two waves sharing a medium have to travel at the same speed. The drift is simply the shader being handed a slightly different clock for each of the two waves."]
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
       "The two slit pattern with one dial being turned. The stripes fade until the dark bands are as bright as the light ones, then come back. The bar along the bottom is the dial. Nothing else changes: the sources stay where they are and each one is exactly as bright throughout."],
      ["Where the quantum comes in",
       "The dial is called visibility, and it measures how much the two paths still have to do with each other. It drops for ordinary reasons: sources drifting out of time with one another, or anything in the surroundings quietly recording which way the particle went. That recording is decoherence, and it is the main reason large everyday objects never show this behaviour. The trade is exact: the more you could tell which path was taken, the fainter the stripes must be, and you cannot have both."],
      ["How it is built",
       "The shader works the picture out in three parts: the brightness from one slit, the brightness from the other, and a third term that exists only because the two interfere. The dial multiplies that third term and leaves the other two alone. Turn it to zero and what is left on screen is the plain sum of two lamps."]
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
