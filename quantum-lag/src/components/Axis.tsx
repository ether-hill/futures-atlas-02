"use client";

import { useCallback, useRef, useState } from "react";

import {
  AXIS_MAX,
  AXIS_MIN,
  FULL_SPAN,
  NOW_YEAR,
  clampYear,
  fractionToYear,
  ticksFor,
  yearToPercent,
} from "@/lib/axis";

type Props = {
  /** The committed placement, or null. There is no default position: an empty
      axis on load is the point, since a default marker anchors every response. */
  value: number | null;
  onChange: (year: number) => void;
  /** Enter commits the claim, but only when a marker exists. */
  onCommit: () => void;
  disabled?: boolean;
};

const HOVER_HINT = "ghost, follows the cursor";

export function Axis({ value, onChange, onCommit, disabled = false }: Props) {
  /*
    The scale is fixed at 1900–2060 and there is no zoom.

    Zoom used to live here, per the original spec, but it works against the
    thing that matters more: the reveal draws on this same scale so the pin can
    slide from where it was placed to the record. Rescale the line while placing
    and that continuity is gone. Exactness comes from the year stepper instead,
    which is the precision the zoom was really for.
  */
  const span = FULL_SPAN;
  const [ghost, setGhost] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);

  const ref = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, number>());

  const yearAt = useCallback(
    (clientX: number): number => {
      const el = ref.current;
      if (!el) return span[0];
      const rect = el.getBoundingClientRect();
      const fraction = (clientX - rect.left) / rect.width;
      return clampYear(fractionToYear(fraction, span), span);
    },
    [span],
  );

  // ---- pointer ------------------------------------------------------------

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    pointers.current.set(e.pointerId, e.clientX);


    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    // Touch commits the marker at the point of contact; drag then adjusts it.
    onChange(yearAt(e.clientX));
    // Focus without scrolling: yanking the page on pointer-down is what made
    // the timeline appear to jump between placing a claim and revealing it.
    ref.current?.focus({ preventScroll: true });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;

    if (pointers.current.has(e.pointerId)) {
      pointers.current.set(e.pointerId, e.clientX);
    }


    if (dragging) {
      onChange(yearAt(e.clientX));
      return;
    }

    // Hover: a ghost that follows the cursor and commits to nothing.
    if (e.pointerType === "mouse") setGhost(yearAt(e.clientX));
  };

  const endPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 0) setDragging(false);
  };


  // ---- keyboard -----------------------------------------------------------

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;

    if (e.key === "Enter") {
      if (value !== null) {
        e.preventDefault();
        onCommit();
      }
      return;
    }

    const step = e.shiftKey ? 1 : 5;
    let delta = 0;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") delta = step;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") delta = -step;
    if (e.key === "PageUp") delta = 20;
    if (e.key === "PageDown") delta = -20;

    if (delta !== 0) {
      e.preventDefault();
      if (value === null) {
        // The first arrow key puts a marker at the centre of the current view.
        onChange(Math.round((span[0] + span[1]) / 2));
      } else {
        onChange(clampYear(value + delta));
      }
      return;
    }

    if (e.key === "Home") {
      e.preventDefault();
      onChange(AXIS_MIN);
    }
    if (e.key === "End") {
      e.preventDefault();
      onChange(AXIS_MAX);
    }
  };

  // ---- geometry -----------------------------------------------------------

  const ticks = ticksFor(span);
  const nowPct = yearToPercent(NOW_YEAR, span);
  const nowVisible = NOW_YEAR >= span[0] && NOW_YEAR <= span[1];
  const pastWidth = Math.max(0, Math.min(100, nowPct));

  const showGhost = ghost !== null && value === null && !dragging;
  const marker = value !== null ? value : showGhost ? ghost : null;
  const markerPct = marker !== null ? yearToPercent(marker, span) : 0;

  return (
    <div>
      <div
        ref={ref}
        className="ql-axis"
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label="Place this claim on the timeline"
        aria-valuemin={AXIS_MIN}
        aria-valuemax={AXIS_MAX}
        aria-valuenow={value ?? undefined}
        aria-valuetext={
          value === null ? "No year placed yet" : `The year ${value}`
        }
        aria-disabled={disabled || undefined}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onPointerLeave={(e) => {
          endPointer(e);
          setGhost(null);
        }}
        onKeyDown={handleKeyDown}
      >
        <div className="ql-axis__rule" />
        <div className="ql-axis__past" style={{ width: `${pastWidth}%` }} />

        {ticks.map((year) => (
          <span key={year}>
            <span
              className="ql-axis__tick"
              style={{ left: `${yearToPercent(year, span)}%` }}
            />
            <span
              className="ql-axis__tick-label"
              style={{ left: `${yearToPercent(year, span)}%` }}
            >
              {year}
            </span>
          </span>
        ))}

        {nowVisible && (
          <>
            <span className="ql-axis__now" style={{ left: `${nowPct}%` }} />
            <span className="ql-axis__now-label" style={{ left: `${nowPct}%` }}>
              Now
            </span>
          </>
        )}

        {marker !== null && (
          <>
            <span
              className={`ql-axis__marker ${
                value !== null
                  ? "ql-axis__marker--placed"
                  : "ql-axis__marker--ghost ql-drift"
              }`}
              style={{ left: `${markerPct}%` }}
            />
            <span
              className={`ql-axis__readout ${
                value === null ? "ql-axis__readout--ghost" : ""
              }`}
              style={{ left: `${markerPct}%` }}
            >
              {marker}
            </span>
            {value === null && (
              <span
                className="ql-axis__caption"
                style={{ left: `${markerPct}%` }}
              >
                {HOVER_HINT}
              </span>
            )}
          </>
        )}
      </div>

      <div className="ql-axis-controls">
        <div className="ql-stepper">
          <span className="ql-stepper__label">Year</span>
          <button
            type="button"
            className="ql-step-btn"
            aria-label="One year earlier"
            disabled={disabled || value === null || value <= AXIS_MIN}
            onClick={() => value !== null && onChange(clampYear(value - 1))}
          >
            −
          </button>
          <span
            className={`ql-stepper__value ${
              value === null ? "ql-stepper__value--muted" : ""
            }`}
          >
            {value ?? "––"}
          </span>
          <button
            type="button"
            className="ql-step-btn"
            aria-label="One year later"
            disabled={disabled || value === null || value >= AXIS_MAX}
            onClick={() => value !== null && onChange(clampYear(value + 1))}
          >
            +
          </button>
        </div>

      </div>
    </div>
  );
}
