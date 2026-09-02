/**
 * /api/mocks/instagram, the Instagram preview's shared arrangement.
 *
 *   GET  -> { configured, record: { state, by, at } | null }
 *   POST { edits } -> { ok, record }
 *
 * The order, the deletions and the crops used to live in each person's
 * localStorage, which meant two editors arranging the same feed saw two
 * different feeds. This is the one copy.
 *
 * Gated by the middleware exactly like /mocks itself: the page behind it is
 * signed-in only, so this is too, on both verbs. `by` is the signed-in editor
 * as the server knows them, never a name the client sends.
 *
 * If no KV store is configured (local dev pulls the Development env, which has
 * no REDIS_URL) this answers `configured: false` and the page keeps its
 * per-browser behaviour instead of failing.
 */
import { NextResponse } from "next/server";
import { getEditor } from "@/lib/editor";
import { readMock, writeMock, storeConfigured } from "@/lib/store";

export const dynamic = "force-dynamic";

const NAME = "instagram";

interface Crop {
  zoom: number;
  x: number;
  y: number;
}
interface Edits {
  order: string[];
  hidden: string[];
  crops: Record<string, Crop>;
}

const num = (v: unknown, fallback: number) =>
  typeof v === "number" && Number.isFinite(v) ? v : fallback;

/** Take only the shape we store. The body is trusted (an editor sent it) but
 *  the record outlives the page that wrote it, so it stays well-formed. */
function coerce(v: unknown): Edits {
  const o = (v ?? {}) as Partial<Edits>;
  const crops: Record<string, Crop> = {};
  for (const [id, c] of Object.entries(o.crops ?? {})) {
    if (!c || typeof c !== "object") continue;
    crops[id] = {
      zoom: num((c as Crop).zoom, 1),
      x: num((c as Crop).x, 0),
      y: num((c as Crop).y, 0),
    };
  }
  return {
    order: Array.isArray(o.order) ? o.order.filter((x) => typeof x === "string") : [],
    hidden: Array.isArray(o.hidden) ? o.hidden.filter((x) => typeof x === "string") : [],
    crops,
  };
}

export async function GET() {
  if (!storeConfigured()) return NextResponse.json({ configured: false, record: null });
  return NextResponse.json({ configured: true, record: await readMock<Edits>(NAME) });
}

export async function POST(req: Request) {
  if (!storeConfigured()) {
    return NextResponse.json(
      { ok: false, error: "no store configured" },
      { status: 503 },
    );
  }

  let body: { edits?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  const editor = await getEditor();
  const record = await writeMock(NAME, coerce(body.edits), editor?.id ?? null);
  if (!record) {
    return NextResponse.json({ ok: false, error: "write failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, record });
}
