"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Approve / un-approve / delete one visitor-added deck. */
export function SectorActions({ slug, approved }: { slug: string; approved: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (action: "approve" | "unapprove" | "delete") => {
    if (action === "delete" && !confirm("Delete this deck and its claims? This can't be undone.")) return;
    setBusy(action);
    try {
      await fetch("/api/swipe/admin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug, action }),
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  };

  const btn = "rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] disabled:opacity-40";

  return (
    <div className="flex flex-wrap gap-2">
      {approved ? (
        <button className={`${btn} border-line text-graphite hover:text-ink`} disabled={busy !== null} onClick={() => run("unapprove")}>
          {busy === "unapprove" ? "…" : "Un-approve"}
        </button>
      ) : (
        <button className={`${btn} border-accent bg-accent text-surface`} disabled={busy !== null} onClick={() => run("approve")}>
          {busy === "approve" ? "…" : "Approve and drop the badge"}
        </button>
      )}
      <button className={`${btn} border-line text-graphite hover:text-ink`} disabled={busy !== null} onClick={() => run("delete")}>
        {busy === "delete" ? "…" : "Delete"}
      </button>
    </div>
  );
}
