"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  Activity,
  AlarmClock,
  CheckCircle2,
  Download,
  Flame,
  ThumbsUp,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { motion } from "motion/react";
import { STATUS, SLA_HARI, umurHari, type StatusKey } from "@/lib/constants";
import type { LaporanDenganRelasi } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { IkonKategori } from "@/lib/ikon-vektor";
import { Button, Card, Select, StatusChip } from "@/components/ui";
import { waktuRelatif } from "@/lib/utils";

const LeafletMap = dynamic(
  () => import("@/components/map/leaflet-map").then((m) => m.LeafletMap),
  { ssr: false, loading: () => <div className="h-full w-full animate-pulse bg-panel-2" /> }
);

export function DewanClient({
  daftar: awal,
  hitungStatus,
  kategori,
  tren,
  panas,
  totalWarga,
}: {
  daftar: LaporanDenganRelasi[];
  hitungStatus: Partial<Record<StatusKey, number>>;
  kategori: { nama: string; warna: string; jumlah: number }[];
  tren: { tanggal: string; jumlah: number }[];
  panas: [number, number][];
  totalWarga: number;
}) {
  const [daftar, setDaftar] = useState(awal);
  const [heatAktif, setHeatAktif] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"semua" | StatusKey>("semua");
  const [dipilih, setDipilih] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<StatusKey>("diverifikasi");
  const [bulkProses, setBulkProses] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const ch = supabase
      .channel("dewan-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reports" },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            const upd = payload.new as LaporanDenganRelasi;
            setDaftar((s) =>
              s.map((r) =>
                r.id === upd.id
                  ? {
                      ...r,
                      status: upd.status,
                      petugas: upd.petugas ?? null,
                      updated_at: upd.updated_at,
                    }
                  : r
              )
            );
          } else if (payload.eventType === "INSERT") {
            const baru = payload.new as LaporanDenganRelasi;
            setDaftar((s) => [
              {
                ...baru,
                categories: null,
                profiles: null,
                vote_count: 0,
                comment_count: 0,
              },
              ...s.filter((r) => r.id !== baru.id),
            ]);
          }
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, []);

  async function ubahStatus(id: string, status: StatusKey) {
    setDaftar((s) => s.map((r) => (r.id === id ? { ...r, status } : r)));
    const supabase = createClient();
    await supabase.from("reports").update({ status }).eq("id", id);
  }

  async function tugaskan(id: string, petugas: string) {
    const supabase = createClient();
    await supabase
      .from("reports")
      .update({
        petugas: petugas || null,
        assigned_at: petugas ? new Date().toISOString() : null,
      })
      .eq("id", id);
  }

  function togglePilih(id: string) {
    setDipilih((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  async function terapkanBulk() {
    if (dipilih.size === 0) return;
    setBulkProses(true);
    const supabase = createClient();
    await supabase
      .from("reports")
      .update({ status: bulkStatus })
      .in("id", [...dipilih]);
    setDaftar((arr) =>
      arr.map((r) =>
        dipilih.has(r.id) ? { ...r, status: bulkStatus } : r
      )
    );
    setDipilih(new Set());
    setBulkProses(false);
  }

  function eksporCsv() {
    const kepala = [
      "Judul",
      "Kategori",
      "Status",
      "Petugas",
      "Tanggal",
      "Lat",
      "Lng",
      "Dukungan",
      "Komentar",
    ];
    const baris = daftar
      .filter((r) => filterStatus === "semua" || r.status === filterStatus)
      .map((r) =>
        [
          `"${r.judul.replace(/"/g, '""')}"`,
          r.categories?.nama ?? "Lainnya",
          STATUS[r.status].label,
          r.petugas ?? "",
          new Date(r.created_at).toLocaleString("id-ID"),
          r.lat ?? "",
          r.lng ?? "",
          r.vote_count ?? 0,
          r.comment_count ?? 0,
        ].join(";")
      );
    const csv = "\uFEFF" + [kepala.join(";"), ...baris].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `sigap-laporan-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const selesai = hitungStatus.selesai ?? 0;
  const total = daftar.length;
  const aktif = (hitungStatus.baru ?? 0) + (hitungStatus.dikerjakan ?? 0);
  const lewatSla = daftar.filter(
    (r) =>
      umurHari(r.created_at) > SLA_HARI &&
      !["selesai", "ditolak"].includes(r.status)
  ).length;

  const titikPeta = useMemo(
    () =>
      daftar
        .filter((r) => filterStatus === "semua" || r.status === filterStatus)
        .map((r) => ({
          id: r.id,
          lat: r.lat ?? 0,
          lng: r.lng ?? 0,
          warna: r.categories?.warna ?? "#64748b",
          slug: r.categories?.slug ?? "lainnya",
          judul: `${r.judul} · ${STATUS[r.status].label}`,
        })),
    [daftar, filterStatus]
  );

  const kartu = [
    {
      label: "Total laporan",
      nilai: total,
      ikon: <Activity size={20} />,
      warna: "text-sky-600 dark:text-sky-400 bg-sky-500/10",
    },
    {
      label: "Sedang ditangani",
      nilai: aktif,
      ikon: <Flame size={20} />,
      warna: "text-kunyit-600 dark:text-kunyit-400 bg-kunyit-500/10",
    },
    {
      label: "Selesai",
      nilai: selesai,
      ikon: <CheckCircle2 size={20} />,
      warna: "text-daun-700 dark:text-daun-300 bg-daun-500/10",
    },
    {
      label: "Warga terdaftar",
      nilai: totalWarga,
      ikon: <Users size={20} />,
      warna: "text-violet-600 dark:text-violet-400 bg-violet-500/10",
    },
    {
      label: `Melewati SLA ${SLA_HARI} hari`,
      nilai: lewatSla,
      ikon: <AlarmClock size={20} />,
      warna:
        lewatSla > 0
          ? "text-danger bg-danger/10"
          : "text-daun-700 dark:text-daun-300 bg-daun-500/10",
    },
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 pb-12 pt-6">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold">Dashboard Dewan</h1>
        <p className="text-sm text-muted">
          Pantau & kelola penanganan laporan permukiman secara realtime.
        </p>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {kartu.map((k) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="flex items-center gap-3.5 p-4">
              <span className={`flex size-11 items-center justify-center rounded-xl ${k.warna}`}>
                {k.ikon}
              </span>
              <div>
                <p className="angka-tabular font-display text-2xl font-extrabold leading-none">{k.nilai}</p>
                <p className="mt-1 text-xs text-muted">{k.label}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card className="p-5">
          <h2 className="mb-4 font-display font-bold">Tren laporan 14 hari</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={tren} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradDaun" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2e9e57" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#2e9e57" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                <XAxis dataKey="tanggal" tick={{ fontSize: 11 }} stroke="var(--muted)" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="var(--muted)" />
                <Tooltip
                  contentStyle={{
                    background: "var(--panel)",
                    border: "1px solid var(--line)",
                    borderRadius: 12,
                    fontSize: 13,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="jumlah"
                  name="Laporan"
                  stroke="#237f45"
                  strokeWidth={2.5}
                  fill="url(#gradDaun)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 font-display font-bold">Komposisi kategori</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={kategori} layout="vertical" margin={{ left: 10, right: 10 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="nama"
                  width={110}
                  tick={{ fontSize: 11 }}
                  stroke="var(--muted)"
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--panel)",
                    border: "1px solid var(--line)",
                    borderRadius: 12,
                    fontSize: 13,
                  }}
                />
                <Bar dataKey="jumlah" name="Laporan" radius={[0, 8, 8, 0]} barSize={18}>
                  {kategori.map((k) => (
                    <Cell key={k.nama} fill={k.warna} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <Card className="overflow-hidden p-0">
          {dipilih.size > 0 && (
            <div className="flex flex-wrap items-center gap-3 border-b garis-halus bg-daun-500/5 px-5 py-3">
              <span className="angka-tabular text-sm font-bold text-daun-700 dark:text-daun-300">
                {dipilih.size} dipilih
              </span>
              <Select
                aria-label="Status massal"
                className="w-44"
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value as StatusKey)}
              >
                {(Object.keys(STATUS) as StatusKey[]).map((st) => (
                  <option key={st} value={st}>
                    {STATUS[st].label}
                  </option>
                ))}
              </Select>
              <Button size="sm" onClick={terapkanBulk} disabled={bulkProses}>
                {bulkProses ? "Menerapkan…" : "Terapkan ke semua"}
              </Button>
              <Button
                variant="hantu"
                size="sm"
                onClick={() => setDipilih(new Set())}
              >
                Bersihkan pilihan
              </Button>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b garis-halus px-5 py-3.5">
            <h2 className="font-display font-bold">Kelola laporan</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="sekunder"
                size="sm"
                onClick={eksporCsv}
                className="!px-3 !py-1.5 text-xs"
              >
                <Download size={14} /> Ekspor CSV
              </Button>
              <Select
                aria-label="Filter status"
                className="w-40"
                value={filterStatus}
                onChange={(e) =>
                  setFilterStatus(e.target.value as "semua" | StatusKey)
                }
              >
                <option value="semua">Semua status</option>
                {(Object.keys(STATUS) as StatusKey[]).map((s) => (
                  <option key={s} value={s}>
                    {STATUS[s].label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="max-h-[520px] overflow-y-auto divide-y garis-halus">
            {daftar
              .filter((r) => filterStatus === "semua" || r.status === filterStatus)
              .map((r) => {
                const telat =
                  umurHari(r.created_at) > SLA_HARI &&
                  !["selesai", "ditolak"].includes(r.status);
                return (
                <div key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-5 py-3">
                  <input
                    type="checkbox"
                    checked={dipilih.has(r.id)}
                    onChange={() => togglePilih(r.id)}
                    aria-label={`Pilih ${r.judul}`}
                    className="size-4 accent-daun-600"
                  />
                  <div className="min-w-0 flex-1 basis-56">
                    <p className="truncate text-sm font-semibold">{r.judul}</p>
                    <p className="flex items-center gap-1 truncate text-xs text-muted">
                      <IkonKategori slug={r.categories?.slug ?? "lainnya"} ukuran={12} />
                      {r.categories?.nama ?? "Lainnya"} · {waktuRelatif(r.created_at)} ·
                      <ThumbsUp size={11} className="shrink-0" />
                      <span className="angka-tabular">{r.vote_count}</span>
                    </p>
                  </div>
                  {telat && (
                    <span className="rounded-full bg-danger/10 px-2 py-1 text-[11px] font-bold text-danger">
                      <AlarmClock size={11} className="inline align-[-1px]" />{" "}
                      {umurHari(r.created_at)} hr — lewat SLA
                    </span>
                  )}
                  <StatusChip status={r.status} />
                  <input
                    defaultValue={r.petugas ?? ""}
                    placeholder="Petugas…"
                    aria-label={`Petugas untuk ${r.judul}`}
                    onBlur={(e) => {
                      if (e.target.value !== (r.petugas ?? ""))
                        tugaskan(r.id, e.target.value);
                    }}
                    className="w-36 rounded-lg border garis-halus bg-panel px-2.5 py-1.5 text-xs outline-none focus:border-daun-500"
                  />
                  <Select
                    aria-label={`Ubah status ${r.judul}`}
                    className="w-36"
                    value={r.status}
                    onChange={(e) => ubahStatus(r.id, e.target.value as StatusKey)}
                  >
                    {(Object.keys(STATUS) as StatusKey[]).map((s) => (
                      <option key={s} value={s}>
                        {STATUS[s].label}
                      </option>
                    ))}
                  </Select>
                </div>
                );
              })}
            {daftar.length === 0 && (
              <p className="px-5 py-10 text-center text-sm text-muted">
                Belum ada laporan masuk.
              </p>
            )}
          </div>
        </Card>

        <Card className="flex flex-col overflow-hidden p-0">
          <div className="flex items-center justify-between border-b garis-halus px-5 py-3.5">
            <h2 className="font-display font-bold">Peta kepadatan (heatmap)</h2>
            <button
              onClick={() => setHeatAktif((v) => !v)}
              role="switch"
              aria-checked={heatAktif}
              className={`relative h-6 w-11 rounded-full transition ${
                heatAktif ? "bg-daun-600" : "bg-line"
              }`}
            >
              <span
                className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-[background-color,border-color,box-shadow,color] ${
                  heatAktif ? "left-[22px]" : "left-0.5"
                }`}
              />
            </button>
          </div>
          <div className="h-[480px] flex-1">
            <LeafletMap
              titik={titikPeta}
              panas={heatAktif ? panas : undefined}
            />
          </div>
        </Card>
      </div>
    </main>
  );
}
