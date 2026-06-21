// Minimal WebGL2 helpers for fullscreen-shader pieces. A fullscreen triangle
// (no attributes, via gl_VertexID), a Quad program wrapper with cached uniforms,
// float ping-pong targets for feedback sims, and a palette LUT texture so
// shaders draw in the active theme. Banner-grade: one draw call per frame.

import type { Palette } from "./color/theme";
import { sample } from "./color/theme";

export const STD_VERT = `#version 300 es
out vec2 vUv;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

function compile(gl: WebGL2RenderingContext, src: string, type: number): WebGLShader {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error(`shader compile: ${log}`);
  }
  return sh;
}

export class Quad {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private vao: WebGLVertexArrayObject;
  private loc = new Map<string, WebGLUniformLocation | null>();
  private unit = 0;

  constructor(gl: WebGL2RenderingContext, fragSrc: string, vertSrc = STD_VERT) {
    this.gl = gl;
    const vs = compile(gl, vertSrc, gl.VERTEX_SHADER);
    const fs = compile(gl, fragSrc, gl.FRAGMENT_SHADER);
    const p = gl.createProgram()!;
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      throw new Error(`program link: ${gl.getProgramInfoLog(p)}`);
    }
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    this.program = p;
    this.vao = gl.createVertexArray()!;
  }

  use(): this {
    this.gl.useProgram(this.program);
    this.unit = 0;
    return this;
  }
  private u(name: string): WebGLUniformLocation | null {
    if (!this.loc.has(name)) this.loc.set(name, this.gl.getUniformLocation(this.program, name));
    return this.loc.get(name) ?? null;
  }
  f(name: string, v: number): this {
    this.gl.uniform1f(this.u(name), v);
    return this;
  }
  i(name: string, v: number): this {
    this.gl.uniform1i(this.u(name), v);
    return this;
  }
  v2(name: string, x: number, y: number): this {
    this.gl.uniform2f(this.u(name), x, y);
    return this;
  }
  tex(name: string, texture: WebGLTexture): this {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + this.unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(this.u(name), this.unit);
    this.unit++;
    return this;
  }
  draw(): void {
    const gl = this.gl;
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
  }
  dispose(): void {
    this.gl.deleteProgram(this.program);
    this.gl.deleteVertexArray(this.vao);
  }
}

/** A float (RGBA16F) render target for ping-pong feedback sims. */
export class Target {
  texture: WebGLTexture;
  fbo: WebGLFramebuffer;
  constructor(
    private gl: WebGL2RenderingContext,
    public width: number,
    public height: number,
    wrap = gl.CLAMP_TO_EDGE,
  ) {
    gl.getExtension("EXT_color_buffer_float");
    this.texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, width, height, 0, gl.RGBA, gl.HALF_FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
    this.fbo = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
  bindAsTarget(): void {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fbo);
    this.gl.viewport(0, 0, this.width, this.height);
  }
  dispose(): void {
    this.gl.deleteTexture(this.texture);
    this.gl.deleteFramebuffer(this.fbo);
  }
}

export function bindScreen(gl: WebGL2RenderingContext, w: number, h: number): void {
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, w, h);
}

/** A 256×1 RGBA palette ramp the shaders sample by t (theme-matched colour). */
export function makePaletteTexture(gl: WebGL2RenderingContext, palette: Palette): WebGLTexture {
  const N = 256;
  const data = new Uint8Array(N * 4);
  for (let i = 0; i < N; i++) {
    const rgb = sample(palette, i / (N - 1));
    data[i * 4] = rgb[0];
    data[i * 4 + 1] = rgb[1];
    data[i * 4 + 2] = rgb[2];
    data[i * 4 + 3] = 255;
  }
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, N, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}
