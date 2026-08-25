"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Compass, History, MapPin, Map as IkonPeta } from "lucide-react";
import { Button } from "@/components/ui";

const LANGKAH = [
  {
    Ikon: IkonPeta,
    judul: "Selamat datang di peta SIGAP",
    isi: "Setiap pin adalah laporan warga — warnanya menunjukkan jenis masalahnya.",
  },
  {
    Ikon: Compass,
    judul: "Saring sesukamu",
    isi: "Gunakan chip kategori/status, pencarian, atau 'Di sekitar saya' untuk fokus pada lingkunganmu.",
  },
  {
    Ikon: History,
    judul: "Putar garis waktu",
    isi: "Lihat bagaimana warga dan dewan menyelesaikan masalah dari bulan ke bulan.",
  },
  {
    Ikon: MapPin,
    judul: "Siap melapor?",
    isi: "Klik 'Laporkan Masalah', tempel pin di peta, selesai dalam 30 detik.",
  },
];

export function TurPeta() {
  const [langkah, setLangkah] = useState<number | null>(null);

  useEffect(() => {
    if (localStorage.getItem("sigap-tour")) return;
    const t = setTimeout(() => setLangkah(0), 1200);
    return () => clearTimeout(t);
  }, []);

  function selesai() {
    localStorage.setItem("sigap-tour", "1");
    setLangkah(null);
  }

  return (
    <AnimatePresence>
      {langkah !== null && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          className="fixed bottom-5 left-5 z-[1100] w-80 rounded-2xl border garis-halus bg-panel p-5 shadow-2xl"
          role="dialog"
          aria-label="Panduan singkat"
        >
          <div className="mb-2 flex items-center gap-2">
            {LANGKAH.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-[width,background-color] ${
                  i === langkah ? "w-6 bg-daun-600" : "w-1.5 bg-line"
                }`}
              />
            ))}
          </div>
          <span className="mb-1 flex size-10 items-center justify-center rounded-xl bg-daun-600/10 text-daun-700 dark:text-daun-300">
            {(() => {
              const Ikon = LANGKAH[langkah].Ikon;
              return <Ikon size={20} strokeWidth={1.8} />;
            })()}
          </span>
          <h3 className="mt-2 font-display text-lg font-bold">
            {LANGKAH[langkah].judul}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            {LANGKAH[langkah].isi}
          </p>
          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={selesai}
              className="text-xs font-semibold text-muted hover:text-ink"
            >
              Lewati
            </button>
            <Button
              size="sm"
              onClick={() =>
                langkah >= LANGKAH.length - 1 ? selesai() : setLangkah(langkah + 1)
              }
            >
              {langkah >= LANGKAH.length - 1 ? "Mengerti" : "Lanjut"}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
