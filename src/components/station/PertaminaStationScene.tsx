'use client';

import { useEffect, useRef, useState } from 'react';
import { site } from '@/config/site';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { StationSceneController } from '@/lib/station/scene';
import StationFallback from './StationFallback';

type Status = 'loading' | 'ready' | 'error';

const SCENE_LABEL =
  'Miniatur 3D SPBU Pertamina: kanopi putih beraksen merah dengan logo Pertamina, dua dispenser BBM dengan selang, papan identitas SPBU, bangunan layanan, dan sebuah mobil yang masuk, berhenti di dispenser, lalu keluar. Sudut kamera berubah saat halaman digulir.';

interface Props {
  /** Koordinat frame hero saat ini; adegan membacanya setiap frame. */
  getCoord: () => number;
}

/**
 * Integrasi React dengan adegan Three.js pada panggung hero. Modul 3D dimuat terpisah
 * (dynamic import) sehingga teks hero tidak menunggu three.js.
 */
export default function PertaminaStationScene({ getCoord }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<StationSceneController | null>(null);
  const getCoordRef = useRef(getCoord);
  const reducedMotion = useReducedMotion();
  const reducedRef = useRef(reducedMotion);

  const [status, setStatus] = useState<Status>('loading');
  const [contextLost, setContextLost] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [canDrag, setCanDrag] = useState(false);

  useEffect(() => {
    getCoordRef.current = getCoord;
  }, [getCoord]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let cancelled = false;
    let controller: StationSceneController | null = null;

    (async () => {
      try {
        // Teks di canvas memakai font halaman; tunggu font siap terlebih dahulu.
        await document.fonts.ready;
        const { createStationScene } = await import('@/lib/station/scene');
        if (cancelled) return;
        controller = createStationScene(mount, {
          fontFamily: getComputedStyle(mount).fontFamily,
          logoSrc: site.brand.logoSrc,
          reducedMotion: reducedRef.current,
          getCoord: () => getCoordRef.current(),
          onReady: () => !cancelled && setStatus('ready'),
          onContextLost: () => {
            if (cancelled) return;
            setContextLost(true);
            setStatus('error');
          },
          onContextRestored: () => {
            if (cancelled) return;
            setContextLost(false);
            setStatus('ready');
          },
          onPlayingChange: (next) => !cancelled && setPlaying(next),
        });
        controllerRef.current = controller;
        setCanDrag(controller.canDrag);
        setPlaying(!reducedRef.current);
      } catch (error) {
        if (cancelled) return;
        console.error('SPBU 3D: adegan gagal dimulai', error);
        setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
      controller?.dispose();
      controllerRef.current = null;
    };
  }, []);

  useEffect(() => {
    reducedRef.current = reducedMotion;
    controllerRef.current?.setReducedMotion(reducedMotion);
  }, [reducedMotion]);

  const ready = status === 'ready';
  const failed = status === 'error';

  return (
    <>
      <div
        ref={mountRef}
        role="img"
        aria-label={SCENE_LABEL}
        className={`absolute inset-0 transition-opacity duration-700 ${ready ? 'opacity-100' : 'opacity-0'}`}
      />

      {failed && <StationFallback className="alp-fallback" />}

      <div className="alp-controls pointer-events-none absolute flex items-center gap-3">
        {status === 'loading' && (
          <p role="status" className="flex items-center gap-2.5 rounded-full bg-white/10 px-3.5 py-2 text-xs font-medium text-alp-bone ring-1 ring-white/15 backdrop-blur">
            <span aria-hidden="true" className="size-3.5 rounded-full border-2 border-white/25 border-t-white motion-safe:animate-spin" />
            Menyiapkan SPBU 3D…
          </p>
        )}
        {failed && (
          <p role="status" className="max-w-72 rounded-2xl bg-white/10 px-3.5 py-2 text-xs font-medium text-alp-bone ring-1 ring-white/15 backdrop-blur">
            {contextLost
              ? 'Tampilan 3D terhenti sementara. Ilustrasi statis ditampilkan hingga grafis pulih.'
              : 'Tampilan 3D tidak tersedia di perangkat ini. Menampilkan ilustrasi statis.'}
          </p>
        )}
        {ready && (
          <>
            <button
              type="button"
              aria-label={playing ? 'Jeda animasi' : 'Putar animasi'}
              onClick={() => (playing ? controllerRef.current?.pause() : controllerRef.current?.play())}
              className="pointer-events-auto inline-flex min-h-10 items-center gap-2 rounded-full bg-white/10 px-3.5 text-sm font-semibold text-alp-bone ring-1 ring-white/20 backdrop-blur transition-colors hover:bg-white/20"
            >
              {playing ? (
                <svg aria-hidden="true" width="13" height="13" viewBox="0 0 12 12" fill="currentColor">
                  <rect x="2" y="1.5" width="2.6" height="9" rx=".6" />
                  <rect x="7.4" y="1.5" width="2.6" height="9" rx=".6" />
                </svg>
              ) : (
                <svg aria-hidden="true" width="13" height="13" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M3 1.6v8.8L10.4 6z" />
                </svg>
              )}
              <span aria-hidden="true">
                {playing ? 'Jeda' : 'Putar'}
                <span className="hidden sm:inline"> animasi</span>
              </span>
            </button>
            <p className="hidden items-center gap-2 text-xs font-medium text-alp-bone/65 md:flex">
              <span aria-hidden="true" className={`size-1.5 rounded-full ${playing ? 'bg-brand-green' : 'bg-white/40'}`} />
              <span aria-live="polite">{playing ? 'Animasi berjalan' : 'Animasi dijeda'}</span>
              {canDrag && <span>· Seret untuk memutar</span>}
            </p>
          </>
        )}
      </div>
    </>
  );
}
