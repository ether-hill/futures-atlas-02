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
