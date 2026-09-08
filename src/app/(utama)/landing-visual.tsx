"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { createClient } from "@/lib/supabase/client";
import { STATUS, type StatusKey } from "@/lib/constants";
import { IkonKategori } from "@/lib/ikon-vektor";
import { KacaKartu } from "@/components/eksperimen/kaca";
import { ArrowRight, ExternalLink, MapPin, X } from "lucide-react";

const FOKUS_APPLE =
  "focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus!";

const TAHAP_LAPORAN: StatusKey[] = [
  "baru",
  "diverifikasi",
  "dikerjakan",
  "menunggu_verifikasi",
  "selesai",
];

function LajurSiklusLaporan() {
  return (
    <section
      aria-labelledby="judul-siklus-laporan"
      className="mt-5 rounded-[18px] border border-ap-hairline bg-ap-parchment p-5 sm:p-6"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div>
          <p className="text-sm font-semibold text-ap-blue">Siklus laporan</p>
          <h2
            id="judul-siklus-laporan"
            className="mt-1 font-serif text-2xl font-semibold leading-tight tracking-[-0.2px]"
          >
            Dari temuan ke penanganan
          </h2>
        </div>
        <p className="max-w-sm text-sm leading-relaxed text-ap-ink-muted">
          Urutan status yang dapat dilalui sebuah laporan.
        </p>
      </div>

      <ol className="mt-6 flex flex-col gap-3 sm:flex-row sm:gap-0">
        {TAHAP_LAPORAN.map((status, index) => {
          const info = STATUS[status];
          return (
            <li
              key={status}
              className="flex min-w-0 flex-1 items-center gap-3 sm:flex-col sm:items-stretch sm:gap-2"
            >
              <div className="flex min-w-0 items-center gap-3 sm:w-full">
                <span
                  aria-hidden
                  className="size-3 shrink-0 rounded-full ring-4 ring-ap-parchment"
                  style={{ backgroundColor: info.warna }}
                />
                {index < TAHAP_LAPORAN.length - 1 && (
                  <span
                    aria-hidden
                    className="hidden h-px flex-1 bg-ap-hairline sm:block"
                  />
                )}
              </div>
              <p className="min-w-0 break-words text-sm font-semibold text-ap-ink">
                {info.label}
              </p>
            </li>
          );
        })}
      </ol>

      <p className="mt-5 text-xs leading-relaxed text-ap-ink-muted">
        Jalur lain yang tersedia: {" "}
        <span className={`font-semibold ${STATUS.ditolak.chip}`}>
          {STATUS.ditolak.label}
        </span>
        .
      </p>
    </section>
  );
}

export function AngkaHidup({ nilai }: { nilai: number }) {
  const [tampil, setTampil] = useState(nilai);
  const [prevNilai, setPrevNilai] = useState(nilai);
  if (nilai !== prevNilai) {
    setPrevNilai(nilai);
    setTampil(nilai);
  }

  useEffect(() => {
    if (nilai <= 0) {
      return;
    }
    if (
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const mulai = performance.now();
    const durasi = 800;
    let raf = 0;

    function tick(sekarang: number) {
      const p = Math.min(1, (sekarang - mulai) / durasi);
      const eased = 1 - Math.pow(1 - p, 3);
      setTampil(Math.round(eased * nilai));
      if (p < 1) raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [nilai]);

  return (
    <span
      className="angka-tabular inline-block tabular-nums"
      style={{ minWidth: `${String(nilai).length}ch` }}
    >
      {tampil.toLocaleString("id-ID")}
    </span>
  );
}

export function Terungkap({
  children,
  tunda = 0,
  className,
}: {
  children: React.ReactNode;
  tunda?: number;
  className?: string;
}) {
  // Hormati prefers-reduced-motion: tanpa gerak blur/y saat dikurangi.
  const kurangi = useReducedMotion() ?? false;
  return (
    <motion.div
      className={className}
      initial={kurangi ? { opacity: 0 } : { opacity: 0, y: 24, filter: "blur(4px)" }}
      whileInView={kurangi ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration: kurangi ? 0 : 0.7,
        delay: kurangi ? 0 : tunda,
        ease: [0.32, 0.72, 0, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

export type TitikHero = {
  id: string;
  lat: number;
  lng: number;
  warna: string;
  slug: string;
  judul: string;
  status?: string;
};

const LeafletMap = dynamic(
  () => import("@/components/map/leaflet-map").then((m) => m.LeafletMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-ap-parchment text-xs text-ap-ink/60">
        <span className="flex items-center gap-2 font-medium">
          <span className="size-2 animate-ping rounded-full bg-ap-blue" />
          Memuat peta wilayah…
        </span>
      </div>
    ),
  }
);

const FALLBACK_TITIK: TitikHero[] = [
  {
    id: "demo-1",
    lat: -6.2088,
    lng: 106.8456,
    warna: "#65a30d",
    slug: "sampah",
    judul: "Sampah Liar Depan Pasar RT 03",
    status: "menunggu_verifikasi",
  },
  {
    id: "demo-2",
    lat: -6.212,
    lng: 106.849,
    warna: "#0284c7",
    slug: "drainase",
    judul: "Got Tersumbat Sedimen Tebal",
    status: "dikerjakan",
  },
  {
    id: "demo-3",
    lat: -6.205,
    lng: 106.842,
    warna: "#f59e0b",
    slug: "lampu",
    judul: "PJU Padam Tikungan Utama",
    status: "selesai",
  },
  {
    id: "demo-4",
    lat: -6.215,
    lng: 106.841,
    warna: "#78716c",
    slug: "jalan",
    judul: "Lubang Ambles 80cm",
    status: "diverifikasi",
  },
];

export function PetaHeroVisual({ awalTitik }: { awalTitik?: TitikHero[] }) {
  const [titik, setTitik] = useState<TitikHero[]>(
    awalTitik && awalTitik.length > 0 ? awalTitik : FALLBACK_TITIK
  );
  const [terpilihId, setTerpilihId] = useState<string | null>(null);
  const [pakaiFallback, setPakaiFallback] = useState(
    !(awalTitik && awalTitik.length > 0)
  );

  // Sinkronisasi realtime dari Supabase
  useEffect(() => {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      return;
    }

    const supabase = createClient();
    if (!supabase) return;

    const channel = supabase
      .channel("hero-reports-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reports" },
        async () => {
          try {
            const { data } = await supabase
              .from("reports")
              .select("id, judul, lat, lng, status, categories(slug, nama, warna)")
              .not("lat", "is", null)
              .not("lng", "is", null)
              .order("created_at", { ascending: false })
              .limit(30);

            if (data && data.length > 0) {
              const hasil: TitikHero[] = (data as unknown as {
                id: string;
                lat: number | string;
                lng: number | string;
                judul: string;
                status: string;
                categories: { slug: string; nama: string; warna: string } | null;
              }[]).map((r) => ({
                id: r.id,
                lat: Number(r.lat),
                lng: Number(r.lng),
                warna: r.categories?.warna ?? "#2e9e57",
                slug: r.categories?.slug ?? "sampah",
                judul: r.judul,
                status: r.status,
              }));
              setTitik(hasil);
              setPakaiFallback(false);
            }
          } catch {
            /* pertahankan data lokal */
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const laporanTerpilih =
    titik.find((t) => t.id === terpilihId) ?? (terpilihId === null ? titik[0] : null);

  const statusInfo =
    laporanTerpilih?.status && laporanTerpilih.status in STATUS
      ? STATUS[laporanTerpilih.status as StatusKey]
      : null;

  return (
    <>
      <div className="overflow-hidden rounded-[18px] border border-ap-hairline bg-white text-ap-ink shadow-ap-shadow">
      {/* Top Bar Status */}
      <div className="flex min-h-[52px] flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-ap-hairline bg-ap-parchment px-3 py-2.5 text-xs sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ap-blue opacity-75 motion-reduce:animate-none" />
            <span className="relative inline-flex size-2 rounded-full bg-ap-blue" />
          </span>
          <span className="truncate font-semibold tracking-tight text-ap-ink">
            Peta laporan warga
          </span>
        </div>
        <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
          {pakaiFallback && (
            <span className="inline-flex min-h-6 items-center rounded-full border border-ap-warning/40 px-2 py-0.5 text-[11px] font-semibold text-ap-warning">
              Demo
            </span>
          )}
          <span className="rounded-full bg-ap-blue/10 px-2.5 py-0.5 text-[11px] font-bold tabular-nums angka-tabular text-ap-blue">
            {pakaiFallback
              ? `${titik.length} contoh laporan`
              : `${titik.length} laporan aktif`}
          </span>
          <span className="hidden text-[11px] text-ap-ink-muted sm:inline">
            Realtime
          </span>
        </div>
      </div>

      {/* Area Peta Nyata Leaflet */}
      <div className="relative h-[clamp(280px,48vw,380px)] w-full bg-ap-parchment">
        <LeafletMap
          titik={titik}
          terpilih={terpilihId}
          onKlikTitik={(id) => setTerpilihId(id)}
          zoom={14}
          pusat={
            titik.length > 0
              ? [titik[0].lat, titik[0].lng]
              : [-6.2088, 106.8456]
          }
          className="h-full w-full"
        />

        {/* Floating Dossier Card saat pin diklik / dipilih */}
        <AnimatePresence>
          {laporanTerpilih && (
            <motion.div
              key={laporanTerpilih.id}
              initial={{ opacity: 0, y: 14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.96 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="absolute bottom-3 left-3 right-3 z-[1000] sm:left-auto sm:right-3 sm:w-80"
            >
              <KacaKartu glass className="p-3.5">
                <div className="flex items-start justify-between gap-2 border-b border-ap-hairline pb-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="flex size-7 shrink-0 items-center justify-center rounded-lg"
                      style={{
                        backgroundColor: `${laporanTerpilih.warna}20`,
                        color: laporanTerpilih.warna,
                      }}
                    >
                      <IkonKategori slug={laporanTerpilih.slug} ukuran={14} />
                    </span>
                    <div className="min-w-0">
                      <p className="break-words text-xs font-bold leading-snug text-ap-ink">
                        {laporanTerpilih.judul}
                      </p>
                      <p className="text-[10px] capitalize text-ap-ink/60">
                        Kategori: {laporanTerpilih.slug.replace("-", " ")}
                      </p>
                    </div>
                  </div>
                  {terpilihId && (
                    <button
                      onClick={() => setTerpilihId(null)}
                      className={`flex min-h-11 min-w-11 items-center justify-center rounded-full text-ap-ink/60 transition hover:bg-ap-parchment hover:text-ap-ink ${FOKUS_APPLE}`}
                      aria-label="Tutup"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
                  <span aria-live="polite">
                    {statusInfo ? (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${statusInfo.chip}`}
                      >
                        <span
                          aria-hidden
                          className="size-1.5 rounded-full"
                          style={{ backgroundColor: statusInfo.warna }}
                        />
                        {statusInfo.label}
                      </span>
                    ) : (
                      <span className="text-[10px] text-ap-ink-muted">
                        Terpantau
                      </span>
                    )}
                  </span>

                  <Link
                    href={`/laporan/${laporanTerpilih.id}`}
                    className={`inline-flex min-h-[44px] items-center gap-1 text-[11px] font-bold text-ap-blue transition hover:underline ${FOKUS_APPLE}`}
                  >
                    Lihat detail <ArrowRight size={12} />
                  </Link>
                </div>
              </KacaKartu>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Bar Controls & Navigation */}
      <div className="flex min-h-[52px] flex-wrap items-center justify-between gap-2 border-t border-ap-hairline bg-ap-parchment px-3 py-2.5 text-xs sm:px-4">
        <span className="flex min-w-0 flex-1 items-center gap-1.5 text-[11px] text-ap-ink-muted">
          <MapPin size={13} className="shrink-0 text-ap-blue" />
          <span className="min-w-0 break-words">
            Pilih pin untuk melihat status laporan di sekitarmu
          </span>
        </span>
        <Link
          href="/peta"
          className={`inline-flex min-h-[44px] shrink-0 items-center gap-1 text-[11px] font-bold text-ap-blue transition hover:underline ${FOKUS_APPLE}`}
        >
          Lihat peta lengkap <ExternalLink size={12} />
        </Link>
      </div>
      </div>
      <LajurSiklusLaporan />
    </>
  );
}
