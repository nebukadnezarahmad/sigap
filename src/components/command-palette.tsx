"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { animasiModal, transisiCepat, transisiModal } from "@/lib/motion";
import {
  ArrowRight,
  LogOut,
  Map,
  MapPin,
  Moon,
  Plus,
  Scale,
  Search,
  ShieldCheck,
  Sun,
  BookOpen,
  FileText,
  Trophy,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/use-user";
import { useTheme, toggleTema } from "@/lib/use-theme";
import { cn } from "@/lib/utils";

type Aksi = {
  id: string;
  label: string;
  hint: string;
  ikon: React.ReactNode;
  jalankan: () => void;
};

const FOKUS_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function CommandPalette() {
  const router = useRouter();
  const { user, profil } = useUser();
  const gelap = useTheme();
  const [buka, setBuka] = useState(false);
  const [kueri, setKueri] = useState("");
  const [kursor, setKursor] = useState(0);
  const refPemicu = useRef<HTMLButtonElement>(null);
  const refDialog = useRef<HTMLDivElement>(null);
  const refInput = useRef<HTMLInputElement>(null);
  const refFokusTerakhir = useRef<Element | null>(null);

  const aksi: Aksi[] = useMemo(() => {
    const dasar: Aksi[] = [
      {
        id: "peta",
        label: "Buka peta interaktif",
        hint: "Navigasi",
        ikon: <Map size={16} />,
        jalankan: () => router.push("/peta"),
      },
      {
        id: "skor",
        label: "Papan skor warga",
        hint: "Navigasi",
        ikon: <Trophy size={16} />,
        jalankan: () => router.push("/papan-skor"),
      },
      {
        id: "transparansi",
        label: "Transparansi kinerja dewan",
        hint: "Navigasi",
        ikon: <Scale size={16} />,
        jalankan: () => router.push("/transparansi"),
      },
      {
        id: "lapor",
        label: "Laporkan masalah baru",
        hint: "Aksi",
        ikon: <MapPin size={16} />,
        jalankan: () => router.push("/peta?lapor=1"),
      },
      {
        id: "laporan-saya",
        label: "Laporan saya",
        hint: "Navigasi",
        ikon: <FileText size={16} />,
        jalankan: () => router.push("/laporan-saya"),
      },
      {
        id: "demo",
        label: "Panduan demo untuk juri",
        hint: "Bantuan",
        ikon: <BookOpen size={16} />,
        jalankan: () => router.push("/demo"),
      },
      {
        id: "tema",
        label: gelap ? "Mode terang" : "Mode gelap",
        hint: "Tampilan",
        ikon: gelap ? <Sun size={16} /> : <Moon size={16} />,
        jalankan: () => toggleTema(),
      },
    ];
    if (user) {
      dasar.splice(2, 0, {
        id: "profil",
        label: "Profil saya",
        hint: "Navigasi",
        ikon: <ArrowRight size={16} />,
        jalankan: () => router.push(`/warga/${profil?.username ?? ""}`),
      });
    }
    if (profil?.role === "admin") {
      dasar.push({
        id: "dewan",
        label: "Dashboard dewan",
        hint: "Admin",
        ikon: <ShieldCheck size={16} />,
        jalankan: () => router.push("/dewan"),
      });
    }
    if (user) {
      dasar.push({
        id: "keluar",
        label: "Keluar dari akun",
        hint: "Akun",
        ikon: <LogOut size={16} />,
        jalankan: async () => {
          await createClient().auth.signOut();
          router.push("/");
          router.refresh();
        },
      });
    }
    return dasar;
  }, [gelap, user, profil, router]);

  const hasil = useMemo(() => {
    if (!kueri.trim()) return aksi;
    const q = kueri.toLowerCase();
    return aksi.filter((a) => a.label.toLowerCase().includes(q));
  }, [aksi, kueri]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setBuka((v) => !v);
        setKueri("");
        setKursor(0);
      }
      if (e.key === "Escape") setBuka(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (buka) {
      refFokusTerakhir.current = document.activeElement;
      const t = window.setTimeout(() => refInput.current?.focus(), 0);
      return () => window.clearTimeout(t);
    }
    const pemicu = refFokusTerakhir.current as HTMLElement | null;
    if (refFokusTerakhir.current) {
      pemicu?.focus?.();
      refFokusTerakhir.current = null;
    }
    return undefined;
  }, [buka]);

  function onTrapTab(e: React.KeyboardEvent) {
    if (e.key !== "Tab") return;
    const dialog = refDialog.current;
    if (!dialog) return;
    const daftar = Array.from(
      dialog.querySelectorAll<HTMLElement>(FOKUS_SELECTOR)
    ).filter((el) => el.getClientRects().length > 0);
    if (daftar.length === 0) {
      e.preventDefault();
      refInput.current?.focus();
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

  function bukaPalet() {
    setKueri("");
    setKursor(0);
    setBuka(true);
  }

  return (
    <>
      <button
        ref={refPemicu}
        type="button"
        onClick={bukaPalet}
        aria-label="Buka palet perintah"
        aria-haspopup="dialog"
        aria-expanded={buka}
        className="fixed bottom-4 right-4 z-[1100] flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border garis-halus bg-panel text-muted shadow-xl transition hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
      >
        <Search size={18} />
      </button>
      <AnimatePresence>
      {buka && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={transisiCepat}
          className="fixed inset-0 z-[1200] flex items-start justify-center pt-[14vh]"
        >
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setBuka(false)}
          />
          <motion.div
            initial={animasiModal.initial}
            animate={animasiModal.animate}
            exit={animasiModal.exit}
            transition={transisiModal}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border garis-halus bg-panel shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            ref={refDialog}
            onKeyDown={onTrapTab}
          >
            <div className="flex items-center gap-2 border-b garis-halus px-4">
              <Plus size={15} className="text-muted" />
              <input
                ref={refInput}
                value={kueri}
                onChange={(e) => {
                  setKueri(e.target.value);
                  setKursor(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setKursor((k) => Math.min(hasil.length - 1, k + 1));
                  }
                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setKursor((k) => Math.max(0, k - 1));
                  }
                  if (e.key === "Enter" && hasil[kursor]) {
                    setBuka(false);
                    hasil[kursor].jalankan();
                  }
                }}
                placeholder="Ketik perintah atau tujuan…"
                className="w-full bg-transparent py-3.5 text-sm outline-none placeholder:text-muted/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
                aria-label="Cari perintah"
                role="combobox"
                aria-expanded={buka}
                aria-controls="command-palette-listbox"
                aria-autocomplete="list"
                aria-activedescendant={
                  hasil[kursor] ? `cmd-opt-${hasil[kursor].id}` : undefined
                }
              />
              <kbd className="rounded-md border garis-halus px-1.5 py-0.5 text-[10px] text-muted">
                ESC
              </kbd>
            </div>
            <ul
              id="command-palette-listbox"
              role="listbox"
              aria-label="Hasil perintah"
              className="max-h-72 overflow-y-auto p-2"
            >
              {hasil.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-muted">
                  Tidak ada perintah cocok.
                </li>
              )}
              {hasil.map((a, i) => (
                <li key={a.id} role="presentation">
                  <button
                    id={`cmd-opt-${a.id}`}
                    role="option"
                    aria-selected={i === kursor}
                    onClick={() => {
                      setBuka(false);
                      a.jalankan();
                    }}
                    onMouseEnter={() => setKursor(i)}
                    onFocus={() => setKursor(i)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action",
                      i === kursor
                        ? "bg-action/10 text-action"
                        : "text-ink"
                    )}
                  >
                    <span className="text-muted">{a.ikon}</span>
                    <span className="flex-1 font-medium">{a.label}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                      {a.hint}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </>
  );
}
