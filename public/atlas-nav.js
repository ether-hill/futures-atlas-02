/*
  THE single Futures Atlas global nav — one component for every surface.

  Loaded as a plain <script src="/atlas-nav.js" defer> by the hub (Next), the
  Vite tools (Prism, Quantum Sandbox), Social Composer (Next export) and the
  static zone bundles (Hollow Villages / Underground Intelligence / The Odds).
  It self-injects /atlas-nav.css, so one script tag is all any page needs.

  Renders the sticky frosted bar: brand + (on a project page) a breadcrumb
  switcher, the primary links, and a theme toggle; hides on scroll-down. On a
  project page it also appends the shared footer. Theme is one class (html.dark)
  + one key (localStorage "fa-theme"): dark by default on project pages, light
  on the hub. Edit THIS file to change the nav anywhere.
*/
(function () {
  var FA_PROJECTS = [
    { name: "Social Composer", path: "/social-composer" },
    { name: "Prism", path: "/prism" },
    { name: "Quantum Sandbox", path: "/quantum-sandbox" },
    { name: "The Odds", path: "/odds-of-surviving-ai" },
    { name: "Underground Intelligence", path: "/underground-intelligence" },
    { name: "The Hollow Villages", path: "/hollow-villages" },
  ];
  var LINKS = [
    { name: "Home", path: "/" },
    { name: "Projects", path: "/projects" },
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
  ];

  // current project = longest project path that prefixes the URL (null on the hub)
  var p = location.pathname, cur = null, best = 0;
  FA_PROJECTS.forEach(function (x) {
    if (p.indexOf(x.path) === 0 && x.path.length > best) { cur = x; best = x.path.length; }
  });
  var isProject = !!cur;

  // self-inject the one stylesheet so a single <script> tag suffices anywhere
  if (!document.querySelector('link[data-fa-nav-css]')) {
    var css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "/atlas-nav.css";
    css.setAttribute("data-fa-nav-css", "");
    (document.head || document.documentElement).appendChild(css);
  }

  // theme: one key, one class. dark-default on project pages, light on the hub.
  var root = document.documentElement;
  function storedTheme() { try { return localStorage.getItem("fa-theme"); } catch (e) { return null; } }
  (function applyDefault() {
    var s = storedTheme();
    var dark = isProject ? s !== "light" : s === "dark";
    root.classList.toggle("dark", dark);
  })();

  var CHEV = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
  var MOON = '<svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M16 11.2A6.2 6.2 0 1 1 8.8 4a4.8 4.8 0 0 0 7.2 7.2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>';
  var SUN = '<svg width="16" height="16" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="3.6" stroke="currentColor" stroke-width="1.5"/><path d="M10 2.2v2M10 15.8v2M2.2 10h2M15.8 10h2M4.6 4.6l1.4 1.4M14 14l1.4 1.4M15.4 4.6L14 6M6 14l-1.4 1.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
  var mark = '<img src="/fa.svg" alt="" aria-hidden="true" style="display:block;height:20px;width:auto" />';

  function activeLink(path) {
    return path === "/" ? p === "/" : p.indexOf(path) === 0;
  }
  var navlinks = LINKS.map(function (l) {
    return '<a class="fa-shell__navlink' + (activeLink(l.path) ? " is-active" : "") + '" href="' + l.path + '"' +
      (activeLink(l.path) ? ' aria-current="page"' : "") + ">" + l.name + "</a>";
  }).join("");

  var crumbHtml = "";
  if (isProject) {
    var items = FA_PROJECTS.map(function (x) {
      var c = x.path === cur.path;
      return '<a role="menuitem" href="' + x.path + '" class="fa-shell__item' + (c ? " is-current" : "") + '"' + (c ? ' aria-current="true"' : "") + ">" + x.name + "</a>";
    }).join("");
    crumbHtml =
      '<span class="fa-shell__sep" aria-hidden="true">/</span>' +
      '<div class="fa-shell__crumb">' +
        '<button type="button" class="fa-shell__current" aria-haspopup="menu" aria-expanded="false" aria-label="Switch project">' +
          "<span>" + cur.name + '</span><span class="fa-shell__chev" aria-hidden="true">' + CHEV + "</span></button>" +
        '<div class="fa-shell__menu" role="menu" hidden>' + items +
          '<span class="fa-shell__menusep"></span>' +
          '<a role="menuitem" href="/projects" class="fa-shell__item fa-shell__item--accent">View all projects →</a></div>' +
      "</div>";
  }

  var h = document.createElement("header");
  h.className = "fa-shell";
  h.innerHTML =
    '<div class="fa-shell__left">' +
      '<a class="fa-shell__home" href="/" aria-label="Futures Atlas home">' +
        '<span class="fa-shell__mark" aria-hidden="true">' + mark + "</span>" +
        '<span class="fa-shell__word">Futures Atlas</span></a>' +
      crumbHtml +
    "</div>" +
    '<nav class="fa-shell__right" aria-label="Primary">' +
      '<div class="fa-shell__nav">' + navlinks + "</div>" +
      '<button type="button" class="fa-shell__toggle" aria-label="Toggle theme"></button></nav>';

  function mount() {
    if (document.querySelector("header.fa-shell")) return; // guard against double-mount
    document.body.insertBefore(h, document.body.firstChild);

    // shared footer — only on project pages, unless the page brings its own
    // (hub + Social Composer set data-fa-no-footer on <html> and supply theirs)
    if (isProject && !root.hasAttribute("data-fa-no-footer") && !document.querySelector("footer.fa-foot")) {
      var foot = document.createElement("footer");
      foot.className = "fa-foot";
      foot.innerHTML =
        '<div class="fa-foot__inner">' +
        '<p class="fa-foot__lede">The future is plural.</p>' +
        '<p class="fa-foot__blurb">Futures Atlas collects speculative-design projects that each draw one possible world in full — grounded, specific, and built to be argued with.</p>' +
        '<div class="fa-foot__row">' +
        '<span class="fa-foot__brand">FUTURES ATLAS</span>' +
        '<nav class="fa-foot__nav">' +
        '<a class="fa-foot__link" href="/">Home</a>' +
        '<a class="fa-foot__link" href="/about">About</a>' +
        '<a class="fa-foot__link" href="/contact">Contact</a></nav>' +
        '<span class="fa-foot__tag">A catalogue of possible worlds · MMXXVI</span>' +
        '</div></div>';
      document.body.appendChild(foot);
    }

    // breadcrumb dropdown (project pages only)
    var btn = h.querySelector(".fa-shell__current");
    if (btn) {
      var menu = h.querySelector(".fa-shell__menu"), crumb = h.querySelector(".fa-shell__crumb");
      var setOpen = function (o) { btn.setAttribute("aria-expanded", o); menu.hidden = !o; };
      btn.addEventListener("click", function (e) { e.stopPropagation(); setOpen(menu.hidden); });
      document.addEventListener("mousedown", function (e) { if (!crumb.contains(e.target)) setOpen(false); });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape") setOpen(false); });
    }

    // hide on scroll-down, reveal on scroll-up
    var lastY = window.scrollY;
    window.addEventListener("scroll", function () {
      var y = window.scrollY;
      if (y > lastY && y > 90) h.classList.add("is-hidden");
      else h.classList.remove("is-hidden");
      lastY = y;
    }, { passive: true });

    // theme toggle
    var toggle = h.querySelector(".fa-shell__toggle");
    function paint() { toggle.innerHTML = root.classList.contains("dark") ? SUN : MOON; }
    paint();
    toggle.addEventListener("click", function () {
      var d = root.classList.toggle("dark");
      try { localStorage.setItem("fa-theme", d ? "dark" : "light"); } catch (e) {}
      paint();
    });
  }
  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);
})();
