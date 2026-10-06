# Q-Day: chart notes

Data: `clean.csv` (bin counts), `clean-averages.csv` (pessimistic/optimistic ranges), `clean-point-estimates.csv` (n=15 subset). Caveats in METHOD.md.

## Option 1. The split, one row of people per horizon (recommended single post)

Five horizons down the page. Each row is 26 marks, one per 2025 respondent, sorted by the bin they chose and placed on a likelihood axis using the bin's range (a mark spans its bin, or sits in a band drawn as the bin width, so "about 50%" visibly covers 30 to 70). One hue, darker for higher likelihood, labelled directly with the bin names at the top row only. The 10-year row is the story: 13 marks left of 30%, 13 at 50% or above.

Honest because it shows every answer and the bin widths, no averaging. Watch: 26 marks per row must not read as "people" if the headline is about something else; here they literally are respondents, so that's fine.

## Option 2. The report's own range, as a fan (carousel slide 2, or the X version)

For each horizon, the band between the pessimistic and optimistic average (`avg_pessimistic_pct` to `avg_optimistic_pct`), drawn as a fan from 5 to 30 years. Points only at 5, 10, 15, 20, 30; do not connect through a 25-year point and do not smooth. Label it "range of the panel's average, depending on how you read the bins", not a confidence interval. It is not one.

## Option 3. How the 10-year answer moved, 2022 to 2025 (carousel slide 3)

Four horizontal range bars, one per wave, 10-year horizon only: 2022 10–27%, 2023 17–31%, 2024 19–34%, 2025 28–49%, each labelled with its N (40, 37, 32, 26). Note on the slide that the pool changes every year and that "within 10 years" means a later calendar year in each wave. Do not draw a trend line through four points of different panels.

Carousel order suggestion: hook (Option 1, 10-year row enlarged) → Option 1 full → Option 3 → Option 2 → sources and method.

## Candidate copy

Headline: **Experts split down the middle on a quantum computer that breaks RSA by 2035**

Subhead: Half of 26 quantum researchers surveyed in 2025 put it below 30%. The other half said about even odds or better.

Alternative headline (for the waves slide): **Expert odds of Q-Day within 10 years have risen in each of the last four surveys**
Subhead: The panel's average moved from 10–27% in 2022 to 28–49% in 2025. Fewer people answered each year, and not the same ones.

Note for the copy writer: "by 2035" is a shorthand for "within 10 years of a 2025 survey"; keep the exact question ("factor a 2048-bit number in under 24 hours") in the caption or footer.

Footer: Source: Mosca & Piani, Quantum Threat Timeline Report 2025 (and 2022–2024), evolutionQ / Global Risk Institute. Expert survey, 2025 wave, n=26. futures-atlas.com
