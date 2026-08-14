"use client";

import { useRef, useState } from "react";
import type { Intervention } from "@/lib/interventions";
import { matchRebuttal, type Rebuttal } from "@/lib/rebuttals";

/**
 * The argument.
 *
 * An intervention you can't argue with is a poster. This is the part that makes
 * it a tool: you say why you don't buy it, and either the charts move or you get
 * told why they won't. Both outcomes are printed, and the ones that hold are
 * deliberately common, because a machine that concedes every point is flattery
 * with a chart attached.
 *
 * Objections stack. Say it's overstated and slow and both adjustments apply, in
 * the order you made them, which is also the order they're listed back to you.
 */

export type Objection = { text: string; rebuttal: Rebuttal | null };

const OPENERS = [
  "That effect is far too strong",
  "It would take years to bite",
  "The work just moves offshore",
  "The projected half is invented",
  "This could never actually happen",
];

/**
 * Says, in mechanical terms, what an accepted objection did to the transforms.
 * `before` is the year the effects bit before this objection landed, which is the
 * intervention's own date plus whatever lag earlier objections already bought.
 */
function whatItDid(r: Rebuttal, before: number): string | null {
  if (!r.adjust) return null;
  const bits: string[] = [];
  if (r.adjust.scale !== undefined && r.adjust.scale !== 1) {
    const pct = Math.round(Math.abs(1 - r.adjust.scale) * 100);
    bits.push(
      r.adjust.scale < 1
        ? `every rate pulled ${pct}% back toward no change`
        : `every rate pushed ${pct}% further from no change`
    );
  }
  if (r.adjust.lag) bits.push(`the effects bite from ${before + r.adjust.lag} rather than ${before}`);
  return bits.join(", ");
}

export default function Argue({
  intervention,
  objections,
  onPush,
  onUndo,
  className = "",
}: {
  intervention: Intervention;
  objections: Objection[];
  onPush: (o: Objection) => void;
  onUndo: () => void;
  className?: string;
}) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  /* Lag accumulates down the thread, so each turn reports the shift it made
     rather than the shift the first one made. */
  const lagBefore = objections.reduce<number[]>(
    (acc, o) => [...acc, acc.at(-1)! + (o.rebuttal?.adjust?.lag ?? 0)],
    [0]
  );

  function submit(raw?: string) {
    const t = (raw ?? text).trim();
    if (t.length < 4) return;
    onPush({ text: t, rebuttal: matchRebuttal(t) });
    setText("");
  }

  /* Any accepted objection anywhere in the thread means the charts are yours
     now, not just the most recent one. */
  const anyTook = objections.some((o) => o.rebuttal?.adjust);

  return (
    <div className={`argue-inner ${className}`}>
      <p className="argue-lead">
        <b>Now disagree with it.</b> Say what you think is wrong and the board either revises or
        refuses. It refuses more often than it agrees.
      </p>

      <div className="argue-input">
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="I disagree because…"
          aria-label="Argue with the counterfactual"
        />
        <button type="button" onClick={() => submit()} disabled={text.trim().length < 4}>
          Push back
        </button>
      </div>

      <div className="argue-openers">
        {OPENERS.map((o) => (
          <button key={o} type="button" className="argue-opener" onClick={() => submit(o)}>
            {o}
          </button>
        ))}
      </div>

      {objections.length > 0 && (
        <ol className="argue-thread">
          {objections.map((o, i) => (
            <li
              key={`${i}-${o.text}`}
              className={
                !o.rebuttal ? "argue-turn unread" : `argue-turn ${o.rebuttal.verdict}`
              }
            >
              <blockquote className="argue-said">{o.text}</blockquote>
              {o.rebuttal ? (
                <>
                  <p className="argue-read">
                    <span className="argue-verdict">
                      {o.rebuttal.verdict === "revised" ? "Revised" : "Held"}
                    </span>
                    Read as: {o.rebuttal.label}
                  </p>
                  <p className="argue-response">{o.rebuttal.response}</p>
                  {o.rebuttal.adjust && (
                    <p className="argue-did">
                      {whatItDid(o.rebuttal, intervention.from + lagBefore[i])}. Every chart above
                      redrew.
                    </p>
                  )}
                </>
              ) : (
                <p className="argue-response">
                  Nothing here matched that, and rather than guess at what you meant it does
                  nothing. Matching is keyword based until a model sits behind it, so it catches
                  the shape of an objection and not its substance. The ones it does understand are
                  the five above.
                </p>
              )}
            </li>
          ))}
        </ol>
      )}

      {objections.length > 0 && (
        <p className="argue-foot">
          {anyTook
            ? "The charts now show your version of the intervention rather than the authored one."
            : "Nothing you have said so far moves them."}
          <button type="button" className="argue-undo" onClick={onUndo}>
            Take back the last one
          </button>
        </p>
      )}

      <div className="argue-standard">
        <p className="argue-standard-label">The strongest objection I know of, unprompted</p>
        <blockquote className="argue-claim">{intervention.objection.claim}</blockquote>
        <p className="argue-response">{intervention.objection.response}</p>
      </div>

      <p className="argue-note">
        Every response here is written by hand and matched on keywords. That's the honest stand-in
        for the model that will do it later, which will emit the same kind of adjustment over the
        same typed effects. It can scale an effect or delay it. It can't flip one, and it can never
        write a number into the data.
      </p>
    </div>
  );
}
