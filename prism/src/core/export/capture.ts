// Export. PNG of the current frame (render at the chosen resolution first — the
// resolution picker is the hi-res mechanism), and a seamless WebM loop captured
// over exactly one loop period.

export function download(blob: Blob, filename: string): void {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

export function paramsHash(obj: unknown): string {
  const json = JSON.stringify(obj);
  let h = 2166136261;
  for (let i = 0; i < json.length; i++) {
    h ^= json.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

export function exportPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error("toBlob failed"))), "image/png"),
  );
}

/** Record the live canvas to a WebM blob at an arbitrary W×H, fps and duration.
 *  The square/aspect-mismatched source is cover-fit into the target each frame.
 *  `onProgress` reports 0..1. */
export function recordVideo(
  src: HTMLCanvasElement,
  W: number,
  H: number,
  fps: number,
  seconds: number,
  onProgress?: (p: number) => void,
): Promise<Blob> {
  const out = document.createElement("canvas");
  out.width = W;
  out.height = H;
  const ctx = out.getContext("2d")!;
  const stream = out.captureStream(fps);
  const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm";
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 24_000_000 });
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);

  const coverDraw = (): void => {
    const sw = src.width;
    const sh = src.height;
    const sa = sw / sh;
    const da = W / H;
    let sx = 0;
    let sy = 0;
    let scw = sw;
    let sch = sh;
    if (sa > da) {
      scw = sh * da;
      sx = (sw - scw) / 2;
    } else {
      sch = sw / da;
      sy = (sh - sch) / 2;
    }
    ctx.drawImage(src, sx, sy, scw, sch, 0, 0, W, H);
  };

  return new Promise((resolve) => {
    const total = Math.max(200, seconds * 1000);
    const t0 = performance.now();
    let raf = 0;
    const pump = (now: number): void => {
      coverDraw();
      const p = Math.min(1, (now - t0) / total);
      onProgress?.(p);
      if (p >= 1) {
        rec.stop();
        return;
      }
      raf = requestAnimationFrame(pump);
    };
    rec.onstop = () => {
      cancelAnimationFrame(raf);
      resolve(new Blob(chunks, { type: "video/webm" }));
    };
    rec.start();
    raf = requestAnimationFrame(pump);
  });
}

/** Record the canvas to a WebM blob for `seconds` (one seamless loop). */
export function recordLoop(canvas: HTMLCanvasElement, seconds: number, fps = 60): Promise<Blob> {
  const stream = canvas.captureStream(fps);
  const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm";
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 20_000_000 });
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
  return new Promise((resolve) => {
    rec.onstop = () => resolve(new Blob(chunks, { type: "video/webm" }));
    rec.start();
    setTimeout(() => rec.stop(), Math.max(200, seconds * 1000));
  });
}
