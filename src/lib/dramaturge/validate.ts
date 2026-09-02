/**
 * The verbatim check.
 *
 * A caption burned into a frame is a quotation, and a quotation that has
 * drifted from its source is the one failure this project cannot ship. Every
 * caption in a storyboard is byte-compared against the line it cites in the
 * collection. Any mismatch — a smart quote, a trimmed ellipsis, a silently
 * modernised spelling — fails, and it fails the build rather than warning.
 *
 * The renderer substitutes caption text from the collection at build time, so
 * in normal operation this cannot fail. It exists to catch the abnormal: a
 * hand-edited storyboard, a collection swapped underneath one, a merge.
 */
import type { Collection, Storyboard } from "./types";

export type ValidationIssue = {
  storyboardId: string;
  shotId: string;
  lineId: string;
  reason: "unknown-line" | "mismatch" | "wrong-leaf";
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

export function validateStoryboard(board: Storyboard, collection: Collection): ValidationReport {
  const lines = new Map(collection.lines.map((l) => [l.id, l]));
  const issues: ValidationIssue[] = [];
  let checked = 0;

  for (const shot of board.shots) {
    if (!shot.caption) continue;
    checked++;
    const line = lines.get(shot.caption.lineId);
    if (!line) {
      issues.push({
        storyboardId: board.id,
        shotId: shot.id,
        lineId: shot.caption.lineId,
        reason: "unknown-line",
        found: shot.caption.text,
        at: 0,
      });
      continue;
    }
    if (shot.caption.text !== line.text) {
      issues.push({
        storyboardId: board.id,
        shotId: shot.id,
        lineId: line.id,
        reason: "mismatch",
        expected: line.text,
        found: shot.caption.text,
        at: firstDifference(line.text, shot.caption.text),
      });
      continue;
    }
    // A quotation shown over the wrong leaf is a false claim even when the
    // wording is right: the picture says "this is the page it is on".
    if (shot.asset.kind === "leaf" && shot.asset.passageId !== line.passageId) {
      issues.push({
        storyboardId: board.id,
        shotId: shot.id,
        lineId: line.id,
        reason: "wrong-leaf",
        expected: line.passageId,
        found: shot.asset.passageId,
        at: 0,
      });
    }
  }

  return { ok: issues.length === 0, checked, issues };
}

export function describeIssue(issue: ValidationIssue): string {
  if (issue.reason === "unknown-line") {
    return `${issue.storyboardId}/${issue.shotId}: caption cites "${issue.lineId}", which is not in the collection.`;
  }
  if (issue.reason === "wrong-leaf") {
    return (
      `${issue.storyboardId}/${issue.shotId}: the caption quotes ${issue.lineId}, which is on ` +
      `${issue.expected}, but the shot shows ${issue.found}. A quotation over the wrong leaf is a false claim.`
    );
  }
  const at = issue.at;
  const window = (s = "") => JSON.stringify(s.slice(Math.max(0, at - 20), at + 30));
  return [
    `${issue.storyboardId}/${issue.shotId}: caption "${issue.lineId}" does not match the collection at character ${at}.`,
    `  collection: ${window(issue.expected)}`,
    `  storyboard: ${window(issue.found)}`,
  ].join("\n");
}
