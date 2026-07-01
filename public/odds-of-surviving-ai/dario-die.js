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
    static get observedAttributes() { return ['facecolor', 'numcolor', 'rolltoken', 'reduced', 'encase']; }
    connectedCallback() {
      if (this._booted) return;
      this._booted = true;
      this.style.display = 'block';
      // fill the host box (the inline style sets position:absolute;inset:0) — DON'T
      // override to relative, or height:100% collapses to content height and the
      // canvas no longer fills the stage area (breaks aspect + vertical centring).
      this.style.position = 'absolute';
      this.style.inset = '0';
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
      else if (name === 'encase') { this._setEncase(newV === '1'); }
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
      // Rectangular play field, WIDER than deep so it fills the (wide) desktop panel
      // nearly edge-to-edge with only a little padding. BX = half-width, BZ = half-depth.
      const BX = 5.8, BZ = 4.3;
      this._inradWorld = inrad * SCALE; this._floorY = FLOOR_Y; this._bound = BZ;
      this._bx = BX; this._bz = BZ;   // kept for the aspect-aware camera fit

      // ---- three scene ----
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(w, h, false);
      renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
      renderer.domElement.style.cssText = 'width:100%;height:100%;display:block';
      this.appendChild(renderer.domElement); this._renderer = renderer;
      const scene = new THREE.Scene(); this._scene = scene;
      // Framing: dollied in + tighter lens so the mat fills ~2x more of the frame.
      // Camera is high enough to keep the near (front) border off the bottom edge,
      // and there's still headroom above for the (slightly tamed) bounce — see the
      // reduced vertical launch in _roll() that keeps the die inside this frame.
      const camera = new THREE.PerspectiveCamera(39, w / h, 0.1, 100);
      camera.position.set(0, 9.8, 7.2); camera.lookAt(0, -0.6, 0); this._camera = camera;
      this._fitCamera();   // dial the FOV to the panel's shape so the whole field fits, no crop

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

      // visible boundary — marks exactly where the die is allowed to travel.
      // Lifted well off the floor so the near (front) edge doesn't graze the floor
      // and z-fight the glow, and rendered depthTest-off so every edge reads evenly.
      const bPts = [[-BX, -BZ], [BX, -BZ], [BX, BZ], [-BX, BZ], [-BX, -BZ]]
        .map(([x, z]) => new THREE.Vector3(x, FLOOR_Y + 0.04, z));
      const bLineMat = new THREE.LineBasicMaterial({ color: 0xFF7AB6, transparent: true, opacity: 0, depthWrite: false });
      const bLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(bPts), bLineMat);
      bLine.renderOrder = 6; scene.add(bLine);
      // a soft glow just inside the boundary — a faint lighter wash that makes the
      // field read as a mat without a hard line.
      const bGlowMat = new THREE.MeshBasicMaterial({ color: 0xFF5DA2, transparent: true, opacity: 0, side: THREE.DoubleSide });
      const bGlow = new THREE.Mesh(new THREE.PlaneGeometry(BX * 2, BZ * 2), bGlowMat);
      bGlow.rotation.x = -Math.PI / 2; bGlow.position.y = FLOOR_Y + 0.008; scene.add(bGlow);
      // the mat fades in on load (paired with the die falling onto it)
      this._matMats = [{ mat: bLineMat, target: 0.5 }, { mat: bGlowMat, target: 0.06 }];
      this._bLine = bLine; this._bGlow = bGlow;
      this._matFade = 0;

      this._buildVitrine();

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
      this._bodyMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(this.getAttribute('facecolor') || '#f4efe2'), roughness: 0.4, metalness: 0.0, envMapIntensity: 1.15, flatShading: true });
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
      // 4 solid box walls forming the rectangular field at ±BX (x) and ±BZ (z)
      [[-BX, 0], [BX, 0], [0, -BZ], [0, BZ]].forEach(([wx, wz]) => {
        const wb = new CANNON.Body({ mass: 0, shape: new CANNON.Box(new CANNON.Vec3(wx === 0 ? BX + 0.6 : 0.5, 4, wz === 0 ? BZ + 0.6 : 0.5)) });
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
      if (this._encasePending != null) { this._setEncase(this._encasePending); this._encasePending = null; }
      else if (this.getAttribute('encase') === '1') { this._setEncase(true); }
      this._ro = new ResizeObserver(() => this._resize()); this._ro.observe(this);
      this._loop();
    }

    _numTexture(n, color) {
      const THREE = this.THREE; const s = 256;
      const c = document.createElement('canvas'); c.width = c.height = s;
      const ctx = c.getContext('2d');
      ctx.font = '700 150px Archivo, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const ink = color || this.getAttribute('numcolor') || '#1a1813';
      const cx = s / 2, cy = s / 2 + 6;
      // engraved look: a lit lower-right lip + a shadowed upper-left recess behind the ink
      const draw = (dx, dy) => { ctx.fillText(String(n), cx + dx, cy + dy); if (n === 6 || n === 9) ctx.fillRect(cx - 42 + dx, cy + 72 + dy, 84, 12); };
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; draw(2.5, 3.5);   // catch-light on the bottom edge of the groove
      ctx.fillStyle = 'rgba(0,0,0,0.55)'; draw(-2, -2.5);        // shadow inside the top of the groove
      ctx.fillStyle = ink; draw(0, 0);                            // the engraved fill
      const tex = new THREE.CanvasTexture(c); tex.anisotropy = this._maxAniso || 8;
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
      this._renderer.setSize(w, h, false); this._camera.aspect = w / h;
      this._fitCamera();
    }

    // Pick the vertical FOV so the entire play field (plus die height) fits the
    // current panel shape with a little padding — fills a wide desktop panel
    // edge-to-edge, and zooms out just enough on a narrow/portrait screen so the
    // sides are never cropped. Camera position + angle stay fixed; only FOV flexes.
    _fitCamera() {
      const THREE = this.THREE, cam = this._camera;
      if (!cam || !THREE) return;
      cam.updateMatrixWorld(true);
      const viewInv = cam.matrixWorld.clone().invert();
      const BX = this._bx, BZ = this._bz, H = 2.8;   // H: die height (incl. bounce apex) to keep in frame
      // Collect each point's vertical tangent (t = y/-z) and horizontal spread. We
      // centre the FRAME on the mat floor (y=0) and size the FOV to fit everything
      // (floor + die height) around that centre — so the mat sits vertically centred
      // at ANY viewport size (resolution-independent), with bounce headroom above.
      let maxH = 0, matTop = -1e9, matBot = 1e9;
      const ts = [];
      for (const x of [-BX, BX]) for (const z of [-BZ, BZ]) for (const y of [0, H]) {
        const v = new THREE.Vector3(x, y, z).applyMatrix4(viewInv);
        const d = -v.z; if (d <= 0.05) continue;
        const t = v.y / d;
        if (Math.abs(v.x) / d > maxH) maxH = Math.abs(v.x) / d;
        ts.push(t);
        if (y === 0) { if (t > matTop) matTop = t; if (t < matBot) matBot = t; }
      }
      const matCenter = (matTop + matBot) / 2;   // vertical centre of the mat floor
      let reqHalfV = 0;
      for (let i = 0; i < ts.length; i++) { const d = Math.abs(ts[i] - matCenter); if (d > reqHalfV) reqHalfV = d; }
      const pad = 1.08, aspect = cam.aspect || 1;
      const tanV = Math.max(reqHalfV * pad, (maxH * pad) / aspect);
      cam.fov = 2 * Math.atan(tanV) * 180 / Math.PI;
      cam.updateProjectionMatrix();
      // vertical lens shift: drop the mat-floor centre onto the frame centre (NDC y=0).
      // Stored + reapplied every frame in _loop so a stray updateProjectionMatrix can't undo it.
      this._lensY = matCenter / tanV;
      cam.projectionMatrix.elements[9] = this._lensY;
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
      // gentle landing on first load: a small drop with a little spin so it
      // settles near the CENTRE of the mat (not a full energetic roll)
      b.position.set(0, this._floorY + 1.5, 0);
      b.velocity.set(0, -0.3, 0);
      b.angularVelocity.set((Math.random() - 0.5) * 2.2, (Math.random() - 0.5) * 2.2, (Math.random() - 0.5) * 2);
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
      const speed = 7.5 + pw * 7.5;          // 7.5..15 horizontal — crosses the large field & ricochets
      // a bit more vertical pop so it bounces higher; the camera fit reserves matching
      // headroom (see H in _fitCamera) so the higher apex still stays in frame
      b.velocity.set(Math.cos(dir) * speed, 3.9 + pw * 1.8, Math.sin(dir) * speed);
      const spin = 24 + pw * 26;             // 24..50 angular
      b.angularVelocity.set((Math.random() - 0.5) * spin, (Math.random() - 0.5) * spin, (Math.random() - 0.5) * spin);
      this._calm = 0;
      this._rolling = true; this._phase = 'tumble'; this._t0 = performance.now(); this._last = performance.now();
    }

    // ---- museum vitrine: built FROM the mat's own footprint so walls seat exactly on the floor edges ----
    _buildVitrine() {
      const THREE = this.THREE;
      const CX = 2.35, CZ = 1.95, H = 3.1;
      const PLW = 2.7, PLD = 2.55, PLH = 1.15;
      const grp = new THREE.Group(); grp.visible = false; this._scene.add(grp); this._vitrine = grp;
      this._case = { CX, CZ, H, matSX: this._bx / CX, matSZ: this._bz / CZ, glassOp: 1.0, edgeOp: 0.4, plY: -PLH / 2 };
      this._glassMats = []; this._glassMeshes = [];
      this._maxAniso = (this._renderer.capabilities && this._renderer.capabilities.getMaxAnisotropy) ? this._renderer.capabilities.getMaxAnisotropy() : 8;

      // velvet floor with baked ambient occlusion (darker toward walls/corners) = the case BOTTOM
      const vel = new THREE.Mesh(new THREE.PlaneGeometry(2 * CX, 2 * CZ),
        new THREE.MeshStandardMaterial({ map: this._velvetTex(), roughness: 0.78, metalness: 0.0, transparent: true, opacity: 0 }));
      vel.rotation.x = -Math.PI / 2; vel.position.y = 0.02; vel.receiveShadow = true; grp.add(vel); this._velvet = vel;

      // four glass walls (bottom edge on the mat, rising to y=H)
      this._walls = [];
      const mkWall = (w, px, pz, ry) => { const g = new THREE.PlaneGeometry(w, H); g.translate(0, H / 2, 0); const m = new THREE.Mesh(g, this._glassMaterial()); m.position.set(px, 0, pz); m.rotation.y = ry; m.scale.y = 0.0001; m.renderOrder = 4; grp.add(m); this._walls.push(m); this._glassMeshes.push(m); };
      mkWall(2 * CX, 0, CZ, 0);
      mkWall(2 * CX, 0, -CZ, Math.PI);
      mkWall(2 * CZ, -CX, 0, -Math.PI / 2);
      mkWall(2 * CZ, CX, 0, Math.PI / 2);

      const top = new THREE.Mesh(new THREE.PlaneGeometry(2 * CX, 2 * CZ), this._glassMaterial());
      top.rotation.x = -Math.PI / 2; top.position.y = H; top.renderOrder = 4; grp.add(top); this._top = top; this._glassMeshes.push(top);

      // soft light-catching edges (additive glints, not hard lines)
      const boxGeo = new THREE.BoxGeometry(2 * CX, H, 2 * CZ); boxGeo.translate(0, H / 2, 0);
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(boxGeo),
        new THREE.LineBasicMaterial({ color: 0xbfe0ff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
      edges.scale.y = 0.0001; edges.renderOrder = 5; grp.add(edges); this._edges = edges;

      // dark matte plinth + faint top-edge highlight
      const pl = new THREE.Mesh(new THREE.BoxGeometry(2 * PLW, PLH, 2 * PLD),
        new THREE.MeshStandardMaterial({ color: 0x15171d, roughness: 0.62, metalness: 0.04, transparent: true, opacity: 0 }));
      pl.position.set(0, -PLH / 2, 0); pl.castShadow = true; pl.receiveShadow = true; grp.add(pl); this._plinth = pl;
      const rectPts = [[-PLW, PLD], [PLW, PLD], [PLW, -PLD], [-PLW, -PLD], [-PLW, PLD]].map(([x, z]) => new THREE.Vector3(x, 0.005, z));
      const plEdge = new THREE.Line(new THREE.BufferGeometry().setFromPoints(rectPts),
        new THREE.LineBasicMaterial({ color: 0x6b7285, transparent: true, opacity: 0, depthWrite: false }));
      grp.add(plEdge); this._plinthEdge = plEdge;

      // soft contact shadow grounding the whole case
      const cs = new THREE.Mesh(new THREE.PlaneGeometry(2 * PLW * 2.1, 2 * PLD * 2.1),
        new THREE.MeshBasicMaterial({ map: this._radialTex('rgba(0,0,0,0.72)'), transparent: true, opacity: 0, depthWrite: false }));
      cs.rotation.x = -Math.PI / 2; cs.position.y = -PLH + 0.012; cs.renderOrder = -1; grp.add(cs); this._contact = cs;

      // museum placard — a lectern on the plinth's front lip
      const plc = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 0.88),
        new THREE.MeshBasicMaterial({ map: this._placardTexture(), transparent: true, opacity: 0, toneMapped: false }));
      plc.position.set(0, 0.36, PLD - 0.27); plc.rotation.x = -0.72; grp.add(plc); this._placard = plc;

      // spotlight: bright pool on the die + a bright spot on the case floor, soft falloff (kept in the scene at 0 so light-count stays stable)
      const spot = new THREE.SpotLight(0xdfeaf7, 0, 26, 0.46, 0.8, 0.0);
      spot.position.set(0, 11, 1.2); spot.target.position.set(0, 0, 0);
      this._scene.add(spot); this._scene.add(spot.target); this._spot = spot;
    }

    _glassMaterial() {
      const THREE = this.THREE;
      const m = new THREE.MeshPhysicalMaterial({ color: 0xdfeee9, metalness: 0, roughness: 0.045, transparent: true, opacity: 0, envMapIntensity: 2.2, clearcoat: 1, clearcoatRoughness: 0.06, side: THREE.DoubleSide, depthWrite: false });
      // Fresnel: near-invisible head-on, more reflective/visible at grazing angles
      m.onBeforeCompile = (sh) => {
        sh.fragmentShader = sh.fragmentShader.replace('#include <opaque_fragment>',
          'float _fres = pow(1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0), 2.4);\n' +
          '  diffuseColor.a = mix(0.028, 0.4, _fres) * opacity;\n' +
          '  #include <opaque_fragment>');
      };
      m.customProgramCacheKey = () => 'ddGlassFresnel';
      this._glassMats.push(m);
      return m;
    }

    _velvetTex() {
      const THREE = this.THREE; const s = 512;
      const c = document.createElement('canvas'); c.width = c.height = s; const x = c.getContext('2d');
      const g = x.createRadialGradient(s / 2, s / 2, s * 0.08, s / 2, s / 2, s * 0.64);
      g.addColorStop(0, '#1f3b41'); g.addColorStop(0.55, '#162c31'); g.addColorStop(1, '#0c1a1e');
      x.fillStyle = g; x.fillRect(0, 0, s, s);
      const vg = x.createRadialGradient(s / 2, s / 2, s * 0.42, s / 2, s / 2, s * 0.72);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.6)');   // corner AO
      x.fillStyle = vg; x.fillRect(0, 0, s, s);
      const t = new THREE.CanvasTexture(c); t.anisotropy = this._maxAniso || 8; if ('colorSpace' in t) t.colorSpace = THREE.SRGBColorSpace; return t;
    }

    _radialTex(centerColor) {
      const THREE = this.THREE; const s = 256;
      const c = document.createElement('canvas'); c.width = c.height = s; const x = c.getContext('2d');
      const g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      g.addColorStop(0, centerColor); g.addColorStop(0.5, 'rgba(0,0,0,0.34)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g; x.fillRect(0, 0, s, s);
      const t = new THREE.CanvasTexture(c); if ('colorSpace' in t) t.colorSpace = THREE.SRGBColorSpace; return t;
    }

    // one-time cube render so the glass reflects the real dice / placard / lit floor
    _reflect() {
      try {
        const THREE = this.THREE;
        if (!this._reflectRT) {
          this._reflectRT = new THREE.WebGLCubeRenderTarget(128, { generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter });
          this._reflectCam = new THREE.CubeCamera(0.1, 60, this._reflectRT);
          this._reflectCam.position.set(0, this._case.H * 0.42, 0); this._scene.add(this._reflectCam);
        }
        this._glassMeshes.forEach((m) => { m.visible = false; });
        const ev = this._edges.visible; this._edges.visible = false;
        this._reflectCam.update(this._renderer, this._scene);
        this._glassMeshes.forEach((m) => { m.visible = true; });
        this._edges.visible = ev;
        this._glassMats.forEach((m) => { m.envMap = this._reflectRT.texture; m.needsUpdate = true; });
      } catch (e) { /* fall back to scene.environment reflections */ }
    }

    _placardTexture() {
      const THREE = this.THREE; const w = 2560, h = 720;
      const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
      x.fillStyle = '#f8f2e4'; x.fillRect(0, 0, w, h);                 // flat bright ivory = max contrast
      x.strokeStyle = 'rgba(0,0,0,0.32)'; x.lineWidth = 10; x.strokeRect(12, 12, w - 24, h - 24);
      x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillStyle = '#0a0803'; x.font = '800 176px Archivo, system-ui, sans-serif';   // near-black title
      x.fillText('THE DICE', w / 2, 196);
      x.fillStyle = '#15100a'; x.font = '600 italic 100px "Playfair Display", Georgia, serif';   // heavier, darker body
      x.fillText("An artifact of humanity’s final gamble", w / 2, 452);
      x.fillText('on artificial intelligence.', w / 2, 578);
      const t = new THREE.CanvasTexture(c); t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter;
      if ('colorSpace' in t) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = this._maxAniso || 16; return t;
    }

    _setEncase(on) {
      if (!this._vitrine) { this._encasePending = on; return; }
      if (!!on === !!this._encaseOn && this._encaseActive === false && (this._encaseProg === (on ? 1 : 0))) return;
      const THREE = this.THREE, cam = this._camera;
      if (on) {
        // capture the live camera so we can lerp to the hero framing and back
        this._camBase = cam.position.clone(); this._fovBase = cam.fov; this._lensBase = this._lensY || 0;
        this._lookBase = new THREE.Vector3(0, -0.6, 0);
        this._camTgt = new THREE.Vector3(0, 8.0, 10.3); this._lookTgt = new THREE.Vector3(0, 0.85, 0); this._fovTgt = 42;
        this._dieFrom = this._die.position.clone();
        this._dieTo = new THREE.Vector3(0, this._floorY + this._inradWorld, 0);
        this._reflected = false;
        this._vitrine.visible = true;
      }
      this._encaseOn = !!on; this._encaseDur = 5000;   // match the doom video length so mat->case runs across the whole clip
      // start from the current progress so a reverse mid-flight is smooth
      const cur = this._encaseProg || 0;
      this._encaseT0 = performance.now() - (on ? cur : (1 - cur)) * this._encaseDur;
      this._encaseActive = true;
    }

    _restoreCam() {
      const cam = this._camera; if (!this._camBase) return;
      cam.position.copy(this._camBase); cam.fov = this._fovBase; cam.lookAt(this._lookBase);
      cam.updateProjectionMatrix(); this._fitCamera();
    }

    _updateEncase() {
      if (!this._encaseActive) return;
      const now = performance.now();
      let tt = (now - this._encaseT0) / this._encaseDur; if (tt > 1) tt = 1; if (tt < 0) tt = 0;
      const prog = this._encaseOn ? tt : 1 - tt; this._encaseProg = prog;
      const ease = (x) => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
      const seg = (a, b) => Math.max(0, Math.min(1, (prog - a) / (b - a)));
      const lerp = (a, b, k) => a + (b - a) * k;
      const V = this._case;
      const shrink = ease(seg(0, 0.4));
      // the real mat physically shrinks to the case footprint (same rate as the velvet) -> it becomes the case floor
      const msx = lerp(1, V.CX / this._bx, shrink), msz = lerp(1, V.CZ / this._bz, shrink);
      if (this._bGlow) this._bGlow.scale.set(msx, msz, 1);
      if (this._bLine) this._bLine.scale.set(msx, 1, msz);
      const moveP = ease(seg(0, 0.5));
      if (this._dieFrom && this._dieTo) this._die.position.lerpVectors(this._dieFrom, this._dieTo, moveP);
      const rise = ease(seg(0.28, 0.72));
      const topP = ease(seg(0.56, 0.86));
      const plinthP = ease(seg(0.72, 1));
      const camP = ease(prog);
      // pink mat fades out as the velvet base fades in
      if (this._matMats) this._matMats.forEach((m) => { m.mat.opacity = m.target * (1 - shrink); });
      // velvet floor shrinks from the full mat footprint down to the case footprint
      this._velvet.visible = prog > 0.001;
      this._velvet.material.opacity = shrink;
      this._velvet.scale.set(lerp(V.matSX, 1, shrink), 1, lerp(V.matSZ, 1, shrink));
      // walls + frame rise from the mat edges
      this._walls.forEach((w) => { w.scale.y = Math.max(0.0001, rise); w.material.opacity = V.glassOp * rise; });
      this._edges.scale.y = Math.max(0.0001, rise); this._edges.material.opacity = V.edgeOp * rise;
      if (this._spot) this._spot.intensity = 1.75 * camP;
      // top closes
      this._top.material.opacity = V.glassOp * 1.15 * topP;
      this._top.position.y = V.H + (1 - topP) * 1.4;
      // plinth + placard resolve (rise into place)
      this._plinth.material.opacity = plinthP; this._plinth.position.y = V.plY - (1 - plinthP) * 1.6;
      this._placard.material.opacity = plinthP; this._placard.position.y = 0.36 - (1 - plinthP) * 1.2;
      this._plinthEdge.material.opacity = 0.35 * plinthP;
      this._contact.material.opacity = 0.72 * plinthP;
      if (this._encaseOn && prog > 0.9 && !this._reflected) { this._reflected = true; this._reflect(); }
      // camera glides to the hero framing
      const cam = this._camera;
      cam.position.lerpVectors(this._camBase, this._camTgt, camP);
      cam.lookAt(this._lookBase.clone().lerp(this._lookTgt, camP));
      cam.fov = lerp(this._fovBase, this._fovTgt, camP);
      cam.updateProjectionMatrix();
      cam.projectionMatrix.elements[9] = lerp(this._lensBase, 0, camP);
      if (tt >= 1 && !this._encaseOn) { this._vitrine.visible = false; this._encaseActive = false; this._restoreCam(); }
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
        // encase animation (die -> museum vitrine), then the mat-centring lens shift when idle
        this._updateEncase();
        if (!this._encaseActive && this._lensY != null) this._camera.projectionMatrix.elements[9] = this._lensY;
        this._renderer.render(this._scene, this._camera);
      };
      step();
    }
  }
  if (!customElements.get('dario-die')) customElements.define('dario-die', DarioDie);
})();
