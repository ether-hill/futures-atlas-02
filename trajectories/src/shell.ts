import * as THREE from "three";
import { COLORS, type Params } from "./config";

// An optional layer of luminous dots sitting on the sphere's surface (one per
// strand direction). Off by default; "Shell Dots" controls opacity, "Shell Dot
// Size" the point size. Original implementation.

const VERT = /* glsl */ `
  uniform float uRadius;
  uniform float uSize;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position * uRadius, 1.0);
    gl_PointSize = uSize * 5200.0 / max(0.001, -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;
const FRAG = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  uniform float uStrength;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(uColor * a * uStrength, 1.0);
  }
`;

export class Shell {
  points: THREE.Points;
  private mat: THREE.ShaderMaterial;

  constructor(dirs: THREE.Vector3[], params: Params) {
    const pos = new Float32Array(dirs.length * 3);
    dirs.forEach((d, i) => { pos[i * 3] = d.x; pos[i * 3 + 1] = d.y; pos[i * 3 + 2] = d.z; });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1000);
    this.mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uRadius: { value: params.radius }, uSize: { value: params.shellSize },
        uStrength: { value: params.shellStrength }, uColor: { value: new THREE.Color().fromArray(COLORS.ring) },
      },
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    this.points = new THREE.Points(geo, this.mat);
    this.points.frustumCulled = false;
  }

  rebuild(dirs: THREE.Vector3[]) {
    const pos = new Float32Array(dirs.length * 3);
    dirs.forEach((d, i) => { pos[i * 3] = d.x; pos[i * 3 + 1] = d.y; pos[i * 3 + 2] = d.z; });
    this.points.geometry.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    this.points.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1000);
  }

  apply(p: Params) {
    this.mat.uniforms.uRadius.value = p.radius;
    this.mat.uniforms.uSize.value = p.shellSize;
    this.mat.uniforms.uStrength.value = p.shellStrength;
  }

  setRadius(r: number) { this.mat.uniforms.uRadius.value = r; }
}
