import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import ffmpegPath from "ffmpeg-static";
import { chromium } from "playwright";
import { buildSceneHtml, sceneDurationMs, sceneSize } from "./scene";
import type { Clip, Storyboard } from "./types";

/**
 * Playwright's job: photograph the film.
 *
 * The scene is stepped frame by frame rather than recorded in real time. A
 * recording drops frames when a scan is slow to paint; stepping cannot, because
 * nothing advances until the screenshot is taken. The cost is wall-clock time,
 * which does not matter for a tool that runs on a desk, and the gain is that a
 * clip is deterministic — the same storyboard renders to the same bytes.
 *
 * This never runs in a request. A minute of film is eighteen hundred
 * screenshots; the longest serverless function in this repo is 120 seconds.
 */
export type RenderOptions = {
  outFile: string;
  /** Scale the frame down for a fast proof. 1 = full size. */
  scale?: number;
  onProgress?: (frame: number, total: number) => void;
};

export async function renderStoryboard(
  board: Storyboard,
  options: RenderOptions,
): Promise<Clip> {
  const { w, h } = sceneSize(board);
  const scale = options.scale ?? 1;
  const width = Math.round(w * scale) - (Math.round(w * scale) % 2);
  const height = Math.round(h * scale) - (Math.round(h * scale) % 2);
  const durationMs = sceneDurationMs(board);
  const total = Math.max(1, Math.round((durationMs / 1000) * board.fps));

  const work = await fs.mkdtemp(path.join(os.tmpdir(), "dramaturge-"));
  const frameDir = path.join(work, "frames");
  await fs.mkdir(frameDir);
  const scenePath = path.join(work, "scene.html");
  await fs.writeFile(scenePath, buildSceneHtml(board), "utf8");

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width, height },
      deviceScaleFactor: 1,
    });
    await page.goto(`file://${scenePath}`, { waitUntil: "load", timeout: 60_000 });
    if (scale !== 1) {
      await page.addStyleTag({
        content: `#stage{transform:scale(${scale});transform-origin:top left}`,
      });
    }
    await page.waitForFunction(() => (window as unknown as { __ready: unknown }).__ready, null, {
      timeout: 120_000,
    });

    const failed = (await page.evaluate(
      () => (window as unknown as { __failedImages?: string[] }).__failedImages ?? [],
    )) as string[];
    if (failed.length > 0) {
      throw new Error(
        `${failed.length} leaf image(s) would not decode, so those frames would be empty:\n  ` +
          failed.join("\n  "),
      );
    }

    const stage = page.locator("#stage");
    for (let i = 0; i < total; i++) {
      await page.evaluate(
        (t) => (window as unknown as { __seek: (n: number) => void }).__seek(t),
        (i / board.fps) * 1000,
      );
      await stage.screenshot({
        path: path.join(frameDir, `${String(i).padStart(6, "0")}.png`),
        scale: "css",
      });
      options.onProgress?.(i + 1, total);
    }
  } finally {
    await browser.close();
  }

  await fs.mkdir(path.dirname(options.outFile), { recursive: true });
  await encode(frameDir, board.fps, options.outFile);
  await fs.rm(work, { recursive: true, force: true });

  return {
    storyboardId: board.id,
    file: options.outFile,
    width,
    height,
    fps: board.fps,
    durationMs,
    renderedAt: new Date().toISOString(),
    cited: board.shots.flatMap((s) => (s.caption ? [s.caption.lineId] : [])),
  };
}

function encode(frameDir: string, fps: number, outFile: string): Promise<void> {
  const bin = ffmpegPath as unknown as string;
  if (!bin) throw new Error("ffmpeg-static did not resolve a binary");
  return new Promise((resolve, reject) => {
    const proc = spawn(
      bin,
      [
        "-y",
        "-framerate", String(fps),
        "-i", path.join(frameDir, "%06d.png"),
        "-c:v", "libx264",
        "-preset", "slow",
        "-crf", "18",
        // yuv420p is what every player and every social platform can decode;
        // without it the file plays here and nowhere else.
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        outFile,
      ],
      { stdio: ["ignore", "ignore", "pipe"] },
    );
    let err = "";
    proc.stderr.on("data", (d) => (err += String(d)));
    proc.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`ffmpeg failed:\n${err.slice(-800)}`)),
    );
  });
}
