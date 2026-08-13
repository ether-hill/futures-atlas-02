import test from "node:test";
import assert from "node:assert/strict";

import { scoreClaim, summarise, median } from "../src/lib/scoring.ts";
import { NOW_YEAR, revealWindow, zoomSpan, MIN_ZOOM_SPAN } from "../src/lib/axis.ts";
import type { Claim } from "../src/content/types.ts";

const happened = (year: number): Claim => ({
  id: `h${year}`,
  act: 1,
  claim: "x",
  short: "x",
  status: { kind: "happened", year },
  hook: "x",
  story: [{ kind: "text", text: "x" }],
  sources: [{ text: "x" }],
});

const expected = (range: [number, number] | null): Claim => ({
  id: `e${range ? range.join("-") : "null"}`,
  act: 1,
  claim: "x",
  short: "x",
  status: { kind: "expected", range },
  hook: "x",
  story: [{ kind: "text", text: "x" }],
  sources: [{ text: "x" }],
});

test("a date within five years is correct in either direction", () => {
  assert.equal(scoreClaim(happened(1967), 1972).direction, "correct");
  assert.equal(scoreClaim(happened(1967), 1962).direction, "correct");
  assert.equal(scoreClaim(happened(1967), 1973).direction, "lag");
  assert.equal(scoreClaim(happened(1967), 1961).direction, "leap");
});

test("displacement is signed placed minus actual", () => {
  assert.equal(scoreClaim(happened(2019), 2033).displacement, 14);
  assert.equal(scoreClaim(happened(2019), 2005).displacement, -14);
});

test("inside an expert range is correct, outside carries a direction", () => {
  const claim = expected([2035, 2050]);
  assert.equal(scoreClaim(claim, 2038).insideRange, true);
  assert.equal(scoreClaim(claim, 2038).direction, "correct");
  assert.equal(scoreClaim(claim, 2030).direction, "leap");
  assert.equal(scoreClaim(claim, 2055).direction, "lag");
  // Never reported as displacement against a date that does not exist.
  assert.equal(scoreClaim(claim, 2055).displacement, null);
});

test("placing an unfinished claim at or before now is the strongest leap", () => {
  const claim = expected([2035, 2050]);
  const v = scoreClaim(claim, NOW_YEAR);
  assert.equal(v.claimedDone, true);
  assert.equal(v.direction, "leap");
});

test("a claim with no credible date is never scored against a date", () => {
  const claim = expected(null);
  const future = scoreClaim(claim, 2040);
  assert.equal(future.direction, "correct");
  assert.equal(future.displacement, null);
  assert.equal(future.outsideBy, null);

  const past = scoreClaim(claim, 2010);
  assert.equal(past.direction, "leap");
  assert.equal(past.claimedDone, true);
});

test("the headline uses the median, not the mean", () => {
  assert.equal(median([1, 2, 3, 4, 100]), 3);
});

test("summary separates finished from unfinished", () => {
  const claims = [happened(1967), happened(2019), expected([2035, 2050])];
  const s = summarise(claims, {
    [claims[0]!.id]: 2035,
    [claims[1]!.id]: 2033,
    [claims[2]!.id]: 2010,
  });
  assert.equal(s.finishedTotal, 2);
  assert.equal(s.finishedInFuture, 2);
  assert.equal(s.unfinishedTotal, 1);
  assert.equal(s.unfinishedClaimedDone, 1);
  assert.equal(s.medianDisplacement, 41); // median of [68, 14] rounds from 41
});

test("the reveal window contains every point of interest", () => {
  const claim = expected([2035, 2050]);
  const [lo, hi] = revealWindow(claim, 1955);
  assert.ok(lo <= 1955, `window starts at ${lo}`);
  assert.ok(hi >= 2050, `window ends at ${hi}`);
});

test("zoom never leaves the axis and never goes below the floor", () => {
  const tight = zoomSpan([1900, 2060], 2060, 0.01);
  assert.equal(tight[1] - tight[0], MIN_ZOOM_SPAN);
  assert.ok(tight[1] <= 2060);
  const wide = zoomSpan([2000, 2010], 2005, 100);
  assert.deepEqual(wide, [1900, 2060]);
});

test("generated verdicts hold the house style: no em dashes", () => {
  const cases: [Claim, number][] = [
    [happened(1967), 2001],
    [happened(1967), 1930],
    [happened(1967), 1969],
    [expected([2035, 2050]), 2038],
    [expected([2035, 2050]), 2020],
    [expected([2035, 2050]), 2058],
    [expected(null), 2040],
    [expected(null), 2010],
  ];
  for (const [claim, placed] of cases) {
    const v = scoreClaim(claim, placed);
    assert.ok(!v.sentence.includes("—"), `em dash in: ${v.sentence}`); // slop-allow
  }
});
