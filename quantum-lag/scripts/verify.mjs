/*
  End-to-end checks against a running dev server, for the parts of build-spec's
  ship checklist that only a real browser can answer: the keyboard-only run, the
  reduced-motion end states, and resume-on-refresh.

  Playwright is not a dependency of this project. Point PLAYWRIGHT at an
  installation and start the dev server first:

    npm run dev
    PLAYWRIGHT=/path/to/playwright/index.mjs BASE=http://localhost:3000 \
      node scripts/verify.mjs
*/

const PLAYWRIGHT = process.env.PLAYWRIGHT;
if (!PLAYWRIGHT) {
  console.error("Set PLAYWRIGHT to a playwright entry point. See the header.");
  process.exit(2);
}
const { chromium } = await import(PLAYWRIGHT);

const BASE = process.env.BASE ?? "http://localhost:3000";
const OUT = process.env.OUT ?? "./.verify";
const results = [];
const check = (name, pass, detail = "") =>
  results.push(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? ": " + detail : ""}`);

/** Home -> opening question -> opening reveal -> act card -> first claim. */
async function toFirstClaim(page) {
  await page.getByRole("button", { name: "Test what you know" }).first().click();
  await page.waitForTimeout(250);
  const axis = page.getByRole("slider");
  const box = await axis.boundingBox();
  await page.mouse.click(box.x + box.width * 0.55, box.y + box.height * 0.6);
  await page.getByRole("button", { name: "Place it" }).click();
  await page.waitForTimeout(250);
  await page.getByRole("button", { name: "Begin the run" }).click();
  await page.waitForTimeout(250);
  const cont = page.getByRole("button", { name: "Continue" });
  if (await cont.count()) {
    await cont.click();
    await page.waitForTimeout(250);
  }
}

const browser = await chromium.launch({ channel: "chrome", headless: true });

try {
  // -------------------------------------------------------------- pointer run
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    page.on("pageerror", (e) => check("no page errors", false, e.message));
    await page.goto(BASE, { waitUntil: "networkidle" });
    await toFirstClaim(page);

    check("act card shown before the first claim of an act",
      await page.locator(".ql-question").isVisible());

    const axis = page.getByRole("slider");
    check("axis empty on every claim, not just the first",
      (await axis.getAttribute("aria-valuenow")) === null,
      `aria-valuetext="${await axis.getAttribute("aria-valuetext")}"`);

    const placeBtn = page.getByRole("button", { name: "Place it" });
    check("continue disabled before a placement", await placeBtn.isDisabled());

    const box = await axis.boundingBox();
    await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.6);
    await page.waitForTimeout(120);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.75, box.y + box.height * 0.6, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(150);

    const committed = await axis.getAttribute("aria-valuenow");
    check("drag commits a marker", committed !== null, `aria-valuenow=${committed}`);
    check("continue enabled after a placement", await placeBtn.isEnabled());

    // The year stepper is the precision control; there is no zoom to test.
    const stepper = page.locator(".ql-stepper__value").first();
    check("the year stepper reads the placement",
      (await stepper.textContent())?.trim() === committed, await stepper.textContent());

    await placeBtn.click();
    await page.waitForTimeout(1400);
    check("commit shows the reveal", await page.locator(".ql-chart").isVisible());

    const live = await page.evaluate(
      () => document.querySelector("[aria-live]")?.textContent ?? "",
    );
    check("verdict announced in a live region", live.length > 10, live.slice(0, 70));

    const beforeReload = await page.locator(".ql-verdict__sentence").textContent();
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(900);
    const afterReload = await page.locator(".ql-verdict__sentence").textContent();
    check("refresh mid run resumes", beforeReload === afterReload);

    // next claim, and the axis must be empty again
    await page.getByRole("button", { name: /Next claim/ }).click();
    await page.waitForTimeout(400);
    const nextAxis = page.getByRole("slider");
    check("next claim starts empty",
      (await nextAxis.getAttribute("aria-valuenow")) === null);

    await ctx.close();
  }

  // ------------------------------------------------------------ keyboard only
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(BASE, { waitUntil: "networkidle" });
    await toFirstClaim(page);

    let onSlider = false;
    for (let i = 0; i < 16 && !onSlider; i++) {
      await page.keyboard.press("Tab");
      onSlider = await page.evaluate(
        () => document.activeElement?.getAttribute("role") === "slider",
      );
    }
    check("slider reachable by keyboard alone", onSlider);

    await page.keyboard.press("ArrowRight");
    const first = await page.getByRole("slider").getAttribute("aria-valuenow");
    check("first arrow puts a marker at the centre of the view",
      first === "1980", `got ${first}`);

    await page.keyboard.press("ArrowRight");
    const stepped = await page.getByRole("slider").getAttribute("aria-valuenow");
    check("arrow steps five years",
      Number(stepped) - Number(first) === 5, `${first} -> ${stepped}`);

    await page.keyboard.down("Shift");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.up("Shift");
    const fine = await page.getByRole("slider").getAttribute("aria-valuenow");
    check("shift steps one year",
      Number(fine) - Number(stepped) === 1, `${stepped} -> ${fine}`);

    await page.keyboard.press("Enter");
    await page.waitForTimeout(1400);
    check("enter commits the claim", await page.locator(".ql-chart").isVisible());
    await page.screenshot({ path: `${OUT}/keyboard-reveal.png`, fullPage: true });
    await ctx.close();
  }

  // ------------------------------------------------------------ research run
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/study`, { waitUntil: "networkidle" });

    check("/ never offers the research version",
      (await page.getByRole("button", { name: "Take it as a study run" }).count()) === 1);

    await page.getByRole("button", { name: "Take it as a study run" }).first().click();
    await page.waitForTimeout(250);
    // through the opening question
    let box = await page.getByRole("slider").boundingBox();
    await page.mouse.click(box.x + box.width * 0.55, box.y + box.height * 0.6);
    await page.getByRole("button", { name: "Place it" }).click();
    await page.waitForTimeout(200);
    await page.getByRole("button", { name: "Begin the run" }).click();
    await page.waitForTimeout(300);

    check("research suppresses the act titles",
      (await page.locator(".ql-act__title").count()) === 0);

    // place two claims and confirm no answer has leaked
    for (let i = 0; i < 2; i++) {
      box = await page.getByRole("slider").boundingBox();
      await page.mouse.click(box.x + box.width * (0.5 + i * 0.1), box.y + box.height * 0.6);
      await page.getByRole("button", { name: "Place it" }).click();
      await page.waitForTimeout(300);
    }
    check("research shows no reveal until the last claim",
      (await page.locator(".ql-chart").count()) === 0);
    check("research keeps placing", await page.getByRole("slider").isVisible());
    await ctx.close();
  }

  // --------------------------------------------------------- reduced motion
  {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: "reduce",
    });
    const page = await ctx.newPage();
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.evaluate(
      ([k, v]) => window.localStorage.setItem(k, v),
      ["quantum-lag:run:v1", JSON.stringify({
        version: "1.0.0", deckVersion: "deck-final-2026-08-11", sessionId: "rm",
        mode: "guided", phase: "placing", order: ["rsa-broken"], index: 0,
        placements: { "rsa-broken": 2038 }, telemetry: {}, draft: null,
        revealed: ["rsa-broken"], actsShown: [], openingPlacement: null,
        claimStartedAt: 0, screen: "reveal",
      })],
    );
    await page.goto(BASE, { waitUntil: "networkidle" });
    // Sampled well before the 610ms law-marker delay would have elapsed.
    await page.waitForTimeout(120);

    const state = await page.evaluate(() => {
      const read = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const s = getComputedStyle(el);
        return { opacity: s.opacity, transform: s.transform, clip: s.clipPath };
      };
      return {
        law: read(".ql-law"),
        bracket: read(".ql-range"),
        pin: read(".ql-pin--arriving"),
        travel: read(".ql-pin-travel"),
        gap: read(".ql-gap"),
      };
    });

    const resolved = (m) =>
      Boolean(m) && Number(m.opacity) === 1 &&
      (m.transform === "none" || /matrix\(1, 0, 0, 1, 0, 0\)/.test(m.transform));

    check("reduced motion: law marker at its end state", resolved(state.law),
      JSON.stringify(state.law));
    check("reduced motion: the pin is at the record, not travelling",
      resolved(state.pin) && (state.travel?.transform === "none" ||
        /matrix\(1, 0, 0, 1, 0, 0\)/.test(state.travel?.transform ?? "")),
      JSON.stringify({ pin: state.pin?.opacity, travel: state.travel?.transform }));
    check("reduced motion: gap bar at full width", resolved(state.gap),
      JSON.stringify(state.gap));
    // The computed value keeps the keyframe's units, so inset(0px 0% 0px 0px)
    // is fully unclipped and has to count.
    const unclipped = (clip) =>
      clip === "none" || /^inset\(\s*(0(px|%)\s*){1,4}\)$/.test(clip ?? "");
    check("reduced motion: expert bracket unclipped",
      unclipped(state.bracket?.clip), state.bracket?.clip);
    await page.screenshot({ path: `${OUT}/reduced-motion-reveal.png`, fullPage: true });
    await ctx.close();
  }
} catch (e) {
  results.push(`ERROR  ${e.message.split("\n")[0]}`);
}

await browser.close();
console.log(results.join("\n"));
process.exit(results.some((r) => !r.startsWith("PASS")) ? 1 : 0);
