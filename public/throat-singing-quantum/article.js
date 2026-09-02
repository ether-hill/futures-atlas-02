/*
  The page's furniture: scroll reveals, video facades that only load YouTube on
  a click, and three stages driven by the Overtone engine (the hero, the
  listening panel, the instrument). One clip plays at a time across all three,
  and a stage that scrolls out of view pauses, so a phone is not asked to run
  three analysers for one reader.
*/
(function () {
  "use strict";

  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------- reveals */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
    });
  }, { threshold: 0, rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll("[data-reveal]").forEach(function (el) { io.observe(el); });

  /* ---------------------------------------------------------- video facades */
  function loadYT(box, start) {
    var id = box.getAttribute("data-id");
    var s = start != null ? start : parseInt(box.getAttribute("data-start") || "0", 10);
    var f = document.createElement("iframe");
    f.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0&modestbranding=1&start=" + (s || 0);
    f.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    f.allowFullscreen = true;
    f.title = box.getAttribute("data-title") || "Video";
    box.innerHTML = ""; box.appendChild(f);
    stopAllStages();
  }
  document.querySelectorAll(".yt").forEach(function (box) {
    var play = box.querySelector(".yt__play");
    if (play) play.addEventListener("click", function () { loadYT(box); });
  });
  document.querySelectorAll(".chapters button").forEach(function (b) {
    b.addEventListener("click", function () {
      var box = document.getElementById(b.getAttribute("data-for"));
      if (!box) return;
      loadYT(box, parseInt(b.getAttribute("data-t"), 10));
      box.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
    });
  });

  /* ---------------------------------------------------------- stages */
  if (!window.OVERTONE) return;
  var stages = [];
  function stopAllStages(except) {
    stages.forEach(function (s) { if (s !== except && s.kind !== "idle") s.stop(); });
  }
  function register(stage, el) {
    stages.push(stage);
    /* pause when off screen */
    var vis = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) stage.resume(); else stage.pause(); });
    }, { threshold: 0.05 });
    vis.observe(el);
    return stage;
  }
  function markOn(group, key) {
    group.querySelectorAll("[data-src], [data-view]").forEach(function (b) {
      var v = b.getAttribute("data-src") || b.getAttribute("data-view");
      b.classList.toggle("is-on", v === key);
    });
  }
  function wireSources(group, stage, onChange) {
    group.querySelectorAll("[data-src]").forEach(function (b) {
      b.addEventListener("click", function () {
        var src = b.getAttribute("data-src");
        if (b.classList.contains("is-on")) { stage.stop(); markOn(group, null); onChange && onChange("idle"); return; }
        stopAllStages(stage);
        var p = src === "mic" ? stage.useMic() : stage.useClip(src);
        p.then(function () { markOn(group, src); onChange && onChange(src); })
         .catch(function (err) {
           markOn(group, null);
           onChange && onChange("error", err);
         });
      });
    });
    stage.on("source", function (s) { if (s.kind === "idle") markOn(group, null); });
  }
  function wireViews(group, stage, onChange) {
    group.querySelectorAll("[data-view]").forEach(function (b) {
      b.addEventListener("click", function () {
        stage.setView(b.getAttribute("data-view"));
        group.querySelectorAll("[data-view]").forEach(function (x) { x.classList.toggle("is-on", x === b); });
        onChange && onChange(stage.view);
      });
    });
  }
  function readout(el, stage, viewNote) {
    var f0 = el.querySelector("[data-f0]"), note = el.querySelector("[data-note]"), top = el.querySelector("[data-top]"), state = el.querySelector("[data-state]");
    var sw = el.querySelector(".swatch");
    var tick = 0;
    stage.on("frame", function (st) {
      if ((tick++ % 6) !== 0) return;
      var live = st.live && st.conf > 0.2;
      if (f0) f0.textContent = live ? Math.round(st.f0) + " Hz" : (st.live ? "listening" : "idle");
      if (note) note.textContent = live ? OVERTONE.noteName(st.f0) : "";
      if (top) top.textContent = live ? "n = " + st.top + " (" + Math.round(st.f0 * st.top) + " Hz)" : (st.live ? "" : "n = " + st.top);
      if (sw) sw.style.background = OVERTONE.hueFor(st.top, document.documentElement.classList.contains("dark") || el.closest(".instrument, body.viz") != null);
      if (state) state.textContent = st.live ? (st.conf > 0.2 ? "drone found" : "no drone yet") : "synthetic drone";
    });
  }

  /* the hero: Bohr's ring, listening to sygyt on request */
  var hero = document.getElementById("hero");
  if (hero) {
    var hc = hero.querySelector("canvas");
    var hs = register(OVERTONE.createStage(hc, { view: "orbit", clear: true, dprCap: 1.5, shift: 0.2 }), hero);
    if (reduced) hs.pause();
    wireSources(hero, hs, function (k) {
      var b = hero.querySelector("[data-src]");
      if (b) b.textContent = k === "idle" || k === "error" ? "Listen to the singing" : "Stop";
    });
    readout(hero, hs);
  }

  /* the listening panel: bars */
  var clips = document.getElementById("clips");
  if (clips) {
    var cc = clips.querySelector("canvas");
    var cs = register(OVERTONE.createStage(cc, { view: "bars", clear: true, dprCap: 1.5 }), clips);
    wireSources(clips, cs, function (k, err) {
      var n = clips.querySelector("[data-msg]");
      if (n) n.textContent = k === "error" ? "The microphone was refused, or this browser will not share it. The clips still work." : "";
    });
    readout(clips, cs);
  }

  /* the instrument, on the page and on its own: four fixed panels painted
     from one analysis; "view" picks which one shows in the single layout,
     "layout" shows one, all four in a grid, or all four stacked */
  function wirePanels(root, stage, stageEl) {
    var panels = Array.prototype.slice.call(root.querySelectorAll(".panel"));
    panels.forEach(function (p, i) { if (i > 0) stage.addPanel(p.querySelector("canvas"), p.getAttribute("data-panel")); });
    function setView(v) {
      panels.forEach(function (p) { p.classList.toggle("is-active", p.getAttribute("data-panel") === v); });
      root.querySelectorAll("[data-view]").forEach(function (b) { b.classList.toggle("is-on", b.getAttribute("data-view") === v); });
    }
    function setLayout(l) {
      stageEl.classList.remove("is-single", "is-grid", "is-stack");
      stageEl.classList.add("is-" + l);
      root.querySelectorAll("[data-layout]").forEach(function (b) { b.classList.toggle("is-on", b.getAttribute("data-layout") === l); });
      var vg = root.querySelector(".grp--view");
      if (vg) vg.classList.toggle("is-dim", l !== "single");
    }
    root.querySelectorAll("[data-view]").forEach(function (b) {
      b.addEventListener("click", function () { setView(b.getAttribute("data-view")); setLayout("single"); });
    });
    root.querySelectorAll("[data-layout]").forEach(function (b) {
      b.addEventListener("click", function () { setLayout(b.getAttribute("data-layout")); });
    });
    return { setView: setView, setLayout: setLayout };
  }
  function wireStage(root, stageEl, q) {
    var first = root.querySelector(".panel canvas");
    if (!first) return null;
    var stage = OVERTONE.createStage(first, { view: root.querySelector(".panel").getAttribute("data-panel"), clear: true });
    var ui = wirePanels(root, stage, stageEl);
    ui.setView(q && q.get("view") || "levels");
    ui.setLayout(q && q.get("layout") || "single");
    wireSources(root, stage, function (k) {
      var n = root.querySelector("[data-msg]");
      if (n) n.textContent = k === "error" ? "The microphone was refused, or this browser will not share it. The clips still work." : "";
    });
    readout(root, stage);
    return stage;
  }

  var inst = document.getElementById("instrument");
  if (inst) {
    var is = wireStage(inst, inst.querySelector(".instrument__stage"), null);
    if (is) register(is, inst);
    var fs = inst.querySelector("[data-full]"), frame = inst.querySelector(".instrument__frame");
    if (fs && frame) {
      if (!frame.requestFullscreen) fs.hidden = true;
      fs.addEventListener("click", function () {
        if (document.fullscreenElement) document.exitFullscreen(); else frame.requestFullscreen();
      });
      document.addEventListener("fullscreenchange", function () {
        fs.textContent = document.fullscreenElement ? "Close" : "Full screen";
      });
    }
  }

  var viz = document.getElementById("viz");
  if (viz) {
    var vs = wireStage(viz, viz.querySelector(".viz__stage"), new URLSearchParams(location.search));
    if (vs) stages.push(vs);
  }
})();
