/*
  THE single Futures Atlas global nav, one component for every surface.

  Loaded as a plain <script src="/atlas-nav.js" defer> by the hub (Next), the
  Vite tools (Generatives, Quantum Sandbox), Social Composer (Next export) and the
  static zone bundles (Village Oracle / Underground Intelligence / The Odds).
  It self-injects /atlas-nav.css, so one script tag is all any page needs.

  Desktop: a sticky frosted bar, brand + (on a project page) a breadcrumb
  switcher, the primary links, and a theme toggle; hides on scroll-down.
  Tablet/mobile: the links collapse into an animated hamburger sheet that holds
  the primary links, the current project's own pages (under its title), and the
  theme toggle. Theme is one class (html.dark) + one key (localStorage
  "fa-theme"): dark by default everywhere; light only if the user chose it.
  Edit THIS file to change the nav anywhere.
*/
(function () {
  // pages: a project's own internal tabs, shown in the mobile sheet under the
  // project title (and as the slim desktop sub-nav, rendered by each zone).
  // draft: true = unpublished. Kept out of the switcher for everyone except a
  // signed-in editor (detected via the readable "fa_editor" cookie). The cookie
  // is only a hint for this list, the server gates every draft URL itself, so
  // faking it here reveals nothing. Mirror src/data/projects.ts when you flip a
  // project between live and draft.
  // draft: "month-1" is still a draft, one the launch plan (/plan) expects to
  // publish in the month after launch; it only changes the tag an editor sees.
  var FA_PROJECTS = [
    { name: "Glossary", path: "/glossary" },
    { name: "Dramaturge", path: "/dramaturge", draft: true },
    { name: "Shop", path: "/shelflife", draft: true },
    { name: "Quantum Interference Visuals", path: "/interference" },
    { name: "Quantum Superposition Visuals", path: "/superposition", draft: true },
    { name: "Throat singing and quantum physics", path: "/throat-singing-quantum", draft: true },
    { name: "Mappings", path: "/mappings", draft: true },
    { name: "Horizon Scan", path: "/horizon-scan", draft: "month-1" },
    { name: "Hypothetica Magnifica", path: "/magnifica", draft: "month-1" },
    { name: "Trajectories", path: "/trajectories", draft: true },
    { name: "The Counterfactual Index", path: "/manipulate-the-data", draft: true },
    { name: "Counterfactual Quantum", path: "/manipulate-the-data/quantum", draft: true },
    { name: "AI Gigawatts", path: "/manipulate-the-data/ai-gigawatts", draft: true },
    { name: "Hyperscale", path: "/hyperscale", draft: true },
    { name: "Signal Reactor", path: "/signal-reactor" },
    { name: "Quantum Spark", path: "/quantum-spark" },
    { name: "Quantum Lag", path: "/quantum-lag", theme: "dark", draft: true },
    { name: "Quantum Dominance", path: "/quantum-dominance", draft: true },
    { name: "Woodchipper Futures", path: "/woodchipper", draft: true },
    { name: "The stack, as four games", path: "/stack-games", draft: true },
    { name: "Swipe the Future", path: "/swipe-the-future" },
    { name: "Swipe the Future v1", path: "/swipe-v1", draft: true },
    { name: "Social Composer", path: "/social-composer", draft: true },
    { name: "Generatives", path: "/generatives" },
    { name: "Literal Frequency", path: "/literal-frequency", draft: true },
    { name: "Quantum Sandbox", path: "/quantum-sandbox", draft: true },
    { name: "The Odds", path: "/theodds", theme: "dark" },
    { name: "Underground Intelligence", path: "/underground-intelligence", draft: true, pages: [
      { name: "Story", path: "/underground-intelligence/story" },
      { name: "Dashboard", path: "/underground-intelligence/dashboard" },
      { name: "Research", path: "/underground-intelligence/research" },
    ] },
    { name: "Village Oracle", path: "/village-oracle", theme: "light", draft: true, pages: [
      { name: "Home", path: "/village-oracle" },
      { name: "Oracle", path: "/village-oracle/oracle" },
      { name: "Research", path: "/village-oracle/research" },
    ] },
    { name: "Source Library × Futures Atlas Recommended Reading", path: "/ancestors", draft: true },
    { name: "Hard Questions", path: "/actually-hard-questions", draft: true, pages: [
      { name: "Map", path: "/actually-hard-questions#map" },
      { name: "Grid", path: "/actually-hard-questions#grid" },
      { name: "Ask", path: "/actually-hard-questions#session" },
    ] },
  ];

  // The cookie is a hint about who is looking; FA_ENV is the fact about where.
  // On production there are no drafts to list at all — the middleware answers
  // their URLs as though they were never built — so a stale editor cookie can
  // never put a dead link in the switcher.
  var IS_EDITOR = !IS_PRODUCTION && /(?:^|;\s*)fa_editor=1(?:;|$)/.test(document.cookie || "");
  // What the switcher offers: drafts only once signed in.
  var FA_LISTED = FA_PROJECTS.filter(function (x) { return IS_EDITOR || !x.draft; });
  // Glossary is deliberately NOT here. It is a PROJECT now (it is in
  // FA_PROJECTS above and in src/data/projects.ts), so it appears in the
  // switcher and in the footer's Projects column. The bar stays the places you
  // go, not the things you look up.
  /*
    stagingOnly: the page exists on staging and is ABSENT on production (the
    middleware's STAGING_ONLY list). The hub's root layout sets window.FA_ENV
    before this script runs; anything that does not set it is treated as
    production, so a page that never declares itself can only ever under-link,
    never point at a dead end. That is why the static zone bundles do not show
    the Feed link even on staging: they are separate builds with their own HTML
    and they do not set the flag.
  */
  var IS_PRODUCTION = (window.FA_ENV || "production") === "production";

  var LINKS = [
    { name: "Home", path: "/" },
    { name: "Projects", path: "/projects" },
    { name: "Feed", path: "/feed", stagingOnly: true },
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
  ].filter(function (l) { return !(l.stagingOnly && IS_PRODUCTION); });

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

  // theme: one key, one class. dark by default everywhere (hub + project pages); light only if the user picked it.
  var root = document.documentElement;
  function storedTheme() { try { return localStorage.getItem("fa-theme"); } catch (e) { return null; } }
  // A project may LOCK its theme (e.g. The Odds is dark-only, Village Oracle is
  // light-only); a locked theme ignores the stored preference and is not saved.
  var lockedTheme = (cur && cur.theme) || null;
  (function applyDefault() {
    var s = storedTheme();
    var dark = lockedTheme ? lockedTheme === "dark" : s !== "light";
    root.classList.toggle("dark", dark);
  })();

  var CHEV = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
  var MOON = '<svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M16 11.2A6.2 6.2 0 1 1 8.8 4a4.8 4.8 0 0 0 7.2 7.2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>';
  var SUN = '<svg width="16" height="16" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="3.6" stroke="currentColor" stroke-width="1.5"/><path d="M10 2.2v2M10 15.8v2M2.2 10h2M15.8 10h2M4.6 4.6l1.4 1.4M14 14l1.4 1.4M15.4 4.6L14 6M6 14l-1.4 1.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
  var mark = '<img src="/fa.svg" alt="" aria-hidden="true" style="display:block;height:20px;width:auto" />';
  // The footer carries the brand lockup at 1.5x — its own mark rather than a
  // CSS override, because the height is set inline here and inline wins.
  var footMark = '<img src="/fa.svg" alt="" aria-hidden="true" style="display:block;height:30px;width:auto" />';

  function activeLink(path) {
    return path === "/" ? p === "/" : p.indexOf(path) === 0;
  }
  var navlinks = LINKS.map(function (l) {
    return '<a class="fa-shell__navlink' + (activeLink(l.path) ? " is-active" : "") + '" href="' + l.path + '"' +
      (activeLink(l.path) ? ' aria-current="page"' : "") + ">" + l.name + "</a>";
  }).join("");

  var crumbHtml = "";
  if (isProject) {
    var items = FA_LISTED.map(function (x) {
      var c = x.path === cur.path;
      var tag = x.draft
        ? ' <span class="fa-shell__draft">' + (x.draft === "month-1" ? "Draft · Month 1" : "Draft") + "</span>"
        : "";
      return '<a role="menuitem" href="' + x.path + '" class="fa-shell__item' + (c ? " is-current" : "") + '"' + (c ? ' aria-current="true"' : "") + ">" + x.name + tag + "</a>";
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
      // No account button. The bar is the site's front door and a profile icon
      // on it offers a sign-in to people who have nothing to sign in to. Sign
      // out lives in the mobile sheet and in the footer's internal column,
      // both of which only exist where there is a session to end.
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
    // No "Sign in" here, and none in the bar either: the menu is the site's
    // public front door and editor sign-in is not a thing a visitor is being
    // offered. Anyone who wants it goes to /admin/login. Sign OUT stays,
    // because without it there is no way off an editor session on a phone.
    if (IS_EDITOR) {
      out.push('<button type="button" class="fa-sheet__theme fa-sheet__profile" style="--i:' + (i++) + '"><span>Sign out</span></button>');
    }
    // Empty host: the ONE share widget is moved in here at menu widths rather
    // than a second copy being built. Two share tools would be two sets of
    // handlers to keep in step, and they already drifted once as two footers.
    out.push('<div class="fa-sheet__sharehost" style="--i:' + (i++) + '"></div>');
    out.push("</div>");
    return out.join("");
  }

  /*
   * Reserve the bar's height, on every page, without being asked.
   *
   * The bar is position:fixed, so it takes no space and simply lies on top of
   * whatever is at the top of the document. Every page was expected to hold a
   * gap for it itself, and most do — but a page whose own header padding is a
   * clamp() that bottoms out below 64px (Interference's masthead is
   * clamp(44px, 7vw, 96px)) is fine on a desktop and eats its own title on a
   * phone and tablet, which is exactly where the clamp is smallest. That
   * failure is invisible to whoever wrote the page unless they narrow the
   * window, so it has happened more than once across these bundles.
   *
   * This makes the guarantee global rather than per page. It only ever ADDS
   * the shortfall, so a page that already reserves the height (or more) is
   * untouched, and re-running it is a no-op.
   *
   * Two deliberate exemptions:
   *   • [data-fa-hero] — a full-bleed stage MEANT to run under a clear bar.
   *   • [data-fa-no-offset] on <html> — a fixed, non-scrolling stage that
   *     positions everything itself and would only be knocked askew.
   */
  function reserveBarHeight() {
    if (root.hasAttribute("data-fa-no-offset")) return;
    if (document.querySelector("[data-fa-hero]")) return;
    var body = document.body;
    if (!body) return;
    var need = h.offsetHeight || 64;
    var have = parseFloat(getComputedStyle(body).paddingTop) || 0;
    // 1px of slack: sub-pixel rounding on a page that already reserves exactly
    // the right amount should not add another 64.
    if (have >= need - 1) return;
    body.style.paddingTop = need + "px";
  }

  function mount() {
    if (document.querySelector("header.fa-shell")) return; // guard against double-mount
    document.body.insertBefore(h, document.body.firstChild);
    reserveBarHeight();
    // The stylesheet is injected, so on a cold load the bar can measure 0 here
    // and the page's own padding can still be the pre-CSS value. Re-check once
    // it has landed, and once more after fonts settle the layout.
    window.addEventListener("load", reserveBarHeight);
    setTimeout(reserveBarHeight, 0);

    var sheet = document.createElement("div");
    sheet.className = "fa-sheet";
    sheet.id = "fa-sheet";
    sheet.setAttribute("aria-hidden", "true");
    sheet.innerHTML = buildSheet();
    document.body.appendChild(sheet);

    // Profile: sign in, or sign out. Logout is POST-only (it clears an httpOnly
    // cookie), so it goes as a submitted form rather than a link.
    function doProfile() {
        if (!IS_EDITOR) {
          location.href = "/admin/login?next=" + encodeURIComponent(location.pathname + location.search);
          return;
        }
        var f = document.createElement("form");
        f.method = "POST";
        f.action = "/api/admin/logout";
        document.body.appendChild(f);
        f.submit();
    }
    var profileBtn = h.querySelector(".fa-shell__profile");
    if (profileBtn) profileBtn.addEventListener("click", doProfile);

    var sheetProfile = sheet.querySelector(".fa-sheet__profile");
    if (sheetProfile) sheetProfile.addEventListener("click", function () { doProfile(); });

    /*
     * One roll of the mark on ARRIVING at the homepage from another page.
     *
     * Two ways to arrive, and both have to be caught:
     *   • A full document load. The bar's own links are plain <a href>, so
     *     every click through the nav is one of these. document.referrer tells
     *     us where we came from; if it is this site and it was not already the
     *     homepage, roll.
     *   • A client-side navigation. The host is a Next app, so a <Link> in the
     *     page body swaps the URL with history.pushState and fires no event of
     *     its own. Wrapping pushState/replaceState is the portable way for a
     *     vanilla script to hear about that (the Navigation API would be
     *     tidier, but Safari does not have it). Both wrappers call through and
     *     return the original result, so nothing else changes.
     *
     * Deliberately NOT on a reload of the homepage, and not on arriving from
     * outside the site: it marks a transition between our own pages.
     */
    var markWrap = h.querySelector(".fa-shell__mark");
    function rollMark() {
      if (!markWrap) return;
      markWrap.classList.remove("is-rolling");
      void markWrap.offsetWidth;          // reflow, so a second roll restarts
      markWrap.classList.add("is-rolling");
    }
    if (markWrap) {
      markWrap.addEventListener("animationend", function () {
        markWrap.classList.remove("is-rolling");
      });
    }

    var lastPath = location.pathname;
    function onRoute() {
      var now = location.pathname;
      if (now === lastPath) return;
      var arrivedHome = now === "/" && lastPath !== "/";
      lastPath = now;
      if (arrivedHome) rollMark();
    }
    ["pushState", "replaceState"].forEach(function (m) {
      var orig = history[m];
      history[m] = function () {
        var r = orig.apply(this, arguments);
        onRoute();
        return r;
      };
    });
    window.addEventListener("popstate", onRoute);

    if (location.pathname === "/" && document.referrer) {
      try {
        var from = new URL(document.referrer);
        if (from.origin === location.origin && from.pathname !== "/") rollMark();
      } catch (e) {}
    }

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
      // theme is fixed for this project, remove the toggle entirely
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

    // shared footer, only on project pages, unless the page brings its own
    // (hub + Social Composer set data-fa-no-footer on <html> and supply theirs)
    if (isProject && !root.hasAttribute("data-fa-no-footer")) {
      // ONE footer for the whole site. The markup is generated by
      // scripts/gen-footer.mjs from projects.ts / posts.ts / glossary.ts into
      // /atlas-footer.html; the host imports that same string and renders it
      // server-side. This used to be a second copy typed out here, and the two
      // drifted — different columns, different links, different colour.
      //
      // A footer already on the page is REPLACED, not deferred to. Yielding to
      // one is how the old version survived: two bundles ship a hardcoded
      // "The future is plural" footer inside their own HTML, so the injector
      // politely stepped aside and the site went on having two footers. The
      // page cannot be the authority on what the site's footer is; this file
      // is. (A page that genuinely supplies its own still opts out properly,
      // with data-fa-no-footer above.)
      // credentials: "same-origin" (the default) is load-bearing, not incidental.
      // With "omit" the browser withholds the Vercel SSO cookie, so on any
      // PREVIEW deployment this fetch got a 302 to vercel.com/sso-api, r.ok was
      // false, and the footer silently did not render. Production is public so
      // it always looked fine there, which is how it stayed unnoticed: every
      // project page on every preview has been missing its footer.
      fetch("/atlas-footer.html", { credentials: "same-origin" })
        .then(function (r) { return r.ok ? r.text() : null; })
        .then(function (html) {
          if (!html) return;
          var stale = document.querySelectorAll("footer.fa-foot");
          for (var i = 0; i < stale.length; i++) stale[i].parentNode.removeChild(stale[i]);
          var foot = document.createElement("footer");
          foot.className = "fa-foot";
          foot.innerHTML = html;
          // "Last updated" is baked into the markup by the generator now — one
          // date for the whole deploy. It used to be stamped here from
          // document.lastModified, which gave every bundle its own date and
          // made one footer read as several.
          document.body.appendChild(foot);
        })
        .catch(function () {});
    }

    // ── global Share tool, in the bar beside the theme toggle, expands on click ──
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
        '<button class="fa-share__btn" type="button" aria-label="Share this page" aria-haspopup="menu" aria-expanded="false">' +
          '<span class="fa-share__lbl">Share this page</span>' + shareIcon + "</button>";
      // In the bar rather than floating: a fixed button had to be nudged around
      // whenever the bar hid on scroll, and it never belonged to anything. Falls
      // back to the body if the bar has not been built (it always has by here).
      // Anchor on whatever is actually there. Theme-locked projects (The Odds, Hollow Villages…)
      // delete .fa-shell__toggle above, and anchoring on it alone dropped the share button onto
      // <body>, where it rendered off the bottom of the page — invisible on every locked project.
      var barRight = document.querySelector(".fa-shell__right");
      var shareAnchor = barRight && (barRight.querySelector(".fa-shell__toggle") ||
        barRight.querySelector(".fa-shell__profile") || barRight.querySelector(".fa-shell__burger"));
      if (shareAnchor) barRight.insertBefore(sh, shareAnchor);
      else if (barRight) barRight.appendChild(sh);
      else document.body.appendChild(sh);

      /*
       * At menu widths the share tool lives IN the menu, with the theme and
       * account controls, rather than as a lone circle in the bar. It is the
       * same node either way — moved, not duplicated — so there is one set of
       * handlers and one panel to keep correct. matchMedia rather than a
       * resize listener: it fires only on the crossing.
       */
      var sheetHost = document.querySelector(".fa-sheet__sharehost");
      var shareMq = window.matchMedia("(max-width: 900px)");
      function placeShare() {
        if (!sheetHost) return;
        if (shareMq.matches) {
          sh.classList.add("fa-share--sheet");
          if (sh.parentNode !== sheetHost) sheetHost.appendChild(sh);
        } else {
          sh.classList.remove("fa-share--sheet");
          if (sh.parentNode !== barRight && barRight) {
            if (shareAnchor) barRight.insertBefore(sh, shareAnchor);
            else barRight.appendChild(sh);
          }
        }
      }
      placeShare();
      if (shareMq.addEventListener) shareMq.addEventListener("change", placeShare);
      else if (shareMq.addListener) shareMq.addListener(placeShare);
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

    /*
     * The bar travels with the page going down, and slides back on the way up.
     *
     * Scrolling DOWN it is moved by exactly the distance scrolled, with no
     * transition — so it leaves at the speed of the page and reads as part of
     * it. Scrolling UP it animates back to rest. The old behaviour animated it
     * away on a 0.55s curve, which is what made every sticky offset on the site
     * lag behind the bar and left the glossary alphabet hanging in space.
     *
     * Pages with a sub-nav opt out: their slim tab row sits directly under the
     * bar and would float with a gap above it.
     */
    var hero = document.querySelector("[data-fa-hero]");
    var pinned = !!document.querySelector(".fa-subnav");
    var lastY = Math.max(0, window.scrollY);
    var hiddenBy = 0; // px of the bar currently pushed off the top

    // Evaluate once on load: the handler only fires on scroll, so without this
    // the bar arrives opaque over a hero it is supposed to be clear of.
    function paintHero() {
      if (!hero) return;
      var past = window.scrollY > hero.offsetTop + hero.offsetHeight - h.offsetHeight - 8;
      h.classList.toggle("is-clear", !past);
    }

    /*
     * Publish how many pixels of the bar are on screen, as --fa-nav-now.
     *
     * --fa-nav-h is the height and never changes, which is the wrong number for
     * anything sticky: pin to a constant 64 and you get a dead band the moment
     * the bar leaves; pin to 0 and the bar buries your element when it returns.
     * Both were live here — the glossary alphabet did the first, Magnifica's
     * floating controls and the feed rails the second. Because the bar is now
     * driven from scrollY rather than animated, this is exact on every frame
     * and needs no transition to smooth it over.
     */
    function publishOccupancy(px) {
      document.documentElement.style.setProperty(
        "--fa-nav-now",
        Math.max(0, px === undefined ? h.offsetHeight - hiddenBy : px) + "px",
      );
    }

    /*
     * While the bar is sliding back down, publish where its bottom edge ACTUALLY
     * is, frame by frame, rather than jumping straight to its resting height.
     *
     * Going down the bar is driven from scrollY, so hiddenBy is exact and no
     * loop is needed. Coming back it is a CSS transition, and announcing the
     * final number up front would drop every sticky consumer into place ~180ms
     * before the bar arrived — a band of bare page above the glossary alphabet
     * for the length of the animation. Reading the rect keeps the contract the
     * variable's name makes: pixels on screen right now.
     */
    var tracking = false;
    function trackReveal() {
      if (tracking) return;
      tracking = true;
      var tick = function () {
        var bottom = h.getBoundingClientRect().bottom;
        publishOccupancy(bottom);
        if (bottom < h.offsetHeight - 0.5 && h.classList.contains("is-revealing")) {
          requestAnimationFrame(tick);
        } else {
          tracking = false;
          publishOccupancy();
        }
      };
      requestAnimationFrame(tick);
    }

    paintHero();
    publishOccupancy();
    window.addEventListener("resize", publishOccupancy, { passive: true });

    if (!pinned) {
      var queued = false;
      var frame = function () {
        queued = false;
        var y = Math.max(0, window.scrollY);
        var dy = y - lastY;
        var navH = h.offsetHeight;

        if (y <= 0) {
          // back at the top: at rest, and no slide needed to get there
          hiddenBy = 0;
          h.classList.remove("is-revealing");
        } else if (dy > 0) {
          // down: move with the page, one pixel per pixel, no animation
          h.classList.remove("is-revealing");
          hiddenBy = Math.min(navH, hiddenBy + dy);
        } else if (dy < 0) {
          // up: slide the whole bar back down
          if (hiddenBy > 0) {
            h.classList.add("is-revealing");
            hiddenBy = 0;
            h.style.transform = "translateY(0)";
            trackReveal(); // publish the real edge while it travels
            lastY = y;
            return;
          }
          hiddenBy = 0;
        }

        h.style.transform = hiddenBy ? "translateY(-" + hiddenBy + "px)" : "translateY(0)";
        if (!tracking) publishOccupancy();
        lastY = y;
      };

      window.addEventListener("scroll", function () {
        paintHero();
        if (queued) return;
        queued = true;
        requestAnimationFrame(frame);
      }, { passive: true });
    }
  }
  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);
})();
