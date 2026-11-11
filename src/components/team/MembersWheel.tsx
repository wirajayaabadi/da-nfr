'use client';

/**
 * Hero "Anggota Tim" berbentuk roda yang diputar — diadaptasi dari komponen Works Wheel.
 *
 * Saat diam, kartu anggota melingkar mengelilingi judul, masing-masing bersinggungan
 * dengan lingkaran. Gulir pertama membuka cincin menjadi drum vertikal: kartu di depan
 * tegak dan penuh, tetangganya berputar menjauh ke dalam perspektif. Terus menggulir
 * membawa anggota berikutnya ke depan.
 *
 * Seluruhnya digerakkan satu angka — `turn` — yang ditulis langsung ke DOM dalam satu
 * pass rAF. 0 = cincin, 1 = drum dengan anggota pertama di depan, dan setiap bilangan
 * bulat berikutnya = satu anggota lagi. Berbeda dari template, `turn` diambil dari posisi
 * gulir halaman (panggung sticky + scroll-snap), sehingga roda mouse dan gestur sentuh
 * tidak pernah dibajak.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Member } from '@/types/team';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { accentClasses, getWorkgroup } from '@/lib/team';
import Avatar from './Avatar';

/* Geometri, dari template. Kartu diukur terhadap panggung; sisanya diukur terhadap
   kartu, sehingga panggung sempit mengecilkan seluruh roda secara proporsional. */
const CARD_H = 0.38; // tinggi kartu depan, terhadap tinggi panggung
const CARD_MAX_W = 0.34; // ...tetapi tidak lebih lebar dari porsi ini
const CARD_MAX_W_NARROW = 0.56; // batas lebar pada layar sempit
const CARD_RATIO = 0.8; // lebar / tinggi — potret 4:5 untuk foto anggota
const STEP = 40; // derajat antar-kartu pada drum
const DRUM = 2.22; // jari-jari drum, dalam tinggi kartu
const LENS = 2.7; // jarak perspektif
const RING_R = 1.14; // jari-jari cincin
/* Lengkung: pusat busur berada di KIRI, sehingga kartu depan tepat di tengah dan
   tetangganya sudah berayun ke kiri sekaligus ke atas/bawah. */
const BOW = 1.82;
const TITLE = 0.124; // judul cincin & nama kartu depan
const INDEX = 0.042; // daftar di sisi kanan
/** Kartu di luar jarak ini dari depan tidak digambar (sudah menyamping). */
const CULL = 1.6;
/** Piksel drag mouse untuk satu anggota. */
const DRAG_UNITS = 420;
/** Porsi jarak tersisa yang ditutup per frame. 1 = tanpa penghalusan. */
const EASE = 0.12;
/** Panjang gulir per anggota, dalam tinggi panggung. */
const UNIT = 0.36;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const rad = (deg: number) => (deg * Math.PI) / 180;

/** Pergeseran ke kiri oleh busur untuk kartu yang berputar `drumDeg` dari depan. */
const bowAt = (drumDeg: number, bow: number) => -bow * (1 - Math.cos(rad(drumDeg)));

/** Kedua keadaan dalam satu rantai transform: suku cincin memudar saat `m` menuju drum. */
function place(ringDeg: number, drumDeg: number, ringR: number, drumR: number, bow: number, m: number) {
  return (
    `translateX(${m * bowAt(drumDeg, bow)}px)` +
    ` rotateZ(${(1 - m) * ringDeg}deg) translateY(${-(1 - m) * ringR}px)` +
    ` rotateX(${m * drumDeg}deg) translateZ(${m * drumR}px)`
  );
}

/** Tinggi panggung: satu layar di bawah navigasi. */
const STAGE = '(100svh - var(--nav-h))';

interface MembersWheelProps {
  members: Member[];
  /** Teks di tengah cincin. */
  label: string;
  /** Kontrol di kiri atas panggung (judul bagian & filter). */
  toolbar?: React.ReactNode;
  onOpen: (member: Member, trigger: HTMLElement) => void;
}

export default function MembersWheel({ members, label, toolbar, onOpen }: MembersWheelProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const wheelRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const labelRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const openRef = useRef<HTMLButtonElement>(null);

  // Hanya `active` yang berupa state; sisanya ditulis langsung ke DOM.
  const turn = useRef(0);
  const target = useRef(0);
  const [active, setActive] = useState(0);
  const [atFront, setAtFront] = useState(false);
  const [stage, setStage] = useState({ w: 0, h: 0 });
  const reduced = useReducedMotion();

  const count = members.length;
  const last = Math.max(count - 1, 0);
  const narrow = stage.w > 0 && stage.w < 640;

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    // ResizeObserver memanggil callback sekali saat observe, jadi ukuran awal ikut terbaca.
    const ro = new ResizeObserver(() => setStage({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const metrics = useMemo(() => {
    const { w, h } = stage;
    const cardW = Math.min(h * CARD_H * CARD_RATIO, w * (narrow ? CARD_MAX_W_NARROW : CARD_MAX_W));
    const cardH = cardW / CARD_RATIO;
    // Kecilkan kartu cincin sampai lingkarannya terbaca sebagai satu putaran utuh.
    // Kartu potret menjulur ke arah pusat, jadi panjang radialnya juga dibatasi
    // agar tepi dalamnya tidak saling menumpuk, dan seluruh cincin muat di panggung.
    const ringR = Math.min(cardH * RING_R, (0.46 * Math.min(w, h)) / 1.24);
    const tangent = count ? (((2 * Math.PI * ringR) / count) * 0.82) / (cardW || 1) : 1;
    const radial = (ringR * 0.48) / (cardH || 1);
    const ringScale = clamp(Math.min(tangent, radial), 0.16, 1);
    return {
      cardW,
      cardH,
      ringR,
      ringScale,
      drumR: cardH * DRUM,
      bow: cardH * BOW,
      depth: cardH * LENS,
      title: Math.max(22, cardH * TITLE),
      index: Math.max(12, cardH * INDEX),
    };
  }, [stage, count, narrow]);

  /** Jarak gulir halaman untuk satu anggota, dalam piksel. */
  const unitPx = () => (stageRef.current?.clientHeight ?? 0) * UNIT;
  /** Titik acuan: bagian atas area snap (navigasi + scroll-padding). */
  const snapTop = () => parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;

  /** Gulir halaman sehingga roda berhenti di posisi `k` (0 = cincin, i + 1 = anggota i). */
  const scrollToTurn = useCallback(
    (k: number) => {
      const section = sectionRef.current;
      if (!section) return;
      const top = section.getBoundingClientRect().top + window.scrollY + clamp(k, 0, last + 1) * unitPx() - snapTop();
      window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
    },
    [last, reduced],
  );

  // Satu pass per frame: baca gulir → target, haluskan, lalu tulis semua transform.
  useEffect(() => {
    const section = sectionRef.current;
    if (!stage.h || !section) return;
    const { ringR, ringScale, drumR, bow } = metrics;
    let frame = 0;
    let running = false;

    const draw = () => {
      frame = requestAnimationFrame(draw);
      const u = unitPx();
      if (u > 0) target.current = clamp((snapTop() - section.getBoundingClientRect().top) / u, 0, last + 1);
      const gap = target.current - turn.current;
      if (Math.abs(gap) < 0.0005) turn.current = target.current;
      else turn.current += gap * (reduced ? 1 : EASE);

      const t = turn.current;
      const m = clamp(t, 0, 1);
      const pos = Math.max(0, t - 1);

      // Drum ditarik mundur agar muka depannya jatuh di bidang gambar.
      if (wheelRef.current) wheelRef.current.style.transform = `translateZ(${-m * drumR}px)`;

      for (let i = 0; i < count; i++) {
        const d = i - pos;
        const drumDeg = d * STEP;
        const card = cardRefs.current[i];
        if (!card) continue;
        card.style.transform = place(d * (360 / count), drumDeg, ringR, drumR, bow, m);
        card.style.opacity = m > 0.5 && Math.abs(d) > CULL ? '0' : '1';
        card.style.zIndex = String(Math.round(100 - Math.abs(d) * 2));
        const face = card.firstElementChild as HTMLElement | null;
        if (face) face.style.transform = `scale(${lerp(ringScale, 1, m)})`;
      }

      // Label cincin hilang lebih dulu, nama kartu depan muncul belakangan,
      // agar keduanya tidak bertumpuk di atas kartu selama transisi.
      if (labelRef.current) labelRef.current.style.opacity = String(clamp(1 - m / 0.6, 0, 1));
      if (titleRef.current) {
        titleRef.current.style.opacity = String(clamp((m - 0.35) / 0.65, 0, 1));
        titleRef.current.style.visibility = m < 0.05 ? 'hidden' : '';
      }
      const near = clamp(Math.round(pos), 0, last);
      setActive((prev) => (prev === near ? prev : near));
      const front = m > 0.5;
      setAtFront((prev) => (prev === front ? prev : front));
    };

    const start = () => {
      if (running) return;
      running = true;
      frame = requestAnimationFrame(draw);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(frame);
    };
    const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()));
    io.observe(section);
    start();
    return () => {
      stop();
      io.disconnect();
    };
  }, [metrics, stage.h, count, last, reduced]);

  // Drag mouse vertikal memutar roda (diterjemahkan menjadi gulir halaman). Pointer baru
  // ditangkap setelah benar-benar bergeser, agar klik biasa tetap sampai ke kartu.
  const drag = useRef<{ id: number; y: number; moved: boolean } | null>(null);
  const justDragged = useRef(false);
  useEffect(() => () => void (document.documentElement.style.scrollSnapType = ''), []);

  const step = (dir: 1 | -1) => scrollToTurn(clamp(Math.round(target.current) + dir, 1, last + 1));
  const current = members[active];

  if (count === 0) return null;

  return (
    <div
      ref={sectionRef}
      id="anggota"
      className="relative"
      style={{ height: `calc(${STAGE} * ${(1 + (last + 1) * UNIT).toFixed(3)})` }}
      onKeyDown={(event) => {
        // Panah di dalam dropdown filter tetap milik dropdown.
        if ((event.target as HTMLElement).closest('select, input, textarea')) return;
        if (event.key === 'ArrowDown' || event.key === 'ArrowRight') step(1);
        else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') step(-1);
        else return;
        event.preventDefault();
      }}
    >
      {/* Titik snap: satu per posisi roda, agar gulir berhenti tepat pada seorang anggota. */}
      {Array.from({ length: last + 2 }, (_, k) => (
        <div
          key={k}
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 h-px snap-start"
          style={{ top: `calc(${STAGE} * ${(k * UNIT).toFixed(3)})` }}
        />
      ))}

      <div
        ref={stageRef}
        className="sticky top-[var(--nav-h)] w-full overflow-hidden select-none"
        style={{ height: `calc${STAGE}` }}
      >
        {/* Roda */}
        <div
          aria-hidden="true"
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
          style={{ perspective: `${metrics.depth}px`, touchAction: 'pan-y' }}
          onPointerDown={(event) => {
            if (event.pointerType !== 'mouse' || event.button !== 0) return;
            drag.current = { id: event.pointerId, y: event.clientY, moved: false };
            justDragged.current = false;
          }}
          onPointerMove={(event) => {
            const d = drag.current;
            if (!d || d.id !== event.pointerId) return;
            if (!d.moved) {
              if (Math.abs(event.clientY - d.y) < 5) return;
              d.moved = true;
              event.currentTarget.setPointerCapture(event.pointerId);
              // Selama drag, snap dimatikan: setiap scrollBy kecil akan dibaca browser
              // sebagai lompatan ke titik snap berikutnya.
              document.documentElement.style.scrollSnapType = 'none';
            }
            window.scrollBy({ top: ((d.y - event.clientY) * unitPx()) / DRAG_UNITS, behavior: 'instant' });
            d.y = event.clientY;
          }}
          onPointerUp={() => {
            justDragged.current = !!drag.current?.moved;
            drag.current = null;
            // Snap kembali aktif dan roda berhenti tepat pada anggota terdekat.
            document.documentElement.style.scrollSnapType = '';
          }}
          onPointerCancel={() => {
            drag.current = null;
            document.documentElement.style.scrollSnapType = '';
          }}
        >
          <div
            ref={wheelRef}
            className={`absolute left-1/2 [transform-style:preserve-3d] ${narrow ? 'top-[42%]' : 'top-1/2'}`}
          >
            {members.map((member, i) => {
              const group = getWorkgroup(member.teamId);
              const accent = accentClasses[group.accent];
              return (
                <div
                  key={member.id}
                  ref={(node) => {
                    cardRefs.current[i] = node;
                  }}
                  data-wheel-card
                  className="absolute cursor-pointer [backface-visibility:hidden]"
                  style={{
                    width: metrics.cardW,
                    height: metrics.cardH,
                    marginLeft: -metrics.cardW / 2,
                    marginTop: -metrics.cardH / 2,
                  }}
                  onClick={() => {
                    if (justDragged.current) return;
                    // Kartu depan membuka profil; kartu lain diputar ke depan dahulu.
                    const atRest = Math.abs(turn.current - (i + 1)) < 0.3;
                    if (atRest && openRef.current) onOpen(member, openRef.current);
                    else scrollToTurn(i + 1);
                  }}
                >
                  <span className="relative block size-full overflow-hidden rounded-2xl bg-white shadow-[0_22px_44px_-20px_rgb(16_24_40/0.35)] ring-1 ring-black/5">
                    <Avatar
                      src={member.photo}
                      name={member.name}
                      sizes="(min-width: 640px) 320px, 60vw"
                      className="size-full"
                      initialsClassName="text-5xl"
                    />
                    <span className="absolute inset-x-0 bottom-0 flex items-center gap-1.5 bg-gradient-to-t from-ink/75 to-transparent px-3 pt-8 pb-3 text-[11px] font-semibold text-white">
                      <span className={`size-1.5 shrink-0 rounded-full ${accent.dot}`} />
                      <span className="truncate">{group.name}</span>
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Layar sempit: kartu tetangga meluncur di bawah judul & panel nama. */}
        {narrow && (
          <>
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-canvas via-canvas/90 to-transparent" />
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-canvas via-canvas/95 to-transparent" />
          </>
        )}

        {/* Judul cincin dan nama kartu depan bertukar tempat selama transisi. */}
        <div
          ref={labelRef}
          className={`pointer-events-none absolute inset-x-0 grid place-items-center text-center ${narrow ? 'top-[42%] -translate-y-1/2' : 'inset-y-0'}`}
        >
          <div>
            <p className="font-extrabold tracking-[-0.03em] text-ink" style={{ fontSize: metrics.title }}>
              {label}
            </p>
            <p className="mt-2 text-xs font-semibold tracking-[0.16em] text-subtle uppercase">Gulir untuk memutar</p>
          </div>
        </div>

        <div
          ref={titleRef}
          className={
            narrow
              ? 'absolute inset-x-4 bottom-5 text-center opacity-0'
              : 'absolute top-1/2 left-[6%] max-w-[26%] -translate-y-1/2 opacity-0'
          }
        >
          {current && (
            <>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${accentClasses[getWorkgroup(current.teamId).accent].tag}`}>
                <span aria-hidden="true" className={`size-1.5 rounded-full ${accentClasses[getWorkgroup(current.teamId).accent].dot}`} />
                {getWorkgroup(current.teamId).name}
              </span>
              <h4 className="mt-3 leading-[1.05] font-extrabold tracking-[-0.03em] text-ink" style={{ fontSize: narrow ? 28 : metrics.title }}>
                {current.name}
              </h4>
              <p className="mt-2 text-sm font-medium text-muted">
                {current.company} · {current.role}
              </p>
              <p className={`mt-2 text-sm leading-relaxed text-subtle ${narrow ? 'line-clamp-1' : 'line-clamp-2'}`}>{current.summary}</p>
              <div className={`mt-4 flex items-center gap-2 ${narrow ? 'justify-center' : ''}`}>
                {narrow && (
                  <button
                    type="button"
                    aria-label="Anggota sebelumnya"
                    onClick={() => step(-1)}
                    className="grid size-11 place-items-center rounded-full border border-line bg-white text-ink"
                  >
                    <Chevron dir="up" />
                  </button>
                )}
                <button
                  ref={openRef}
                  type="button"
                  tabIndex={atFront ? 0 : -1}
                  onClick={(e) => onOpen(current, e.currentTarget)}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-ink px-5 text-sm font-semibold text-white transition-colors hover:bg-ink/85"
                >
                  Lihat Profil
                  <span className="sr-only"> {current.name}</span>
                </button>
                {narrow && (
                  <button
                    type="button"
                    aria-label="Anggota berikutnya"
                    onClick={() => step(1)}
                    className="grid size-11 place-items-center rounded-full border border-line bg-white text-ink"
                  >
                    <Chevron dir="down" />
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Kiri atas: judul bagian & filter */}
        {toolbar && <div className="absolute top-5 left-4 z-[120] sm:left-6 lg:left-[6%]">{toolbar}</div>}

        {/* Daftar anggota di sisi kanan (layar lebar) */}
        {!narrow && (
          <nav aria-label="Daftar anggota" className="absolute top-[7.5%] right-[3%] z-[120]">
            <ol className="text-right leading-[1.85]" style={{ fontSize: metrics.index }}>
              {members.map((member, i) => {
                const isCurrent = atFront && i === active;
                return (
                  <li key={member.id}>
                    <button
                      type="button"
                      onClick={() => scrollToTurn(i + 1)}
                      aria-current={isCurrent ? 'true' : undefined}
                      className={`cursor-pointer rounded-sm transition-colors ${isCurrent ? 'font-semibold text-ink' : 'text-subtle hover:text-ink'}`}
                    >
                      {member.name}
                      <span className="sr-only"> — {getWorkgroup(member.teamId).name}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>
        )}
      </div>
    </div>
  );
}

function Chevron({ dir }: { dir: 'up' | 'down' }) {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 20 20" fill="none">
      <path
        d={dir === 'up' ? 'm5 12 5-5 5 5' : 'm5 8 5 5 5-5'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
