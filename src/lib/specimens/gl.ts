/**
 * The smallest WebGL2 layer that does the job: compile a fragment shader over
 * a full-screen triangle and push a sketch's values in as uniforms.
 *
 * Every param `foo` arrives in the shader as `uniform float u_foo`, declared
 * automatically, so a sketch's GLSL and its param list cannot drift apart
 * without the compiler saying so.
 */
import type { ParamDef, Values } from "./types";

export const VERT = `#version 300 es
in vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }`;

export function uniformDecls(params: ParamDef[]): string {
  return params.map((p) => `uniform float u_${p.key};`).join("\n");
}

function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh) ?? "";
    gl.deleteShader(sh);
    // Line numbers in the log refer to the assembled source; print it numbered.
    const numbered = src.split("\n").map((l, i) => `${String(i + 1).padStart(4)} ${l}`).join("\n");
    console.error(numbered);
    throw new Error(`Shader did not compile:\n${log}`);
  }
  return sh;
}

export interface Program {
  prog: WebGLProgram;
  loc(name: string): WebGLUniformLocation | null;
  /** Bind, set every `u_<key>` from values, draw the triangle. */
  run(values?: Values): void;
  dispose(): void;
}

export function program(gl: WebGL2RenderingContext, frag: string): Program {
  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, frag);
  const prog = gl.createProgram()!;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.bindAttribLocation(prog, 0, "a_pos");
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error(`Program did not link: ${gl.getProgramInfoLog(prog)}`);
  }
  gl.deleteShader(vs);
  gl.deleteShader(fs);

  const vao = gl.createVertexArray()!;
  const buf = gl.createBuffer()!;
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);

  const cache = new Map<string, WebGLUniformLocation | null>();
  const loc = (name: string) => {
    if (!cache.has(name)) cache.set(name, gl.getUniformLocation(prog, name));
    return cache.get(name)!;
  };

  return {
    prog,
    loc,
    run(values) {
      gl.useProgram(prog);
      if (values) for (const [k, v] of Object.entries(values)) {
        const l = loc(`u_${k}`);
        if (l) gl.uniform1f(l, v);
      }
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindVertexArray(null);
    },
    dispose() {
      gl.deleteProgram(prog);
      gl.deleteBuffer(buf);
      gl.deleteVertexArray(vao);
    },
  };
}

/** Rotation matrix (column-major, for a GLSL mat3) from yaw and pitch in radians. */
export function orbitMatrix(yaw: number, pitch: number): Float32Array {
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  // R = Rx(pitch) * Ry(yaw), applied to world points to get object space.
  return new Float32Array([
    cy, sp * sy, -cp * sy,
    0, cp, sp,
    sy, -sp * cy, cp * cy,
  ]);
}
