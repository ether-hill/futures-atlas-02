/**
 * /api/tokens — the runtime theming store endpoint.
 *   GET  -> { overrides, versions, configured }   (public; the site reads this)
 *   POST (protected by middleware Basic auth):
 *     { id, value }              save one override
 *     { id, value: null }        reset one
 *     { reset: "all" }           clear all overrides
 *     { action: "replace", overrides }   atomically set the whole set (undo/redo)
 *     { action: "snapshot", label }      save current overrides as a version
 *     { action: "restore", id }          apply a saved version -> { overrides }
 *     { action: "deleteVersion", id }    delete a version
 * Only known token ids are ever written.
 */
import { NextResponse } from "next/server";
import { isKnownToken } from "futures-atlas-core";
import {
  readOverrides,
  writeOverride,
  deleteOverride,
  resetAllOverrides,
  replaceOverrides,
  listVersions,
  saveVersion,
  getVersionOverrides,
  deleteVersion,
  storeConfigured,
} from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const [overrides, versions] = await Promise.all([readOverrides(), listVersions()]);
  return NextResponse.json({ overrides, versions, configured: storeConfigured() });
}

function clean(map: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [id, v] of Object.entries(map || {})) {
    if (isKnownToken(id) && v != null) out[id] = String(v);
  }
  return out;
}

export async function POST(req: Request) {
  if (!storeConfigured()) {
    return NextResponse.json({ ok: false, error: "store not configured (connect Vercel KV)" }, { status: 503 });
  }

  let body: {
    id?: string;
    value?: string | null;
    reset?: string;
    action?: string;
    overrides?: Record<string, unknown>;
    label?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  // actions
  switch (body.action) {
    case "replace":
      await replaceOverrides(clean(body.overrides || {}));
      return NextResponse.json({ ok: true });
    case "snapshot": {
      const current = await readOverrides();
      const v = await saveVersion(body.label || "", current);
      return NextResponse.json({ ok: true, version: v });
    }
    case "restore": {
      if (!body.id) return NextResponse.json({ ok: false, error: "no id" }, { status: 400 });
      const ov = await getVersionOverrides(body.id);
      if (ov == null) return NextResponse.json({ ok: false, error: "no such version" }, { status: 404 });
      await replaceOverrides(ov);
      return NextResponse.json({ ok: true, overrides: ov });
    }
    case "deleteVersion":
      if (body.id) await deleteVersion(body.id);
      return NextResponse.json({ ok: true });
  }

  // single-token ops
  if (body.reset === "all") {
    await resetAllOverrides();
    return NextResponse.json({ ok: true });
  }
  const { id, value } = body;
  if (!id || !isKnownToken(id)) {
    return NextResponse.json({ ok: false, error: "unknown token" }, { status: 400 });
  }
  if (value == null) await deleteOverride(id);
  else await writeOverride(id, String(value));
  return NextResponse.json({ ok: true });
}
