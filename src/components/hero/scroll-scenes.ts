/**
 * Mekanik "scroll sebagai timeline", diadaptasi dari komponen Lycoris Specimen:
 * progres scroll → koordinat frame kontinu → kehadiran tiap elemen per frame.
 */

export const clamp01 = (x: number) => (x <= 0 ? 0 : x > 1 ? 1 : x);
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** 0 saat bagian atas root di puncak layar, 1 saat bagian bawahnya tiba. */
export function progressFrom(top: number, height: number, viewport: number) {
  const travel = height - viewport;
  if (travel <= 0) return 0;
  return clamp01(-top / travel);
}

/**
 * Progres → koordinat frame 0..n-1. Bilangan bulat adalah frame; tiap frame ditahan
 * selama `hold` dari slotnya agar tata letak sempat terbaca sebelum transisi berikutnya.
 */
export function sceneCoord(p: number, n: number, hold: number) {
  if (n <= 1) return 0;
  const t = clamp01(p) * (n - 1);
  const i = Math.min(Math.floor(t), n - 2);
  const h = hold / 2;
  return i + easeInOut(clamp01((t - i - h) / (1 - 2 * h)));
}

/** Seberapa hadir elemen milik `scene` pada `coord`. `delay` 0..1 memberi stagger masuk & keluar. */
export function reveal(coord: number, scene: number, delay: number) {
  const d = coord - scene;
  const lag = d < 0 ? delay : 1 - delay;
  return clamp01((0.6 - Math.abs(d) - lag * 0.2) / 0.25);
}

export type Fx = 'rise' | 'clip' | 'fade' | 'line';

/**
 * Atribut untuk elemen milik satu frame. Elemen frame pembuka terlihat sejak awal
 * (tanpa JavaScript pun), frame lain disembunyikan sampai giliran tiba.
 */
export function sc(scene: number, fx: Fx = 'rise', delay = 0) {
  return {
    'data-sc': scene,
    'data-fx': fx,
    'data-d': delay,
    style: scene === 0 ? undefined : ({ opacity: 0, visibility: 'hidden' } as const),
  };
}

interface Item {
  el: HTMLElement;
  scene: number;
  fx: Fx;
  delay: number;
  last: number;
}

export function collectItems(root: HTMLElement): Item[] {
  return Array.from(root.querySelectorAll<HTMLElement>('[data-sc]')).map((el) => ({
    el,
    scene: Number(el.dataset.sc),
    fx: el.dataset.fx as Fx,
    delay: Number(el.dataset.d) || 0,
    last: -1,
  }));
}

/** Terapkan kehadiran tiap elemen. Reduced motion: hanya opacity, tanpa gerak atau blur. */
export function applyReveals(items: Item[], coord: number, still: boolean) {
  for (const it of items) {
    const q = Math.round(reveal(coord, it.scene, it.delay) * 500) / 500;
    if (q === it.last) continue;
    it.last = q;
    const s = it.el.style;
    const dir = coord < it.scene ? 1 : -1;
    s.visibility = q <= 0 ? 'hidden' : '';
    if (it.fx === 'line') {
      s.transform = still ? '' : `scaleX(${q})`;
      s.opacity = String(Math.min(1, q * 2));
      continue;
    }
    s.opacity = String(q);
    if (still || it.fx === 'fade') {
      s.transform = '';
      s.filter = '';
      s.clipPath = '';
      continue;
    }
    if (it.fx === 'clip') {
      const hid = ((1 - q) * 100).toFixed(1);
      s.clipPath = q >= 1 ? '' : dir > 0 ? `inset(0 0 ${hid}% 0)` : `inset(${hid}% 0 0 0)`;
      s.transform = q >= 1 ? '' : `translateY(${((1 - q) * 0.4 * dir).toFixed(3)}em)`;
    } else {
      s.transform = q >= 1 ? '' : `translateY(${((1 - q) * 34 * dir).toFixed(1)}px)`;
      s.filter = q > 0.995 ? '' : `blur(${((1 - q) * 8).toFixed(1)}px)`;
    }
  }
}
