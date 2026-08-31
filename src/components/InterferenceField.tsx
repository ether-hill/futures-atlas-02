"use client";

import { useEffect, useRef } from "react";

/**
 * Two drops into still water, very slowly.
 *
 * The same field as the first panel of the Interference project (/interference),
 * running at about a sixth of its normal speed: one pair of drops every half a
 * minute, so the page moves at the pace of something you notice rather than
 * something you watch. It carries no palette of its own. The ramp is built at
 * runtime from the live theme tokens (--bg and --accent) and rebuilt whenever
 * the theme class flips, so it re-skins with the rest of the site, live
 * /style-guide overrides included.
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

const float TD = 6.0;    /* the drip cycle, and the exact loop */
const float C  = 0.30;
const float KD = 30.0;

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

float dropWave(vec2 p, vec2 s, float tau){
  if(tau <= 0.0) return 0.0;
  float r = length(p - s);
  float d = r - C*tau;
  float pack  = exp(-d*d*4.0);
  /* fades in as well as out: a ring that appeared at full amplitude was a step
     in an otherwise exact loop, and very slow motion makes a step obvious */
  float birth = smoothstep(0.0, 0.60, tau);
  float fade  = smoothstep(5.0*TD, 3.6*TD, tau)*birth;
  float decay = exp(-tau*0.13)*exp(-r*0.50)/sqrt(0.30 + r*2.0);
  return sin(KD*d + 1.1)*pack*decay*fade;
}

float height(vec2 p){
  float h = 0.0;
  for(int i=0;i<2;i++){
    vec2 s = mix(vec2(-0.55, 0.06), vec2(0.55,-0.06), float(i));
    for(int n=0;n<5;n++){
      h += dropWave(p, s, uT + float(n)*TD);
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
  vec3 n = normalize(vec3(-hx*30.0, -hy*30.0, e*30.0));
  vec3 L = normalize(vec3(-0.40, 0.55, 0.62));
  float diff = max(dot(n,L), 0.0);
  float spec = pow(max(dot(reflect(-L,n), vec3(0.0,0.0,1.0)), 0.0), 90.0);
  float fres = pow(1.0-n.z, 2.4);

  vec3 col = mix(rampI(0.02), rampI(0.40), clamp(fres*1.7, 0.0, 1.0));
  col += rampI(0.60)*diff*0.06;
  col += rampI(1.00)*spec*0.85;
  col += rampI(clamp(h*h*6.5, 0.0, 1.0))*0.24;
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

const SPEED = 0.16; // one pair of drops roughly every 37 seconds

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
