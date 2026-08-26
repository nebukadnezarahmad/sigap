"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import {
  Activity,
  AlarmClock,
  CheckCircle2,
  Download,
  Flame,
  Inbox,
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
import {
  Button,
  Card,
  Input,
  KartuKpi,
  KosongState,
  Select,
  StatusChip,
} from "@/components/ui";
import { waktuRelatif } from "@/lib/utils";

const LeafletMap = dynamic(
  () => import("@/components/map/leaflet-map").then((m) => m.LeafletMap),
  { ssr: false, loading: () => <div className="h-full w-full animate-pulse bg-panel-2" /> }
);

/** Di atas ambang ini tingkat penyelesaian layak diberi nada "baik". */
const AMBANG_SELESAI_BAIK = 70;

/**
 * Kontrol di dalam baris tabel dikecilkan lewat className — tailwind-merge
 * yang menimpa ukuran bawaan, jadi tidak perlu !important.
 */
const GAYA_KONTROL_BARIS = "py-1.5 pl-2.5 pr-8 text-xs";

type KartuKpiDef = {
  label: string;
  nilai: number;
  ikon: ReactNode;
  nada: "netral" | "baik" | "waspada" | "bahaya";
  catatan?: string;
  lebar?: string;
};

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
    const csv = "﻿" + [kepala.join(";"), ...baris].join("\n");
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
  const persenSelesai = total > 0 ? Math.round((selesai / total) * 100) : 0;

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

  const terfilter = daftar.filter(
    (r) => filterStatus === "semua" || r.status === filterStatus
  );

  /**
   * KPI dewan bersifat operasional: SLA memimpin baris dan mengambil dua kolom.
   * Warna hanya muncul kalau angkanya berubah makna — sisanya netral supaya
   * palet status (sky/kunyit/violet) tetap milik StatusChip.
   */
  const kartu: KartuKpiDef[] = [
    {
      label: `Melewati SLA ${SLA_HARI} hari`,
      nilai: lewatSla,
      ikon: <AlarmClock size={20} />,
      nada: lewatSla > 0 ? "bahaya" : "baik",
      catatan:
        lewatSla > 0 ? "Perlu tindakan hari ini" : "Semua dalam tenggat",
      lebar: "col-span-2",
    },
    {
      label: "Sedang ditangani",
      nilai: aktif,
      ikon: <Flame size={20} />,
      nada: "netral",
      catatan: "Baru + dikerjakan",
    },
    {
      label: "Selesai",
      nilai: selesai,
      ikon: <CheckCircle2 size={20} />,
      nada: persenSelesai >= AMBANG_SELESAI_BAIK ? "baik" : "netral",
      catatan: `${persenSelesai}% dari total`,
    },
    {
      label: "Total laporan",
      nilai: total,
      ikon: <Activity size={20} />,
      nada: "netral",
    },
    {
      label: "Warga terdaftar",
      nilai: totalWarga,
      ikon: <Users size={20} />,
      nada: "netral",
    },
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 pb-12 pt-6">
      <header className="mb-6">
        <h1 className="font-bold tampil-tenang">Dashboard Dewan</h1>
        <p className="mt-2 text-sm text-muted">
          Pantau &amp; kelola penanganan laporan permukiman secara realtime.
        </p>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-6">
        {kartu.map((k) => (
          <motion.div
            key={k.label}
            className={k.lebar}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <KartuKpi
              label={k.label}
              nilai={k.nilai}
              ikon={k.ikon}
              nada={k.nada}
              catatan={k.catatan}
            />
          </motion.div>
        ))}
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card className="p-5">
          <h2 className="mb-4 font-bold">Tren laporan 14 hari</h2>
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
          <h2 className="mb-4 font-bold">Komposisi kategori</h2>
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
            <h2 className="font-bold">Kelola laporan</h2>
            <div className="flex items-center gap-2">
              <Button variant="sekunder" size="xs" onClick={eksporCsv}>
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
          <div className="max-h-[520px] divide-y garis-halus overflow-y-auto">
            {terfilter.map((r) => {
              const telat =
                umurHari(r.created_at) > SLA_HARI &&
                !["selesai", "ditolak"].includes(r.status);
              const terpilih = dipilih.has(r.id);
              return (
                <div
                  key={r.id}
                  data-terpilih={terpilih || undefined}
                  className="flex flex-wrap items-center gap-x-3 gap-y-2 px-5 py-3 transition-colors duration-200 ease-sigap hover:bg-panel-2 data-[terpilih]:bg-daun-500/8 data-[terpilih]:shadow-[inset_3px_0_0_var(--color-daun-600)]"
                >
                  <input
                    type="checkbox"
                    checked={terpilih}
                    onChange={() => togglePilih(r.id)}
                    aria-label={`Pilih ${r.judul}`}
                    className="size-4 accent-daun-600"
                  />
                  <div className="min-w-0 flex-1 basis-60">
                    <p className="truncate text-sm font-semibold text-ink">
                      {r.judul}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 truncate text-mikro text-muted">
                      <IkonKategori slug={r.categories?.slug ?? "lainnya"} ukuran={12} />
                      {r.categories?.nama ?? "Lainnya"} · {waktuRelatif(r.created_at)} ·
                      <ThumbsUp size={11} className="shrink-0" />
                      <span className="angka-tabular">{r.vote_count}</span>
                    </p>
                  </div>
                  {telat && (
                    <span className="angka-tabular rounded-kontrol bg-danger/10 px-2 py-1 text-mikro font-bold text-danger-kuat dark:text-red-300">
                      <AlarmClock size={11} className="inline align-[-1px]" />{" "}
                      {umurHari(r.created_at)} hr — lewat SLA
                    </span>
                  )}
                  <StatusChip status={r.status} />
                  <Input
                    defaultValue={r.petugas ?? ""}
                    placeholder="Petugas…"
                    aria-label={`Petugas untuk ${r.judul}`}
                    onBlur={(e) => {
                      if (e.target.value !== (r.petugas ?? ""))
                        tugaskan(r.id, e.target.value);
                    }}
                    className={`w-36 ${GAYA_KONTROL_BARIS}`}
                  />
                  <Select
                    aria-label={`Ubah status ${r.judul}`}
                    className={`w-36 ${GAYA_KONTROL_BARIS}`}
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
            {terfilter.length === 0 && (
              <KosongState
                ikon={<Inbox size={24} />}
                judul={
                  daftar.length === 0
                    ? "Belum ada laporan masuk"
                    : `Tidak ada laporan berstatus ${STATUS[filterStatus as StatusKey].label}`
                }
                isi={
                  daftar.length === 0
                    ? "Laporan warga yang baru masuk akan muncul di sini secara realtime — tidak perlu memuat ulang halaman."
                    : "Coba longgarkan filter untuk melihat laporan lain."
                }
                aksi={
                  filterStatus !== "semua" ? (
                    <Button
                      variant="sekunder"
                      size="sm"
                      onClick={() => setFilterStatus("semua")}
                    >
                      Tampilkan semua status
                    </Button>
                  ) : undefined
                }
              />
            )}
          </div>
        </Card>

        <Card className="flex flex-col overflow-hidden p-0">
          <div className="flex items-center justify-between border-b garis-halus px-5 py-3.5">
            <h2 className="font-bold">Peta kepadatan (heatmap)</h2>
            <button
              onClick={() => setHeatAktif((v) => !v)}
              role="switch"
              aria-checked={heatAktif}
              aria-label="Tampilkan peta kepadatan"
              className={`relative h-6 w-11 rounded-kontrol transition-colors duration-300 ease-sigap ${
                heatAktif ? "bg-daun-600" : "bg-line"
              }`}
            >
              <span
                className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-[left] duration-300 ease-sigap ${
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
