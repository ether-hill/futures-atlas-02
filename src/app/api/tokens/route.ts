/**
 * /api/tokens — the runtime theming store endpoint.
 *   GET            -> { overrides }  (public; the site reads this each load)
 *   POST {id,value} -> save one override
 *   POST {id,value:null} -> reset one (delete the override)
 *   POST {reset:"all"}   -> clear all overrides
 * The POST path is protected by middleware (Basic auth). Only known token ids
 * are ever written.
 */
import { NextResponse } from "next/server";
import { isKnownToken } from "futures-atlas-core";
import {
  readOverrides,
  writeOverride,
  deleteOverride,
  resetAllOverrides,
  storeConfigured,
} from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const overrides = await readOverrides();
  return NextResponse.json({ overrides, configured: storeConfigured() });
}

export async function POST(req: Request) {
  if (!storeConfigured()) {
    return NextResponse.json(
      { ok: false, error: "store not configured (connect Vercel KV)" },
      { status: 503 },
    );
  }

  let body: { id?: string; value?: string | null; reset?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  if (body.reset === "all") {
    await resetAllOverrides();
    return NextResponse.json({ ok: true });
  }

  const { id, value } = body;
  if (!id || !isKnownToken(id)) {
    return NextResponse.json({ ok: false, error: "unknown token" }, { status: 400 });
  }

  if (value == null) {
    await deleteOverride(id);
  } else {
    await writeOverride(id, String(value));
  }
  return NextResponse.json({ ok: true });
}
