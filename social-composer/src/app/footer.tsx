// Shared Futures Atlas footer — mirrors the Atlas home footer ("The future is
// plural." + the FUTURES ATLAS row) and themes with the light/dark toggle.
// Styling lives under .fa-foot* in globals.css.
export function Footer() {
  return (
    <footer className="fa-foot">
      <div className="fa-foot__inner">
        <p className="fa-foot__lede">The future is plural.</p>
        <p className="fa-foot__blurb">
          Futures Atlas collects speculative-design projects that each draw one possible world in
          full — grounded, specific, and built to be argued with.
        </p>
        <div className="fa-foot__row">
          <span className="fa-foot__brand">FUTURES ATLAS</span>
          <nav className="fa-foot__nav">
            <a className="fa-foot__link" href="/">Home</a>
            <a className="fa-foot__link" href="/about">About</a>
            <a className="fa-foot__link" href="/contact">Contact</a>
          </nav>
          <span className="fa-foot__tag">A catalogue of possible worlds · MMXXVI</span>
        </div>
      </div>
    </footer>
  );
}
