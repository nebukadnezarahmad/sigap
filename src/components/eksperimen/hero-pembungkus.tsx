"use client";

import dynamic from "next/dynamic";

// next/dynamic + ssr:false hanya boleh di Client Component.
// Dipisah agar halaman server (page.tsx) bisa impor langsung.
export const HeroPembungkus = dynamic(
  () =>
    import("@/components/eksperimen/hero-gradient").then((m) => m.HeroGradient),
  {
    ssr: false,
    loading: () => (
      <section
        aria-label="Pengantar SIGAP"
        className="relative flex h-[70vh] min-h-[520px] w-full items-center overflow-hidden bg-[#1d1d1f]"
      >
        <div className="mx-auto w-full max-w-6xl px-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
            SIGAP · Lapor · Pantau · Tuntas
          </p>
          <p className="mt-3 max-w-2xl font-serif text-4xl font-semibold text-white sm:text-6xl">
            Memuat visual...
          </p>
        </div>
      </section>
    ),
  }
);
