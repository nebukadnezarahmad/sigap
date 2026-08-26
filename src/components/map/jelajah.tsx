"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
// Satu blok impor lucide, bukan tiga yang tersebar di berkas yang sama.
import {
  Check,
  ChevronDown,
  Clock,
  Crosshair,
  History,
  MapPin,
  MapPinOff,
  MessageSquare,
  Play,
  Plus,
  Recycle,
  RotateCcw,
  Search,
  SlidersHorizontal,
  ThumbsUp,
  WifiOff,
  X,
} from "lucide-react";
import type { LaporanDenganRelasi } from "@/types/database";
import type { FasilitasRingkas } from "@/app/(utama)/peta/page";
import { IkonFasilitas } from "@/lib/ikon-vektor";
import {
  KATEGORI,
  STATUS,
  fasilitasByJenis,
  kategoriBySlug,
  type StatusKey,
} from "@/lib/constants";
import { IkonKategori } from "@/lib/ikon-vektor";
import { waktuRelatif } from "@/lib/utils";
import { StatusChip, Button, Card, KosongState } from "@/components/ui";
import { Modal } from "@/components/modal";
import { createClient } from "@/lib/supabase/client";
import { BuatLaporanFormulir } from "./buat-laporan";
import { FormFasilitas } from "./form-fasilitas";
import { TombolIkutiArea } from "./tombol-ikuti-area";
import { TurPeta } from "./tur-peta";

const LeafletMap = dynamic(
  () => import("./leaflet-map").then((m) => m.LeafletMap),
  {
    ssr: false,
    // Skeleton berbentuk peta, bukan blok abu: yang datang adalah peta, jadi
    // bentuk yang ditunggu sudah terbaca sebelum tile-nya sampai.
    loading: () => (
      <div
        role="status"
        aria-live="polite"
        className="relative h-full w-full overflow-hidden bg-panel-2"
      >
        <span className="sr-only">Memuat peta…</span>
        <div
          aria-hidden
          className="absolute inset-0 animate-pulse"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, var(--line) 0 1px, transparent 1px 64px), repeating-linear-gradient(90deg, var(--line) 0 1px, transparent 1px 64px)",
            opacity: 0.6,
          }}
        />
        <div
          aria-hidden
          className="absolute left-[-10%] top-[46%] h-8 w-[130%] rotate-[-12deg] bg-line/70"
        />
        {[
          ["22%", "30%"],
          ["58%", "24%"],
          ["71%", "58%"],
          ["36%", "68%"],
          ["48%", "46%"],
        ].map(([x, y]) => (
          <span
            key={x + y}
            aria-hidden
            className="absolute size-6 animate-pulse rounded-full bg-line"
            style={{ left: x, top: y }}
          />
        ))}
      </div>
    ),
  }
);

const BULAN = (() => {
  const out: { label: string; akhir: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    d.setMonth(d.getMonth() + 1);
    d.setHours(0, 0, 0, 0);
    out.push({
      label: d.toLocaleDateString("id-ID", { month: "short" }),
      akhir: new Date(d.getTime() - 1).toISOString(),
    });
  }
  return out;
})();

function jarakMeter(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Satu bahasa untuk kontrol peta, bukan tiga.
 *
 * Sebelumnya ada tiga perlakuan "aktif" berbeda untuk satu kelas kontrol —
 * outline hijau untuk filter, isian hijau untuk "sekitar saya", isian teal
 * untuk "fasilitas" — dan lima blok `style` inline yang identik karena kelas
 * `border-line` tidak dipakai.
 *
 * Aturan sekarang: FILTER menyaring apa yang tampil (outline + hitungan),
 * MODE mengubah arti peta (isian solid).
 */
const KONTROL_DASAR =
  "flex h-10 items-center gap-2 rounded-kontrol border px-4 text-sm font-semibold transition-[background-color,border-color,color] duration-300 ease-sigap";

function kelasFilter(aktif: boolean) {
  return `${KONTROL_DASAR} ${
    aktif
      ? "border-daun-500/50 bg-daun-500/5 text-daun-700 dark:text-daun-300"
      : "border-line text-muted hover:text-ink"
  }`;
}

function kelasMode(aktif: boolean) {
  return `${KONTROL_DASAR} ${
    aktif
      ? "border-transparent bg-daun-600 text-white"
      : "border-line text-muted hover:text-ink"
  }`;
}

export function Jelajah({
  laporanAwal,
  dbAktif,
  fasilitasAwal,
}: {
  laporanAwal: LaporanDenganRelasi[];
  dbAktif: boolean;
  fasilitasAwal: FasilitasRingkas[];
}) {
  const params = useSearchParams();
  const [laporan, setLaporan] = useState(laporanAwal);
  const [terpilihId, setTerpilihId] = useState<string | null>(null);
  const [kueri, setKueri] = useState("");
  const [fKategori, setFKategori] = useState<string[]>([]);
  const [fStatus, setFStatus] = useState<StatusKey[]>([]);
  const [modalBuka, setModalBuka] = useState(
    () => params.get("lapor") === "1"
  );
  /* Tiga keadaan, bukan boolean. Sebelumnya CHANNEL_ERROR/TIMED_OUT membuat UI
     menampilkan "Menyambungkan…" selamanya — janji yang tak pernah gagal. */
  const [realtime, setRealtime] = useState<
    "menyambung" | "aktif" | "terputus"
  >("menyambung");
  const [periodeIdx, setPeriodeIdx] = useState<number | null>(null);
  const [mainkan, setMainkan] = useState(false);
  const [pusatSaya, setPusatSaya] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [cariLokasi, setCariLokasi] = useState(false);
  const [pop, setPop] = useState<"kategori" | "status" | null>(null);
  const [layerFasilitas, setLayerFasilitas] = useState(false);
  const [fasTerpilih, setFasTerpilih] = useState<FasilitasRingkas | null>(null);
  const [modalFasilitas, setModalFasilitas] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setPop(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!mainkan || periodeIdx === null) return;
    const t = setInterval(() => {
      setPeriodeIdx((i) => {
        if (i === null || i >= BULAN.length - 1) {
          setMainkan(false);
          return i;
        }
        return i + 1;
      });
    }, 900);
    return () => clearInterval(t);
  }, [mainkan, periodeIdx]);

  useEffect(() => {
    if (!dbAktif) return;
    const supabase = createClient();

    const ch1 = supabase
      .channel("reports-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reports" },
        (payload) => {
          const baru = payload.new as LaporanDenganRelasi;
          setLaporan((s) => [
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
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "reports" },
        (payload) => {
          const upd = payload.new as LaporanDenganRelasi;
          setLaporan((s) =>
            s.map((r) => (r.id === upd.id ? { ...r, status: upd.status } : r))
          );
        }
      )
      .subscribe((st) =>
        setRealtime(
          st === "SUBSCRIBED"
            ? "aktif"
            : st === "CHANNEL_ERROR" || st === "TIMED_OUT" || st === "CLOSED"
              ? "terputus"
              : "menyambung"
        )
      );

    return () => {
      void supabase.removeChannel(ch1);
    };
  }, [dbAktif]);

  const adaFilter =
    fKategori.length > 0 ||
    fStatus.length > 0 ||
    kueri.trim().length > 0 ||
    !!pusatSaya ||
    periodeIdx !== null;

  function resetFilter() {
    setFKategori([]);
    setFStatus([]);
    setKueri("");
    setPusatSaya(null);
    setPeriodeIdx(null);
    setMainkan(false);
  }

  const tersaring = useMemo(() => {
    return laporan.filter((r) => {
      if (
        periodeIdx !== null &&
        new Date(r.created_at) > new Date(BULAN[periodeIdx].akhir)
      )
        return false;
      if (pusatSaya && r.lat != null && r.lng != null) {
        if (jarakMeter(pusatSaya, { lat: r.lat, lng: r.lng }) > 2000) return false;
      }
      if (
        fKategori.length &&
        !fKategori.includes(r.categories?.slug ?? "lainnya")
      )
        return false;
      if (fStatus.length && !fStatus.includes(r.status)) return false;
      if (
        kueri &&
        !`${r.judul} ${r.deskripsi}`.toLowerCase().includes(kueri.toLowerCase())
      )
        return false;
      return true;
    });
  }, [laporan, fKategori, fStatus, kueri, periodeIdx, pusatSaya]);

  const titikPeta = useMemo(
    () =>
      tersaring
        .filter((r) => r.lat != null && r.lng != null)
        .map((r) => ({
          id: r.id,
          lat: r.lat as number,
          lng: r.lng as number,
          warna:
            r.categories?.warna ??
            STATUS[r.status as StatusKey]?.warna ??
            "#64748b",
          slug: r.categories?.slug ?? "lainnya",
          judul: r.judul,
        })),
    [tersaring]
  );

  const titikFasilitas = useMemo(
    () =>
      layerFasilitas
        ? fasilitasAwal
            .filter((f) => f.lat != null && f.lng != null)
            .map((f) => ({
              id: `fas:${f.id}`,
              lat: f.lat,
              lng: f.lng,
              warna: fasilitasByJenis(f.jenis).warna,
              slug: `fasilitas:${f.jenis}`,
              judul: `${f.nama} · ${fasilitasByJenis(f.jenis).nama}`,
            }))
        : [],
    [layerFasilitas, fasilitasAwal]
  );

  const semuaTitik = useMemo(
    () => [...titikPeta, ...titikFasilitas],
    [titikPeta, titikFasilitas]
  );

  const terpilih = laporan.find((r) => r.id === terpilihId) ?? null;

  function aktifkanSekitarSaya() {
    if (pusatSaya) {
      setPusatSaya(null);
      return;
    }
    setCariLokasi(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPusatSaya({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setCariLokasi(false);
      },
      () => setCariLokasi(false),
      { timeout: 8000 }
    );
  }

  return (
    <main className="mx-auto max-w-[1600px] px-4 pb-6 pt-5">
      {/* Header dirampingkan supaya peta yang jadi subjek layar. Judul turun
          jadi label kecil; angka laporan — satu-satunya angka yang penting di
          sini — naik jadi elemen terbesar. */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-sans text-mikro font-semibold uppercase text-muted">
            Peta Masalah Permukiman
          </h1>
          <p className="mt-1.5 flex items-baseline gap-2.5">
            <span className="angka-tabular font-display text-4xl font-extrabold leading-none">
              {tersaring.length}
            </span>
            <span className="text-sm text-muted">laporan ditampilkan</span>
          </p>
          <p
            className={`mt-2 inline-flex items-center gap-1.5 text-xs font-semibold ${
              realtime === "aktif"
                ? "text-daun-700 dark:text-daun-300"
                : realtime === "terputus"
                  ? "text-danger-kuat dark:text-red-300"
                  : "text-muted"
            }`}
          >
            <span
              aria-hidden
              className={`size-1.5 rounded-full ${
                realtime === "aktif"
                  ? "animate-pulse bg-daun-500"
                  : realtime === "terputus"
                    ? "bg-danger"
                    : "bg-muted"
              }`}
            />
            {realtime === "aktif"
              ? "Realtime aktif"
              : realtime === "terputus"
                ? "Realtime terputus — muat ulang halaman"
                : "Menyambungkan…"}
          </p>
        </div>
        <Button size="lg" onClick={() => setModalBuka(true)}>
          <Plus size={18} strokeWidth={3} aria-hidden /> Laporkan Masalah
        </Button>
      </div>

      {!dbAktif && (
        <div className="mb-4 flex items-center gap-2 rounded-item border border-kunyit-500/40 bg-kunyit-100/50 px-4 py-3 text-sm text-kunyit-800 dark:bg-kunyit-500/10 dark:text-kunyit-400">
          <WifiOff size={16} aria-hidden /> Database belum tersambung — atur env
          Supabase lalu jalankan schema.sql (lihat README).
        </div>
      )}

      <div className="grid h-[calc(100dvh-15rem)] min-h-[540px] grid-rows-[minmax(0,1fr)] gap-4 lg:grid-cols-[1fr_380px]">
        <div className="relative flex min-h-0 flex-col gap-3 lg:block">
          {/* Toolbar mengambang di atas peta pada layar lebar — peta jadi
              subjeknya, bukan salah satu blok yang ditumpuk di atasnya. Di
              mobile toolbar tetap di alur normal supaya tidak menutupi peta. */}
          <div className="z-[600] shrink-0 lg:absolute lg:inset-x-3 lg:top-3">
            <div className="rounded-panel border garis-halus bg-panel p-2.5 lg:border-transparent lg:bg-panel/95 lg:shadow-melayang lg:backdrop-blur">
              <div className="flex flex-wrap items-center gap-2">
          <label className="relative min-w-48 flex-1">
            <Search
              size={15}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              value={kueri}
              onChange={(e) => setKueri(e.target.value)}
              placeholder="Cari judul atau isi laporan…"
              className="h-10 w-full rounded-full border garis-halus bg-panel-2 pl-10 pr-4 text-sm outline-none transition focus:border-daun-500 focus:ring-4 focus:ring-daun-500/15"
            />
          </label>

          <div className="relative">
            <button
              onClick={() => setPop(pop === "kategori" ? null : "kategori")}
              aria-expanded={pop === "kategori"}
              className={kelasFilter(pop === "kategori" || fKategori.length > 0)}
            >
              <SlidersHorizontal size={15} />
              Kategori
              {fKategori.length > 0 && (
                <span className="angka-tabular flex size-5 items-center justify-center rounded-full bg-daun-600 text-[11px] font-bold text-white">
                  {fKategori.length}
                </span>
              )}
              <ChevronDown
                size={14}
                className={`transition-transform duration-300 ${pop === "kategori" ? "rotate-180" : ""}`}
              />
            </button>
            {pop === "kategori" && (
              <div className="absolute right-0 top-full z-30 mt-2 w-64 rounded-2xl border garis-halus bg-panel p-2 shadow-xl">
                {KATEGORI.map((k) => {
                  const aktif = fKategori.includes(k.slug);
                  return (
                    <button
                      key={k.slug}
                      onClick={() =>
                        setFKategori((arr) =>
                          arr.includes(k.slug)
                            ? arr.filter((x) => x !== k.slug)
                            : [...arr, k.slug]
                        )
                      }
                      aria-pressed={aktif}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition hover:bg-panel-2"
                    >
                      <span
                        className={`flex size-4 items-center justify-center rounded border transition ${
                          aktif
                            ? "border-daun-600 bg-daun-600 text-white"
                            : "border-line"
                        }`}
                      >
                        {aktif && <Check size={11} strokeWidth={3} />}
                      </span>
                      <span style={{ color: k.warna }}>
                        <IkonKategori slug={k.slug} ukuran={14} />
                      </span>
                      {k.nama}
                    </button>
                  );
                })}
                {fKategori.length > 0 && (
                  <button
                    onClick={() => setFKategori([])}
                    className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-muted transition hover:bg-panel-2 hover:text-ink"
                  >
                    <X size={12} /> Reset kategori
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setPop(pop === "status" ? null : "status")}
              aria-expanded={pop === "status"}
              className={kelasFilter(pop === "status" || fStatus.length > 0)}
            >
              {/* Titik warna diturunkan dari STATUS, bukan di-hardcode: kalau
                  ada status terpilih, yang tampil adalah warna status itu. */}
              <span aria-hidden className="relative flex items-center">
                {(fStatus.length > 0
                  ? fStatus
                  : (["baru", "diverifikasi", "dikerjakan"] as StatusKey[])
                )
                  .slice(0, 3)
                  .map((st, i) => (
                    <span
                      key={st}
                      className={`size-2 rounded-full ${i > 0 ? "-ml-1" : ""}`}
                      style={{ backgroundColor: STATUS[st].warna }}
                    />
                  ))}
              </span>
              Status
              {fStatus.length > 0 && (
                <span className="angka-tabular flex size-5 items-center justify-center rounded-full bg-daun-600 text-[11px] font-bold text-white">
                  {fStatus.length}
                </span>
              )}
              <ChevronDown
                size={14}
                className={`transition-transform duration-300 ${pop === "status" ? "rotate-180" : ""}`}
              />
            </button>
            {pop === "status" && (
              <div className="absolute right-0 top-full z-30 mt-2 w-52 rounded-2xl border garis-halus bg-panel p-2 shadow-xl">
                {(Object.keys(STATUS) as StatusKey[]).map((st) => {
                  const aktif = fStatus.includes(st);
                  return (
                    <button
                      key={st}
                      onClick={() =>
                        setFStatus((arr) =>
                          arr.includes(st)
                            ? arr.filter((x) => x !== st)
                            : [...arr, st]
                        )
                      }
                      aria-pressed={aktif}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition hover:bg-panel-2"
                    >
                      <span
                        className={`flex size-4 items-center justify-center rounded border transition ${
                          aktif
                            ? "border-daun-600 bg-daun-600 text-white"
                            : "border-line"
                        }`}
                      >
                        {aktif && <Check size={11} strokeWidth={3} />}
                      </span>
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: STATUS[st].warna }}
                      />
                      {STATUS[st].label}
                    </button>
                  );
                })}
                {fStatus.length > 0 && (
                  <button
                    onClick={() => setFStatus([])}
                    className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-muted transition hover:bg-panel-2 hover:text-ink"
                  >
                    <X size={12} /> Reset status
                  </button>
                )}
              </div>
            )}
          </div>

          <span aria-hidden className="mx-1 hidden h-6 w-px bg-line sm:block" />

          <button
            onClick={aktifkanSekitarSaya}
            aria-pressed={!!pusatSaya}
            className={kelasMode(!!pusatSaya)}
          >
            <Crosshair size={15} aria-hidden />
            {cariLokasi
              ? "Mencari…"
              : pusatSaya
                ? "≤ 2 km"
                : "Sekitar saya"}
          </button>

          <button
            onClick={() => setLayerFasilitas((v) => !v)}
            aria-pressed={layerFasilitas}
            className={kelasMode(layerFasilitas)}
          >
            <Recycle size={15} aria-hidden />
            Fasilitas
          </button>

          {layerFasilitas && (
            <button
              onClick={() => setModalFasilitas(true)}
              className="flex h-10 items-center gap-1.5 rounded-kontrol border border-dashed border-line px-3 py-1.5 text-xs font-semibold text-muted transition-[border-color,color] duration-300 ease-sigap hover:border-daun-500 hover:text-ink"
            >
              <Plus size={13} aria-hidden /> Tambah fasilitas
            </button>
          )}

          <TombolIkutiArea pusatSaya={pusatSaya} />

          <button
            onClick={() => {
              if (periodeIdx === null) setPeriodeIdx(BULAN.length - 1);
              else {
                setPeriodeIdx(null);
                setMainkan(false);
              }
            }}
            aria-pressed={periodeIdx !== null}
            className={kelasMode(periodeIdx !== null)}
          >
            <History size={15} aria-hidden />
            Garis waktu
          </button>
        </div>

        {periodeIdx !== null && (
          <div className="mt-2.5 flex flex-wrap items-center gap-3 border-t garis-halus px-1 pt-2.5">
            <button
              onClick={() => setMainkan((v) => !v)}
              aria-label={mainkan ? "Jeda" : "Putar"}
              className="flex size-8 items-center justify-center rounded-full bg-daun-600 text-white transition hover:bg-daun-700"
            >
              {mainkan ? (
                <span className="text-[10px] leading-none">■</span>
              ) : (
                <Play size={14} />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={BULAN.length - 1}
              value={periodeIdx}
              onChange={(e) => setPeriodeIdx(Number(e.target.value))}
              className="w-52 accent-daun-600"
              aria-label="Pilih periode waktu"
            />
            <span className="text-xs font-semibold text-muted">
              s.d. {BULAN[periodeIdx].label} ·{" "}
              <span className="angka-tabular">{tersaring.length}</span> laporan
              kumulatif
            </span>
          </div>
        )}
            </div>
          </div>

          {pop && (
            <div
              className="fixed inset-0 z-[550]"
              onClick={() => setPop(null)}
              aria-hidden
            />
          )}

          <Card className="relative min-h-0 flex-1 overflow-hidden p-0 lg:absolute lg:inset-0">
          <LeafletMap
            pusat={
              pusatSaya ? [pusatSaya.lat, pusatSaya.lng] : undefined
            }
            zoom={pusatSaya ? 15 : undefined}
            titik={semuaTitik}
            terpilih={terpilihId}
            onKlikTitik={(id) => {
              if (id.startsWith("fas:")) {
                setFasTerpilih(
                  fasilitasAwal.find((f) => `fas:${f.id}` === id) ?? null
                );
              } else {
                setTerpilihId(id);
              }
            }}
          />
          {periodeIdx !== null && (
            <div className="pointer-events-none absolute left-3 top-3 z-[500] rounded-xl bg-panel/90 px-3 py-1.5 font-display text-sm font-bold shadow backdrop-blur">
              <History size={13} className="inline align-[-2px]" /> s.d.{" "}
              {BULAN[periodeIdx].label}
            </div>
          )}
          </Card>
        </div>

        <aside
          className="hidden min-h-0 flex-col gap-3 overflow-y-auto pr-1 lg:flex"
          aria-label="Daftar laporan"
        >
          <AnimatePresence initial={false}>
            {tersaring.slice(0, 40).map((r) => (
              <motion.div
                key={r.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {/* Dulu ini <Card onClick> — sebuah div yang bisa diklik tapi
                    tidak bisa dijangkau keyboard sama sekali. Sekarang tombol
                    sungguhan. Laporan yang sudah selesai diredam, dan yang
                    terpilih ditandai pita warna kategori, bukan cuma ring. */}
                <Card
                  variant={r.status === "selesai" ? "datar" : "kartu"}
                  className={`overflow-hidden ${
                    r.status === "selesai" ? "opacity-75" : ""
                  } ${terpilihId === r.id ? "ring-2 ring-daun-500" : ""}`}
                >
                  <button
                    type="button"
                    onClick={() => setTerpilihId(r.id)}
                    aria-pressed={terpilihId === r.id}
                    className="flex w-full gap-3 p-4 text-left transition-colors duration-200 ease-sigap hover:bg-panel-2 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-fokus"
                  >
                    <span
                      aria-hidden
                      className="w-1 shrink-0 self-stretch rounded-kontrol"
                      style={{
                        backgroundColor:
                          terpilihId === r.id
                            ? (r.categories?.warna ?? "var(--line)")
                            : "transparent",
                      }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="mb-1.5 flex items-center justify-between gap-2">
                        <span
                          className="flex items-center gap-1.5 text-xs font-semibold"
                          style={{ color: r.categories?.warna }}
                        >
                          <IkonKategori
                            slug={r.categories?.slug ?? "lainnya"}
                            ukuran={13}
                          />
                          {r.categories?.nama ?? "Lainnya"}
                        </span>
                        <span
                          className="text-xs text-muted"
                          suppressHydrationWarning
                        >
                          {waktuRelatif(r.created_at)}
                        </span>
                      </span>
                      <span className="block font-display font-bold leading-snug">
                        {r.judul}
                      </span>
                      <span className="mt-1 line-clamp-2 block text-sm text-muted">
                        {r.deskripsi}
                      </span>
                      <span className="mt-2.5 flex items-center gap-3 text-xs text-muted">
                        <StatusChip status={r.status} />
                        <span className="flex items-center gap-1">
                          <ThumbsUp size={11} aria-hidden /> {r.vote_count}
                          <span className="sr-only">dukungan</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare size={11} aria-hidden />{" "}
                          {r.comment_count}
                          <span className="sr-only">komentar</span>
                        </span>
                      </span>
                    </span>
                  </button>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
          {tersaring.length === 0 && (
            <Card>
              {/* Dua sebab kosong yang berbeda butuh dua jalan keluar yang
                  berbeda: filter terlalu ketat, atau memang belum ada data. */}
              <KosongState
                ikon={<MapPinOff size={24} strokeWidth={1.6} />}
                judul={
                  adaFilter
                    ? "Tidak ada laporan yang lolos filter"
                    : "Belum ada laporan di sini"
                }
                isi={
                  adaFilter
                    ? `${laporan.length} laporan sedang disembunyikan oleh filter yang aktif.`
                    : "Jadilah yang pertama memetakan masalah di lingkunganmu."
                }
                aksi={
                  adaFilter ? (
                    <Button variant="sekunder" size="sm" onClick={resetFilter}>
                      <RotateCcw size={14} aria-hidden /> Reset semua filter
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => setModalBuka(true)}>
                      <Plus size={14} strokeWidth={3} aria-hidden /> Laporkan
                      Masalah
                    </Button>
                  )
                }
              />
            </Card>
          )}
        </aside>
      </div>

      <Modal
        terbuka={!!terpilih}
        tutup={() => setTerpilihId(null)}
        judul={terpilih?.judul ?? ""}
      >
        {terpilih && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusChip status={terpilih.status} />
              <span
                className="rounded-full px-2.5 py-1 text-xs font-semibold"
                style={{
                  backgroundColor: `${terpilih.categories?.warna}22`,
                  color: terpilih.categories?.warna,
                }}
              >
                <IkonKategori slug={terpilih.categories?.slug ?? "lainnya"} ukuran={13} />{" "}
                {kategoriBySlug(terpilih.categories?.slug ?? "").nama}
              </span>
              {/* Induknya tidak punya `flex`, jadi dua hitungan ini menumpuk
                  vertikal — beda dari kartu sidebar yang berjajar. */}
              <span className="inline-flex items-center gap-3 text-xs text-muted">
                <span className="flex items-center gap-1">
                  <ThumbsUp size={12} aria-hidden /> {terpilih.vote_count}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare size={12} aria-hidden /> {terpilih.comment_count}
                </span>
              </span>
            </div>
            <p className="whitespace-pre-line text-sm leading-relaxed">
              {terpilih.deskripsi}
            </p>
            {terpilih.foto_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={terpilih.foto_url}
                alt={terpilih.judul}
                className="max-h-64 w-full rounded-xl object-cover"
              />
            )}
            <Link href={`/laporan/${terpilih.id}`} className="block pt-1">
              <Button className="w-full">Buka halaman lengkap →</Button>
            </Link>
          </div>
        )}
      </Modal>

      <Modal
        terbuka={modalBuka}
        tutup={() => setModalBuka(false)}
        judul="Laporkan masalah baru"
        lebar="max-w-2xl"
      >
        <BuatLaporanFormulir
          selesai={() => {
            setModalBuka(false);
          }}
        />
      </Modal>

      <Modal
        terbuka={!!fasTerpilih}
        tutup={() => setFasTerpilih(null)}
        judul={fasTerpilih?.nama ?? ""}
        lebar="max-w-md"
      >
        {fasTerpilih && (
          <div className="space-y-3">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
              style={{
                backgroundColor: `${fasilitasByJenis(fasTerpilih.jenis).warna}22`,
                color: fasilitasByJenis(fasTerpilih.jenis).warna,
              }}
            >
              <IkonFasilitas jenis={fasTerpilih.jenis} ukuran={13} />
              {fasilitasByJenis(fasTerpilih.jenis).nama}
            </span>
            {/* Dulu memakai emoji 📍 dan 🕒 — dua-duanya sisa konten generatif
                di aplikasi yang seluruh ikonnya sudah vektor konsisten. */}
            {fasTerpilih.alamat && (
              <p className="flex items-start gap-2 text-sm text-muted">
                <MapPin size={14} className="mt-0.5 shrink-0" aria-hidden />
                {fasTerpilih.alamat}
              </p>
            )}
            {fasTerpilih.jam_buka && (
              <p className="flex items-start gap-2 text-sm text-muted">
                <Clock size={14} className="mt-0.5 shrink-0" aria-hidden />
                {fasTerpilih.jam_buka}
              </p>
            )}
            <p className="text-xs text-muted">
              Lokasi titik perkiraan — konfirmasi ke pengelola sebelum berkunjung.
            </p>
          </div>
        )}
      </Modal>

      <Modal
        terbuka={modalFasilitas}
        tutup={() => setModalFasilitas(false)}
        judul="Tambah fasilitas hijau"
        lebar="max-w-2xl"
      >
        <FormFasilitas
          selesai={() => {
            setModalFasilitas(false);
            setLayerFasilitas(true);
          }}
        />
      </Modal>

      <TurPeta />
    </main>
  );
}
