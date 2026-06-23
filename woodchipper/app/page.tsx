import Engine from "./Engine";
import { PROGRAMS, FACTCHECKS, STUDIES, BUDGET } from "../data/model";

const vkey = (v: string) => (v === "Lacks context" ? "Lacks" : v);

export default function Page() {
  return (
    <main>
      <header className="wf-hero">
        <span className="wf-kick">Futures Atlas · Research engine · № 02</span>
        <h1>Woodchipper <em>Futures</em></h1>
        <p className="wf-lede">
          In early 2025 the Trump administration&apos;s DOGE effort — with Elon Musk out front — fed USAID &ldquo;into the wood
          chipper,&rdquo; cancelling ~83% of its programs. Sit in the January-2025 chair and pull the levers yourself.
          Each path branches into a <strong>fact-checked, source-cited</strong> constellation of outcomes. Every number links
          to its study; modeled projections are labelled as projections, never counted deaths.
        </p>
      </header>

      <Engine />

      <div className="wf-body">
        {/* budget reality */}
        <section className="wf-sec">
          <span className="wf-kick">The thing you&apos;re cutting</span>
          <h2>0.6% of the budget</h2>
          <p>
            USAID disbursed about <strong>${BUDGET.usaidB}B</strong> in FY2023 — roughly <strong>{BUDGET.realPct}%</strong> of
            a ~$6.8 trillion federal budget. Americans, polled, guessed foreign aid was about <strong>{BUDGET.publicGuessPct}%</strong>.
            The gap between what people think they&apos;re cutting and what they&apos;re actually cutting is most of the story.
          </p>
          <div className="wf-budget">
            <div className="wf-bar guess"><div className="bl">What the public thinks aid is</div><div className="track"><i style={{ width: `${BUDGET.publicGuessPct}%` }} /></div><div className="v">{BUDGET.publicGuessPct}%</div></div>
            <div className="wf-bar real"><div className="bl">What USAID actually was</div><div className="track"><i style={{ width: `${Math.max(BUDGET.realPct, 1)}%` }} /></div><div className="v">{BUDGET.realPct}%</div></div>
          </div>
          <p className="wf-disclaim">Sources: <a href={BUDGET.cite.url} target="_blank" rel="noopener noreferrer">{BUDGET.cite.label}</a>, <a href={BUDGET.pollCite.url} target="_blank" rel="noopener noreferrer">{BUDGET.pollCite.label}</a>. Documented questioned costs ran ~${BUDGET.wasteM}M per half-year — a fraction of 1% of spend, against an agency that already had clean audits and an Inspector General.</p>
        </section>

        {/* the record */}
        <section className="wf-sec">
          <span className="wf-kick">The record</span>
          <h2>What was actually cut</h2>
          <p>Program by program — what it funded, what was terminated, what has already been documented on the ground, and what the models project. Projections are <span className="em">modeled, not counted</span>.</p>
          <div className="wf-tablewrap">
            <table className="wf-table">
              <thead><tr><th>Program</th><th>Scale</th><th>Cut</th><th>Documented effect</th><th>Projection</th></tr></thead>
              <tbody>
                {PROGRAMS.map((p) => (
                  <tr key={p.name}>
                    <td className="prog">{p.name}</td>
                    <td>{p.scale}</td>
                    <td>{p.cut}</td>
                    <td>{p.effect}</td>
                    <td><span className="proj">{p.projection}</span><br /><a href={p.cite.url} target="_blank" rel="noopener noreferrer">{p.cite.label} ↗</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* the justification */}
        <section className="wf-sec">
          <span className="wf-kick">The case that was made</span>
          <h2>The justification, fact-checked</h2>
          <p>The cuts were sold on specific examples of waste. The Washington Post found that of the 12 marquee cases the White House cited, <strong>only one</strong> held up.</p>
          <div className="wf-fc">
            {FACTCHECKS.map((fc) => (
              <div className="fc" key={fc.claim}>
                <span className={`verdict ${vkey(fc.verdict)}`}>{fc.verdict}</span>
                <div>
                  <div className="claim">&ldquo;{fc.claim}&rdquo;</div>
                  <div className="who">{fc.who}</div>
                  <div className="note">{fc.note} <a href={fc.cite.url} target="_blank" rel="noopener noreferrer">{fc.cite.label} ↗</a></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* the studies */}
        <section className="wf-sec">
          <span className="wf-kick">The evidence</span>
          <h2>What the studies project</h2>
          <p>The engine&apos;s numbers come from these. They disagree — by an order of magnitude — because they assume different things about how deep, how permanent, and how backfilled the cuts are. That spread is the honest picture.</p>
          <div className="wf-studies">
            {STUDIES.map((s) => (
              <div className="study" key={s.name}>
                <span className="tag">{s.kind}</span>
                <div className="sname">{s.name}</div>
                <div className="sf">{s.finding}</div>
                <a href={s.cite.url} target="_blank" rel="noopener noreferrer">{s.cite.label} ↗</a>
              </div>
            ))}
          </div>
          <p className="wf-disclaim">Every mortality figure above and in the engine is a <strong>modeled projection</strong> under a stated scenario — not an observed body count. Estimates range from CGD&apos;s ~0.5–1.6M to The Lancet&apos;s &gt;14M by 2030; they should not be averaged or blended, and each depends on freeze length, horizon, and donor backfill.</p>
        </section>

        {/* the counterfactual */}
        <section className="wf-sec">
          <span className="wf-kick">The road not taken</span>
          <h2>Audit, don&apos;t woodchip</h2>
          <p>
            USAID had real, reformable problems: ~89% of its core accounts were locked by Congressional earmarks, work was fragmented across 20+ agencies, a handful of Beltway contractors absorbed the money and only ~6% reached local organisations, and procurement was slow and risk-averse. Even Republican former administrators agreed a program review was legitimate.
          </p>
          <p>
            But the tools on the table were <span className="em">audit, localize, consolidate, results-based funding</span> — not abolition. As former administrator Andrew Natsios put it: &ldquo;Reform comes incrementally and carefully, not with a sledgehammer&hellip; course correct, not course destroy.&rdquo; The engine&apos;s &ldquo;Targeted audit&rdquo; path is that counterfactual: recover the documented waste, keep the programs running.
          </p>
        </section>

        {/* two framings */}
        <section className="wf-sec">
          <span className="wf-kick">Hold both</span>
          <h2>Two honest readings</h2>
          <div className="wf-framings">
            <div className="framing a">
              <h3>Reckless destruction</h3>
              <p>The stated justifications were largely false — 11 of 12 marquee examples didn&apos;t hold up, the flagship &ldquo;$50M Gaza condoms&rdquo; was invented, and Musk himself said &ldquo;some of the things I say will be incorrect.&rdquo; Documented waste was a fraction of 1%; a full oversight apparatus already existed; no real audit preceded the cuts; the Inspector General was fired the day after warning of collapse; courts found the shutdown likely unlawful. Peer-reviewed models project millions of additional deaths, and clinic-level disruption is already observed.</p>
            </div>
            <div className="framing b">
              <h3>Real problems worth fixing</h3>
              <p>USAID genuinely suffered from heavy earmarking, fragmentation, contractor concentration (only ~6% reaching local orgs), and slow procurement. Documented fraud was real — a $3.1M Chemonics settlement, a $9M Syria diversion, a bribery debarment. Even critics of the dismantling agreed a new administration&apos;s review was appropriate and that a serious reform agenda already existed across CGD, Brookings and MFAN. The objection is to abolition by sledgehammer — not to reform.</p>
            </div>
          </div>
        </section>

        <p className="wf-disclaim">This is a research instrument, not a verdict. It models a contested, fast-moving topic from public, citable sources (see each link). Figures were current as of the research date and should be checked against their primaries before republication.</p>
        <div className="wf-foot">Imagine freely · Cite everything · MMXXVI</div>
      </div>
    </main>
  );
}
