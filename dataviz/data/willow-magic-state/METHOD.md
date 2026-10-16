# Google's 99.99%: method note

Follow-up to Qubits vs quality, made the day after Google announced the result (16 October 2026). Three slides and a landscape version.

## The question

Google said its Willow quantum computer reached 99.99% accuracy. What was measured, how was it reached, and how far is that from what a quantum computer would need to break the encryption most of the internet uses?

## Sources

Saved in `raw/`. Accessed 16 October 2026.

1. Rosenfeld, E., et al. Magic state cultivation on a superconducting quantum processor. *Science* (published 15 October 2026), article eaee7961. doi:10.1126/science.aee7961. Preprint arXiv:2512.13908 (first posted 15 December 2025). Crossref record in `raw/crossref/`, arXiv abstract page in `raw/`. Every figure from this paper is from its abstract.
2. Gidney, C. How to factor 2048 bit RSA integers with less than a million noisy qubits. arXiv:2505.15917 (2025), preprint, not peer-reviewed. The one sentence used is saved in `raw/gidney-2025-arxiv-2505.15917-runtime-excerpt.txt`.

## The numbers (clean.csv)

| Figure on the post | Value | Where |
|---|---|---|
| 99.99% accuracy, at most 1 mistake in 10,000 | state fidelity 0.9999(1) | Rosenfeld et al., abstract |
| 92 of every 100 tries thrown away | 8% of attempts kept | Rosenfeld et al., abstract |
| Error cut 40 times (caption) | factor of 40 | Rosenfeld et al., abstract |
| 1 in 10 million needed | each cultivated magic state at a logical error rate of 10^-7 | Gidney 2025, section "Physical Costs", p. 20 |

"1,000 times fewer mistakes" is 10^-4 divided by 10^-7.

## What we simplified, and why

- "One key step it needs to run programs" is a magic state: a prepared quantum state a quantum computer uses up to run most useful programs. 99.99% is the accuracy of that state, not of every operation the chip does. The chip's raw two-qubit operations go wrong about 3.3 times in 1,000 (Google's spec sheet, see Qubits vs quality).
- 0.9999(1) means 0.9999 with an uncertainty of 0.0001 in the last digit. The post says "at most 1 mistake in 10,000", reading the figure as Google's headline does.
- "The codes that keep online banking and messages private" stands for RSA-2048. Some services have already moved to newer encryption.
- The 1 in 10 million is from one plan, by a Google researcher, for one way of building the machine. In that plan the states are cleaned up further (distilled) after cultivation, so 10^-7 is the target for the cultivation step specifically, the same step Google demonstrated. Other designs would set other targets.
- The "today" in the title refers to the announcement and the *Science* publication on 15 October 2026. The result first appeared as a preprint in December 2025.

## What the post does not show

- How many qubits the experiment used, or how long each attempt took.
- That the result has only been shown at a small scale. Google says it still has to work at a larger scale, inside a real calculation.
- The 8% kept is the share of attempts that passed every check; the dot grid on slide 2 is an illustration of that share, not a record of real attempts.
