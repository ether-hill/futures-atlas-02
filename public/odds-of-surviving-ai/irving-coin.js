// <irving-coin> — a real physics coin toss (Three.js + cannon-es), for Geoffrey Irving's
// coin flip. Self-registering web component, same pattern as <dario-die>.
//
// Attributes:
//   tosstoken  bump it ("n:power") to toss
//   want       '' = let the physics decide; 'heads' | 'tails' = the host needs that side
//              (TEST buttons). It is still a real toss: we pre-run candidate throws in a
//              scratch world and play the first one whose physics lands that way. The run
//              you watch is the same fixed-step simulation, so it lands exactly as found.
//   hangms     how long the coin hangs at the top of its flight (slow motion)
//   reduced    '1' = no animation, the coin is simply turned to its side
//
// Events (bubbling): coin-hang {ms} at the apex · coin-impact {strength} per bounce ·
//                    coin-settled {side} once it has stopped.
(function () {
  const THREE_URL = 'https://esm.sh/three@0.160.0';
  const CANNON_URL = 'https://esm.sh/cannon-es@0.20.0';
  const R = 1, TH = 0.13;          // coin radius and thickness (world units)
  const WALL = 3.1;                // invisible walls keep it in frame
  const G = -26;                   // same gravity as the die
  const STEP = 1 / 180;            // fixed step: the replay must match the pre-run exactly
  const MAX_SIM = 9;               // seconds of simulated time before we call it settled

  class IrvingCoin extends HTMLElement {
    static get observedAttributes() { return ['tosstoken', 'want', 'hangms', 'reduced']; }
    connectedCallback() {
      if (this._booted) return;
      this._booted = true;
      this.style.display = 'block'; this.style.position = 'absolute'; this.style.inset = '0';
      this._init().catch((e) => console.error('[irving-coin] init failed:', e));
    }
    disconnectedCallback() {
      this._stop = true;
      if (this._raf) cancelAnimationFrame(this._raf);
      if (this._ro) this._ro.disconnect();
      if (this._renderer) this._renderer.dispose && this._renderer.dispose();
    }
    attributeChangedCallback(name, oldV, newV) {
      if (!this._ready) return;
      if (name === 'tosstoken' && newV && newV !== oldV && newV.split(':')[0] !== '0') {
        const pw = parseFloat(String(newV).split(':')[1]);
        // next tick: 'want' may be set in the same render, after this attribute
        setTimeout(() => this._toss(isNaN(pw) ? 0.6 : Math.max(0, Math.min(1, pw))), 0);
      }
    }

    async _init() {
      const [THREE, CANNON] = await Promise.all([import(THREE_URL), import(CANNON_URL)]);
      this.THREE = THREE; this.CANNON = CANNON;
      try { await document.fonts.ready; } catch (e) {}
      const w = this.clientWidth || 360, h = this.clientHeight || 360;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(w, h, false);
      renderer.setClearColor(0x000000, 0);
      renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
      if ('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.domElement.style.cssText = 'width:100%;height:100%;display:block';
      this.appendChild(renderer.domElement); this._renderer = renderer;
      this._maxAniso = renderer.capabilities.getMaxAnisotropy ? renderer.capabilities.getMaxAnisotropy() : 8;

      const scene = new THREE.Scene(); this._scene = scene;
      const camera = new THREE.PerspectiveCamera(34, w / h, 0.1, 100); this._camera = camera;

      // a soft studio for the metal to reflect: dark room, one big bright softbox, one cool strip
      try {
        const pmrem = new THREE.PMREMGenerator(renderer);
        const env = new THREE.Scene();
        env.add(new THREE.Mesh(new THREE.SphereGeometry(10, 24, 16), new THREE.MeshBasicMaterial({ color: 0x24242c, side: THREE.BackSide })));
        const box = new THREE.Mesh(new THREE.PlaneGeometry(10, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
        box.position.set(0, 7, 3); box.lookAt(0, 0, 0); env.add(box);
        const strip = new THREE.Mesh(new THREE.PlaneGeometry(2, 10), new THREE.MeshBasicMaterial({ color: 0x9fb4ff }));
        strip.position.set(-7, 2, -2); strip.lookAt(0, 0, 0); env.add(strip);
        const warm = new THREE.Mesh(new THREE.PlaneGeometry(3, 8), new THREE.MeshBasicMaterial({ color: 0xffd9c4 }));
        warm.position.set(7, 3, 1); warm.lookAt(0, 0, 0); env.add(warm);
        scene.environment = pmrem.fromScene(env, 0.02).texture;
      } catch (e) {}

      scene.add(new THREE.HemisphereLight(0xffffff, 0x1a1030, 0.35));
      const key = new THREE.DirectionalLight(0xffffff, 1.8);
      key.position.set(3, 10, 5); key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024); key.shadow.camera.near = 1; key.shadow.camera.far = 30;
      key.shadow.camera.left = -6; key.shadow.camera.right = 6; key.shadow.camera.top = 6; key.shadow.camera.bottom = -6;
      key.shadow.bias = -0.0005; key.shadow.radius = 4; scene.add(key);

      const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.42 }));
      floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
      // a faint ring marks the table, like the die's mat
      const ringMat = new THREE.MeshBasicMaterial({ color: 0xFBEFFF, transparent: true, opacity: 0.1, depthWrite: false });
      const ring = new THREE.Mesh(new THREE.RingGeometry(WALL - 0.04, WALL, 96), ringMat);
      ring.rotation.x = -Math.PI / 2; ring.position.y = 0.005; scene.add(ring);
      const spot = new THREE.Mesh(new THREE.CircleGeometry(WALL, 96), new THREE.MeshBasicMaterial({ color: 0xFF5DA2, transparent: true, opacity: 0.045, depthWrite: false }));
      spot.rotation.x = -Math.PI / 2; spot.position.y = 0.003; scene.add(spot);

      // ---- the coin: a round, milled-edge silver coin with struck faces ----
      const geo = new THREE.CylinderGeometry(R, R, TH, 96, 1, false);
      const faceMat = (side) => {
        const { color, bump } = this._faceTextures(side);
        return new THREE.MeshStandardMaterial({ map: color, bumpMap: bump, bumpScale: 2.2, metalness: 1, roughness: 0.3, envMapIntensity: 1.25 });
      };
      const edge = this._edgeTexture();
      const sideMat = new THREE.MeshStandardMaterial({ map: edge.color, bumpMap: edge.bump, bumpScale: 1.4, metalness: 1, roughness: 0.34, envMapIntensity: 1.2 });
      // CylinderGeometry groups: 0 = side, 1 = top cap (+Y, heads), 2 = bottom cap (-Y, tails)
      const coin = new THREE.Mesh(geo, [sideMat, faceMat('heads'), faceMat('tails')]);
      coin.castShadow = true; coin.receiveShadow = true;
      scene.add(coin); this._coin = coin;

      this._camT = 0;             // 0 = looking down at the coin on the table, 1 = side-on for the flight
      this._camGoal = 0;
      this._fitCamera();

      const { world, body } = this._makeWorld();
      this._world = world; this._body = body;
      this._restFlat('heads');
      this._phase = 'rest';
      this._ts = 1; this._tsGoal = 1; this._acc = 0;

      this._ready = true;
      this._ro = new ResizeObserver(() => this._resize()); this._ro.observe(this);
      this._last = performance.now();
      this._loop();
    }

    // ---------- textures ----------
    _faceTextures(side) {
      const THREE = this.THREE, S = 1024, c = S / 2;
      const col = document.createElement('canvas'); col.width = col.height = S;
      const hgt = document.createElement('canvas'); hgt.width = hgt.height = S;
      const C = col.getContext('2d'), H = hgt.getContext('2d');
      // base metal: a brushed silver disc
      const g = C.createRadialGradient(c * 0.8, c * 0.7, 20, c, c, c);
      g.addColorStop(0, '#f1f3f6'); g.addColorStop(0.6, '#d3d7de'); g.addColorStop(1, '#b8bdc6');
      C.fillStyle = g; C.fillRect(0, 0, S, S);
      for (let i = 0; i < 2600; i++) {   // fine radial brushing
        const a = Math.random() * Math.PI * 2, r0 = Math.random() * c * 0.9, l = 6 + Math.random() * 30;
        C.strokeStyle = Math.random() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(60,66,78,0.045)';
        C.lineWidth = 1; C.beginPath(); C.arc(c, c, r0, a, a + l / Math.max(40, r0)); C.stroke();
      }
      H.fillStyle = '#808080'; H.fillRect(0, 0, S, S);
      // both maps get the same artwork: height in white (raised), colour as a slightly brighter struck relief
      const both = (fn) => {
        H.save(); H.fillStyle = '#ffffff'; H.strokeStyle = '#ffffff'; fn(H); H.restore();
        C.save(); C.fillStyle = 'rgba(255,255,255,0.32)'; C.strokeStyle = 'rgba(255,255,255,0.32)'; fn(C); C.restore();
        C.save(); C.translate(3, 4); C.fillStyle = 'rgba(30,34,44,0.22)'; C.strokeStyle = 'rgba(30,34,44,0.22)'; fn(C); C.restore();
      };
      // raised rim and a beaded inner circle
      both((X) => { X.lineWidth = 34; X.beginPath(); X.arc(c, c, c - 22, 0, Math.PI * 2); X.stroke(); });
      both((X) => { for (let i = 0; i < 96; i++) { const a = i / 96 * Math.PI * 2; X.beginPath(); X.arc(c + Math.cos(a) * (c - 70), c + Math.sin(a) * (c - 70), 6, 0, Math.PI * 2); X.fill(); } });
      const arcText = (X, txt, rad, startA, size, inward) => {
        X.font = '700 ' + size + 'px Archivo, "Helvetica Neue", Arial, sans-serif'; X.textAlign = 'center'; X.textBaseline = 'middle';
        const spacing = size * 0.92 / rad;
        const total = spacing * (txt.length - 1);
        for (let i = 0; i < txt.length; i++) {
          const a = startA + (inward ? -1 : 1) * (-total / 2 + i * spacing);
          X.save(); X.translate(c + Math.cos(a) * rad, c + Math.sin(a) * rad); X.rotate(a + (inward ? -Math.PI / 2 : Math.PI / 2)); X.fillText(txt[i], 0, 0); X.restore();
        }
      };
      if (side === 'heads') {
        both((X) => { X.font = '900 400px Archivo, "Helvetica Neue", Arial, sans-serif'; X.textAlign = 'center'; X.textBaseline = 'middle'; X.fillText('50', c, c + 18); });
        both((X) => arcText(X, 'HEADS', c - 140, -Math.PI / 2, 74, false));
        both((X) => arcText(X, 'PER CENT', c - 140, Math.PI / 2, 60, true));
      } else {
        // tails: an engraved globe
        both((X) => {
          X.lineWidth = 16; const r = 250;
          X.beginPath(); X.arc(c, c + 10, r, 0, Math.PI * 2); X.stroke();
          for (const k of [-0.62, -0.25, 0.25, 0.62]) { X.beginPath(); X.ellipse(c, c + 10, r * Math.abs(k) * 1.15, r, 0, 0, Math.PI * 2); X.stroke(); }
          for (const y of [-0.5, 0, 0.5]) { const hw = Math.sqrt(1 - y * y) * r; X.beginPath(); X.moveTo(c - hw, c + 10 + y * r); X.lineTo(c + hw, c + 10 + y * r); X.stroke(); }
        });
        both((X) => arcText(X, 'TAILS', c - 140, -Math.PI / 2, 74, false));
        both((X) => arcText(X, 'EVERYONE', c - 140, Math.PI / 2, 56, true));
      }
      const mk = (cv, srgb) => { const t = new THREE.CanvasTexture(cv); t.anisotropy = this._maxAniso; if (srgb && 'colorSpace' in t) t.colorSpace = THREE.SRGBColorSpace; return t; };
      // three's cap UVs put +x of the canvas along +x of the coin; flip the bottom cap so tails reads upright
      const color = mk(col, true), bump = mk(hgt, false);
      if (side === 'tails') { for (const t of [color, bump]) { t.center.set(0.5, 0.5); t.rotation = Math.PI; } }
      return { color, bump };
    }
    _edgeTexture() {
      const THREE = this.THREE, W = 2048, Hh = 64;
      const col = document.createElement('canvas'); col.width = W; col.height = Hh;
      const hgt = document.createElement('canvas'); hgt.width = W; hgt.height = Hh;
      const C = col.getContext('2d'), H = hgt.getContext('2d');
      const n = 220;   // the milling: fine reeds round the edge
      for (let i = 0; i < n; i++) {
        const x = i / n * W, wd = W / n;
        const gC = C.createLinearGradient(x, 0, x + wd, 0); gC.addColorStop(0, '#9aa0aa'); gC.addColorStop(0.5, '#eef0f3'); gC.addColorStop(1, '#8e949e');
        C.fillStyle = gC; C.fillRect(x, 0, wd + 1, Hh);
        const gH = H.createLinearGradient(x, 0, x + wd, 0); gH.addColorStop(0, '#202020'); gH.addColorStop(0.5, '#ffffff'); gH.addColorStop(1, '#202020');
        H.fillStyle = gH; H.fillRect(x, 0, wd + 1, Hh);
      }
      const mk = (cv, srgb) => { const t = new THREE.CanvasTexture(cv); t.anisotropy = this._maxAniso; if (srgb && 'colorSpace' in t) t.colorSpace = THREE.SRGBColorSpace; return t; };
      return { color: mk(col, true), bump: mk(hgt, false) };
    }

    // ---------- physics ----------
    _makeWorld() {
      const CANNON = this.CANNON;
      const world = new CANNON.World({ gravity: new CANNON.Vec3(0, G, 0) });
      world.allowSleep = false;
      world.solver.iterations = 14;
      world.defaultContactMaterial.restitution = 0.34; world.defaultContactMaterial.friction = 0.32;
      const ground = new CANNON.Body({ mass: 0, shape: new CANNON.Plane() });
      ground.quaternion.setFromEuler(-Math.PI / 2, 0, 0); world.addBody(ground);
      [[-WALL, 0], [WALL, 0], [0, -WALL], [0, WALL]].forEach(([wx, wz]) => {
        const wb = new CANNON.Body({ mass: 0, shape: new CANNON.Box(new CANNON.Vec3(wx === 0 ? WALL + 0.6 : 0.5, 8, wz === 0 ? WALL + 0.6 : 0.5)) });
        wb.position.set(wx + Math.sign(wx) * 0.5, 8, wz + Math.sign(wz) * 0.5); world.addBody(wb);
      });
      const body = new CANNON.Body({ mass: 1, shape: new CANNON.Cylinder(R, R, TH, 32), linearDamping: 0.02, angularDamping: 0.04 });
      world.addBody(body);
      return { world, body };
    }
    _restFlat(side) {
      const b = this._body;
      b.position.set(0, TH / 2 + 0.001, 0);
      if (side === 'tails') b.quaternion.setFromEuler(Math.PI, Math.PI / 2, 0); else b.quaternion.setFromEuler(0, -Math.PI / 2, 0);
      b.velocity.setZero(); b.angularVelocity.setZero();
      this._sync();
    }
    _sideOf(q) {
      // local +Y (the heads face) in world space
      const x = q.x, y = q.y, z = q.z, w = q.w;
      const upY = 1 - 2 * (x * x + z * z);
      return upY >= 0 ? 'heads' : 'tails';
    }
    // one candidate throw. power widens the throw a little; the rest is chance
    _randomThrow(power) {
      const r = (a, b) => a + Math.random() * (b - a);
      const startSide = this._sideOf(this._body.quaternion);
      const yaw = r(0, Math.PI * 2);
      return {
        start: startSide, yaw,
        v: [r(-0.7, 0.7), 11.2 + power * 2.6 + r(-0.5, 0.5), r(-0.9, 0.3)],
        // spin end over end about a horizontal diameter, plus a little wobble. Kept to 2-3 turns a second:
        // faster than that, at 60 frames a second the coin strobes and reads as jitter
        w: (() => { const s = (13 + power * 6 + r(-2, 2)) * (Math.random() < 0.5 ? -1 : 1); const a = r(0, Math.PI * 2); return [Math.cos(a) * s, r(-1.6, 1.6), Math.sin(a) * s]; })(),
      };
    }
    _apply(body, T) {
      body.position.set(this._body.position.x * 0, TH / 2 + 0.02, 0);
      if (T.start === 'tails') body.quaternion.setFromEuler(Math.PI, T.yaw, 0); else body.quaternion.setFromEuler(0, T.yaw, 0);
      body.velocity.set(T.v[0], T.v[1], T.v[2]);
      body.angularVelocity.set(T.w[0], T.w[1], T.w[2]);
    }
    // run a throw to the end in a scratch world: which side does it land on?
    _presim(T) {
      const { world, body } = this._makeWorld();
      this._apply(body, T);
      let calm = 0, t = 0;
      while (t < MAX_SIM) {
        world.step(STEP); t += STEP;
        if (t > 0.4 && body.velocity.length() < 0.06 && body.angularVelocity.length() < 0.12) { calm += STEP; if (calm > 0.25) break; } else calm = 0;
      }
      return this._sideOf(body.quaternion);
    }

    _toss(power) {
      const want = this.getAttribute('want') || '';
      const hang = parseFloat(this.getAttribute('hangms')) || 4000;
      if (this.getAttribute('reduced') === '1') {
        const side = want || (Math.random() < 0.5 ? 'heads' : 'tails');
        this._restFlat(side); this._phase = 'rest';
        this._emit('coin-hang', { ms: 0 });
        setTimeout(() => this._emit('coin-settled', { side }), 30);
        return;
      }
      let T = this._randomThrow(power);
      if (want) {
        for (let i = 0; i < 14; i++) { if (this._presim(T) === want) break; T = this._randomThrow(power); }
      }
      const { world, body } = this._makeWorld();
      this._world = world; this._body = body;
      this._apply(body, T);
      this._lastImpact = 0;
      body.addEventListener('collide', (ev) => {
        if (this._phase !== 'flying') return;
        let v = 0; try { v = Math.abs(ev.contact.getImpactVelocityAlongNormal()); } catch (e) {}
        const now = performance.now();
        if (v < 0.9 || now - this._lastImpact < 45) return;
        this._lastImpact = now;
        this._emit('coin-impact', { strength: Math.min(1, v / 8) });
      });
      this._prevP = body.position.clone(); this._prevQ = body.quaternion.clone();
      this._phase = 'flying'; this._simT = 0; this._calm = 0; this._apexDone = false;
      this._hangMs = hang; this._hangUntil = 0;
      this._acc = 0; this._ts = 1; this._tsGoal = 1;
      this._camGoal = 1;
    }
    _emit(name, detail) { this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true })); }
    _sync(alpha) {
      const b = this._body, m = this._coin;
      if (alpha == null || !this._prevP) {
        m.position.set(b.position.x, b.position.y, b.position.z);
        m.quaternion.set(b.quaternion.x, b.quaternion.y, b.quaternion.z, b.quaternion.w);
        return;
      }
      const P = this._prevP, Q = this._prevQ, T = this.THREE;
      m.position.set(P.x + (b.position.x - P.x) * alpha, P.y + (b.position.y - P.y) * alpha, P.z + (b.position.z - P.z) * alpha);
      this._qa = this._qa || new T.Quaternion(); this._qb = this._qb || new T.Quaternion();
      this._qa.set(Q.x, Q.y, Q.z, Q.w); this._qb.set(b.quaternion.x, b.quaternion.y, b.quaternion.z, b.quaternion.w);
      m.quaternion.copy(this._qa).slerp(this._qb, alpha);
    }

    // ---------- camera ----------
    // two poses: high and close over the table (to read the face), and side-on and back for the flight.
    // The vertical FOV is fitted to the panel's aspect so the table never crops on a narrow screen.
    _fitCamera() {
      const cam = this._camera; if (!cam) return;
      const k = this._camT, e = k * k * (3 - 2 * k);
      // the camera tracks a focus point: the coin itself at rest (wherever it landed), and a
      // softened version of its position in flight, so it stays in frame on its way up and at the hang
      const F = this._focus || { x: 0, y: 0, z: 0 };
      // at rest the camera also swings round the coin so its face reads upright (screen-up = the coin's local +x)
      const az = this._az || 0, sa = Math.sin(az), ca = Math.cos(az);
      const hi = { p: [F.x - sa * 2.6, 6.2, F.z - ca * 2.6], l: [F.x + sa * 0.05, 0, F.z + ca * 0.05], half: [1.6, 1.6] };            // resting: looking down at the coin
      const sd = { p: [F.x * 0.5, 3.4 + F.y * 0.35, 10.5], l: [F.x, 1.6 + F.y * 0.75, F.z * 0.6], half: [3.4, 3.4] };   // flight
      const L = (a, b) => a + (b - a) * e;
      cam.position.set(L(hi.p[0], sd.p[0]), L(hi.p[1], sd.p[1]), L(hi.p[2], sd.p[2]));
      const lx = L(hi.l[0], sd.l[0]), ly = L(hi.l[1], sd.l[1]), lz = L(hi.l[2], sd.l[2]);
      cam.lookAt(lx, ly, lz);
      const dist = Math.hypot(cam.position.x - lx, cam.position.y - ly, cam.position.z - lz);
      const halfW = L(hi.half[0], sd.half[0]), halfH = L(hi.half[1], sd.half[1]);
      const tanV = Math.max(halfH / dist, halfW / dist / (cam.aspect || 1)) * 1.04;
      cam.fov = 2 * Math.atan(tanV) * 180 / Math.PI * (1 - (this._push || 0) * 0.5);   // the hang pushes right in on the coin
      cam.updateProjectionMatrix();
    }
    _ease(b, dt, k) {
      // azimuth that puts the coin's local +x at the top of the screen; the default (no coin yet) is the flight camera's (looking toward -z)
      const q = b.quaternion, x = q.x, y = q.y, z = q.z, w = q.w;
      const dx = 1 - 2 * (y * y + z * z), dz = 2 * (x * z - w * y);
      let goal = (Math.abs(dx) + Math.abs(dz) > 0.2) ? Math.atan2(dx, dz) : (this._az || 0);
      if (this._phase === 'flying') goal = Math.PI;   // in flight the high pose (used on the way back down) faces the table from the front
      if (this._az == null) this._az = goal;
      let d = goal - this._az; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
      this._az += d * Math.min(1, dt * 2.2);
      const F = this._focus || (this._focus = { x: 0, y: 0, z: 0 });
      const a = Math.min(1, dt * k);
      const ty = this._phase === 'flying' ? Math.max(0, b.position.y - 1) : 0;
      F.x += (b.position.x - F.x) * a; F.y += (ty - F.y) * a; F.z += (b.position.z - F.z) * a;
    }
    _resize() {
      if (!this._ready) return;
      const w = this.clientWidth || 360, h = this.clientHeight || 360;
      this._renderer.setSize(w, h, false); this._camera.aspect = w / h; this._fitCamera();
    }

    _loop() {
      const step = () => {
        if (this._stop) return;
        this._raf = requestAnimationFrame(step);
        const now = performance.now(); const dt = Math.min((now - this._last) / 1000, 0.05); this._last = now;
        if (this._phase === 'flying') {
          const b = this._body;
          // apex: the questions are asked and the coin hangs, still turning, in slow motion
          if (!this._apexDone && this._simT > 0.15 && b.velocity.y <= 0) {
            this._apexDone = true; this._tsGoal = 0.028; this._hangUntil = now + this._hangMs;
            this._emit('coin-hang', { ms: this._hangMs });
          }
          if (this._hangUntil && now > this._hangUntil) { this._tsGoal = 1; this._hangUntil = 0; }
          this._ts += (this._tsGoal - this._ts) * Math.min(1, dt * (this._tsGoal < this._ts ? 7 : 3.2));
          // fixed steps only (the replay must match the pre-run step for step); slow motion = fewer steps
          this._acc += dt * this._ts;
          let n = 0;
          while (this._acc >= STEP && n < 40) {
            this._prevP.copy(b.position); this._prevQ.copy(b.quaternion);   // keep the last state to interpolate from
            this._world.step(STEP); this._acc -= STEP; this._simT += STEP; n++;
            if (this._simT > 0.4 && b.velocity.length() < 0.06 && b.angularVelocity.length() < 0.12) this._calm += STEP; else this._calm = 0;
            if (this._calm > 0.25 || this._simT > MAX_SIM) break;
          }
          // Render BETWEEN the last two physics states. Physics runs in fixed steps, and in slow motion a
          // step only lands every few frames: drawing the raw state made the coin jump, step to step.
          this._sync(Math.min(1, this._acc / STEP));
          // push in on the hang; follow the coin's height a little
          const pushGoal = this._tsGoal < 0.5 ? 1 : 0;
          this._push = (this._push || 0) + (pushGoal - (this._push || 0)) * Math.min(1, dt * 1.6);
          this._ease(b, dt, 3.2);
          if (this._calm > 0.25 || this._simT > MAX_SIM) {
            this._phase = 'rest'; this._camGoal = 0; this._push = 0; this._sync();
            const side = this._sideOf(b.quaternion);
            setTimeout(() => this._emit('coin-settled', { side }), 650);   // after the camera has come round to see it
          }
        } else {
          this._ease(this._body, dt, 2.4);
          // the coin at rest: hold it exactly where physics left it
        }
        // camera ease between the two poses
        const cg = this._camGoal;
        this._camT += (cg - this._camT) * Math.min(1, dt * (cg > this._camT ? 5 : 2.6));
        this._fitCamera();
        this._renderer.render(this._scene, this._camera);
      };
      step();
    }
  }
  if (!customElements.get('irving-coin')) customElements.define('irving-coin', IrvingCoin);
})();
