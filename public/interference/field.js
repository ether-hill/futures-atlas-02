/*
  Interference — the shared field library.

  One place for the eleven wave fields, their explainers, and the WebGL plumbing
  that runs them. Loaded by both surfaces of this bundle:
    • index.html  — the gallery, all eleven at once, with controls and exports
    • embed.html  — one field, full bleed, driven by the query string

  Every field is a single fragment shader over normalised coordinates: p.y runs
  -1..1, p.x widens with the aspect. No textures, no geometry, one triangle.
  The exception is "one-at-a-time", which accumulates individual detections on a
  2D canvas because that is what the piece is about.

  Palettes are a uniform (uPal), so switching them re-skins every field on the
  next frame without recompiling anything.
*/
window.FIELD = (function () {
  "use strict";

  /* ------------------------------------------------------------------ shaders */

  var VS = "attribute vec2 a; void main(){ gl_Position = vec4(a,0.0,1.0); }";

  var PRELUDE = [
    "precision highp float;",
    "uniform vec2 uRes;",
    "uniform float uT;",
    "uniform float uGrain;",
    "uniform int uPal;",
    "#define PI 3.14159265359",
    "",
    "vec3 pal(float t, vec3 a, vec3 b, vec3 c, vec3 d){ return a + b*cos(6.28318*(c*t+d)); }",
    "float tm(float x){ return x/(1.0+x); }",
    "",
    "/* intensity ramp: 0 = no wave, 1 = maximum. Five stops per palette. */",
    "vec3 rampI(float x){",
    "  x = clamp(x,0.0,1.0);",
    "  vec3 c0,c1,c2,c3,c4;",
    "  if(uPal == 1){",           /* ember */
    "    c0=vec3(0.032,0.016,0.018); c1=vec3(0.230,0.058,0.070); c2=vec3(0.580,0.180,0.105);",
    "    c3=vec3(0.910,0.500,0.190); c4=vec3(1.000,0.940,0.790);",
    "  } else if(uPal == 2){",    /* verdigris */
    "    c0=vec3(0.014,0.030,0.028); c1=vec3(0.036,0.150,0.140); c2=vec3(0.065,0.400,0.330);",
    "    c3=vec3(0.400,0.780,0.540); c4=vec3(0.960,0.980,0.905);",
    "  } else if(uPal == 3){",    /* bone */
    "    c0=vec3(0.028,0.028,0.030); c1=vec3(0.135,0.136,0.142); c2=vec3(0.350,0.350,0.356);",
    "    c3=vec3(0.660,0.656,0.645); c4=vec3(0.988,0.982,0.968);",
    "  } else {",                 /* ice */
    "    c0=vec3(0.020,0.026,0.058); c1=vec3(0.078,0.125,0.330); c2=vec3(0.140,0.470,0.640);",
    "    c3=vec3(0.470,0.840,0.790); c4=vec3(0.992,0.960,0.876);",
    "  }",
    "  vec3 col = mix(c0,c1,smoothstep(0.00,0.30,x));",
    "  col = mix(col,c2,smoothstep(0.24,0.58,x));",
    "  col = mix(col,c3,smoothstep(0.54,0.82,x));",
    "  col = mix(col,c4,smoothstep(0.80,1.00,x));",
    "  return col;",
    "}",
    "",
    "/* phase wheel: hue runs once around the circle, tinted to match the palette */",
    "vec3 rampP(float ph){",
    "  float off = 0.0; vec3 b = vec3(0.30,0.24,0.30);",
    "  if(uPal == 1){ off = 0.06; b = vec3(0.33,0.20,0.13); }",
    "  else if(uPal == 2){ off = 0.42; b = vec3(0.24,0.30,0.24); }",
    "  else if(uPal == 3){ off = 0.0; b = vec3(0.11,0.11,0.12); }",
    "  return pal(ph/6.28318 + off, vec3(0.44,0.47,0.52), b, vec3(1.0), vec3(0.02,0.22,0.48));",
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
    "  col *= 1.0 - 0.28*dot(q,q);",
    "  gl_FragColor = vec4(max(col,0.0), 1.0);",
    "}"
  ].join("\n");

  /* ------------------------------------------------------------------ fields */

  var VARIANTS = [

  {
    slug: "droplets",
    title: "Two droplets",
    note: "Two drips into still water, landing together. Where the rings cross, they add.",
    read: [
      "This is the oldest version of the experiment and the only one you can run in a sink. Two drops fall at a steady rhythm, each sending out a ring of ripples. Where a crest from the left meets a crest from the right the water rises higher than either would alone. Where a crest meets a trough the water barely moves at all.",
      "The still lines fanning out from between the sources are the interesting part. Along those curves the two paths differ by exactly half a wavelength, so the waves arrive permanently out of step. They are hyperbolas, fixed in place while everything around them keeps moving, and they are the reason interference shows up as a pattern rather than as noise.",
      "Nothing quantum is happening here. Water waves, sound and light all obey the same superposition rule, which is why a bathtub is a legitimate instrument for thinking about the double slit. The surface is shaded by its own slope, so what you are seeing is closer to the reflection off real water than to a plot of the height."
    ],
    frag: [
      "const float C  = 0.30;",
      "const float KD = 30.0;",
      "const float TD = 4.2;",
      "",
      "float dropWave(vec2 p, vec2 s, float t0){",
      "  float tau = uT - t0;",
      "  if(tau <= 0.0) return 0.0;",
      "  float r = length(p - s);",
      "  float d = r - C*tau;",
      "  float pack  = exp(-d*d*4.0);",
      "  float decay = exp(-tau*0.13)*exp(-r*0.50)/sqrt(0.30 + r*2.0);",
      "  return sin(KD*d + 1.1)*pack*decay;",
      "}",
      "",
      "float height(vec2 p){",
      "  float h = 0.0;",
      "  for(int i=0;i<2;i++){",
      "    float fi = float(i);",
      "    vec2 s = mix(vec2(-0.55, 0.06), vec2(0.55,-0.06), fi);",
      "    float off = 0.0;",
      "    for(int n=0;n<4;n++){",
      "      float t0 = (floor((uT-off)/TD) - float(n))*TD + off;",
      "      h += dropWave(p, s, t0);",
      "    }",
      "  }",
      "  return h;",
      "}",
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
      "",
      "  vec3 col = mix(rampI(0.02), rampI(0.40), clamp(fres*1.7, 0.0, 1.0));",
      "  col += rampI(0.60)*diff*0.06;",
      "  col += rampI(1.00)*spec*1.45;",
      "  col += rampI(clamp(h*h*6.5, 0.0, 1.0))*0.46;",
      "  return col;",
      "}"
    ].join("\n")
  },

  {
    slug: "two-slits",
    title: "Two slits",
    note: "A plane wave meets a wall with two gaps. Beyond it, one pattern instead of two.",
    read: [
      "A wave arrives at a wall from below and finds two narrow openings. Each opening becomes a new source, spreading in every direction, and the region beyond the wall carries a single pattern built from both. The bright fans are where the two path lengths differ by a whole number of wavelengths.",
      "The spacing of those fans is set by the ratio of the wavelength to the gap between the slits, which is what makes the experiment a measuring instrument rather than a curiosity. Widen the slits and the fans crowd together. Shorten the wavelength and they crowd together too.",
      "Thomas Young ran it with sunlight around 1801 and used it to argue that light is a wave. The same geometry has since been run with electrons, neutrons, atoms and molecules of several hundred atoms, and every one of them produces this figure. The faint steady glow underneath the moving crests is the time average, which is all a photographic plate ever sees."
    ],
    frag: [
      "const float K = 30.0;",
      "const float W = 2.4;",
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
      "",
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
    note: "The same wall with seven gaps. The strip along the top is the screen.",
    read: [
      "Adding slits does not add fringes, it sharpens them. Two slits give broad bright fans; seven give narrow spikes with dim gaps between, because a direction only stays bright if all seven contributions arrive in step, and that is a much harder condition to satisfy than agreement between two.",
      "The width of each maximum falls roughly as one over the number of slits, so a grating with thousands of lines produces spikes fine enough to separate colours that differ by a fraction of a nanometre. That is the whole basis of the spectrograph, and of how we know what stars are made of.",
      "The strip along the top is the time averaged intensity at that height, which is what a detector placed there would record. The field below it is still moving; the strip is not, because averaging over a cycle removes the motion and leaves only the pattern."
    ],
    frag: [
      "const float K = 34.0;",
      "const float W = 2.3;",
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
      "",
      "  float band = smoothstep(0.855,0.870,p.y);",
      "  if(band > 0.0){",
      "    vec2 Fs = fieldAt(vec2(p.x, 0.855));",
      "    col = mix(col, rampI(tm(dot(Fs,Fs)*0.45)), band);",
      "    col = mix(col, rampI(0.0)*0.2, smoothstep(0.008,0.0,abs(p.y-0.862)));",
      "  }",
      "",
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
    slug: "one-at-a-time",
    kind: "2d",
    title: "One at a time",
    note: "Detections arriving singly. No fringe exists in any one of them.",
    read: [
      "Each dot is one arrival, placed at random with a probability given by the two slit pattern. Early on the screen looks like scatter. The fringes are not visible in any single detection and cannot be, because a single particle lands in one place; they only exist as a statement about where a great many of them land.",
      "This is the part of the experiment that is genuinely strange. Send the particles through so slowly that only one is ever in the apparatus, and the pattern still builds. Whatever went through went through both openings, in the sense that the amplitude for each path contributed to where it could land.",
      "It has been done for real. G. I. Taylor did a feeble light version in 1909, and Tonomura's team at Hitachi filmed single electrons accumulating into fringes in 1989. What you are watching here is a simulation, sampling from the same distribution the earlier panels compute, with old dots fading so the picture keeps breathing."
    ]
  },

  {
    slug: "vortex",
    title: "Vortex lattice",
    note: "Three plane waves at 120 degrees, coloured by phase. Each dark point is a singularity.",
    read: [
      "Three plane waves of the same wavelength, travelling at 120 degrees to each other, add to a triangular lattice. Here brightness is the amplitude and hue is the phase, so a full trip around the colour wheel is a full trip around the cycle.",
      "Walk a small circle around one of the dark points and the hue runs through every value exactly once. That means the phase has no single answer at the centre, and the only way a wave can be continuous around a point where its phase is undefined is for its amplitude to be zero there. These are phase singularities, or optical vortices, catalogued by Nye and Berry in 1974.",
      "They are not rare or delicate. Any field made of three or more plane waves is threaded with them, including light scattered off a rough wall and radio in a room with walls. The lattice drifts because the three waves are given very slightly different frequencies."
    ],
    frag: [
      "vec3 render(vec2 p){",
      "  float spin = 0.022*uT;",
      "  vec2 F = vec2(0.0);",
      "  for(int i=0;i<3;i++){",
      "    float a = 2.0944*float(i) + spin;",
      "    vec2 kv = 13.5*vec2(cos(a), sin(a));",
      "    float ph = dot(kv,p) - 0.85*uT*(1.0 + 0.05*float(i));",
      "    F += vec2(cos(ph), sin(ph));",
      "  }",
      "  float amp = length(F)/3.0;",
      "  vec3 col = rampP(atan(F.y, F.x)) * pow(amp, 1.7) * 0.92;",
      "  col += rampI(1.0) * pow(amp, 7.0) * 0.28;",
      "  return max(col, rampI(0.0)*smoothstep(0.0,0.35,amp));",
      "}"
    ].join("\n")
  },

  {
    slug: "carpet",
    title: "Quantum carpet",
    note: "A particle in a square box. Eight standing modes, beating in and out of step.",
    read: [
      "Confine a quantum particle to a box and only certain standing waves fit. Each has an energy proportional to the sum of the squares of its two mode numbers, and each rotates in phase at its own rate. Add eight of them and the probability density, which is what is drawn here, sloshes around in a way that looks chaotic but is not.",
      "Because the energies are whole numbers times a common unit, the phases all come back into step at once. The pattern collapses back to its starting shape and the whole sequence repeats. These revivals are real and have been observed in Rydberg atoms and in cold atoms in optical lattices.",
      "The name comes from the woven look of the space time version of this problem, where the same structure repeats at every rational fraction of the revival time. It is the same mathematics as the Talbot effect in optics, where a grating reproduces its own image at regular distances behind itself."
    ],
    frag: [
      "const float B = 0.88;",
      "",
      "vec2 mode(vec2 uv, float n, float m, float w){",
      "  float a = w*sin(n*PI*uv.x)*sin(m*PI*uv.y);",
      "  float ph = -(n*n+m*m)*uT*0.085;",
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
    title: "Packet collision",
    note: "Two wavepackets passing through each other. Fringes exist only in the overlap.",
    read: [
      "A free particle with a reasonably well defined position and momentum is described by a Gaussian wavepacket. Two of them, moving towards each other, pass straight through: there is no force here, only addition.",
      "While they overlap, the sum carries fringes whose spacing is set by the difference in momentum between the two packets. Faster approach means finer fringes. Outside the overlap there is nothing to interfere with and the density is smooth, which is a useful reminder that interference is a property of a superposition and not of a particle.",
      "In a fuller treatment each packet also spreads as it travels, because its component momenta move at different speeds. That spreading is why a wavepacket is not a good long term stand in for a classical particle, and why saying an electron is a small ball goes wrong quickly."
    ],
    frag: [
      "vec3 render(vec2 p){",
      "  float cx = 0.80*sin(uT*0.17);",
      "  float sx = 0.36, sy = 0.62;",
      "  vec2 d1 = (p - vec2( cx, 0.0)) / vec2(sx, sy);",
      "  vec2 d2 = (p - vec2(-cx, 0.0)) / vec2(sx, sy);",
      "  float g1 = exp(-dot(d1,d1)*0.85);",
      "  float g2 = exp(-dot(d2,d2)*0.85);",
      "  float p1 = -25.0*p.x - 1.5*uT;",
      "  float p2 =  27.0*p.x - 1.5*uT;",
      "  vec2 psi = g1*vec2(cos(p1),sin(p1)) + g2*vec2(cos(p2),sin(p2));",
      "  float dens = dot(psi,psi);",
      "  vec3 col = rampI(tm(dens*1.70));",
      "  col += rampP(atan(psi.y,psi.x)) * dens * 0.16;",
      "  return col;",
      "}"
    ].join("\n")
  },

  {
    slug: "ring",
    title: "Phased ring",
    note: "Twenty four emitters on a circle. The winding number climbs, and the focus opens.",
    read: [
      "Twenty four sources sit on a circle, all the same frequency. When they are in step, everything they emit arrives at the centre together and the middle is the brightest point in the field. This is a phased array, and it is how radar, ultrasound imaging and radio telescopes all steer and focus without moving anything.",
      "Then the emitters are given a phase that climbs once, twice, three times around the ring. The bright centre hollows out into a ring, because a field whose phase winds around a point cannot have a single value there, so the amplitude has to vanish. The winding number is the beam's orbital angular momentum in units of hbar per photon.",
      "The pattern cycles through winding numbers zero to three and starts again. Watch the middle: the transition from a filled focus to an empty one is the whole idea, and it happens without changing a single source position."
    ],
    frag: [
      "const float K = 30.0;",
      "const float W = 2.2;",
      "",
      "vec3 render(vec2 p){",
      "  float l = floor(mod(uT*0.045, 4.0));",
      "  vec2 F = vec2(0.0);",
      "  for(int i=0;i<24;i++){",
      "    float a = 6.28318*float(i)/24.0;",
      "    vec2 s = 0.96*vec2(cos(a), sin(a));",
      "    float r = length(p-s);",
      "    float ph = K*r + l*a;",
      "    F += vec2(cos(ph), sin(ph))/(4.0*sqrt(0.16+r*1.8));",
      "  }",
      "  float inst = F.x*cos(W*uT) + F.y*sin(W*uT);",
      "  vec3 col = rampI(tm(inst*inst*1.40));",
      "  col += rampI(tm(dot(F,F)*0.38))*0.26;",
      "  for(int i=0;i<24;i++){",
      "    float a = 6.28318*float(i)/24.0;",
      "    col += rampI(0.62)*smoothstep(0.014,0.003,length(p-0.96*vec2(cos(a),sin(a))))*0.55;",
      "  }",
      "  return col;",
      "}"
    ].join("\n")
  },

  {
    slug: "twisted",
    title: "Twisted light",
    note: "Two beams carrying opposite twist, added. The petals turn because the frequencies differ.",
    read: [
      "A Laguerre Gauss beam is a doughnut of light whose phase winds l times around the dark centre. Add one with a twist of plus three to one with a twist of minus three and the two windings cancel into six fixed petals, since a bright petal is where the two phases agree.",
      "Give the two beams frequencies that differ very slightly and the agreement condition rotates, so the petals turn at a rate set by that difference rather than by the frequency of the light itself. Trapped microscopic particles will follow the petals around, which is the basis of the optical spanner.",
      "The extra ring outside the petals is a radial mode. Beams like these are made with a spiral phase plate, a fork hologram or a spatial light modulator, and are being tested as extra channels in optical communication, since twist is a degree of freedom that polarisation and wavelength do not use."
    ],
    frag: [
      "vec3 render(vec2 p){",
      "  float r = length(p), th = atan(p.y, p.x);",
      "  float w = 0.42;",
      "  float u = r/w;",
      "  float rad = pow(u, 3.0) * (4.0 - 2.0*u*u) * exp(-u*u) * 0.90;",
      "  float amp = rad * cos(3.0*th - 0.10*uT);",
      "  float dens = amp*amp*9.0;",
      "  vec3 col = rampI(tm(dens*1.6));",
      "  col += rampP(3.14159*(1.0 - sign(amp))) * min(dens,1.0) * 0.10;",
      "  return col;",
      "}"
    ].join("\n")
  },

  {
    slug: "beats",
    title: "Quantum beats",
    note: "Two sources at slightly different frequencies. The pattern never settles.",
    read: [
      "Every other panel with two sources holds them at the same frequency, which is why their fringes stand still. Detune one of them slightly and the condition for constructive interference drifts, so the whole pattern sweeps sideways at a rate set by the difference between the two frequencies and nothing else.",
      "In atomic physics this is what a quantum beat is. Excite an atom into a superposition of two closely spaced levels and its fluorescence is modulated at the difference frequency, which lets you measure a level splitting far finer than the resolution of your spectrometer.",
      "The same trick is everywhere in measurement. Heterodyne detection, laser frequency combs, gravitational wave interferometers and the way a piano tuner listens for the beat between two strings are all reading a tiny difference by watching how fast a pattern crawls."
    ],
    frag: [
      "vec3 render(vec2 p){",
      "  vec2 s1 = vec2(-0.92, -0.52), s2 = vec2(0.92, -0.52);",
      "  float r1 = length(p-s1), r2 = length(p-s2);",
      "  float a1 = 1.0/sqrt(0.24+r1*1.6), a2 = 1.0/sqrt(0.24+r2*1.6);",
      "  float ph1 = 33.0*r1 - 1.90*uT;",
      "  float ph2 = 34.6*r2 - 2.14*uT;",
      "  vec2 F = a1*vec2(cos(ph1),sin(ph1)) + a2*vec2(cos(ph2),sin(ph2));",
      "  float I = dot(F,F);",
      "  vec3 col = rampI(tm(I*0.42));",
      "  col += rampI(0.22)*0.06;",
      "  return col;",
      "}"
    ].join("\n")
  },

  {
    slug: "coherence",
    title: "Losing coherence",
    note: "The same two slits, with the visibility dialled from one to zero and back.",
    read: [
      "Visibility is the contrast of a fringe pattern: the difference between the bright and dark bands divided by their sum. At one, the dark bands are genuinely dark. At zero, the two slits still both let light through, but the pattern is the plain sum of what each would do alone, with no interference term at all.",
      "The bar along the bottom is the current value. Nothing else changes as it falls. The sources stay where they are and the intensity from each is untouched, which is worth watching, because it separates the idea of interference from the idea of intensity.",
      "In practice the term dies for two reasons: the sources are not perfectly monochromatic and drift out of step, or something in the environment records which path was taken. The second is decoherence, and the trade is quantitative. Englert's relation holds that visibility squared plus path distinguishability squared cannot exceed one, so partial information costs exactly this much contrast."
    ],
    frag: [
      "const float K = 30.0;",
      "const float D = 0.24;",
      "",
      "vec3 render(vec2 p){",
      "  float g = 0.5+0.5*cos(uT*0.085);",
      "  vec2 s1 = vec2(-D,-0.80), s2 = vec2(D,-0.80);",
      "  float r1 = length(p-s1), r2 = length(p-s2);",
      "  float a1 = 1.0/sqrt(0.16+r1*2.4), a2 = 1.0/sqrt(0.16+r2*2.4);",
      "  float I = a1*a1 + a2*a2 + 2.0*g*a1*a2*cos(K*(r1-r2));",
      "  vec3 col = rampI(tm(I*0.30));",
      "",
      "  float row  = smoothstep(0.011,0.005, abs(p.y+0.93));",
      "  float span = step(-0.87,p.x)*step(p.x,0.87);",
      "  col = mix(col, rampI(0.04), row*span*0.85);",
      "  col += rampI(0.90)*row*span*step(p.x, -0.86 + 1.72*g)*0.8;",
      "  return col;",
      "}"
    ].join("\n")
  }

  ];

  /* Dot and ground colours for the 2D field, mirroring the GLSL ramps above. */
  var PALETTES = [
    { name: "Ice",       dot: "#8fdcea", hot: "#fcf5df", ground: "#05070e" },
    { name: "Ember",     dot: "#e8853c", hot: "#fff0c4", ground: "#0a0405" },
    { name: "Verdigris", dot: "#66c68a", hot: "#f5faec", ground: "#040a08" },
    { name: "Bone",      dot: "#b4b4b0", hot: "#fbfaf6", ground: "#070708" }
  ];

  /* ------------------------------------------------------------------ units */

  function compile(gl, type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error("shader:", gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  function glUnit(canvas, variant, state) {
    var gl = canvas.getContext("webgl", {
      antialias: false, alpha: false, depth: false,
      preserveDrawingBuffer: false, powerPreference: "high-performance"
    });
    if (!gl) return null;

    var vs = compile(gl, gl.VERTEX_SHADER, VS);
    var fs = compile(gl, gl.FRAGMENT_SHADER, PRELUDE + variant.frag + MAIN);
    if (!vs || !fs) return null;

    var prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error("link:", gl.getProgramInfoLog(prog));
      return null;
    }
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, "a");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    var uRes = gl.getUniformLocation(prog, "uRes");
    var uT = gl.getUniformLocation(prog, "uT");
    var uPal = gl.getUniformLocation(prog, "uPal");
    var uGrain = gl.getUniformLocation(prog, "uGrain");

    return {
      kind: "gl", canvas: canvas, variant: variant, visible: true,
      // draw at the canvas's own CSS size (w/h given) — the caller decides,
      // so a still can be grabbed at print resolution in a single frame.
      draw: function (t, w, h) {
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w; canvas.height = h;
          gl.viewport(0, 0, w, h);
        }
        gl.uniform2f(uRes, w, h);
        gl.uniform1f(uT, t);
        gl.uniform1i(uPal, state.pal | 0);
        gl.uniform1f(uGrain, state.grain ? 1 : 0);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    };
  }

  /* The accumulating field: single detections, drawn one at a time onto a 2D
     canvas. Old dots fade instead of the picture being cleared, so it reaches a
     steady state and keeps moving without ever resetting. */
  function dotUnit(canvas, variant, state) {
    var ctx = canvas.getContext("2d");
    var carry = 0, lastT = 0, lastPal = -1;

    function intensity(x, y) {
      if (y < -0.72) return 0;
      var d = 0.22, k = 30.0;
      var r1 = Math.hypot(x + d, y + 0.8), r2 = Math.hypot(x - d, y + 0.8);
      var c = Math.cos(k * (r1 - r2) * 0.5);
      return (c * c) / (0.35 + 1.6 * Math.min(r1, r2));
    }

    return {
      kind: "2d", canvas: canvas, variant: variant, visible: true,
      draw: function (t, w, h) {
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w; canvas.height = h;
          ctx.fillStyle = PALETTES[state.pal].ground;
          ctx.fillRect(0, 0, w, h);
        }
        var p = PALETTES[state.pal];
        if (state.pal !== lastPal) { lastPal = state.pal; ctx.fillStyle = p.ground; ctx.fillRect(0, 0, w, h); }

        var dt = Math.min(0.1, Math.max(0, t - lastT));
        lastT = t;

        // the slow fade of the record
        ctx.fillStyle = p.ground;
        ctx.globalAlpha = Math.min(0.04, dt * 0.055);
        ctx.fillRect(0, 0, w, h);
        ctx.globalAlpha = 1;

        var scale = Math.min(w, h) / 2;
        carry += dt * 1800;
        var tries = Math.min(4000, Math.floor(carry));
        carry -= tries;

        for (var i = 0; i < tries; i++) {
          var px = (Math.random() * 2 - 1) * (w / scale);
          var py = (Math.random() * 2 - 1) * (h / scale);
          if (Math.random() > intensity(px, py) * 0.85) continue;
          var sx = w / 2 + px * scale, sy = h / 2 - py * scale;
          ctx.fillStyle = Math.random() < 0.12 ? p.hot : p.dot;
          ctx.globalAlpha = 0.75;
          ctx.fillRect(sx, sy, 1.6, 1.6);
        }
        ctx.globalAlpha = 1;

        // the barrier and its two openings, so the geometry is readable
        ctx.fillStyle = p.dot;
        ctx.globalAlpha = 0.35;
        var by = h / 2 + 0.8 * scale;
        ctx.fillRect(0, by, w, 1);
        ctx.globalAlpha = 1;
        ctx.clearRect(w / 2 - 0.245 * scale, by - 1, 0.05 * scale, 3);
        ctx.clearRect(w / 2 + 0.195 * scale, by - 1, 0.05 * scale, 3);
      }
    };
  }

  function createUnit(canvas, variant, state) {
    return variant.kind === "2d" ? dotUnit(canvas, variant, state) : glUnit(canvas, variant, state);
  }

  function bySlug(slug) {
    for (var i = 0; i < VARIANTS.length; i++) if (VARIANTS[i].slug === slug) return VARIANTS[i];
    return null;
  }

  return {
    VARIANTS: VARIANTS,
    PALETTES: PALETTES,
    createUnit: createUnit,
    bySlug: bySlug
  };
})();
