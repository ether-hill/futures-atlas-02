"use client";

import { useEffect, useState } from "react";

/**
 * The resolved value of a token, read from the live document.
 *
 * Reading it rather than printing a literal is the whole point of the page: it
 * follows the theme, it follows any runtime override written by the control
 * panel, and it cannot go stale the way a hand-copied hex does. It renders
 * nothing on the server, where there is no computed style to read — the label
 * beside it already names the token, so nothing is lost before hydration.
 */
export function TokenValue({ token, inline = false }: { token: string; inline?: boolean }) {
  const [value, setValue] = useState<string | null>(null);

  useEffect(() => {
    const read = () =>
      setValue(getComputedStyle(document.documentElement).getPropertyValue(token).trim() || null);
    read();

    // the theme toggle swaps a class on <html>, and the panel can rewrite the
    // override stylesheet — both change what this token resolves to
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style"] });
    return () => mo.disconnect();
  }, [token]);

  if (!value) return null;

  return (
    <span
      className={`font-mono text-[10.5px] text-faint ${inline ? "" : "mt-1.5 block"}`}
      title={`${token}: ${value}`}
    >
      {value.length > 34 ? `${value.slice(0, 34)}…` : value}
    </span>
  );
}
