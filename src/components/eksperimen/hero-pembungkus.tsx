"use client";

import dynamic from "next/dynamic";

// Fallback visual opt-in. Homepage membuka langsung pada artefak peta.
export const HeroPembungkus = dynamic(
  () =>
    import("@/components/eksperimen/hero-gradient").then((m) => m.HeroGradient),
  {
    ssr: false,
    loading: () => (
      <section
        aria-label="Pengantar SIGAP"
        aria-busy="true"
        className="relative flex h-[70vh] min-h-[520px] w-full items-center overflow-hidden bg-[#1d1d1f]"
      >
        <div className="mx-auto w-full max-w-6xl px-4">
          <p className="text-xs font-semibold text-white/70">
            SIGAP · Lapor · Pantau · Tuntas
          </p>
          <p className="mt-3 max-w-2xl font-serif text-4xl font-semibold text-white sm:text-6xl">
            Memuat visual pilihan SIGAP...
          </p>
        </div>
      </section>
    ),
  }
);
