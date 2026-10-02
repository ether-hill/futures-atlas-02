/**
 * /api/specimens, the Specimens gallery's pins.
 *
 *   GET                         -> { configured, pins }
 *   POST { sketch, title, note, values, thumb } -> { ok, pin }
 *   DELETE ?id=                 -> { ok }
 *
 * Signed-in only on every verb (INTERNAL_PATHS in the middleware), like the
 * draft page that calls it. If Specimens is ever published, GET is the verb to
 * open: the gallery would be the public part, the pinning would not.
 *
 * Without a KV store (local dev before `vercel env pull`) this answers
 * `configured: false` and the lab hides the pin button rather than failing.
 */
import { NextResponse } from "next/server";
import { getEditor } from "@/lib/editor";
import { sketchById } from "@/lib/specimens";
import { diff, resolve } from "@/lib/specimens/types";
import {
  deleteSpecimenPin,
  listSpecimenPins,
  storeConfigured,
  writeSpecimenPin,
  type SpecimenPin,
} from "@/lib/store";

export const dynamic = "force-dynamic";

/** A 480px JPEG is ~30-60 KB. Anything far past that is not a thumbnail. */
const MAX_THUMB = 400_000;

export async function GET() {
  if (!storeConfigured()) return NextResponse.json({ configured: false, pins: [] });
  return NextResponse.json({ configured: true, pins: await listSpecimenPins() });
}

export async function POST(req: Request) {
  if (!storeConfigured()) {
    return NextResponse.json({ ok: false, error: "no store configured" }, { status: 503 });
  }
  let body: Partial<SpecimenPin>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  const sketch = sketchById(String(body.sketch ?? ""));
  if (!sketch) return NextResponse.json({ ok: false, error: "unknown sketch" }, { status: 400 });
  const thumb = String(body.thumb ?? "");
  if (!thumb.startsWith("data:image/jpeg;base64,") || thumb.length > MAX_THUMB) {
    return NextResponse.json({ ok: false, error: "bad thumbnail" }, { status: 400 });
  }
  const editor = await getEditor();
  const at = Date.now();
  const pin: SpecimenPin = {
    id: `${at.toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    sketch: sketch.id,
    title: String(body.title ?? "").trim().slice(0, 80) || "Untitled",
    note: String(body.note ?? "").trim().slice(0, 400),
    // Re-derived through the sketch, so a pin only ever holds known keys.
    values: diff(sketch, resolve(sketch, body.values as Record<string, number> | undefined)),
    thumb,
    by: editor?.id ?? null,
    at,
  };
  if (!(await writeSpecimenPin(pin))) {
    return NextResponse.json({ ok: false, error: "write failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, pin });
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "no id" }, { status: 400 });
  return NextResponse.json({ ok: await deleteSpecimenPin(id) });
}
