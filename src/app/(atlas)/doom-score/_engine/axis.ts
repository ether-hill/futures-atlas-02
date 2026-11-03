/**
 * Time → x. Sixty years do not fit on one linear axis when a third of the
 * rows are from the last three. The axis is piecewise linear: each span gets
 * a share of the width, so the sweep stays visually constant while the
 * calendar slows down as the playhead nears the present.
 */
export const START = Date.UTC(2009, 0, 1); // the year p(doom) is first written down
export const NOW = Date.now();

/** [calendar boundary, share of width up to that boundary] */
const BREAKS: [number, number][] = [
  [Date.UTC(2015, 0, 1), 0.14],
  [Date.UTC(2023, 0, 1), 0.46],
  [NOW, 1],
];

export function parseDate(d: string): number {
  // YYYY → July 1, YYYY-MM → the 15th, else as given.
  if (/^\d{4}$/.test(d)) return Date.UTC(+d, 6, 1);
  if (/^\d{4}-\d{2}$/.test(d)) return Date.UTC(+d.slice(0, 4), +d.slice(5) - 1, 15);
  return Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10));
}

/** 0..1 across the width. */
export function u(t: number): number {
  let t0 = START;
  let u0 = 0;
  for (const [t1, u1] of BREAKS) {
    if (t <= t1) return u0 + ((t - t0) / (t1 - t0)) * (u1 - u0);
    t0 = t1;
    u0 = u1;
  }
  return 1;
}

export function tFromU(uu: number): number {
  let t0 = START;
  let u0 = 0;
  for (const [t1, u1] of BREAKS) {
    if (uu <= u1) return t0 + ((uu - u0) / (u1 - u0)) * (t1 - t0);
    t0 = t1;
    u0 = u1;
  }
  return NOW;
}

/** Year ticks that will not crowd: every decade early on, every year late. */
export function yearTicks(): number[] {
  const out: number[] = [];
  for (let y = 2009; y < 2015; y += 2) out.push(Date.UTC(y, 0, 1));
  for (let y = 2015; y <= new Date().getUTCFullYear(); y++) out.push(Date.UTC(y, 0, 1));
  return out;
}
