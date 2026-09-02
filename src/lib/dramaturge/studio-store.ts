import { promises as fs } from "node:fs";
import path from "node:path";
import type { Clip, Collection, Storyboard } from "./types";

/**
 * The studio's storage: plain files under data/dramaturge.
 *
 * This is deliberately NOT the KV store the rest of the site uses, because the
 * studio is not a hosted feature. Collecting reads a hundred leaves and
 * rendering photographs eighteen hundred frames a minute; both run for minutes
 * on a desk, far past the 120-second ceiling the longest function here uses.
 * What reaches the site is the finished clip, committed like any other asset.
 *
 * Every reader tolerates an absent directory, so a fresh checkout with no
 * studio work in it answers "nothing yet" rather than throwing.
 */
const ROOT = path.join(process.cwd(), "data", "dramaturge");

const dirs = {
  collections: path.join(ROOT, "collections"),
  storyboards: path.join(ROOT, "storyboards"),
  clips: path.join(ROOT, "clips"),
};

async function readJson<T>(file: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as T;
  } catch {
    return null;
  }
}

async function listJson<T>(dir: string): Promise<T[]> {
  try {
    const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".json"));
    const all = await Promise.all(files.map((f) => readJson<T>(path.join(dir, f))));
    return all.filter((x): x is Awaited<T> => x !== null) as T[];
  } catch {
    return [];
  }
}

async function writeJson(file: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(value, null, 2));
}

export const studioRoot = ROOT;

export const saveCollection = (c: Collection) =>
  writeJson(path.join(dirs.collections, `${c.id}.json`), c);
export const readCollection = (id: string) =>
  readJson<Collection>(path.join(dirs.collections, `${id}.json`));
export const listCollections = () => listJson<Collection>(dirs.collections);

export const saveStoryboard = (b: Storyboard) =>
  writeJson(path.join(dirs.storyboards, `${b.id}.json`), b);
export const readStoryboard = (id: string) =>
  readJson<Storyboard>(path.join(dirs.storyboards, `${id}.json`));
export const listStoryboards = () => listJson<Storyboard>(dirs.storyboards);

export const saveClip = (c: Clip) =>
  writeJson(path.join(dirs.clips, `${c.storyboardId}.json`), c);
export const listClips = () => listJson<Clip>(dirs.clips);
export const clipFile = (storyboardId: string) =>
  path.join(process.cwd(), "public", "dramaturge", `${storyboardId}.mp4`);
