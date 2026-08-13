"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  AXIS_MAX,
  AXIS_MIN,
  FULL_SPAN,
  MIN_ZOOM_SPAN,
  NOW_YEAR,
  type Span,
  clampYear,
  fractionToYear,
  ticksFor,
  yearToPercent,
  zoomSpan,
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
  const [span, setSpan] = useState<Span>(FULL_SPAN);
  const [ghost, setGhost] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);

  const ref = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, number>());
  const pinchStart = useRef<{ distance: number; span: Span } | null>(null);

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

    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinchStart.current = { distance: Math.abs(a! - b!), span };
      return;
    }

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

    if (pointers.current.size === 2 && pinchStart.current) {
      const [a, b] = [...pointers.current.values()];
      const distance = Math.abs(a! - b!);
      if (distance > 0) {
        const start = pinchStart.current;
        const anchor = value ?? Math.round((start.span[0] + start.span[1]) / 2);
        setSpan(zoomSpan(start.span, anchor, start.distance / distance));
      }
      return;
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
    if (pointers.current.size < 2) pinchStart.current = null;
    if (pointers.current.size === 0) setDragging(false);
  };

  // Wheel has to be a non-passive listener to stop the page scrolling under it.
  useEffect(() => {
    const el = ref.current;
    if (!el || disabled) return;

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 1) return;
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const under = clampYear(
        fractionToYear((e.clientX - rect.left) / rect.width, span),
        span,
      );
      // Magnify around the marker where there is one, otherwise the cursor.
      setSpan((current) =>
        zoomSpan(current, value ?? under, e.deltaY > 0 ? 1.15 : 0.87),
      );
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [span, value, disabled]);

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

  const inView = span[1] - span[0];
  const canZoomIn = inView > MIN_ZOOM_SPAN;
  const canZoomOut = inView < AXIS_MAX - AXIS_MIN;

  const zoom = (factor: number) =>
    setSpan((current) =>
      zoomSpan(current, value ?? Math.round((current[0] + current[1]) / 2), factor),
    );

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

        <div className="ql-stepper">
          <span className="ql-stepper__label">In view</span>
          <button
            type="button"
            className="ql-step-btn"
            aria-label="Show a wider span of years"
            disabled={disabled || !canZoomOut}
            onClick={() => zoom(1.6)}
          >
            −
          </button>
          <span className="ql-stepper__value">{inView} yrs</span>
          <button
            type="button"
            className="ql-step-btn"
            aria-label="Zoom in on fewer years"
            disabled={disabled || !canZoomIn}
            onClick={() => zoom(0.625)}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
