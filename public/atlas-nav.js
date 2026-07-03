/*
  THE single Futures Atlas global nav — one component for every surface.

  Loaded as a plain <script src="/atlas-nav.js" defer> by the hub (Next), the
  Vite tools (Generatives, Quantum Sandbox), Social Composer (Next export) and the
  static zone bundles (Village Oracle / Underground Intelligence / The Odds).
  It self-injects /atlas-nav.css, so one script tag is all any page needs.

  Desktop: a sticky frosted bar — brand + (on a project page) a breadcrumb
  switcher, the primary links, and a theme toggle; hides on scroll-down.
  Tablet/mobile: the links collapse into an animated hamburger sheet that holds
  the primary links, the current project's own pages (under its title), and the
  theme toggle. Theme is one class (html.dark) + one key (localStorage
  "fa-theme"): dark by default on project pages, light on the hub.
  Edit THIS file to change the nav anywhere.
*/
(function () {
  // pages: a project's own internal tabs — shown in the mobile sheet under the
  // project title (and as the slim desktop sub-nav, rendered by each zone).
  var FA_PROJECTS = [
    { name: "Trajectories", path: "/trajectories" },
    { name: "Hyperscale", path: "/hyperscale" },
    { name: "Signal Reactor", path: "/signal-reactor" },
    { name: "Quantum Spark", path: "/quantum-spark" },
    { name: "Quantum Dominance", path: "/quantum-dominance" },
    { name: "Woodchipper Futures", path: "/woodchipper" },
    { name: "Swipe the Future", path: "/swipe-the-future" },
    { name: "Social Composer", path: "/social-composer" },
    { name: "Generatives", path: "/generatives" },
    { name: "Literal Frequency", path: "/literal-frequency" },
    { name: "Quantum Sandbox", path: "/quantum-sandbox" },
    { name: "The Odds", path: "/theodds", theme: "dark" },
    { name: "Underground Intelligence", path: "/underground-intelligence", pages: [
      { name: "Story", path: "/underground-intelligence/story" },
      { name: "Dashboard", path: "/underground-intelligence/dashboard" },
      { name: "Research", path: "/underground-intelligence/research" },
    ] },
    { name: "Village Oracle", path: "/village-oracle", theme: "light", pages: [
      { name: "Home", path: "/village-oracle" },
      { name: "Oracle", path: "/village-oracle/oracle" },
      { name: "Research", path: "/village-oracle/research" },
    ] },
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
  // A project may LOCK its theme (e.g. The Odds is dark-only, Village Oracle is
  // light-only); a locked theme ignores the stored preference and is not saved.
  var lockedTheme = (cur && cur.theme) || null;
  (function applyDefault() {
    var s = storedTheme();
    var dark = lockedTheme ? lockedTheme === "dark" : isProject ? s !== "light" : s === "dark";
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
      '<button type="button" class="fa-shell__toggle" aria-label="Toggle theme"></button>' +
      '<button type="button" class="fa-shell__burger" aria-label="Open menu" aria-expanded="false" aria-controls="fa-sheet"><span></span><span></span><span></span></button></nav>';

  // build the mobile sheet contents (primary links + this project's pages + theme)
  function buildSheet() {
    var i = 0, out = ['<div class="fa-sheet__inner">'];
    out.push('<nav class="fa-sheet__sec" aria-label="Primary">');
    LINKS.forEach(function (l) {
      out.push('<a class="fa-sheet__link' + (activeLink(l.path) ? " is-active" : "") + '" href="' + l.path + '" style="--i:' + (i++) + '">' + l.name + "</a>");
    });
    out.push("</nav>");
    if (cur && cur.pages && cur.pages.length) {
      out.push('<div class="fa-sheet__sec">');
      out.push('<p class="fa-sheet__title" style="--i:' + (i++) + '">' + cur.name + "</p>");
      cur.pages.forEach(function (pg) {
        var act = p === pg.path || (pg.path !== cur.path && p.indexOf(pg.path) === 0);
        out.push('<a class="fa-sheet__sublink' + (act ? " is-active" : "") + '" href="' + pg.path + '" style="--i:' + (i++) + '">' + pg.name + "</a>");
      });
      out.push("</div>");
    }
    out.push('<button type="button" class="fa-sheet__theme" style="--i:' + (i++) + '"><span class="fa-sheet__themelabel">Theme</span><span class="fa-sheet__themeicon" aria-hidden="true"></span></button>');
    out.push("</div>");
    return out.join("");
  }

  function mount() {
    if (document.querySelector("header.fa-shell")) return; // guard against double-mount
    document.body.insertBefore(h, document.body.firstChild);

    var sheet = document.createElement("div");
    sheet.className = "fa-sheet";
    sheet.id = "fa-sheet";
    sheet.setAttribute("aria-hidden", "true");
    sheet.innerHTML = buildSheet();
    document.body.appendChild(sheet);

    // shared theme control (drives both the bar toggle and the sheet toggle)
    var barToggle = h.querySelector(".fa-shell__toggle");
    var sheetIcon = sheet.querySelector(".fa-sheet__themeicon");
    var sheetLabel = sheet.querySelector(".fa-sheet__themelabel");
    function paintThemes() {
      var d = root.classList.contains("dark");
      barToggle.innerHTML = d ? SUN : MOON;
      if (sheetIcon) sheetIcon.innerHTML = d ? SUN : MOON;
      if (sheetLabel) sheetLabel.textContent = d ? "Light mode" : "Dark mode";
    }
    function toggleTheme() {
      var d = root.classList.toggle("dark");
      try { localStorage.setItem("fa-theme", d ? "dark" : "light"); } catch (e) {}
      paintThemes();
    }
    var sheetThemeBtn = sheet.querySelector(".fa-sheet__theme");
    if (lockedTheme) {
      // theme is fixed for this project — remove the toggle entirely
      if (barToggle) barToggle.remove();
      if (sheetThemeBtn) sheetThemeBtn.remove();
    } else {
      paintThemes();
      barToggle.addEventListener("click", toggleTheme);
      if (sheetThemeBtn) sheetThemeBtn.addEventListener("click", toggleTheme);
    }

    // hamburger ⇄ sheet
    var burger = h.querySelector(".fa-shell__burger");
    function setMenu(open) {
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      burger.classList.toggle("is-open", open);
      sheet.classList.toggle("is-open", open);
      sheet.setAttribute("aria-hidden", open ? "false" : "true");
      root.classList.toggle("fa-menu-open", open);
    }
    burger.addEventListener("click", function () { setMenu(!sheet.classList.contains("is-open")); });
    sheet.addEventListener("click", function (e) {
      if (e.target === sheet || e.target.closest("a")) setMenu(false); // backdrop or link tap closes
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
    window.addEventListener("resize", function () { if (window.innerWidth > 900) setMenu(false); });

    // shared footer — only on project pages, unless the page brings its own
    // (hub + Social Composer set data-fa-no-footer on <html> and supply theirs)
    if (isProject && !root.hasAttribute("data-fa-no-footer") && !document.querySelector("footer.fa-foot")) {
      var foot = document.createElement("footer");
      foot.className = "fa-foot";
      // "last updated" = this static page's deploy time (Last-Modified header)
      var upd = "";
      try {
        var lm = new Date(document.lastModified);
        if (!isNaN(lm) && lm.getFullYear() > 2000) {
          var mo = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
          upd = " Last updated " + lm.getDate() + " " + mo[lm.getMonth()] + " " + lm.getFullYear() + ".";
        }
      } catch (e) {}
      foot.innerHTML =
        '<div class="fa-foot__inner">' +
        '<div class="fa-foot__grid">' +
        '<div class="fa-foot__col">' +
        '<a class="fa-foot__home" href="/" aria-label="Futures Atlas home">' +
        '<span class="fa-foot__mark" aria-hidden="true">' + mark + "</span>" +
        '<span class="fa-foot__word">Futures Atlas</span></a>' +
        '<p class="fa-foot__body">A growing collection of speculative-design projects — prototypes, open-source tools, and research on quantum computing, emerging AI, and the organisations driving them. <b>It\u2019s meant to be used.</b></p>' +
        "</div>" +
        '<div class="fa-foot__col">' +
        '<p class="fa-foot__h">Explore</p>' +
        '<nav class="fa-foot__list">' +
        '<a class="fa-foot__link" href="/">Home</a>' +
        '<a class="fa-foot__link" href="/projects">Projects</a>' +
        '<a class="fa-foot__link" href="/about">About</a>' +
        '<a class="fa-foot__link" href="/contact">Contact</a></nav>' +
        "</div>" +
        '<div class="fa-foot__col">' +
        '<p class="fa-foot__h">Use the work</p>' +
        '<p class="fa-foot__body">Open by default. Prototypes and tools are published with copyable, replicatable code unless noted otherwise. Fork them, adapt them, wire them into your own workflows — attribution appreciated, permission not required. Research is free to cite; sources are linked in every piece.</p>' +
        '<p class="fa-foot__body"><a class="fa-foot__a" href="https://github.com/ether-hill" target="_blank" rel="noopener">GitHub \u2197</a> · <a class="fa-foot__a" href="/about">License</a></p>' +
        "</div>" +
        '<div class="fa-foot__col">' +
        '<p class="fa-foot__h">Contact</p>' +
        '<p class="fa-foot__body">Get in touch. If you\u2019ve used something from the Atlas — in a workshop, a project, a classroom — we\u2019d like to hear how it went. Collaboration inquiries welcome.</p>' +
        '<p class="fa-foot__body"><a class="fa-foot__a" href="/contact">Contact form \u2192</a></p>' +
        "</div></div>" +
        '<div class="fa-foot__row">' +
        '<span class="fa-foot__tag">© 2026 Futures Atlas · A living project — things change, break, and improve.' + upd + "</span>" +
        '<span class="fa-foot__tag">Built with Next.js, Claude Code, and an evolving stack — <a class="fa-foot__a" href="/about#stack">see the full inventory \u2192</a></span>' +
        "</div></div>";
      document.body.appendChild(foot);
    }

    // ── global Share tool — fixed bottom-left on every page, expands on click ──
    // Standard share options plus "Open in Social Composer", which deep-links the
    // composer to transmutate THIS page (pull its pieces onto the canvas).
    if (!document.querySelector(".fa-share")) {
      var enc = encodeURIComponent;
      var shareIcon =
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>';
      var sh = document.createElement("div");
      sh.className = "fa-share";
      sh.innerHTML =
        '<div class="fa-share__panel" role="menu">' +
          '<a class="fa-share__opt fa-share__opt--accent" data-act="composer" href="#">⚗ Open in Social Composer</a>' +
          '<div class="fa-share__ig">' +
            '<span class="fa-share__iglbl">⌗ Instagram</span>' +
            '<a class="fa-share__chip" data-igf="story" href="#">Story</a>' +
            '<a class="fa-share__chip" data-igf="square" href="#">Square</a>' +
            '<a class="fa-share__chip" data-igf="reel" href="#">Reel</a>' +
          "</div>" +
          '<span class="fa-share__sep"></span>' +
          '<button class="fa-share__opt" data-act="copy" type="button">Copy link</button>' +
          (navigator.share ? '<button class="fa-share__opt" data-act="native" type="button">Share…</button>' : "") +
          '<a class="fa-share__opt" data-act="wa" target="_blank" rel="noopener" href="#">WhatsApp</a>' +
          '<a class="fa-share__opt" data-act="x" target="_blank" rel="noopener" href="#">Post to X</a>' +
          '<a class="fa-share__opt" data-act="li" target="_blank" rel="noopener" href="#">Share to LinkedIn</a>' +
          '<a class="fa-share__opt" data-act="email" href="#">Email a link</a>' +
        "</div>" +
        '<button class="fa-share__btn" type="button" aria-label="Share this page" aria-haspopup="menu" aria-expanded="false">' + shareIcon + '<span class="fa-share__lbl">SHARE</span></button>';
      document.body.appendChild(sh);
      var sBtn = sh.querySelector(".fa-share__btn");
      var sPanel = sh.querySelector(".fa-share__panel");
      var sCopy = sh.querySelector('[data-act="copy"]');
      var refreshShare = function () {
        var u = location.href, t = document.title || "Futures Atlas";
        sh.querySelector('[data-act="composer"]').href = "/social-composer?transmutate=" + enc(u);
        sh.querySelectorAll("[data-igf]").forEach(function (a) {
          a.href = "/social-composer?transmutate=" + enc(u) + "&format=" + a.getAttribute("data-igf");
        });
        sh.querySelector('[data-act="wa"]').href = "https://wa.me/?text=" + enc(t + " " + u);
        sh.querySelector('[data-act="x"]').href = "https://twitter.com/intent/tweet?url=" + enc(u) + "&text=" + enc(t);
        sh.querySelector('[data-act="li"]').href = "https://www.linkedin.com/sharing/share-offsite/?url=" + enc(u);
        sh.querySelector('[data-act="email"]').href = "mailto:?subject=" + enc(t) + "&body=" + enc(u);
      };
      var setShare = function (o) {
        if (o) refreshShare();
        sBtn.setAttribute("aria-expanded", o);
        sh.classList.toggle("is-open", o);
      };
      sBtn.addEventListener("click", function (e) { e.stopPropagation(); setShare(!sh.classList.contains("is-open")); });
      sCopy.addEventListener("click", function () {
        if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(function () {
          sCopy.textContent = "Copied ✓";
          setTimeout(function () { sCopy.textContent = "Copy link"; setShare(false); }, 900);
        });
      });
      var sNative = sh.querySelector('[data-act="native"]');
      if (sNative) sNative.addEventListener("click", function () {
        navigator.share({ title: document.title || "Futures Atlas", url: location.href }).catch(function () {});
        setShare(false);
      });
      sPanel.addEventListener("click", function (e) { if (e.target.closest("a")) setShare(false); });
      document.addEventListener("click", function (e) { if (!sh.contains(e.target)) setShare(false); });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape") setShare(false); });
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
  }
  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);
})();
