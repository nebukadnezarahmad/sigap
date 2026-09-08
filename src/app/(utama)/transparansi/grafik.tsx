"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui";

const gayaTooltip = {
  background: "var(--panel)",
  border: "1px solid var(--line)",
  borderRadius: 12,
  boxShadow: "none",
  padding: "10px 14px",
  fontSize: 12,
} as const;

type DataBulanan = { label: string; masuk: number; tuntas: number };
type DataKategori = { nama: string; warna: string; persen: number };

function KerangkaGrafik() {
  return <Skeleton className="h-60 w-full" />;
}

const IsiGrafikBulanan = dynamic<{ data: DataBulanan[] }>(
  () =>
    import("recharts").then((m) => {
      const {
        Bar,
        BarChart,
        CartesianGrid,
        ResponsiveContainer,
        Tooltip,
        XAxis,
        YAxis,
      } = m;
      return function IsiBulanan({ data }: { data: DataBulanan[] }) {
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--line)"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                stroke="var(--muted)"
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11 }}
                stroke="var(--muted)"
              />
              <Tooltip contentStyle={gayaTooltip} />
              <Bar
                dataKey="masuk"
                name="Masuk"
                fill="var(--chart-masuk, var(--muted))"
                radius={[8, 8, 0, 0]}
              />
              <Bar
                dataKey="tuntas"
                name="Selesai"
                fill="var(--chart-selesai, var(--color-daun-500))"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );
      };
    }),
  {
    ssr: false,
    loading: () => <KerangkaGrafik />,
  }
);

const IsiGrafikKategori = dynamic<{ data: DataKategori[] }>(
  () =>
    import("recharts").then((m) => {
      const {
        Bar,
        BarChart,
        Cell,
        ResponsiveContainer,
        Tooltip,
        XAxis,
        YAxis,
      } = m;
      return function IsiKategori({ data }: { data: DataKategori[] }) {
        return (
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
              <Bar
                dataKey="persen"
                name="Selesai (%)"
                radius={[0, 8, 8, 0]}
                barSize={18}
              >
                {data.map((k) => (
                  <Cell key={k.nama} fill={k.warna} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      };
    }),
  {
    ssr: false,
    loading: () => <KerangkaGrafik />,
  }
);

export function GrafikBulanan({ data }: { data: DataBulanan[] }) {
  return (
    <div className="angka-tabular tabular-nums [--chart-masuk:var(--muted)] [--chart-selesai:var(--color-daun-500)] dark:[--chart-selesai:var(--color-daun-400)]">
      <div className="h-60" aria-hidden="true">
        <IsiGrafikBulanan data={data} />
      </div>
      <div className="mt-4 overflow-x-auto border-t border-ap-hairline pt-3 dark:border-white/15">
        <table className="w-full min-w-[18rem] text-left text-xs">
          <caption className="sr-only">Data laporan masuk dan selesai per bulan</caption>
          <thead className="text-muted">
            <tr>
              <th scope="col" className="pb-2 pr-4 font-semibold">Bulan</th>
              <th scope="col" className="pb-2 pr-4 font-semibold">Masuk</th>
              <th scope="col" className="pb-2 font-semibold">Selesai</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ap-hairline dark:divide-white/10">
            {data.map((baris) => (
              <tr key={baris.label}>
                <th scope="row" className="py-2 pr-4 font-semibold">{baris.label}</th>
                <td className="py-2 pr-4">{baris.masuk}</td>
                <td className="py-2">{baris.tuntas}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function GrafikKategori({ data }: { data: DataKategori[] }) {
  return (
    <div className="angka-tabular tabular-nums">
      <div className="h-60" aria-hidden="true">
        <IsiGrafikKategori data={data} />
      </div>
      <div className="mt-4 overflow-x-auto border-t border-ap-hairline pt-3 dark:border-white/15">
        <table className="w-full min-w-[18rem] text-left text-xs">
          <caption className="sr-only">Persentase laporan selesai per kategori</caption>
          <thead className="text-muted">
            <tr>
              <th scope="col" className="pb-2 pr-4 font-semibold">Kategori</th>
              <th scope="col" className="pb-2 font-semibold">Selesai</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ap-hairline dark:divide-white/10">
            {data.map((baris) => (
              <tr key={baris.nama}>
                <th scope="row" className="py-2 pr-4 font-semibold">{baris.nama}</th>
                <td className="py-2">{baris.persen}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
