import { workgroups } from '@/data/team';
import type { Accent, TeamId, Workgroup } from '@/types/team';

const byId = new Map(workgroups.map((w) => [w.id, w]));

export function getWorkgroup(id: TeamId): Workgroup {
  const group = byId.get(id);
  if (!group) throw new Error(`Kelompok kerja tidak dikenal: ${id}`);
  return group;
}

/** "Anggota 01" → "A01", "Siti Rahma Putri" → "SP". */
export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  const first = words[0][0].toUpperCase();
  const last = words.length > 1 ? words[words.length - 1] : '';
  if (/^\d+$/.test(last)) return first + last;
  return first + (last ? last[0].toUpperCase() : '');
}

export const accentClasses: Record<Accent, { tag: string; dot: string }> = {
  red: { tag: 'bg-brand-red-soft text-brand-red-deep', dot: 'bg-brand-red' },
  blue: { tag: 'bg-brand-blue-soft text-brand-blue-strong', dot: 'bg-brand-blue' },
  green: { tag: 'bg-brand-green-soft text-brand-green-strong', dot: 'bg-brand-green' },
};

/** Tautan opsional dianggap tersedia hanya bila berupa URL http(s) atau path lokal. */
export function hasLink(url?: string): url is string {
  return !!url && (/^https?:\/\//i.test(url) || url.startsWith('/'));
}
