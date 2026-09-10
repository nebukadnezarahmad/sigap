"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Compass, History, MapPin, Map as IkonPeta } from "lucide-react";
import { Button } from "@/components/ui";
import { animasiModal, transisiModal } from "@/lib/motion";

const LANGKAH = [
  {
    Ikon: IkonPeta,
    judul: "Selamat datang di peta SIGAP",
    isi: "Setiap pin adalah laporan warga. Warnanya menunjukkan jenis masalahnya.",
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
    isi: "Pilih 'Laporkan Masalah', tempel pin di peta. Sekitar 2 menit, foto opsional tapi membantu.",
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
          className="fixed bottom-5 left-5 z-[1100] inline-flex min-h-11 items-center gap-2 rounded-full border garis-halus bg-panel/95 px-4 text-sm font-semibold shadow-xl backdrop-blur transition hover:border-action"
        >
          <Compass size={16} aria-hidden /> Pemandu peta
        </button>
      )}
      <AnimatePresence>
        {aktif && (
          <>
            <button
              type="button"
              aria-label="Tutup pemandu peta"
              onClick={tutup}
              className="fixed inset-0 z-[1050] cursor-default bg-black/40"
            />
            <motion.div
              ref={refDialog}
              tabIndex={-1}
              initial={animasiModal.initial}
              animate={animasiModal.animate}
              exit={animasiModal.exit}
              transition={transisiModal}
            className="fixed bottom-5 left-5 z-[1100] w-80 rounded-2xl border garis-halus bg-panel p-5 shadow-2xl outline-none"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tur-peta-judul"
            aria-describedby="tur-peta-isi"
          >
            <div className="mb-2 flex items-center gap-2" aria-hidden>
              {LANGKAH.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-[width,background-color] ${
                    i === langkah ? "w-6 bg-action" : "w-1.5 bg-line"
                  }`}
                />
              ))}
            </div>
            <span className="mb-1 flex size-10 items-center justify-center rounded-xl bg-action/10 text-action">
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
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full px-4 text-sm font-semibold text-muted transition hover:text-ink"
              >
                Lewati
              </button>
              <Button
                size="md"
                className="min-h-11 min-w-11"
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
          </>
        )}
      </AnimatePresence>
    </>
  );
}
