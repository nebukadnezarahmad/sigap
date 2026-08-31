"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { svgUriKategori } from "@/lib/ikon-vektor";

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

const PIN_HERO = [
  {
    slug: "sampah",
    nama: "Sampah Liar Pasar",
    warna: "#65a30d",
    x: "24%",
    y: "28%",
    status: "Menunggu Verifikasi",
    sla: "Target 3 Hari",
    delay: 0.1,
  },
  {
    slug: "drainase",
    nama: "Got Tersumbat RT 02",
    warna: "#0284c7",
    x: "62%",
    y: "24%",
    status: "Dikerjakan",
    sla: "SLA: Sisa 2 Hari",
    delay: 0.25,
  },
  {
    slug: "lampu",
    nama: "PJU Padam Tikungan",
    warna: "#f59e0b",
    x: "78%",
    y: "60%",
    status: "Selesai",
    sla: "Tuntas Tepat Waktu",
    delay: 0.4,
  },
  {
    slug: "jalan",
    nama: "Lubang Ambles 80cm",
    warna: "#78716c",
    x: "36%",
    y: "68%",
    status: "Diverifikasi",
    sla: "Target 14 Hari",
    delay: 0.55,
  },
];

export function PetaHeroVisual() {
  const [pinAktif, setPinAktif] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPinAktif((prev) => (prev + 1) % PIN_HERO.length);
    }, 3800);
    return () => clearInterval(timer);
  }, []);

  const terpilih = PIN_HERO[pinAktif];

  return (
    <div className="relative rounded-[2rem] border garis-halus bg-panel p-2 shadow-2xl">
      {/* Header Dossier */}
      <div className="flex items-center justify-between border-b garis-halus bg-panel-2/80 px-4 py-2.5 rounded-t-[1.6rem] text-xs">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-daun-500 animate-ping" />
          <span className="font-display font-bold tracking-wider text-ink uppercase text-[11px]">
            Peta Geospasial Wilayah RT 03/RW 05
          </span>
        </div>
        <span className="rounded-full bg-daun-500/10 px-2 py-0.5 text-[10px] font-bold text-daun-700 dark:text-daun-300">
          Sistem Aktif Realtime
        </span>
      </div>

      {/* Area Peta */}
      <div className="relative h-[380px] w-full overflow-hidden bg-[#f3f0e8] dark:bg-[#121b16]">
        {/* Grid Spasial & Jalan */}
        <div
          className="absolute inset-0 opacity-40 dark:opacity-20"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, var(--line) 0 1px, transparent 1px 48px), repeating-linear-gradient(90deg, var(--line) 0 1px, transparent 1px 48px)",
          }}
        />

        {/* Poligon Blok Lingkungan & Jalan Utama */}
        <svg className="absolute inset-0 size-full stroke-line/80" fill="none" aria-hidden>
          <path
            d="M-20,160 L450,80"
            stroke="currentColor"
            strokeWidth="24"
            className="text-white dark:text-panel-2"
          />
          <path
            d="M180,-20 L260,420"
            stroke="currentColor"
            strokeWidth="18"
            className="text-white dark:text-panel-2"
          />
          <path
            d="M320,100 L440,360"
            stroke="currentColor"
            strokeWidth="14"
            className="text-white dark:text-panel-2"
          />
        </svg>

        {/* Label Jalan Hiperlokal */}
        <span className="absolute left-6 top-[130px] -rotate-10 font-sans text-[10px] font-semibold tracking-wider text-muted uppercase">
          Jl. Pemuda Raya
        </span>
        <span className="absolute left-[200px] top-[40px] rotate-80 font-sans text-[10px] font-semibold tracking-wider text-muted uppercase">
          Gg. Melati RT 03
        </span>

        {/* Pins Geospasial */}
        {PIN_HERO.map((p, idx) => {
          const isSelected = idx === pinAktif;
          const ikon = svgUriKategori(p.slug, "#ffffff", 14);
          return (
            <div
              key={p.slug}
              onClick={() => setPinAktif(idx)}
              className="absolute cursor-pointer transition-transform duration-300"
              style={{ left: p.x, top: p.y }}
            >
              <div className="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
                {isSelected && (
                  <motion.span
                    className="absolute inset-0 size-10 rounded-full"
                    style={{ backgroundColor: p.warna }}
                    initial={{ scale: 0.8, opacity: 0.8 }}
                    animate={{ scale: 2.2, opacity: 0 }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
                  />
                )}
                <span
                  className={`flex size-8 items-center justify-center rounded-full border-2 border-white shadow-lg transition-transform ${
                    isSelected ? "scale-125 ring-2 ring-offset-2 ring-daun-500" : "scale-100 opacity-90"
                  }`}
                  style={{ backgroundColor: p.warna }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ikon} width={14} height={14} alt="" />
                </span>
              </div>
            </div>
          );
        })}

        {/* Kartu Live Dossier Mini */}
        <motion.div
          key={terpilih.nama}
          initial={{ opacity: 0, y: 12, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-72 rounded-2xl border garis-halus bg-panel/95 p-3.5 shadow-xl backdrop-blur-md"
        >
          <div className="flex items-center justify-between gap-2 border-b garis-halus pb-2">
            <span
              className="flex size-5 items-center justify-center rounded-md"
              style={{ backgroundColor: `${terpilih.warna}25`, color: terpilih.warna }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={svgUriKategori(terpilih.slug, terpilih.warna, 11)} width={11} height={11} alt="" />
            </span>
            <span className="text-[11px] font-bold text-ink truncate flex-1">
              {terpilih.nama}
            </span>
            <span className="rounded bg-panel-2 px-1.5 py-0.5 text-[9px] font-bold text-muted">
              {terpilih.sla}
            </span>
          </div>

          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 text-[11px] text-muted">
              <span className="size-1.5 rounded-full" style={{ backgroundColor: terpilih.warna }} />
              {terpilih.status}
            </span>
            <span className="font-semibold text-daun-700 dark:text-daun-300 text-[11px]">
              {pinAktif === 0 ? "✓ 2 Warga Verifikasi" : "Lihat Detail →"}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Footer Status Bar */}
      <div className="flex items-center justify-between border-t garis-halus bg-panel-2/60 px-4 py-2 text-[11px] text-muted rounded-b-[1.6rem]">
        <span>PostGIS Geospasial 100m Radius</span>
        <span className="font-medium">SDG 11 · Kota Berkelanjutan</span>
      </div>
    </div>
  );
}
