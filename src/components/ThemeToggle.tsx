"use client";

import { useEffect, useState } from "react";

/**
 * Light/dark toggle. The actual class is set pre-paint by the inline script in
 * layout.tsx (no flash); this only reflects + flips it, and persists the choice.
 */
export function ThemeToggle({ overlay = false }: { overlay?: boolean }) {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  };

  // tone the control to its surroundings (light text over the hero, ink elsewhere)
  const ring = overlay
    ? "border-paper/40 text-paper hover:border-paper hover:bg-paper/10"
    : "border-ink/25 text-ink hover:border-ink/50 hover:bg-ink/[0.04]";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={mounted ? `Switch to ${dark ? "light" : "dark"} mode` : "Toggle theme"}
      title={mounted ? `Switch to ${dark ? "light" : "dark"} mode` : "Toggle theme"}
      className={`flex h-[38px] w-[38px] items-center justify-center rounded-full border transition-colors ${ring}`}
    >
      {/* sun when dark (click → light), moon when light (click → dark) */}
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden suppressHydrationWarning>
        {mounted && dark ? (
          <>
            <circle cx="10" cy="10" r="3.6" stroke="currentColor" strokeWidth="1.5" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
              <line
                key={a}
                x1="10"
                y1="2.2"
                x2="10"
                y2="4.2"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                transform={`rotate(${a} 10 10)`}
              />
            ))}
          </>
        ) : (
          <path
            d="M16 11.2A6.2 6.2 0 1 1 8.8 4a4.8 4.8 0 0 0 7.2 7.2Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </button>
  );
}
