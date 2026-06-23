import Calibration from "./Calibration";

// Project assets live on the host root (served at /projects/*), so they resolve
// without the basePath and double as the page's OG image set.
const A = "/projects/";

export default function Page() {
  return (
    <main>
      {/* ── the tool ──────────────────────────────────────────────────────── */}
      <div className="stf-tool">
        <div className="app"><Calibration /></div>
      </div>

      {/* ── the project: full writeup for readers + the Social Composer ─────── */}
      <article className="stf-about">
        <span className="kicker">Futures Atlas · № 01 · Calibration</span>
        <h2>Swipe the Future</h2>
        <p>
          <span className="em">Swipe the Future</span> is a calibration instrument disguised as a card game. You pick a
          line of work — programmer, designer, lawyer, crypto trader, energy — and swipe <b>Believe</b> or <b>Doubt</b> on
          six grounded claims about how AI and quantum computing are reshaping it. Then the deck shows you something most
          futures content never does: not whether you were right, but <b>how far your gut sat from where the evidence
          actually lands.</b>
        </p>
        <p>
          It is the first entry in a family of swipe-based futures tools, and the clearest expression of the atlas&apos;s
          rule — <span className="em">imagine freely, cite everything.</span> Every card carries a real, resolvable source;
          nothing is invented where it claims to be real.
        </p>

        <figure>
          <img src={`${A}swipe-the-future.jpg`} alt="Swipe the Future — choosing a vantage point and the claim deck" loading="lazy" />
          <figcaption>The deck. Pick a vantage point, then judge six claims one swipe at a time.</figcaption>
        </figure>

        <h3>The mechanic</h3>
        <p>
          Short attention span is the brief: one screen, one verb, a fast payoff. A claim arrives as a paper card on a deep
          petrol field. You drag it — right to believe, left to doubt — or tap the buttons, or use the arrow keys; the same
          loop works by touch, mouse and keyboard. Commit past the threshold and the card flings off.
        </p>
        <p>
          Then it flips to the signature element: an <b>evidence meter</b>. A track runs from <em>Unlikely</em> to <em>Already
          real</em>, with a solid marker for where the evidence sits and a hollow marker for where you called it. The gap
          between the two markers <b>is the product.</b> The reveal is never &ldquo;right or wrong&rdquo; — it&apos;s a measurement of
          distance between instinct and evidence.
        </p>

        <div className="stf-meterdemo" aria-hidden="true">
          <div className="kicker">The evidence meter</div>
          <div className="track"><span className="fill" /><span className="ev" /><span className="you" /></div>
          <div className="ends"><span>Unlikely</span><span>Already real</span></div>
        </div>

        <figure>
          <img src={`${A}swipe-the-future-2.jpg`} alt="A card reveal: the evidence meter with both markers, the grounded note and a linked source" loading="lazy" />
          <figcaption>The reveal. Evidence marker, your-call marker, a grounded one-line note, and a source that links out.</figcaption>
        </figure>

        <h3>The honesty move</h3>
        <p>
          Some claims are genuinely contested — the evidence is split, not settled. Those cards never count against you; the
          reveal reads <em>&ldquo;Judgment call — the evidence is genuinely split here.&rdquo;</em> Scoring excludes them entirely. A
          calibration tool that punished you for disagreeing with an open question would be lying about how much we know, and
          the atlas&apos;s whole credibility rests on not doing that.
        </p>

        <figure>
          <video src={`${A}swipe-the-future-demo.webm`} poster={`${A}swipe-the-future-2.jpg`} controls muted loop playsInline preload="metadata" />
          <figcaption>A run in motion — commit a swipe and the card flips to its evidence meter.</figcaption>
        </figure>

        <blockquote className="stf-quote">The reveal is not right or wrong. The gap between your gut and the evidence is the product.</blockquote>

        <h3>The journey</h3>
        <p>
          The prototype was a single HTML file — fast to feel, loose under the hood. Rebuilding it for the atlas meant pulling
          every claim out of the markup and into a typed data layer, so content is source-checked once and reused everywhere:
          adding a sixth vantage point or a seventh card is now a data edit, not a code change. Each source was upgraded from a
          bare label to a resolvable primary link — NIST, Google Quantum AI, the IEA, Goldman Sachs, Bloomberg Law and the
          rest — so every reveal can be followed to its origin.
        </p>
        <p>
          The interaction was hardened too: pointer listeners are cleaned up per card, a lock guards against a double-commit
          from a simultaneous drag and key-press, and replaying or switching worlds fully resets state. The deck is completable
          by drag alone, by buttons alone, or by keyboard alone, on phone and desktop, with no stuck or duplicated cards.
        </p>

        <h3>The look</h3>
        <p>
          The identity is deliberately not the generic AI default. An aged-pigment palette — deep petrol, paper cards, ink —
          with four signal colours: verdigris for likely, oxblood for unlikely, brass for already-real, slate for contested.
          The type carries meaning: <b>Instrument Serif</b> voices the human claims, <b>Space Mono</b> the machine measurements,
          Hanken Grotesk the interface in between. The serif/mono split is semantic, not decorative.
        </p>

        <div className="stf-stats">
          <div className="stf-stat"><div className="n">5</div><div className="k">vantage points — programmer, designer, lawyer, crypto trader, energy</div></div>
          <div className="stf-stat"><div className="n">30</div><div className="k">source-checked claims, each linked to a primary reference</div></div>
          <div className="stf-stat"><div className="n">6</div><div className="k">cards per run — depth comes from more lenses, not longer decks</div></div>
        </div>

        <h3>The outcome</h3>
        <p>
          At the end you get a calibration score — matches out of the scorable calls — and a futures profile drawn from the
          shape of your answers: <em>Caught Flat-Footed</em> if you doubted things already shipping, <em>The Accelerationist</em>
          if you ran ahead of the proof, <em>Well Calibrated</em>, <em>Roughly Tuned</em>, or <em>The Skeptic</em>. Then the
          insight moment — <b>&ldquo;Where you and the evidence parted ways&rdquo;</b> — names the specific claims you most misjudged,
          badged <em>Already real</em> or <em>Ahead of evidence</em>. Claim by claim, it shows you where the present outran your
          intuition.
        </p>

        <figure>
          <img src={`${A}swipe-the-future-3.jpg`} alt="The calibration result: score, futures profile, and the claims you misjudged" loading="lazy" />
          <figcaption>The result. A score, a profile, and the exact claims where instinct and evidence diverged.</figcaption>
        </figure>

        <h3>Where it goes</h3>
        <p>
          A completed run is built to become a shareable artefact — the growth surface — feeding straight into the atlas&apos;s
          Social Composer. The data shape leaves the door open for what&apos;s next: a &ldquo;you vs the crowd&rdquo; comparison once results
          aggregate, a timeline mode that swipes <em>when</em> rather than <em>whether</em>, and more vantage points. The ceiling for
          v1 is six cards per lens; the depth is in the lenses.
        </p>

        <p className="foot" style={{ textAlign: "left", marginTop: 28 }}>Imagine freely · Cite everything · MMXXVI</p>
      </article>
    </main>
  );
}
