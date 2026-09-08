"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShaderGradient, ShaderGradientCanvas } from "@shadergradient/react";

// Palet sunset civic: arang netral -> biru civic -> kabut terang.
// Disengaja kalem (bukan neon) agar selaras dengan identitas SIGAP.
const WARNA = {
  arang: "#1d1d1f",
  biru: "#0066cc",
  kabut: "#f5f5f7",
} as const;

// Pola yang sama dipakai di landing-visual.tsx (AngkaHidup):
// hormati prefers-reduced-motion dari OS/pengguna.
function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return;
    }
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

function IsiHero() {
  return (
    <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-center px-4">
      <p className="text-xs font-semibold text-white/70">
        SIGAP · Lapor · Pantau · Tuntas
      </p>
      <h1 className="mt-3 max-w-2xl font-serif text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl">
        Suara warga, terlihat di peta. Penanganan tercatat transparan.
      </h1>
      <p className="mt-5 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
        Tandai masalah lingkungan di sekitarmu dalam 30 detik, kumpulkan
        dukungan tetangga, dan pantau janji penanganan sampai tuntas.
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Link
          href="/peta?lapor=1"
          className="rounded-full bg-white px-6 py-3 text-base font-semibold text-[#1d1d1f] shadow-lg transition-colors duration-300 hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Laporkan masalah
        </Link>
        <Link
          href="/transparansi"
          className="rounded-full border border-white/40 bg-white/10 px-6 py-3 text-base font-semibold text-white backdrop-blur-sm transition-colors duration-300 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Lihat transparansi
        </Link>
      </div>
    </div>
  );
}

// Opt-in visual fallback. It is not part of the homepage product opening.
export function HeroGradient() {
  const reducedMotion = useReducedMotion();

  return (
    <section
      aria-label="Pengantar SIGAP"
      className="relative h-[70vh] min-h-[520px] w-full overflow-hidden bg-[#1d1d1f]"
    >
      {reducedMotion ? (
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${WARNA.arang} 0%, ${WARNA.biru} 55%, ${WARNA.kabut} 130%)`,
          }}
        />
      ) : (
        <div aria-hidden className="absolute inset-0">
          <ShaderGradientCanvas pixelDensity={1} pointerEvents="none">
            <ShaderGradient
              type="waterPlane"
              animate="on"
              color1={WARNA.arang}
              color2={WARNA.biru}
              color3={WARNA.kabut}
              uSpeed={0.3}
              uStrength={2.2}
              uDensity={1}
              uFrequency={4.5}
              reflection={0.1}
              wireframe={false}
              shader="defaults"
              cAzimuthAngle={180}
              cPolarAngle={90}
              cDistance={3.6}
              cameraZoom={1}
              brightness={1}
              lightType="env"
              envPreset="city"
              grain="off"
              positionX={-1.4}
              positionY={0}
              positionZ={0}
              rotationX={0}
              rotationY={10}
              rotationZ={50}
            />
          </ShaderGradientCanvas>
        </div>
      )}

      {/* Scrim gelap agar teks putih selalu kontras di atas gradient. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/35 to-black/25"
      />

      <IsiHero />
    </section>
  );
}
