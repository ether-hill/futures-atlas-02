import { Stage } from "./scene";
import { StrandField } from "./strands";
import { CoreOrb } from "./core";
import { Rings } from "./rings";
import { DEFAULTS, STRAND_RANGE, type Params } from "./config";

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

      <div class="panel" id="panel">
        <button class="gear" id="gear" title="Controls" aria-label="Controls">✦</button>
        <div class="ctrls" id="ctrls">
          <label>Strands <b id="vStrands"></b><input type="range" id="strands" min="${STRAND_RANGE.min}" max="${STRAND_RANGE.max}" step="50"></label>
          <label>Flow <b id="vFlow"></b><input type="range" id="flow" min="0" max="0.4" step="0.01"></label>
          <label>Turbulence <b id="vAmp"></b><input type="range" id="amp" min="0" max="3.2" step="0.05"></label>
          <label>Glow <b id="vGlow"></b><input type="range" id="glow" min="0" max="2" step="0.05"></label>
          <div class="row">
            <button class="btn" id="regen">Regenerate</button>
            <button class="btn" id="pause">Pause</button>
          </div>
        </div>
      </div>

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
  const orb = new CoreOrb();
  const rings = new Rings();
  stage.scene.add(field.group, orb.mesh, rings.group);
  stage.setGlow(params.glow);

  // ── controls ──
  const sl = {
    strands: $<HTMLInputElement>("strands"), flow: $<HTMLInputElement>("flow"),
    amp: $<HTMLInputElement>("amp"), glow: $<HTMLInputElement>("glow"),
  };
  sl.strands.value = String(params.strands);
  sl.flow.value = String(params.flow);
  sl.amp.value = String(params.amp);
  sl.glow.value = String(params.glow);
  const labels = () => {
    $("vStrands").textContent = String(params.strands);
    $("vFlow").textContent = params.flow.toFixed(2);
    $("vAmp").textContent = params.amp.toFixed(2);
    $("vGlow").textContent = params.glow.toFixed(2);
  };
  labels();

  sl.strands.addEventListener("input", () => { params.strands = Number(sl.strands.value); labels(); });
  sl.strands.addEventListener("change", () => { field.build(params, seed); field.resetReveal(); });
  sl.flow.addEventListener("input", () => { params.flow = Number(sl.flow.value); field.setParams(params); labels(); });
  sl.amp.addEventListener("input", () => { params.amp = Number(sl.amp.value); field.setParams(params); labels(); });
  sl.glow.addEventListener("input", () => { params.glow = Number(sl.glow.value); stage.setGlow(params.glow); labels(); });

  $("gear").addEventListener("click", () => $("panel").classList.toggle("open"));
  $("regen").addEventListener("click", () => { seed = randSeed(); field.build(params, seed); field.resetReveal(); });
  const pauseBtn = $("pause");
  pauseBtn.addEventListener("click", () => { paused = !paused; pauseBtn.textContent = paused ? "Resume" : "Pause"; });

  // ── loop ──
  const rng = mulberry32(0x9e3779b9);
  let spawnAcc = 0;
  let last = performance.now();
  function frame(now: number) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!paused) {
      field.update(dt);
      orb.update(dt);
      rings.update(dt);
      // ripples bloom at the shell as pulses arrive — rate scales with the field
      if (field.revealed > 0.4) {
        const rate = Math.min(16, params.strands * (params.flow + 0.02) * 0.05);
        spawnAcc += dt * rate;
        while (spawnAcc >= 1) { spawnAcc -= 1; rings.spawn(field.surfacePoint(rng())); }
      }
    }
    stage.render(dt);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
