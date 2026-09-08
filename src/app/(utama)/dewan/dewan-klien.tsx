"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Activity,
  AlarmClock,
  CheckCircle2,
  Download,
  Flame,
  Inbox,
  ThumbsUp,
  TriangleAlert,
  Users,
} from "lucide-react";
const Area = dynamic(
  () => import("recharts").then((m) => m.Area),
  { ssr: false }
);
const AreaChart = dynamic(
  () => import("recharts").then((m) => m.AreaChart),
  { ssr: false }
);
const Bar = dynamic(() => import("recharts").then((m) => m.Bar), {
  ssr: false,
});
const BarChart = dynamic(
  () => import("recharts").then((m) => m.BarChart),
  { ssr: false }
);
const CartesianGrid = dynamic(
  () => import("recharts").then((m) => m.CartesianGrid),
  { ssr: false }
);
const Cell = dynamic(() => import("recharts").then((m) => m.Cell), {
  ssr: false,
});
const ResponsiveContainer = dynamic(
  () => import("recharts").then((m) => m.ResponsiveContainer),
  { ssr: false }
);
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), {
  ssr: false,
});
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), {
  ssr: false,
});
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), {
  ssr: false,
});
import { motion } from "motion/react";
import { STATUS, hitungSla, type StatusKey } from "@/lib/constants";
import type { LaporanDenganRelasi } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { IkonKategori } from "@/lib/ikon-vektor";
import { Button, Select, Skeleton, StatusChip } from "@/components/ui";
import { KacaKartu } from "@/components/eksperimen/kaca";
import { PitaGradient } from "@/components/eksperimen/pita-gradient";
import { waktuRelatif } from "@/lib/utils";

const LeafletMap = dynamic(
  () => import("@/components/map/leaflet-map").then((m) => m.LeafletMap),
  { ssr: false, loading: () => <div className="h-full w-full animate-pulse bg-ap-parchment dark:bg-ap-tile2" /> }
);

/* Grammar Apple (FUSI): kartu utilitas putih hairline radius 18;
   sorotan memakai KacaKartu; fokus Action Blue; target sentuh 44px.
   StatusChip + warna semantik (termasuk danger SLA) TIDAK diubah.
   R-31: putih frosted/putih hairline light, tile netral ap-tile1/2 + teks
   putih dark; aksen tunggal Action Blue. */
const KARTU_UTILITAS =
  "rounded-[18px] border border-ap-hairline bg-white shadow-none dark:border-white/15 dark:bg-ap-tile1 dark:text-white";
const FOKUS_APPLE =
  "focus-visible:outline-ap-blue-focus! focus-visible:outline-offset-2";
const TOMBOL_UTAMA_APPLE =
  "min-h-[44px] bg-ap-blue text-white shadow-none hover:bg-ap-blue-focus focus-visible:outline-ap-blue-focus!";
const TOMBOL_SEKUNDER_APPLE =
  "min-h-[44px] hover:border-ap-blue hover:text-ap-blue focus-visible:outline-ap-blue-focus! dark:hover:text-ap-sky";
const SELECT_APPLE =
  "min-h-[44px] focus:border-ap-blue focus:ring-ap-blue/15 focus-visible:outline-ap-blue-focus!";
/* Tooltip grafik mengikuti acuan transparansi/grafik.tsx: token var, radius 16. */
const GAYA_TOOLTIP_APPLE = {
  background: "var(--panel)",
  border: "1px solid var(--line)",
  borderRadius: 16,
  padding: "10px 14px",
  fontSize: 12,
} as const;

/* State dewan: ikon arsip relevan dengan antrean laporan, segitiga relevan
   dengan gangguan. Skeleton tanpa shimmer mengikuti MOTION 1. */
export function MuatDewan() {
  return (
    <div aria-busy="true" className="mx-auto max-w-7xl px-4 py-8">
      <p role="status" className="sr-only">
        Memuat dashboard dewan
      </p>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-[18px] border border-ap-hairline bg-white p-4 shadow-none dark:border-white/15 dark:bg-ap-tile1"
          >
            <Skeleton className="h-8 w-16" />
            <Skeleton className="mt-2 h-3.5 w-24" />
          </div>
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-[18px]" />
    </div>
  );
}

export function GalatDewan() {
  const router = useRouter();
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-center">
      <div className={`${KARTU_UTILITAS} p-8`}>
        <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-[18px] bg-danger/10 text-danger">
          <TriangleAlert size={26} strokeWidth={1.8} />
        </span>
        <h1 className="font-display text-2xl font-bold">
          Dashboard Dewan belum bisa dimuat
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
          Antrean laporan kamu tetap aman. Data gagal dimuat karena koneksi
          terputus.
        </p>
        <ol className="mx-auto mt-4 max-w-md space-y-1 text-left text-sm text-muted">
          <li>1. Periksa koneksi internet kamu.</li>
          <li>2. Pilih Coba lagi di bawah.</li>
          <li>3. Kalau masih gagal, kembali lagi beberapa menit lagi.</li>
        </ol>
        <Button
          className={`mt-6 ${TOMBOL_UTAMA_APPLE}`}
          onClick={() => router.refresh()}
        >
          Coba lagi
        </Button>
      </div>
    </main>
  );
}

export function DewanClient({
  daftar: awal,
  kategori,
  tren,
  totalWarga,
}: {
  daftar: LaporanDenganRelasi[];
  kategori: { nama: string; warna: string; jumlah: number }[];
  tren: { tanggal: string; jumlah: number }[];
  totalWarga: number;
}) {
  const [daftar, setDaftar] = useState(awal);
  const [heatAktif, setHeatAktif] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"semua" | StatusKey>("semua");
  const [dipilih, setDipilih] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<StatusKey>("diverifikasi");
  const [bulkProses, setBulkProses] = useState(false);
  const [statusTugas, setStatusTugas] = useState<
    Record<string, "menyimpan" | "tersimpan" | "gagal">
  >({});

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
    setStatusTugas((s) => ({ ...s, [id]: "menyimpan" }));
    const supabase = createClient();
    const { error } = await supabase
      .from("reports")
      .update({
        petugas: petugas || null,
        assigned_at: petugas ? new Date().toISOString() : null,
      })
      .eq("id", id);
    if (error) {
      setStatusTugas((s) => ({ ...s, [id]: "gagal" }));
      return;
    }
    setDaftar((s) =>
      s.map((r) => (r.id === id ? { ...r, petugas: petugas || null } : r))
    );
    setStatusTugas((s) => ({ ...s, [id]: "tersimpan" }));
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
    if (dipilih.size === 0 || bulkProses) return;
    const ids = [...dipilih];
    if (
      !window.confirm(
        `Ubah status ${ids.length} laporan menjadi "${STATUS[bulkStatus].label}"?`
      )
    )
      return;
    setBulkProses(true);
    const supabase = createClient();
    try {
      const setId = new Set(ids);
      for (let i = 0; i < ids.length; i += 50) {
        const chunk = ids.slice(i, i + 50);
        const { error } = await supabase
          .from("reports")
          .update({ status: bulkStatus })
          .in("id", chunk);
        if (error) throw error;
        try {
          await supabase.from("report_events").insert(
            chunk.map((id) => ({ report_id: id, status: bulkStatus }))
          );
        } catch {
          /* trigger DB sudah mencatat perubahan status; abaikan */
        }
      }
      setDaftar((arr) =>
        arr.map((r) => (setId.has(r.id) ? { ...r, status: bulkStatus } : r ))
      );
      setDipilih(new Set());
    } catch {
      /* biarkan daftar apa adanya; pengguna bisa coba lagi */
    } finally {
      setBulkProses(false);
    }
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

  const hitungLive = useMemo(() => {
    const h: Partial<Record<StatusKey, number>> = {};
    for (const r of daftar) h[r.status as StatusKey] = (h[r.status as StatusKey] ?? 0) + 1;
    return h;
  }, [daftar]);

  const selesai = hitungLive.selesai ?? 0;
  const total = daftar.length;
  const aktif =
    (hitungLive.baru ?? 0) +
    (hitungLive.diverifikasi ?? 0) +
    (hitungLive.dikerjakan ?? 0) +
    (hitungLive.menunggu_verifikasi ?? 0);
  const lewatSla = daftar.filter(
    (r) =>
      hitungSla(r.categories?.slug, r.created_at).lewatSla &&
      !["selesai", "ditolak"].includes(r.status)
  ).length;

  const titikPeta = useMemo(
    () =>
      daftar
        .filter((r) => filterStatus === "semua" || r.status === filterStatus)
        .filter((r) => r.lat != null && r.lng != null)
        .map((r) => ({
          id: r.id,
          lat: r.lat as number,
          lng: r.lng as number,
          warna: r.categories?.warna ?? "#64748b",
          slug: r.categories?.slug ?? "lainnya",
          judul: `${r.judul} · ${STATUS[r.status as StatusKey].label}`,
        })),
    [daftar, filterStatus]
  );

  const panasLive = useMemo(
    () =>
      daftar
        .filter((r) => filterStatus === "semua" || r.status === filterStatus)
        .filter((r) => r.lat != null && r.lng != null)
        .map((r) => [r.lat as number, r.lng as number] as [number, number]),
    [daftar, filterStatus]
  );

  const kartu = [
    {
      label: "Total laporan",
      nilai: total,
      ikon: <Activity size={20} />,
      warna: "text-ap-blue bg-ap-blue/10 dark:text-ap-sky dark:bg-ap-sky/10",
    },
    {
      label: "Sedang diproses",
      nilai: aktif,
      ikon: <Flame size={20} />,
      warna: "text-ap-blue bg-ap-blue/10 dark:text-ap-sky dark:bg-ap-sky/10",
    },
    {
      label: "Selesai",
      nilai: selesai,
      ikon: <CheckCircle2 size={20} />,
      warna: "text-ap-blue bg-ap-blue/10 dark:text-ap-sky dark:bg-ap-sky/10",
    },
    {
      label: "Warga terdaftar",
      nilai: totalWarga,
      ikon: <Users size={20} />,
      warna: "text-ap-blue bg-ap-blue/10 dark:text-ap-sky dark:bg-ap-sky/10",
    },
    {
      label: "Melewati Target SLA",
      nilai: lewatSla,
      ikon: <AlarmClock size={20} />,
      warna:
        lewatSla > 0
          ? "text-danger bg-danger/10"
          : "text-daun-700 dark:text-daun-300 bg-daun-500/10",
    },
  ];

  return (
    <main>
      <PitaGradient tone="gelap">
        <header>
          <p className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
            Panel dewan
          </p>
          <h1 className="mt-3 font-serif text-[40px] font-semibold leading-[1.1] tracking-[-0.28px] text-white">
            Dashboard Dewan
          </h1>
          <p className="mt-3 max-w-xl text-[17px] leading-[1.47] tracking-[-0.374px] text-white/85 teks-pretty">
            Pantau & kelola penanganan laporan permukiman secara realtime.
          </p>
        </header>
      </PitaGradient>

      {/* Konten putih dominan light, hitam netral dark (R-31: ritme tile Apple) */}
      <section className="bg-white text-ap-ink dark:bg-black dark:text-white">
        <div className="mx-auto max-w-7xl px-4 py-8 pb-12">
          <div className="flex flex-col">
          <div className="order-1 grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
            <div className={`${KARTU_UTILITAS} overflow-hidden p-0`}>
              {dipilih.size > 0 && (
                <div className="flex flex-wrap items-center gap-3 border-b border-ap-hairline bg-ap-parchment/80 px-5 py-3 backdrop-blur dark:border-white/15 dark:bg-ap-tile2">
                  <span className="angka-tabular text-sm font-bold text-ap-blue dark:text-ap-sky">
                    {dipilih.size} dipilih
                  </span>
                  <Select
                    aria-label="Status massal"
                    className={`w-44 ${SELECT_APPLE}`}
                    value={bulkStatus}
                    onChange={(e) => setBulkStatus(e.target.value as StatusKey)}
                  >
                    {(Object.keys(STATUS) as StatusKey[]).map((st) => (
                      <option key={st} value={st}>
                        {STATUS[st].label}
                      </option>
                    ))}
                  </Select>
                  <Button size="sm" className={TOMBOL_UTAMA_APPLE} onClick={terapkanBulk} disabled={bulkProses}>
                    {bulkProses
                      ? "Menerapkan…"
                      : `Terapkan ke ${dipilih.size} laporan`}
                  </Button>
                  <Button
                    variant="hantu"
                    size="sm"
                    className={TOMBOL_SEKUNDER_APPLE}
                    onClick={() => setDipilih(new Set())}
                  >
                    Bersihkan pilihan
                  </Button>
                </div>
              )}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ap-hairline px-5 py-3.5 dark:border-white/15">
                <h2 className="font-display font-bold">Kelola laporan</h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant="sekunder"
                    size="sm"
                    onClick={eksporCsv}
                    className={`!px-3 !py-1.5 text-xs ${TOMBOL_SEKUNDER_APPLE}`}
                  >
                    <Download size={14} /> Ekspor CSV
                  </Button>
                  <Select
                    aria-label="Filter status"
                    className={`w-40 ${SELECT_APPLE}`}
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
              <div className="max-h-[520px] divide-y divide-ap-hairline overflow-y-auto dark:divide-white/15">
                {daftar
                  .filter((r) => filterStatus === "semua" || r.status === filterStatus)
                  .map((r) => {
                    const sla = hitungSla(r.categories?.slug, r.created_at);
                    const telat =
                      sla.lewatSla && !["selesai", "ditolak"].includes(r.status);
                    return (
                    <div key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-5 py-3">
                      <label className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center">
                        <input
                          type="checkbox"
                          checked={dipilih.has(r.id)}
                          onChange={() => togglePilih(r.id)}
                          aria-label={`Pilih ${r.judul}`}
                          className={`size-4 accent-ap-blue ${FOKUS_APPLE}`}
                        />
                      </label>
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
                          +{sla.hariTerlambat} hr lewat SLA ({sla.targetHari} hr)
                        </span>
                      )}
                      <StatusChip status={r.status} />
                      <div className="flex min-w-36 flex-col items-start gap-1">
                        <input
                          defaultValue={r.petugas ?? ""}
                          placeholder="Petugas…"
                          aria-label={`Petugas untuk ${r.judul}`}
                          onBlur={(e) => {
                            if (e.target.value !== (r.petugas ?? ""))
                              tugaskan(r.id, e.target.value);
                          }}
                          className={`min-h-[44px] w-full rounded-lg border border-ap-hairline bg-white px-2.5 py-1.5 text-xs outline-none transition focus:border-ap-blue dark:border-white/15 dark:bg-ap-tile2 ${FOKUS_APPLE}`}
                        />
                        <span
                          role="status"
                          aria-live="polite"
                          className={`min-h-4 text-[11px] ${
                            statusTugas[r.id] === "gagal"
                              ? "text-danger"
                              : "text-muted"
                          }`}
                        >
                          {statusTugas[r.id] === "menyimpan"
                            ? "Menyimpan…"
                            : statusTugas[r.id] === "tersimpan"
                              ? "Tersimpan"
                              : statusTugas[r.id] === "gagal"
                                ? "Gagal menyimpan"
                                : ""}
                        </span>
                      </div>
                      <Select
                        aria-label={`Ubah status ${r.judul}`}
                        className={`w-36 ${SELECT_APPLE}`}
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
                {daftar.length === 0 ? (
                  <div className="px-5 py-10 text-center">
                    <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-[18px] bg-ap-blue/10 text-ap-blue dark:text-ap-sky">
                      <Inbox size={26} strokeWidth={1.8} />
                    </span>
                    <h3 className="font-display text-lg font-bold">
                      Belum ada laporan masuk
                    </h3>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
                      Antrean kamu kosong. Laporan baru dari warga akan muncul di
                      sini lengkap dengan status dan lokasinya.
                    </p>
                  </div>
                ) : (
                  daftar.filter(
                    (r) => filterStatus === "semua" || r.status === filterStatus
                  ).length === 0 && (
                    <div className="px-5 py-10 text-center">
                      <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-[18px] bg-ap-blue/10 text-ap-blue dark:text-ap-sky">
                        <Inbox size={26} strokeWidth={1.8} />
                      </span>
                      <h3 className="font-display text-lg font-bold">
                        Tidak ada laporan pada filter ini
                      </h3>
                      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
                        Kamu bisa ubah filter ke Semua status untuk melihat seluruh
                        antrean.
                      </p>
                      <Button
                        variant="sekunder"
                        size="sm"
                        className={`mt-5 ${TOMBOL_SEKUNDER_APPLE}`}
                        onClick={() => setFilterStatus("semua")}
                      >
                        Tampilkan semua status
                      </Button>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className={`${KARTU_UTILITAS} flex flex-col overflow-hidden p-0`}>
              <div className="flex items-center justify-between border-b border-ap-hairline px-5 py-3.5 dark:border-white/15">
                <h2 className="font-display font-bold">Peta kepadatan (heatmap)</h2>
                <button
                  onClick={() => setHeatAktif((v) => !v)}
                  role="switch"
                  aria-checked={heatAktif}
                  aria-label="Tampilkan heatmap kepadatan laporan"
                  className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full ${FOKUS_APPLE}`}
                >
                  <span
                    className={`relative h-6 w-11 rounded-full transition ${
                      heatAktif ? "bg-ap-blue" : "bg-ap-hairline dark:bg-white/20"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 size-5 rounded-full bg-white shadow-none transition-[background-color,border-color,box-shadow,color] ${
                        heatAktif ? "left-[22px]" : "left-0.5"
                      }`}
                    />
                  </span>
                </button>
              </div>
              <div className="h-[480px] flex-1">
                <LeafletMap
                  titik={titikPeta}
                  panas={heatAktif ? panasLive : undefined}
                />
              </div>
            </div>
          </div>
          <div className="order-2 mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
            {kartu.map((k) => (
              <motion.div
                key={k.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className={`${KARTU_UTILITAS} flex items-center gap-3.5 p-4`}>
                  <span className={`flex size-11 items-center justify-center rounded-xl ${k.warna}`}>
                    {k.ikon}
                  </span>
                  <div>
                    <p className="angka-tabular text-2xl font-extrabold leading-none tabular-nums">{k.nilai}</p>
                    <p className="mt-1 text-xs text-muted">{k.label}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

      <div className="order-3 mb-6 grid gap-4 lg:grid-cols-[2fr_1fr]">
        <KacaKartu className="p-5">
          <h2 className="mb-4 font-display font-bold">Tren laporan 14 hari</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={tren} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradDaun" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-daun-500)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="var(--color-daun-500)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                <XAxis dataKey="tanggal" tick={{ fontSize: 11 }} stroke="var(--muted)" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="var(--muted)" />
                <Tooltip contentStyle={GAYA_TOOLTIP_APPLE} />
                <Area
                  type="monotone"
                  dataKey="jumlah"
                  name="Laporan"
                  stroke="var(--color-daun-600)"
                  strokeWidth={2.5}
                  fill="url(#gradDaun)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </KacaKartu>

        <div className={`${KARTU_UTILITAS} p-5`}>
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
                <Tooltip contentStyle={GAYA_TOOLTIP_APPLE} />
                <Bar dataKey="jumlah" name="Laporan" radius={[0, 8, 8, 0]} barSize={18}>
                  {kategori.map((k) => (
                    <Cell key={k.nama} fill={k.warna} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

        </div>
        </div>
      </section>
    </main>
  );
}
