// Shared Futures Atlas footer (dark band) — matches the Atlas home footer and
// the other project pages. Styling lives under .fa-foot* in globals.css.
export function Footer() {
  return (
    <footer className="fa-foot">
      <span className="fa-foot__brand">FUTURES ATLAS</span>
      <nav className="fa-foot__nav">
        <a className="fa-foot__link" href="/">Home</a>
        <a className="fa-foot__link" href="/about">About</a>
        <a className="fa-foot__link" href="/contact">Contact</a>
      </nav>
      <span className="fa-foot__tag">A catalogue of possible worlds · MMXXVI</span>
    </footer>
  );
}
