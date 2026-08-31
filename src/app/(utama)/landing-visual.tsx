"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { createClient } from "@/lib/supabase/client";
import { STATUS, type StatusKey } from "@/lib/constants";
import { IkonKategori } from "@/lib/ikon-vektor";
import { ArrowRight, ExternalLink, MapPin, X } from "lucide-react";

export function AngkaHidup({ nilai }: { nilai: number }) {
  const [tampil, setTampil] = useState(nilai);

  useEffect(() => {
    if (nilai <= 0) return;
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

  return <span className="angka-tabular">{tampil.toLocaleString("id-ID")}</span>;
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
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24, filter: "blur(4px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay: tunda, ease: [0.32, 0.72, 0, 1] }}
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
      <div className="flex h-full w-full items-center justify-center bg-panel-2 text-xs text-muted">
        <span className="flex items-center gap-2 font-medium">
          <span className="size-2 animate-ping rounded-full bg-daun-500" />
          Memuat Peta Spasial Realtime...
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

  // Sinkronisasi realtime dari Supabase
  useEffect(() => {
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

  const statusInfo = laporanTerpilih?.status
    ? STATUS[laporanTerpilih.status as StatusKey]
    : null;

  return (
    <div className="relative overflow-hidden rounded-[2rem] border garis-halus bg-panel p-2 shadow-2xl">
      {/* Top Bar Status */}
      <div className="flex items-center justify-between border-b garis-halus bg-panel-2/90 px-4 py-2.5 rounded-t-[1.6rem] text-xs">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-daun-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-daun-500" />
          </span>
          <span className="font-semibold text-ink tracking-tight">
            Peta Geospasial Wilayah
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-daun-500/10 px-2.5 py-0.5 text-[11px] font-bold text-daun-700 dark:text-daun-300">
            {titik.length} Laporan Aktif
          </span>
          <span className="hidden sm:inline text-[11px] text-muted">· Realtime</span>
        </div>
      </div>

      {/* Area Peta Nyata Leaflet */}
      <div className="relative h-[380px] w-full overflow-hidden rounded-xl bg-panel-2">
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
              className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-3 sm:w-80 z-[1000] rounded-2xl border garis-halus bg-panel/95 p-3.5 shadow-2xl backdrop-blur-md"
            >
              <div className="flex items-start justify-between gap-2 border-b garis-halus pb-2">
                <div className="flex items-center gap-2 min-w-0">
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
                    <p className="text-xs font-bold text-ink truncate">
                      {laporanTerpilih.judul}
                    </p>
                    <p className="text-[10px] text-muted capitalize">
                      Kategori: {laporanTerpilih.slug.replace("-", " ")}
                    </p>
                  </div>
                </div>
                {terpilihId && (
                  <button
                    onClick={() => setTerpilihId(null)}
                    className="rounded-full p-1 text-muted hover:bg-panel-2 hover:text-ink transition"
                    aria-label="Tutup"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              <div className="mt-2.5 flex items-center justify-between">
                {statusInfo ? (
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{
                      backgroundColor: `${statusInfo.warna}18`,
                      color: statusInfo.warna,
                    }}
                  >
                    <span
                      className="size-1.5 rounded-full"
                      style={{ backgroundColor: statusInfo.warna }}
                    />
                    {statusInfo.label}
                  </span>
                ) : (
                  <span className="text-[10px] text-muted">Terpantau</span>
                )}

                <Link
                  href={`/laporan/${laporanTerpilih.id}`}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-daun-700 hover:text-daun-800 dark:text-daun-300 dark:hover:text-daun-200 transition"
                >
                  Buka Detail <ArrowRight size={12} />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Bar Controls & Navigation */}
      <div className="flex items-center justify-between border-t garis-halus bg-panel-2/80 px-4 py-2.5 rounded-b-[1.6rem] text-xs">
        <span className="text-muted text-[11px] flex items-center gap-1.5">
          <MapPin size={13} className="text-daun-600 dark:text-daun-400" />
          Klik sembarang pin untuk melihat status
        </span>
        <Link
          href="/peta"
          className="inline-flex items-center gap-1 font-bold text-daun-700 hover:text-daun-800 dark:text-daun-300 dark:hover:text-daun-200 text-[11px] transition"
        >
          Jelajahi Peta Penuh <ExternalLink size={12} />
        </Link>
      </div>
    </div>
  );
}
