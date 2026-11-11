import * as THREE from 'three';
import {
  BUILDING,
  CANOPY,
  CAR,
  DISPENSER,
  ISLANDS,
  PALETTE,
  PARKING,
  PLANTER,
  PLATFORM,
  PYLON,
  TREES,
} from './config';
import type { MeshKit } from './helpers';
import type { Materials } from './materials';

/** Tinggi permukaan pelataran dan jalan. */
export const SURFACE = 0.03;

const DECAL_OFFSET = { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 };

interface BuildContext {
  kit: MeshKit;
  mats: Materials;
  root: THREE.Group;
  /** Dipanggil ketika logo selesai dimuat, untuk menggambar ulang tekstur yang memuat logo. */
  logoHooks: Array<(logo: HTMLImageElement) => void>;
}

// ---------------------------------------------------------------------------
// Landasan, jalan, marka
// ---------------------------------------------------------------------------

function buildPlatform({ kit, mats, root }: BuildContext) {
  const { width, depth, thickness, road } = PLATFORM;
  kit.box(root, [width, thickness - 0.06, depth], [0, -0.06 - (thickness - 0.06) / 2, 0], mats.platformSide, 0.2, {
    receive: true,
  });

  const inner = width - 0.2;
  const zBack = -depth / 2 + 0.1;
  const zFront = depth / 2 - 0.1;
  const forecourtDepth = road.zMin - zBack;
  const roadDepth = zFront - road.zMin;

  // Pelataran beton dengan nat halus.
  const tiles = kit.canvasTexture(1024, 640, (ctx, w, h) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(120,112,100,0.16)';
    ctx.lineWidth = 2;
    const cols = 16;
    const rows = Math.round((cols * forecourtDepth) / inner);
    for (let i = 1; i < cols; i++) {
      const x = (i / cols) * w;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let j = 1; j < rows; j++) {
      const y = (j / rows) * h;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  });
  const forecourtTop = new THREE.MeshStandardMaterial({ color: PALETTE.concrete, roughness: 0.92, map: tiles.texture });
  const forecourt = kit.box(
    root,
    [inner, 0.09, forecourtDepth],
    [0, SURFACE - 0.045, zBack + forecourtDepth / 2],
    mats.concreteSide,
    0,
  );
  forecourt.material = [
    mats.concreteSide,
    mats.concreteSide,
    forecourtTop,
    mats.concreteSide,
    mats.concreteSide,
    mats.concreteSide,
  ];
  kit.box(root, [inner, 0.09, roadDepth], [0, SURFACE - 0.045, road.zMin + roadDepth / 2], mats.asphalt, 0);

  // Marka jalan: garis tengah putus-putus dan garis tepi.
  const markMat = mats.marking.clone();
  Object.assign(markMat, DECAL_OFFSET);
  const roadCenter = (road.zMin + zFront) / 2;
  for (let x = -inner / 2 + 0.5; x < inner / 2 - 0.6; x += 1.6) kit.decal(root, 0.9, 0.08, [x + 0.45, SURFACE + 0.002, roadCenter], markMat);
  kit.decal(root, inner - 0.3, 0.06, [0, SURFACE + 0.002, zFront - 0.18], markMat);

  // Pad aspal jalur masuk dan keluar yang menyambung ke jalan.
  const padMat = mats.asphalt.clone();
  Object.assign(padMat, DECAL_OFFSET);
  const padDepth = 2.3;
  for (const { xMin, xMax } of [PLATFORM.entrance, PLATFORM.exit])
    kit.decal(root, xMax - xMin, padDepth, [(xMin + xMax) / 2, SURFACE + 0.001, road.zMin - padDepth / 2], padMat);

  // Marka lantai MASUK / KELUAR dengan panah searah jalur mobil.
  const floorSign = (label: string, pointsIn: boolean) =>
    kit.canvasTexture(512, 256, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#ffffff';
      const ax = 92;
      ctx.beginPath();
      if (pointsIn) {
        ctx.moveTo(ax, 26);
        ctx.lineTo(ax + 62, 108);
        ctx.lineTo(ax + 22, 108);
        ctx.lineTo(ax + 22, 230);
        ctx.lineTo(ax - 22, 230);
        ctx.lineTo(ax - 22, 108);
        ctx.lineTo(ax - 62, 108);
      } else {
        ctx.moveTo(ax, 230);
        ctx.lineTo(ax + 62, 148);
        ctx.lineTo(ax + 22, 148);
        ctx.lineTo(ax + 22, 26);
        ctx.lineTo(ax - 22, 26);
        ctx.lineTo(ax - 22, 148);
        ctx.lineTo(ax - 62, 148);
      }
      ctx.closePath();
      ctx.fill();
      ctx.font = kit.font(800, 72);
      ctx.textBaseline = 'middle';
      ctx.fillText(label, 180, h / 2 + 4);
    });
  const signMat = (tex: THREE.Texture) =>
    new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.8, depthWrite: false, ...DECAL_OFFSET });
  const inTex = floorSign('MASUK', true);
  const outTex = floorSign('KELUAR', false);
  const entranceX = (PLATFORM.entrance.xMin + PLATFORM.entrance.xMax) / 2;
  const exitX = (PLATFORM.exit.xMin + PLATFORM.exit.xMax) / 2;
  kit.decal(root, 1.9, 0.95, [entranceX, SURFACE + 0.003, road.zMin - 1.0], signMat(inTex.texture));
  kit.decal(root, 1.9, 0.95, [exitX, SURFACE + 0.003, road.zMin - 1.0], signMat(outTex.texture));

  // Trotoar pemisah jalan dan pelataran, terbuka di jalur masuk dan keluar.
  const curbZ = road.zMin - PLATFORM.curbDepth / 2;
  const segments: Array<[number, number]> = [
    [-inner / 2, PLATFORM.entrance.xMin],
    [PLATFORM.entrance.xMax, PLATFORM.exit.xMin],
    [PLATFORM.exit.xMax, inner / 2],
  ];
  for (const [a, b] of segments)
    kit.box(root, [b - a, PLATFORM.curbHeight, PLATFORM.curbDepth], [(a + b) / 2, SURFACE + PLATFORM.curbHeight / 2, curbZ], mats.curb, 0.03);

  // Garis parkir di belakang kanopi, dengan penahan roda.
  const { xStart, count, bayWidth, zMin, zMax } = PARKING;
  for (let i = 0; i <= count; i++)
    kit.decal(root, 0.06, zMax - zMin, [xStart + i * bayWidth, SURFACE + 0.002, (zMin + zMax) / 2], markMat);
  for (let i = 0; i < count; i++)
    kit.box(root, [0.9, 0.08, 0.14], [xStart + (i + 0.5) * bayWidth, SURFACE + 0.04, zMin + 0.35], mats.curb, 0.02);
}

// ---------------------------------------------------------------------------
// Kanopi, tiang, pulau pompa, dispenser
// ---------------------------------------------------------------------------

function buildCanopy({ kit, mats, root, logoHooks }: BuildContext) {
  const { center, width: W, depth: D, clearance: Y, fasciaHeight: F, redBand, stripe } = CANOPY;
  const g = new THREE.Group();
  g.position.set(center[0], SURFACE, center[1]);
  root.add(g);

  kit.box(g, [W, 0.1, D], [0, Y + 0.05, 0], mats.canopyUnderside, 0, { cast: true });
  kit.box(g, [W + 0.2, F, D + 0.2], [0, Y + F / 2, 0], mats.white, 0.04, { cast: true });
  kit.box(g, [W + 0.24, redBand, D + 0.24], [0, Y + redBand / 2, 0], mats.red, 0.03);
  const s0 = Y + redBand + 0.035;
  kit.box(g, [W + 0.22, stripe, D + 0.22], [0, s0 + stripe / 2, 0], mats.green, 0);
  kit.box(g, [W + 0.22, stripe, D + 0.22], [0, s0 + stripe * 1.5 + 0.02, 0], mats.blue, 0);
  kit.box(g, [W - 0.1, 0.06, D - 0.1], [0, Y + F + 0.03, 0], mats.column, 0.02);

  // Lampu panel di sisi bawah kanopi.
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 2; j++)
      kit.box(g, [1.1, 0.03, 0.42], [-W / 2 + W * ((i + 0.5) / 4), Y - 0.01, (j - 0.5) * (D * 0.48)], mats.canopyLight, 0);

  // Logo resmi pada fasia depan dan samping kanan (tekstur dari aset lokal).
  const whiteTop = s0 + stripe * 2 + 0.02;
  const logoH = Math.min(0.36, Y + F - whiteTop - 0.06);
  const logoMat = new THREE.MeshStandardMaterial({ transparent: true, alphaTest: 0.05, roughness: 0.7, visible: false });
  const logoY = (whiteTop + Y + F) / 2;
  const front = kit.panel(g, 1, logoH, [0, logoY, (D + 0.2) / 2 + 0.004], logoMat);
  const side = kit.panel(g, 1, logoH, [(W + 0.2) / 2 + 0.004, logoY, 0], logoMat);
  side.rotation.y = Math.PI / 2;
  logoHooks.push((logo) => {
    const tex = kit.track(new THREE.Texture(logo));
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    tex.needsUpdate = true;
    logoMat.map = tex;
    logoMat.visible = true;
    logoMat.needsUpdate = true;
    const aspect = logo.naturalWidth / logo.naturalHeight;
    front.scale.x = side.scale.x = logoH * aspect;
  });
}

function buildIslands(ctx: BuildContext) {
  const { kit, mats, root } = ctx;
  const { z: islandZ, centerX, length, depth, height, columnX, columnSize } = ISLANDS;
  const top = SURFACE + height;
  const columnHeight = CANOPY.clearance - height;

  const bollardWhite = mats.white;
  const screen = kit.canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#f2f2ef';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#2a3340';
    ctx.beginPath();
    ctx.roundRect(22, 20, w - 44, 112, 12);
    ctx.fill();
    ctx.fillStyle = 'rgba(160,200,230,0.45)';
    for (let i = 0; i < 3; i++) ctx.fillRect(44, 40 + i * 28, w - 88 - i * 30, 10);
    const colors = ['#ED1B2F', '#006CB8', '#ACC42A'];
    colors.forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.roundRect(30 + i * 70, 160, 56, 56, 10);
      ctx.fill();
    });
  });
  const screenMat = new THREE.MeshStandardMaterial({ map: screen.texture, roughness: 0.6 });

  islandZ.forEach((z) => {
    kit.box(root, [length, height, depth], [centerX, SURFACE + height / 2, z], mats.island, 0.06, { cast: true });
    // Pita merah di sisi pulau. Puncaknya sengaja di bawah permukaan atas pulau agar
    // tidak sebidang (bidang sebidang menimbulkan z-fighting / kedip warna).
    kit.box(root, [length + 0.02, 0.06, depth + 0.02], [centerX, top - 0.05, z], mats.red, 0.02);

    for (const x of columnX) {
      kit.box(root, [columnSize + 0.1, 0.3, columnSize + 0.1], [x, top + 0.15, z], mats.curb, 0.03);
      kit.box(root, [columnSize, columnHeight, columnSize], [x, top + columnHeight / 2, z], mats.column, 0.04, { cast: true });
    }

    // Bolar pengaman di ujung pulau.
    for (const end of [-1, 1]) {
      const x = centerX + end * (length / 2 - 0.18);
      kit.cyl(root, 0.07, 0.55, [x, top + 0.275, z], bollardWhite, { cast: true, segments: 14 });
      kit.cyl(root, 0.075, 0.14, [x, top + 0.48, z], mats.red, { segments: 14 });
    }

    buildDispenser(ctx, [centerX, top, z], screenMat);
  });
}

function buildDispenser({ kit, mats, root }: BuildContext, at: [number, number, number], screenMat: THREE.Material) {
  const { width: W, height: H, depth: D, headerHeight } = DISPENSER;
  const g = new THREE.Group();
  g.position.set(...at);
  root.add(g);

  kit.box(g, [W + 0.12, 0.1, D + 0.14], [0, 0.05, 0], mats.dark, 0.02);
  kit.box(g, [W, H, D], [0, 0.1 + H / 2, 0], mats.white, 0.05, { cast: true });
  kit.box(g, [W + 0.02, 0.07, D + 0.02], [0, 0.1 + H - 0.05, 0], mats.blue, 0.01);
  kit.box(g, [W + 0.04, headerHeight, D + 0.04], [0, 0.1 + H + headerHeight / 2, 0], mats.red, 0.04, { cast: true });

  for (const side of [1, -1]) {
    const face = kit.panel(g, 0.6, 0.6, [0, 1.12, side * (D / 2 + 0.003)], screenMat);
    if (side < 0) face.rotation.y = Math.PI;

    // Dua selang per sisi: dari atas bodi, melengkung turun, lalu kembali ke dudukan nozzle.
    for (const end of [-1, 1]) {
      const x = end * (W / 2);
      const holster: [number, number, number] = [end * 0.36, 0.74, side * (D / 2 + 0.05)];
      kit.box(g, [0.12, 0.16, 0.08], [holster[0], holster[1], side * (D / 2 + 0.03)], mats.dark, 0.015);
      kit.box(g, [0.07, 0.2, 0.08], [holster[0], holster[1] + 0.05, holster[2] + side * 0.03], mats.steel, 0.015);
      kit.tube(
        g,
        [
          [x - end * 0.06, 0.1 + H - 0.14, side * (D / 2 - 0.04)],
          [x + end * 0.1, 0.1 + H - 0.4, side * (D / 2 + 0.12)],
          [x + end * 0.14, 0.42, side * (D / 2 + 0.22)],
          [holster[0] + end * 0.12, 0.3, side * (D / 2 + 0.2)],
          [holster[0], holster[1] - 0.06, holster[2] + side * 0.03],
        ],
        0.022,
        mats.rubber,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Bangunan layanan & papan identitas
// ---------------------------------------------------------------------------

function buildServiceBuilding({ kit, mats, root }: BuildContext) {
  const { center, width: W, depth: D, height: H, rotationY } = BUILDING;
  const g = new THREE.Group();
  g.position.set(center[0], SURFACE, center[1]);
  g.rotation.y = rotationY;
  root.add(g);

  kit.box(g, [W + 0.08, 0.14, D + 0.08], [0, 0.07, 0], mats.concreteSide, 0.02);
  kit.box(g, [W, H, D], [0, H / 2, 0], mats.white, 0.05, { cast: true });
  kit.box(g, [W + 0.1, 0.44, D + 0.1], [0, H - 0.1, 0], mats.blue, 0.03, { cast: true });
  kit.box(g, [W + 0.16, 0.08, D + 0.16], [0, H + 0.16, 0], mats.white, 0.02, { cast: true });
  kit.box(g, [0.7, 0.32, 0.55], [W / 4, H + 0.36, -D / 6], mats.steel, 0.04, { cast: true });

  // Papan nama fasilitas di pita biru.
  const sign = kit.canvasTexture(1024, 128, (ctx, w, h) => {
    ctx.fillStyle = '#006CB8';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ffffff';
    ctx.font = kit.font(700, 58);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TOKO  •  MUSHOLA  •  TOILET', w / 2, h / 2 + 3);
  });
  kit.panel(g, W * 0.86, (W * 0.86) / 8, [0, H - 0.1, D / 2 + 0.052], new THREE.MeshStandardMaterial({ map: sign.texture, roughness: 0.7 }));

  // Etalase kaca, kusen, dan pintu.
  const frontZ = D / 2 + 0.02;
  kit.box(g, [2.2, 1.5, 0.05], [-0.45, 0.2 + 0.75, frontZ], mats.glass, 0.01);
  for (const x of [-1.55, -0.82, -0.08, 0.65]) kit.box(g, [0.05, 1.52, 0.08], [x, 0.95, frontZ + 0.01], mats.column, 0);
  kit.box(g, [2.24, 0.06, 0.08], [-0.45, 1.72, frontZ + 0.01], mats.column, 0);
  kit.box(g, [0.72, 1.85, 0.05], [1.18, 0.2 + 0.925, frontZ], mats.glassDark, 0.01);
  kit.box(g, [0.05, 1.85, 0.08], [0.8, 1.12, frontZ + 0.01], mats.column, 0);
  kit.box(g, [0.04, 0.4, 0.04], [1.42, 1.1, frontZ + 0.05], mats.steel, 0);
  // Jendela samping yang menghadap jalan.
  kit.box(g, [0.05, 0.8, 1.3], [-W / 2 - 0.02, 1.4, 0.1], mats.glass, 0.01);
}

function buildPylon({ kit, mats, root, logoHooks }: BuildContext) {
  const { position, rotationY, poleHeight, panelWidth: PW, panelHeight: PH, panelDepth: PD } = PYLON;
  const g = new THREE.Group();
  g.position.set(position[0], SURFACE, position[1]);
  g.rotation.y = rotationY;
  root.add(g);

  kit.box(g, [1.1, 0.3, 0.7], [0, 0.15, 0], mats.concreteSide, 0.04, { cast: true });
  kit.box(g, [0.46, poleHeight, 0.26], [0, 0.3 + poleHeight / 2, 0], mats.column, 0.03, { cast: true });
  const panelY = 0.3 + poleHeight + PH / 2;
  kit.box(g, [PW, PH, PD], [0, panelY, 0], mats.white, 0.06, { cast: true });
  kit.box(g, [PW + 0.06, 0.12, PD + 0.04], [0, panelY + PH / 2 - 0.02, 0], mats.red, 0.03);

  // Muka papan: logo resmi, identitas SPBU, dan nama program. Tanpa harga atau info operasional.
  let pylonLogo: HTMLImageElement | null = null;
  const face = kit.canvasTexture(512, 800, (ctx, w, h) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ED1B2F';
    ctx.fillRect(0, 210, w, 250);
    ctx.fillStyle = '#ffffff';
    ctx.font = kit.font(800, 150);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SPBU', w / 2, 340);
    ctx.fillStyle = '#101828';
    ctx.font = kit.font(750, 50);
    ctx.fillText('Action Learning', w / 2, 540);
    ctx.fillText('Project', w / 2, 600);
    const bars = ['#ED1B2F', '#006CB8', '#ACC42A'];
    bars.forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.fillRect(56 + i * 140, 690, 120, 22);
    });
    if (pylonLogo) {
      const lw = w - 90;
      const lh = lw * (pylonLogo.naturalHeight / pylonLogo.naturalWidth);
      ctx.drawImage(pylonLogo, (w - lw) / 2, 110 - lh / 2, lw, lh);
    }
  });
  logoHooks.push((logo) => {
    pylonLogo = logo;
    face.redraw();
  });
  kit.panel(g, PW - 0.14, PH - 0.22, [0, panelY - 0.06, PD / 2 + 0.003], new THREE.MeshStandardMaterial({ map: face.texture, roughness: 0.7 }));
}

// ---------------------------------------------------------------------------
// Tanaman
// ---------------------------------------------------------------------------

function buildGreenery({ kit, mats, root }: BuildContext) {
  const { xMin, xMax, zMin, zMax, height } = PLANTER;
  const cx = (xMin + xMax) / 2;
  const cz = (zMin + zMax) / 2;
  kit.box(root, [xMax - xMin, height, zMax - zMin], [cx, SURFACE + height / 2, cz], mats.curb, 0.04, { cast: true });
  kit.box(root, [xMax - xMin - 0.1, 0.02, zMax - zMin - 0.1], [cx, SURFACE + height + 0.005, cz], mats.grass, 0);
  const bushes = 7;
  for (let i = 0; i < bushes; i++) {
    const x = xMin + 0.45 + ((xMax - xMin - 0.9) * i) / (bushes - 1);
    const bush = kit.blob(root, 0.26, [x, SURFACE + height + 0.16, cz], i % 2 ? mats.leafDark : mats.leaf, { cast: true });
    bush.scale.set(1.15, 0.78, 0.9);
  }

  for (const { at, scale } of TREES) {
    const t = new THREE.Group();
    t.position.set(at[0], SURFACE, at[1]);
    t.scale.setScalar(scale);
    root.add(t);
    kit.cyl(t, 0.09, 0.8, [0, 0.4, 0], mats.trunk, { cast: true, radiusTop: 0.07, segments: 8 });
    kit.blob(t, 0.62, [0, 1.25, 0], mats.leaf, { cast: true });
    kit.blob(t, 0.42, [0.28, 1.62, -0.12], mats.leafDark, { cast: true });
  }
}

// ---------------------------------------------------------------------------
// Mobil
// ---------------------------------------------------------------------------

export interface CarRig {
  group: THREE.Group;
  tailLight: THREE.MeshStandardMaterial;
}

/**
 * Mobil menghadap +x. Material dipotong oleh dua bidang di tepi landasan sehingga mobil
 * tampak muncul dari dan menghilang ke tepi diorama.
 */
export function buildCar(kit: MeshKit, mats: Materials, clip: THREE.Plane[]): CarRig {
  const clipped = <T extends THREE.Material>(m: T): T => {
    const c = m.clone() as T;
    c.clippingPlanes = clip;
    c.clipShadows = true;
    return c;
  };
  const paint = clipped(new THREE.MeshStandardMaterial({ color: PALETTE.car, roughness: 0.4, metalness: 0.15 }));
  const glass = clipped(mats.glassDark);
  const dark = clipped(mats.dark);
  const rubber = clipped(mats.rubber);
  const steel = clipped(mats.steel);
  const head = clipped(mats.headLight);
  const tail = clipped(mats.tailLight);

  const g = new THREE.Group();
  const L = CAR.length;
  const Wd = CAR.width;
  const r = CAR.wheelRadius;
  const opts = { cast: true };
  kit.box(g, [L, 0.48, Wd], [0, 0.52, 0], paint, 0.16, opts);
  kit.box(g, [1.72, 0.46, Wd - 0.18], [-0.12, 0.98, 0], glass, 0.12, opts);
  kit.box(g, [1.5, 0.08, Wd - 0.12], [-0.15, 1.22, 0], paint, 0.04, opts);
  kit.box(g, [0.1, 0.18, Wd - 0.08], [L / 2, 0.36, 0], dark, 0.04);
  kit.box(g, [0.1, 0.18, Wd - 0.08], [-L / 2, 0.36, 0], dark, 0.04);
  for (const z of [-0.43, 0.43]) {
    kit.box(g, [0.06, 0.1, 0.3], [L / 2 - 0.01, 0.62, z], head, 0.02);
    kit.box(g, [0.06, 0.1, 0.3], [-L / 2 + 0.01, 0.64, z], tail, 0.02);
    kit.box(g, [0.14, 0.08, 0.12], [0.62, 0.86, z * 1.68], paint, 0.02);
  }
  // Tutup tangki di sisi kiri (menghadap dispenser).
  kit.box(g, [0.2, 0.16, 0.02], [-0.9, 0.66, -Wd / 2 - 0.005], dark, 0.01);
  for (const x of [-0.95, 0.95])
    for (const z of [-Wd / 2 + 0.1, Wd / 2 - 0.1]) {
      const tire = kit.cyl(g, r, 0.22, [x, r, z], rubber, { cast: true, segments: 18 });
      tire.rotation.x = Math.PI / 2;
      const hub = kit.cyl(g, r * 0.55, 0.235, [x, r, z], steel, { segments: 14 });
      hub.rotation.x = Math.PI / 2;
    }
  return { group: g, tailLight: tail };
}

// ---------------------------------------------------------------------------

/** Membangun seluruh SPBU statis. `applyLogo` dipanggil setelah logo lokal selesai dimuat. */
export function buildStation(kit: MeshKit, mats: Materials) {
  const root = new THREE.Group();
  root.name = 'spbu';
  const ctx: BuildContext = { kit, mats, root, logoHooks: [] };
  buildPlatform(ctx);
  buildCanopy(ctx);
  buildIslands(ctx);
  buildServiceBuilding(ctx);
  buildPylon(ctx);
  buildGreenery(ctx);
  return {
    root,
    applyLogo: (logo: HTMLImageElement) => ctx.logoHooks.forEach((hook) => hook(logo)),
  };
}
