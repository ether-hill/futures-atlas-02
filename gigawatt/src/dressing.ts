/**
 * Shared scene dressing: instanced tree fields (one draw call per species
 * part, so hundreds of trees stay cheap) and parked cars. Imports nothing
 * from world/town, so anyone can use it without cycles.
 */

import * as THREE from "three";
import type { RNG } from "./rng";

export interface TreeItem {
  x: number;
  y: number;
  z: number;
  s: number; // scale
  conifer: boolean;
}

const trunkMat = new THREE.MeshStandardMaterial({ color: "#5d4a35", roughness: 1 });
const leafMat = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 1, flatShading: true });
const LEAF_TONES = ["#4d7040", "#3c5c36", "#5a7d44", "#44653c", "#61804a"];

/** Build instanced meshes for a list of trees. */
export function buildTreeField(items: TreeItem[]): THREE.Group {
  const g = new THREE.Group();
  if (!items.length) return g;
  const dec = items.filter((i) => !i.conifer);
  const con = items.filter((i) => i.conifer);

  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);

  const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.14, 0.22, 1.7, 5), trunkMat, items.length);
  items.forEach((it, i) => {
    m.compose(new THREE.Vector3(it.x, it.y + 0.85 * it.s, it.z), q, new THREE.Vector3(it.s, it.s, it.s));
    trunks.setMatrixAt(i, m);
  });
  trunks.castShadow = true;
  g.add(trunks);

  if (dec.length) {
    const blobs = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1.35, 0), leafMat, dec.length);
    const col = new THREE.Color();
    dec.forEach((it, i) => {
      const rot = q.setFromAxisAngle(up, (it.x * 13.7 + it.z * 7.1) % Math.PI);
      m.compose(
        new THREE.Vector3(it.x, it.y + 2.5 * it.s, it.z),
        rot,
        new THREE.Vector3(it.s * (0.9 + ((it.z * 3.7) % 0.4)), it.s * 1.05, it.s),
      );
      blobs.setMatrixAt(i, m);
      blobs.setColorAt(i, col.set(LEAF_TONES[Math.abs(Math.floor(it.x * 7 + it.z * 3)) % LEAF_TONES.length]));
    });
    q.identity();
    blobs.castShadow = true;
    g.add(blobs);
  }
  if (con.length) {
    const cones = new THREE.InstancedMesh(new THREE.ConeGeometry(1.05, 3.4, 7), leafMat, con.length);
    const col = new THREE.Color();
    con.forEach((it, i) => {
      m.compose(new THREE.Vector3(it.x, it.y + 2.9 * it.s, it.z), q, new THREE.Vector3(it.s, it.s, it.s));
      cones.setMatrixAt(i, m);
      cones.setColorAt(i, col.set(LEAF_TONES[(Math.abs(Math.floor(it.x * 5 + it.z * 11)) % 2) + 1]));
    });
    cones.castShadow = true;
    g.add(cones);
  }
  return g;
}

const CAR_COLORS = ["#b8bcc2", "#8e959c", "#742f2a", "#2e4a68", "#d8d5cc", "#3a3d40", "#7a6f52", "#9a3d2e"];

export function makeCar(rng: RNG): THREE.Group {
  const g = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({ color: rng.pick(CAR_COLORS), roughness: 0.35, metalness: 0.5 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(4.1, 0.85, 1.8), paint);
  body.position.y = 0.65;
  body.castShadow = true;
  g.add(body);
  const cab = new THREE.Mesh(
    new THREE.BoxGeometry(2.1, 0.65, 1.6),
    new THREE.MeshStandardMaterial({ color: "#20242a", roughness: 0.2, metalness: 0.6 }),
  );
  cab.position.set(-0.2, 1.35, 0);
  cab.castShadow = true;
  g.add(cab);
  const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.25, 8);
  const wheelMat = new THREE.MeshStandardMaterial({ color: "#15161a", roughness: 0.9 });
  for (const [wx, wz] of [[-1.35, 0.85], [1.35, 0.85], [-1.35, -0.85], [1.35, -0.85]] as const) {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.rotation.x = Math.PI / 2;
    w.position.set(wx, 0.32, wz);
    g.add(w);
  }
  return g;
}
