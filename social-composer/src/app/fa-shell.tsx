/**
 * Global Futures Atlas master header — the persistent platform breadcrumb that
 * sits above every project so the visitor knows they're still inside the Futures
 * Atlas and can click straight back to it. Simple, black, anchored top-right.
 * `href="/"` resolves to the Atlas home (raw <a>, unaffected by the basePath).
 */
export function FaShell() {
  return (
    <header className="fa-shell">
      <a className="fa-shell__home" href="/" aria-label="Back to Futures Atlas">
        <span className="fa-shell__back" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
        </span>
        <span className="fa-shell__mark" aria-hidden="true">
          <svg width="15" height="15" viewBox="0 0 64 64" fill="currentColor"><path d="M15 13H51V24H27V29H47V40H27V51H15Z" /></svg>
        </span>
        <span className="fa-shell__word">Futures Atlas</span>
      </a>
    </header>
  );
}
