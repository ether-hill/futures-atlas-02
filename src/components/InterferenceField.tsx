"use client";

import { useEffect, useRef } from "react";

/**
 * Rain: seven drops of different sizes, falling out of step.
 *
 * The Rain field from the Interference project (/interference), slowed down.
 * Seven drops instead of a matched pair, each with its own strength, wavelength
 * and ring speed, so rings from a drop that landed a while ago are still
 * crossing rings from one that just hit and no two crossings look alike. It
 * carries no palette of its own: the ramp is built at runtime from the live
 * theme tokens (--bg and --accent) and rebuilt whenever the theme flips, so it
 * re-skins with the rest of the site, live /style-guide overrides included.
 *
 * Decorative, so it is aria-hidden, and it holds still under
 * prefers-reduced-motion.
 */

const VS = "attribute vec2 a; void main(){ gl_Position = vec4(a,0.0,1.0); }";

const FS = `#extension GL_OES_standard_derivatives : enable
precision highp float;

/*
  The slope epsilon has to be ONE PIXEL WIDE, not one fixed distance.

  This shader is a port of the Rain field from /interference, and it arrived
  here with the project's #else fallback (a hardcoded 0.006) baked in as if it
  were the real value — the extension was never requested, so fwidth was never
  available to ask for. On the project's own full-bleed panel that constant is
  roughly a pixel and it looks fine. Here the field is a small masked band AND
  it was pulled back further than the project's, so a fixed epsilon sampled the
  surface at well under one ripple per step: the normals came out of step with
  the screen grid and the water grew a scaly, quilted moiré of lens shapes that
  is not in the wave field at all. FW gives the real on-screen pixel size, so
  the sampling follows the panel however it is sized.
*/
#ifdef GL_OES_standard_derivatives
#define FW(x) fwidth(x)
#else
#define FW(x) 0.006
#endif
uniform vec2 uRes;
uniform float uT;
uniform vec3 uA;   /* accent */
uniform vec3 uB;   /* page ground */

const float TR = 9.0;    /* the drip cycle, and the exact loop */

/* the palette, as a ramp from the page's own two colours */
vec3 rampI(float x){
  x = clamp(x,0.0,1.0);
  vec3 c1 = mix(uB, uA, 0.45);
  vec3 c3 = mix(uA, vec3(1.0), 0.45);
  vec3 c4 = mix(uA, vec3(1.0), 0.88);
  vec3 col = mix(uB, c1, smoothstep(0.00,0.30,x));
  col = mix(col, uA, smoothstep(0.24,0.58,x));
  col = mix(col, c3, smoothstep(0.54,0.82,x));
  col = mix(col, c4, smoothstep(0.80,1.00,x));
  return col;
}

/* One falling drop's ring, as a wave packet expanding from where it landed.
   The fade tapers the oldest generation to nothing before it leaves the stack,
   which is what keeps a repeating drip exactly periodic. */
float dropWave(vec2 p, vec2 s, float tau, float C, float KD, float win){
  if(tau <= 0.0) return 0.0;
  float r = length(p - s);
  float d = r - C*tau;
  float pack  = exp(-d*d*4.0);
  float birth = smoothstep(0.0, 0.45, tau);
  float fade  = smoothstep(win, win*0.72, tau)*birth;
  float decay = exp(-tau*0.13)*exp(-r*0.62)/sqrt(0.30 + r*2.0);
  return sin(KD*d + 1.1)*pack*decay*fade;
}

/* Every drop is a different size: its own strength, wavelength and ring speed,
   all fixed functions of its index, so the loop still repeats exactly. */
float rnd(float i, float k){ return fract(sin(i*12.9898 + k*7.233)*43758.5453); }
vec2  srcOf(float i){ return vec2(rnd(i,1.0)*2.7 - 1.35, rnd(i,2.0)*1.7 - 0.85); }
float ampOf(float i){ return 0.55 + 0.70*rnd(i,3.0); }
float kOf(float i){ return 22.0 + 14.0*rnd(i,4.0); }
float cOf(float i){ return 0.24 + 0.12*rnd(i,5.0); }

float height(vec2 p){
  float h = 0.0;
  for(int j=0;j<7;j++){
    float i = float(j);
    float tau0 = mod(uT - TR*i/7.0 + TR, TR);
    for(int n=0;n<2;n++){
      h += ampOf(i)*dropWave(p, srcOf(i), tau0 + float(n)*TR, cOf(i), kOf(i), 2.0*TR);
    }
  }
  return h;
}

/* cheap per-pixel hash, for the grain */
float hash21(vec2 p){
  p = fract(p*vec2(123.34,345.45));
  p += dot(p,p+34.345);
  return fract(p.x*p.y);
}

void main(){
  /* Same framing as the project's own panel. It used to be 3.4, to fit more of
     the field into a tall page — which put 1.7x as many rings across every
     pixel and is half of why the surface aliased. */
  vec2 p = (gl_FragCoord.xy - 0.5*uRes)/min(uRes.x,uRes.y)*2.0;
  float e = max(FW(p.x)*1.3, 0.0032);
  float h  = height(p);
  float hx = height(p+vec2(e,0.0)) - h;
  float hy = height(p+vec2(0.0,e)) - h;
  vec3 n = normalize(vec3(-hx*20.0, -hy*20.0, e*20.0));
  vec3 L = normalize(vec3(-0.40, 0.55, 0.62));
  float diff = max(dot(n,L), 0.0);
  /* No mirror highlight. On a surface this finely rippled the specular
     condition is met along a band thinner than a pixel, so it samples as broken
     white dashes that all lean towards the light: scratches, not glints. The
     glancing-angle term carries the sheen instead. */
  float fres = pow(1.0-n.z, 2.4);

  vec3 col = mix(rampI(0.02), rampI(0.46), clamp(fres*1.9, 0.0, 1.0));
  col += rampI(0.68)*diff*0.13;
  col += rampI(clamp(h*h*6.5*0.75, 0.0, 1.0))*0.46;
  /* A grain of noise and a soft vignette, as on the project's panel. The grain
     is doing real work: without it the shallow parts of the ramp band into
     visible steps on a large flat area. */
  col += (hash21(gl_FragCoord.xy + fract(uT)*137.0)-0.5)*0.016;
  vec2 q = p*vec2(0.56,0.70);
  col *= 1.0 - 0.26*dot(q,q);
  gl_FragColor = vec4(max(col,0.0), 1.0);
}`;

/** Resolve a CSS custom property to rgb by letting a canvas parse it. */
function readToken(el: HTMLElement, name: string, fallback: [number, number, number]) {
  const value = getComputedStyle(el).getPropertyValue(name).trim();
  if (!value) return fallback;
  const probe = document.createElement("canvas");
  probe.width = probe.height = 1;
  const ctx = probe.getContext("2d");
  if (!ctx) return fallback;
  // Set a sentinel first: assigning an unparseable colour leaves fillStyle
  // untouched, which is how we detect a token this browser cannot read.
  ctx.fillStyle = "rgb(1, 2, 3)";
  const sentinel = ctx.fillStyle;
  ctx.fillStyle = value;
  if (ctx.fillStyle === sentinel) return fallback;
  ctx.fillRect(0, 0, 1, 1);
  const d = ctx.getImageData(0, 0, 1, 1).data;
  return [d[0] / 255, d[1] / 255, d[2] / 255] as [number, number, number];
}

// A drop every seven seconds or so, and a 47-second loop. Well under the
// project's pace: this one is the ground behind a page of text, not the exhibit.
const SPEED = 0.19;

export function InterferenceField({
  className = "",
  speed = SPEED,
}: {
  className?: string;
  /** Ripple pace. Lower where the field is a watermark behind other content. */
  speed?: number;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, depth: false });
    if (!gl) return;
    // Without this the #ifdef above takes the fallback branch and we are back to
    // a fixed epsilon. Requesting it is what makes fwidth exist in WebGL 1.
    gl.getExtension("OES_standard_derivatives");

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    };
    const vs = compile(gl.VERTEX_SHADER, VS);
    const fs = compile(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return;

    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "a");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "uRes");
    const uT = gl.getUniformLocation(prog, "uT");
    const uA = gl.getUniformLocation(prog, "uA");
    const uB = gl.getUniformLocation(prog, "uB");

    const root = document.documentElement;
    let accent: [number, number, number] = [0.36, 0.56, 0.78];
    let ground: [number, number, number] = [0.13, 0.12, 0.09];
    // Read off the CANVAS, not <html>. Custom properties inherit, so this still
    // picks up the global theme by default — but a section that pins its own
    // --bg / --accent (the contact page keeps a dark ground in both themes) now
    // reaches the field too, instead of the field reading past it to the root.
    const readTheme = () => {
      accent = readToken(canvas, "--accent", accent);
      ground = readToken(canvas, "--bg", ground);
    };
    readTheme();

    // the theme toggle swaps a class on <html>; follow it
    const themeWatch = new MutationObserver(readTheme);
    themeWatch.observe(root, { attributes: true, attributeFilter: ["class"] });

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let t = 1.4; // start mid-ripple rather than on flat water
    let last = performance.now();
    // The shader's drip cycle. Everything in height() is mod TR, and the oldest
    // generation is faded to nothing before it leaves the two-TR window, so the
    // field is exactly periodic in uT with period TR — and only TR. This used to
    // wrap at 6.0, which is not a period of anything: every 17 seconds uT jumped
    // by 3 and every ring on screen teleported. That was the visible stutter.
    const LOOP = 9.0; // = const float TR in the shader above; keep them equal

    /*
      The canvas is measured by a ResizeObserver, NOT by asking the layout on
      every frame.

      This used to call getBoundingClientRect() inside the frame loop. That is a
      forced synchronous reflow, sixty times a second, and the browser cannot do
      it while it is already laying the page out — so every frame of the sim
      made the scroll wait for a layout it had just invalidated. On the contact
      page, where the field is the full ground, that was the whole reason
      scrolling felt like it was dragging. The size only changes when the
      element changes size, which is exactly what a ResizeObserver is for.

      Same dpr cap as the project's own panel (interference/index.html): with a
      pixel-derived epsilon a lower ratio is no longer an aliasing problem, just
      a softer one, but there is no reason for the two to disagree.
    */
    let cw = 0;
    let ch = 0;
    const measure = (rw: number, rh: number) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      cw = Math.max(2, Math.round(rw * dpr));
      ch = Math.max(2, Math.round(rh * dpr));
    };
    const ro = new ResizeObserver(([e]) => {
      const box = e.contentRect;
      measure(box.width, box.height);
    });
    ro.observe(canvas);
    // One read at start-up, so the first frame is not drawn at 2x2 while the
    // observer's first callback is still queued.
    const first = canvas.getBoundingClientRect();
    measure(first.width, first.height);

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!still) t = (t + dt * speed) % LOOP;

      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw;
        canvas.height = ch;
        gl.viewport(0, 0, cw, ch);
      }
      gl.uniform2f(uRes, cw, ch);
      gl.uniform1f(uT, t);
      gl.uniform3f(uA, accent[0], accent[1], accent[2]);
      gl.uniform3f(uB, ground[0], ground[1], ground[2]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(frame);
    };

    /*
      And it only runs while it is on screen and the tab is in front, the same
      gating HeroField has. A decorative field has no business holding a core at
      sixty frames a second behind the rest of the page, or in a tab nobody is
      looking at. `last` is reset on resume so the ripples do not jump forward
      by however long the pause was.
    */
    let running = false;
    const start = () => {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    let onScreen = true;
    const sync = () => (onScreen && !document.hidden ? start() : stop());
    const io = new IntersectionObserver(
      ([e]) => {
        onScreen = e.isIntersecting;
        sync();
      },
      { threshold: 0 },
    );
    io.observe(canvas);
    document.addEventListener("visibilitychange", sync);
    start();

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      themeWatch.disconnect();
    };
  }, [speed]);

  return <canvas ref={ref} aria-hidden className={className} />;
}
