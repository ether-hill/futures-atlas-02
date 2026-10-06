# Training compute of notable AI models: method note

Piece #7 in the brief. Slug `training-compute`. Series: The AI landscape.

## Question

How fast has the compute used to train the largest AI models grown, and how sure can anyone be about the recent figures?

## Sources

1. **Epoch AI, "Data on Notable AI Models".** Epoch AI, 2026. File `notable_ai_models.csv` from https://epoch.ai/data/notable_ai_models.csv. Downloaded 5 Oct 2026; latest record dated 9 Sep 2026 (data vintage). Licence CC BY. Saved untouched: `raw/notable_ai_models.csv`. (`raw/all_ai_models.csv` downloaded the same day for reference, not used.)
2. **Epoch AI, AI models documentation.** https://epoch.ai/data/ai-models-documentation and its `/estimation`, `/records`, `/inclusion` pages, accessed 5 Oct 2026. Saved as `raw/documentation.html`, `raw/doc-estimation.html`, `raw/doc-records.html`, `raw/doc-inclusion.html`. Used for: the definition of a frontier model ("in the top 5 of training compute as of the time of their release"), the notability criteria, and the confidence intervals (estimation page, section "Estimating confidence": Confident ±3x, Likely ±10x, Speculative ±31x, stated as 90% confidence intervals).
3. **Sevilla, J. and Roldán, E. "Training compute of frontier AI models grows by 4-5x per year."** Epoch AI, 28 May 2024. https://epoch.ai/blog/training-compute-of-frontier-ai-models-grows-by-4-5x-per-year, accessed 5 Oct 2026. Saved as `raw/epoch-2024-growth-rates.html`. Figure quoted: frontier models, recent period (from about 2018 to May 2024), 4.2x per year, 90% CI 3.6x to 4.9x, bootstrap. (Same report: frontier 2010 to May 2024, 5.3x, 90% CI 4.9x to 5.7x; all notable models 4.1x, 90% CI 3.7x to 4.6x.)

Source class: established research institute with published methodology (brief §4, tier 3).

## Definitions

- **Training compute**: Epoch's estimate of total floating point operations used to train the model, column `Training compute (FLOP)`. No precision multiplier is applied (per Epoch).
- **Notable model**: meets at least one Epoch notability criterion (highly cited, large training cost, significant use, state of the art, historical significance).
- **Frontier model**: Epoch column `Frontier model` = True.
- **Confidence status**: Epoch column `Confidence`. It describes the most uncertain of compute, parameters and dataset size for that model.

## Transformations (`process.mjs`)

1. Keep rows with a non-empty `Training compute (FLOP)` and a confidence of Confident, Likely or Speculative. 540 of 1,078 notable rows. (No row with a compute value had any other status.)
2. Add `ci90_factor` from the confidence status (3, 10, 31) and `ci90_low_flop = value / factor`, `ci90_high_flop = value × factor`. These are Epoch's stated intervals applied to Epoch's values, not our estimate.
3. Add a decimal year from the publication date for plotting.

No values are rounded, filled, interpolated or edited. The page asserts the two counts quoted on slide 2 (27/24 and 17/5) and fails to render if the data no longer matches.

## What each slide shows

1. **Hook** (IG + X): all 478 models from 2010 on. Frontier models in blue with their 90% interval; the rest grey. Log scale, labelled. The growth rate is Epoch's published fit, quoted as text. We do not have Epoch's fitted intercept, so no trend line is drawn.
2. **Disclosure**: frontier models 2016 to 2026, one mark per model, shape by confidence (filled, ring, dotted ring; not colour). 2019 to 2022: 24 of 27 confident. 2023 to 9 Sep 2026: 5 of 17.
3. **Ranges**: the 17 frontier models since 2023 with point estimate and 90% interval, log scale. Speculative intervals span 31² ≈ 961x, just under three orders of magnitude.
4. **Sources and method.**

## Caveats

- The growth rate covers 2018 to May 2024. The chart runs to Sep 2026; the headline relies on Epoch's fit, not on the newer points.
- The 90% intervals are Epoch's category-level bounds, not per-model error bars computed from that model's inputs.
- Small numbers on slide 2: 27 and 17 models. Confidence statuses can change as labs disclose more; 2026 is a partial year.
- Epoch lists GPT-4 twice (Mar 2023 and Jun 2023 versions, same compute). Both are frontier rows in Epoch's data and both are counted and shown.
- The interpretation that the drop in confident estimates reflects less disclosure follows Epoch's own rule (confident = details directly reported or estimable without assumptions). The chart shows Epoch's ratings, not lab behaviour directly, and the slide copy only states the counts.
- Recent rows (e.g. "GPT-6 Astra", Sep 2026, Likely) are as Epoch records them on 5 Oct 2026 and may be revised.

## What the chart does not show

Capability, cost, energy or emissions. Models without a public compute estimate (538 notable rows have none). Inference compute. Fine-tuning compute separately.

## Changes after review (2026-10-05)

- `process.mjs` also writes `clean-frontier.csv`: all 124 frontier records, including 10 (2023 to 2025) with no compute estimate, marked "No estimate". Slide 2 shows them; counts are now 2019-2022 24 of 27 confident, 2023-2026 5 of 27 confident and 10 with no estimate (asserted in the page).
- Headline scoped to the fit period: "grew about 4x a year from 2018 to 2024". The fit is described as the running top 10 by compute (Sevilla & Roldán's frontier definition), not the top-5 blue dots.
- Slide 2 note says marks are Epoch frontier records and that GPT-4 has two.
- Text sizes raised across the template (CSS class sizes were overriding the SVG font-size attributes).

## Review

- **Date:** 2026-10-05
- **Reviewer:** independent review agent
- **Verdict:** PASS WITH FIXES

**What I checked.** I re-ran `node data/training-compute/process.mjs` and `clean.csv` came out byte-identical (540 rows, 114 frontier, 478 from 2010 on). I looked up these values in `raw/notable_ai_models.csv` and every one matches clean.csv and the graphics: AlexNet 4.7e17 (Confident), GPT-3 3.14e23 (Confident), PaLM 2.5272e24 (Confident), GPT-4 Mar and Jun 2023 both 2.1e25 (Likely), Claude 2 3.866e24 (Speculative), Falcon-180B 3.76e24 (Confident), Gemini 1.0 Ultra 5e25 (Speculative), Llama 3.1-405B 3.8e25 (Confident), Grok 4 5e26 (Speculative), GPT-6 Astra 1.0001e27 (Likely). I counted the slide 2 marks by hand off the PNG: 2019 to 2022 is 24 of 27 confident and 2023 onwards is 5 of 17, which matches the copy and the `load()` assertion. The ±3x, ±10x and ±31x 90% intervals match `raw/doc-estimation.html` word for word. 4.2x (90% CI 3.6x to 4.9x) after 2018 matches `raw/epoch-2024-growth-rates.html`. The "top 5 at release" definition matches `raw/documentation.html` and `raw/doc-records.html`. There are no em dashes in the on-graphic copy or in copy/training-compute.md, and the caption is 117 words.

**Findings**

1. **should-fix.** Location: slide `hook` (IG and X), in-chart note, plus headline and caption. **Two different definitions of "frontier".** The blue dots are Epoch's `Frontier model` column, which means top 5 by compute at release (doc-records.html). The 4.2x fit in the note beside them is Sevilla and Roldán's fit for "models that were in the top 10 of training compute when they were released" (epoch-2024-growth-rates.html: "We now focus on models that were in the top 10 ... which we will refer to as frontier models"). The note "Epoch AI's fit for frontier models" sits next to the blue top-5 dots, so readers will take it as a fit to those dots. That breaks the like-for-like rule in brief §5. The fit also leaves out AlphaGo Master and AlphaGo Zero (same page, Figure 3), and AlphaGo Zero is labelled on our chart. Fix: change the note to "Epoch AI's fit for the top 10 models at release, 2018 to May 2024: 4.2x a year (90% CI 3.6x to 4.9x)" and add the same wording to the method slide and the METHOD source entry.
2. **should-fix.** Location: slide `hook` headline (IG and X), copy headline. **Present tense goes beyond the fit window.** "The biggest AI training runs use about four times more compute every year" describes now, but the fit only covers 2018 to May 2024, on the dataset as it stood in May 2024. The chart runs to Sep 2026 and nothing on it tests whether the rate still holds. METHOD's own caveat says the headline relies on Epoch's fit and not on the newer points. Fix: use past tense with dates, e.g. "Compute for the biggest AI training runs grew about 4x a year, 2018 to 2024", or keep the present tense and add "(Epoch AI estimate, 2018 to 2024)" to the subhead.
3. **should-fix.** Location: slides `disclosure` and `ranges`, copy carousel 2 and 3, caption ("Since 2023 it's 5 of 17"), alt text. **Ten frontier models are silently left out.** Epoch flags ten frontier models from 2023 onwards that have no compute value: GPT-4 Turbo (Nov 2023, Apr 2024; Unknown), Gemini 1.5 Pro, Claude 3 Opus, GPT-4o (five versions) and GLM-4-Plus (Speculative). `process.mjs` drops them because the compute value is blank. So "Frontier models by year ... Since 2023, 5 of 17" is really 5 of 27 frontier models, or 5 of the 17 that have an estimate. The 2019 to 2022 window loses nothing, so the omission understates the slide's point. It is still wrong as a description of Epoch's frontier set, and METHOD does not mention it. Fix: either say "frontier models with a compute estimate" on both slides and in the caption, or show the ten as "no estimate" marks on slide 2 (this strengthens the headline). Note the count in METHOD under Transformations step 1 either way.
4. **should-fix.** Location: slide `disclosure` note "One mark per frontier model", slide `ranges`, and the 5 of 17 count. **GPT-4 is counted twice.** It appears twice (Mar and Jun 2023, same compute, both Likely), so 2023 has one model drawn as two marks. METHOD discloses this, but the graphic says "one mark per frontier model", which is not true. Fix: either drop the June row from the counts (giving 5 of 16) or change the note to "one mark per Epoch record; GPT-4 is listed twice (Mar and Jun 2023)".
5. **should-fix.** Location: all slides, design units in `templates/frame.css` and inline sizes. **Small text is illegible at phone size.** On a 1080px frame shown about 360px wide (one third scale), axis ticks (19px), log exponents (19 × 0.68 ≈ 13px), notes (18px), legend (17 to 19px), the slide 3 date column (18px) and the footer source line (19px) all render at about 4 to 6px, well under the ~11px floor. The log exponents carry the whole y-axis on slides 1 and 3 and are the worst at about 4px. Fix: raise every chart text in the IG format to at least 30 to 33px (exponents at least 24px). Thin out the ticks, for example every 10^4 on slide 1, so they fit.
6. **nit.** Location: slide `hook` IG. The "GPT-3" label sits on top of a frontier dot and its whisker near 2021.9 / 10^23. In the X cut the Llama 3.1-405B and GPT-4 leader lines cross about 15 points. Move the label off the data or shorten the leaders.
7. **nit.** Location: slide `hook` subhead, "Each dot is a notable AI model since 2010". Only the 478 notable models that have a compute estimate are drawn. Say "notable AI models with a compute estimate".
8. **nit.** Location: slide `ranges` subhead "Epoch AI's 90% range for each estimate". The interval is Epoch's per-category bound, not a per-model error bar (METHOD caveat 2), and the graphic doesn't say so. Add "(set by confidence category)".
9. **nit.** Location: slide `disclosure` legend "Confident, within 3x". These are 90% intervals, so "within 3x" overstates them a little. Use "Confident (90%: within 3x)" or make the meaning clear on slide 3.
10. **nit.** Location: copy alt text, slide 1, "about 10 to the 17 FLOP (AlexNet, 2012)". The value is 4.7e17, which is closer to 10^18. Say "about 5 × 10^17".
11. **nit.** Location: slide `disclosure`. The comparison windows (2019 to 2022 against 2023 on) are an analyst choice. 2016 to 2018 has 5 of 8 confident. The chart shows every year, so this isn't hidden. It's still worth one line in METHOD on why the window starts at 2019.

### Re-check (2026-10-05)

**Verdict:** PASS WITH FIXES. All five original should-fix items are dealt with. Item 5 is only partly fixed, and there is one new should-fix (R1).

I re-ran `process.mjs`, and `clean.csv` and `clean-frontier.csv` both reproduce byte-identical. I recounted from `clean-frontier.csv`. It has 124 frontier records. 2019 to 2022 is 27 records, 24 of them Confident. 2023 to 2026 is 27 records: 5 Confident, 8 Likely, 4 Speculative and 10 No estimate (1 in 2023, 7 in 2024, 2 in 2025). These match slide 2, slide 3, the caption and the alt text. The caption is 124 words and has no em dashes.

1. Original 1 (top 5 against top 10): **resolved.** The note, the sources slide and the caption now say "running top 10", and the sources slide says that is a wider set than the blue dots.
2. Original 2 (present-tense headline): **resolved.** The headline now reads "grew about 4x a year from 2018 to 2024".
3. Original 3 (10 frontier models dropped): **resolved.** They're drawn as ✕ on slide 2, and slide 3 says "10 more have no estimate".
4. Original 4 (GPT-4 counted twice): **partly resolved.** The note now says "GPT-4 has two", but see R1.
5. Original 5 (small text): **partly resolved, still open.** Chart text went from 17 to 19px up to 21 to 24px, and the exponents are larger. That's still only about 7 to 8px on a phone at 360px wide. The axis ticks, the "Bars: ..." note and the footer remain hard to read. Consider at least 28px for ticks and notes in the IG format.
6. **R1. New, should-fix.** Location: slide `disclosure` subhead and note, slide `ranges` subhead, caption. **The new "No estimate" set is mostly repeat records of the same models.** The 10 records are GPT-4o ×5 (May, Aug, Nov 2024; Jan, Mar 2025), GPT-4 Turbo ×2, Gemini 1.5 Pro, Claude 3 Opus and GLM-4-Plus. That's 5 distinct models. The note only mentions GPT-4. "10 have no estimate at all" reads as ten different models, and "5 of 27" counts records, not models. Across the 27 records since 2023 there are about 20 distinct models. The direction of the point holds either way. Fix: change the note to "One mark per Epoch frontier record; some models have several (GPT-4 ×2, GPT-4o ×5, GPT-4 Turbo ×2)", and say "records" in the subhead and caption, e.g. "10 frontier records (5 models) have no estimate".
7. **Visual.** No new collisions. The GPT-3 label is now offset with a leader line. In the X cut the leader lines still cross the data cluster (nit, as before).

### Review round 3 (2026-10-06)

**Verdict:** PASS WITH FIXES. No blockers.

The data is unchanged. The 478 dots from 2010 on and the frontier highlights match `clean.csv`. 4.2x for "the largest models, 2018 to 2024" matches Sevilla & Roldán's running-top-10 fit. Video frames at 0.8, 1.6 and 2.4s show only the plotted points and a year counter, no numbers. No em dashes.

1. **should-fix.** Location: `hook` title and site page `question`, "AI's computing power has grown 4x a year". **The title says more than the fit does, in two ways.**
   - The present perfect suggests the rate runs up to today, but the fit stops at May 2024. The chart shows points to Sep 2026 that the fit never tested.
   - "AI's computing power" reads as all AI compute, or as hardware capacity. The figure is training compute for the largest models.

   The big "4.2x … 2018 to 2024" label underneath is accurate, so the title is the only part that overreaches. Replace with: "Training compute for the biggest AI models grew 4x a year". If length allows, use "...4x a year, 2018 to 2024".
2. **should-fix.** Location: `hook`, the big "4.2x" callout. **The source's uncertainty has been dropped.** The source gives a 90% CI of 3.6x to 4.9x. Brief §5 says to show uncertainty when the source provides it, and earlier rounds did. Add a line under "for the largest models, 2018 to 2024": "(90% range 3.6x to 4.9x)".
3. **should-fix (carried from re-check R1).** Location: `disclosure` subhead, "Since 2023: 5 of 27." The 27 are Epoch records, not models: GPT-4 ×2, GPT-4o ×5 and GPT-4 Turbo ×2 are each one model. Replace with: "Since 2023: 5 of 27 Epoch records (about 20 models)." Or make the note list the repeats.
4. **nit.** Location: `hook`, "Each streak shows the range of the estimate". Use "Each streak shows Epoch's 90% range for the estimate". The same applies to the site page `keepInMind`, "Each glowing streak shows the range of an estimate".
5. **nit.** Location: `hook` footer, "Source: Epoch AI, Notable AI Models (CC BY), data to Sep 2026...". The access date is missing. Add "accessed 5 Oct 2026".
6. **nit.** Location: site page `answer`, "The newest figures are the least certain, because labs often don't publish them". This is fine; it follows Epoch's own confidence rule. Optionally say "Epoch rates the newest figures as least certain...", so it reads as Epoch's rating and not our claim.

### Changes after review round 3 (2026-10-06)

- Title: "Training compute for the biggest AI models grew 4x a year" (hook and site page); the 4.2x callout carries the 90% range 3.6x to 4.9x.
- Disclosure slide: "5 of 27 records (21 models)".
- "90% range" spelled out in the streak note and on the site page.
