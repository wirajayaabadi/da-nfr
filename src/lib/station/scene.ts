import * as THREE from 'three';
import { CAMERA, HERO_SHOTS, INTERACTION, PLATFORM, resolveShot, shotAt } from './config';
import { MeshKit } from './helpers';
import { createMaterials, setupLighting } from './materials';
import { SURFACE, buildCar, buildStation } from './build-station';
import { createCarCycle } from './car-animation';

export interface StationSceneOptions {
  fontFamily: string;
  logoSrc: string;
  reducedMotion: boolean;
  /** Koordinat frame hero saat ini (0..n-1), dibaca setiap frame render. */
  getCoord: () => number;
  /** Frame pertama sudah benar-benar digambar. */
  onReady: () => void;
  /** Konteks WebGL hilang saat berjalan. */
  onContextLost: () => void;
  onContextRestored: () => void;
  onPlayingChange: (playing: boolean) => void;
}

export interface StationSceneController {
  /** Drag untuk memutar aktif (hanya perangkat dengan pointer presisi). */
  readonly canDrag: boolean;
  play: () => void;
  pause: () => void;
  setReducedMotion: (reduced: boolean) => void;
  dispose: () => void;
}

const deg = THREE.MathUtils.degToRad;

/**
 * Membuat adegan SPBU di dalam `container`. Kamera mengikuti koordinat frame hero
 * (digerakkan scroll). Melempar error bila WebGL tidak dapat diinisialisasi; resource
 * yang sempat dibuat sudah dibersihkan sebelum error dilempar.
 */
export function createStationScene(container: HTMLElement, options: StationSceneOptions): StationSceneController {
  const cleanups: Array<() => void> = [];
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    for (const fn of cleanups.reverse()) {
      try {
        fn();
      } catch (error) {
        console.error('SPBU 3D: gagal membersihkan resource', error);
      }
    }
    cleanups.length = 0;
  };
  const listen = (target: EventTarget, type: string, handler: (event: Event) => void, opts?: AddEventListenerOptions) => {
    target.addEventListener(type, handler, opts);
    cleanups.push(() => target.removeEventListener(type, handler, opts));
  };

  try {
    const width = () => container.clientWidth;
    const height = () => container.clientHeight;
    const isMobile = () => width() < 640;

    // --- Renderer -----------------------------------------------------------------
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    const canvas = renderer.domElement;
    cleanups.push(() => {
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    });
    renderer.setClearColor(0x000000, 0);
    const maxRatio = isMobile() ? 1.5 : 1.75;
    let pixelRatio = Math.min(window.devicePixelRatio || 1, maxRatio);
    renderer.setPixelRatio(pixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.localClippingEnabled = true;
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    // Geser vertikal tetap menggulir halaman; drag hanya untuk mouse.
    canvas.style.touchAction = 'pan-y';
    container.appendChild(canvas);

    // --- Adegan ---------------------------------------------------------------------
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(CAMERA.fov, 1, 0.1, 300);
    const kit = new MeshKit(renderer, options.fontFamily);
    const mats = createMaterials();
    const { env } = setupLighting(scene, renderer, isMobile());

    const station = buildStation(kit, mats);
    scene.add(station.root);

    // Bayangan lembut di bawah diorama.
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: 0.22 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -PLATFORM.thickness - 0.002;
    floor.receiveShadow = true;
    scene.add(floor);
    const contactTex = kit.canvasTexture(128, 128, (ctx) => {
      const g = ctx.createRadialGradient(64, 64, 10, 64, 64, 64);
      g.addColorStop(0, 'rgba(0,0,0,0.55)');
      g.addColorStop(0.6, 'rgba(0,0,0,0.25)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 128, 128);
    });
    const contact = new THREE.Mesh(
      new THREE.PlaneGeometry(PLATFORM.width * 1.45, PLATFORM.depth * 1.5),
      new THREE.MeshBasicMaterial({ map: contactTex.texture, transparent: true, depthWrite: false }),
    );
    contact.rotation.x = -Math.PI / 2;
    contact.position.y = -PLATFORM.thickness - 0.001;
    scene.add(contact);

    // Bounding box untuk framing dihitung dari SPBU statis (tanpa mobil yang bergerak).
    const bounds = new THREE.Box3().setFromObject(station.root);
    const boundsRadius = bounds.getBoundingSphere(new THREE.Sphere()).radius;

    const edge = PLATFORM.width / 2 - 0.1;
    const car = buildCar(kit, mats, [
      new THREE.Plane(new THREE.Vector3(1, 0, 0), edge),
      new THREE.Plane(new THREE.Vector3(-1, 0, 0), edge),
    ]);
    scene.add(car.group);
    const cycle = createCarCycle(car, SURFACE);

    // --- Logo (aset lokal) ---------------------------------------------------------
    const logo = new Image();
    logo.decoding = 'async';
    listen(logo, 'load', () => {
      if (disposed) return;
      station.applyLogo(logo);
      requestRender();
    });
    listen(logo, 'error', () => console.warn('SPBU 3D: logo tidak dapat dimuat, papan tampil tanpa logo.'));
    logo.src = options.logoSrc;

    // --- Framing kamera per shot ---------------------------------------------------
    const corners: THREE.Vector3[] = [];
    {
      const { min, max } = bounds;
      for (const x of [min.x, max.x]) for (const y of [min.y, max.y]) for (const z of [min.z, max.z]) corners.push(new THREE.Vector3(x, y, z));
    }
    const ndc = new THREE.Vector3();
    const dir = new THREE.Vector3();
    const directionOf = (az: number, el: number, out: THREE.Vector3) =>
      out.set(Math.sin(deg(az)) * Math.cos(deg(el)), Math.sin(deg(el)), Math.cos(deg(az)) * Math.cos(deg(el)));

    function projectedExtent(target: THREE.Vector3, direction: THREE.Vector3, distance: number) {
      camera.position.copy(target).addScaledVector(direction, distance);
      camera.lookAt(target);
      camera.updateMatrixWorld(true);
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const c of corners) {
        ndc.copy(c).project(camera);
        minX = Math.min(minX, ndc.x);
        maxX = Math.max(maxX, ndc.x);
        minY = Math.min(minY, ndc.y);
        maxY = Math.max(maxY, ndc.y);
      }
      return { minX, maxX, minY, maxY };
    }

    /** Jarak & titik bidik agar SPBU memenuhi bingkai (size = 1) dan terpusat, untuk satu sudut pandang. */
    function fitFor(az: number, el: number) {
      const [fx, fy] = CAMERA.fill;
      const direction = directionOf(az, el, new THREE.Vector3());
      const target = bounds.getCenter(new THREE.Vector3());
      let distance = 30;
      for (let pass = 0; pass < 3; pass++) {
        let lo = 4;
        let hi = 300;
        for (let k = 0; k < 30; k++) {
          const mid = (lo + hi) / 2;
          const e = projectedExtent(target, direction, mid);
          if (e.maxX - e.minX <= 2 * fx && e.maxY - e.minY <= 2 * fy) hi = mid;
          else lo = mid;
        }
        distance = hi;
        const e = projectedExtent(target, direction, distance);
        const halfH = distance * Math.tan(deg(CAMERA.fov / 2));
        const halfW = halfH * camera.aspect;
        const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
        const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
        target.addScaledVector(right, ((e.maxX + e.minX) / 2) * halfW);
        target.addScaledVector(up, ((e.maxY + e.minY) / 2) * halfH);
      }
      return { distance, target };
    }

    let fits: Array<{ distance: number; target: THREE.Vector3 }> = [];
    let tall = false;
    let sized = false;
    let lastSignature = '';

    function layout() {
      const w = width();
      const h = height();
      if (!w || !h) return; // tunggu ukuran nyata; aspect 0 menghasilkan NaN
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.clearViewOffset();
      camera.updateProjectionMatrix();
      tall = h > w * 1.05;
      fits = HERO_SHOTS.map((_, i) => {
        const s = resolveShot(i, tall);
        return fitFor(s.azimuth, s.elevation);
      });
      sized = true;
      lastSignature = '';
      requestRender();
    }

    // --- Status ---------------------------------------------------------------------
    let reduced = options.reducedMotion;
    let playing = !reduced;
    let userPaused = false;
    let needsRender = true;
    let visible = true;
    let contextLost = false;
    let readySent = false;
    let simTime = playing ? 0 : cycle.restTime;
    cycle.apply(simTime);

    function requestRender() {
      needsRender = true;
    }
    function setPlaying(next: boolean) {
      if (playing === next) return;
      playing = next;
      options.onPlayingChange(playing);
      requestRender();
    }

    // --- Interaksi pointer: drag berpegas & kemiringan halus -------------------------
    const canDrag = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    let dragAz = 0;
    let dragging: { id: number; x: number } | null = null;
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    if (canDrag) {
      canvas.style.cursor = 'grab';
      listen(canvas, 'pointerdown', (e) => {
        const ev = e as PointerEvent;
        if (ev.pointerType !== 'mouse' || ev.button !== 0) return;
        dragging = { id: ev.pointerId, x: ev.clientX };
        canvas.setPointerCapture(ev.pointerId);
        canvas.style.cursor = 'grabbing';
      });
      listen(canvas, 'pointermove', (e) => {
        const ev = e as PointerEvent;
        const rect = container.getBoundingClientRect();
        pointer.tx = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.ty = ((ev.clientY - rect.top) / rect.height) * 2 - 1;
        if (dragging && dragging.id === ev.pointerId) {
          const max = INTERACTION.dragMaxDeg;
          dragAz = Math.max(-max, Math.min(max, dragAz - (ev.clientX - dragging.x) * 0.25));
          dragging.x = ev.clientX;
        }
        requestRender();
      });
      const release = () => {
        dragging = null;
        canvas.style.cursor = 'grab';
        if (reduced) dragAz = 0;
        requestRender();
      };
      listen(canvas, 'pointerup', release);
      listen(canvas, 'pointercancel', release);
      listen(canvas, 'pointerleave', () => {
        pointer.tx = 0;
        pointer.ty = 0;
      });
    }

    layout();
    const resizeObserver = new ResizeObserver(() => layout());
    resizeObserver.observe(container);
    cleanups.push(() => resizeObserver.disconnect());

    // Kurangi kerja render saat adegan di luar layar atau tab tidak aktif.
    let lastFrame = performance.now();
    let onScreen = true;
    let tabVisible = !document.hidden;
    const syncVisibility = () => {
      visible = onScreen && tabVisible;
      lastFrame = performance.now();
      requestRender();
    };
    const intersection = new IntersectionObserver(
      (entries) => {
        onScreen = entries[entries.length - 1].isIntersecting;
        syncVisibility();
      },
      { threshold: 0.01 },
    );
    intersection.observe(container);
    cleanups.push(() => intersection.disconnect());
    listen(document, 'visibilitychange', () => {
      tabVisible = !document.hidden;
      syncVisibility();
    });

    listen(canvas, 'webglcontextlost', (event) => {
      event.preventDefault();
      if (disposed) return;
      contextLost = true;
      options.onContextLost();
    });
    listen(canvas, 'webglcontextrestored', () => {
      if (disposed) return;
      contextLost = false;
      requestRender();
      options.onContextRestored();
    });

    // --- Kamera mengikuti frame hero ---------------------------------------------------
    const target = new THREE.Vector3();
    function placeCamera(coordRaw: number) {
      // Reduced motion: kamera berpindah per frame tanpa orbit panjang.
      const coord = reduced ? Math.round(coordRaw) : coordRaw;
      const shot = shotAt(coord, tall);
      const n = fits.length;
      const i = Math.max(0, Math.min(n - 1, Math.floor(coord)));
      const j = Math.min(n - 1, i + 1);
      const f = Math.max(0, Math.min(1, coord - i));
      const distance = THREE.MathUtils.lerp(
        fits[i].distance / resolveShot(i, tall).size,
        fits[j].distance / resolveShot(j, tall).size,
        f,
      );
      target.lerpVectors(fits[i].target, fits[j].target, f);

      const tilt = reduced ? 0 : INTERACTION.tiltDeg;
      const az = shot.azimuth + dragAz + pointer.x * tilt;
      const el = Math.max(5, Math.min(85, shot.elevation - pointer.y * tilt * 0.6));
      const signature = [az, el, distance, shot.ox, shot.oy].map((v) => v.toFixed(4)).join();
      if (signature === lastSignature) return false;
      lastSignature = signature;

      directionOf(az, el, dir);
      camera.position.copy(target).addScaledVector(dir, distance);
      camera.lookAt(target);
      // Rentang near/far yang rapat di sekitar SPBU menjaga presisi depth buffer
      // sehingga bidang yang berdekatan tidak berkedip (z-fighting).
      camera.near = Math.max(0.5, distance - boundsRadius * 2);
      camera.far = distance + boundsRadius * 3;
      // Geser frustum sehingga pusat SPBU mendarat di (ox, oy) tanpa memutar kamera.
      const w = width();
      const h = height();
      camera.setViewOffset(w, h, (-shot.ox * w) / 2, (shot.oy * h) / 2, w, h);
      camera.updateProjectionMatrix();
      return true;
    }

    // --- Loop -----------------------------------------------------------------------
    let rafId = 0;
    let fpsFrames = 0;
    let fpsTime = 0;
    function frame(now: number) {
      rafId = requestAnimationFrame(frame);
      const dt = Math.min(Math.max((now - lastFrame) / 1000, 0), 0.05);
      lastFrame = now;
      if (!visible || contextLost || !sized) return;

      if (playing) {
        simTime += dt;
        cycle.apply(simTime);
        needsRender = true;
      }
      // Putaran drag kembali ke sudut shot saat dilepas; kemiringan pointer dihaluskan.
      if (!dragging) dragAz = Math.abs(dragAz) > 0.01 ? dragAz * Math.exp(-dt * 3.5) : 0;
      const k = 1 - Math.exp(-dt * 4);
      pointer.x += ((reduced ? 0 : pointer.tx) - pointer.x) * k;
      pointer.y += ((reduced ? 0 : pointer.ty) - pointer.y) * k;

      if (placeCamera(options.getCoord())) needsRender = true;
      if (!needsRender) return;
      needsRender = false;
      renderer.render(scene, camera);
      if (!readySent) {
        readySent = true;
        options.onReady();
      }

      // Turunkan resolusi raster bila perangkat konsisten lambat.
      if (playing) {
        fpsFrames++;
        fpsTime += dt;
        if (fpsTime > 3) {
          if (fpsFrames / fpsTime < 40 && pixelRatio > 1) {
            pixelRatio = Math.max(1, pixelRatio - 0.25);
            renderer.setPixelRatio(pixelRatio);
            layout();
          }
          fpsFrames = 0;
          fpsTime = 0;
        }
      }
    }
    if (sized) placeCamera(options.getCoord());
    renderer.compile(scene, camera);
    rafId = requestAnimationFrame(frame);
    cleanups.push(() => cancelAnimationFrame(rafId));

    // Lepas seluruh geometry, material, dan texture milik adegan.
    cleanups.push(() => {
      const materials = new Set<THREE.Material>();
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        mesh.geometry?.dispose();
        const list = mesh.material ? (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) : [];
        list.forEach((m) => materials.add(m));
      });
      materials.forEach((m) => {
        for (const value of Object.values(m)) if (value instanceof THREE.Texture) value.dispose();
        m.dispose();
      });
      Object.values(mats).forEach((m) => m.dispose());
      kit.dispose();
      env.dispose();
    });

    return {
      canDrag,
      play: () => {
        userPaused = false;
        setPlaying(true);
      },
      pause: () => {
        userPaused = true;
        setPlaying(false);
      },
      setReducedMotion: (next: boolean) => {
        if (next === reduced) return;
        reduced = next;
        lastSignature = '';
        if (reduced) {
          dragAz = 0;
          setPlaying(false);
        } else if (!userPaused) {
          setPlaying(true);
        }
        requestRender();
      },
      dispose,
    };
  } catch (error) {
    dispose();
    throw error;
  }
}
