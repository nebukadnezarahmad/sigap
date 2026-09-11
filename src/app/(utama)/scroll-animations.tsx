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
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
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

/* -------------------------------------------------------------------------
   ANIMASI 4: Tedy Exploding Card Stack Scroll Showcase (Framer #5)
   ------------------------------------------------------------------------- */
const TEDY_CARDS = [
  {
    id: "card-1",
    tag: "Aksi Bersama",
    foto: "/images/gotong-royong.jpg",
    alt: "Warga bergotong royong merawat lingkungan",
  },
  {
    id: "card-2",
    tag: "Ruang Asri",
    foto: "/images/lingkungan-permukiman.jpg",
    alt: "Jalan permukiman yang bersih dan tertata",
  },
  {
    id: "card-3",
    tag: "SDG 11",
    foto: "/images/kota-sdg11.jpg",
    alt: "Fasilitas kota ramah lingkungan",
  },
  {
    id: "card-4",
    tag: "Hasil Tuntas",
    foto: "/images/gotong-royong.jpg",
    alt: "Dokumentasi foto pembuktian warga",
  },
];

interface PenutupTedyScrollProps {
  children: ReactNode;
}

export function PenutupTedyScroll({ children }: PenutupTedyScrollProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const kurangiGerak = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(typeof window !== "undefined" && window.innerWidth <= 800);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Tedy Card Transforms:
  // Kartu foto menyebar ke sekeliling teks dan logo di 4 sudut, membingkai konten utama dengan rapi
  // Card 1: Top Left (membingkai sisi kiri atas judul & logo)
  const card1X = useTransform(
    scrollYProgress,
    [0, 0.55, 1.0],
    [isMobile ? "-10px" : "-20px", isMobile ? "-120px" : "-430px", isMobile ? "-120px" : "-430px"]
  );
  const card1Y = useTransform(
    scrollYProgress,
    [0, 0.55, 1.0],
    [isMobile ? "-15px" : "-15px", isMobile ? "-180px" : "-145px", isMobile ? "-180px" : "-145px"]
  );
  const card1Rotate = useTransform(scrollYProgress, [0, 0.55, 1.0], [-4, -7, -7]);
  const card1Scale = useTransform(scrollYProgress, [0, 0.55, 1.0], [0.9, 1.0, 1.0]);

  // Card 2: Bottom Left (membingkai sisi kiri bawah di samping tombol "Buat laporan")
  const card2X = useTransform(
    scrollYProgress,
    [0, 0.55, 1.0],
    [isMobile ? "-10px" : "-15px", isMobile ? "-110px" : "-410px", isMobile ? "-110px" : "-410px"]
  );
  const card2Y = useTransform(
    scrollYProgress,
    [0, 0.55, 1.0],
    [isMobile ? "15px" : "15px", isMobile ? "190px" : "145px", isMobile ? "190px" : "145px"]
  );
  const card2Rotate = useTransform(scrollYProgress, [0, 0.55, 1.0], [3, 4, 4]);
  const card2Scale = useTransform(scrollYProgress, [0, 0.55, 1.0], [0.9, 1.0, 1.0]);

  // Card 3: Top Right (membingkai sisi kanan atas judul & logo)
  const card3X = useTransform(
    scrollYProgress,
    [0, 0.55, 1.0],
    [isMobile ? "10px" : "20px", isMobile ? "120px" : "430px", isMobile ? "120px" : "430px"]
  );
  const card3Y = useTransform(
    scrollYProgress,
    [0, 0.55, 1.0],
    [isMobile ? "-15px" : "-15px", isMobile ? "-180px" : "-145px", isMobile ? "-180px" : "-145px"]
  );
  const card3Rotate = useTransform(scrollYProgress, [0, 0.55, 1.0], [4, 7, 7]);
  const card3Scale = useTransform(scrollYProgress, [0, 0.55, 1.0], [0.9, 1.0, 1.0]);

  // Card 4: Bottom Right (membingkai sisi kanan bawah di samping tombol "Bergabung sebagai warga")
  const card4X = useTransform(
    scrollYProgress,
    [0, 0.55, 1.0],
    [isMobile ? "10px" : "15px", isMobile ? "110px" : "410px", isMobile ? "110px" : "410px"]
  );
  const card4Y = useTransform(
    scrollYProgress,
    [0, 0.55, 1.0],
    [isMobile ? "15px" : "15px", isMobile ? "190px" : "145px", isMobile ? "190px" : "145px"]
  );
  const card4Rotate = useTransform(scrollYProgress, [0, 0.55, 1.0], [-3, -5, -5]);
  const card4Scale = useTransform(scrollYProgress, [0, 0.55, 1.0], [0.9, 1.0, 1.0]);

  // Kartu foto tetap terlihat jelas dan membingkai teks dan logo di sekelilingnya sampai akhir
  const cardsOpacity = useTransform(scrollYProgress, [0, 0.2, 1.0], [0.85, 1.0, 1.0]);

  // Central Content Reveal (Logo squircle + Headline + Deskripsi + Tombol CTA):
  // Mekar di tengah seiring kartu foto menyebar, dan TETAP UTUH & TERANG BENDERANG (OPACITY 1.0) SAMPAI AKHIR
  const centerOpacity = useTransform(
    scrollYProgress,
    [0, 0.08, 0.40, 1.0],
    [0, 0, 1.0, 1.0]
  );
  const centerScale = useTransform(
    scrollYProgress,
    [0, 0.08, 0.45, 1.0],
    [0.88, 0.88, 1.0, 1.0]
  );
  const centerY = useTransform(
    scrollYProgress,
    [0, 0.08, 0.45, 1.0],
    [24, 24, 0, 0]
  );

  if (kurangiGerak) {
    return (
      <section className={styles.tedySectionReduced} data-testid="penutup-kinetic-orbit">
        <div className={styles.tedyCenterContent}>
          <span className={styles.closingAppIcon}>
            <MapPin size={37} strokeWidth={1.6} aria-hidden="true" />
          </span>
          {children}
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      className={styles.tedySection}
      data-testid="penutup-kinetic-orbit"
    >
      <div className={styles.tedySticky}>
        <div className={styles.tedyStage}>
          {/* Konten Utama di Tengah: Logo, Headline, Subtitle, dan Tombol Saja */}
          <motion.div
            className={styles.tedyCenterContent}
            style={{
              opacity: centerOpacity,
              scale: centerScale,
              y: centerY,
            }}
          >
            <span className={styles.closingAppIcon}>
              <MapPin size={37} strokeWidth={1.6} aria-hidden="true" />
            </span>
            {children}
          </motion.div>

          {/* Kartu 1: Menyebar ke Kiri Atas */}
          <motion.div
            className={`${styles.tedyCard} ${styles.tedyCard1}`}
            style={{
              x: card1X,
              y: card1Y,
              rotate: card1Rotate,
              scale: card1Scale,
              opacity: cardsOpacity,
            }}
            aria-hidden="true"
          >
            <Image
              src={TEDY_CARDS[0].foto}
              alt={TEDY_CARDS[0].alt}
              fill
              sizes="(max-width: 768px) 140px, 240px"
              className="object-cover"
              draggable={false}
            />
            <div className={styles.tedyCardOverlay} />
            <span className={styles.tedyCardTag}>{TEDY_CARDS[0].tag}</span>
          </motion.div>

          {/* Kartu 2: Menyebar ke Kiri Bawah */}
          <motion.div
            className={`${styles.tedyCard} ${styles.tedyCard2}`}
            style={{
              x: card2X,
              y: card2Y,
              rotate: card2Rotate,
              scale: card2Scale,
              opacity: cardsOpacity,
            }}
            aria-hidden="true"
          >
            <Image
              src={TEDY_CARDS[1].foto}
              alt={TEDY_CARDS[1].alt}
              fill
              sizes="(max-width: 768px) 140px, 240px"
              className="object-cover"
              draggable={false}
            />
            <div className={styles.tedyCardOverlay} />
            <span className={styles.tedyCardTag}>{TEDY_CARDS[1].tag}</span>
          </motion.div>

          {/* Kartu 3: Menyebar ke Kanan Atas */}
          <motion.div
            className={`${styles.tedyCard} ${styles.tedyCard3}`}
            style={{
              x: card3X,
              y: card3Y,
              rotate: card3Rotate,
              scale: card3Scale,
              opacity: cardsOpacity,
            }}
            aria-hidden="true"
          >
            <Image
              src={TEDY_CARDS[2].foto}
              alt={TEDY_CARDS[2].alt}
              fill
              sizes="(max-width: 768px) 140px, 240px"
              className="object-cover"
              draggable={false}
            />
            <div className={styles.tedyCardOverlay} />
            <span className={styles.tedyCardTag}>{TEDY_CARDS[2].tag}</span>
          </motion.div>

          {/* Kartu 4: Menyebar ke Kanan Bawah */}
          <motion.div
            className={`${styles.tedyCard} ${styles.tedyCard4}`}
            style={{
              x: card4X,
              y: card4Y,
              rotate: card4Rotate,
              scale: card4Scale,
              opacity: cardsOpacity,
            }}
            aria-hidden="true"
          >
            <Image
              src={TEDY_CARDS[3].foto}
              alt={TEDY_CARDS[3].alt}
              fill
              sizes="(max-width: 768px) 140px, 240px"
              className="object-cover"
              draggable={false}
            />
            <div className={styles.tedyCardOverlay} />
            <span className={styles.tedyCardTag}>{TEDY_CARDS[3].tag}</span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Alias for backwards compatibility
export { PenutupTedyScroll as PenutupKineticOrbit };


