import * as THREE from 'three';
import { CAR, CYCLE } from './config';
import type { CarRig } from './build-station';

export type CarPhase = 'enter' | 'stop' | 'exit' | 'gap';

const easeOut = (t: number) => 1 - (1 - t) * (1 - t);
const easeIn = (t: number) => t * t;

/**
 * Satu siklus ringan: mobil masuk → berhenti di dispenser → keluar → jeda, lalu mengulang.
 * Jalur memakai titik-titik yang sama dengan marka MASUK/KELUAR dan posisi dispenser di config.
 */
export function createCarCycle(rig: CarRig, groundY: number) {
  const curve = new THREE.CatmullRomCurve3(
    CAR.path.map(([x, z]) => new THREE.Vector3(x, groundY, z)),
    false,
    'centripetal',
  );

  // Cari parameter jalur (berbasis panjang busur) yang paling dekat dengan titik berhenti.
  let stopU = 0.5;
  let best = Infinity;
  for (let i = 0; i <= 800; i++) {
    const u = i / 800;
    const p = curve.getPointAt(u);
    const d = (p.x - CAR.stopAt[0]) ** 2 + (p.z - CAR.stopAt[1]) ** 2;
    if (d < best) {
      best = d;
      stopU = u;
    }
  }

  const total = CYCLE.enter + CYCLE.stop + CYCLE.exit + CYCLE.gap;
  const point = new THREE.Vector3();
  const tangent = new THREE.Vector3();

  function phaseAt(time: number): { phase: CarPhase; u: number } {
    const t = ((time % total) + total) % total;
    if (t < CYCLE.enter) return { phase: 'enter', u: stopU * easeOut(t / CYCLE.enter) };
    if (t < CYCLE.enter + CYCLE.stop) return { phase: 'stop', u: stopU };
    const te = t - CYCLE.enter - CYCLE.stop;
    if (te < CYCLE.exit) return { phase: 'exit', u: stopU + (1 - stopU) * easeIn(te / CYCLE.exit) };
    return { phase: 'gap', u: 1 };
  }

  function apply(time: number) {
    const { phase, u } = phaseAt(time);
    rig.group.visible = phase !== 'gap';
    curve.getPointAt(u, point);
    curve.getTangentAt(Math.min(0.999, Math.max(0.001, u)), tangent);
    rig.group.position.copy(point);
    rig.group.rotation.y = Math.atan2(-tangent.z, tangent.x);
    // Lampu rem menyala saat mobil melambat dan berhenti.
    const t = ((time % total) + total) % total;
    const braking = phase === 'stop' || (phase === 'enter' && t > CYCLE.enter * 0.6);
    rig.tailLight.emissiveIntensity = braking ? 1.6 : 0.5;
    return phase;
  }

  return {
    total,
    apply,
    /** Waktu siklus saat mobil sudah berhenti di dispenser — dipakai untuk tampilan statis. */
    restTime: CYCLE.enter + CYCLE.stop * 0.5,
  };
}
