import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export type Vec3 = [number, number, number];

interface MeshOptions {
  /** Ikut memberi bayangan. Diterapkan selektif agar shadow pass tetap ringan. */
  cast?: boolean;
  receive?: boolean;
}

/**
 * Pembentuk mesh dengan cache geometri: objek berulang (tiang, roda, semak)
 * memakai satu BufferGeometry yang sama.
 */
export class MeshKit {
  private geometries = new Map<string, THREE.BufferGeometry>();
  private textures = new Set<THREE.Texture>();

  constructor(
    private renderer: THREE.WebGLRenderer,
    private fontFamily: string,
  ) {}

  private cached<T extends THREE.BufferGeometry>(key: string, make: () => T): T {
    let geo = this.geometries.get(key);
    if (!geo) {
      geo = make();
      this.geometries.set(key, geo);
    }
    return geo as T;
  }

  private place(mesh: THREE.Mesh, parent: THREE.Object3D, pos: Vec3, opts: MeshOptions) {
    mesh.position.set(...pos);
    mesh.castShadow = opts.cast ?? false;
    mesh.receiveShadow = opts.receive ?? true;
    parent.add(mesh);
    return mesh;
  }

  /** Balok berukuran w×h×d dengan pusat di `pos`; r > 0 memberi sudut membulat. */
  box(
    parent: THREE.Object3D,
    size: Vec3,
    pos: Vec3,
    material: THREE.Material,
    r = 0.03,
    opts: MeshOptions = {},
  ) {
    const [w, h, d] = size;
    const radius = Math.min(r, w / 3, h / 3, d / 3);
    const geo = this.cached(`b${w},${h},${d},${radius}`, () =>
      radius > 0.001 ? new RoundedBoxGeometry(w, h, d, 2, radius) : new THREE.BoxGeometry(w, h, d),
    );
    return this.place(new THREE.Mesh(geo, material), parent, pos, opts);
  }

  cyl(
    parent: THREE.Object3D,
    radius: number,
    height: number,
    pos: Vec3,
    material: THREE.Material,
    opts: MeshOptions & { radiusTop?: number; segments?: number } = {},
  ) {
    const top = opts.radiusTop ?? radius;
    const seg = opts.segments ?? 20;
    const geo = this.cached(`c${top},${radius},${height},${seg}`, () =>
      new THREE.CylinderGeometry(top, radius, height, seg),
    );
    return this.place(new THREE.Mesh(geo, material), parent, pos, opts);
  }

  /** Bola low-poly (untuk tajuk pohon dan semak). */
  blob(parent: THREE.Object3D, radius: number, pos: Vec3, material: THREE.Material, opts: MeshOptions = {}) {
    const geo = this.cached(`i${radius}`, () => new THREE.IcosahedronGeometry(radius, 1));
    return this.place(new THREE.Mesh(geo, material), parent, pos, opts);
  }

  tube(parent: THREE.Object3D, points: Vec3[], radius: number, material: THREE.Material, opts: MeshOptions = {}) {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
    const geo = new THREE.TubeGeometry(curve, Math.max(16, points.length * 8), radius, 8, false);
    this.geometries.set(`t${this.geometries.size}`, geo);
    const mesh = new THREE.Mesh(geo, material);
    mesh.castShadow = opts.cast ?? false;
    parent.add(mesh);
    return mesh;
  }

  /** Bidang datar yang tergeletak di tanah (marka, teks lantai). */
  decal(parent: THREE.Object3D, w: number, d: number, pos: Vec3, material: THREE.Material) {
    const geo = this.cached(`p${w},${d}`, () => new THREE.PlaneGeometry(w, d));
    const mesh = new THREE.Mesh(geo, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(...pos);
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  /** Bidang tegak (papan tanda, layar). */
  panel(parent: THREE.Object3D, w: number, h: number, pos: Vec3, material: THREE.Material) {
    const geo = this.cached(`p${w},${h}`, () => new THREE.PlaneGeometry(w, h));
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(...pos);
    parent.add(mesh);
    return mesh;
  }

  /** Tekstur yang digambar di canvas 2D. `redraw` dapat dipanggil ulang (mis. setelah logo dimuat). */
  canvasTexture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void) {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D tidak tersedia');
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    this.textures.add(texture);
    const redraw = () => {
      ctx.clearRect(0, 0, w, h);
      draw(ctx, w, h);
      texture.needsUpdate = true;
    };
    redraw();
    return { texture, redraw };
  }

  font(weight: number, size: number) {
    return `${weight} ${size}px ${this.fontFamily}`;
  }

  track(texture: THREE.Texture) {
    this.textures.add(texture);
    return texture;
  }

  dispose() {
    this.geometries.forEach((g) => g.dispose());
    this.textures.forEach((t) => t.dispose());
    this.geometries.clear();
    this.textures.clear();
  }
}
