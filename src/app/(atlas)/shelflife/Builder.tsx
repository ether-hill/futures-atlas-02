"use client";

import { useMemo, useState } from "react";
import {
  AISLES,
  FORCES,
  SHOTS,
  YEARS,
  buildImagePrompt,
  buildListingPrompt,
  type ShelfLifeOption,
} from "@/data/shelflife";

/**
 * The guided prompt builder. Entirely client-side and deterministic: the
 * controls assemble the two prompts from @/data/shelflife, the visitor
 * copies them into their own tools. No API call, nothing stored.
 */

const chipBase =
  "border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors cursor-pointer";
const chipOff = "border-ink/25 text-ink-70 hover:border-ink/60";
const chipOn = "border-ink bg-ink text-surface";

function ChipRow<T extends string>({
  label,
  options,
  value,
  onPick,
}: {
  label: string;
  options: readonly { id: T; label: string }[];
  value: T;
  onPick: (id: T) => void;
}) {
  return (
    <div>
      <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-graphite">
        {label}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            aria-pressed={o.id === value}
            onClick={() => onPick(o.id)}
            className={`${chipBase} ${o.id === value ? chipOn : chipOff}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function PromptPanel({ title, hint, text }: { title: string; hint: string; text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable (permissions, http) — the text stays selectable */
    }
  };
  return (
    <div className="flex flex-col border border-ink/20">
      <div className="flex items-center justify-between gap-4 border-b border-ink/15 px-4 py-3">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink">
            {title}
          </div>
          <div className="mt-0.5 font-mono text-[10px] tracking-[0.06em] text-faint">
            {hint}
          </div>
        </div>
        <button
          type="button"
          onClick={copy}
          className={`${chipBase} shrink-0 ${copied ? chipOn : chipOff}`}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="grow whitespace-pre-wrap px-4 py-4 font-mono text-[12px] leading-[1.75] text-ink-70">
        {text}
      </pre>
    </div>
  );
}

const byId = (opts: ShelfLifeOption[], id: string) =>
  opts.find((o) => o.id === id) ?? opts[0];

export function Builder() {
  const [aisleId, setAisleId] = useState(AISLES[0].id);
  const [year, setYear] = useState<string>(YEARS[1]);
  const [forceId, setForceId] = useState(FORCES[0].id);
  const [shotId, setShotId] = useState(SHOTS[0].id);
  const [seed, setSeed] = useState("");

  const input = useMemo(
    () => ({
      aisle: byId(AISLES, aisleId),
      year,
      force: byId(FORCES, forceId),
      shot: byId(SHOTS, shotId),
      seed: seed.trim().slice(0, 200),
    }),
    [aisleId, year, forceId, shotId, seed],
  );

  return (
    <div>
      <div className="grid gap-7">
        <ChipRow label="01 · The aisle" options={AISLES} value={aisleId} onPick={setAisleId} />
        <ChipRow
          label="02 · The year"
          options={YEARS.map((y) => ({ id: y, label: y }))}
          value={year}
          onPick={setYear}
        />
        <ChipRow
          label="03 · What changed"
          options={FORCES}
          value={forceId}
          onPick={setForceId}
        />
        <ChipRow label="04 · The shot" options={SHOTS} value={shotId} onPick={setShotId} />
        <div>
          <label
            htmlFor="fs-seed"
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-graphite"
          >
            05 · Your hunch <span className="normal-case tracking-normal text-faint">(optional)</span>
          </label>
          <textarea
            id="fs-seed"
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            maxLength={200}
            rows={2}
            placeholder="e.g. a hearing aid that translates as you listen — or leave blank and let the model invent one"
            className="mt-2.5 w-full resize-none border border-ink/25 bg-transparent px-3.5 py-3 font-mono text-[13px] leading-[1.6] text-ink placeholder:text-faint focus:border-ink focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        <PromptPanel
          title="The listing prompt"
          hint="paste into ChatGPT, Claude, …"
          text={buildListingPrompt(input)}
        />
        <PromptPanel
          title="The photo prompt"
          hint="paste into Midjourney, DALL-E, … (add your tool's flags, e.g. --ar 1:1)"
          text={buildImagePrompt(input)}
        />
      </div>
    </div>
  );
}
