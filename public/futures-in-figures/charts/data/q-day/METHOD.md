# Q-Day: when could a quantum computer break RSA-2048?

Piece #2 in series A ("When will it arrive?"). Status: designed and rendered (4-slide carousel + X); review fixes applied 2026-10-05, re-check pending.

## Question

How likely do quantum computing experts think it is that a quantum computer able to break RSA-2048 gets built within 5, 10, 15, 20 and 30 years? How widely do they disagree, and how have the answers moved between the 2022 and 2025 survey waves?

This is **expert opinion, not measurement**. Every graphic built from it has to say "forecast" or "experts' estimates" in the headline or subhead.

## Source

Primary: the annual expert survey by evolutionQ Inc., published by the Global Risk Institute in Financial Services (GRI). Same authors, same key question, same seven answer bins in every edition used here.

| Edition | Citation | Published | URL | Respondents | Counts table | Access date |
|---|---|---|---|---|---|---|
| 2025 | Mosca, M. and Piani, M. *Quantum Threat Timeline Report 2025*. evolutionQ Inc. / Global Risk Institute. | March 2026 | https://globalriskinstitute.org/mp-files/pdf-quantum-threat-timeline-report-2025.pdf (landing page: https://globalriskinstitute.org/publication/quantum-threat-timeline-report-2025b/) | 26 (p19) | Appendix A.4, p70 | 2026-10-05 |
| 2024 | Mosca, M. and Piani, M. *Quantum Threat Timeline Report 2024*. evolutionQ Inc. / Global Risk Institute. | December 2024 | https://globalriskinstitute.org/mp-files/quantum-threat-timeline-report-2024.pdf | 32 (p12) | Appendix A.4, p66 | 2026-10-05 |
| 2023 | Mosca, M. and Piani, M. *Quantum Threat Timeline Report 2023*. evolutionQ Inc. / Global Risk Institute. | December 2023 | https://globalriskinstitute.org/mp-files/quantum-threat-timeline-report-2023.pdf | 37 (p13) | Appendix A.4, p65 | 2026-10-05 |
| 2022 | Mosca, M. and Piani, M. *Quantum Threat Timeline Report 2022*. evolutionQ Inc. / Global Risk Institute. | December 2022 | https://globalriskinstitute.org/mp-files/2022-quantum-threat-timeline-report-dec.pdf | 40 (p12) | Appendix A.4, p61 | 2026-10-05 |

Page numbers are PDF page numbers, which match the printed page numbers in these files.

SHA-256 of the untouched PDFs in `raw/`:

```
b4df230e5a0049ed916a895f2c4553bf3d125f4122588e421fb585c40994915e  pdf-quantum-threat-timeline-report-2025.pdf
7310811601b130562f7e3107eca0bbac80697bbb3618119f19fa582798f5f979  quantum-threat-timeline-report-2024.pdf
5d59a9b89e2d5cbf37dff831b237c23aa2418242502d5ecdc8d9614e1b2caaee  quantum-threat-timeline-report-2023.pdf
3be7caee70f8fb050c6787241e722467066279926bfe543813b200aa9c909e04  2022-quantum-threat-timeline-report-dec.pdf
```

The 2019 to 2021 editions exist, but the 2025 report itself only compares ranges for 2022 to 2025 and argues that the pandemic and the venture-capital squeeze make the earlier waves a poor comparison (2025 report p33). We follow that and stop at 2022.

**Data vintage.** Each edition is one survey wave, labelled by its edition year. None of the reports states the dates the questionnaire was open. The 2025 questionnaire asks about achievements "since the second half of 2024" and next steps "by approximately Summer 2026" (p69 to p70), so it was fielded in 2025. Horizons are counted from the survey year, so "within 10 years" in the 2025 wave means roughly by 2035, and in the 2022 wave roughly by 2032.

## The exact question (2025 report, Appendix A.3, p68; unchanged across editions per p24)

> Please indicate how likely you estimate it is that a quantum computer able to factorize a 2048-bit number in less than 24 hours will be built within the next 5 years, 10 years, 15 years, 20 years, and 30 years.

Answer options, one per horizon:

1. Extremely unlikely (< 1% chance)
2. Very unlikely (< 5% chance)
3. Unlikely (< 30% chance)
4. Neither likely nor unlikely (about 50% chance)
5. Likely (> 70% chance)
6. Very likely (> 95% chance)
7. Extremely likely (> 99% chance)

## Definitions

- **CRQC**: "cryptographically relevant quantum computer", the report's term. Here it means exactly what the question says: factors a 2048-bit number in under 24 hours. "Q-Day" is our shorthand and does not appear in the question.
- **Bin bounds** (`bucket_low`, `bucket_high` in `clean.csv`): the lowest and highest probability compatible with each answer, as the authors assign them (2025 report, Appendix A.4, p71): <1% = 0 to 1, <5% = 1 to 5, <30% = 5 to 30, ~50% = 30 to 70, >70% = 70 to 95, >95% = 95 to 99, >99% = 99 to 100. The bins are uneven on purpose: the middle one spans 40 points, the outer ones 1 point (p24).
- **Pessimistic / optimistic average**: give every respondent the low (or high) bound of their bin, then take the plain mean. The true group mean of whatever the experts privately believed would sit somewhere between the two. This range is the report's own uncertainty band and mostly reflects how wide the bins are (p30).

## Transformations

1. `raw/transcription.csv` is the **only hand step**: a literal transcription of the printed counts tables (one per edition), the sample sizes, the 2025 report's labelled averages (Figure 17, p31), the 2025 report's labelled ranges for older waves (Figure 4, p6) and the labelled n=15 point-estimate quartiles (Figure 18, p31). Each row carries its file and page. Values are as printed, including the printing error below.
2. `raw/corrections.csv` holds the one correction, with its evidence. `process.mjs` refuses to apply a correction if the printed value it expects is not the one in the transcription.
3. `process.mjs` (Node, no dependencies) writes:
   - `clean.csv`: one row per edition × horizon × bin, with count, N, share of respondents and bin bounds.
   - `clean-averages.csv`: pessimistic, optimistic and mid-point averages **recomputed from the counts** with the report's method, next to the values the reports print.
   - `clean-point-estimates.csv`: the 2025 point-estimate quartiles, as printed.
4. Checks the script enforces (it exits non-zero if one fails):
   - every horizon's seven bins sum to the edition's stated N (all 20 columns pass);
   - every recomputed 2025 average rounds to the value printed in Figure 17 (all 15 pass);
   - every recomputed 2022 to 2024 average is compared with Figure 4 of the 2025 report (28 of 30 pass; the 2 misses are below and are reported as warnings, not silenced).

No numbers were estimated, interpolated or read off a bar by eye. Every count comes from a printed table. Every figure we checked visually (2025 Figures 12 and 14, 2023 Figure 7) agrees with the tables.

## Known discrepancies

1. **2023 table, 30-year column, "~50%" row is printed as 87** (2023 report p65). Impossible with 37 respondents. We use **8**: the column then sums to 37; the 2023 report's own heatmap (Figure 7, p21) shows 22% for that cell (8/37 = 21.6%); and the 2025 report's Figure 4 gives 2023 30-year averages of 75% and 92%, which the counts only reproduce with 8 (75.2% and 91.9%).
2. **2025 report Figure 4 labels two 2022 values that the 2022 counts do not reproduce.** 10-year optimistic is labelled 25%, the counts give 27.05%, and the 2022 report's own text says "already ~10% in the next 10 years (~27% for the optimistic interpretation)" (2022 report p22). 30-year pessimistic is labelled 80%, the counts give 79.22%. We use the values recomputed from each edition's own counts table and do not use the Figure 4 labels on any graphic.

## Key numbers (all from `clean.csv` / `clean-averages.csv`)

2025 wave, 26 experts:

| Within | <1% | <5% | <30% | ~50% | >70% | >95% | >99% | Avg range (pess.–opt.) |
|---|---|---|---|---|---|---|---|---|
| 5 years | 13 | 5 | 6 | 1 | 1 | 0 | 0 | 5% to 15% |
| 10 years | 3 | 4 | 6 | 7 | 4 | 1 | 1 | 28% to 49% |
| 15 years | 0 | 3 | 5 | 3 | 9 | 4 | 2 | 51% to 70% |
| 20 years | 0 | 0 | 2 | 6 | 6 | 4 | 8 | 69% to 86% |
| 30 years | 0 | 0 | 1 | 3 | 5 | 5 | 12 | 81% to 93% |

Within 10 years, the 2025 panel splits exactly in half: 13 of 26 chose a bin below 30%, 13 chose about 50% or higher.

10-year average range by wave (recomputed): 2022 10% to 27% (N=40) · 2023 17% to 31% (N=37) · 2024 19% to 34% (N=32) · 2025 28% to 49% (N=26).

2025 point estimates, the 15 of 26 who gave one (Figure 18, p31), median and interquartile range: 5 years 2% (1 to 10) · 10 years 40% (10 to 65) · 15 years 75% (20 to 90) · 20 years 90% (50 to 96) · 30 years 97% (80 to 99).

## Caveats (must travel with every graphic)

- **Small samples.** 26 people in 2025. One person changing bin moves a share by about 4 points.
- **Not a fixed panel.** N fell from 40 to 37 to 32 to 26, and the pool changes each year around a core of repeat respondents (2025 report p19). Part of any shift between waves may be who answered, not what people think. The reports do not publish per-respondent data, so we cannot separate the two.
- **Invited, not sampled.** Respondents are experts the authors chose and who agreed to answer. They are named in the appendix, so this is not a random sample of the field.
- **The people answering build the thing.** Most work in quantum computing research or companies. The publisher, evolutionQ, sells quantum-safe security products and says so (2025 report p3, "Declaration on Potential Conflict of Interest").
- **Bins are ranges, not points.** "About 50%" covers 30% to 70%. Averages are therefore shown as a range, never a single line, unless it is the report's own point-estimate subset and labelled n=15.
- **Wording.** The bar is specific: factoring 2048-bit RSA in under 24 hours. A slower machine could still matter for security, and a different wording would get different answers.
- **Relative horizons.** "Within 10 years" is a different calendar year in each wave. Comparing waves at the same horizon is comparing different target dates. The report also aligns by calendar year (Figures 20 and 22); we have not reproduced that.
- **The 25-year column in the report's charts is interpolated by the authors** (Table 1, p28: "we did not directly probe this timeframe"). We do not show 25 years.
- **Point estimates are a self-selected subset** (15 of 26). The report says not to treat them as the main finding (p32).

## What the chart does not show

- Any single "Q-Day" date. The survey never asks for one.
- What happens to encryption after such a machine exists, or how long migration takes.
- Covert or classified programmes, which the experts flag as a possible accelerant (p6 to p7).
- Hardware progress itself. This is belief about progress, not progress.
- Waves before 2022, or the 25-year interpolation.

## Licence and reuse

The report's reprint permission covers unaltered reproduction with attribution (2025 report p3). We do not reproduce the report's figures; we redraw from the published counts and credit "Mosca & Piani, Quantum Threat Timeline Report 2025, evolutionQ / Global Risk Institute".

## Changes after review (2026-10-05)

- Hook headline no longer says "split 13 to 13"; it says half call it unlikely, and the chart labels 13 unlikely vs 7 about even and 6 likely or more.
- Waves slide headline now "Experts give higher 10-year odds now than they did in 2022", with the moving-horizon and changing-panel caveats in the subhead.
- Page refs for "unchanged across editions" and the uneven bins corrected from p26 to p24.

## Review

- **Date:** 2026-10-05
- **Reviewer:** independent review agent
- **Verdict:** PASS WITH FIXES

**What I checked.** I re-ran `node data/q-day/process.mjs`. `clean.csv`, `clean-averages.csv` and `clean-point-estimates.csv` all came out byte-identical. The two Figure 4 mismatch warnings appear as documented. I extracted the A.4 counts tables from all four PDFs (2025 p70, 2024 p66, 2023 p65, 2022 p61), and all 140 bin counts match clean.csv. That includes the 2025 10-year column (3, 4, 6, 7, 4, 1, 1), the 2025 30-year column (0, 0, 1, 3, 5, 5, 12) and the 2023 30-year "87". The 87 to 8 correction holds up. The column only sums to 37 with 8. The 2023 report's own text (p20, "Twenty-nine experts out of 37 (78%)") needs 10 + 10 + 9 = 29 likely-or-better. The 2025 Figure 4 averages also need it. I checked the sample sizes in the text: 40 (2022 p12), 37 (2023 p13), 32 (2024 p12) and 26 (2025 p19). The question wording matches the 2025 report, p24 and p68. The conflict-of-interest declaration is on p3. Headline numbers: 13 below 30% (3 + 4 + 6) and 13 at about 50% or above (7 + 4 + 1 + 1). 22 of 26 put the 30-year odds above 70% (5 + 5 + 12), which matches the report's own "22/26 (85%)" on p28. The 10-year ranges are 10 to 27, 17 to 31, 19 to 34 and 28 to 49, matching clean-averages.csv rounded. No em dashes appear on the graphics or in copy/q-day.md (the only en dash in the repo is in a METHOD table header). The caption is 144 words.

**Findings**

1. **should-fix.** Location: slide `waves` (title and subhead), copy carousel 3, caption paragraph 4. **A key caveat is missing: the horizon moves.** "Within 10 years" means about 2032 in the 2022 wave and about 2035 in the 2025 wave. So part of any rise is mechanical, because each later wave is asked about a later year. METHOD lists this under "Caveats (must travel with every graphic)", but the slide only gives the panel-change caveat. Fix: add to the subhead or note, "Each survey asks about the next 10 years, so the target year moves later each time (about 2032 in 2022, about 2035 in 2025)."
2. **should-fix.** Location: slide `waves` title "The 10-year odds have gone up in each of the last four surveys", and the caption. **The title overclaims a steady trend.** Both bounds do rise every year. But 2023 to 2024 moves only 17 to 19 and 31 to 34, the ranges overlap heavily, and the panel changed. A move that small is a handful of respondents moving one bin. Combined with finding 1, the title states a steady trend more firmly than the data supports. It also doesn't say the odds are experts' estimates. Fix: something like "Experts' 10-year odds have crept up since 2022, most of all in 2025", with the subhead carrying both caveats.
3. **should-fix.** Location: slide `hook` headline (IG and X) "Experts split 13 to 13", and the copy headline. **The 13 to 13 frame suggests "13 yes, 13 no".** It reads as two equal camps. In fact the "yes" half is 7 experts who chose "neither likely nor unlikely (30 to 70%)" plus only 6 who called it likely or better. The split is real at the 30% line, but a phone reader will take it as half the experts expecting it. Fix: keep the chart but change the headline or subhead to carry the middle, e.g. "13 put it under 30%, 7 called it a coin flip, 6 said likely".
4. **should-fix.** Location: all slides, chart text sizes. **Small text is illegible at phone size.** At about 360px display width, the bin sub-labels ("Extremely unlikely", 16px), the slide 2 column heads (17px), "Within" (16px), the slide 3 note (17px), the "experts" counts (18px), axis ticks (19px) and the footer (19px) render at about 5 to 6px. The slide 3 note "Not a confidence interval" is an important caveat and at that size it's effectively invisible. Fix: raise chart text in the IG format to at least 30px. On slide 2, either drop "Within" or put it in the subhead.
5. **nit.** Location: slides `horizons` and `waves`. Only the hook carries the kicker "Expert survey, not a measurement". Brief §6 wants forecasts labelled in the headline or subhead on each graphic, because slides travel alone. Repeat the kicker, or put "experts" into the slide 3 title (see finding 2).
6. **nit.** Location: caption, first sentence, "RSA is one of the main ways data is encrypted online". RSA mostly protects key exchange and signatures, not bulk data. Use "RSA is widely used to secure connections and signatures online".
7. **nit.** Location: METHOD, Question section and Definitions. The text cites "p26" for "unchanged across editions" and for the uneven bins being on purpose. In the saved 2025 PDF both statements are on p24 ("consistent across all surveys", "relatively large, uneven likelihood bins"). Correct the page.
8. **nit.** Location: the series label "The quantum landscape" on every frame. Brief §7 puts Q-Day in series A, "When will it arrive?", and METHOD says the same. Pick one.
9. **nit.** Location: METHOD, status line "Not yet designed". It's stale now that the piece is designed. Update it.
10. **nit.** Location: brief §6 asks for the median as well as the spread. The hook shows the full distribution, which is better than a median. Still, the 10-year median falls between the "<30%" and "~50%" bins, and the n=15 point-estimate median is 40% (IQR 10 to 65). Neither appears anywhere. If you add it, label it as the self-selected n=15 subset.

### Re-check (2026-10-05)

**Verdict:** PASS WITH FIXES. All four original should-fix items are dealt with. Item 4 (text size) is only partly fixed, and that is the only thing still open.

I re-ran `process.mjs` and all three CSVs reproduce byte-identical. The hook numbers still match the 2025 A.4 table: 13 below 30% (3 + 4 + 6), 7 at about 50%, and 6 likely or more (4 + 1 + 1). "Half of experts say it's unlikely" is 13 of 26, which is correct. The caption is 147 words and has no em dashes.

1. Original 1 (moving horizon): **resolved.** The waves subhead now says "Each counts 10 years from its own date, so the target year moves". The caption says the same.
2. Original 2 (waves title overclaimed): **resolved.** The title is now "Experts give higher 10-year odds now than they did in 2022". It's labelled as expert opinion, and the panel-change caveat is in the subhead.
3. Original 3 (13 to 13 framing): **resolved.** The chart labels now read "13 said unlikely / 7 said about even, 6 likely or more".
4. Original 4 (small text): **partly resolved, still open.** The hook annotations are now 30px and readable. The slide 2 column heads, the "Within" label (20px), the "experts" counts (22px), the bar note (21px) and the footer are still about 7px on a phone.
5. **New, nit.** Location: slide `waves` note. The line "Not a confidence interval" was replaced by "Each bar reads every answer at its bin's low end, then its high end". The new wording is clearer about the method, but the warning that this isn't a CI has gone. Consider adding it back.
6. **Visual.** No overlaps or clipping. The X hook is clean.

### Review round 3 (2026-10-06)

**Verdict:** PASS WITH FIXES. No blockers.

I re-checked the new bars against `clean.csv` (2025, bins >70% + >95% + >99%):

| Horizon | Count | Share | Bar |
|---|---|---|---|
| 5 years | 1 + 0 + 0 = 1 | 3.8% | 4% |
| 10 years | 4 + 1 + 1 = 6 | 23.1% | 23% |
| 15 years | 9 + 4 + 2 = 15 | 57.7% | 58% |
| 20 years | 6 + 4 + 8 = 18 | 69.2% | 69% |
| 30 years | 5 + 5 + 12 = 22 | 84.6% | 85% |

All five match the bars and the alt text. "Most do" by 15 years is 15 of 26, so it holds. "Around 2040" for "within 15 years" of a survey fielded in 2025 is fair, as long as the word "around" is kept (see 3). The bars start at zero. No em dashes.

1. **should-fix.** Location: `hook` subhead, "Share of 26 experts who say it's likely." **"Likely" here merges three answer bins.** It covers "Likely (>70%)", "Very likely (>95%)" and "Extremely likely (>99%)", but the definition is only on the "How to read this" slide. The hook travels without that slide. Replace with: "Share of 26 experts who put the odds at 70% or more. By around 2040, most do."
2. **should-fix.** Location: `hook` title, "When could quantum computers break encryption?" **The title covers more than the survey asked.** The question was only about factoring a 2048-bit number, which means RSA, not encryption in general. Symmetric encryption isn't in scope. Replace with: "When could quantum computers break RSA encryption?"
3. **nit.** Location: `hook` subhead, "By 2040, most do." It states a calendar year as if it were the question, but the question said "within 15 years". Use "By around 2040", matching the bar label "around 2040".
4. **should-fix.** Location: `hook` chart. **The spread and the middle answers are gone.** Brief §6 asks for spread as well as the headline share. The new bars drop the "about 50%" group entirely: 3 experts at 15 years, 7 at 10 years. A reader can't see that 13 of 26 put the 10-year odds under 30%. Fix: add the "about even (30 to 70%)" count as a lighter segment stacked on each bar, or a small line under each bar, e.g. "+3 said about even".
5. **should-fix.** Location: `video/ig-hook-field.mp4` (and x). **Mid-animation frames show wrong numbers.** At 0.8s the 5-year bar reads "3%". At 1.6s the 15-year bar reads "38%". At 2.4s the 20- and 30-year bars read "66%" and "41%". These are tweened values that no expert gave, and a paused frame or screenshot would show them. Fix: fade each label in at its final value once its bar settles, or count up in whole experts ("1 of 26" … "22 of 26").
6. **nit.** Location: `hook` footer, "Source: Quantum Threat Timeline Report 2025, Global Risk Institute. Expert survey, n=26." It leaves out the authors, publisher and access date. Use: "Source: Mosca & Piani, Quantum Threat Timeline Report 2025 (evolutionQ / Global Risk Institute, Mar 2026). Expert survey, n=26. Accessed 5 Oct 2026."
7. **nit (house style).** Location: all three new hooks. They're dark-ground by default. Laura's standing design note is "no dark-by-default; use the project's own functional colours". Check with her before publishing.

### Site page review, Futures in Figures (2026-10-06)

Files: `src/app/(atlas)/futures-in-figures/page.tsx` and `src/data/projects.ts` (id `futures-in-figures`). No em dashes.

**Verdict:** FAIL until S1 is fixed. After that, PASS WITH FIXES.

- **S1. blocker.** Location: the qubits `answer`, "...and several of the biggest machines published no error rate at all." **This is false.** IBM states a two-qubit figure for Heron r3 ("57 of 176 pairs under 1 per 1,000", `raw/ibm-blog-qdc-2025.html`). IBM publishes live error rates on its dashboard. And Caltech's 6,100-atom array ran no two-qubit gates, so it had nothing to publish. Replace with: "...and several of the biggest machines came without an average two-qubit error rate in the documents we used. One, Caltech's 6,100-atom array, ran no two-qubit operations at all."
- **S2. should-fix.** Location: intro, "Every number comes from the original source: a peer-reviewed paper, official statistics or a research group that publishes its method." **The list leaves out a source type the qubit chart uses.** Five of its sources are company documents. Replace with: "Every number comes from the original source: a peer-reviewed paper, official statistics, a research group that publishes its method, or, for claims about a company's own hardware, that company's documents. Where a figure is a company's own claim, we say so."
- **S3. should-fix.** Location: "How these are made", "A script turns that into the chart's data, so no number is typed in by hand." **This is false for two of the three pieces.** Q-Day and qubits rely on a hand transcription (`raw/transcription.csv`). Replace with: "Where a number has to be copied out of a PDF, it's copied once into a transcription file with its page and quote. A script does everything after that, so no number on a chart is typed in by hand."
- **S4. should-fix.** Location: Q-Day `keepInMind`, "These are expert opinions, not a forecast." **The sentence contradicts itself and leaves out the conflict of interest.** Expert opinion about the future is a forecast. The brief's distinction is opinion versus measurement. Replace with: "These are expert opinions, not measurements: 26 invited experts, not a random sample. The survey's publisher, evolutionQ, sells quantum-safe security products."
- **S5. should-fix.** Location: Q-Day `answer`, "...how likely it is that a quantum computer could break RSA-2048... Only 1 thought it likely within 5 years. By 2040, most do." **"Likely" is undefined, and the tense switches mid-paragraph.** Replace the last two sentences with: "Only 1 put the odds at 70% or more within 5 years. Within 15 years, around 2040, 15 of the 26 did." Also: the survey is run by evolutionQ (Mosca & Piani) and published by the Global Risk Institute, so "The Global Risk Institute asked" is loose. Use "A Global Risk Institute survey asked".
- **S6. should-fix.** Location: compute `question`, "AI's computing power has grown 4x a year" (it's also the hook title; see the training-compute review).
- **S7. nit.** Location: "How these are made", "spec sheets and announcements from Google, IBM and Atom Computing with Microsoft". The Atom/Microsoft source is a preprint. Use "spec sheets, announcements and a preprint from Google, IBM and Atom Computing with Microsoft".
- **S8. nit.** Location: the project card tagline and page description, "...and shows how sure the numbers are." The qubit chart doesn't show uncertainty, even though the sources give it (e.g. 1.84(5)). Use "...and says how sure the numbers are", or add the ± values.

### Changes after review round 3 (2026-10-06)

- Title says RSA encryption; subhead defines "likely" as 70% or more; "around 2040".
- Spread restored: each bar carries "+N about even" (the 30 to 70% answers the bar leaves out).
- Labels count up in whole experts, so no video frame shows a share nobody gave.
- Site page: "A Global Risk Institute survey asked"; answer uses 70% or more and "15 of the 26"; "Keep in mind" names the invited panel and the publisher's conflict of interest.
- Not done: the dark ground. Laura chose variant A (dark) for this series on 2026-10-06, after seeing four variants.
