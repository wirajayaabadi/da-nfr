/**
 * Ilustrasi SPBU statis (SVG isometrik) — hanya dipakai bila WebGL gagal dimulai
 * atau konteks grafis hilang. Jalur utama tetap adegan Three.js.
 */

type Box = { x: [number, number]; y: [number, number]; z: [number, number]; color: string };

const C = Math.cos(Math.PI / 6);
const S = 0.5;
const UNIT = 24;

const project = (x: number, y: number, z: number): [number, number] => [(x - z) * C * UNIT, ((x + z) * S - y) * UNIT];

function shade(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.round(v * (1 - amount));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

function faces({ x: [x0, x1], y: [y0, y1], z: [z0, z1], color }: Box) {
  const pts = (list: Array<[number, number, number]>) => list.map((p) => project(...p).join(',')).join(' ');
  return [
    { points: pts([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]]), fill: color },
    { points: pts([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]]), fill: shade(color, 0.08) },
    { points: pts([[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]]), fill: shade(color, 0.16) },
  ];
}

const RED = '#ED1B2F';
const BLUE = '#006CB8';
const WHITE = '#F7F7F4';

const box = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, color: string): Box => ({
  x: [x0, x1],
  y: [y0, y1],
  z: [z0, z1],
  color,
});

// Urutan gambar: belakang → depan (painter's algorithm).
const scene: Box[] = [
  box(-8, 8, -0.5, 0, -6, 6, '#D9D5CD'),
  box(-7.9, 7.9, 0, 0.03, -5.9, 3.6, '#E2DFD8'),
  box(-7.9, 7.9, 0, 0.03, 3.6, 5.9, '#6A7079'),
  // Bangunan layanan (etalase menghadap pelataran)
  box(-7.65, -4.95, 0, 2.5, -2.45, 0.95, WHITE),
  box(-7.7, -4.9, 2.3, 2.75, -2.5, 1.0, BLUE),
  box(-4.97, -4.93, 0.25, 1.7, -2.1, 0.2, '#9CB9CF'),
  // Pulau pompa, tiang, dispenser
  box(-2.1, 2.9, 0, 0.2, -1.9, -1.1, '#E4E1DB'),
  box(-1.67, -1.33, 0.2, 4.2, -1.67, -1.33, '#E9E8E4'),
  box(2.13, 2.47, 0.2, 4.2, -1.67, -1.33, '#E9E8E4'),
  box(-0.1, 0.9, 0.2, 1.75, -1.75, -1.25, WHITE),
  box(-0.12, 0.92, 1.75, 2.03, -1.77, -1.23, RED),
  box(-2.1, 2.9, 0, 0.2, 0.3, 1.1, '#E4E1DB'),
  box(-1.67, -1.33, 0.2, 4.2, 0.53, 0.87, '#E9E8E4'),
  box(-0.1, 0.9, 0.2, 1.75, 0.45, 0.95, WHITE),
  box(-0.12, 0.92, 1.75, 2.03, 0.43, 0.97, RED),
  box(2.13, 2.47, 0.2, 4.2, 0.53, 0.87, '#E9E8E4'),
  // Mobil
  box(-1.1, 1.9, 0.25, 0.75, 1.27, 2.63, '#2F6FB7'),
  box(-0.75, 0.95, 0.75, 1.2, 1.37, 2.53, '#4A5D70'),
  // Kanopi
  box(-3.9, 4.7, 4.2, 4.4, -3.3, 2.5, RED),
  box(-3.9, 4.7, 4.4, 4.82, -3.3, 2.5, WHITE),
  // Tanaman
  box(-3.3, 3.3, 0, 0.24, 2.95, 3.42, '#D4D0C8'),
  box(-3.2, 3.2, 0.24, 0.36, 3.0, 3.37, '#86AD3C'),
  // Papan identitas
  box(-7.25, -6.75, 0, 3.5, 2.4, 2.7, '#E9E8E4'),
  box(-7.9, -6.1, 3.5, 6.3, 2.35, 2.75, WHITE),
  box(-7.9, -6.1, 4.35, 5.25, 2.35, 2.755, RED),
];

const polygons = scene.flatMap(faces);
const all = polygons.flatMap((p) => p.points.split(' ').map((pt) => pt.split(',').map(Number)));
const xs = all.map((p) => p[0]);
const ys = all.map((p) => p[1]);
const pad = 24;
const minX = Math.min(...xs) - pad;
const minY = Math.min(...ys) - pad;
const viewBox = `${minX} ${minY} ${Math.max(...xs) - minX + pad} ${Math.max(...ys) - minY + pad}`;

// Teks "SPBU" pada muka depan papan (bidang z), mengikuti kemiringan isometrik.
const [signX, signY] = project(-7.72, 4.58, 2.755);

export default function StationFallback({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox={viewBox} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Ilustrasi statis SPBU Pertamina">
      {polygons.map((p, i) => (
        <polygon key={i} points={p.points} fill={p.fill} stroke="rgba(16,24,40,0.06)" strokeWidth={0.6} />
      ))}
      <text
        transform={`matrix(${C},${S},0,1,${signX},${signY})`}
        fontSize={11}
        fontWeight={800}
        fill="#fff"
        fontFamily="inherit"
      >
        SPBU
      </text>
    </svg>
  );
}
