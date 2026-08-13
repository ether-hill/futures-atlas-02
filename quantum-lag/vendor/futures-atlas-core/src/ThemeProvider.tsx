"use client";

import { useEffect } from "react";
import { applyOverrides, fetchOverrides } from "./runtime";

/**
 * Client hydration of saved overrides. Optional belt-and-suspenders: the
 * recommended path is SSR-injecting the override <style> in the consumer's
 * layout (no flash). This re-applies on mount in case that isn't wired.
 */
export function ThemeProvider({ endpoint = "/api/tokens" }: { endpoint?: string }) {
  useEffect(() => {
    let alive = true;
    fetchOverrides(endpoint).then((o) => {
      if (alive) applyOverrides(o);
    });
    return () => {
      alive = false;
    };
  }, [endpoint]);
  return null;
}
