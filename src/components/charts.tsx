"use client";

import { useMemo } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceArea, ReferenceLine, ResponsiveContainer,
  Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis,
} from "recharts";
import { n, rp } from "@/lib/format";
import type { Alternative } from "@/lib/data";

export const SERIES = ["var(--series-1)", "var(--series-2)", "var(--series-3)", "var(--series-4)"];
export const QUADRANT_COLOR: Record<Alternative["kuadran"], string> = {
  "Quick Win": "var(--series-3)",
  "Major Project": "var(--series-1)",
  "Fill-in": "var(--series-4)",
  "Thankless Task": "var(--series-2)",
};

const axisStyle = { fontSize: 11, fill: "var(--ink-3)" };

type TipRow = { label: string; value: string };
function Tip({ title, rows }: { title: string; rows: TipRow[] }) {
  return (
    <div className="card px-3 py-2 text-xs shadow-sm">
      <div className="mb-1 font-semibold">{title}</div>
      {rows.map((r) => (
        <div key={r.label} className="flex justify-between gap-4">
          <span className="text-ink-2">{r.label}</span>
          <span className="tnum">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ Ranked horizontal bars */
export function RankedBars<T extends Record<string, unknown>>({
  rows, label, value, format = (v) => n(v), height, highlight, maxRows = 15, color = SERIES[0], tip,
}: {
  rows: T[]; label: keyof T; value: keyof T; format?: (v: number) => string; height?: number;
  highlight?: (r: T) => boolean; maxRows?: number; color?: string; tip?: (r: T) => TipRow[];
}) {
  const data = rows.slice(0, maxRows);
  const h = height ?? Math.max(160, data.length * 28 + 16);
  return (
    <div style={{ height: h }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 72, bottom: 4, left: 4 }} barCategoryGap={2}>
          <CartesianGrid horizontal={false} stroke="var(--grid)" />
          <XAxis type="number" tick={axisStyle} axisLine={{ stroke: "var(--axis)" }} tickLine={false} tickFormatter={(v) => format(v)} />
          <YAxis type="category" dataKey={label as string} width={150} tick={{ ...axisStyle, fill: "var(--ink-2)" }} axisLine={false} tickLine={false} interval={0} />
          <Tooltip
            cursor={{ fill: "var(--grid)", opacity: 0.4 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const r = payload[0].payload as T;
              return <Tip title={String(r[label])} rows={tip ? tip(r) : [{ label: "Nilai", value: format(Number(r[value])) }]} />;
            }}
          />
          <Bar dataKey={value as string} radius={[0, 4, 4, 0]} maxBarSize={18} isAnimationActive={false}>
            {data.map((r, i) => (
              <Cell key={i} fill={highlight ? (highlight(r) ? color : "var(--muted-mark)") : color} />
            ))}
            <LabelList dataKey={value as string} position="right" formatter={(v: unknown) => format(Number(v))} style={{ fontSize: 11, fill: "var(--ink-2)" }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ------------------------------------------------------------------ Columns (ordered buckets) */
export function Columns<T extends Record<string, unknown>>({
  rows, label, value, format = (v) => n(v), height = 220, color = SERIES[0], tip,
}: { rows: T[]; label: keyof T; value: keyof T; format?: (v: number) => string; height?: number; color?: string; tip?: (r: T) => TipRow[] }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 16, right: 8, bottom: 4, left: 0 }} barCategoryGap={2}>
          <CartesianGrid vertical={false} stroke="var(--grid)" />
          <XAxis dataKey={label as string} tick={axisStyle} axisLine={{ stroke: "var(--axis)" }} tickLine={false} interval={0} />
          <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={(v) => format(v)} width={56} />
          <Tooltip
            cursor={{ fill: "var(--grid)", opacity: 0.4 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const r = payload[0].payload as T;
              return <Tip title={String(r[label])} rows={tip ? tip(r) : [{ label: "Nilai", value: format(Number(r[value])) }]} />;
            }}
          />
          <Bar dataKey={value as string} fill={color} radius={[4, 4, 0, 0]} maxBarSize={40} isAnimationActive={false}>
            <LabelList dataKey={value as string} position="top" formatter={(v: unknown) => format(Number(v))} style={{ fontSize: 11, fill: "var(--ink-2)" }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ------------------------------------------------------------------ Heatmap (CSS grid, sequential blue) */
const SEQ = ["var(--seq-100)", "var(--seq-200)", "var(--seq-300)", "var(--seq-400)", "var(--seq-500)", "var(--seq-600)", "var(--seq-700)"];
export function Heatmap({ rows, rowKey, columns, totalKey }: { rows: Array<Record<string, number | string>>; rowKey: string; columns: string[]; totalKey?: string }) {
  const max = Math.max(...rows.flatMap((r) => columns.map((c) => Number(r[c]) || 0)));
  const step = (v: number) => (v <= 0 ? -1 : Math.min(SEQ.length - 1, Math.floor((Math.log1p(v) / Math.log1p(max)) * SEQ.length)));
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate text-xs" style={{ borderSpacing: 2 }}>
        <thead>
          <tr>
            <th className="text-left font-medium text-ink-3"> </th>
            {columns.map((c) => (
              <th key={c} className="px-1 pb-1 text-center font-medium text-ink-3" style={{ minWidth: 72 }}>{c}</th>
            ))}
            {totalKey && <th className="px-1 pb-1 text-right font-medium text-ink-3">Total</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={String(r[rowKey])}>
              <td className="whitespace-nowrap pr-2 text-ink-2">{String(r[rowKey])}</td>
              {columns.map((c) => {
                const v = Number(r[c]) || 0;
                const s = step(v);
                const dark = s >= 4;
                return (
                  <td key={c} className="rounded-sm text-center tnum" title={`${r[rowKey]} · ${c}: ${n(v)} lahan`}
                    style={{ background: s < 0 ? "transparent" : SEQ[s], color: dark ? "#fff" : "var(--ink-1)", height: 30 }}>
                    {v ? n(v) : ""}
                  </td>
                );
              })}
              {totalKey && <td className="pl-2 text-right tnum text-ink-2">{n(Number(r[totalKey]))}</td>}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-2 flex items-center gap-1 text-[11px] text-ink-3">
        <span>lebih sedikit</span>
        {SEQ.map((c) => <span key={c} className="h-3 w-5 rounded-sm" style={{ background: c }} />)}
        <span>lebih banyak (skala log)</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Impact-Effort matrix */
const QLABEL = { fill: "var(--ink-3)", fontSize: 11, fontWeight: 600 };

/** Titik dengan skor identik digeser sedikit ke kanan agar tidak bertumpuk; tooltip tetap memakai skor asli. */
function spread(items: Alternative[]) {
  const placed: Array<Alternative & { ex: number; iy: number }> = [];
  for (const a of items) {
    let ex = a.effort;
    while (placed.some((p) => Math.abs(p.ex - ex) < 0.35 && Math.abs(p.iy - a.impact) < 0.35)) ex += 0.45;
    placed.push({ ...a, ex, iy: a.impact });
  }
  return placed;
}

export function ImpactEffortMatrix({ items, selected, onSelect, xMid = 5.5, yMid = 6.5 }: { items: Alternative[]; selected?: string; onSelect?: (id: string) => void; xMid?: number; yMid?: number }) {
  const data = useMemo(() => spread(items), [items]);
  return (
    <div style={{ height: 460 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 24, right: 24, bottom: 28, left: 8 }}>
          <CartesianGrid stroke="var(--grid)" />
          <XAxis type="number" dataKey="ex" domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={axisStyle} axisLine={{ stroke: "var(--axis)" }} tickLine={false}
            label={{ value: "Usaha (effort) → lebih berat", position: "insideBottom", offset: -16, style: { ...axisStyle, fill: "var(--ink-2)" } }} />
          <YAxis type="number" dataKey="iy" domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={axisStyle} axisLine={false} tickLine={false} width={40}
            label={{ value: "Dampak (impact) ↑", angle: -90, position: "insideLeft", style: { ...axisStyle, fill: "var(--ink-2)" } }} />
          <ZAxis type="number" dataKey="addressable" range={[120, 700]} />
          <ReferenceArea x1={0} x2={xMid} y1={yMid} y2={10} fill="transparent" stroke="none" label={{ value: "QUICK WIN", position: "insideTopLeft", ...QLABEL }} />
          <ReferenceArea x1={xMid} x2={10} y1={yMid} y2={10} fill="transparent" stroke="none" label={{ value: "MAJOR PROJECT", position: "insideTopRight", ...QLABEL }} />
          <ReferenceArea x1={0} x2={xMid} y1={0} y2={yMid} fill="transparent" stroke="none" label={{ value: "FILL-IN", position: "insideBottomLeft", ...QLABEL }} />
          <ReferenceArea x1={xMid} x2={10} y1={0} y2={yMid} fill="transparent" stroke="none" label={{ value: "THANKLESS TASK", position: "insideBottomRight", ...QLABEL }} />
          <ReferenceLine x={xMid} stroke="var(--axis)" />
          <ReferenceLine y={yMid} stroke="var(--axis)" />
          <Tooltip
            cursor={false}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const a = payload[0].payload as Alternative;
              return <Tip title={`${a.id} · ${a.nama}`} rows={[{ label: "Dampak", value: n(a.impact, 1) }, { label: "Usaha", value: n(a.effort, 1) }, { label: "Lahan/SPBU terjangkau", value: n(a.addressable) }, { label: "Kuadran", value: a.kuadran }]} />;
            }}
          />
          <Scatter data={data} isAnimationActive={false} onClick={(d) => onSelect?.((d as unknown as { id: string }).id)} cursor="pointer">
            {data.map((a) => (
              <Cell key={a.id} fill={QUADRANT_COLOR[a.kuadran]} stroke="var(--surface-1)" strokeWidth={2}
                opacity={selected && selected !== a.id ? 0.45 : 1} />
            ))}
            <LabelList dataKey="id" position="top" offset={10} style={{ fontSize: 11, fontWeight: 600, fill: "var(--ink-1)" }} />
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ------------------------------------------------------------------ Segmented bar (tall) */
export function SegmentedBar({ parts, total }: { parts: { label: string; value: number; color: string }[]; total: number }) {
  return (
    <div>
      <div className="flex h-10 w-full gap-[2px] overflow-hidden rounded-md">
        {parts.map((p) => {
          const w = (p.value / total) * 100;
          return (
            <div key={p.label} className="flex items-center justify-center text-[11px] font-medium" style={{ width: `${w}%`, background: p.color, color: p.color.includes("series-4") ? "#0b0b0b" : "#fff" }} title={`${p.label}: ${n(p.value)} (${n(w, 1)}%)`}>
              {w > 7 ? `${n(w)}%` : ""}
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-2">
        {parts.map((p) => (
          <span key={p.label} className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: p.color }} aria-hidden />{p.label} · {n(p.value)}</span>
        ))}
      </div>
    </div>
  );
}

export function Meter({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs text-ink-2"><span>{label}</span><span className="tnum">{n(value, 1)}%</span></div>
      <div className="mt-1 h-2 w-full rounded-full" style={{ background: "var(--seq-100)" }}>
        <div className="h-2 rounded-full" style={{ width: `${Math.min(100, value)}%`, background: "var(--seq-500)" }} />
      </div>
    </div>
  );
}

export { rp };
