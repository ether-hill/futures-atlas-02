/*
  Interference — the audible half.

  Two panels get sound, and only two, because sound only earns its place where
  it carries something the picture cannot.

  1. PROBE (point-slits, closing-a-slit). A dot you drag over the field. What
     you hear is the brightness under the dot, so a bright fringe throbs and a
     dark one goes silent. A dark stripe is something you look at; silence is
     something that happens to you, and dragging across a dead fringe is the
     shortest route to "nothing arrives here".

  2. BEAT (beats). Two tones a whisker apart, with the gap between them set to
     the panel's own cycle, so the throb you hear and the pattern you watch
     drift at the same rate. The claim that they are one phenomenon becomes
     something a reader can check rather than something the caption asserts.

  WHERE THE NUMBERS COME FROM. The probe does not recompute the field. It reads
  the pixel already on the canvas, so there is no second copy of the physics to
  drift away from the shader. That the value has been through the tone map and
  the palette on its way is fine: loudness tracking brightness is the thing
  being claimed.

  WHAT IS NOT HERE. No stereo, no binaural, no two-speaker standing wave. A
  real spatial null needs two separated sources in a room, and over headphones
  or a laptop the mono downmix, the Bluetooth codec and the room itself destroy
  the phase relationship it would depend on. A beat survives that chain. A null
  does not, and a demonstration that only works on some hardware is worse than
  none.
*/
window.FIELD_AUDIO = (function () {
  "use strict";

  var ctx = null;
  var current = null;          // only one panel sounds at a time

  function supported() {
    return typeof (window.AudioContext || window.webkitAudioContext) === "function";
  }

  /* Created on the click that starts a sound, never before: a context made
     without a gesture is born suspended and browsers are right about that. */
  function context() {
    if (!ctx) {
      var C = window.AudioContext || window.webkitAudioContext;
      ctx = new C();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function ramp(param, to, secs) {
    var a = context();
    param.cancelScheduledValues(a.currentTime);
    param.setValueAtTime(param.value, a.currentTime);
    param.linearRampToValueAtTime(to, a.currentTime + secs);
  }

  function stopCurrent(except) {
    if (current && current !== except) current.stop();
  }

  /* ------------------------------------------------------------------ probe */

  /**
   * One tone whose loudness is the brightness under the probe.
   *
   * The canvas is read 5x5 rather than one pixel, because every panel carries a
   * grain term and a single pixel samples the grain as hiss. The gain is then
   * smoothed towards the reading rather than set to it: at sixty frames a
   * second a bare assignment steps the gain audibly, which is the zipper noise
   * every synth has a filter for.
   */
  function probe(canvas) {
    var osc = null, gain = null;
    var level = 0;
    var at = { x: 0.72, y: 0.5 };   // starts out in the fans, past the wall
    var api = {
      playing: false,
      kind: "probe",
      setPoint: function (x, y) {
        at.x = Math.max(0, Math.min(1, x));
        at.y = Math.max(0, Math.min(1, y));
      },
      point: function () { return at; },
      start: function () {
        stopCurrent(api);
        var a = context();
        osc = a.createOscillator();
        gain = a.createGain();
        osc.type = "sine";
        osc.frequency.value = 330;
        gain.gain.value = 0;
        osc.connect(gain).connect(a.destination);
        osc.start();
        api.playing = true;
        current = api;
      },
      stop: function () {
        if (!api.playing) return;
        api.playing = false;
        var g = gain, o = osc;
        ramp(g.gain, 0, 0.05);
        setTimeout(function () { try { o.stop(); o.disconnect(); g.disconnect(); } catch (e) {} }, 90);
        osc = null; gain = null;
        if (current === api) current = null;
      },
      tick: function () {
        if (!api.playing || !gain) return;
        var w = canvas.width, h = canvas.height;
        if (!w || !h) return;
        var cx = Math.round(at.x * (w - 1)), cy = Math.round(at.y * (h - 1));
        var x0 = Math.max(0, Math.min(w - 5, cx - 2));
        var y0 = Math.max(0, Math.min(h - 5, cy - 2));
        var d;
        try {
          d = canvas.getContext("2d").getImageData(x0, y0, 5, 5).data;
        } catch (e) { return; }
        var t = 0;
        for (var i = 0; i < d.length; i += 4) {
          t += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
        }
        var lum = t / (d.length / 4) / 255;
        // A little headroom off the top and a floor under the grain, so silence
        // is actually silent rather than a quiet hiss following the noise term.
        var want = Math.max(0, lum - 0.045) * 0.42;
        level += (want - level) * 0.18;
        gain.gain.setTargetAtTime(level, context().currentTime, 0.02);
      }
    };
    return api;
  }

  /* ------------------------------------------------------------------- beat */

  /**
   * Two tones a beat apart, where the beat is the panel's own cycle.
   *
   * The panel detunes its two sources 7:6, which is chosen so the FIELD repeats
   * once per loop. Transposed to a pitch you can hear, 7:6 is a musical
   * interval and you would hear a chord rather than a throb, so the audio needs
   * its own pair: one tone, and a second offset by exactly one cycle per loop.
   * Speed the panel up and the offset goes with it, which is the whole point of
   * having the sound at all.
   */
  function beat(hzGetter) {
    var a1 = null, a2 = null, gain = null;
    var api = {
      playing: false,
      kind: "beat",
      retune: function () {
        if (!api.playing) return;
        a2.frequency.setTargetAtTime(330 + hzGetter(), context().currentTime, 0.05);
      },
      start: function () {
        stopCurrent(api);
        var a = context();
        a1 = a.createOscillator(); a2 = a.createOscillator();
        gain = a.createGain();
        a1.type = a2.type = "sine";
        a1.frequency.value = 330;
        a2.frequency.value = 330 + hzGetter();
        gain.gain.value = 0;
        a1.connect(gain); a2.connect(gain);
        gain.connect(a.destination);
        a1.start(); a2.start();
        ramp(gain.gain, 0.16, 0.12);
        api.playing = true;
        current = api;
      },
      stop: function () {
        if (!api.playing) return;
        api.playing = false;
        var g = gain, x = a1, y = a2;
        ramp(g.gain, 0, 0.08);
        setTimeout(function () {
          try { x.stop(); y.stop(); x.disconnect(); y.disconnect(); g.disconnect(); } catch (e) {}
        }, 140);
        a1 = null; a2 = null; gain = null;
        if (current === api) current = null;
      },
      tick: function () {}
    };
    return api;
  }

  return { supported: supported, probe: probe, beat: beat, stopAll: function () { stopCurrent(null); } };
})();
