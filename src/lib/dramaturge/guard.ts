import { NextResponse } from "next/server";
import { getEditor } from "@/lib/editor";

/**
 * The studio's API is not gated by middleware.
 *
 * Middleware gates page paths — internal areas and draft projects — but only
 * one API route is special-cased there, so anything under /api/dramaturge is
 * public unless it says otherwise. These routes spend an Anthropic key and a
 * metered page budget, so each one calls this first.
 */
export async function requireEditor(): Promise<NextResponse | null> {
  const editor = await getEditor();
  if (!editor) {
    return NextResponse.json({ error: "sign in to use the studio" }, { status: 401 });
  }
  return null;
}

/**
 * Collecting and rendering run for minutes. On Vercel they would be killed at
 * the function ceiling with a half-written collection behind them, so they
 * refuse to start there rather than fail halfway.
 */
export function requireLocal(): NextResponse | null {
  if (process.env.VERCEL) {
    return NextResponse.json(
      {
        error:
          "This step runs for minutes and cannot run on the deployed site. Run the studio locally with npm run dev.",
      },
      { status: 501 },
    );
  }
  return null;
}
