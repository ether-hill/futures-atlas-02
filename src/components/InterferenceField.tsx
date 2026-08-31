"use client";

import { useEffect, useRef } from "react";

/**
 * A decorative wave field: two coherent sources, drifting very slowly.
 *
 * It carries no palette of its own. The two colours are read off the live theme
 * tokens (--bg and --accent) at mount and again whenever the theme class flips,
 * so it re-skins with the rest of the site, including live /style-guide
 * overrides. Purely ornamental, so it is aria-hidden and freezes under
 * prefers-reduced-motion.
 *
 * The full set of these fields is the Interference project (/interference).
 */

const VS = "attribute vec2 a; void main(){ gl_Position = vec4(a,0.0,1.0); }";

const FS = `
precision mediump float;
uniform vec2 uRes;
uniform float uT;
uniform vec3 uA;   /* accent */
uniform vec3 uB;   /* page ground */
void main(){
  vec2 p = (gl_FragCoord.xy - 0.5*uRes)/min(uRes.x,uRes.y)*2.0;
  vec2 s1 = vec2(0.16,-1.05), s2 = vec2(0.78,-1.05);
  float r1 = length(p-s1), r2 = length(p-s2);
  float a1 = 1.0/sqrt(0.45+r1*1.5), a2 = 1.0/sqrt(0.45+r2*1.5);
  float ph1 = 27.0*r1 - 0.55*uT;
  float ph2 = 28.2*r2 - 0.62*uT;
  vec2 F = a1*vec2(cos(ph1),sin(ph1)) + a2*vec2(cos(ph2),sin(ph2));
  float I = dot(F,F)*0.70;
  float x = I/(1.0+I);
  vec3 col = mix(uB, uA, smoothstep(0.04,0.78,x));
  col = mix(col, vec3(1.0), pow(x,6.0)*0.30);
  gl_FragColor = vec4(col, 1.0);
}`;

/** Resolve a CSS custom property to linear-ish rgb by letting canvas parse it. */
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
    let t = 0;
    let last = performance.now();

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!still) t += dt;

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
