const id = new Intl.NumberFormat("id-ID");

export const n = (v: number | null | undefined, digits = 0) =>
  v === null || v === undefined ? "–" : new Intl.NumberFormat("id-ID", { maximumFractionDigits: digits }).format(v);

export const pct = (v: number | null | undefined, digits = 1) =>
  v === null || v === undefined ? "–" : `${new Intl.NumberFormat("id-ID", { maximumFractionDigits: digits }).format(v)}%`;

/** Rupiah ringkas: 1,2 T / 134,6 M / 15 jt / 250 rb */
export const rp = (v: number | null | undefined, digits = 1) => {
  if (v === null || v === undefined) return "–";
  const f = (x: number, d = digits) => new Intl.NumberFormat("id-ID", { maximumFractionDigits: d }).format(x);
  const a = Math.abs(v);
  if (a >= 1e12) return `Rp ${f(v / 1e12)} T`;
  if (a >= 1e9) return `Rp ${f(v / 1e9)} M`;
  if (a >= 1e6) return `Rp ${f(v / 1e6)} jt`;
  if (a >= 1e3) return `Rp ${f(v / 1e3, 0)} rb`;
  return `Rp ${id.format(v)}`;
};

export const rpFull = (v: number | null | undefined) =>
  v === null || v === undefined ? "–" : `Rp ${id.format(Math.round(v))}`;
