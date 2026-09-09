"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { motion, useReducedMotion } from "motion/react";
import { fadeNaik } from "@/lib/motion";
import { createClient } from "@/lib/supabase/client";
import { kategoriBySlug, STATUS, type StatusKey } from "@/lib/constants";
import { IkonKategori } from "@/lib/ikon-vektor";
import { ArrowUpRight, Check, ChevronRight, Map, MapPin, Radio } from "lucide-react";
import styles from "./landing-visual.module.css";

export function AngkaHidup({ nilai }: { nilai: number }) {
  return <span className="angka-tabular tabular-nums">{nilai.toLocaleString("id-ID")}</span>;
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
  const kurangiGerak = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={false}
      whileInView={
        kurangiGerak ? undefined : { y: [fadeNaik.initial.y, 0], opacity: [0, 1] }
      }
      viewport={fadeNaik.viewport}
      transition={{ ...fadeNaik.transition, delay: tunda }}
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
      <div className={styles.mapLoading} role="status">
        <Map size={30} strokeWidth={1.4} aria-hidden="true" />
        <span>Menyiapkan peta lingkungan…</span>
      </div>
    ),
  }
);

const CONTOH_TITIK: TitikHero[] = [
  {
    id: "demo-1",
    lat: -6.2088,
    lng: 106.8456,
    warna: "#65a30d",
    slug: "sampah",
    judul: "Sampah menumpuk di depan pasar",
    status: "diverifikasi",
  },
  {
    id: "demo-2",
    lat: -6.212,
    lng: 106.849,
    warna: "#0284c7",
    slug: "drainase",
    judul: "Saluran air perlu dibersihkan",
    status: "dikerjakan",
  },
  {
    id: "demo-3",
    lat: -6.205,
    lng: 106.842,
    warna: "#b45309",
    slug: "lampu",
    judul: "Lampu jalan kembali menyala",
    status: "selesai",
  },
  {
    id: "demo-4",
    lat: -6.215,
    lng: 106.841,
    warna: "#78716c",
    slug: "jalan",
    judul: "Jalan berlubang di persimpangan",
    status: "baru",
  },
];

const ADA_KONFIGURASI = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

type BarisLaporan = {
  id: string;
  lat: number | string;
  lng: number | string;
  judul: string;
  status: string;
  categories: { slug: string; warna: string } | null;
};

function titikValid(titik: TitikHero) {
  return Number.isFinite(titik.lat) && Number.isFinite(titik.lng) &&
    Math.abs(titik.lat) <= 90 && Math.abs(titik.lng) <= 180;
}

function warnaKategori(warna: string): CSSProperties {
  return { "--category-color": /^#[0-9a-f]{6}$/i.test(warna) ? warna : "#64748b" } as CSSProperties;
}

export function PetaHeroVisual({ awalTitik }: { awalTitik?: TitikHero[] }) {
  const [laporan, setLaporan] = useState<TitikHero[]>(() => (awalTitik ?? []).filter(titikValid));
  const [terpilihId, setTerpilihId] = useState<string | null>(null);
  const [koneksi, setKoneksi] = useState<"menghubungkan" | "terhubung" | "tertunda">("menghubungkan");
  const [gagalMemuat, setGagalMemuat] = useState(false);
  const contoh = laporan.length === 0;
  const titik = contoh ? CONTOH_TITIK : laporan;
  const terpilih = titik.find((item) => item.id === terpilihId) ?? titik[0];
  const statusInfo = terpilih.status ? STATUS[terpilih.status as StatusKey] : undefined;
  const pusat = useMemo<[number, number]>(() => [terpilih.lat, terpilih.lng], [terpilih.lat, terpilih.lng]);

  useEffect(() => {
    if (!ADA_KONFIGURASI) return;

    let aktif = true;
    let urutan = 0;
    const controller = new AbortController();
    const supabase = createClient();

    async function muatLaporan() {
      const permintaan = ++urutan;
      try {
        const { data, error } = await supabase
          .from("reports")
          .select("id, judul, lat, lng, status, categories(slug, warna)")
          .not("lat", "is", null)
          .not("lng", "is", null)
          .order("created_at", { ascending: false })
          .limit(30)
          .abortSignal(controller.signal);

        if (!aktif || permintaan !== urutan) return;
        if (error) {
          setGagalMemuat(true);
          return;
        }
        const hasil = (data as unknown as BarisLaporan[]).map((baris) => ({
          id: baris.id,
          judul: baris.judul,
          lat: Number(baris.lat),
          lng: Number(baris.lng),
          status: baris.status,
          slug: baris.categories?.slug ?? "lainnya",
          warna: baris.categories?.warna ?? "#64748b",
        })).filter(titikValid);
        setLaporan(hasil);
        setGagalMemuat(false);
      } catch {
        if (aktif && permintaan === urutan) setGagalMemuat(true);
      }
    }

    const channel = supabase
      .channel("hero-reports-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, () => {
        void muatLaporan();
      })
      .subscribe((status) => {
        if (!aktif) return;
        if (status === "SUBSCRIBED") {
          setKoneksi("terhubung");
          void muatLaporan();
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          setKoneksi("tertunda");
        }
      });

    void muatLaporan();
    return () => {
      aktif = false;
      controller.abort();
      void supabase.removeChannel(channel);
    };
  }, []);

  const statusKoneksi = contoh
    ? "Pratinjau demo"
    : !ADA_KONFIGURASI
      ? "Data tersimpan"
      : gagalMemuat || koneksi === "tertunda"
        ? "Pembaruan tertunda"
        : koneksi === "terhubung"
          ? "Pembaruan langsung"
          : "Menghubungkan…";

  return (
    <div className={styles.showcase}>
      <div className={styles.window}>
        <div className={styles.titlebar}>
          <div className={styles.trafficLights} aria-hidden="true"><i /><i /><i /></div>
          <span className={styles.windowTitle}><Map size={14} aria-hidden="true" /> SIGAP · Peta lingkungan</span>
          <span className={styles.connection} data-live={!contoh && !gagalMemuat && koneksi === "terhubung"} role="status">
            <span />{statusKoneksi}
          </span>
        </div>

        <div className={styles.workspace}>
          <aside className={styles.sidebar} aria-label="Daftar laporan pada peta">
            <div className={styles.sidebarHeading}>
              <span className={styles.appIcon}><MapPin size={21} strokeWidth={2.1} aria-hidden="true" /></span>
              <div><p className={styles.eyebrow}>LINGKUNGAN KITA</p><h3>Setiap titik, berarti.</h3></div>
            </div>
            <div className={styles.listHeading}>
              <span>{contoh ? "Contoh laporan" : "Laporan terbaru"}</span>
              <span className={styles.count}>{titik.length}</span>
            </div>
            <ul className={styles.reportList}>
              {titik.map((item) => {
                const status = item.status ? STATUS[item.status as StatusKey] : undefined;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={styles.reportButton}
                      aria-pressed={item.id === terpilih.id}
                      onClick={() => setTerpilihId(item.id)}
                      style={warnaKategori(item.warna)}
                    >
                      <span className={styles.categoryIcon}><IkonKategori slug={item.slug} ukuran={17} /></span>
                      <span className={styles.reportCopy}><strong>{item.judul}</strong><span>{status?.label ?? "Status belum tersedia"}</span></span>
                      <ChevronRight className={styles.reportArrow} size={14} aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className={styles.mobileSelector}>
              <label htmlFor="hero-pilih-laporan">{contoh ? "Pilih contoh laporan" : "Pilih laporan"}</label>
              <select id="hero-pilih-laporan" value={terpilih.id} onChange={(event) => setTerpilihId(event.target.value)}>
                {titik.map((item) => <option value={item.id} key={item.id}>{item.judul}</option>)}
              </select>
            </div>
            <p className={styles.sidebarNote}>
              <Radio size={15} aria-hidden="true" />
              {contoh ? "Data contoh untuk menjelajahi SIGAP." : "Pilih laporan untuk melihat lokasinya."}
            </p>
          </aside>

          <div className={styles.mapArea}>
            <LeafletMap titik={titik} terpilih={terpilih.id} onKlikTitik={setTerpilihId} pusat={pusat} zoom={14} className={styles.mapCanvas} />
            <div className={styles.mapLabel}><span />{contoh ? "Peta contoh · Jakarta" : "Peta laporan warga"}</div>
            <article className={styles.dossier} aria-live="polite" aria-atomic="true">
              <div className={styles.dossierHeading}>
                <span className={styles.dossierCategory} style={warnaKategori(terpilih.warna)}>
                  <IkonKategori slug={terpilih.slug} ukuran={18} />
                </span>
                <span className={styles.dossierEyebrow}>{contoh ? "CONTOH LAPORAN" : "LAPORAN WARGA"}</span>
                {statusInfo?.label === "Selesai" && <span className={styles.completed}><Check size={13} aria-label="Selesai" /></span>}
              </div>
              <h4>{terpilih.judul}</h4>
              <p className={styles.dossierMeta}>{kategoriBySlug(terpilih.slug).nama}</p>
              <div className={styles.dossierBottom}>
                <span className={styles.statusBadge}>
                  <span style={{ backgroundColor: statusInfo?.warna ?? "#64748b" }} />
                  {statusInfo?.label ?? "Status belum tersedia"}
                </span>
                <Link href={contoh ? "/peta" : `/laporan/${terpilih.id}`} className={styles.detailLink}>
                  {contoh ? "Jelajahi peta" : "Lihat detail"}<ArrowUpRight size={15} aria-hidden="true" />
                </Link>
              </div>
            </article>
          </div>
        </div>
        <div className={styles.statusbar}>
          <span><MapPin size={13} aria-hidden="true" />{contoh ? "Data demo, bukan laporan warga." : "Lokasi dan status dalam satu pandangan."}</span>
          <Link href="/peta">Buka peta lengkap <ArrowUpRight size={13} aria-hidden="true" /></Link>
        </div>
      </div>
      <p className={styles.caption}>Ini peta interaktif. Coba pilih salah satu laporan.</p>
    </div>
  );
}
