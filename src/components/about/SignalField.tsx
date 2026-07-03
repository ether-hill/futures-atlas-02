"use client";

import { useEffect, useRef } from "react";

/**
 * The About hero's signature: a field of drifting signal points where a few
 * periodically connect into brief constellations, hold, then dissolve — the
 * site's thesis as motion (most signals are noise; a few connect). Pointer
 * proximity gently attracts nearby points. Two-tone from the live site
 * palette; pauses when the tab is hidden; reduced-motion renders one static
 * frame. Decoration only: aria-hidden, pointer-events none.
 */

const N = 220;
const LINK_RADIUS = 130;
const MAX_CONSTELLATIONS = 5;

interface Pt {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}
interface Constellation {
  ids: number[];
  born: number;
  ttl: number;
}

export function SignalField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let raf = 0;
    let running = true;
    const pts: Pt[] = [];
    const constellations: Constellation[] = [];
    const mouse = { x: -9999, y: -9999 };

    const css = () => {
      const s = getComputedStyle(document.documentElement);
      return {
        ink: s.getPropertyValue("--text").trim() || "#211e18",
        accent: s.getPropertyValue("--accent").trim() || "#3a7abf",
      };
    };
    let colors = css();
    const mo = new MutationObserver(() => {
      colors = css();
      if (reduced) drawFrame(0);
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    function resize() {
      const parent = canvas!.parentElement!;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = parent.clientWidth;
      h = parent.clientHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();

    for (let i = 0; i < N; i++) {
      pts.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: Math.random() < 0.85 ? 1.5 : 2.4,
      });
    }

    let nextConstellation = 800;

    function spawnConstellation(now: number) {
      const seed = Math.floor(Math.random() * N);
      const near = pts
        .map((p, i) => ({ i, d: Math.hypot(p.x - pts[seed].x, p.y - pts[seed].y) }))
        .filter((x) => x.i !== seed && x.d < LINK_RADIUS * 1.6)
        .sort((a, b) => a.d - b.d)
        .slice(0, 3 + Math.floor(Math.random() * 3))
        .map((x) => x.i);
      if (near.length >= 2) {
        constellations.push({ ids: [seed, ...near], born: now, ttl: 2600 + Math.random() * 2200 });
      }
    }

    function drawFrame(now: number) {
      ctx!.clearRect(0, 0, w, h);
      // points
      for (const p of pts) {
        ctx!.globalAlpha = 0.55;
        ctx!.fillStyle = colors.ink;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fill();
      }
      // constellations
      for (const c of constellations) {
        const age = now - c.born;
        const a = age < 600 ? age / 600 : age > c.ttl - 700 ? Math.max(0, (c.ttl - age) / 700) : 1;
        ctx!.globalAlpha = a;
        ctx!.strokeStyle = colors.accent;
        ctx!.lineWidth = 1.5;
        ctx!.beginPath();
        for (let k = 0; k < c.ids.length - 1; k++) {
          const p1 = pts[c.ids[k]];
          const p2 = pts[c.ids[k + 1]];
          ctx!.moveTo(p1.x, p1.y);
          ctx!.lineTo(p2.x, p2.y);
        }
        ctx!.stroke();
        ctx!.globalAlpha = a * 0.9;
        ctx!.fillStyle = colors.accent;
        for (const id of c.ids) {
          const p = pts[id];
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, 2.6, 0, Math.PI * 2);
          ctx!.fill();
        }
      }
      ctx!.globalAlpha = 1;
    }

    function step(now: number) {
      if (!running) return;
      for (const p of pts) {
        // gentle pointer attraction
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 160 * 160 && d2 > 1) {
          const f = 0.012 / Math.sqrt(d2);
          p.vx += dx * f;
          p.vy += dy * f;
        }
        p.vx *= 0.995;
        p.vy *= 0.995;
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;
      }
      for (let i = constellations.length - 1; i >= 0; i--) {
        if (now - constellations[i].born > constellations[i].ttl) constellations.splice(i, 1);
      }
      if (now > nextConstellation && constellations.length < MAX_CONSTELLATIONS) {
        spawnConstellation(now);
        nextConstellation = now + 900 + Math.random() * 1500;
      }
      drawFrame(now);
      raf = requestAnimationFrame(step);
    }

    if (reduced) {
      // one static, readable frame: points + a single held constellation
      spawnConstellation(600);
      drawFrame(900);
    } else {
      raf = requestAnimationFrame(step);
    }

    const onMove = (e: PointerEvent) => {
      const rect = canvas!.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const onLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };
    const onVis = () => {
      running = document.visibilityState === "visible";
      if (running && !reduced) raf = requestAnimationFrame(step);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      running = false;
      mo.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0" />;
}
