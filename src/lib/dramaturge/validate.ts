/**
 * The verbatim validator.
 *
 * It walks a rendered script, pulls out every line marked as sourced, and
 * byte-compares it against pool.json. A smart quote, a trimmed ellipsis, a
 * silently modernised spelling — any of them fails. This check is the reason
 * the output can be trusted, so it is a build failure, never a warning.
 */
import type { Play, Pool } from "./types";

const SOURCED = /^(.*?)\s*\[\[src:([a-zA-Z0-9]+)\]\]\s*$/gm;

export type ValidationIssue = {
  playId: string;
  lineId: string;
  reason: "unknown-id" | "mismatch";
  expected?: string;
  found?: string;
  at: number;
};

export type ValidationReport = {
  ok: boolean;
  checked: number;
  issues: ValidationIssue[];
};

function firstDifference(a: string, b: string): number {
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) return i;
  return n;
}

export function validatePlay(play: Play, pool: Pool): ValidationReport {
  const index = new Map(pool.lines.map((l) => [l.id, l.text]));
  const issues: ValidationIssue[] = [];
  let checked = 0;

  for (const match of play.fountain.matchAll(SOURCED)) {
    const [, found, id] = match;
    checked++;
    const expected = index.get(id);
    if (expected === undefined) {
      issues.push({ playId: play.id, lineId: id, reason: "unknown-id", found, at: match.index ?? 0 });
      continue;
    }
    if (found !== expected) {
      issues.push({
        playId: play.id,
        lineId: id,
        reason: "mismatch",
        expected,
        found,
        at: firstDifference(expected, found),
      });
    }
  }

  return { ok: issues.length === 0, checked, issues };
}

export function describeIssue(issue: ValidationIssue): string {
  if (issue.reason === "unknown-id") {
    return `${issue.playId}: line id "${issue.lineId}" is not in the pool.`;
  }
  const at = issue.at;
  const window = (s = "") => JSON.stringify(s.slice(Math.max(0, at - 20), at + 30));
  return [
    `${issue.playId}: quoted line "${issue.lineId}" does not match the pool at character ${at}.`,
    `  pool:   ${window(issue.expected)}`,
    `  script: ${window(issue.found)}`,
  ].join("\n");
}
