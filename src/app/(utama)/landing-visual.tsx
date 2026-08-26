"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { CheckCircle2, Clock, Zap } from "lucide-react";
import { Card } from "@/components/ui";
import { kategoriBySlug } from "@/lib/constants";
import { svgUriKategori } from "@/lib/ikon-vektor";

export function AngkaHidup({ nilai }: { nilai: number }) {
  const kurangiGerak = useReducedMotion();
  const [tampil, setTampil] = useState(0);

  useEffect(() => {
    if (nilai <= 0) return;
    // Angka yang berhitung naik adalah gerak dekoratif murni: informasinya
    // tetap utuh tanpa itu. Langsung tampilkan kalau pengguna minta gerak
    // dikurangi.
    if (kurangiGerak) {
      setTampil(nilai);
      return;
    }
    const mulai = performance.now();
    const durasi = 1000;
    let raf = 0;

    function tick(sekarang: number) {
      const p = Math.min(1, (sekarang - mulai) / durasi);
      const eased = 1 - Math.pow(1 - p, 3);
      setTampil(Math.round(eased * nilai));
      if (p < 1) raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [nilai, kurangiGerak]);

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
      // Tanpa filter blur: blur() bukan properti yang ramah compositor, dan
      // menganimasikannya saat scroll membebani setiap frame.
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay: tunda, ease: [0.32, 0.72, 0, 1] }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Warna diambil dari KATEGORI, bukan disalin. Sebelumnya nilainya di-hardcode
 * dan sudah basi terhadap sumbernya — dua di antaranya adalah warna lama yang
 * gagal kontras terhadap ikon putih.
 */
const PIN_HERO = [
  { slug: "sampah", x: "18%", y: "26%", delay: 0.15 },
  { slug: "drainase", x: "58%", y: "22%", delay: 0.3 },
  { slug: "lampu", x: "74%", y: "54%", delay: 0.45 },
  { slug: "jalan", x: "34%", y: "64%", delay: 0.6 },
  { slug: "ruang-hijau", x: "64%", y: "78%", delay: 0.75 },
  { slug: "lainnya", x: "12%", y: "76%", delay: 0.9 },
].map((p) => ({ ...p, warna: kategoriBySlug(p.slug).warna }));

function Pin({
  slug,
  warna,
  x,
  y,
  delay,
}: {
  slug: string;
  warna: string;
  x: string;
  y: string;
  delay: number;
}) {
  const kurangiGerak = useReducedMotion();
  const ikon = svgUriKategori(slug, "#ffffff", 16);
  return (
    <motion.div
      aria-hidden
      className="absolute"
      style={{ left: x, top: y }}
      initial={{ scale: 0, y: -14 }}
      animate={{ scale: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 260, damping: 16 }}
    >
      <span className="relative flex size-[38px] items-center justify-center">
        {/* Riak yang berdenyut tanpa henti — dimatikan sepenuhnya saat
            pengguna minta gerak dikurangi (WCAG 2.2.2). */}
        {!kurangiGerak && (
          <motion.span
            className="absolute inset-0 rounded-full opacity-30"
            style={{ backgroundColor: warna }}
            animate={{ scale: [1, 1.8], opacity: [0.35, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
          />
        )}
        <span
          className="relative flex size-[38px] items-center justify-center rounded-full border-[3px] border-white shadow-melayang"
          style={{ backgroundColor: warna }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ikon} width={16} height={16} alt="" />
        </span>
      </span>
    </motion.div>
  );
}

function ChipMelayang({
  isi,
  kelas,
  durasi,
  delay,
}: {
  isi: React.ReactNode;
  kelas: string;
  durasi: number;
  delay: number;
}) {
  return (
    <motion.div
      aria-hidden
      className={`absolute z-10 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-md ${kelas}`}
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: durasi, repeat: Infinity, ease: "easeInOut", delay }}
    >
      {isi}
    </motion.div>
  );
}

export function PetaHeroVisual() {
  return (
    <div
      aria-hidden
      className="rounded-[2rem] bg-ink/[0.04] p-1.5 ring-1 ring-black/5 dark:bg-white/[0.04] dark:ring-white/10"
    >
      <Card className="relative h-[420px] overflow-hidden rounded-[1.625rem] p-0 bayi-daun">
        <div
          className="absolute inset-0 bg-panel-2"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, var(--line) 0 1px, transparent 1px 56px), repeating-linear-gradient(90deg, var(--line) 0 1px, transparent 1px 56px)",
            opacity: 0.55,
          }}
        />
        <div
          className="absolute left-[-10%] top-[38%] h-10 w-[130%] rotate-[-14deg]"
          style={{ backgroundColor: "var(--line)", opacity: 0.7 }}
        />
        <div className="absolute right-[6%] top-[12%] size-40 rounded-[2rem] bg-daun-500/15" />
        {[["20%", "18%"], ["44%", "44%"], ["70%", "70%"], ["82%", "24%"]].map(
          ([x, y]) => (
            <div
              key={x + y}
              className="absolute size-10 rounded-lg bg-line/60"
              style={{ left: x, top: y }}
            />
          )
        )}

        {PIN_HERO.map((p) => (
          <Pin key={p.slug} {...p} />
        ))}

        <ChipMelayang
          isi={<><CheckCircle2 size={13} className="text-daun-600" /> Selesai ditangani</>}
          kelas="border garis-halus bg-panel text-ink right-4 top-12"
          durasi={4}
          delay={0}
        />
        <ChipMelayang
          isi={<><Clock size={13} className="text-kunyit-600" /> Status: Dikerjakan</>}
          kelas="border garis-halus bg-panel text-ink bottom-16 left-4"
          durasi={5}
          delay={0.6}
        />
        <ChipMelayang
          isi={<><Zap size={13} /> +10 poin</>}
          kelas="bottom-6 right-6 border-transparent bg-daun-600 text-white"
          durasi={6}
          delay={1.1}
        />

        <div className="absolute inset-x-0 top-0 flex items-center justify-between border-b garis-halus bg-panel/70 px-4 py-2.5 text-[11px] font-semibold text-muted backdrop-blur-sm">
          <span>PETA LANGSUNG · KOTA HARAPAN</span>
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 animate-pulse rounded-full bg-daun-500" />
            realtime
          </span>
        </div>
      </Card>
    </div>
  );
}
