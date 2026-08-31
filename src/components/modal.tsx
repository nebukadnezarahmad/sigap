"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const emptySubscribe = () => () => {};

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

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") tutup();
    }
    if (terbuka) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [terbuka, tutup]);

  useEffect(() => {
    if (terbuka) {
      const scrollY = window.scrollY;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
        window.scrollTo(0, scrollY);
      };
    }
  }, [terbuka]);

  if (!isClient) return null;

  return createPortal(
    <AnimatePresence>
      {terbuka && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto p-4 sm:p-6">
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={tutup}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={judul}
            className={cn(
              "relative z-10 my-auto w-full max-h-[88vh] overflow-y-auto rounded-3xl border garis-halus bg-panel p-6 shadow-2xl",
              lebar
            )}
            initial={{ y: 24, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", damping: 28, stiffness: 340 }}
          >
            <div className="mb-4 flex items-start justify-between gap-4 border-b garis-halus pb-3">
              <h2 className="font-display text-lg sm:text-xl font-bold">{judul}</h2>
              <button
                onClick={tutup}
                aria-label="Tutup modal"
                className="rounded-full p-1.5 text-muted transition hover:bg-panel-2 hover:text-ink focus-visible:ring-2 focus-visible:ring-daun-500"
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

