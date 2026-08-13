"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Card, Sector, Verdict } from "../data/sectors";

/**
 * Bring your own cards.
 *
 * Paste a list of claims with their answers and play them as a deck. This is
 * deliberately a LOCAL deck: it never leaves the browser, it is never counted
 * in the public tally, and it carries no sources. The hand-written decks make
 * a promise (every claim checkable against a primary source) that a pasted
 * line cannot, so custom cards are marked as yours on every card face rather
 * than being quietly mixed in with the sourced ones.
 *
 * The text is kept in localStorage so a reload does not eat someone's typing.
 */
const STORE = "stf-own-v1";

const YES = new Set(["already", "already real", "real", "yes", "y", "true", "t", "happened"]);
const NO = new Set(["not yet", "notyet", "not", "no", "n", "false", "f", "nope"]);

export interface ParsedLine {
  n: number;          // 1-based line number, for pointing at the bad ones
  raw: string;
  claim?: string;
  verdict?: Verdict;
  error?: string;
}

const norm = (s: string) => s.trim().toLowerCase().replace(/[.!?]+$/, "");

function readVerdict(s: string): Verdict | null {
  const v = norm(s);
  if (YES.has(v)) return "already";
  if (NO.has(v)) return "notyet";
  return null;
}

/**
 * One card per line, claim and answer separated by a pipe, a tab, or a dash
 * with spaces around it. The answer may be on either side, because people
 * write lists both ways round and being strict about it only creates errors
 * to explain.
 */
export function parseDeck(text: string): ParsedLine[] {
  return text.split(/\r?\n/).flatMap((raw, i): ParsedLine[] => {
    const line = raw.trim();
    if (!line || line.startsWith("#")) return [];
    const n = i + 1;

    const parts = line.split(/\s*\|\s*|\t+|\s+[—–-]\s+/).filter(Boolean);
    if (parts.length < 2) {
      return [{ n, raw: line, error: "no answer on this line" }];
    }

    const last = parts[parts.length - 1]!;
    const first = parts[0]!;
    let verdict = readVerdict(last);
    let claim = parts.slice(0, -1).join(" ").trim();
    if (!verdict) {
      verdict = readVerdict(first);
      claim = parts.slice(1).join(" ").trim();
    }
    if (!verdict) return [{ n, raw: line, error: `“${norm(last)}” is not an answer` }];
    if (claim.length < 8) return [{ n, raw: line, error: "the claim is too short" }];
    return [{ n, raw: line, claim, verdict }];
  });
}

export function toSector(lines: ParsedLine[]): Sector {
  const cards: Card[] = lines
    .filter((l): l is ParsedLine & { claim: string; verdict: Verdict } => !!l.claim && !!l.verdict)
    .map((l, i) => ({
      id: `own-${i}`,
      claim: l.claim,
      short: l.claim.length > 40 ? `${l.claim.slice(0, 39)}…` : l.claim,
      verdict: l.verdict,
      // no lede, no note, no source: this card is only as good as whoever
      // typed it, and the reveal says so rather than dressing it up
      lede: "",
      note: "",
      source: { label: "Your own card, unsourced" },
    }));
  return { id: "own", kind: "custom", name: "Your cards", blurb: "Pasted by you, kept in this browser", cards };
}

const SAMPLE = `A quantum computer has factored a number bigger than 100 | not yet
Software has been reading cervical smear slides since 1995 | already
An AI has sat as a judge in a binding case — not yet`;

export function CustomDeck({ onPlay, active }: { onPlay: (s: Sector) => void; active: boolean }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [text, setText] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try { setText(localStorage.getItem(STORE) ?? ""); } catch { /* private mode */ }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(STORE, text); } catch { /* private mode, not fatal */ }
  }, [text, loaded]);

  // On a short screen the panel opens below the fold of a fixed-height hero,
  // so bring it into view rather than leaving it to be discovered by scrolling.
  useEffect(() => {
    if (open) panelRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [open]);

  const lines = useMemo(() => parseDeck(text), [text]);
  const good = lines.filter((l) => l.claim && l.verdict);
  const bad = lines.filter((l) => l.error);
  const already = good.filter((l) => l.verdict === "already").length;
  const notYet = good.length - already;

  return (
    <div className="own">
      <button
        className={`sf-chip own-toggle${active ? " on" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {open ? "Close" : "Add your own"}
      </button>

      {open && (
        <div className="own-panel" ref={panelRef}>
          <label className="own-lbl" htmlFor="own-text">
            One card per line: the claim, then the answer, separated by <code>|</code> or a dash.
            The answer is <b>already</b> or <b>not yet</b>.
          </label>
          <textarea
            id="own-text"
            className="own-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={SAMPLE}
            spellCheck={false}
            rows={7}
          />

          <div className="own-foot">
            <span className="own-tally">
              {good.length
                ? <><b>{good.length}</b> card{good.length === 1 ? "" : "s"} · {already} already · {notYet} not yet</>
                : <>Nothing to play yet</>}
              {bad.length > 0 && <i className="own-bad"> · {bad.length} line{bad.length === 1 ? "" : "s"} to fix</i>}
            </span>
            <span className="own-actions">
              {!text && <button className="own-btn ghost" onClick={() => setText(SAMPLE)}>Use an example</button>}
              {text && <button className="own-btn ghost" onClick={() => setText("")}>Clear</button>}
              <button className="own-btn" disabled={good.length === 0} onClick={() => onPlay(toSector(good))}>
                Play {good.length || ""} card{good.length === 1 ? "" : "s"}
              </button>
            </span>
          </div>

          {bad.length > 0 && (
            <ul className="own-errs">
              {bad.slice(0, 4).map((l) => (
                <li key={l.n}><b>Line {l.n}</b> {l.error}: <span>{l.raw.slice(0, 60)}</span></li>
              ))}
              {bad.length > 4 && <li className="more">and {bad.length - 4} more</li>}
            </ul>
          )}

          <p className="own-note">
            These stay in this browser. They are never sent anywhere, never counted in the public
            tally, and carry no source, so each one is flagged as yours while you play it.
          </p>
        </div>
      )}
    </div>
  );
}
