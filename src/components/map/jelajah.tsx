"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  Crosshair,
  MapPinOff,
  Play,
  Plus,
  Search,
  WifiOff,
} from "lucide-react";
import type { LaporanDenganRelasi } from "@/types/database";
import type { FasilitasRingkas } from "@/app/(utama)/peta/page";
import { IkonFasilitas } from "@/lib/ikon-vektor";
import { fasilitasByJenis } from "@/lib/constants";
import { Recycle } from "lucide-react";
import { KATEGORI, STATUS, kategoriBySlug, type StatusKey } from "@/lib/constants";
import { IkonKategori } from "@/lib/ikon-vektor";
import {
  Check,
  ChevronDown,
  History,
  MessageSquare,
  SlidersHorizontal,
  ThumbsUp,
  X,
} from "lucide-react";
import { waktuRelatif } from "@/lib/utils";
import { StatusChip, Button, Card } from "@/components/ui";
import { KacaBar, KacaKartu, KacaPill } from "@/components/eksperimen/kaca";
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
    loading: () => <div className="h-full w-full animate-pulse bg-ap-parchment dark:bg-ap-tile2" />,
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

/* Fusi visual Apple (docs/DESIGN-apple.md FUSI b+f): sinyal fokus di permukaan
   eksperimen memakai Action Blue. `!` menimpa aturan :focus-visible global
   yang unlayered. Tanpa animasi baru; kaca hanya untuk bar/kartu terapung. */
const FOKUS_KACA =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus!";

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
  const [prevLaporanAwal, setPrevLaporanAwal] = useState(laporanAwal);
  if (laporanAwal !== prevLaporanAwal) {
    setPrevLaporanAwal(laporanAwal);
    setLaporan(laporanAwal);
  }
  const [terpilihId, setTerpilihId] = useState<string | null>(null);
  const [kueri, setKueri] = useState("");
  const [fKategori, setFKategori] = useState<string[]>([]);
  const [fStatus, setFStatus] = useState<StatusKey[]>([]);
  const [modalBuka, setModalBuka] = useState(
    () => params.get("lapor") === "1"
  );
  const laporParam = params.get("lapor");
  const [prevLapor, setPrevLapor] = useState(laporParam);
  if (laporParam !== prevLapor) {
    setPrevLapor(laporParam);
    if (laporParam === "1") setModalBuka(true);
  }
  const [realtimeAktif, setRealtimeAktif] = useState(false);
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
      .subscribe((st) => setRealtimeAktif(st === "SUBSCRIBED"));

    return () => {
      void supabase.removeChannel(ch1);
    };
  }, [dbAktif]);

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
    <main className="pb-[calc(2.5rem+env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-7xl px-4 pt-5 sm:pt-7">
        <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold leading-[1.1] tracking-[-0.28px] text-ap-ink dark:text-white sm:text-3xl">
              Peta Masalah Permukiman
            </h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
              <span className="angka-tabular tabular-nums">
                {tersaring.length}
              </span>{" "}
              laporan ditampilkan
              <span aria-hidden className="text-ap-ink-muted">
                ·
              </span>
              <span className="inline-flex items-center gap-1">
                <span
                  aria-hidden
                  className={`size-1.5 rounded-full ${
                    realtimeAktif ? "animate-pulse bg-daun-500" : "bg-ap-ink-muted/50"
                  }`}
                />
                {realtimeAktif ? "Realtime aktif" : "Menyambungkan…"}
              </span>
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setModalBuka(true)}
            className="min-h-[44px] shrink-0 border-transparent bg-ap-blue text-white shadow-none hover:bg-ap-blue-focus hover:shadow-none focus-visible:outline-ap-blue-focus! dark:border-transparent dark:bg-ap-blue dark:text-white dark:hover:bg-ap-blue-focus"
          >
            <Plus size={17} strokeWidth={3} /> Laporkan Masalah
          </Button>
        </header>

      {!dbAktif && (
        <div className="mb-4 flex min-w-0 items-start gap-2 rounded-[18px] border border-kunyit-500/40 bg-white px-4 py-3 text-sm text-kunyit-600 shadow-none dark:border-kunyit-500/40 dark:bg-ap-tile1 dark:text-white">
          <WifiOff size={16} /> Database belum tersambung — atur env Supabase lalu
          jalankan schema.sql (lihat README).
        </div>
      )}

      <KacaKartu className="mb-4 min-w-0 p-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] text-ap-ink dark:text-white">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2">
          <label className="relative min-w-0 basis-full flex-1 sm:min-w-48 sm:basis-auto">
            <Search
              size={15}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              value={kueri}
              onChange={(e) => setKueri(e.target.value)}
              placeholder="Cari judul atau isi laporan…"
              aria-label="Cari laporan"
              className="h-11 min-h-[44px] w-full rounded-full border garis-halus bg-ap-parchment pl-10 pr-4 text-sm text-ap-ink outline-none transition placeholder:text-ap-ink/40 focus:border-ap-blue focus:ring-4 focus:ring-ap-blue/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus! motion-reduce:transition-none dark:border-white/15 dark:bg-ap-tile2 dark:text-white dark:placeholder:text-white/40"
            />
          </label>

          <div className="relative">
            <KacaPill
              onClick={() => setPop(pop === "kategori" ? null : "kategori")}
              aria-expanded={pop === "kategori"}
              className={`min-h-[44px] px-4 dark:text-white ${FOKUS_KACA} ${
                pop === "kategori" || fKategori.length > 0
                  ? "border-ap-blue/50 bg-ap-blue/10 text-ap-blue dark:border-ap-sky/40 dark:bg-ap-sky/15 dark:text-ap-sky"
                  : ""
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <SlidersHorizontal size={15} />
                Kategori
                {fKategori.length > 0 && (
                  <span className="angka-tabular flex size-5 items-center justify-center rounded-full bg-ap-blue text-[11px] font-bold text-white">
                    {fKategori.length}
                  </span>
                )}
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-300 motion-reduce:transition-none ${pop === "kategori" ? "rotate-180" : ""}`}
                />
              </span>
            </KacaPill>
            {pop === "kategori" && (
              /* R-34: kaca gelap dirapatkan di atas ubin peta yang terang agar
                 teks terang tetap kontras; blur kaca dipertahankan. */
              <KacaKartu className="absolute right-0 top-full z-30 mt-2 w-64 max-w-[calc(100vw-2rem)] p-2 dark:border-white/15 dark:bg-ap-tile2/90 dark:text-white">
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
                      className="flex min-h-[44px] w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition hover:bg-ap-parchment focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus! motion-reduce:transition-none dark:hover:bg-white/10"
                    >
                      <span
                        className={`flex size-4 items-center justify-center rounded border transition ${
                          aktif
                            ? "border-ap-blue bg-ap-blue text-white"
                            : "border-ap-hairline dark:border-white/25"
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
                    className="mt-1 flex min-h-[44px] w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-muted transition hover:bg-ap-parchment hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus! motion-reduce:transition-none dark:hover:bg-white/10 dark:hover:text-white"
                  >
                    <X size={12} /> Reset kategori
                  </button>
                )}
              </KacaKartu>
            )}
          </div>

          <div className="relative">
            <KacaPill
              onClick={() => setPop(pop === "status" ? null : "status")}
              aria-expanded={pop === "status"}
              className={`min-h-[44px] px-4 dark:text-white ${FOKUS_KACA} ${
                pop === "status" || fStatus.length > 0
                  ? "border-ap-blue/50 bg-ap-blue/10 text-ap-blue dark:border-ap-sky/40 dark:bg-ap-sky/15 dark:text-ap-sky"
                  : ""
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <span className="relative flex items-center">
                  <span className="size-2 rounded-full bg-kunyit-500" />
                  <span className="-ml-1 size-2 rounded-full bg-sky-500" />
                  <span className="-ml-1 size-2 rounded-full bg-violet-500" />
                </span>
                Status
                {fStatus.length > 0 && (
                  <span className="angka-tabular flex size-5 items-center justify-center rounded-full bg-ap-blue text-[11px] font-bold text-white">
                    {fStatus.length}
                  </span>
                )}
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-300 motion-reduce:transition-none ${pop === "status" ? "rotate-180" : ""}`}
                />
              </span>
            </KacaPill>
            {pop === "status" && (
              <KacaKartu className="absolute right-0 top-full z-30 mt-2 w-52 max-w-[calc(100vw-2rem)] p-2 dark:border-white/15 dark:bg-ap-tile2/90 dark:text-white">
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
                      className="flex min-h-[44px] w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition hover:bg-ap-parchment focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus! motion-reduce:transition-none dark:hover:bg-white/10"
                    >
                      <span
                        className={`flex size-4 items-center justify-center rounded border transition ${
                          aktif
                            ? "border-ap-blue bg-ap-blue text-white"
                            : "border-ap-hairline dark:border-white/25"
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
                    className="mt-1 flex min-h-[44px] w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-muted transition hover:bg-ap-parchment hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus! motion-reduce:transition-none dark:hover:bg-white/10 dark:hover:text-white"
                  >
                    <X size={12} /> Reset status
                  </button>
                )}
              </KacaKartu>
            )}
          </div>

          <span aria-hidden className="mx-1 hidden h-6 w-px bg-ap-hairline sm:block dark:bg-white/15" />

          <KacaPill
            onClick={aktifkanSekitarSaya}
            aria-pressed={!!pusatSaya}
            className={`min-h-[44px] px-4 dark:text-white ${FOKUS_KACA} ${
              pusatSaya
                ? "border-transparent bg-ap-blue text-white hover:bg-ap-blue-focus dark:border-transparent dark:bg-ap-blue dark:text-white"
                : ""
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <Crosshair size={15} />
              {cariLokasi
                ? "Mencari…"
                : pusatSaya
                  ? "≤ 2 km"
                  : "Sekitar saya"}
            </span>
          </KacaPill>

          <KacaPill
            onClick={() => setLayerFasilitas((v) => !v)}
            aria-pressed={layerFasilitas}
            className={`min-h-[44px] px-4 dark:text-white ${FOKUS_KACA} ${
              layerFasilitas
                ? "border-transparent bg-ap-blue text-white hover:bg-ap-blue-focus dark:border-transparent dark:bg-ap-blue dark:text-white"
                : ""
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <Recycle size={15} />
              Fasilitas
            </span>
          </KacaPill>

          {layerFasilitas && (
            <KacaPill
              onClick={() => setModalFasilitas(true)}
              className={`min-h-[44px] border-dashed px-3 py-1.5 text-xs hover:border-ap-blue/60 dark:text-white ${FOKUS_KACA}`}
            >
              + Tambah fasilitas
            </KacaPill>
          )}

          <TombolIkutiArea pusatSaya={pusatSaya} />

          <KacaPill
            onClick={() => {
              if (periodeIdx === null) setPeriodeIdx(BULAN.length - 1);
              else {
                setPeriodeIdx(null);
                setMainkan(false);
              }
            }}
            aria-pressed={periodeIdx !== null}
            className={`min-h-[44px] px-4 dark:text-white ${FOKUS_KACA} ${
              periodeIdx !== null
                ? "border-transparent bg-ap-blue text-white hover:bg-ap-blue-focus dark:border-transparent dark:bg-ap-blue dark:text-white"
                : ""
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <History size={15} />
              Garis waktu
            </span>
          </KacaPill>
        </div>

        {periodeIdx !== null && (
          <div className="mt-2.5 flex flex-wrap items-center gap-3 border-t garis-halus px-1 pt-2.5 dark:border-white/10">
            <button
              onClick={() => setMainkan((v) => !v)}
              aria-label={mainkan ? "Jeda" : "Putar"}
              className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-ap-blue text-white transition hover:bg-ap-blue-focus ${FOKUS_KACA}`}
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
              className="w-52 accent-ap-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus!"
              aria-label="Pilih periode waktu"
            />
            <span className="text-xs font-semibold text-muted">
              s.d. {BULAN[periodeIdx].label} ·{" "}
              <span className="angka-tabular">{tersaring.length}</span> laporan
              kumulatif
            </span>
          </div>
        )}
      </KacaKartu>

      {pop && (
        <button
          type="button"
          aria-label="Tutup filter"
          onClick={() => setPop(null)}
          className="fixed inset-0 z-20 cursor-default bg-transparent"
        />
      )}

      {/* R-03: di ponsel peta dipadatkan agar cuplikan daftar terlihat di
          bawahnya; desktop tidak berubah. */}
      <div className="grid min-w-0 h-[56dvh] min-h-[400px] grid-rows-[minmax(0,1fr)] gap-4 lg:h-[64dvh] lg:min-h-[460px] lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="relative min-h-0 overflow-hidden rounded-[18px] border-ap-hairline bg-white p-0 shadow-none dark:border-white/15 dark:bg-ap-tile1">
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
            <KacaBar className="pointer-events-none absolute left-3 top-3 z-[500] rounded-lg border px-3 py-1.5 font-display text-sm font-bold dark:border-white/15 dark:bg-ap-tile1/85 dark:text-white">
              <History size={13} className="inline align-[-2px]" /> s.d.{" "}
              {BULAN[periodeIdx].label}
            </KacaBar>
          )}
        </Card>

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
                <KacaKartu
                  onClick={() => setTerpilihId(r.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setTerpilihId(r.id);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Buka laporan ${r.judul}`}
                  aria-pressed={terpilihId === r.id}
                  className={`min-w-0 cursor-pointer bg-white/60 p-4 transition hover:border-ap-blue/50 motion-reduce:transition-none dark:border-white/15 dark:bg-ap-tile2/80 dark:text-white ${FOKUS_KACA} focus-visible:ring-2 focus-visible:ring-ap-blue-focus ${
                    terpilihId === r.id
                      ? "ring-2 ring-ap-blue ring-offset-2 ring-offset-ap-canvas dark:ring-offset-ap-tile1"
                      : ""
                  }`}
                >
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span
                      className="flex items-center gap-1.5 text-xs font-semibold"
                      style={{ color: r.categories?.warna }}
                    >
                      <IkonKategori slug={r.categories?.slug ?? "lainnya"} ukuran={13} />
                      {r.categories?.nama ?? "Lainnya"}
                    </span>
                    <span className="text-xs text-muted" suppressHydrationWarning>
                      {waktuRelatif(r.created_at)}
                    </span>
                  </div>
                  <h3 className="font-display font-bold leading-snug">
                    {r.judul}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">
                    {r.deskripsi}
                  </p>
                  <div className="mt-2.5 flex items-center gap-3 text-xs text-muted">
                    <StatusChip status={r.status} />
                    <span className="angka-tabular flex items-center gap-1 tabular-nums">
                      <ThumbsUp size={11} /> {r.vote_count}
                    </span>
                    <span className="angka-tabular flex items-center gap-1 tabular-nums">
                      <MessageSquare size={11} /> {r.comment_count}
                    </span>
                  </div>
                </KacaKartu>
              </motion.div>
            ))}
          </AnimatePresence>
          {tersaring.length > 0 && (
            <p className="angka-tabular py-1 text-center text-xs tabular-nums text-muted">
              menampilkan {Math.min(40, tersaring.length)} dari{" "}
              {tersaring.length} laporan
            </p>
          )}
          {tersaring.length === 0 && (
            <KacaKartu className="flex flex-col items-center gap-2 bg-white/60 p-8 text-center text-muted dark:border-white/15 dark:bg-ap-tile2/80">
              <MapPinOff size={28} />
              <p className="text-sm">
                {periodeIdx !== null
                  ? `Belum ada laporan hingga ${BULAN[periodeIdx].label}.`
                  : "Belum ada laporan yang cocok. Jadilah yang pertama melapor!"}
              </p>
            </KacaKartu>
          )}
        </aside>
      </div>

      {/* R-03: daftar laporan versi seluler. Bukan duplikat kartu desktop:
          baris ringkas satu ketuk (tombol asli 44px) yang membuka modal yang
          sama dengan desktop; judul Fraunces dipertahankan, tanpa emoji. */}
      <section
        aria-label="Daftar laporan"
        className="mt-4 overflow-hidden rounded-[18px] border border-ap-hairline bg-white text-ap-ink shadow-none lg:hidden dark:border-white/15 dark:bg-ap-tile1 dark:text-white"
      >
        <div
          aria-hidden
          className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-ap-hairline dark:bg-white/15"
        />
        <div className="flex items-baseline justify-between gap-2 px-4 pb-1 pt-2">
          <h2 className="font-display text-lg font-bold">Daftar laporan</h2>
          <p className="angka-tabular shrink-0 text-xs tabular-nums text-muted">
            {tersaring.length} laporan
          </p>
        </div>
        {tersaring.length > 0 ? (
          <>
            <ul className="lembar-geser max-h-80 divide-y divide-ap-hairline overflow-y-auto px-2 pb-2 dark:divide-white/10">
              {tersaring.slice(0, 20).map((r) => (
                <li key={r.id}>
                  <button
                    onClick={() => setTerpilihId(r.id)}
                    aria-label={`Buka laporan ${r.judul}`}
                     aria-pressed={terpilihId === r.id}
                     className={`flex min-h-[44px] w-full min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-ap-parchment motion-reduce:transition-none dark:hover:bg-white/10 ${FOKUS_KACA} focus-visible:ring-2 focus-visible:ring-ap-blue-focus ${
                       terpilihId === r.id
                         ? "ring-2 ring-ap-blue ring-offset-2 ring-offset-ap-canvas dark:ring-offset-ap-tile1"
                         : ""
                     }`}
                  >
                    <span
                      aria-hidden
                      className="size-2.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor:
                          r.categories?.warna ??
                          STATUS[r.status as StatusKey]?.warna ??
                          "#64748b",
                      }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">
                        {r.judul}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted">
                        {r.categories?.nama ?? "Lainnya"} ·{" "}
                        <span suppressHydrationWarning>
                          {waktuRelatif(r.created_at)}
                        </span>{" "}
                        · {STATUS[r.status as StatusKey]?.label ?? r.status}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="angka-tabular border-t garis-halus px-4 py-2 text-center text-xs tabular-nums text-muted dark:border-white/10">
              menampilkan {Math.min(20, tersaring.length)} dari{" "}
              {tersaring.length} laporan
            </p>
          </>
        ) : (
          <p className="px-4 pb-4 pt-1 text-center text-sm text-muted">
            {periodeIdx !== null
              ? `Belum ada laporan hingga ${BULAN[periodeIdx].label}.`
              : "Belum ada laporan yang cocok. Jadilah yang pertama melapor!"}
          </p>
        )}
      </section>

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
              <span className="text-xs text-muted">
                <span className="angka-tabular flex items-center gap-1 tabular-nums">
                  <ThumbsUp size={12} /> {terpilih.vote_count}
                </span>
                <span className="angka-tabular flex items-center gap-1 tabular-nums">
                  <MessageSquare size={12} /> {terpilih.comment_count}
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
                className="max-h-64 w-full rounded-lg object-cover"
              />
            )}
            <Link href={`/laporan/${terpilih.id}`} className="block pt-1">
              <Button
                className="min-h-[44px] w-full border-transparent bg-ap-blue text-white shadow-none hover:bg-ap-blue-focus hover:shadow-none focus-visible:outline-ap-blue-focus! dark:border-transparent dark:bg-ap-blue dark:text-white dark:hover:bg-ap-blue-focus"
              >
                Buka halaman lengkap →
              </Button>
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
            {fasTerpilih.alamat && (
              <p className="text-sm text-muted">Alamat: {fasTerpilih.alamat}</p>
            )}
            {fasTerpilih.jam_buka && (
              <p className="text-sm text-muted">Jam: {fasTerpilih.jam_buka}</p>
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
      </div>
    </main>
  );
}
