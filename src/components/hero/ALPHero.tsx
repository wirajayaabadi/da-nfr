'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { site } from '@/config/site';
import { workgroups } from '@/data/team';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { shotAt } from '@/lib/station/config';
import { accentClasses } from '@/lib/team';
import PertaminaStationScene from '@/components/station/PertaminaStationScene';
import { applyReveals, collectItems, progressFrom, sc, sceneCoord } from './scroll-scenes';

/** Jumlah frame: pembuka + tiga bab. */
const SCENES = site.hero.frameLabels.length;
/** Porsi slot tiap frame yang ditahan diam sebelum transisi. */
const HOLD = 0.34;
/** Tinggi gulir per frame, dalam satuan tinggi layar (total ±3 layar). */
const SCENE_SCROLL = 0.7;

const chapterLayout = ['left', 'right', 'center'] as const;

/**
 * Hero sinematik: panggung gelap yang menempel di layar, SPBU 3D yang mengorbit
 * mengikuti scroll, dan tipografi yang berganti per frame. Teks & tombol adalah HTML
 * biasa sehingga tetap tersedia ketika adegan 3D dimuat atau gagal.
 */
export default function ALPHero() {
  const { label, title, description, cta, ctaAnalysis, analysisHref, meta, scrollHint, frameLabels, chapters } = site.hero;
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const coordRef = useRef(0);
  const reduced = useReducedMotion();
  const reducedRef = useRef(reduced);
  const [active, setActive] = useState(0);
  const getCoord = useCallback(() => coordRef.current, []);

  useEffect(() => {
    reducedRef.current = reduced;
  }, [reduced]);

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    const glow = glowRef.current;
    if (!root || !stage || !glow) return;
    const items = collectItems(stage);

    let raf = 0;
    let running = false;
    let last = performance.now();
    let smoothed = -1;
    let shown = -1;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const still = reducedRef.current;
      const rect = root.getBoundingClientRect();
      const W = stage.clientWidth;
      const H = stage.clientHeight;
      const p = progressFrom(rect.top, rect.height, window.innerHeight);
      smoothed = smoothed < 0 || still ? p : smoothed + (p - smoothed) * (1 - Math.exp(-dt * 9));
      const coord = sceneCoord(smoothed, SCENES, HOLD);
      coordRef.current = coord;

      const scene = Math.round(coord);
      if (scene !== shown) {
        shown = scene;
        setActive(scene);
      }

      // Cahaya lembut di belakang SPBU mengikuti posisi shot kamera.
      const shot = shotAt(still ? scene : coord, H > W * 1.05);
      const radius = shot.size * Math.min(W, H) * 0.95;
      const gx = (0.5 + shot.ox / 2) * W;
      const gy = (0.5 - shot.oy / 2) * H;
      glow.style.width = glow.style.height = `${(radius * 2).toFixed(1)}px`;
      glow.style.transform = `translate(${(gx - radius).toFixed(1)}px, ${(gy - radius).toFixed(1)}px)`;

      // Ilustrasi statis (hanya saat WebGL gagal) ikut berpindah mengikuti shot.
      const fallback = stage.querySelector<SVGSVGElement>('.alp-fallback');
      if (fallback) {
        const bw = shot.size * (H > W * 1.05 ? W * 1.02 : Math.min(W * 0.95, H * 1.45));
        const bh = bw * 0.62;
        Object.assign(fallback.style, {
          width: `${bw.toFixed(1)}px`,
          height: `${bh.toFixed(1)}px`,
          left: `${(gx - bw / 2).toFixed(1)}px`,
          top: `${(gy - bh / 2).toFixed(1)}px`,
        });
      }

      applyReveals(items, coord, still);
    };

    const start = () => {
      if (running || document.hidden) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };
    const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()));
    io.observe(root);
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVisibility);
    start();

    return () => {
      stop();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  /** Gulir ke frame tertentu (penanda frame di sisi kanan). */
  const jump = (index: number) => {
    const root = rootRef.current;
    if (!root) return;
    const top = root.getBoundingClientRect().top + window.scrollY;
    const travel = root.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + (index / (SCENES - 1)) * travel, behavior: reduced ? 'auto' : 'smooth' });
  };

  return (
    <section
      id="beranda"
      ref={rootRef}
      aria-labelledby="hero-title"
      className="relative bg-alp-ink"
      style={{ height: `calc(100svh * ${(1 + (SCENES - 1) * SCENE_SCROLL).toFixed(2)})` }}
    >
      <div className="alp-board sticky top-0 h-svh overflow-hidden bg-alp-ink text-alp-bone">
        <div ref={stageRef} className="alp-stage absolute inset-x-0 bottom-0 top-[var(--nav-h)]">
          <div
            ref={glowRef}
            aria-hidden="true"
            className="pointer-events-none absolute top-0 left-0 rounded-full bg-[radial-gradient(closest-side,rgb(237_27_47/0.2),rgb(0_108_184/0.12)_48%,transparent_100%)] will-change-transform"
          />

          <PertaminaStationScene getCoord={getCoord} />

          {/* ============================ 0 · pembuka ============================ */}
          <div className="pointer-events-none absolute inset-0">
            <div className="alp-cover-top">
              <p {...sc(0, 'clip', 0)} className="alp-eyebrow">
                <span aria-hidden="true" className="flex h-[3px] w-7 shrink-0 overflow-hidden rounded-full">
                  <span className="flex-1 bg-brand-red" />
                  <span className="flex-1 bg-brand-blue" />
                  <span className="flex-1 bg-brand-green" />
                </span>
                {label}
              </p>
              <p {...sc(0, 'rise', 0.3)} className="alp-wide-only alp-meta">
                {meta[0]}
                <br />
                {meta[1]}
              </p>
            </div>

            <div className="alp-cover-title">
              <h1 id="hero-title" {...sc(0, 'clip', 0.1)} className="alp-h1">
                {title}
              </h1>
              <p {...sc(0, 'rise', 0.35)} className="alp-cover-desc">
                {description}
              </p>
              <div {...sc(0, 'rise', 0.5)} className="alp-cover-cta">
                <Link href={analysisHref} className="alp-btn pointer-events-auto">
                  {ctaAnalysis}
                  <ArrowRight />
                </Link>
                <a href="#tim" className="alp-btn alp-btn--ghost pointer-events-auto">
                  {cta}
                  <ArrowDown />
                </a>
              </div>
            </div>

            <div className="alp-scroll-hint alp-wide-only" aria-hidden="true">
              <span {...sc(0, 'fade', 0.6)} className="flex flex-col items-center gap-2">
                {scrollHint}
                <span className="block h-8 w-px bg-gradient-to-b from-alp-bone/60 to-transparent" />
              </span>
            </div>
          </div>

          {/* ============================ 1–3 · bab ============================ */}
          {chapters.map((chapter, i) => {
            const scene = i + 1;
            const layout = chapterLayout[i];
            return (
              <div key={chapter.word} className="pointer-events-none absolute inset-0">
                <div className={`alp-chapter alp-chapter--${layout}`}>
                  <p {...sc(scene, 'rise', 0)} className="alp-index">
                    <b>{String(scene).padStart(2, '0')}</b> / {String(chapters.length).padStart(2, '0')}
                  </p>
                  <h2 {...sc(scene, 'clip', 0.12)} className="alp-word">
                    {chapter.word}
                  </h2>
                  <span {...sc(scene, 'line', 0.25)} aria-hidden="true" className="alp-rule" />
                  <p {...sc(scene, 'rise', 0.32)} className="alp-caption">
                    {chapter.caption}
                  </p>

                  {scene === 2 && (
                    <ul {...sc(scene, 'rise', 0.45)} aria-label="Kelompok kerja" className="alp-wide-only alp-groups">
                      {workgroups.map((g) => (
                        <li key={g.id}>
                          <span aria-hidden="true" className={`size-1.5 shrink-0 rounded-full ${accentClasses[g.accent].dot}`} />
                          {g.name}
                        </li>
                      ))}
                    </ul>
                  )}

                  {scene === chapters.length && (
                    <div {...sc(scene, 'rise', 0.45)} className="alp-cover-cta">
                      <Link href={analysisHref} className="alp-btn pointer-events-auto">
                        {ctaAnalysis}
                        <ArrowRight />
                      </Link>
                      <a href="#tim" className="alp-btn alp-btn--ghost pointer-events-auto">
                        {cta}
                        <ArrowDown />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Penanda frame */}
          <nav aria-label="Bagian hero" className="alp-frame-nav absolute">
            <ul>
              {frameLabels.map((frameLabel, i) => (
                <li key={frameLabel}>
                  <button type="button" onClick={() => jump(i)} aria-current={active === i ? 'step' : undefined}>
                    <span className="alp-frame-label">{frameLabel}</span>
                    <span aria-hidden="true" className="alp-frame-tick" />
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </section>
  );
}

function ArrowRight() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 20 20" fill="none">
      <path d="M4 10h12m0 0-5-5m5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowDown() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 20 20" fill="none">
      <path d="M10 4v12m0 0 5-5m-5 5-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
