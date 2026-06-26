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

  class EarthGlobe extends HTMLElement {
    static get observedAttributes() { return ['spin']; }
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
    }

    async _init() {
      const THREE = await import(THREE_URL);
      this.THREE = THREE;
      const w = this.clientWidth || 165, h = this.clientHeight || 165;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(w, h, false);
      renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
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
            sunDir: { value: new THREE.Vector3(2.6, 1.2, 2.2).normalize() },
          },
          vertexShader:
            'varying vec2 vUv; varying vec3 vVN;' +
            'void main(){ vUv = uv; vVN = normalMatrix * normal; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
          fragmentShader:
            'uniform sampler2D dayMap; uniform sampler2D nightMap;' +
            'varying vec2 vUv; varying vec3 vVN;' +
            'void main(){' +
            '  vec3 day = texture2D(dayMap, vUv).rgb;' +
            '  vec3 night = texture2D(nightMap, vUv).rgb;' +
            '  vec3 col = day * 0.24 + night * 6.2;' +             // faint dark earth + bright golden city lights, everywhere
            // screen-space top light so the sphere reads 3D and catches light from
            // the same (top) direction as the wheel — bright top, darker bottom
            '  float top = clamp(normalize(vVN).y * 0.5 + 0.62, 0.34, 1.0);' +
            '  col *= top;' +
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

      // faint blue atmospheric rim at the very edge of the disc
      const atmo = new THREE.Mesh(
        new THREE.SphereGeometry(1.03, 48, 48),
        new THREE.MeshBasicMaterial({ color: 0x86b4ff, transparent: true, opacity: 0.28, side: THREE.BackSide, blending: THREE.AdditiveBlending })
      );
      scene.add(atmo);

      this._ready = true;
      this._idle = 0.22;       // idle longitude spin (rad/s)
      this._spinV = this._idle;
      this._last = performance.now();
      this._ro = new ResizeObserver(() => this._resize()); this._ro.observe(this);
      this._loop();
    }

    _boost() { this._spinV = 4.2; }   // kick on a wheel spin; eases back to idle

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
        // ease the spin speed back toward idle (so a wheel-spin kick decelerates)
        this._spinV += (this._idle - this._spinV) * Math.min(1, dt * 0.7);
        const e = this._earth;
        if (e) e.rotation.y += this._spinV * dt;     // spin on the tilted polar axis, like a real globe
        // drift the axis on two slow, out-of-phase cycles so the globe is seen
        // from continually changing angles (all regions, all latitudes) over time
        if (this._pivot) {
          this._pivot.rotation.x = -0.1 + 0.5 * Math.sin(now * 0.00037);   // nod (latitude)
          this._pivot.rotation.z = 0.38 + 0.34 * Math.sin(now * 0.00021);  // sway the tilt axis
        }
        this._renderer.render(this._scene, this._camera);
      };
      step();
    }
  }
  if (!customElements.get('earth-globe')) customElements.define('earth-globe', EarthGlobe);
})();
