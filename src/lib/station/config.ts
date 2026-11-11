/**
 * Parameter adegan SPBU. Satuan ≈ meter; sumbu x ke kanan, z ke arah penonton, y ke atas.
 * Ubah angka di sini untuk menggeser, memperbesar, atau mewarnai ulang elemen tanpa
 * menyentuh kode pembentuk geometri.
 */

export type XZ = [number, number];

export const PALETTE = {
  red: 0xed1b2f,
  blue: 0x006cb8,
  green: 0xacc42a,
  white: 0xf7f7f4,
  canopyUnderside: 0xf1f0ec,
  column: 0xe9e8e4,
  concrete: 0xe6e6e3,
  concreteSide: 0xd2d0cb,
  platformSide: 0xdcdad5,
  asphalt: 0x6a7079,
  curb: 0xd4d0c8,
  marking: 0xfbfbf8,
  island: 0xe4e1db,
  steel: 0x9aa1a9,
  dark: 0x2b3038,
  rubber: 0x1f2328,
  glass: 0x9cb9cf,
  glassDark: 0x4a5d70,
  grass: 0x9dbb4a,
  leaf: 0x86ad3c,
  leafDark: 0x6f9a32,
  trunk: 0x8a7663,
  car: 0x2f6fb7,
  lightWarm: 0xfff3dc,
  tailLight: 0xd8232f,
} as const;

export const PLATFORM = {
  width: 16,
  depth: 12,
  thickness: 0.5,
  /** Area jalan di tepi depan (z). */
  road: { zMin: 3.6, zMax: 6 },
  /** Bukaan trotoar untuk jalur masuk dan keluar (rentang x). */
  entrance: { xMin: -6.2, xMax: -4.0 },
  exit: { xMin: 4.2, xMax: 6.4 },
  curbDepth: 0.22,
  curbHeight: 0.14,
} as const;

export const CANOPY = {
  center: [0.4, -0.4] as XZ,
  width: 8.4,
  depth: 5.6,
  /** Tinggi sisi bawah kanopi. */
  clearance: 4.2,
  fasciaHeight: 0.8,
  redBand: 0.2,
  stripe: 0.045,
} as const;

export const ISLANDS = {
  /** Posisi z tiap pulau pompa; pulau memanjang searah sumbu x. */
  z: [-1.5, 0.7],
  centerX: 0.4,
  length: 5,
  depth: 0.8,
  height: 0.18,
  /** Posisi x tiang kanopi pada setiap pulau. */
  columnX: [-1.5, 2.3],
  columnSize: 0.34,
} as const;

export const DISPENSER = {
  width: 1,
  height: 1.55,
  depth: 0.5,
  headerHeight: 0.28,
} as const;

/**
 * Bangunan layanan di sisi kiri pelataran. Dibangun menghadap +z lalu diputar
 * sehingga etalase menghadap pelataran (+x) dan tetap terlihat dari kamera awal.
 */
export const BUILDING = {
  center: [-6.3, -0.75] as XZ,
  /** Panjang fasad etalase. */
  width: 3.4,
  depth: 2.7,
  height: 2.6,
  rotationY: Math.PI / 2,
} as const;

export const PYLON = {
  position: [-7.05, 2.75] as XZ,
  /** Rotasi papan agar menghadap kamera awal. */
  rotationY: 0.38,
  poleHeight: 3.2,
  panelWidth: 1.8,
  panelHeight: 2.8,
  panelDepth: 0.3,
} as const;

export const PLANTER = { xMin: -3.3, xMax: 3.3, zMin: 2.95, zMax: 3.42, height: 0.24 } as const;

export const TREES: Array<{ at: XZ; scale: number }> = [
  { at: [5.6, -4.7], scale: 1.05 },
  { at: [7.05, -3.9], scale: 0.85 },
  { at: [6.9, -5.35], scale: 0.95 },
  { at: [-7.2, -3.4], scale: 0.85 },
  { at: [-4.6, -4.9], scale: 0.7 },
  { at: [7.35, 2.6], scale: 0.75 },
];

export const PARKING = { xStart: 0.9, count: 3, bayWidth: 1.6, zMin: -5.8, zMax: -4.1 } as const;

export const CAR = {
  length: 3,
  width: 1.38,
  wheelRadius: 0.27,
  /**
   * Jalur mobil (x, z): datang dari kiri di lajur kiri jalan, masuk lewat bukaan kiri,
   * berhenti di sisi depan dispenser kedua, lalu keluar lewat bukaan kanan.
   */
  path: [
    [-10.5, 4.2],
    [-7.2, 4.2],
    [-5.5, 3.95],
    [-5.0, 3.05],
    [-4.35, 2.2],
    [-3.0, 1.95],
    [0.4, 1.95],
    [3.3, 1.95],
    [4.65, 2.25],
    [5.3, 3.15],
    [5.9, 4.0],
    [7.6, 4.2],
    [10.5, 4.2],
  ] as XZ[],
  /** Titik berhenti: pusat mobil sejajar dispenser di pulau kedua. */
  stopAt: [0.4, 1.95] as XZ,
} as const;

/** Siklus animasi (detik): masuk → berhenti → keluar → jeda. */
export const CYCLE = {
  enter: 6,
  stop: 3.2,
  exit: 5,
  gap: 2.2,
} as const;

export const CAMERA = {
  fov: 30,
  /** Porsi bingkai (NDC) yang diisi SPBU ketika `size` sebuah shot = 1. */
  fill: [0.92, 0.92] as [number, number],
} as const;

/**
 * Satu "shot" kamera per frame hero. Hero bergulir melewati frame-frame ini dan kamera
 * berinterpolasi di antaranya.
 * - azimuth: derajat dari sumbu +z ke +x · elevation: derajat dari bidang tanah
 * - size: skala SPBU relatif terhadap bingkai penuh (1 = memenuhi bingkai)
 * - ox, oy: posisi pusat SPBU di layar (-1..1, +y ke atas)
 */
export interface Shot {
  azimuth: number;
  elevation: number;
  size: number;
  ox: number;
  oy: number;
}

/** Layar lebar: SPBU berpindah sisi agar teks tiap frame punya ruang. */
export const HERO_SHOTS: Shot[] = [
  { azimuth: 36, elevation: 27, size: 0.68, ox: 0.38, oy: 0.16 },
  { azimuth: 78, elevation: 56, size: 0.74, ox: 0.34, oy: 0.0 },
  { azimuth: 6, elevation: 15, size: 0.64, ox: -0.42, oy: 0.06 },
  { azimuth: 44, elevation: 33, size: 0.5, ox: 0, oy: 0.4 },
];

/** Layar potret: SPBU selalu di atas, teks di bawah. */
export const HERO_SHOTS_TALL: Partial<Shot>[] = [
  { size: 0.94, ox: 0, oy: 0.4 },
  { size: 0.86, ox: 0, oy: 0.38 },
  { size: 0.88, ox: 0, oy: 0.4 },
  { size: 0.84, ox: 0, oy: 0.42 },
];

export function resolveShot(index: number, tall: boolean): Shot {
  const i = Math.max(0, Math.min(HERO_SHOTS.length - 1, index));
  return { ...HERO_SHOTS[i], ...(tall ? HERO_SHOTS_TALL[i] : {}) };
}

/** Interpolasi shot pada koordinat frame kontinu (0..n-1). */
export function shotAt(coord: number, tall: boolean): Shot {
  const n = HERO_SHOTS.length;
  const i = Math.max(0, Math.min(n - 1, Math.floor(coord)));
  const j = Math.min(n - 1, i + 1);
  const f = Math.max(0, Math.min(1, coord - i));
  const a = resolveShot(i, tall);
  const b = resolveShot(j, tall);
  const l = (x: number, y: number) => x + (y - x) * f;
  return { azimuth: l(a.azimuth, b.azimuth), elevation: l(a.elevation, b.elevation), size: l(a.size, b.size), ox: l(a.ox, b.ox), oy: l(a.oy, b.oy) };
}

/** Interaksi pointer: putaran drag (dengan pegas kembali) dan kemiringan halus. */
export const INTERACTION = {
  dragMaxDeg: 40,
  tiltDeg: 4,
} as const;
