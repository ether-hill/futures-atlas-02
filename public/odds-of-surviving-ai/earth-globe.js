// <earth-globe> — a realistic textured 3D Earth that tumbles like a gyro (it
// rotates on two axes so every part of the planet comes into view, not a flat
// 2D spin). Self-registering web component, self-contained ES module (three is
// dynamic-imported so it doesn't depend on the page's global THREE).
//
// Attribute: spin — bump it (a changing token) to kick the globe into a fast
// spin that eases back to its idle tumble, so it spins WITH Musk's wheel.
(function () {
  const THREE_URL = 'https://esm.sh/three@0.160.0';
  const TEX = '/odds-of-surviving-ai/textures/';
  const NIGHT_FULL = 1.0;   // city-light fade factor (1 alive → 0 on annihilation)
  const CAM_BASE = 2.9;     // camera distance while the wheel is in play
  const CAM_BURN = 5.0;     // pulled back on annihilation: planet shrinks, open space appears around it
  const SPIN_DUR = 4.5;     // seconds to decelerate from the fast doom-spin to a slow drift
  const FAST_RATE = 0.45;   // gentle spin (rad/s) on death — slow enough to watch the transition
  const SLOW_RATE = 0.05;   // it never fully stops — keeps this slow drift forever
  const ROCKET_AT = 4.02;   // burnT starts ~0.12s after the needle lands → rocket lifts off exactly 4.14s after annihilation starts
  const HAZE = 0.1;         // lingering opacity of explosion particles — overlaps build the covering haze
  const HAZE_ORBIT = 0.05;  // rad/s the settled debris haze slowly revolves round the dead planet
  // the planet stays alive and lit for most of the sequence, then dies late — lights fade and the grey
  // creeps in only over the last few seconds, finishing right as the rocket + satellites blow (~8.9s)
  const LIGHTS0 = 4.8, LIGHTS1 = 7.4;   // city lights hold, then fade to dark
  const DEAD_IN0 = 6.0, DEAD_IN1 = 8.6;   // grey dead planet fades in last of all
  const smoothstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  // analytic polar-spin angle: integral of the deceleration FAST_RATE → SLOW_RATE over SPIN_DUR,
  // then a forever slow drift. Offsetting by its value at ROCKET_AT lands the launch site at the
  // launch corner exactly when the rocket lifts off (and it keeps drifting after — never stops).
  const _spinPhase = (t) => { const D = SPIN_DUR, k = Math.max(0, 1 - t / D); return SLOW_RATE * t + (FAST_RATE - SLOW_RATE) * D / 3 * (1 - k * k * k); };
  const SPIN_PHASE = _spinPhase(ROCKET_AT);

  class EarthGlobe extends HTMLElement {
    static get observedAttributes() { return ['spin', 'burn', 'reduced', 'boom']; }
    connectedCallback() {
      if (this._booted) return;
      this._booted = true;
      this.style.display = 'block';
      this.style.position = 'absolute';
      this.style.inset = '0';
      this.style.width = '100%';
      this.style.height = '100%';
      this._init().catch((e) => console.error('[earth-globe] init failed:', e));
    }
    disconnectedCallback() {
      this._stop = true;
      if (this._raf) cancelAnimationFrame(this._raf);
      if (this._ro) this._ro.disconnect();
      if (this._renderer) this._renderer.dispose && this._renderer.dispose();
    }
    attributeChangedCallback(name, oldV, newV) {
      if (name === 'spin' && this._ready && newV && newV !== oldV) this._boost();
      // annihilation: kill the city lights (fade the night-light intensity to 0)
      if (name === 'burn' && this._ready) this._nightTarget = this._isBurning() ? 0 : NIGHT_FULL;
      if (name === 'reduced') this._reduced = this._isReduced();
      // the host fires this exactly when the doom video ends → detonate the rocket + nearest sats now
      if (name === 'boom' && newV && newV !== '0' && newV !== oldV) this._boomPending = true;
    }
    _isBurning() { const v = this.getAttribute('burn'); return !!v && v !== '0' && v !== 'false'; }
    _isReduced() { const v = this.getAttribute('reduced'); return !!v && v !== '0' && v !== 'false'; }

    async _init() {
      const THREE = await import(THREE_URL);
      this.THREE = THREE;
      const w = this.clientWidth || 165, h = this.clientHeight || 165;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(w, h, false);
      renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
      renderer.setClearColor(0x000000, 0);   // fully transparent — no flash when the canvas resizes
      renderer.domElement.style.cssText = 'width:100%;height:100%;display:block';
      this.appendChild(renderer.domElement); this._renderer = renderer;

      const scene = new THREE.Scene(); this._scene = scene;
      const camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 100);
      camera.position.set(0, 0, 2.9); camera.lookAt(0, 0, 0); this._camera = camera;

      const loader = new THREE.TextureLoader();
      const dayMap = loader.load(TEX + 'earth_color.jpg'); dayMap.anisotropy = 4;
      const nightMap = loader.load(TEX + 'earth_night.jpg'); nightMap.anisotropy = 4;

      // day/night shader: lit hemisphere shows the day map, the dark hemisphere
      // shows the city lights; the terminator is fixed to the sun, so as the
      // globe turns, regions roll from day into night and the lights come on.
      const earth = new THREE.Mesh(
        new THREE.SphereGeometry(1, 64, 64),
        new THREE.ShaderMaterial({
          uniforms: {
            dayMap: { value: dayMap },
            nightMap: { value: nightMap },
            nightInt: { value: NIGHT_FULL },
            dead: { value: 0 },
            sunDir: { value: new THREE.Vector3(2.6, 1.2, 2.2).normalize() },
          },
          vertexShader:
            'varying vec2 vUv; varying vec3 vVN;' +
            'void main(){ vUv = uv; vVN = normalMatrix * normal; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
          fragmentShader:
            'uniform sampler2D dayMap; uniform sampler2D nightMap; uniform float nightInt; uniform float dead;' +
            'varying vec2 vUv; varying vec3 vVN;' +
            'void main(){' +
            '  vec3 day = texture2D(dayMap, vUv).rgb;' +
            '  vec3 night = texture2D(nightMap, vUv).rgb;' +
            // screen-space top light so the sphere reads 3D (bright top, darker bottom);
            // on a dead world the falloff flattens and lifts so the sphere stays readable
            '  float topN = clamp(normalize(vVN).y * 0.42 + 0.66, 0.44, 1.0);' +     // flatter so live continents read top-to-bottom
            '  float topD = clamp(normalize(vVN).y * 0.34 + 0.74, 0.5, 1.0);' +
            '  float top = mix(topN, topD, dead);' +
            '  float lum = dot(night, vec3(0.3, 0.59, 0.11));' +
            '  vec3 lights = night * smoothstep(0.11, 0.4, lum) * 4.6;' +              // golden city lights only (no blue wash, no striations)
            '  float oceanL = clamp((day.b - max(day.r, day.g)) * 9.0, 0.0, 1.0);' +
            '  vec3 baseN = mix(day * 0.95, vec3(0.014, 0.02, 0.034), oceanL);' +     // natural land colours (green forests, tan deserts) over near-black sea
            '  vec3 live = baseN + lights * nightInt;' +                              // nightInt fades ONLY the human city lights; the land/continents stay lit
            // --- dead desert world: derive sea vs land from the map's blueness ---
            '  float ocean = clamp((day.b - max(day.r, day.g)) * 9.0, 0.0, 1.0);' +
            '  ocean = clamp(ocean * 1.4, 0.0, 1.0);' +                               // catastrophic sea-level rise drowns the coasts
            '  ocean = max(ocean, 1.0 - smoothstep(0.05, 0.135, vUv.y));' +           // Antarctica (south pole) melted → open sea
            '  vec3 desert = vec3(0.34, 0.28, 0.23);' +                              // dark, dull grey-orange land — no colour variation
            '  vec3 sea = vec3(0.045, 0.05, 0.062);' +                               // near-black dead water
            '  vec3 deadCol = mix(desert, sea, ocean);' +
            '  vec3 col = mix(live, deadCol, dead) * top;' +
            '  gl_FragColor = vec4(col, 1.0);' +
            '}',
        })
      );
      // mount the earth in a tilted pivot so it spins on its polar axis like a
      // real globe (a lean of ~23.5°, nodded slightly toward the viewer) rather
      // than tumbling in every direction.
      const pivot = new THREE.Group();
      pivot.rotation.z = 0.41; pivot.rotation.x = -0.12;
      scene.add(pivot); pivot.add(earth);
      this._earth = earth; this._pivot = pivot;

      // Dead-planet pose: rotate the globe so Starbase / Boca Chica, Texas (~26°N, 97°W)
      // sits at the 13:30 spot (45° up-right of top), so a rocket launching radially off
      // the pad reads as heading up-and-right. bocaLocal is that lat/lon mapped through the
      // texture's equirectangular UV onto the sphere; we rotate it to the fixed launch dir.
      this._launchDir = new THREE.Vector3(-0.46, 0.52, 0.82).normalize();   // up-left, tipped further toward camera so more of the US shows at launch
      // build an orientation that puts Florida (Cape Canaveral, ~28.5°N 80.6°W) at launchDir,
      // with the north pole tilted toward the viewer so more of the northern hemisphere
      // (Europe) shows in the annihilation view
      const bocaLocal = new THREE.Vector3(0.1526, 0.4772, 0.8655).normalize();
      const northLocal = new THREE.Vector3(0, 1, 0), worldUp = new THREE.Vector3(0, 0.9, 0.42).normalize();
      const orthoUp = (up, f) => up.clone().addScaledVector(f, -up.dot(f)).normalize();
      const fS = bocaLocal.clone(), uS = orthoUp(northLocal, fS), rS = new THREE.Vector3().crossVectors(uS, fS).normalize();
      const fT = this._launchDir.clone(), uT = orthoUp(worldUp, fT), rT = new THREE.Vector3().crossVectors(uT, fT).normalize();
      const mS = new THREE.Matrix4().makeBasis(rS, uS, fS), mT = new THREE.Matrix4().makeBasis(rT, uT, fT);
      this._deadQuat = new THREE.Quaternion().setFromRotationMatrix(mT.multiply(mS.clone().transpose()));
      this._tmp = new THREE.Vector3();

      // faint blue atmospheric rim at the very edge of the disc
      const atmo = new THREE.Mesh(
        new THREE.SphereGeometry(1.03, 48, 48),
        new THREE.MeshBasicMaterial({ color: 0x86b4ff, transparent: true, opacity: 0.28, side: THREE.BackSide, blending: THREE.AdditiveBlending })
      );
      scene.add(atmo); this._atmo = atmo;

      // ── orbiting satellites + space junk, revealed on annihilation ──
      // A dead grey Earth, but the hardware keeps circling: a handful of small
      // satellites (solar-panel wings) and scattered debris on slow tilted orbits.
      const orbiters = new THREE.Group();
      orbiters.visible = false;
      scene.add(orbiters);
      // lights so the metallic parts read as 3D — these don't touch the
      // ShaderMaterial earth or the MeshBasic atmosphere, only the standard mats below
      const keyLight = new THREE.DirectionalLight(0xfff2e6, 3.1); keyLight.position.set(2.6, 1.4, 2.2);
      scene.add(keyLight, new THREE.AmbientLight(0x9fb4cc, 1.0));

      const orbMats = [];
      const rand = (a, b) => a + Math.random() * (b - a);
      const mat = (o) => { const m = new THREE.MeshStandardMaterial(o); m.transparent = true; m.opacity = 0; orbMats.push(m); return m; };
      // a satellite: small central body + two solar-panel wings on short booms
      const bodyGeo = new THREE.BoxGeometry(0.06, 0.06, 0.09);
      const wingGeo = new THREE.BoxGeometry(0.135, 0.004, 0.058);
      const boomGeo = new THREE.BoxGeometry(0.05, 0.008, 0.008);
      const makeSat = () => {
        const g = new THREE.Group();
        g.add(new THREE.Mesh(bodyGeo, mat({ color: 0xd4d8df, metalness: 0.9, roughness: 0.35, emissive: 0x8d929b, emissiveIntensity: 0.6 })));
        const wm = mat({ color: 0x2f63bd, metalness: 0.5, roughness: 0.5, emissive: 0x2350a8, emissiveIntensity: 1.3 });
        const bm = mat({ color: 0x9aa0a8, metalness: 0.8, roughness: 0.5, emissive: 0x4a4e55, emissiveIntensity: 0.5 });
        for (const dir of [-1, 1]) {
          const boom = new THREE.Mesh(boomGeo, bm); boom.position.x = dir * 0.055;
          const wing = new THREE.Mesh(wingGeo, wm); wing.position.x = dir * 0.125;
          g.add(boom, wing);
        }
        return g;
      };
      // debris: small irregular bits
      const junkGeo = [new THREE.TetrahedronGeometry(0.024), new THREE.BoxGeometry(0.03, 0.015, 0.02), new THREE.BoxGeometry(0.013, 0.013, 0.038), new THREE.OctahedronGeometry(0.02)];
      const makeJunk = (i) => new THREE.Mesh(junkGeo[i % junkGeo.length], mat({ color: 0xa7abb4, metalness: 0.7, roughness: 0.6, emissive: 0x595d66, emissiveIntensity: 0.6 }));

      // Each orbiter gets its own tilted plane, radius, size, speed and spin, so the
      // field reads as scattered debris in open space — not evenly spaced on a track.
      this._sats = [];
      const addOrbiter = (mesh, scale, tumble, aMin, aMax) => {
        mesh.scale.setScalar(scale);
        const pivot = new THREE.Group();
        pivot.rotation.set(rand(-1.5, 1.5), rand(0, Math.PI * 2), rand(-1.5, 1.5));
        pivot.add(mesh); orbiters.add(pivot);
        const a = rand(aMin, aMax);                    // semi-major (globe radius is 1)
        this._sats.push({ mesh, a, b: a * rand(0.8, 1.0), ang: rand(0, Math.PI * 2), spd: rand(0.045, 0.14) * (Math.random() < 0.5 ? -1 : 1), yaw: rand(0, Math.PI * 2), tumble, dead: false });
      };
      for (let i = 0; i < 20; i++) addOrbiter(makeSat(), rand(0.42, 0.85), 0, 1.14, 1.78);
      for (let i = 0; i < 70; i++) addOrbiter(makeJunk(i), rand(0.38, 0.95), rand(0.4, 1.9), 1.16, 2.12);
      this._orbiters = orbiters; this._orbMats = orbMats; this._orbOpacity = 0;

      // ── rocket: ONE launch off the dead planet a few seconds in; arcs out a short way ──
      // detailed, coloured (steel-blue body, burnt-orange nose/band), SpaceX-ish silhouette
      this._up = new THREE.Vector3(0, 1, 0);
      const steelMat = new THREE.MeshStandardMaterial({ color: 0x9fb0c6, metalness: 0.92, roughness: 0.28, emissive: 0x49566b, emissiveIntensity: 0.6, transparent: true, opacity: 0 });
      const accentMat = new THREE.MeshStandardMaterial({ color: 0xe06a2a, metalness: 0.5, roughness: 0.4, emissive: 0xc2491a, emissiveIntensity: 0.95, transparent: true, opacity: 0 });
      const darkMat = new THREE.MeshStandardMaterial({ color: 0x2b2f37, metalness: 0.7, roughness: 0.5, emissive: 0x15171c, emissiveIntensity: 0.4, transparent: true, opacity: 0 });
      const rocket = new THREE.Group();
      rocket.add(new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.015, 0.092, 16), steelMat));        // slender body (axis +Y)
      const rkNose = new THREE.Mesh(new THREE.ConeGeometry(0.013, 0.036, 16), accentMat); rkNose.position.y = 0.064; rocket.add(rkNose);
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.0135, 0.0135, 0.009, 16), accentMat); band.position.y = 0.026; rocket.add(band);
      const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.018, 16), darkMat); skirt.position.y = -0.055; rocket.add(skirt);
      for (let i = 0; i < 4; i++) {                          // grid fins near the top
        const a = i * Math.PI / 2;
        const gf = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.016, 0.012), darkMat);
        gf.position.set(Math.cos(a) * 0.016, 0.034, Math.sin(a) * 0.016); gf.rotation.y = -a; rocket.add(gf);
      }
      for (let i = 0; i < 4; i++) {                          // landing fins at the base
        const a = i * Math.PI / 2 + Math.PI / 4;
        const lg = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.02, 0.009), steelMat);
        lg.position.set(Math.cos(a) * 0.019, -0.058, Math.sin(a) * 0.019); lg.rotation.y = -a; rocket.add(lg);
      }
      // bright additive thrust flame at the engine
      const flameMat = new THREE.MeshBasicMaterial({ color: 0xffb050, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.07, 12), flameMat); flame.position.y = -0.085; flame.rotation.x = Math.PI; rocket.add(flame);
      rocket.visible = false; rocket.scale.setScalar(1.2); scene.add(rocket);
      this._rocket = rocket; this._rocketMats = [steelMat, accentMat, darkMat]; this._flameMat = flameMat;
      // thrust-trail particle pool (additive plume behind the rocket)
      const trail = [];
      for (let i = 0; i < 14; i++) {
        const m = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffd0a0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
        m.visible = false; scene.add(m); trail.push({ mesh: m, life: 0 });
      }
      this._trail = trail; this._trailIdx = 0;
      this._rk = { state: 'idle', cool: 3.2, t: 0, dur: 5.0, spawn: 0, p0: null, p1: null, p2: null };

      // ── explosion particle pool — soft additive sprites (smoky haze, not hard bubbles) ──
      const softTex = (() => {
        const c = document.createElement('canvas'); c.width = c.height = 64;
        const g = c.getContext('2d');
        const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
        grd.addColorStop(0, 'rgba(255,255,255,0.9)');
        grd.addColorStop(0.35, 'rgba(255,255,255,0.28)');
        grd.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
        return new THREE.CanvasTexture(c);
      })();
      const ex = [];
      for (let i = 0; i < 1000; i++) {           // big enough that NOTHING recycles — every blast's smoke persists
        // NORMAL blending (not additive) so the haze reads as dust/smoke and does NOT glow over the planet
        const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex, color: 0x9a8b78, transparent: true, opacity: 0, blending: THREE.NormalBlending, depthWrite: false }));
        m.visible = false; m.scale.setScalar(0.05); scene.add(m); ex.push({ mesh: m, vel: new THREE.Vector3(), age: 0, active: false, base: 1 });
      }
      this._ex = ex; this._exIdx = 0;
      // bright expanding flares (the flash at the moment each thing detonates) — soft sprites
      const fl = [];
      for (let i = 0; i < 16; i++) {
        const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex, color: 0xfff0c0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
        m.visible = false; m.scale.setScalar(0.1); scene.add(m); fl.push({ mesh: m, life: 0, max: 0.28, base: 1 });
      }
      this._fl = fl; this._flIdx = 0;
      this._seq = { phase: 'idle', idx: 0, next: 0, order: null, rocketBoom: false };

      this._ready = true;
      this._reduced = this._isReduced();
      // honour burn/reduced attributes that were already set before init finished
      this._nightTarget = this._isBurning() ? 0 : NIGHT_FULL;
      earth.material.uniforms.nightInt.value = this._nightTarget;
      earth.material.uniforms.dead.value = this._isBurning() ? 1 : 0;
      camera.position.z = this._isBurning() ? CAM_BURN : CAM_BASE;
      if (this._isBurning()) { pivot.rotation.set(0, 0, 0); earth.quaternion.copy(this._deadQuat); }   // already in launch pose
      this._idle = 0.22;       // idle longitude spin (rad/s)
      this._spinV = this._idle;
      this._last = performance.now();
      this._ro = new ResizeObserver(() => this._resize()); this._ro.observe(this);
      this._loop();
    }

    _boost() { this._spinV = 4.2; }   // kick on a wheel spin; eases back to idle

    // quadratic-bezier position + tangent for the rocket's short arc
    _bezier(a, b, c, t) { const mt = 1 - t; return a.clone().multiplyScalar(mt * mt).addScaledVector(b, 2 * mt * t).addScaledVector(c, t * t); }
    _bezierTan(a, b, c, t) { const mt = 1 - t; const v = b.clone().sub(a).multiplyScalar(2 * mt); return v.addScaledVector(c.clone().sub(b), 2 * t); }
    _hideTrail() { if (this._trail) for (const p of this._trail) { p.life = 0; p.mesh.visible = false; } }
    _beginLaunch() {
      const R = this._rk, dir = this._launchDir;        // always off Boca Chica, heading 13:30
      R.p0 = dir.clone().multiplyScalar(1.02);           // on the pad
      R.p1 = dir.clone().multiplyScalar(1.3).addScaledVector(this._up, 0.03);
      R.p2 = dir.clone().multiplyScalar(1.6).addScaledVector(this._up, 0.06);   // short hop, straight up-right
      R.t = 0; R.dur = 5.0; R.spawn = 0; R.state = 'flying';
      this._rocket.visible = true;
    }
    _tickRocket(dt, burning) {
      const R = this._rk;
      // always fade any live trail embers
      for (const p of this._trail) {
        if (p.life > 0) {
          p.life -= dt / 0.55; const k = Math.max(0, p.life);
          p.mesh.material.opacity = k * 0.95; p.mesh.scale.setScalar(0.4 + (1 - k) * 1.9);
          if (p.life <= 0) p.mesh.visible = false;
        }
      }
      if (!burning) { R.state = 'idle'; R.cool = 3.2; this._rocket.visible = false; return; }   // re-arm for a fresh annihilation
      if (R.state === 'done') return;                                                            // only one launch per annihilation
      if (R.state === 'idle') { if ((this._burnT || 0) >= ROCKET_AT) this._beginLaunch(); return; }   // launch once the planet has turned to the pad
      R.t += dt / R.dur;
      if (R.t > 0.985) R.t = 0.985;   // hover at apex (no fizzle) until the cascade chain reaches it last
      const pos = this._bezier(R.p0, R.p1, R.p2, R.t);
      const vel = this._bezierTan(R.p0, R.p1, R.p2, R.t).normalize();
      this._rocket.position.copy(pos);
      this._rocket.quaternion.setFromUnitVectors(this._up, vel);                                  // nose leads
      const op = Math.min(1, R.t * 7);                                                            // fade in off the pad, then stay solid (no fizzle)
      for (const m of this._rocketMats) m.opacity = op;
      this._flameMat.opacity = op * (0.7 + 0.3 * Math.sin(R.t * 80));                              // flickering thrust
      this._rocket.visible = op > 0.02;
      R.spawn -= dt;
      if (R.spawn <= 0) {                                                                          // drop a plume ember at the tail
        R.spawn = 0.018;
        const p = this._trail[this._trailIdx % this._trail.length]; this._trailIdx++;
        p.mesh.position.copy(pos).addScaledVector(vel, -0.05);
        p.life = 1; p.mesh.visible = true; p.mesh.material.opacity = 0.85;
      }
    }

    // spray a burst of additive particles from a point (one explosion)
    _burst(pos, count, color, speed, size) {
      const THREE = this.THREE;
      for (let i = 0; i < count; i++) {
        const p = this._ex[this._exIdx % this._ex.length]; this._exIdx++;
        p.mesh.position.copy(pos);
        const d = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);
        if (d.lengthSq() < 1e-4) d.set(0, 1, 0);
        d.normalize().multiplyScalar(speed * (0.35 + Math.random()));
        p.vel.copy(d);
        p.age = 0; p.active = true; p.base = size * (0.5 + Math.random());
        p.mesh.material.color.setHex(color); p.mesh.material.opacity = 1;
        p.mesh.scale.setScalar(p.base); p.mesh.visible = true;
      }
    }
    _flash(pos, size, color) {
      const f = this._fl[this._flIdx % this._fl.length]; this._flIdx++;
      f.mesh.position.copy(pos); f.mesh.material.color.setHex(color); f.mesh.material.opacity = 1;
      f.life = 1; f.max = 0.22 + Math.random() * 0.12; f.base = size; f.mesh.scale.setScalar(size * 0.3); f.mesh.visible = true;
    }
    _explodeSat(s) {
      if (!s || s.dead) return; s.dead = true;
      const pos = s.mesh.getWorldPosition(this._tmp).clone();
      this._flash(pos, 0.32, 0xffce82);                      // bright flash stays additive (brief)
      this._burst(pos, 10, 0x9a8b78, 0.7, 0.22);             // a few big soft smoke puffs that PERSIST (no recycle)
      s.mesh.visible = false;
    }
    _explodeRocket() {
      if (this._rk.state !== 'flying') return;
      const pos = this._rocket.position.clone();
      this._flash(pos, 1.1, 0xffd28a);                       // big flash
      this._flash(pos, 0.6, 0xfff4dc);                       // hot white core
      this._burst(pos, 52, 0x8f8070, 1.05, 0.28);            // a real blast — bigger than a satellite's
      this._rk.state = 'done'; this._rocket.visible = false; this._flameMat.opacity = 0; this._hideTrail();
    }
    _cascadeOrder() {
      // sweep inward toward the rocket: the FURTHEST satellites blow first, the NEAREST last
      const live = this._sats.filter((s) => !s.dead);
      if (!live.length) return [];
      const rp = this._rocket.position;
      const pts = live.map((s) => ({ s, d: s.mesh.getWorldPosition(new this.THREE.Vector3()).distanceToSquared(rp) }));
      pts.sort((a, b) => b.d - a.d);   // furthest from the rocket first → nearest last
      return pts.map((p) => p.s);
    }
    _tickDestruct(dt, burning) {
      const S = this._seq;
      if (!burning) {                                        // re-arm for a fresh annihilation
        if (S.phase !== 'idle') {
          for (const s of this._sats) { s.dead = false; s.mesh.visible = true; }
          for (const p of this._ex) { p.active = false; p.mesh.visible = false; }
        }
        S.phase = 'idle'; S.idx = 0; S.order = null; this._boomPending = false; return;
      }
      // finale — the doom video just ended: every satellite still alive (the nearest cluster)
      // plus the rocket detonate together, exactly in sync with the video ending.
      if ((this._boomPending || (this._burnT || 0) > 13) && S.phase !== 'done') {
        this._boomPending = false;
        for (const s of this._sats) if (!s.dead) this._explodeSat(s);
        this._explodeRocket();
        S.phase = 'done'; return;
      }
      if (S.phase === 'done') return;
      if (S.phase === 'idle') {                              // begin once the rocket has lifted off
        if (this._rk.state === 'flying' && this._rk.t > 0.28) { S.phase = 'cascade'; S.idx = 0; S.next = 0.15; S.order = this._cascadeOrder(); }
        return;
      }
      if (S.phase === 'cascade') {
        // explode the FAR satellites inward toward the rocket, but HOLD the nearest ~30%
        // (and the rocket) for the finale so they go off with the video's end
        S.next -= dt;
        const holdAt = Math.floor(S.order.length * 0.7);
        while (S.next <= 0 && S.idx < holdAt) {
          this._explodeSat(S.order[S.idx]); S.idx++;
          S.next += 0.045 + Math.random() * 0.02;
        }
      }
    }

    _resize() {
      if (!this._ready) return;
      const w = this.clientWidth || 165, h = this.clientHeight || 165;
      this._renderer.setSize(w, h, false); this._camera.aspect = w / h; this._camera.updateProjectionMatrix();
    }

    _loop() {
      const step = () => {
        if (this._stop) return;
        this._raf = requestAnimationFrame(step);
        const now = performance.now(); const dt = Math.min((now - this._last) / 1000, 0.05); this._last = now;
        const anim = !this._reduced;   // reduced motion → no spin/orbit/drift, just the static end state
        const e = this._earth;
        const burning = this._isBurning();
        // ease the city lights toward their target (full, or 0 on annihilation)
        if (e) {
          const u = e.material.uniforms;
          if (!burning) {                                          // recover to the living earth
            u.nightInt.value += (1 - u.nightInt.value) * Math.min(1, dt * 3);
            u.dead.value += (0 - u.dead.value) * Math.min(1, dt * 3);
          } else if (anim) {
            // sequenced death so you can appreciate it: lights + earth go dark FIRST,
            // then (after a beat) the grey dead planet fades in from the dark
            const lt = this._burnT;
            u.nightInt.value = 1 - smoothstep(LIGHTS0, LIGHTS1, lt);
            u.dead.value = smoothstep(DEAD_IN0, DEAD_IN1, lt);
          } else {                                                 // reduced motion → final dead state
            u.nightInt.value = 0; u.dead.value = 1;
          }
        }
        // atmospheric glow fades with the death itself (stays full while the planet is still alive)
        if (this._atmo) {
          const dv = e ? e.material.uniforms.dead.value : (burning ? 1 : 0);
          const am = this._atmo.material, at = 0.28 - 0.23 * dv;
          am.opacity = anim ? am.opacity + (at - am.opacity) * Math.min(1, dt * 2) : at;
        }
        // planet orientation: spin + drift while alive; on annihilation rotate to the fixed
        // Boca Chica launch pose and hold, so the launch + cascade play against a steady globe
        if (burning) this._burnT = (this._burnT || 0) + dt; else { this._burnT = 0; this._deadSpin = 0; }
        if (anim && e) {
          if (burning) {
            // keep turning on the polar axis, decelerating from the fast doom-spin to a
            // slow drift that never fully stops (launch corner passes through as it slows)
            const angle = _spinPhase(this._burnT) - SPIN_PHASE;   // 0 at ROCKET_AT → launch site on the pad
            if (!this._spinQuat) this._spinQuat = new this.THREE.Quaternion();
            this._spinQuat.setFromAxisAngle(this._up, angle);
            e.quaternion.copy(this._deadQuat).multiply(this._spinQuat);
            this._pivot.rotation.set(0, 0, 0);
          } else {
            this._spinV += (this._idle - this._spinV) * Math.min(1, dt * 0.7);
            e.rotation.y += this._spinV * dt;
            this._pivot.rotation.x = -0.1 + 0.5 * Math.sin(now * 0.00037);
            this._pivot.rotation.z = 0.38 + 0.34 * Math.sin(now * 0.00021);
          }
        }
        // satellites + space junk: orbit, and fade in only on annihilation (exploded ones stay gone)
        if (this._sats) {
          for (const s of this._sats) {
            if (s.dead) continue;
            if (anim) {
              s.ang += s.spd * dt;
              if (s.tumble) { s.mesh.rotation.x += s.tumble * dt; s.mesh.rotation.z += s.tumble * 0.6 * dt; }
            }
            s.mesh.position.set(Math.cos(s.ang) * s.a, 0, Math.sin(s.ang) * s.b);
            if (!s.tumble) s.mesh.rotation.y = -s.ang + s.yaw;
          }
          const tgt = burning ? 1 : 0;
          this._orbOpacity = anim ? this._orbOpacity + (tgt - this._orbOpacity) * Math.min(1, dt * 1.6) : tgt;
          this._orbiters.visible = this._orbOpacity > 0.012;
          for (const m of this._orbMats) m.opacity = this._orbOpacity;
        }
        // rocket launch cycle — only while annihilated, and never under reduced motion
        if (this._rocket) {
          if (anim) this._tickRocket(dt, burning);
          else { this._rocket.visible = false; this._hideTrail(); }
        }
        // pull the camera back on annihilation so the planet sits in open space
        const cz = burning ? CAM_BURN : CAM_BASE;
        this._camera.position.z = anim ? this._camera.position.z + (cz - this._camera.position.z) * Math.min(1, dt * 1.4) : cz;
        // destruction cascade: satellites flare and blow in a chain, catching the rocket
        if (anim) this._tickDestruct(dt, burning);
        // explosion particles: burst out, settle (drag), then LINGER as a debris haze
        if (this._ex) {
          for (const p of this._ex) {
            if (!p.active) continue;
            p.age += dt;
            p.mesh.position.addScaledVector(p.vel, dt);
            p.vel.multiplyScalar(0.92);                          // drag → they settle into a shell round the planet
            if (p.age > 0.5) p.mesh.position.applyAxisAngle(this._up, HAZE_ORBIT * dt);   // settled remnants slowly orbit
            const fade = Math.min(1, p.age / 0.5);                // puff out → settle to a lingering haze; never disappears
            p.mesh.material.opacity = 0.42 * (1 - fade) + HAZE * fade;
            p.mesh.scale.setScalar(p.base * (0.6 + Math.min(1, p.age * 0.8) * 2.4));   // soft smoke that keeps swelling, overlapping into a covering haze
          }
        }
        // expanding flares
        if (this._fl) {
          for (const f of this._fl) {
            if (f.life > 0) {
              f.life -= dt / f.max;
              const k = Math.max(0, f.life);
              f.mesh.material.opacity = k;
              f.mesh.scale.setScalar(f.base * (0.3 + (1 - k) * 1.5));
              if (f.life <= 0) f.mesh.visible = false;
            }
          }
        }
        this._renderer.render(this._scene, this._camera);
      };
      step();
    }
  }
  if (!customElements.get('earth-globe')) customElements.define('earth-globe', EarthGlobe);
})();
