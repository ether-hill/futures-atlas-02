// <dario-die> — a real physics d12 (true regular dodecahedron) on Three.js +
// cannon-es. Self-registering web component, self-contained ES modules (loaded
// via dynamic import so it doesn't depend on the page's global THREE).
//
// Attributes:  facecolor, numcolor, reduced, rolltoken
// The die is the SINGLE SOURCE OF TRUTH: it rolls with real physics, comes to
// rest in one settle, STAYS put, and dispatches the face it actually landed on
// via CustomEvent('die-settled',{detail:{face}}). The host reads that value.
// Invisible walls + a clamped throw keep it inside the frame. Rolls only on a
// roll-token bump — never on device motion.
(function () {
  const THREE_URL = 'https://esm.sh/three@0.160.0';
  const CANNON_URL = 'https://esm.sh/cannon-es@0.20.0';
  const PHI = (1 + Math.sqrt(5)) / 2;
  const IPHI = 1 / PHI;

  class DarioDie extends HTMLElement {
    static get observedAttributes() { return ['facecolor', 'numcolor', 'rolltoken', 'reduced']; }
    connectedCallback() {
      if (this._booted) return;
      this._booted = true;
      this.style.display = 'block';
      this.style.position = 'relative';
      this._init().catch((e) => console.error('[dario-die] init failed:', e));
    }
    disconnectedCallback() {
      this._stop = true;
      if (this._raf) cancelAnimationFrame(this._raf);
      if (this._ro) this._ro.disconnect();
      if (this._renderer) this._renderer.dispose && this._renderer.dispose();
    }
    attributeChangedCallback(name, oldV, newV) {
      if (!this._ready) return;
      if (name === 'rolltoken') { if (newV && newV !== oldV) { const pw = parseFloat(String(newV).split(':')[1]); this._rollPower = isNaN(pw) ? 0.6 : Math.max(0, Math.min(1, pw)); this._roll(); } }
      else if (name !== 'reduced') this._applyTheme();
    }

    async _init() {
      const [THREE, CANNON] = await Promise.all([import(THREE_URL), import(CANNON_URL)]);
      this.THREE = THREE; this.CANNON = CANNON;
      const w = this.clientWidth || 360, h = this.clientHeight || 360;

      // ---- geometry: true regular dodecahedron, faces known ----
      const V = [];
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) V.push([sx, sy, sz]);
      for (const sy of [-1, 1]) for (const sz of [-1, 1]) V.push([0, sy * IPHI, sz * PHI]);
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) V.push([sx * IPHI, sy * PHI, 0]);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) V.push([sx * PHI, 0, sz * IPHI]);
      const N = [];
      for (const sa of [-1, 1]) for (const sb of [-1, 1]) { N.push([0, sa * PHI, sb]); N.push([sb, 0, sa * PHI]); N.push([sa * PHI, sb, 0]); }
      const len = (a) => Math.hypot(a[0], a[1], a[2]);
      const norm = (a) => { const l = len(a); return [a[0] / l, a[1] / l, a[2] / l]; };
      const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
      const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
      const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
      const circ = len(V[0]);
      const vUnit = V.map(norm), nUnit = N.map(norm);
      const faces = nUnit.map((n) => {
        const five = vUnit.map((v, i) => ({ i, d: dot(v, n) })).sort((a, b) => b.d - a.d).slice(0, 5).map((s) => s.i);
        const c = [0, 0, 0]; five.forEach((i) => { c[0] += V[i][0]; c[1] += V[i][1]; c[2] += V[i][2]; }); c[0] /= 5; c[1] /= 5; c[2] /= 5;
        let ref = null;
        const ang = five.map((i) => {
          const r = sub(V[i], c); if (!ref) ref = norm(r);
          const x = dot(r, ref); const y = dot(r, norm(cross3(n, ref)));
          return { i, a: Math.atan2(y, x) };
        }).sort((p, q) => p.a - q.a);
        let ord = ang.map((p) => p.i);
        if (dot(cross3(sub(V[ord[1]], V[ord[0]]), sub(V[ord[2]], V[ord[0]])), n) < 0) ord = ord.reverse();
        return ord;
      });
      const faceNum = new Array(12).fill(0); let next = 1; const usedN = new Array(12).fill(false);
      for (let a = 0; a < 12 && next <= 6; a++) {
        if (usedN[a]) continue;
        let anti = -1, worst = 2;
        for (let b = 0; b < 12; b++) { if (b === a || usedN[b]) continue; const d = dot(nUnit[a], nUnit[b]); if (d < worst) { worst = d; anti = b; } }
        usedN[a] = usedN[anti] = true; faceNum[a] = next; faceNum[anti] = 13 - next; next++;
      }
      const inrad = Math.abs(dot(V[faces[0][0]], nUnit[0]));
      const RADIUS = 1.0;           // die size
      const SCALE = RADIUS / circ;
      const FLOOR_Y = 0;
      const BOUND = 4.2;            // square play field — as large as the panel allows
      this._inradWorld = inrad * SCALE; this._floorY = FLOOR_Y; this._bound = BOUND;

      // ---- three scene ----
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(w, h, false);
      renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
      renderer.domElement.style.cssText = 'width:100%;height:100%;display:block';
      this.appendChild(renderer.domElement); this._renderer = renderer;
      const scene = new THREE.Scene(); this._scene = scene;
      // reference framing, pulled in a touch for this panel (physics unchanged)
      const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
      camera.position.set(0, 9.0, 8.7); camera.lookAt(0, 0.05, 0); this._camera = camera;

      try {
        const pmrem = new THREE.PMREMGenerator(renderer);
        const envScene = new THREE.Scene();
        envScene.add(new THREE.Mesh(new THREE.SphereGeometry(8, 16, 12), new THREE.MeshBasicMaterial({ color: 0x3a3a42, side: THREE.BackSide })));
        const panel = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), new THREE.MeshBasicMaterial({ color: 0xffffff }));
        panel.position.set(0, 7, 1); panel.rotation.x = Math.PI / 2; envScene.add(panel);
        scene.environment = pmrem.fromScene(envScene, 0.04).texture;
      } catch (e) { console.warn('[dario-die] env skipped', e); }

      // exact reference lighting
      scene.add(new THREE.HemisphereLight(0xffffff, 0x202030, 0.55));
      const key = new THREE.DirectionalLight(0xffffff, 2.1);
      key.position.set(3.5, 8, 4); key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024); key.shadow.camera.near = 1; key.shadow.camera.far = 25;
      key.shadow.camera.left = -5.5; key.shadow.camera.right = 5.5; key.shadow.camera.top = 5.5; key.shadow.camera.bottom = -5.5;
      key.shadow.bias = -0.0004; scene.add(key);
      const rim = new THREE.DirectionalLight(0x88a0ff, 0.6); rim.position.set(-4, 3, -4); scene.add(rim);

      const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.34 }));
      floor.rotation.x = -Math.PI / 2; floor.position.y = FLOOR_Y; floor.receiveShadow = true; scene.add(floor);

      // visible boundary — marks exactly where the die is allowed to travel
      const bPts = [[-BOUND, -BOUND], [BOUND, -BOUND], [BOUND, BOUND], [-BOUND, BOUND], [-BOUND, -BOUND]]
        .map(([x, z]) => new THREE.Vector3(x, FLOOR_Y + 0.015, z));
      const bLineMat = new THREE.LineBasicMaterial({ color: 0xFF5DA2, transparent: true, opacity: 0 });
      const bLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(bPts), bLineMat);
      scene.add(bLine);
      const bGlowMat = new THREE.MeshBasicMaterial({ color: 0xFF5DA2, transparent: true, opacity: 0, side: THREE.DoubleSide });
      const bGlow = new THREE.Mesh(new THREE.PlaneGeometry(BOUND * 2, BOUND * 2), bGlowMat);
      bGlow.rotation.x = -Math.PI / 2; bGlow.position.y = FLOOR_Y + 0.008; scene.add(bGlow);
      // the mat fades in on load (paired with the die falling onto it)
      this._matMats = [{ mat: bLineMat, target: 0.34 }, { mat: bGlowMat, target: 0.05 }];
      this._matFade = 0;

      // body mesh
      const positions = [], normals = [], numByFace = [];
      faces.forEach((f, fi) => {
        const n = nUnit[fi];
        const c = [0, 0, 0]; f.forEach((i) => { c[0] += V[i][0]; c[1] += V[i][1]; c[2] += V[i][2]; }); c[0] /= 5; c[1] /= 5; c[2] /= 5;
        for (let k = 1; k <= 3; k++) [f[0], f[k], f[k + 1]].forEach((vi) => { positions.push(V[vi][0] * SCALE, V[vi][1] * SCALE, V[vi][2] * SCALE); normals.push(n[0], n[1], n[2]); });
        numByFace.push({ center: [c[0] * SCALE, c[1] * SCALE, c[2] * SCALE], normal: n, num: faceNum[fi] });
      });
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
      this._bodyMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(this.getAttribute('facecolor') || '#f4efe2'), roughness: 0.33, metalness: 0.0, envMapIntensity: 0.9, flatShading: true });
      const dieGroup = new THREE.Group(); this._die = dieGroup; scene.add(dieGroup);
      const body = new THREE.Mesh(geo, this._bodyMat); body.castShadow = true; body.receiveShadow = true; dieGroup.add(body);
      dieGroup.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 8), new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.16 })));

      // numerals — upright basis per face
      this._numMeshes = [];
      const worldUp = new THREE.Vector3(0, 1, 0);
      const basisQuat = (z) => {
        const yref = Math.abs(z.dot(worldUp)) > 0.94 ? new THREE.Vector3(0, 0, 1) : worldUp;
        const y = yref.clone().addScaledVector(z, -yref.dot(z)).normalize();
        const x = new THREE.Vector3().crossVectors(y, z).normalize();
        return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
      };
      numByFace.forEach((nf) => {
        const mat = new THREE.MeshBasicMaterial({ map: this._numTexture(nf.num), transparent: true, depthWrite: false });
        const plane = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.46), mat);
        const nrm = new THREE.Vector3(nf.normal[0], nf.normal[1], nf.normal[2]);
        plane.position.set(nf.center[0], nf.center[1], nf.center[2]).addScaledVector(nrm, 0.012);
        plane.quaternion.copy(basisQuat(nrm.clone())); plane.renderOrder = 5;
        dieGroup.add(plane);
        this._numMeshes.push({ mesh: plane, mat, num: nf.num, localNormal: nrm.clone() });
      });
      this._faceNormals = numByFace.map((nf) => new THREE.Vector3(nf.normal[0], nf.normal[1], nf.normal[2]));
      this._faceNumOf = numByFace.map((nf) => nf.num);

      // ---- physics: floor + 4 invisible walls (keep the die in frame) ----
      const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -26, 0) });
      world.allowSleep = true;
      world.defaultContactMaterial.restitution = 0.42; world.defaultContactMaterial.friction = 0.3;
      this._world = world;
      const ground = new CANNON.Body({ mass: 0, shape: new CANNON.Plane() });
      ground.quaternion.setFromEuler(-Math.PI / 2, 0, 0); ground.position.set(0, FLOOR_Y, 0); world.addBody(ground);
      // exact reference: 4 solid box walls forming a square field at ±BOUND
      [[-BOUND, 0], [BOUND, 0], [0, -BOUND], [0, BOUND]].forEach(([wx, wz]) => {
        const wb = new CANNON.Body({ mass: 0, shape: new CANNON.Box(new CANNON.Vec3(wx === 0 ? BOUND + 0.6 : 0.5, 4, wz === 0 ? BOUND + 0.6 : 0.5)) });
        wb.position.set(wx, FLOOR_Y + 4, wz); world.addBody(wb);
      });
      const shape = new CANNON.ConvexPolyhedron({ vertices: V.map((v) => new CANNON.Vec3(v[0] * SCALE, v[1] * SCALE, v[2] * SCALE)), faces: faces.map((f) => f.slice()) });
      const dieBody = new CANNON.Body({ mass: 1, shape, linearDamping: 0.03, angularDamping: 0.05 });
      dieBody.sleepSpeedLimit = 0.12; dieBody.sleepTimeLimit = 0.55; dieBody.allowSleep = true;
      world.addBody(dieBody); this._dieBody = dieBody;

      // collision-driven audio: emit one 'die-impact' per real bounce so the
      // host's clatter tracks the actual physics instead of a fixed timeline
      this._lastImpact = -1;
      dieBody.addEventListener('collide', (ev) => {
        if (this._phase !== 'tumble') return;
        const now = performance.now();
        if (now - this._lastImpact < 55) return;
        let v = 0;
        try { v = Math.abs(ev.contact.getImpactVelocityAlongNormal()); } catch (e) {}
        if (v < 1.4) return;
        this._lastImpact = now;
        const strength = Math.min(1, v / 9);
        this.dispatchEvent(new CustomEvent('die-impact', { detail: { strength }, bubbles: true, composed: true }));
      });

      this._ready = true;
      this._matT0 = performance.now();
      if (this.getAttribute('reduced') === '1') {
        // reduced motion: no drop, mat already visible
        this._restToFaceUp(7, true); this._phase = 'rest'; this._rolling = false;
        this._matFade = 1; this._matMats.forEach((m) => { m.mat.opacity = m.target; });
      } else {
        this._introDrop();          // the die falls onto the mat as it fades in
      }
      this._ro = new ResizeObserver(() => this._resize()); this._ro.observe(this);
      this._loop();
    }

    _numTexture(n, color) {
      const THREE = this.THREE; const s = 256;
      const c = document.createElement('canvas'); c.width = c.height = s;
      const ctx = c.getContext('2d');
      ctx.font = '700 150px Archivo, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = color || this.getAttribute('numcolor') || '#1a1813'; ctx.fillText(String(n), s / 2, s / 2 + 6);
      if (n === 6 || n === 9) ctx.fillRect(s / 2 - 42, s / 2 + 78, 84, 12);
      const tex = new THREE.CanvasTexture(c); tex.anisotropy = 4;
      if ('colorSpace' in tex) tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    }
    // accent-highlight the result numeral so it's unambiguous which face is the result
    _highlight(num) {
      this._clearHi();
      const nm = this._numMeshes.find((m) => m.num === num);
      if (!nm) return;
      nm.mat.map = this._numTexture(num, '#E0481B'); nm.mat.needsUpdate = true;
      nm.mesh.scale.set(1.14, 1.14, 1.14);
      this._hiMesh = nm;
    }
    _clearHi() {
      if (!this._hiMesh) return;
      this._hiMesh.mat.map = this._numTexture(this._hiMesh.num); this._hiMesh.mat.needsUpdate = true;
      this._hiMesh.mesh.scale.set(1, 1, 1); this._hiMesh = null;
    }
    _applyTheme() {
      if (!this._ready) return;
      this._bodyMat.color.set(this.getAttribute('facecolor') || '#f4efe2');
      this._numMeshes.forEach((nm) => { nm.mat.map = this._numTexture(nm.num); nm.mat.needsUpdate = true; });
    }
    _syncMesh() {
      const b = this._dieBody, d = this._die;
      d.position.set(b.position.x, b.position.y, b.position.z);
      d.quaternion.set(b.quaternion.x, b.quaternion.y, b.quaternion.z, b.quaternion.w);
    }
    _resize() {
      if (!this._ready) return;
      const w = this.clientWidth || 360, h = this.clientHeight || 360;
      this._renderer.setSize(w, h, false); this._camera.aspect = w / h; this._camera.updateProjectionMatrix();
    }
    _emit(face) { this.dispatchEvent(new CustomEvent('die-settled', { detail: { face }, bubbles: true, composed: true })); }

    // place the die at rest on the floor with `face` pointing up (used for the
    // initial pose and the reduced-motion path; the real roll is pure physics)
    _restToFaceUp(face, instant) {
      const THREE = this.THREE, b = this._dieBody;
      const idx = this._faceNumOf.indexOf(face);
      const n = this._faceNormals[idx].clone();
      const q = new THREE.Quaternion().setFromUnitVectors(n, new THREE.Vector3(0, 1, 0));
      q.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.random() * Math.PI * 2));
      b.quaternion.set(q.x, q.y, q.z, q.w);
      // rest centred so the die always starts balanced in the middle of the field
      b.position.set(0, this._floorY + this._inradWorld, 0);
      b.velocity.setZero(); b.angularVelocity.setZero(); b.sleep();
      this._syncMesh();
      if (instant) { this._phase = 'rest'; this._rolling = false; this._emit(face); }
    }

    // which face value is currently pointing up (max world-space +Y normal)
    _topFace() {
      let best = -2, num = 7; const q = this._die.quaternion;
      for (let i = 0; i < this._faceNormals.length; i++) {
        const y = this._faceNormals[i].clone().applyQuaternion(q).y;
        if (y > best) { best = y; num = this._faceNumOf[i]; }
      }
      return num;
    }

    // load-in: drop the die from above so it falls onto the mat. Not a "roll" —
    // it settles silently (no result highlight, no die-settled emit).
    _introDrop() {
      const b = this._dieBody;
      b.wakeUp();
      b.position.set(0, this._floorY + 2.7, 0);
      b.velocity.set(0, -0.4, 0);
      b.angularVelocity.set((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 5);
      b.quaternion.setFromEuler(Math.random() * 6.28, Math.random() * 6.28, Math.random() * 6.28);
      this._calm = 0;
      this._phase = 'intro'; this._rolling = false;
      this._t0 = performance.now(); this._last = performance.now();
    }

    _roll() {
      if (!this._ready || this._rolling) return;
      const b = this._dieBody;
      this._clearHi();
      if (this.getAttribute('reduced') === '1') { const f = 1 + Math.floor(Math.random() * 12); this._restToFaceUp(f, true); this._highlight(f); return; }
      b.wakeUp();
      // Always launch from the CENTRE of the mat so the die can never get trapped
      // in a corner and "barely move". Power (0..1, from the charged release)
      // scales the throw — even the lightest tap clears the mat and tumbles
      // several times; a full hold sends it ricocheting off every wall. The
      // chaotic tumble keeps it a fair d12; the walls keep it in frame.
      const pw = (typeof this._rollPower === 'number') ? this._rollPower : 0.6;
      b.position.set(0, this._floorY + this._inradWorld + 0.1, 0);
      const dir = Math.random() * Math.PI * 2;
      const speed = 7.5 + pw * 7.5;          // 7.5..15 horizontal — always crosses the field
      b.velocity.set(Math.cos(dir) * speed, 5.2 + pw * 2.6, Math.sin(dir) * speed);
      const spin = 24 + pw * 26;             // 24..50 angular
      b.angularVelocity.set((Math.random() - 0.5) * spin, (Math.random() - 0.5) * spin, (Math.random() - 0.5) * spin);
      this._calm = 0;
      this._rolling = true; this._phase = 'tumble'; this._t0 = performance.now(); this._last = performance.now();
    }

    _loop() {
      const CANNON = this.CANNON;
      const step = () => {
        if (this._stop) return;
        this._raf = requestAnimationFrame(step);
        const b = this._dieBody;
        if (this._phase === 'tumble' || this._phase === 'intro') {
          // exact reference integration: real frame dt, fixed 1/120 step, 4 substeps
          const now = performance.now();
          const dt = Math.min((now - this._last) / 1000, 0.05); this._last = now;
          this._world.step(1 / 120, dt, 4);
          this._syncMesh();
          // settle as soon as the die has actually stopped moving — don't wait
          // on cannon's sleep timer (which can lag the visible stop by seconds).
          const motion = b.velocity.length() + b.angularVelocity.length();
          if (motion < 0.3 && now - this._t0 > 350) { this._calm += dt; } else { this._calm = 0; }
          if (b.sleepState === CANNON.Body.SLEEPING || this._calm > 0.22 || now - this._t0 > 8000) {
            // settled once, stays exactly there — read the actual top face
            b.sleep();
            const wasIntro = this._phase === 'intro';
            this._phase = 'rest'; this._rolling = false;
            if (!wasIntro) {
              const tf = this._topFace();
              this._highlight(tf);   // accent the result face so it's unambiguous
              this._emit(tf);
            }
          }
        }
        // 'rest': do nothing — the die stays exactly where it landed.
        // fade the mat in over the first ~0.9s (paired with the intro drop)
        if (this._matMats && this._matFade < 1) {
          const k = Math.min(1, (performance.now() - this._matT0) / 900);
          this._matFade = k;
          this._matMats.forEach((m) => { m.mat.opacity = m.target * k; });
        }
        if (this._numMeshes) {
          const camDir = this._camera.position.clone().sub(this._die.position).normalize();
          const dq = this._die.quaternion;
          this._numMeshes.forEach((nm) => { nm.mesh.visible = nm.localNormal.clone().applyQuaternion(dq).dot(camDir) > 0.1; });
        }
        this._renderer.render(this._scene, this._camera);
      };
      step();
    }
  }
  if (!customElements.get('dario-die')) customElements.define('dario-die', DarioDie);
})();
