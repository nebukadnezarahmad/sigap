"use client";

import Image from "next/image";
import { useState, useRef, useCallback, useEffect, type ReactNode } from "react";
import {
  motion,
  useScroll,
  useTransform,
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
  const containerRef = useRef<HTMLDivElement>(null);
  const kurangiGerak = useReducedMotion();

  const [activeIndex, setActiveIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  // Mouse drag tracking refs
  const isDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const isDraggingRef = useRef(false);

  // Scroll checking callback
  const checkScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 15);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 15);

    const cards = el.querySelectorAll<HTMLElement>("article");
    let closestIndex = 0;
    let minDiff = Infinity;
    cards.forEach((card, idx) => {
      const diff = Math.abs(card.offsetLeft - el.offsetLeft - scrollLeft);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = idx;
      }
    });
    setActiveIndex(closestIndex);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);

    const onMouseMove = (e: MouseEvent) => {
      if (!isDownRef.current || !containerRef.current) return;
      const x = e.pageX - containerRef.current.offsetLeft;
      const walk = (x - startXRef.current) * 1.3;
      if (Math.abs(walk) > 4) {
        if (!isDraggingRef.current) {
          isDraggingRef.current = true;
          setIsDragging(true);
        }
        containerRef.current.scrollLeft = scrollLeftRef.current - walk;
      }
    };

    const onMouseUp = () => {
      if (isDownRef.current) {
        isDownRef.current = false;
        if (isDraggingRef.current) {
          isDraggingRef.current = false;
          setIsDragging(false);
        }
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [checkScroll]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    isDownRef.current = true;
    startXRef.current = e.pageX - containerRef.current.offsetLeft;
    scrollLeftRef.current = containerRef.current.scrollLeft;
  };

  const scrollToIndex = (index: number) => {
    if (!containerRef.current) return;
    const cards = containerRef.current.querySelectorAll<HTMLElement>("article");
    const targetCard = cards[index];
    if (targetCard) {
      const scrollTarget = targetCard.offsetLeft - containerRef.current.offsetLeft;
      containerRef.current.scrollTo({
        left: scrollTarget,
        behavior: kurangiGerak ? "auto" : "smooth",
      });
      setActiveIndex(index);
    }
  };

  const scrollPrev = () => {
    const target = Math.max(0, activeIndex - 1);
    scrollToIndex(target);
  };

  const scrollNext = () => {
    const target = Math.min(BUKTI_DATA.length - 1, activeIndex + 1);
    scrollToIndex(target);
  };

  return (
    <section
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
          <p>Geser kartu atau gunakan tombol navigasi untuk menjelajahi rekam jejak gotong royong warga.</p>
        </div>

        <div className={styles.galleryControls}>
          <div className={`${styles.navGroup} liquid-glass-control`} role="group" aria-label="Navigasi Galeri">
            <button
              type="button"
              className={styles.navButton}
              onClick={scrollPrev}
              disabled={!canScrollLeft}
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
              disabled={!canScrollRight}
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
        ref={containerRef}
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
        <div className={styles.horizontalTrack}>
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
        </div>
      </div>
    </section>
  );
}
