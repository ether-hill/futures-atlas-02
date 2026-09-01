"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * The store's one modal: a veil, a panel, Escape and a focused Close. Both
 * the product quickview and the "Create a product" configurator open in it,
 * so they share one set of chrome and one set of manners (body scroll
 * locked, focus moved in, Escape and the veil close).
 */
export function Lightbox({
  label,
  onClose,
  wide = false,
  children,
}: {
  label: string;
  onClose: () => void;
  /** the configurator wants more room than a listing */
  wide?: boolean;
  children: ReactNode;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-pointer bg-ink/60"
      />
      <div
        className={`relative max-h-[88vh] w-full overflow-y-auto rounded-[20px] bg-surface shadow-2xl shadow-ink/20 ${
          wide ? "max-w-5xl" : "max-w-4xl"
        }`}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 cursor-pointer rounded-full bg-panel px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink shadow-sm shadow-ink/10 hover:bg-ink hover:text-surface"
        >
          Close ✕
        </button>
        {children}
      </div>
    </div>
  );
}
