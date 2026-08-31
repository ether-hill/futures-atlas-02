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

const FS = `
precision highp float;
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

void main(){
  /* pulled back: the page is a tall panel, so more of the field fits */
  vec2 p = (gl_FragCoord.xy - 0.5*uRes)/min(uRes.x,uRes.y)*3.4;
  float e = 0.006;
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

const SPEED = 0.34; // a drop every four seconds or so, well under the project's pace

export function InterferenceField({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, depth: false });
    if (!gl) return;

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
    const readTheme = () => {
      accent = readToken(root, "--accent", accent);
      ground = readToken(root, "--bg", ground);
    };
    readTheme();

    // the theme toggle swaps a class on <html>; follow it
    const themeWatch = new MutationObserver(readTheme);
    themeWatch.observe(root, { attributes: true, attributeFilter: ["class"] });

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let t = 1.4; // start mid-ripple rather than on flat water
    let last = performance.now();

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!still) t = (t + dt * SPEED) % 6.0; // the field's own loop period

      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.max(2, Math.round(r.width * dpr));
      const h = Math.max(2, Math.round(r.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
      gl.uniform2f(uRes, w, h);
      gl.uniform1f(uT, t);
      gl.uniform3f(uA, accent[0], accent[1], accent[2]);
      gl.uniform3f(uB, ground[0], ground[1], ground[2]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      themeWatch.disconnect();
    };
  }, []);

  return <canvas ref={ref} aria-hidden className={className} />;
}
