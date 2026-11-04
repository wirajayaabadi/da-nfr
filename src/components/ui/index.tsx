"use client";

import { useState, type ReactNode } from "react";

export function PageHeader({ title, lead }: { title: string; lead: ReactNode }) {
  return (
    <header className="mb-8">
      <h1 className="text-balance text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-2">{lead}</p>
    </header>
  );
}

export function StatTile({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "good" | "warn" }) {
  return (
    <div className="card p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-ink-3">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${tone === "good" ? "text-[var(--delta-good)]" : tone === "warn" ? "text-critical" : ""}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-ink-2">{sub}</div>}
    </div>
  );
}

export function Hero({ value, label, sub }: { value: string; label: string; sub?: string }) {
  return (
    <div className="card p-6">
      <div className="text-sm text-ink-2">{label}</div>
      <div className="mt-1 text-5xl font-semibold leading-none tracking-tight">{value}</div>
      {sub && <div className="mt-3 text-sm text-ink-2">{sub}</div>}
    </div>
  );
}

export type Column<T> = { key: keyof T | string; label: string; render?: (row: T) => ReactNode; align?: "left" | "right" };

export function DataTable<T extends object>({ rows, columns, max = 50 }: { rows: T[]; columns: Column<T>[]; max?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-grid text-left text-xs uppercase tracking-wide text-ink-3">
            {columns.map((c) => (
              <th key={String(c.key)} className={`py-2 pr-3 font-medium ${c.align === "right" ? "text-right" : ""}`}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, max).map((r, i) => (
            <tr key={i} className="border-b border-grid/60 last:border-0">
              {columns.map((c) => (
                <td key={String(c.key)} className={`py-2 pr-3 ${c.align === "right" ? "text-right tnum" : ""}`}>
                  {c.render ? c.render(r) : String((r as Record<string, unknown>)[c.key as string] ?? "–")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > max && <div className="mt-2 text-xs text-ink-3">Menampilkan {max} dari {rows.length} baris.</div>}
    </div>
  );
}

/** Kartu chart dengan judul, catatan, dan tombol "Tabel" (relief untuk warna kontras rendah). */
export function ChartCard({ title, note, children, table, className = "" }: { title: string; note?: ReactNode; children: ReactNode; table?: ReactNode; className?: string }) {
  const [showTable, setShowTable] = useState(false);
  return (
    <section className={`card flex flex-col p-4 ${className}`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          {note && <p className="mt-0.5 text-xs text-ink-2">{note}</p>}
        </div>
        {table && (
          <button
            type="button"
            onClick={() => setShowTable((s) => !s)}
            className="shrink-0 rounded-md border border-grid px-2 py-1 text-xs text-ink-2 hover:bg-plane"
            aria-pressed={showTable}
          >
            {showTable ? "Grafik" : "Tabel"}
          </button>
        )}
      </div>
      <div className="min-h-0 flex-1">{showTable ? table : children}</div>
    </section>
  );
}

export function Insight({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "good" | "warn" }) {
  const bar = tone === "good" ? "bg-good" : tone === "warn" ? "bg-serious" : "bg-accent";
  return (
    <div className="card flex gap-3 p-4">
      <div className={`w-1 shrink-0 rounded-full ${bar}`} aria-hidden />
      <p className="text-sm leading-6">{children}</p>
    </div>
  );
}

export function Pill({ children, color }: { children: ReactNode; color: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-grid px-2 py-0.5 text-xs">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} aria-hidden />
      {children}
    </span>
  );
}
