"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const gayaTooltip = {
  background: "var(--panel)",
  border: "1px solid var(--line)",
  borderRadius: 12,
  fontSize: 13,
} as const;

export function GrafikBulanan({
  data,
}: {
  data: { label: string; masuk: number; tuntas: number }[];
}) {
  return (
    <div className="h-60">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="var(--muted)" />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="var(--muted)" />
          <Tooltip contentStyle={gayaTooltip} />
          <Bar dataKey="masuk" name="Masuk" fill="#93a39b" radius={[6, 6, 0, 0]} />
          <Bar dataKey="tuntas" name="Selesai" fill="#2e9e57" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function GrafikKategori({
  data,
}: {
  data: { nama: string; warna: string; persen: number }[];
}) {
  return (
    <div className="h-60">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis
            type="category"
            dataKey="nama"
            width={120}
            tick={{ fontSize: 11 }}
            stroke="var(--muted)"
          />
          <Tooltip contentStyle={gayaTooltip} />
          <Bar dataKey="persen" name="Selesai (%)" radius={[0, 8, 8, 0]} barSize={18}>
            {data.map((k) => (
              <Cell key={k.nama} fill={k.warna} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
