"use client";

import Image from "next/image";
import { useRef, type ReactNode } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from "motion/react";
import styles from "./scroll-animations.module.css";

/* -------------------------------------------------------------------------
   ANIMASI 1: Spatial 3D Perspective & Zoom Tilt pada Panggung Peta
   ------------------------------------------------------------------------- */
export function PanggungPetaScroll({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const kurangiGerak = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "center center"],
  });

  // Tilts in 3D perspective from 7deg to 0deg, scales from 0.94 to 1.0
  const rotateX = useTransform(scrollYProgress, [0, 1], [7, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.94, 1.0]);
  const y = useTransform(scrollYProgress, [0, 1], [32, 0]);

  if (kurangiGerak) {
    return <div>{children}</div>;
  }

  return (
    <div ref={containerRef} className={styles.stagePerspective} data-testid="panggung-peta-scroll">
      <motion.div
        className={styles.stageInner}
        style={{
          rotateX,
          scale,
          y,
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/* -------------------------------------------------------------------------
   ANIMASI 2: Text Storytelling Reveal pada Narasi Dampak & Komunitas
   ------------------------------------------------------------------------- */
interface KataItemProps {
  children: string;
  range: [number, number];
  progress: MotionValue<number>;
  kurangiGerak: boolean | null;
}

function KataItem({ children, range, progress, kurangiGerak }: KataItemProps) {
  const opacity = useTransform(progress, range, [0.24, 1.0]);

  if (kurangiGerak) {
    return <span className={styles.word}>{children}</span>;
  }

  return (
    <motion.span style={{ opacity }} className={styles.word}>
      {children}
    </motion.span>
  );
}

export function SorotTeksScroll({
  teks,
  className = "",
}: {
  teks: string;
  className?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const kurangiGerak = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.88", "end 0.45"],
  });

  const kataArray = teks.split(" ");

  return (
    <p ref={ref} className={`${styles.textReveal} ${className}`} data-testid="sorot-teks-scroll">
      {kataArray.map((kata, i) => {
        const start = i / kataArray.length;
        const end = Math.min(1, start + 1.2 / kataArray.length);
        return (
          <KataItem
            key={i}
            range={[start, end]}
            progress={scrollYProgress}
            kurangiGerak={kurangiGerak}
          >
            {kata}
          </KataItem>
        );
      })}
    </p>
  );
}

/* -------------------------------------------------------------------------
   ANIMASI 3: Interactive Horizontal Scroll Showcase pada Bukti Warga
   ------------------------------------------------------------------------- */
const BUKTI_DATA = [
  {
    nomor: "01",
    tag: "Aksi Bersama",
    judul: "Gotong royong warga lingkungan",
    deskripsi:
      "Warga bersama merawat dan membersihkan fasilitas permukiman, dari drainase hingga titik sampah.",
    foto: "/images/gotong-royong.jpg",
    alt: "Warga bergotong royong membersihkan lingkungan permukiman",
  },
  {
    nomor: "02",
    tag: "SDG 11",
    judul: "Kota dan permukiman berkelanjutan",
    deskripsi:
      "Ruang terbuka hijau dan koridor lingkungan yang aman, tertata rapi, dan mudah diakses semua warga.",
    foto: "/images/kota-sdg11.jpg",
    alt: "Koridor kota ramah lingkungan dengan pepohonan dan fasilitas publik",
  },
  {
    nomor: "03",
    tag: "Hasil Terukur",
    judul: "Ruang hunian yang kita rawat bersama",
    deskripsi:
      "Setiap titik masalah yang dilaporkan dipantau hingga benar-benar tuntas dengan bukti foto konfirmasi.",
    foto: "/images/lingkungan-permukiman.jpg",
    alt: "Suasana jalan permukiman yang asri dan terawat",
  },
];

export function GaleriBuktiScroll() {
  const sectionRef = useRef<HTMLElement>(null);
  const kurangiGerak = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // Smooth horizontal slide: 0% down to -38% as section scrolls past
  const x = useTransform(scrollYProgress, [0.15, 0.85], ["0%", "-38%"]);

  return (
    <section
      ref={sectionRef}
      className={styles.gallerySection}
      aria-labelledby="judul-galeri-bukti"
      data-testid="galeri-bukti-scroll"
    >
      <div className={styles.galleryHeader}>
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-action">
            Didokumentasikan Warga
          </span>
          <h2 id="judul-galeri-bukti">
            Perubahan nyata.<br />
            <span>Tercatat dan terlihat.</span>
          </h2>
          <p>Gulir untuk menjelajahi rekam jejak gotong royong dan pembenahan fasilitas di permukiman.</p>
        </div>
        <div className={`${styles.progressPill} liquid-glass-dock`}>
          <span className="inline-block w-2 h-2 rounded-full bg-action animate-pulse" />
          <span>3 Dokumentasi Unggulan</span>
        </div>
      </div>

      <div className={styles.trackContainer}>
        <motion.div
          className={styles.horizontalTrack}
          style={kurangiGerak ? undefined : { x }}
        >
          {BUKTI_DATA.map((item) => (
            <article key={item.nomor} className={`${styles.card} liquid-glass-tile`}>
              <Image
                src={item.foto}
                alt={item.alt}
                fill
                sizes="(max-width: 768px) 85vw, 45vw"
                className={`object-cover ${styles.cardImage}`}
                loading="lazy"
              />
              <div className={styles.cardOverlay} />
              <div className={styles.cardContent}>
                <div className={styles.cardTop}>
                  <span className={styles.cardTag}>{item.tag}</span>
                  <span className={styles.cardNumber}>{item.nomor} / 03</span>
                </div>
                <div className={styles.cardBottom}>
                  <h3>{item.judul}</h3>
                  <p>{item.deskripsi}</p>
                </div>
              </div>
            </article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
