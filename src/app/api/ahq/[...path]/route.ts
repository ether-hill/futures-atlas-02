/**
 * /api/ahq/* — session backend for the Actually Hard Questions zone bundle,
 * mirroring its local dev server (server.mjs) route-for-route so the exact
 * same client code (index.html's `api()`) drives both. KV-backed (see
 * src/lib/ahq/store.ts); with no store provisioned /health answers
 * `configured:false`, which the client already reads as "no server" and
 * falls back to its single-device localStorage mode — never a broken UI.
 *
 * Deployed copy only: the standalone app (served by server.mjs) calls
 * `/api/...` directly; this copy's <base> tag plus one string swap in its
 * `api()` function points it at `/api/ahq/...` instead. See
 * public/actually-hard-questions/index.html.
 */
import { NextResponse } from "next/server";
import {
  addQuestion,
  bulkAddQuestions,
  createSession,
  deleteQuestion,
  getSession,
  setAdj,
  setName,
  setTopic,
  storeConfigured,
} from "@/lib/ahq/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "cache-control": "no-store" } });

async function body(req: Request): Promise<Record<string, unknown>> {
  try {
    return (await req.json()) ?? {};
  } catch {
    return {};
  }
}

export async function GET(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const parts = path ?? [];

  if (parts[0] === "health") {
    return json({ ok: true, configured: storeConfigured(), lan: "" });
  }

  if (parts[0] === "sessions" && parts[1]) {
    const session = await getSession(parts[1]);
    if (!session) return json({ error: "no such session" }, 404);
    if (parts[2] === "v") return json({ v: session.v, n: session.qs.length, topicIdx: session.topicIdx });
    if (!parts[2]) return json(session);
  }

  return json({ error: "unknown route" }, 404);
}

export async function POST(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const parts = path ?? [];

  if (parts[0] === "sessions" && !parts[1]) {
    const b = await body(req);
    const session = await createSession(String(b.name ?? ""));
    if (!session) return json({ error: "not_configured" }, 503);
    return json(session);
  }

  if (parts[0] === "sessions" && parts[1] && parts[2]) {
    const id = parts[1];
    const b = await body(req);

    if (parts[2] === "questions") {
      const q = String(b.q ?? "").trim();
      if (!q) return json({ error: "empty" }, 400);
      const result = await addQuestion(id, String(b.t ?? "work"), q, String(b.who ?? ""));
      if (!result) return json({ error: "no such session" }, 404);
      return json({ ok: true, question: result.question, v: result.session.v });
    }
    if (parts[2] === "topic") {
      const session = await setTopic(id, Number(b.topicIdx) || 0);
      if (!session) return json({ error: "no such session" }, 404);
      return json({ ok: true, topicIdx: session.topicIdx, v: session.v });
    }
    if (parts[2] === "adj") {
      const session = await setAdj(id, String(b.id ?? ""), Number(b.adj) || 0);
      if (!session) return json({ error: "no such session" }, 404);
      return json({ ok: true, v: session.v });
    }
    if (parts[2] === "name") {
      const session = await setName(id, String(b.name ?? ""));
      if (!session) return json({ error: "no such session" }, 404);
      return json({ ok: true, v: session.v });
    }
    if (parts[2] === "bulk") {
      const questions = Array.isArray(b.questions) ? (b.questions as { t: string; q: string; who?: string }[]) : [];
      const session = await bulkAddQuestions(id, questions);
      if (!session) return json({ error: "no such session" }, 404);
      return json({ ok: true, n: session.qs.length, v: session.v });
    }
  }

  return json({ error: "unknown route" }, 404);
}

export async function DELETE(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const parts = path ?? [];

  if (parts[0] === "sessions" && parts[1] && parts[2] === "questions" && parts[3]) {
    const session = await deleteQuestion(parts[1], parts[3]);
    if (!session) return json({ error: "no such session" }, 404);
    return json({ ok: true, v: session.v });
  }

  return json({ error: "unknown route" }, 404);
}
