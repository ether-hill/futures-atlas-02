"use client";

import { useEffect } from "react";

/*
  One-shot reveals.

  These used to run on `animation-timeline: view()`, which was the wrong tool: a
  scroll-driven animation is scrubbed, so every paragraph slid up and down
  continuously as the page moved. It read as jitter because it was jitter. A
  reveal happens once.

  Three things keep it honest:

  - an intersection observer, which does the work;
  - a mutation observer, because everything after the first screen is rendered
    later and would otherwise never be watched at all;
  - a safety sweep, because a fast flick can carry an element from below the
    fold to above it between two observer computations, and a missed reveal
    means the text is simply invisible. Measured: eight of twenty blocks were
    lost that way before this existed, one of them 7000px above the fold.

  The sweep is an interval rather than a scroll listener: `overflow-x: clip` on
  the root makes scroll events unreliable here, and an interval does not care
  which element is doing the scrolling. It stops itself the moment nothing is
  left to reveal, so a settled page costs nothing.
*/

const SELECTOR = "[data-rise]:not([data-rise='seen'])";

export function Rise() {
  useEffect(() => {
    const reveal = (el: Element) => el.setAttribute("data-rise", "seen");
    const pending = () => document.querySelectorAll(SELECTOR);

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduced) {
      const markAll = () => pending().forEach(reveal);
      markAll();
      const mutations = new MutationObserver(markAll);
      mutations.observe(document.body, { childList: true, subtree: true });
      return () => mutations.disconnect();
    }

    const intersections = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // Either it has arrived, or it has already gone past the top.
          const passed = entry.boundingClientRect.top < 0;
          if (!entry.isIntersecting && !passed) continue;
          reveal(entry.target);
          intersections.unobserve(entry.target);
        }
      },
      { rootMargin: "120px 0px -8% 0px", threshold: 0.04 },
    );

    const watch = () => pending().forEach((el) => intersections.observe(el));

    // Anything at or above the fold has been seen, whatever the observer did.
    let timer: ReturnType<typeof setInterval>;
    const sweep = () => {
      const left = pending();
      if (left.length === 0) {
        clearInterval(timer);
        return;
      }
      for (const el of left) {
        if (el.getBoundingClientRect().top < window.innerHeight) reveal(el);
      }
    };

    watch();
    const mutations = new MutationObserver(() => {
      watch();
      // New content means new work, so the sweep starts again.
      clearInterval(timer);
      timer = setInterval(sweep, 250);
    });
    mutations.observe(document.body, { childList: true, subtree: true });
    timer = setInterval(sweep, 250);

    return () => {
      clearInterval(timer);
      intersections.disconnect();
      mutations.disconnect();
    };
  }, []);

  return null;
}
