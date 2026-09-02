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

  /* the instrument */
  var inst = document.getElementById("instrument");
  if (inst) {
    var ic = inst.querySelector("canvas");
    var is = register(OVERTONE.createStage(ic, { view: "levels", clear: true }), inst);
    var notes = {};
    inst.querySelectorAll("template[data-note]").forEach(function (t) { notes[t.getAttribute("data-note")] = t.innerHTML; });
    var noteEl = inst.querySelector(".viewnote");
    function setNote(v) { if (noteEl && notes[v]) noteEl.innerHTML = notes[v]; }
    wireSources(inst, is, function (k, err) {
      var n = inst.querySelector("[data-msg]");
      if (n) n.textContent = k === "error" ? "The microphone was refused, or this browser will not share it. The clips still work." : "";
    });
    wireViews(inst, is, setNote);
    setNote("levels");
    readout(inst, is);
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

  /* the standalone page shares this file: the same wiring on one stage */
  var viz = document.getElementById("viz");
  if (viz) {
    var vc = viz.querySelector("canvas");
    var q = new URLSearchParams(location.search);
    var vs = OVERTONE.createStage(vc, { view: q.get("view") || "levels", clear: true });
    stages.push(vs);
    var vnotes = {};
    viz.querySelectorAll("template[data-note]").forEach(function (t) { vnotes[t.getAttribute("data-note")] = t.innerHTML; });
    var vnote = viz.querySelector(".viewnote");
    function vset(v) { if (vnote && vnotes[v]) vnote.innerHTML = vnotes[v]; viz.querySelectorAll("[data-view]").forEach(function (x) { x.classList.toggle("is-on", x.getAttribute("data-view") === v); }); }
    wireSources(viz, vs, function (k) {
      var n = viz.querySelector("[data-msg]");
      if (n) n.textContent = k === "error" ? "The microphone was refused, or this browser will not share it. The clips still work." : "";
    });
    wireViews(viz, vs, vset);
    vset(vs.view);
    readout(viz, vs);
  }
})();
