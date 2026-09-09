"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui";

const gayaTooltip = {
  background: "var(--panel)",
  border: "1px solid var(--line)",
  borderRadius: 16,
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
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="tuntas"
                name="Selesai"
                fill="var(--chart-selesai, var(--color-daun-500))"
                radius={[6, 6, 0, 0]}
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
  const totalMasuk = data.reduce((a, b) => a + b.masuk, 0);
  const totalTuntas = data.reduce((a, b) => a + b.tuntas, 0);
  return (
    <div className="h-60 [--chart-masuk:var(--muted)] [--chart-selesai:var(--color-daun-500)] dark:[--chart-selesai:var(--color-daun-400)]">
      <p className="sr-only">
        {data.length === 0
          ? "Belum ada data bulanan."
          : `Enam bulan terakhir: ${totalMasuk} laporan masuk, ${totalTuntas} tuntas. Rincian per bulan: ${data.map((d) => `${d.label}: ${d.masuk} masuk, ${d.tuntas} tuntas`).join("; ")}.`}
      </p>
      <div className="h-full" role="img" aria-label="Grafik laporan masuk versus tuntas enam bulan terakhir">
        <IsiGrafikBulanan data={data} />
      </div>
    </div>
  );
}

export function GrafikKategori({ data }: { data: DataKategori[] }) {
  return (
    <div className="h-60">
      <p className="sr-only">
        {data.length === 0
          ? "Belum ada data ketuntasan kategori."
          : `Ketuntasan per kategori: ${data.map((d) => `${d.nama} ${d.persen} persen`).join("; ")}.`}
      </p>
      <div className="h-full" role="img" aria-label="Grafik ketuntasan per kategori">
        <IsiGrafikKategori data={data} />
      </div>
    </div>
  );
}
