// Compiled-program cache, keyed by GL context + shader source. The Player keeps
// one GL surface for the lifetime of a piece slot and only re-creates the Piece
// on remount (randomise / reseed / param change), so recompiling the same shaders
// every time is the main cause of the remount stutter. Cache them on the context
// and reuse — programs live as long as the context, so pieces must NOT delete a
// cached program in dispose() (only their own textures / buffers / VAOs).

const caches = new WeakMap<WebGL2RenderingContext, Map<string, WebGLProgram>>();

export function cachedProgram(
  gl: WebGL2RenderingContext,
  key: string,
  build: () => WebGLProgram,
): WebGLProgram {
  let m = caches.get(gl);
  if (!m) {
    m = new Map();
    caches.set(gl, m);
  }
  let p = m.get(key);
  if (!p) {
    p = build();
    m.set(key, p);
  }
  return p;
}
