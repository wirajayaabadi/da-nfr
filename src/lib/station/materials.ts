import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { PALETTE } from './config';

const matte = (color: number, roughness = 0.78, metalness = 0, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });

/** Material bersama. Semuanya matte agar tidak mengilap atau menyilaukan. */
export function createMaterials() {
  return {
    red: matte(PALETTE.red, 0.6),
    blue: matte(PALETTE.blue, 0.6),
    green: matte(PALETTE.green, 0.65),
    white: matte(PALETTE.white, 0.7),
    canopyUnderside: matte(PALETTE.canopyUnderside, 0.85),
    column: matte(PALETTE.column, 0.7),
    concrete: matte(PALETTE.concrete, 0.92),
    concreteSide: matte(PALETTE.concreteSide, 0.92),
    platformSide: matte(PALETTE.platformSide, 0.9),
    asphalt: matte(PALETTE.asphalt, 0.95),
    curb: matte(PALETTE.curb, 0.88),
    marking: matte(PALETTE.marking, 0.8),
    island: matte(PALETTE.island, 0.85),
    steel: matte(PALETTE.steel, 0.45, 0.5),
    dark: matte(PALETTE.dark, 0.6),
    rubber: matte(PALETTE.rubber, 0.9),
    glass: matte(PALETTE.glass, 0.18, 0.35),
    glassDark: matte(PALETTE.glassDark, 0.22, 0.3),
    grass: matte(PALETTE.grass, 0.95),
    leaf: matte(PALETTE.leaf, 0.9, 0, { flatShading: true }),
    leafDark: matte(PALETTE.leafDark, 0.9, 0, { flatShading: true }),
    trunk: matte(PALETTE.trunk, 0.9),
    canopyLight: matte(PALETTE.lightWarm, 0.5, 0, { emissive: PALETTE.lightWarm, emissiveIntensity: 0.9 }),
    headLight: matte(0xffffff, 0.4, 0, { emissive: 0xfff6e0, emissiveIntensity: 0.8 }),
    tailLight: matte(PALETTE.tailLight, 0.5, 0, { emissive: PALETTE.tailLight, emissiveIntensity: 0.5 }),
  };
}

export type Materials = ReturnType<typeof createMaterials>;

/**
 * Pencahayaan lembut: langit terang + pantulan lantai hangat, satu cahaya utama
 * yang memberi bayangan, dan cahaya pengisi dingin dari kanan.
 */
export function setupLighting(scene: THREE.Scene, renderer: THREE.WebGLRenderer, mobile: boolean) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const env = pmrem.fromScene(room, 0.04);
  scene.environment = env.texture;
  scene.environmentIntensity = 0.32;
  room.dispose();
  pmrem.dispose();

  scene.add(new THREE.HemisphereLight(0xffffff, 0xe0d8ca, 1.55));

  const key = new THREE.DirectionalLight(0xfff6ec, 2.5);
  key.position.set(-7, 15, 9);
  key.castShadow = true;
  const size = mobile ? 1024 : 2048;
  key.shadow.mapSize.set(size, size);
  Object.assign(key.shadow.camera, { left: -12, right: 12, top: 11, bottom: -11, near: 1, far: 45 });
  key.shadow.camera.updateProjectionMatrix();
  key.shadow.normalBias = 0.03;
  key.shadow.bias = -0.0004;
  key.shadow.radius = 3;
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xe4edfb, 0.75);
  fill.position.set(10, 6, 4);
  scene.add(fill);

  return { env };
}
