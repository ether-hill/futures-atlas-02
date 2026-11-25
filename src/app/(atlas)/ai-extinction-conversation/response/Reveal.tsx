"use client";

import { useEffect } from "react";

/**
 * Animates the Response page in: each card slides up as it reaches the screen,
 * its status pill and left rule arriving a beat later, and the four headline
 * figures count up from zero once. Pure enhancement: without script every card
 * is simply there.
 */
export function Reveal() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("rs-anim");
    const io = new IntersectionObserver(
      (es) => {
        for (const e of es)
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    const watch = () => document.querySelectorAll<HTMLElement>(".rs-card:not(.is-in), .rs-year h2:not(.is-in)").forEach((c) => io.observe(c));
    watch();
    // filters and sorting re-render the list: watch the new cards too
    const mo = new MutationObserver(watch);
    const list = document.querySelector(".rs-main");
    if (list) mo.observe(list, { childList: true, subtree: true });
    // contents: mark the section in view
    const onScroll = () => {
      const links = [...document.querySelectorAll<HTMLAnchorElement>(".rs-toc a")];
      const targets = links.map((a) => document.getElementById(a.hash.slice(1))).filter(Boolean) as HTMLElement[];
      const line = window.innerHeight * 0.3;
      let cur = targets[0];
      for (const el of targets) if (el.getBoundingClientRect().top <= line) cur = el;
      links.forEach((a) => a.parentElement?.classList.toggle("is-on", a.hash === `#${cur?.id}`));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    // count the headline figures up
    const nums = document.querySelectorAll<HTMLElement>(".rs-stats dd");
    nums.forEach((el) => {
      const target = parseInt(el.textContent ?? "", 10);
      if (!Number.isFinite(target)) return;
      const t0 = performance.now();
      const tick = (now: number) => {
        const k = Math.min(1, (now - t0) / 900);
        el.textContent = String(Math.round(target * (1 - Math.pow(1 - k, 3))));
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    return () => {
      io.disconnect();
      mo.disconnect();
      window.removeEventListener("scroll", onScroll);
      root.classList.remove("rs-anim");
    };
  }, []);
  return null;
}
