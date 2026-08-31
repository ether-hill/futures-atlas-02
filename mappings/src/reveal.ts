// The standard Atlas text entrance — the homepage Reveal, verbatim thresholds.
const io = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      }
    }
  },
  { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
);

export function observeReveals(root: ParentNode) {
  root.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));
}
