import * as THREE from "three";
import { COLORS } from "./config";

// A small luminous orb at the centre whose surface "boils" via simplex-noise
// displacement. The noise function below is Ashima/Gustavson's public-domain
// webgl-noise (https://github.com/ashima/webgl-noise).

const SNOISE = /* glsl */ `
  vec4 permute(vec4 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
  vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
  float snoise(vec3 v){
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
    i = mod(i, 289.0);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 1.0/7.0;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 bb0 = vec4(x.xy, y.xy);
    vec4 bb1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(bb0) * 2.0 + 1.0;
    vec4 s1 = floor(bb1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = bb0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = bb1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
`;

const VERT = /* glsl */ `
  ${SNOISE}
  uniform float uTime;
  varying float vH;
  varying vec3 vN;
  void main() {
    float n = snoise(position * 1.4 + vec3(0.0, uTime * 0.35, 0.0));
    float n2 = 0.5 * snoise(position * 3.0 - vec3(uTime * 0.25));
    float disp = n + n2;
    vH = disp;
    vec3 pos = position + normal * disp * 0.32;
    vN = normalMatrix * normal;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  varying float vH;
  varying vec3 vN;
  void main() {
    float rim = pow(1.0 - abs(normalize(vN).z), 2.2);
    float b = 0.18 + 0.35 * smoothstep(-1.2, 1.2, vH) + rim * 0.6;
    gl_FragColor = vec4(uColor * b, 1.0);
  }
`;

export class CoreOrb {
  mesh: THREE.Mesh;
  private mat: THREE.ShaderMaterial;
  private time = 0;

  constructor(radius = 1.6) {
    this.mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color().fromArray(COLORS.orb) } },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(radius, 6), this.mat);
    this.mesh.frustumCulled = false;
  }

  update(dt: number) {
    this.time += dt;
    this.mat.uniforms.uTime.value = this.time;
  }
}
