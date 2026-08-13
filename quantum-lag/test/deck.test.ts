import test from "node:test";
import assert from "node:assert/strict";

import { ACTS, DECK } from "../src/content/deck.ts";
import { storyText } from "../src/content/types.ts";
import type { Claim } from "../src/content/types.ts";

/*
  build-spec §3: rules enforced by a test, not by discipline.
*/

test("the deck is twenty claims, four acts of five", () => {
  assert.equal(DECK.length, 20);
  for (const { act } of ACTS) {
    assert.equal(
      DECK.filter((c) => c.act === act).length,
      5,
      `act ${act} is not five claims`,
    );
  }
});

test("claim ids are unique", () => {
  const ids = DECK.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("every claim has a hook, a story and at least one source", () => {
  for (const claim of DECK) {
    assert.ok(claim.hook.length > 20, `${claim.id} has no hook`);
    assert.ok(claim.sources.length > 0, `${claim.id} renders no source`);
    const paragraphs = claim.story.filter((b) => b.kind === "text");
    assert.ok(
      paragraphs.length >= 3,
      `${claim.id} has only ${paragraphs.length} paragraphs`,
    );
  }
});

test("every claim carries at least one figure", () => {
  for (const claim of DECK) {
    const figures = claim.story.filter((b) => b.kind === "visual");
    assert.ok(figures.length >= 1, `${claim.id} has no figure`);
  }
});

test("no story opens on a figure", () => {
  // A figure answers the sentence above it, so it can never come first.
  // Closing on one is allowed: the superconductivity card ends on the
  // temperature comparison deliberately, and that is the payoff.
  for (const claim of DECK) {
    assert.equal(claim.story[0]?.kind, "text", `${claim.id} opens on a figure`);
  }
});

test("every source link is an absolute https URL", () => {
  for (const claim of DECK) {
    for (const source of claim.sources) {
      if (!source.url) continue;
      assert.match(
        source.url,
        /^https:\/\//,
        `${claim.id}: "${source.text}" -> ${source.url}`,
      );
    }
  }
});

test("every image carries a credit, a licence and a file page", () => {
  for (const claim of DECK) {
    const image = claim.image;
    if (!image) continue;
    assert.ok(image.src.startsWith("/evidence/"), `${claim.id} image src`);
    assert.ok(image.alt.length > 20, `${claim.id} needs real alt text`);
    assert.ok(image.credit.length > 0, `${claim.id} image has no credit`);
    assert.ok(image.licence.length > 0, `${claim.id} image has no licence`);
    assert.match(
      image.sourceUrl,
      /^https:\/\//,
      `${claim.id} image has no file page to check the licence against`,
    );
    assert.ok(image.width > 0 && image.height > 0, `${claim.id} image has no size`);
  }
});

test("the house style holds: no em dashes in the prose", () => {
  for (const claim of DECK) {
    const prose = [claim.claim, claim.hook, storyText(claim)].join(" ");
    assert.ok(!prose.includes("—"), `${claim.id} contains an em dash`); // slop-allow
  }
});

test("the prose avoids the not-X-but-Y construction", () => {
  // The shape reads as a slogan and it is one of the most flagged AI tells.
  // "X because A, not because B" was the requirement-falling hook until it went.
  const shapes = [
    /,\s*not (?:because|about|just|only)\b/i,
    /\bit'?s not just\b/i,
    /\bnot just [^.]{0,40}\bbut\b/i,
  ];
  for (const claim of DECK) {
    const prose = [claim.claim, claim.hook, storyText(claim)].join(" ");
    for (const shape of shapes) {
      assert.ok(!shape.test(prose), `${claim.id} uses a not-X-but-Y shape`);
    }
  }
});

test("no claim refers to its own place in the running order", () => {
  // Research mode draws a subset, so "the next card" and "the previous four
  // cards" can simply be false by the time a reader gets there.
  const meta = /\b(the next card|previous \w+ cards?|the last claim|in the deck)\b/i;
  for (const claim of DECK) {
    const prose = [claim.hook, storyText(claim)].join(" ");
    const hit = prose.match(meta);
    assert.equal(hit, null, `${claim.id} refers to the running order: "${hit?.[0]}"`);
  }
});

test("no reasoning prompt contains a four digit year", () => {
  for (const claim of DECK) {
    if (!claim.prompt) continue;
    assert.ok(
      !/\b(1[89]|20)\d{2}\b/.test(claim.prompt),
      `${claim.id} prompt states a year: ${claim.prompt}`,
    );
  }
});

test("no expected claim has an invented range", () => {
  for (const claim of DECK) {
    if (claim.status.kind !== "expected") continue;
    const { range } = claim.status;
    if (range === null) continue;
    assert.ok(range[0] < range[1], `${claim.id} range is not ordered`);
  }
});

test("every act contains at least one expected claim", () => {
  for (const { act } of ACTS) {
    const inAct = DECK.filter((c) => c.act === act);
    assert.ok(
      inAct.some((c) => c.status.kind === "expected"),
      `act ${act} has no unfinished claim`,
    );
  }
});

/*
  The next two assertions describe build-spec rules the deck does not yet
  satisfy. They are marked todo rather than deleted or weakened: the fix is a
  content decision, not a code change, and a silently relaxed test would hide it.
*/

test(
  "every act contains a recorded claim dated before 2010",
  {
    todo:
      "Act 4 'The deadline' has no recorded claim before 2010; its earliest " +
      "is 2019. Needs an early claim moved in, or the rule relaxed for an act " +
      "that is about the present by design.",
  },
  () => {
    const failures: string[] = [];
    for (const { act, title } of ACTS) {
      const inAct = DECK.filter((c) => c.act === act);
      const dated = inAct.filter((c) => c.status.kind !== "expected");
      const early = dated.filter(
        (c) => (c.status as { year: number }).year < 2010,
      );
      if (early.length === 0) {
        failures.push(
          `act ${act} (${title}): earliest recorded claim is ` +
            Math.min(...dated.map((c) => (c.status as { year: number }).year)),
        );
      }
    }
    assert.deepEqual(failures, []);
  },
);

test(
  "dates inside an act are not in chronological order",
  {
    todo:
      "Act 4 runs its recorded claims oldest to newest. Acts 1 to 3 break the " +
      "pattern. build-spec §14: three cards in, the player learns the order and " +
      "the instrument stops measuring anything.",
  },
  () => {
    for (const { act } of ACTS) {
      const dated = DECK.filter(
        (c): c is Claim & { status: { year: number } } =>
          c.act === act && c.status.kind !== "expected",
      ).map((c) => c.status.year);
      const sorted = [...dated].sort((a, b) => a - b);
      assert.notDeepEqual(dated, sorted, `act ${act} runs in chronological order`);
    }
  },
);
