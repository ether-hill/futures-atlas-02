# Qubits vs quality: chart notes

For the designer. Data: `clean.csv` (16 rows: 15 systems, plus Willow's logical-qubit result as its own row). Read METHOD.md first; the caveats there have to survive onto the graphic.

## What the data can honestly say

- The chips with the most qubits are mostly the ones with no published gate error (IBM's 433 and 1,121; Caltech's 6,100, which ran no two-qubit gates at all).
- The lowest published two-qubit errors come from small machines: Quantinuum's 32, 56 and 98-qubit trapped-ion systems (0.18%, 0.16%, 0.08%).
- Among chips that publish both numbers, more qubits does not track lower error: Willow's full 105-qubit chip sits at 0.33% and Zuchongzhi 3.0's 83-qubit selection at 0.375%, a 256-atom array at 0.56% (excluding atom loss), a 98-ion machine at 0.079%.
- Only one result here shows error correction getting better as it scales (Google 2024, one logical qubit from 101 physical).

It can't say who is "ahead", that any machine is useful, or that error rates are falling at a given pace (the set is hand-picked, not a census).

## Option A (recommended): count vs error scatter, with a "no number" rail

- x: physical qubits, log scale, labelled "log scale". Range roughly 30 to 7,000.
- y: two-qubit error per 1,000 gates (`twoq_errors_per_1000`), log scale, labelled, lower = better, so flip it so "better" is up, and say so on the axis ("fewer errors ↑").
- Use `twoq_error` (as published) for the points. Optionally show the harmonised value (`twoq_avg_infidelity_harmonised`) as a small tick so the 0.8x Pauli conversion is visible on the three XEB rows rather than silently applied. Don't mix the two columns in one series.
- Bluvstein (280) has no paired gate error: show it as a logical-demo marker, not a point on the error axis.
- Below the plot, a separate strip on the same x-axis titled "Qubits announced, no two-qubit error published": Osprey 433, Heron r1 133, Heron r3 156, Condor 1,121, Caltech 6,100 (note: no two-qubit gates). Same mark, hollow. This is the point of the piece: the right-hand end of the x-axis lives almost entirely in this strip.
- Shape by modality (circle superconducting, square trapped ion, triangle neutral atom) plus direct labels, so colour isn't the only carrier. One hue, with a single highlight for the Google logical result.
- Hollow outline / dashed label for `company_claim` rows (Willow spec sheet, Atom/Microsoft preprint, IBM). Footnote it.
- Optional reference band: "roughly where surface-code error correction starts to work, about 1 error in 100 to 1 in 1,000". DO NOT draw this without a cited source for the threshold figure; none is in `raw/` yet. Without one, leave it off.
- Callout on Willow: "1 logical qubit from 101 physical, errors fall as the code grows (below threshold)".

## Option B: paired dot plot, sorted by qubit count

One row per device, sorted by physical qubits. Left column: a bar or dot for qubit count (log). Right column: two-qubit error (log), or "not published" written in the cell. Reads like a table, very honest, easy on a phone, less striking. Good as carousel slide 3 after the scatter.

## Option C: carousel built on the two above

1. Hook: the "no number" strip alone. "The biggest quantum chips here didn't publish how often their gates fail."
2. The scatter (Option A).
3. Paired dot plot (Option B) as the full list.
4. What a logical qubit is, with the Willow result, and why Harvard's 48 / Atom's 24 logical qubits are a different kind of result (error detection with discarded runs).
5. Sources + method: benchmark kinds differ, best-case results, makers report their own numbers, not a census.

## Candidate headlines (all supported by the data)

- "More qubits isn't the same as better qubits"
  Subhead: "Published two-qubit error rates for 15 quantum computing results, 2019-2026. The biggest counts mostly came with no error figure at all."
- "The quantum computers with the fewest errors are some of the smallest"
  Subhead: "A 98-qubit ion trap reports under 1 error in 1,000 gates. A 1,121-qubit chip reported no figure."
- "Count the qubits, then ask how often they fail"
  Subhead: "Qubit counts and published gate errors for 15 systems. Error figures come from different tests and aren't strictly comparable."

Avoid: "X is the best quantum computer", "error rates are falling fast", anything implying IBM's chips are worse (they're unpublished in our sources, which is a different claim).

## Caption must carry

Errors are each maker's best published figure, measured with different tests; IBM publishes live calibration data that isn't archived here; company claims marked; not a census.
