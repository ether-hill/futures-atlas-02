# Training compute: copy

Status: reviewed 2026-10-05, PASS WITH FIXES; fixes applied. Open: phone text size.

## Headline
The biggest AI training runs grew about 4x a year

## Subhead
2018 to 2024. Each dot is an AI model; blue ones were the largest of their day.

## Formats
Animated: `output/training-compute/video/*.mp4` (Instagram 1080x1350, X 1600x900, 30fps). Stills: `output/training-compute/png/*@2x.png` (final frame).

## Carousel
1. **Compute for the biggest AI training runs grew about 4x a year from 2018 to 2024.** Scatter, log scale.
2. **The newest giants are the hardest to measure.** Frontier models by year, marked by how sure Epoch AI is of its compute estimate. 2019 to 2022: 24 of 27 records confident. Since 2023: 5 of 27, and 10 records with no estimate at all (GPT-4o alone has five).
3. **For some frontier models, the honest answer spans nearly three orders of magnitude.** Frontier models since 2023 with an estimate, and Epoch AI's 90% range for each. A speculative figure could be 31 times too high or too low. 10 more records have no estimate.
4. Sources and method.

## Caption (≤150 words)
Epoch AI tracks the compute used to train hundreds of notable AI models. Their estimate is that compute for the running top 10 models grew about 4.2x a year between 2018 and May 2024 (90% range 3.6x to 4.9x).

The catch: labs often don't publish these numbers. Epoch rebuilds them from hardware, training time and other clues, and rates how sure it is. From 2019 to 2022, 24 of 27 frontier models got a "confident" rating, meaning within 3x. Since 2023 it's 5 of 27 records, and 10 records (5 models, GPT-4o counted five times) have no estimate at all. A "speculative" figure could be 31 times off in either direction.

Data: Epoch AI, Data on Notable AI Models (CC BY), records to 9 Sep 2026. Compute isn't capability, cost or energy.

## Alt text
**Slide 1.** Scatter plot, log scale, of estimated training compute for 478 notable AI models from 2010 to 2026. Values rise from about 10 to the 17 FLOP (AlexNet, 2012) to about 10 to the 27 FLOP (GPT-6 Astra, 2026). Frontier models are highlighted with vertical bars showing Epoch AI's 90% uncertainty range.

**Slide 2.** Marks stacked by year for frontier AI models, 2016 to 2026, shaped by Epoch AI's confidence in each compute estimate. From 2019 to 2022, 24 of 27 are confident. From 2023, 5 of 27 records are confident, 12 are likely or speculative and 10 have no estimate. Some models appear more than once.

**Slide 3.** Range plot of the 17 frontier AI models with an estimate released between March 2023 and September 2026. Each has a point estimate and a bar for Epoch AI's 90% interval: plus or minus 3x for confident, 10x for likely, 31x for speculative.

**Slide 4.** Text slide listing sources and method.

## Sources
- Epoch AI, Data on Notable AI Models, https://epoch.ai/data/notable_ai_models.csv, CC BY, accessed 5 Oct 2026.
- Epoch AI, AI models documentation: Estimation, https://epoch.ai/data/ai-models-documentation/estimation, accessed 5 Oct 2026.
- Sevilla, J. and Roldán, E. (2024). Training compute of frontier AI models grows by 4-5x per year. Epoch AI. https://epoch.ai/blog/training-compute-of-frontier-ai-models-grows-by-4-5x-per-year
