"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
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
  const params = useSearchParams();
  const refPemicu = useRef<HTMLButtonElement>(null);
  const refDialog = useRef<HTMLDivElement>(null);
  const sudahOtomatis = useRef(false);
  const mintaFokusPemicu = useRef(false);

  // Tur TIDAK auto-open. Hanya tampil saat diminta eksplisit: tombol
  // "Pemandu peta" di bawah, atau parameter ?pemandu=1 (sekali saja).
  useEffect(() => {
    if (!sudahOtomatis.current && params.get("pemandu") === "1") {
      sudahOtomatis.current = true;
      setLangkah(0);
    }
  }, [params]);

  const selesai = useCallback(() => {
    localStorage.setItem("sigap-tour", "1");
    setLangkah(null);
  }, []);

  function tutup() {
    mintaFokusPemicu.current = true;
    selesai();
  }

  // Kembalikan fokus ke tombol pemicu setelah dialog ditutup (bukan saat
  // mount awal, agar tidak mencuri fokus ketika halaman dimuat).
  useEffect(() => {
    if (langkah === null && mintaFokusPemicu.current) {
      mintaFokusPemicu.current = false;
      refPemicu.current?.focus();
    }
  }, [langkah]);

  // ESC menutup + fokus terkelola: fokus awal ke dialog, Tab terperangkap
  // di dalam dialog selama terbuka.
  useEffect(() => {
    if (langkah === null) return;
    refDialog.current?.focus();
    function onKey(e: globalThis.KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        tutup();
        return;
      }
      if (e.key !== "Tab") return;
      const dialog = refDialog.current;
      if (!dialog) return;
      const fokusabel = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
        )
      ).filter((el) => !el.hasAttribute("disabled"));
      if (fokusabel.length === 0) return;
      const pertama = fokusabel[0];
      const terakhir = fokusabel[fokusabel.length - 1];
      if (e.shiftKey && document.activeElement === pertama) {
        e.preventDefault();
        terakhir.focus();
      } else if (!e.shiftKey && document.activeElement === terakhir) {
        e.preventDefault();
        pertama.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [langkah, selesai]);

  const aktif = langkah !== null;

  return (
    <>
      {!aktif && (
        <button
          ref={refPemicu}
          type="button"
          onClick={() => setLangkah(0)}
          className="fixed bottom-5 left-5 z-[1100] inline-flex min-h-11 items-center gap-2 rounded-full border border-ap-hairline bg-white/85 px-4 text-sm font-semibold text-ap-ink shadow-none backdrop-blur transition hover:border-ap-blue/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus! motion-reduce:transition-none dark:border-white/15 dark:bg-[#131d19]/80 dark:text-ink"
        >
          <Compass size={16} aria-hidden /> Pemandu peta
        </button>
      )}
      <AnimatePresence>
        {aktif && (
          <motion.div
            ref={refDialog}
            tabIndex={-1}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="fixed bottom-5 left-5 z-[1100] w-80 rounded-[18px] border border-ap-hairline bg-white p-5 text-ap-ink shadow-none outline-none dark:border-line dark:bg-panel dark:text-ink"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tur-peta-judul"
            aria-describedby="tur-peta-isi"
          >
            <div className="mb-2 flex items-center gap-2" aria-hidden>
              {LANGKAH.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-[width,background-color] motion-reduce:transition-none ${
                    i === langkah ? "w-6 bg-ap-blue" : "w-1.5 bg-line"
                  }`}
                />
              ))}
            </div>
            <span className="mb-1 flex size-10 items-center justify-center rounded-lg bg-ap-blue/10 text-ap-blue dark:bg-ap-sky/15 dark:text-ap-sky">
              {(() => {
                const Ikon = LANGKAH[langkah].Ikon;
                return <Ikon size={20} strokeWidth={1.8} aria-hidden />;
              })()}
            </span>
            <h3
              id="tur-peta-judul"
              className="mt-2 font-display text-lg font-bold"
            >
              {LANGKAH[langkah].judul}
            </h3>
            <p
              id="tur-peta-isi"
              className="mt-1 text-sm leading-relaxed text-muted"
            >
              {LANGKAH[langkah].isi}
            </p>
            <div className="mt-4 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={tutup}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full px-4 text-sm font-semibold text-muted transition hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus! motion-reduce:transition-none"
              >
                Lewati
              </button>
              <Button
                size="md"
                className="min-h-11 min-w-11 border-transparent bg-ap-blue text-white shadow-none hover:bg-ap-blue-focus hover:shadow-none focus-visible:outline-ap-blue-focus! dark:border-transparent dark:bg-ap-blue dark:text-white dark:hover:bg-ap-blue-focus"
                onClick={() =>
                  langkah >= LANGKAH.length - 1
                    ? tutup()
                    : setLangkah(langkah + 1)
                }
              >
                {langkah >= LANGKAH.length - 1 ? "Mengerti" : "Lanjut"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
