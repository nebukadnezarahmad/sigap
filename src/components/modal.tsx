"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { animasiModal, transisiCepat, transisiModal } from "@/lib/motion";
import { IconButton } from "@/components/ui";

const emptySubscribe = () => () => {};

const FOKUS_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({
  terbuka,
  tutup,
  judul,
  deskripsiId,
  children,
  lebar = "max-w-lg",
}: {
  terbuka: boolean;
  tutup: () => void;
  judul: string;
  deskripsiId?: string;
  children: React.ReactNode;
  lebar?: string;
}) {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const refDialog = useRef<HTMLDivElement>(null);
  const refPemicu = useRef<Element | null>(null);

  useEffect(() => {
    if (!terbuka) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        tutup();
        return;
      }
      if (e.key === "Tab") {
        const dialog = refDialog.current;
        if (!dialog) return;
        const daftar = Array.from(
          dialog.querySelectorAll<HTMLElement>(FOKUS_SELECTOR)
        ).filter((el) => el.getClientRects().length > 0);
        if (daftar.length === 0) {
          e.preventDefault();
          dialog.focus();
          return;
        }
        const pertama = daftar[0];
        const terakhir = daftar[daftar.length - 1];
        if (e.shiftKey && document.activeElement === pertama) {
          e.preventDefault();
          terakhir.focus();
        } else if (!e.shiftKey && document.activeElement === terakhir) {
          e.preventDefault();
          pertama.focus();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [terbuka, tutup]);

  useEffect(() => {
    if (!terbuka) return;
    refPemicu.current = document.activeElement;
    const lebarScrollbar =
      window.innerWidth - document.documentElement.clientWidth;
    const asalOverflow = document.body.style.overflow;
    const asalPadding = document.body.style.paddingRight;
    document.body.style.overflow = "hidden";
    if (lebarScrollbar > 0) {
      document.body.style.paddingRight = `${lebarScrollbar}px`;
    }
    const t = window.setTimeout(() => {
      const dialog = refDialog.current;
      if (!dialog) return;
      const target = dialog.querySelector<HTMLElement>(FOKUS_SELECTOR);
      (target ?? dialog).focus();
    }, 0);
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = asalOverflow;
      document.body.style.paddingRight = asalPadding;
      const pemicu = refPemicu.current as HTMLElement | null;
      pemicu?.focus?.();
    };
  }, [terbuka]);

  if (!isClient) return null;

  return createPortal(
    <AnimatePresence>
      {terbuka && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center overflow-y-auto sm:items-center sm:p-6">
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transisiCepat}
            onClick={tutup}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={judul}
            aria-describedby={deskripsiId}
            ref={refDialog}
            tabIndex={-1}
            className={cn(
              "relative z-10 mt-auto w-full max-h-[92dvh] overflow-y-auto rounded-b-none rounded-t-3xl border garis-halus bg-panel p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] focus:outline-none sm:my-auto sm:rounded-3xl",
              lebar
            )}
            initial={animasiModal.initial}
            animate={animasiModal.animate}
            exit={animasiModal.exit}
            transition={transisiModal}
          >
            <div
              aria-hidden="true"
              className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-line sm:hidden"
            />
            <div className="mb-4 flex items-start justify-between gap-4 border-b garis-halus pb-3">
              <h2 className="font-display text-lg sm:text-xl font-semibold">{judul}</h2>
              <IconButton aria-label="Tutup" ukuran="sm" onClick={tutup}>
                <X size={18} />
              </IconButton>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

