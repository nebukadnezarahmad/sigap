"use client";

import { useEffect, useId, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const emptySubscribe = () => () => {};

const FOKUS_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({
  terbuka,
  tutup,
  judul,
  children,
  lebar = "max-w-lg",
}: {
  terbuka: boolean;
  tutup: () => void;
  judul: string;
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
  const idJudul = useId();
  const refTutup = useRef(tutup);

  useEffect(() => {
    refTutup.current = tutup;
  }, [tutup]);

  useEffect(() => {
    if (!terbuka) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        refTutup.current();
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
        if (!dialog.contains(document.activeElement)) {
          e.preventDefault();
          (e.shiftKey ? terakhir : pertama).focus();
        } else if (e.shiftKey && document.activeElement === pertama) {
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
  }, [terbuka]);

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
      const target = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOKUS_SELECTOR)
      ).find((el) => el.getClientRects().length > 0);
      (target ?? dialog).focus();
    }, 0);
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = asalOverflow;
      document.body.style.paddingRight = asalPadding;
      const pemicu = refPemicu.current as HTMLElement | null;
      if (pemicu?.isConnected) pemicu.focus();
      refPemicu.current = null;
    };
  }, [terbuka]);

  function tutupModal() {
    refTutup.current();
  }

  if (!isClient) return null;

  return createPortal(
    <AnimatePresence>
      {terbuka && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto overscroll-contain p-[calc(1rem+env(safe-area-inset-top,0px))] pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pl-[calc(1rem+env(safe-area-inset-left,0px))] pr-[calc(1rem+env(safe-area-inset-right,0px))] sm:pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] sm:pl-[calc(1.5rem+env(safe-area-inset-left,0px))] sm:pr-[calc(1.5rem+env(safe-area-inset-right,0px))] sm:pt-[calc(1.5rem+env(safe-area-inset-top,0px))]">
          <motion.button
            className="fixed inset-0 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            type="button"
            tabIndex={-1}
            aria-label="Tutup modal"
            onClick={tutupModal}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={idJudul}
            ref={refDialog}
            tabIndex={-1}
            className={cn(
              "relative z-10 my-auto w-full max-h-[calc(100dvh-2rem-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px))] overflow-y-auto overscroll-contain rounded-[18px] border border-ap-hairline bg-white/85 p-6 shadow-none backdrop-blur-xl backdrop-saturate-150 focus:outline-none dark:border-white/15 dark:bg-[#131d19]/85",
              lebar
            )}
            initial={{ y: 24, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", damping: 28, stiffness: 340 }}
          >
            <div className="mb-4 flex items-start justify-between gap-4 border-b border-ap-hairline pb-3 dark:border-white/10">
              <h2 id={idJudul} className="font-display text-lg font-semibold sm:text-xl">
                {judul}
              </h2>
              <button
                type="button"
                onClick={tutupModal}
                aria-label="Tutup modal"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-muted transition hover:bg-panel-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus! motion-reduce:transition-none"
              >
                <X size={18} />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
