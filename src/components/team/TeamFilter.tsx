'use client';

import type { TeamId, Workgroup } from '@/types/team';

export type FilterValue = 'all' | TeamId;

interface TeamFilterProps {
  groups: Workgroup[];
  counts: Record<FilterValue, number>;
  value: FilterValue;
  onChange: (value: FilterValue) => void;
}

/** Dropdown ringkas untuk memfilter anggota berdasarkan kelompok kerja. */
export default function TeamFilter({ groups, counts, value, onChange }: TeamFilterProps) {
  const options: Array<{ id: FilterValue; label: string }> = [
    { id: 'all', label: 'Semua Tim' },
    ...groups.map((g) => ({ id: g.id, label: g.name })),
  ];

  return (
    <label className="block">
      <span className="sr-only">Filter kelompok kerja</span>
      <span className="relative block">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as FilterValue)}
          className="min-h-11 w-full appearance-none rounded-full border border-line bg-white py-2.5 pr-10 pl-4 text-sm font-semibold text-ink shadow-card"
        >
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label} ({counts[o.id]})
            </option>
          ))}
        </select>
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-subtle"
          width="16"
          height="16"
          viewBox="0 0 20 20"
          fill="none"
        >
          <path d="m5 8 5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </label>
  );
}
