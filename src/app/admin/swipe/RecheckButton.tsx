"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Run the freshness pass now instead of waiting for Monday. Takes a minute or two. */
export function RecheckButton() {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "running" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  const run = async () => {
    setState("running"); setMsg("");
    try {
      const r = await fetch("/api/swipe/recheck", { cache: "no-store" });
      const d = await r.json();
      if (!r.ok || !d.ok) { setState("error"); setMsg(d.message ?? d.code ?? "Failed."); return; }
      setState("done");
      setMsg(`Re-checked ${d.checked} of ${d.totalClaims} claims · ${d.flagged} flagged`);
      router.refresh();
    } catch {
      setState("error"); setMsg("Couldn't reach the checker.");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={run}
        disabled={state === "running"}
        className="rounded-full border border-line px-4 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-graphite hover:text-ink disabled:opacity-40"
      >
        {state === "running" ? "Checking — a minute or two…" : "Run the check now"}
      </button>
      {msg && <span className="font-mono text-[11px] text-graphite">{msg}</span>}
    </div>
  );
}
