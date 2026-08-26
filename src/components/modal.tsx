"use client";

import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useCallback, useEffect, useId, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Dialog modal SIGAP.
 *
 * Sebelumnya dialog ini tidak memerangkap fokus, tidak memindahkan fokus ke
 * dalam dialog saat dibuka, tidak mengembalikannya ke pemicu saat ditutup, dan
 * membiarkan latar tetap bisa dijelajahi pembaca layar. Semua itu ditutup di
 * sini — sekali, untuk seluruh aplikasi.
 */

const PILIH_FOKUSABEL = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

type PropModal = {
  terbuka: boolean;
  tutup: () => void;
  judul: string;
  children: React.ReactNode;
  lebar?: string;
  /** Baris aksi yang menempel di dasar dialog. Opsional. */
  footer?: React.ReactNode;
  /** Dialog kecil (konfirmasi) — padding lebih rapat daripada dialog formulir. */
  padat?: boolean;
};

export function Modal(props: PropModal) {
  return (
    <AnimatePresence>{props.terbuka && <IsiModal {...props} />}</AnimatePresence>
  );
}

function IsiModal({
  tutup,
  judul,
  children,
  lebar = "max-w-lg",
  footer,
  padat = false,
}: PropModal) {
  const rujukanDialog = useRef<HTMLDivElement>(null);
  const idJudul = useId();

  /* Escape menutup dialog. */
  useEffect(() => {
    function padaTombol(e: KeyboardEvent) {
      if (e.key === "Escape") tutup();
    }
    window.addEventListener("keydown", padaTombol);
    return () => window.removeEventListener("keydown", padaTombol);
  }, [tutup]);

  /* Kunci gulir halaman selama dialog terbuka. */
  useEffect(() => {
    const sebelumnya = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = sebelumnya;
    };
  }, []);

  /*
   * Fokus: simpan pemicu, pindahkan fokus ke dialog, nonaktifkan latar dengan
   * `inert` supaya pembaca layar tidak menembus ke belakang dialog, lalu
   * kembalikan fokus ke pemicu saat dialog dilepas.
   */
  useEffect(() => {
    const pemicu =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const dialog = rujukanDialog.current;
    dialog?.focus();

    const dilumpuhkan: HTMLElement[] = [];
    for (const anak of Array.from(document.body.children)) {
      if (!(anak instanceof HTMLElement)) continue;
      if (dialog && anak.contains(dialog)) continue;
      if (anak.hasAttribute("inert")) continue;
      anak.setAttribute("inert", "");
      dilumpuhkan.push(anak);
    }

    return () => {
      for (const anak of dilumpuhkan) anak.removeAttribute("inert");
      pemicu?.focus();
    };
  }, []);

  /* Perangkap Tab: putar fokus di dalam dialog. */
  const padaTab = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab") return;
    const dialog = rujukanDialog.current;
    if (!dialog) return;

    const fokusabel = Array.from(
      dialog.querySelectorAll<HTMLElement>(PILIH_FOKUSABEL)
    ).filter((el) => el.offsetWidth > 0 || el.offsetHeight > 0);

    if (fokusabel.length === 0) {
      e.preventDefault();
      dialog.focus();
      return;
    }

    const pertama = fokusabel[0];
    const terakhir = fokusabel[fokusabel.length - 1];
    const aktif = document.activeElement;

    if (e.shiftKey && (aktif === pertama || aktif === dialog)) {
      e.preventDefault();
      terakhir.focus();
      return;
    }
    if (!e.shiftKey && aktif === terakhir) {
      e.preventDefault();
      pertama.focus();
    }
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-[1000] flex items-end justify-center p-0 sm:items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
        onClick={tutup}
      />
      <motion.div
        ref={rujukanDialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idJudul}
        tabIndex={-1}
        onKeyDown={padaTab}
        className={cn(
          "relative max-h-[92dvh] w-full overflow-y-auto rounded-t-panel bg-panel shadow-modal outline-none sm:rounded-panel",
          lebar
        )}
        initial={{ y: 60, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 40, opacity: 0, scale: 0.98 }}
        transition={{ type: "spring", damping: 26, stiffness: 320 }}
      >
        <div
          className={cn(
            "sticky top-0 z-10 flex items-start justify-between gap-4 border-b garis-halus bg-panel/95 backdrop-blur",
            padat ? "px-5 py-3.5" : "px-6 py-4"
          )}
        >
          <h2 id={idJudul} className="font-bold">
            {judul}
          </h2>
          <button
            type="button"
            onClick={tutup}
            aria-label="Tutup dialog"
            className="-mr-1.5 -mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-kontrol text-muted transition hover:bg-panel-2 hover:text-ink focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-fokus"
          >
            <X size={18} />
          </button>
        </div>

        <div className={cn(padat ? "px-5 py-4" : "px-6 py-5")}>{children}</div>

        {footer && (
          <div
            className={cn(
              "sticky bottom-0 z-10 flex flex-wrap items-center justify-end gap-2 border-t garis-halus bg-panel/95 backdrop-blur",
              padat ? "px-5 py-3" : "px-6 py-3.5"
            )}
          >
            {footer}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
