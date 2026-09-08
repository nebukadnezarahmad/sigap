"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, type ReactNode } from "react";

// ShaderGradient dimuat dinamis tanpa SSR agar ringan di server
// (pola yang sama dipakai hero-pembungkus.tsx untuk HeroGradient).
const ShaderGradientCanvas = dynamic(
  () => import("@shadergradient/react").then((m) => m.ShaderGradientCanvas),
  { ssr: false }
);
const ShaderGradient = dynamic(
  () => import("@shadergradient/react").then((m) => m.ShaderGradient),
  { ssr: false }
);

// Palet civic yang sama dengan hero-gradient.tsx:
// arang netral -> biru civic -> kabut terang. Disengaja kalem.
const WARNA = {
  arang: "#1d1d1f",
  biru: "#0066cc",
  kabut: "#f5f5f7",
} as const;

// Pola yang sama dipakai di hero-gradient.tsx:
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

type PitaGradientProps = {
  children: ReactNode;
  tone?: "gelap" | "terang";
  animated?: boolean;
};

export function PitaGradient({
  children,
  tone = "gelap",
  animated = false,
}: PitaGradientProps) {
  const reducedMotion = useReducedMotion();
  const gelap = tone === "gelap";
  const tampilkanShader = animated && !reducedMotion;

  return (
    <section
      className={
        gelap
          ? "relative w-full overflow-hidden bg-ap-tile1 text-white"
          : "relative w-full overflow-hidden bg-ap-parchment text-ap-ink"
      }
    >
      {tampilkanShader && (
        <div aria-hidden className="pointer-events-none absolute inset-0">
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

      {/* Scrim agar isi pita selalu kontras di atas gradient. */}
      {tampilkanShader && (
        <div
          aria-hidden
          className={
            gelap
              ? "pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/35 to-black/25"
              : "pointer-events-none absolute inset-0 bg-gradient-to-t from-white/75 via-white/45 to-white/25"
          }
        />
      )}

      <div className="relative z-10 mx-auto flex min-h-[320px] w-full max-w-4xl flex-col justify-center px-4 py-12">
        {children}
      </div>
    </section>
  );
}
