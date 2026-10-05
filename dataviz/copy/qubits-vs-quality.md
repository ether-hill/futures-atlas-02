# Qubits vs quality: copy

Status: reviewed 2026-10-05, PASS WITH FIXES; fixes applied. Open: phone text size.

## Headline
More qubits isn't better qubits

## Subhead
Published two-qubit gate errors, 2019 to 2026, from tests that aren't strictly comparable. The biggest qubit counts mostly came without one.

X version subhead: Published two-qubit gate errors, 2019 to 2026, from tests that aren't strictly comparable.

## Formats
Animated: `output/qubits-vs-quality/video/*.mp4` (Instagram 1080x1350, X 1600x900, 30fps). Stills: `output/qubits-vs-quality/png/*@2x.png` (final frame).

## Carousel
1. **More qubits isn't the same as better qubits.** A curve per machine from its qubit count (log scale) to its two-qubit errors per 1,000 gates; machines whose source states no average error drop into a "no average stated" list.
2. **Logical qubits aren't all the same thing.** A logical qubit is many physical qubits working as one, more reliable one. Only one result here fixes errors rather than just spotting them.
3. Sources and method.

## Caption (≤150 words)
Quantum computer launches usually lead with the qubit count. But a qubit is only useful if its operations work, and the number that tells you that is the error rate on two-qubit gates.

We collected published figures for 14 quantum computers from 2019 to 2026, plus one logical-qubit experiment. Trapped-ion machines report the lowest errors: Quantinuum's 98-qubit Helios is at 0.79 per 1,000 gates. Several of the biggest counts, including IBM's 1,121-qubit Condor, came with no average two-qubit error in the announcement. For Heron r3, IBM says 57 of 176 qubit pairs are under 1 per 1,000.

Caveats: each maker tests its own hardware, the tests differ, and these are best results, not everyday service. IBM shows live error rates on its cloud dashboard, which we didn't archive. A hand-picked set, not a census. Sources on the last slide.

## Alt text
**Slide 1.** Two vertical axes, physical qubits (log scale) on the left and two-qubit gate errors per 1,000 gates on the right, joined by a curve for each of 9 systems with published figures. The curves cross. Values run from Quantinuum Helios (98 qubits, 0.79 per 1,000) to Google Sycamore (53 qubits, 6.2 per 1,000). A separate list shows 5 systems whose source states no average two-qubit error: IBM Heron r1 (133), IBM Heron r3 (156, where IBM says 57 of 176 pairs are under 1 per 1,000), IBM Osprey (433), IBM Condor (1,121) and a Caltech array of 6,100 atoms that ran no two-qubit gates.

**Slide 2.** Three dot fields comparing physical and logical qubits: Google Willow, 101 physical qubits for 1 error-corrected logical qubit; Harvard/MIT/QuEra, 280 physical for 48 error-detected logical; Atom Computing/Microsoft, 48 atoms for 24 error-detected logical.

**Slide 3.** Text slide with method notes and the full source list.

## Sources
See `data/qubits-vs-quality/METHOD.md` for the full list with DOIs and locators. 10 peer-reviewed papers and 5 company documents (Google Willow spec sheet, Atom Computing/Microsoft arXiv preprint, IBM newsroom and two IBM blogs), accessed 5 Oct 2026.
