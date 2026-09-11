"use client";

import Image from "next/image";
import { useState, useRef, useEffect, type ReactNode } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
  useReducedMotion,
  type MotionValue,
} from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

  // Fey 3D Perspective Stage Transformation:
  // Starts angled back (16deg), scaled (0.88), offset Y (60px)
  // Lands flat (0deg), full scale (1.0), zero offset (0px) when centered in viewport
  const rotateX = useTransform(scrollYProgress, [0, 1], [16, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.88, 1.0]);
  const y = useTransform(scrollYProgress, [0, 1], [18, 0]);

  // Differential Parallax for Fey Floating Badges
  const badgeYTop = useTransform(scrollYProgress, [0, 1], [32, 0]);
  const badgeYBottom = useTransform(scrollYProgress, [0, 1], [-16, 0]);
  const badgeOpacity = useTransform(scrollYProgress, [0, 0.35, 1], [0, 0.85, 1]);

  if (kurangiGerak) {
    return <div>{children}</div>;
  }

  return (
    <div
      ref={containerRef}
      className={styles.stagePerspective}
      data-testid="panggung-peta-scroll"
    >
      {/* Floating Badge Atas: Status Wilayah Aktif */}
      <motion.div
        className={styles.feyBadgeTop}
        style={{
          y: badgeYTop,
          opacity: badgeOpacity,
        }}
        aria-hidden="true"
      >
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>Pemantauan Wilayah Aktif</span>
      </motion.div>

      {/* Main 3D Tilted Stage */}
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

      {/* Floating Badge Bawah: Mode Tinjauan Real-Time */}
      <motion.div
        className={styles.feyBadgeBottom}
        style={{
          y: badgeYBottom,
          opacity: badgeOpacity,
        }}
        aria-hidden="true"
      >
        <span className="inline-block w-2 h-2 rounded-full bg-action" />
        <span>Peta Terverifikasi Warga</span>
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

  // Animasi aktif saat teks masuk dari bawah (0.92) dan sudah 100% selesai saat teks tiba di tengah layar (0.58)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.92", "start 0.58"],
  });

  const kataArray = teks.split(" ");
  const totalKata = kataArray.length;

  return (
    <p ref={ref} className={`${styles.textReveal} ${className}`} data-testid="sorot-teks-scroll">
      {kataArray.map((kata, i) => {
        // Pemetaan rentang selesai di progress 0.85 sehingga semua kata sudah terang benderang tepat di tengah layar
        const start = (i / totalKata) * 0.85;
        const end = Math.min(1, start + 0.15);
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

  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // 1. Scroll Animation (Framer #9): sticky 240vh section converts vertical scroll into horizontal translation
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Translates cards smoothly across screen from 0% to -44%
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-44%"]);

  // Sync active index with scroll progress
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (latest < 0.35) {
      setActiveIndex(0);
    } else if (latest < 0.72) {
      setActiveIndex(1);
    } else {
      setActiveIndex(2);
    }
  });

  // 2. Interactive Navigation Controls (Tombol Panah & Titik Paginasi)
  const scrollToIndex = (index: number) => {
    if (!sectionRef.current) return;
    if (typeof window === "undefined" || typeof window.scrollTo !== "function") return;

    const rect = sectionRef.current.getBoundingClientRect();
    const sectionTop = window.scrollY + rect.top;
    const scrollDistance = Math.max(
      100,
      sectionRef.current.clientHeight - window.innerHeight
    );
    const targetProgress = index / (BUKTI_DATA.length - 1);
    const targetY = sectionTop + targetProgress * scrollDistance;

    window.scrollTo({
      top: targetY,
      behavior: kurangiGerak ? "auto" : "smooth",
    });
    setActiveIndex(index);
  };

  const scrollPrev = () => {
    const target = Math.max(0, activeIndex - 1);
    scrollToIndex(target);
  };

  const scrollNext = () => {
    const target = Math.min(BUKTI_DATA.length - 1, activeIndex + 1);
    scrollToIndex(target);
  };

  // 3. Interactive Mouse Drag-to-Scroll
  const isDownRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollYRef = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!sectionRef.current) return;
    isDownRef.current = true;
    startXRef.current = e.pageX;
    startScrollYRef.current = window.scrollY;
    setIsDragging(true);
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDownRef.current || !sectionRef.current) return;
      if (typeof window === "undefined" || typeof window.scrollTo !== "function") return;

      const deltaX = e.pageX - startXRef.current;
      if (Math.abs(deltaX) > 3) {
        e.preventDefault();
        const scrollDistance = Math.max(
          100,
          sectionRef.current.clientHeight - window.innerHeight
        );
        const dragFactor = scrollDistance / (window.innerWidth * 0.75);
        window.scrollTo({
          top: startScrollYRef.current - deltaX * dragFactor,
        });
      }
    };

    const onMouseUp = () => {
      if (isDownRef.current) {
        isDownRef.current = false;
        setIsDragging(false);
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className={styles.gallerySection}
      aria-labelledby="judul-galeri-bukti"
      data-testid="galeri-bukti-scroll"
    >
      <div className={styles.stickyContainer}>
        <div className={styles.galleryHeader}>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-action">
              Didokumentasikan Warga
            </span>
            <h2 id="judul-galeri-bukti">
              Perubahan nyata.<br />
              <span>Tercatat dan terlihat.</span>
            </h2>
            <p>Gulir halaman untuk scroll animasi, atau geser kartu langsung ke kanan dan kiri.</p>
          </div>

          <div className={styles.galleryControls}>
            <div className={`${styles.navGroup} liquid-glass-control`} role="group" aria-label="Navigasi Galeri">
              <button
                type="button"
                className={styles.navButton}
                onClick={scrollPrev}
                disabled={activeIndex === 0}
                aria-label="Geser ke kartu sebelumnya"
              >
                <ChevronLeft size={18} aria-hidden="true" />
              </button>

              <div className={styles.dots} role="tablist" aria-label="Pilih kartu dokumentasi">
                {BUKTI_DATA.map((item, idx) => (
                  <button
                    key={item.nomor}
                    type="button"
                    className={`${styles.dot} ${idx === activeIndex ? styles.dotActive : ""}`}
                    onClick={() => scrollToIndex(idx)}
                    aria-label={`Kartu ${item.nomor}: ${item.judul}`}
                    aria-selected={idx === activeIndex}
                    role="tab"
                  />
                ))}
              </div>

              <button
                type="button"
                className={styles.navButton}
                onClick={scrollNext}
                disabled={activeIndex === BUKTI_DATA.length - 1}
                aria-label="Geser ke kartu berikutnya"
              >
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            </div>

            <div className={`${styles.progressPill} liquid-glass-dock`}>
              <span className="inline-block w-2 h-2 rounded-full bg-action animate-pulse" />
              <span>Kartu {activeIndex + 1} dari {BUKTI_DATA.length}</span>
            </div>
          </div>
        </div>

        <div
          className={`${styles.trackContainer} ${isDragging ? styles.isDragging : ""}`}
          onMouseDown={handleMouseDown}
          tabIndex={0}
          role="region"
          aria-label="Galeri bukti perubahan nyata yang dapat digeser"
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") {
              e.preventDefault();
              scrollPrev();
            } else if (e.key === "ArrowRight") {
              e.preventDefault();
              scrollNext();
            }
          }}
        >
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
                  draggable={false}
                />
                <div className={styles.cardOverlay} />
                <div className={styles.cardContent}>
                  <div className={styles.cardTop}>
                    <span className={styles.cardTag}>{item.tag}</span>
                    <span className={styles.cardNumber}>{item.nomor} / 0{BUKTI_DATA.length}</span>
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
      </div>
    </section>
  );
}
