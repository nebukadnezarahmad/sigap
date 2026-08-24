"use client";

import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

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
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") tutup();
    }
    if (terbuka) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [terbuka, tutup]);

  useEffect(() => {
    document.body.style.overflow = terbuka ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [terbuka]);

  return (
    <AnimatePresence>
      {terbuka && (
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
            role="dialog"
            aria-modal="true"
            aria-label={judul}
            className={cn(
              "relative w-full rounded-t-3xl border garis-halus bg-panel p-6 shadow-2xl sm:rounded-3xl max-h-[92dvh] overflow-y-auto",
              lebar
            )}
            initial={{ y: 60, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <h2 className="font-display text-xl font-bold">{judul}</h2>
              <button
                onClick={tutup}
                aria-label="Tutup"
                className="rounded-full p-1.5 text-muted transition hover:bg-panel-2 hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
