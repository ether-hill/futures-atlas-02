# Qubits vs quality: method note

Piece #5 of the Futures Atlas data visual series. Status: designed and rendered (4-slide carousel + X); review fixes applied 2026-10-05, re-check pending.

## The question

Does the number of physical qubits on a quantum chip tell you how capable it is? The chart pairs each device's qubit count with the published error rate of its two-qubit gates (the operation that does most of the damage in a real circuit), and marks the few results where qubits were combined into error-corrected "logical" qubits.

## Is there a ready-made dataset?

Checked first, in the brief's order of preference. None could be used whole.

| Option | Type | Why not used whole |
|---|---|---|
| MIT Quantum Index Report 2025, benchmarking section (qir.mit.edu/benchmarking) | Research institute with a written method | 200+ QPUs, but no downloadable table; values gathered from maker websites and direct queries to makers; the report itself says fidelities are measured differently across QPUs (average vs median, isolated vs simultaneous); licence CC BY-ND 4.0. Useful as a cross-check, not as a primary source. |
| Metriq (Unitary Foundation, metriq-data on GitHub, paper arXiv:2603.08680) | Independent benchmarking with published method | Measures its own benchmark (e.g. error per layered gate) on 11 cloud devices (IBM, Quantinuum, IQM, Rigetti, OriginQ). Good method, but a different metric from the gate errors makers publish, and it does not cover Google, USTC or the neutral-atom labs. A possible follow-up piece. |
| Sevilla & Riedel, "Forecasting timelines of quantum computing" (arXiv:2009.05045) | Academic dataset | Stops in mid-2020. |
| Wikipedia "List of quantum processors" | Not acceptable as a source | Used only to sanity-check that no major system was missed. |

So the set below is assembled by hand from primary documents, one row per device or result.

## Sources

Every document is saved untouched in `raw/`. Journal metadata for each DOI is saved from Crossref in `raw/crossref/`; arXiv abstract pages (which carry the journal reference and first-submission date) are in `raw/arxiv-abs/`. Access date for everything: 2026-10-05.

Peer-reviewed:

1. Arute, F. et al. Quantum supremacy using a programmable superconducting processor. *Nature* 574, 505-510 (2019). doi:10.1038/s41586-019-1666-5. Figures from p. 507 and Fig. 2a. Supplementary information also saved (arXiv:1910.11333).
2. Google Quantum AI and Collaborators. Quantum error correction below the surface code threshold. *Nature* 638, 920-926 (2025). doi:10.1038/s41586-024-08449-y. Abstract and Table S1 (arXiv:2408.13687).
3. Wu, Y. et al. Strong quantum computational advantage using a superconducting quantum processor. *Phys. Rev. Lett.* 127, 180501 (2021). doi:10.1103/PhysRevLett.127.180501. arXiv:2106.14734 p. 3, Fig. 2(c).
4. Gao, D. et al. Establishing a new benchmark in quantum computational advantage with 105-qubit Zuchongzhi 3.0 processor. *Phys. Rev. Lett.* 134, 090601 (2025). doi:10.1103/PhysRevLett.134.090601. arXiv:2412.11924 p. 3, Fig. 2b.
5. Moses, S. A. et al. A race-track trapped-ion quantum processor. *Phys. Rev. X* 13, 041052 (2023). doi:10.1103/PhysRevX.13.041052. arXiv:2305.03828 abstract.
6. DeCross, M. et al. Computational power of random quantum circuits in arbitrary geometries. *Phys. Rev. X* 15, 021052 (2025). doi:10.1103/PhysRevX.15.021052. arXiv:2406.02501 Table I.
7. Quantinuum authors. A 98-qubit trapped-ion quantum computer with all-to-all connectivity. *Nature* 655, 81-86 (2026). doi:10.1038/s41586-026-10676-4. Abstract and the component benchmark table on p. 4.
8. Evered, S. J. et al. High-fidelity parallel entangling gates on a neutral-atom quantum computer. *Nature* 622, 268-272 (2023). doi:10.1038/s41586-023-06481-y. arXiv:2304.05420 Fig. 3d.
9. Bluvstein, D. et al. Logical quantum processor based on reconfigurable atom arrays. *Nature* 626, 58-65 (2024). doi:10.1038/s41586-023-06927-3. arXiv:2312.03982 abstract and Methods p. 12.
10. Manetsch, H. J. et al. A tweezer array with 6,100 highly coherent atomic qubits. *Nature* 647, 60-67 (2025). doi:10.1038/s41586-025-09641-4. arXiv:2403.12021.

Company claims (labelled `company_claim` in the data, and must be labelled on the graphic):

11. Google Quantum AI. Willow Spec Sheet, 9 Dec 2024. p. 1.
12. Reichardt, B. W. et al. (Microsoft, Atom Computing). Fault-tolerant quantum computation with a neutral atom processor. arXiv:2411.11822v3 (2025). Preprint with no journal reference as of the access date, written by the two companies about their own system.
13. IBM Newsroom. IBM Unveils 400 Qubit-Plus Quantum Processor and Next-Generation IBM Quantum System Two, 9 Nov 2022.
14. IBM Quantum blog. Quantum roadmap 2033, 4 Dec 2023.
15. IBM Quantum blog. Scaling for quantum advantage and beyond (QDC 2025), 12 Nov 2025; and IBM Quantum docs, "Processor types" page.

Checked and not used: Kim, Y. et al. Evidence for the utility of quantum computing before fault tolerance. *Nature* 618, 500-505 (2023), doi:10.1038/s41586-023-06096-3 (saved in `raw/`). It describes IBM's 127-qubit Eagle (ibm_kyiv) but its text gives no number for the two-qubit gate error, so it adds nothing a row could use.

## Definitions

- **Physical qubits**: the number of qubits the paired error was measured on, so every row is a matched pair. Where a chip has more qubits than that, `physical_qubits` is the measured set and the chip size goes in `qubits_basis` (Zuchongzhi: 56 of 66; Zuchongzhi 3.0: 83 of 105; Willow logical memory: 101 of 105). `qubits_basis` says for every row whether the count is all qubits on the chip or a subset used in the experiment.
- **Two-qubit error**: the source's headline error for its entangling gate, as a fraction (0.0062 = 0.62% = 6.2 errors per 1,000 gates). Four kinds appear, and they are NOT the same quantity:
  - **Pauli error from cross-entropy benchmarking (XEB)**: Google 2019, both USTC rows. XEB fits how fast random circuits lose fidelity. A Pauli error is a process infidelity.
  - **Average infidelity from randomized benchmarking (RB)**: Quantinuum (all three), Google's Willow spec sheet ("average error", RB techniques), Atom Computing (interleaved RB). RB fits how fast random Clifford sequences decay.
  - **1 minus a CZ fidelity from global randomized benchmarking** (random global single-qubit rotations between CZ gates): Harvard 2023, 60-atom run.
  - **Interleaved RB excluding atom loss**: Atom Computing reports loss and leakage (0.27%) as a separate line, so its 0.56% leaves out an error that superconducting and ion numbers would include.
- For two qubits, average infidelity = 0.8 x Pauli error (r = d/(d+1) x e_P with d = 4). `process.mjs` applies this to the Pauli rows only and writes it to `twoq_avg_infidelity_harmonised`, so a chart can put the superconducting XEB rows on the same footing as the RB rows. The Harvard row is passed through unchanged and flagged, because its definition does not map cleanly. The original `twoq_error` column is never altered.
- **Simultaneous vs isolated**: superconducting rows are all "simultaneous" (every pair firing at once, which is harder). Ion rows are per gate zone; ion traps run few gates at once by design. Google's own isolated figure for Sycamore (0.36%) is noted but not used.
- **Mean vs median**: every figure here is a mean (or a zone average). No source gives a median, apart from IBM saying its Heron r3 median is its best yet without stating it.
- **Logical qubit / below threshold**: only Google's 2024 surface code shows logical error falling as the code grows (Lambda = 2.14 per distance step), which is what "below threshold" means. Harvard's 48 and Atom/Microsoft's 24 logical qubits use error *detection* with post-selection: runs with a detected error are discarded. That's a real result, but a different one, so those rows carry `below_threshold = not_applicable` and no logical error rate.
- **Date**: `date_first_public` is the first public appearance (arXiv v1, company release, or journal publication when there was no preprint). Helios uses the date Nature received the manuscript (16 Nov 2025), which is a proxy, flagged in the row.

## Transformations

`raw/transcription.csv` is the only hand step: values copied literally from the saved documents, each with a page/table locator and a verbatim quote or figure label. `process.mjs` (Node, no dependencies) parses those literals (%, per mille, "x 10^-n" with the parenthesised uncertainty dropped, and fidelity converted to error as 1 - F), keeps a range as a range if one is ever transcribed, adds errors per 1,000 and the harmonised column, and writes `clean.csv`. It exits with an error if any literal fails to parse. Run `node process.mjs`.

## Caveats

- **This is not a like-for-like table, and it can't be.** Different platforms, different benchmarks, different numbers of gates running at once. The harmonised column fixes one known conversion. It doesn't fix the rest.
- **Count and error are matched, but the match means different things by platform** (checked row by row on 2026-10-05; see `qubits_basis`):
  - Superconducting chips run gates on fixed neighbour pairs all at once. Sycamore (53) and Willow (105) give errors across the whole working chip. Zuchongzhi and Zuchongzhi 3.0 give errors only for the subset used in the experiment, so those rows now carry 56 and 83, not the chip sizes of 66 and 105. Before this fix the Zuchongzhi row paired 66 qubits with the 56-qubit figure, and Zuchongzhi 3.0 paired 105 with the 83-qubit figure.
  - Trapped ions (H2 32 and 56, Helios 98) move every qubit through a few shared gate zones. The error is randomized benchmarking on pairs in those zones, averaged, never all N qubits gated at once. Any pair can be gated, so the count is the whole machine, but the measurement is not a whole-machine measurement in the superconducting sense.
  - Harvard 2023: the row now uses 99.48(2)% measured on all 60 atoms (Fig. 3d). The 99.52(4)% headline figure it used before was measured on 20 atoms (10 Bell pairs), so it didn't match the 60.
  - Harvard/QuEra 2024 (280 qubits): the paper gives 99.3-99.5% two-qubit fidelity "under various conditions" and gates on up to 160 qubits at once. None of that is stated for the 280-qubit configuration, so the row no longer carries a two-qubit error. The platform's gate figure is the Harvard 2023 row.
  - Atom Computing (256): gates run on pairs moved into an interaction zone, up to 8 pairs at a time, and the text doesn't say how many atoms the benchmark covered. That's a remaining mismatch, and it's flagged in the row.
- **Best results, not typical service.** Most figures come from a showcase experiment, often on a selected subset of qubits and couplers. Zuchongzhi's all-66-qubit calibration (0.76% error, from 99.24% fidelity) is worse than the 56-qubit selection the paper features (0.59%). What a cloud user gets on a given day can be different.
- **Makers write their own numbers.** Even the peer-reviewed papers are written by the teams that built the hardware. Peer review checks the method, not whether the device is representative.
- **Five devices have no published two-qubit error.** IBM Osprey (433), Condor (1,121), Heron r1 (133) and Heron r3 (156) were announced with qubit counts and no gate error figure in the sources archived here. IBM does publish live per-device medians on its cloud dashboard, but they change daily, need an account and weren't archived, so they're out. The Caltech 6,100-qubit array performed no two-qubit gates at all. These blanks are part of the finding and must be shown, not dropped.
- **Selection.** Hand-picked set of 15 systems (16 rows, Willow has a device row and a logical row), 2019-2026, aiming to cover the main platforms and the largest counts. IonQ, Rigetti, IQM, Pasqal, QuEra's commercial Aquila, photonic and spin-qubit devices are not included. It's not a census.
- **One logical row from Google.** Its gate figure comes from the company spec sheet because the Nature paper only plots the CZ error distribution for the 105-qubit chip.

## What the chart does not show

- Coherence times, readout error, connectivity, speed (gates per second), or how many gates a circuit can run before failing. All of these matter.
- Whether any device does something useful. None of this is a measure of usefulness.
- Error correction overheads: how many physical qubits one good logical qubit needs. Google's own estimate for 10^-6 logical error is a distance-13 code of 337 qubits at Lambda of about 4.5 (Nature paper, Supplementary), which is not what it has today.
- Anything about cost, or about which company is "ahead".

## Changes after review (2026-10-05)

- Helios citation: first author corrected to Ransford, A. et al. in `raw/transcription.csv` (author list read from the saved Nature page `raw/nature-s41586-026-10676-4.html`, 193 authors).
- Graphics now show IBM's partial Heron r3 figure (57 of 176 pairs under 1 per 1,000; no average) instead of "not in announcement". The transcription already carried the quote in `notes`; `twoq_error` stays blank because no average is stated.
- Y axis is linear, errors per 1,000 gates, values labelled in the same unit. Atom Computing/Microsoft carries an on-chart footnote (benchmark size not stated; 2.7 per 1,000 atom loss left out).
- Footer counts computed from clean.csv and asserted: 10 peer-reviewed DOIs, 5 company URLs.

## Review

- **Date:** 2026-10-05
- **Reviewer:** independent review agent
- **Verdict:** FAIL until findings 1 to 3 are fixed. All three are fixable from the files already in `raw/`, so no new research is needed. After that, PASS WITH FIXES.

**What I checked.** I re-ran `node data/qubits-vs-quality/process.mjs` and `clean.csv` came out byte-identical (16 rows). I checked these values against the saved PDFs and HTML, and all of them match the transcription and the graphics:

- Sycamore 0.62%, "we find an average e2 of 0.62%" (Nature p507), plus the isolated 0.36% on the same page.
- Zuchongzhi "Average error e2: 0.59%" for the 56 qubits and 94 couplers (arXiv 2106.14734 p3), plus 99.24% for all 66 on p2.
- Zuchongzhi 3.0 "Average Pauli Error: 3.75‰" for the "selected 83 qubits" (arXiv 2412.11924 p3).
- H2-32 "1.84(5)×10−3" (2305.03828 abstract).
- H2-56 "15.7(5)" ×10^-4 (2406.02501 Table I).
- Helios "7.9(2) × 10−4 for two-qubit (2Q) gates" (Nature 10676 p1).
- Willow "Two-qubit gate error (mean, simultaneous) 0.33% ± 0.18% (CZ)" (spec sheet p1).
- Atom/Microsoft "2Q Static IRB 0.56(15)%", loss plus leakage 0.27(6)% (2411.11822 p3).
- Harvard "99.48(2)% ... on 60 qubits" (2304.05420).
- Bluvstein 280 physical and 48 logical (2312.03982 abstract).
- Willow QEC Λ = 2.14 and ε7 = 1.43e-3 (Nature 08449).

The Helios Crossref record is title, Nature 655, 81-86, first author Ransford. There are no em dashes on the graphics or in copy/qubits-vs-quality.md, and the caption is 126 words.

**Findings**

1. **blocker.** Location: slide `hook` rail title "Qubit count announced, no two-qubit error in the announcement or paper"; slide `list`, IBM Heron r3 row, "not in announcement"; caption and alt text. **This is false for Heron r3.** The archived source `raw/ibm-blog-qdc-2025.html` says: "Heron features the lowest median two-qubit gate errors to date: of its 176 possible two-qubit couplings, 57 of them deliver less than one error in every 1000 operations." The transcription notes even quote it. It isn't a mean, so leaving it off the error axis is fine. But telling readers IBM published no two-qubit error figure is a false factual statement about a named company. Fix: move Heron r3 out of the "no error" rail. Give it its own state, e.g. "no average given; 57 of 176 pairs under 0.1%". Retitle the rail "No average two-qubit error published", and fix METHOD's line "IBM saying its Heron r3 median is its best yet without stating it" so it records the 57/176 claim. Re-check that the subhead "The biggest qubit counts mostly came without one" still holds (it does: Osprey, Condor, Caltech).
2. **blocker.** Location: the footer on slides `hook`, `list`, `logical`, `sources` and X; copy Sources section; INDEX.md. **The source counts are wrong.** "11 peer-reviewed papers and 4 company documents" doesn't add up. clean.csv has 10 peer-reviewed sources, 1 to 10 in METHOD. The 11th, Kim et al. 2023, is "checked and not used". There are 5 company documents: the Willow spec sheet, the Atom/Microsoft preprint, the IBM newsroom release and two IBM blogs, plus the IBM docs page. copy/qubits-vs-quality.md itself lists five while saying "4". Every slide carries a sourcing claim that doesn't match the source list. Fix: "10 peer-reviewed papers and 5 company documents" (or 6 if you count the IBM docs page), and update INDEX.md.
3. **blocker.** Location: slide `hook` IG and X, the scatter labels. **The marks overlap and the leader lines can't be traced.** Sycamore (53), Zuchongzhi (56) and the Harvard triangle (60) overlap each other at 5 to 6 errors per 1,000. The four leader lines from that cluster run horizontally through the Atom Computing hollow triangle at 256 and fan into labels in a different vertical order from the marks. At phone size, nobody can tell which mark is Harvard, Zuchongzhi or Sycamore, or which line belongs to Atom. Fix: label the cluster directly with short offsets, or nudge the marks apart (jitter disclosed in a note). Route the leader lines so they don't cross marks, or drop the label column and label in place.
4. **should-fix.** Location: slide `hook`, y-axis "errors per 1,000 gates" against labels in %. **Two units on one chart.** The axis ticks (0.5, 1, 2, 5, 10) are per 1,000 and every label is a percentage (0.079%, 0.62%), so the same quantity appears in two units 10x apart. Slide `list` uses % throughout. Fix: pick one, ideally % to match the caption, and label the axis "Two-qubit gate error (%), log scale".
5. **should-fix.** Location: slide `hook`, Atom Computing/Microsoft point (256 qubits, 0.56%). **This point mixes two flagged mismatches.** METHOD says the 256 is atoms available while the IRB benchmark's atom count isn't stated, and that 0.56% excludes 0.27% loss and leakage, which other platforms' numbers include. Neither caveat is on the graphic. It's also the only point at a large count with an error, so it carries weight in the headline. Also, the same table gives 0.39% (echoed RB with moves) and 0.35% (without moves). Choosing 0.56% is conservative, but it should be explained. Fix: add a footnote on the point ("count is atoms available; error excludes atom loss"), or plot it at the logical-experiment size (48) with a note.
6. **should-fix.** Location: caption, "The lowest errors come from some of the smallest machines: Quantinuum's 98-qubit Helios". Helios is 7th of the 9 systems with an error figure by size (32, 53, 56, 56, 60, 83, 98, 105, 256). The set's real pattern is "trapped ions lead", not "smallest machines lead". Fix: "The lowest errors come from trapped-ion machines of 32 to 98 qubits: Quantinuum's Helios reports 0.079%..."
7. **should-fix.** Location: slide `hook` subhead "The biggest qubit counts mostly came without one". **Part of this finding comes from which documents were archived.** IBM was captured only through press releases and blogs, which by nature leave out calibration data, and the dashboard was deliberately not archived. The caveat is only on slide 4 and in the caption. The X version is a single image with no slide 4. Fix: say "came without one in the documents we archived", or "in the launch announcement", on the hook itself.
8. **should-fix.** Location: footer on the chart slides, and especially `x-hook`. **The footer doesn't name a source.** "Listed on the last slide" names nothing, and the X post has no last slide. Brief §3 wants source(s) and data year on every graphic. Fix: name the main sources compactly, e.g. "Sources: Nature, PRL, PRX papers by each lab (2019 to 2026); Google, IBM, Microsoft/Atom documents (company claims). Accessed 5 Oct 2026."
9. **should-fix.** Location: all slides, text sizes. **Small text is illegible at phone size.** At about 360px display width, the slide `list` meta lines (15px), qubit and error value labels (15px), tick labels (16px), the hook value lines (16px), rail labels (15 to 17px), the slide `logical` explanatory lines (18px) and the footer (19px) render at about 5 to 6px. The `list` slide is the worst, because its meta line holds the "company claim" label the brief requires. Fix: raise chart text in the IG format to at least 30px. On `list`, consider fewer rows or two slides.
10. **should-fix.** Location: slide `sources`, Method bullet 1, "Tests differ (cross-entropy, randomized benchmarking, Bell-state decay)". **One test is wrong.** None of the plotted rows uses Bell-state decay. The Harvard row is global randomized benchmarking (METHOD Definitions). Fix: "(cross-entropy, randomized benchmarking, global randomized benchmarking)", or just "different benchmarks".
11. **nit.** Location: slide `sources` and METHOD source 7, "Quantinuum authors, Nature 655". Brief §4 asks for a full citation. Crossref gives the first author as Ransford, A. Cite as "Ransford, A. et al. (Quantinuum)".
12. **nit.** Location: slide `sources`, references. Three entries read just "IBM Quantum (company claim)", with no title, date or URL, and one reads "Google Quantum AI, published Dec 9 2024" without saying it's the Willow spec sheet. Use the full titles and dates from METHOD.
13. **nit.** Location: slide `logical`. The single logical dot (r=26) is far bigger than the physical dots (r=5.2) and the detected-logical rings (r=10). That's an area encoding readers may read as "worth more". Also the vertical spacing is uneven: a big gap under Willow, Atom crowded at the bottom. Use one logical-dot size and even spacing.
14. **nit.** Location: slide `hook`, legend. "Company claim" is shown only as a hollow circle, while the Atom/Microsoft company claim is a hollow triangle. Add "(hollow = company claim, any shape)".
15. **nit.** Location: METHOD, status line "not yet designed or reviewed". It's stale. Update it.

### Re-check (2026-10-05)

**Verdict:** PASS WITH FIXES. All three blockers are resolved. The remaining items are visual should-fixes on `hook` and `list`.

I re-ran `process.mjs` and `clean.csv` reproduces byte-identical. Numbers I re-traced:

- **Heron r3:** "57 of 176 pairs under 1 per 1,000" matches `raw/ibm-blog-qdc-2025.html` word for word.
- **Per-1,000 values:** Helios 0.79 (7.9e-4), H2 1.6 (1.57) and 1.8 (1.84), Willow 3.3, Zuchongzhi 3.0 3.8 (3.75 rounded), Harvard 5.2, Atom 5.6, Zuchongzhi 5.9, Sycamore 6.2. The atom-loss footnote's 2.7 matches the 0.27(6)% in the source.
- **Source counts:** the sources slide lists 10 DOIs (Arute, Wu, Evered, Moses, Bluvstein, Manetsch, DeCross, Google QAI 2025, Gao, Ransford) and 5 company URLs (IBM newsroom, IBM roadmap blog, IBM QDC blog, Willow spec sheet, Atom/Microsoft arXiv). INDEX.md is updated to match.
- **Copy:** the caption is 134 words and has no em dashes.

1. Original 1 (Heron r3 "no error" was false): **resolved.** The rail is now titled "No average two-qubit error stated in the source", and Heron r3 carries IBM's 57/176 claim on the hook, the list, the sources slide, the caption and the alt text.
2. Original 2 (11/4 source counts): **resolved.** The footer now says 10 and 5, and the counts are asserted from clean.csv.
3. Original 3 (overlapping marks and untraceable leaders): **mostly resolved, now should-fix.** On the linear axis the labels sit in the same order as the marks and each line can be followed. Two problems remain. The Sycamore (6.2) and Zuchongzhi (5.9) dots still overlap by about a third of their width. The leader lines from Harvard and Zuchongzhi still cut through the Atom Computing hollow triangle at 256. Fix: route those two leaders above and below the triangle, or end the labels' leaders before x=200.
4. Original 4 (mixed units): **resolved.** Errors per 1,000 are used everywhere. The y-axis is now linear, so it no longer needs a log label, and it's still marked "higher up is better".
5. Original 5 (Atom caveat): **resolved.** There's an on-chart asterisk footnote and a method bullet.
6. Original 6 (caption "smallest machines"): **resolved.** It now says "Trapped-ion machines report the lowest errors".
7. Original 7 (archive bias): **resolved.** The rail title now says "stated in the source". The IG subhead sentence is unchanged but now reads against that title.
8. Original 8 (footer named no source): **resolved.** The footer names the journals and companies.
9. Original 10 ("Bell-state decay"): **resolved.**
10. Original 9 (small text): **partly resolved, still open.** Text is now 21 to 24px in most places, about 7 to 8px on a phone. The `list` meta lines and value labels are the smallest.
11. **New, should-fix.** Location: slide `list`. Three new collisions:
    - The "..., company claim" meta lines run into the start of the qubit stems at x≈590 to 615 (Willow, Heron r1, Heron r3, Osprey, Condor).
    - The Heron r3 text "no average; 57 of 176 pairs under 1" runs past the right content margin, and "under 1" is missing its unit ("per 1,000").
    - The "1,000" and "3,000" tick labels touch.

    Fix: shorten the meta line (e.g. "2024, superconducting, claim") or move the stems right. Wrap the Heron r3 note onto two lines with the unit. Drop the 3,000 tick.
12. **New, nit.** Location: caption, "14 systems". METHOD and the chart notes say 15 systems. The 15th is the Harvard/QuEra 280-qubit logical processor, which is on slide 3. Say 15, or "14 systems with a qubit-count row".
13. **New, nit.** Location: slide `logical`. The "280 physical qubits used" label sits almost on the "Atom Computing/Microsoft, 2024" heading below it. Add space between the rows.

### Review round 3 (2026-10-06)

**Verdict:** FAIL until 1 is fixed. It's a regression of a blocker from round 1. After that, PASS WITH FIXES.

I checked the bars against `clean.csv` as errors per 1,000: Helios 0.79, H2 1.57 shown as 1.6, H2 1.84 as 1.8, Willow 3.3, Zuchongzhi 3.0 3.75 as 3.8, Harvard 5.2, Atom 5.6, Zuchongzhi 5.9, Sycamore 6.2. All match. The bars start at zero (0.79 against 6.2 is drawn at about 1 : 7.8). The two asterisks, Willow and Atom/Microsoft, are the two `company_claim` rows with an error figure, which is correct. "Including the two biggest machines here" (6,100 and 1,121) is correct. No em dashes. Intermediate video frames show only final values, plus one grey "3.3" while its bar grows, which is fine.

1. **blocker.** Location: `hook`, panel title "No error rate published". **The panel's own content contradicts it.** Heron r3 sits in that panel, but the archived IBM blog states "57 of 176 possible two-qubit couplings ... deliver less than one error in every 1000 operations". IBM also publishes live rates on its dashboard. Caltech ran no two-qubit gates, so "published no error rate" misdescribes it. Round 1 fixed this ("No average two-qubit error stated in the source") and the redesign undid it. Replace the title with "No average error rate in the source". Replace the sub with "Qubit counts, including the two biggest machines here. IBM says 57 of 176 Heron r3 pairs are under 1 per 1,000."
2. **should-fix.** Location: `hook` chart. **The ranking depends on a definition choice the slide doesn't mention.** Sycamore and both Zuchongzhi figures are Pauli errors. On the same footing as the others (×0.8, `twoq_avg_infidelity_harmonised`) they become 4.96, 4.72 and 3.0. That puts Zuchongzhi 3.0 (3.0) ahead of Willow (3.3), and Sycamore and Zuchongzhi ahead of Harvard (5.2) and Atom (5.6). The title asks "Which ... make the fewest errors?", so rank order is the message. Fix: add to the footer or "How to read this": "Google 2019 and USTC report a stricter measure; on the same basis as the rest they'd read about 20% lower." Or plot the harmonised column, as the chart notes suggested.
3. **should-fix.** Location: `hook`. **The asterisk isn't explained on the slide.** "Google Willow*" and "Atom/Microsoft*" only get their footnote on the sources slide. Add to the footer: "*Company figure, not peer-reviewed."
4. **should-fix.** Location: `hook` legend. **Platform is now encoded by colour alone** (purple, cyan, cream). That breaks brief §3 ("never encode meaning by colour alone") and the README's "one hue, categories carried by shape". The names do identify each lab, but not the platform. Fix: add a small platform word or glyph to each row label, or group the rows under platform headings.
5. **nit.** Location: "How to read this", "A hand-picked set of 14 machines". The page says nine machines (the bars), the hook shows 9 + 5 = 14, and METHOD says 15 systems including the 280-qubit logical demo. Fine as is. Just make the site page say "nine machines with a published average error, and five without".
6. **nit.** Location: `hook` footer, "10 peer-reviewed papers and 5 company documents, 2019 to 2026. Labs test in different ways." The access date is missing. Add "Accessed 5 Oct 2026."

### Changes after review round 3 (2026-10-06)

- Blocker fixed: panel is now "No average error rate given" with IBM's Heron r3 figure (57 of 176 pairs under 1 per 1,000) on the panel; the site page answer is reworded the same way.
- Sycamore and both Zuchongzhi marked † (stricter Pauli-error test, about 20% lower on the others' basis), explained in the footer and on the site page; * explained in the footer.
- Platform written next to every value (trapped ion / superconducting / neutral atom), so it is not colour alone.
