import GUI from "lil-gui";
import { Stage } from "./scene";
import { StrandField } from "./strands";
import { Shell } from "./shell";
import { CoreOrb } from "./core";
import { Rings } from "./rings";
import { DEFAULTS, RANGES, type Params } from "./config";

function randSeed(): number {
  const b = new Uint32Array(1);
  crypto.getRandomValues(b);
  return b[0];
}
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function boot(root: HTMLElement) {
  root.innerHTML = `
    <div class="scene" id="scene"></div>
    <div class="ui">
      <div class="title"><b>Trajectories</b><span>Collective filaments</span></div>
      <div class="gui-host" id="gui"></div>
      <div class="credit">
        After <a href="https://jeonghopark.de/collectivetrajectories/" target="_blank" rel="noopener">Jeongho Park — “Collective Trajectories”</a>
        · <a href="https://github.com/jeonghopark/Collective-Trajectories" target="_blank" rel="noopener">source</a>
        · <a href="https://creativecommons.org/licenses/by-nc/4.0/" target="_blank" rel="noopener">CC BY-NC 4.0</a>.
        A non-commercial reimplementation.
      </div>
    </div>
  `;
  const $ = <T extends HTMLElement = HTMLElement>(id: string) => root.querySelector<T>(`#${id}`)!;

  const stage = new Stage($("scene"));
  const params: Params = { ...DEFAULTS };
  let seed = randSeed();
  let paused = false;

  const field = new StrandField(params, seed);
  const shell = new Shell(field.dirs, params);
  const orb = new CoreOrb(params);
  const rings = new Rings();
  stage.scene.add(field.group, shell.points, orb.mesh, rings.group);

  function applyLive() {
    field.apply(params);
    shell.apply(params);
    orb.apply(params);
    rings.setParams(params, params.radius);
    stage.setGlow(params.glowStrength);
    stage.setGlowSize(params.glowSize);
    stage.setAutoRotate(params.autoRotate);
  }
  function rebuild() {
    seed = (seed * 1) >>> 0;
    field.build(params, seed);
    shell.rebuild(field.dirs);
    applyLive();
  }
  applyLive();

  // ── GUI (lil-gui), grouped like the original ──
  const gui = new GUI({ container: $("gui"), title: "Controls", width: 264 });
  const add = (g: GUI, key: keyof Params, name: string, live = true) => {
    const [mn, mx, st] = RANGES[key as string];
    const c = g.add(params, key, mn, mx, st).name(name);
    return live ? c.onChange(applyLive) : c.onFinishChange(rebuild);
  };

  add(gui, "strands", "Strand Count", false);
  add(gui, "radius", "Radius");
  add(gui, "curl", "Curl");
  add(gui, "freq", "Noise Freq");
  add(gui, "shimmer", "Shimmer Speed");
  add(gui, "flow", "Flow Speed");
  add(gui, "pulse", "Pulse Count");
  add(gui, "tipPow", "Ends vs Middle");
  add(gui, "lineBase", "Line Base");
  add(gui, "opacity", "Line Opacity");
  add(gui, "extendFrac", "Extend Fraction", false);
  add(gui, "extendReach", "Extend Reach");
  add(gui, "growDur", "Intro Grow Time");
  add(gui, "growSpread", "Intro Random Delay");
  add(gui, "glowStrength", "Glow Strength");
  add(gui, "glowSize", "Glow Size");
  add(gui, "shellStrength", "Shell Dots");
  add(gui, "shellSize", "Shell Dot Size");
  add(gui, "audioReact", "Audio → Shell");
  gui.add(params, "autoRotate").name("Auto Rotate").onChange(applyLive);

  const fCore = gui.addFolder("Core");
  add(fCore, "coreStrength", "Strength (0=off)");
  add(fCore, "coreRadius", "Radius");
  add(fCore, "coreNoise", "Emanation");
  add(fCore, "coreFreq", "Detail");
  fCore.close();

  const fFog = gui.addFolder("Fog");
  add(fFog, "fogStrength", "Strength (0=off)");
  add(fFog, "fogNear", "Near");
  add(fFog, "fogFar", "Far");
  fFog.close();

  const fDof = gui.addFolder("Depth of Field");
  add(fDof, "dofDim", "Dim (0=off)");
  add(fDof, "focus", "Focus Dist");
  add(fDof, "focusRange", "Focus Range");
  fDof.close();

  const fRip = gui.addFolder("Surface Ripple");
  add(fRip, "rippleStrength", "Strength (0=off)");
  add(fRip, "rippleSpan", "Spread");
  add(fRip, "ringSpacing", "Ring Spacing");
  add(fRip, "rippleFade", "Fade");
  fRip.close();

  const actions = {
    "Replay intro": () => field.restartGrowth(),
    Regenerate: () => { seed = randSeed(); field.build(params, seed); shell.rebuild(field.dirs); applyLive(); field.restartGrowth(); },
    Pause: () => { paused = !paused; },
  };
  gui.add(actions, "Replay intro");
  gui.add(actions, "Regenerate");
  gui.add(actions, "Pause");

  // ── loop ──
  const rng = mulberry32(0x9e3779b9);
  let spawnAcc = 0;
  let time = 0;
  let last = performance.now();
  function frame(now: number) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!paused) {
      time += dt;
      field.update(dt);
      orb.update(dt);
      rings.update(dt);
      // "Audio → Shell": with no audio source, breathe the outer radius gently
      if (params.audioReact > 0) {
        const m = 1 + params.audioReact * 0.045 * Math.sin(time * 2.4);
        field.setRadius(params.radius * m);
        shell.setRadius(params.radius * m);
      }
      // ripples bloom at the shell as pulses arrive
      if (rings.enabled) {
        const rate = Math.min(14, params.strands * (params.flow + 0.05) * 0.02);
        spawnAcc += dt * rate;
        while (spawnAcc >= 1) {
          spawnAcc -= 1;
          const d = field.dirs[Math.floor(rng() * field.dirs.length) % field.dirs.length];
          rings.spawn(d.clone().multiplyScalar(params.radius));
        }
      }
    }
    stage.render(dt);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
