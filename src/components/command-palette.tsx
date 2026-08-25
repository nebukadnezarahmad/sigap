"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  LogOut,
  Map,
  MapPin,
  Moon,
  Plus,
  Scale,
  ShieldCheck,
  Sun,
  BarChart3,
  BookOpen,
  FileText,
  GraduationCap,
  Phone,
  Recycle,
  Store,
  Trophy,
  Users,
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

export function CommandPalette() {
  const router = useRouter();
  const { user, profil } = useUser();
  const gelap = useTheme();
  const [buka, setBuka] = useState(false);
  const [kueri, setKueri] = useState("");
  const [kursor, setKursor] = useState(0);

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
        id: "polling",
        label: "Polling warga",
        hint: "Komunitas",
        ikon: <BarChart3 size={16} />,
        jalankan: () => router.push("/polling"),
      },
      {
        id: "aksi",
        label: "Aksi bersama",
        hint: "Komunitas",
        ikon: <Users size={16} />,
        jalankan: () => router.push("/aksi"),
      },
      {
        id: "edukasi",
        label: "Edukasi & quiz lingkungan",
        hint: "Komunitas",
        ikon: <GraduationCap size={16} />,
        jalankan: () => router.push("/edukasi"),
      },
      {
        id: "pasar",
        label: "Pasar ReUse — barang bekas warga",
        hint: "Komunitas",
        ikon: <Recycle size={16} />,
        jalankan: () => router.push("/pasar"),
      },
      {
        id: "layanan",
        label: "Direktori layanan penting",
        hint: "Komunitas",
        ikon: <Phone size={16} />,
        jalankan: () => router.push("/layanan"),
      },
      {
        id: "umkm",
        label: "UMKM warga",
        hint: "Komunitas",
        ikon: <Store size={16} />,
        jalankan: () => router.push("/umkm"),
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
        jalankan: () => createClient().auth.signOut(),
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

  return (
    <AnimatePresence>
      {buka && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1200] flex items-start justify-center pt-[14vh]"
        >
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setBuka(false)}
          />
          <motion.div
            initial={{ y: -14, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: -10, opacity: 0 }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border garis-halus bg-panel shadow-2xl"
            role="dialog"
            aria-label="Command palette"
          >
            <div className="flex items-center gap-2 border-b garis-halus px-4">
              <Plus size={15} className="text-muted" />
              <input
                autoFocus
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
                className="w-full bg-transparent py-3.5 text-sm outline-none placeholder:text-muted/70"
                aria-label="Cari perintah"
              />
              <kbd className="rounded-md border garis-halus px-1.5 py-0.5 text-[10px] text-muted">
                ESC
              </kbd>
            </div>
            <ul className="max-h-72 overflow-y-auto p-2">
              {hasil.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-muted">
                  Tidak ada perintah cocok.
                </li>
              )}
              {hasil.map((a, i) => (
                <li key={a.id}>
                  <button
                    onClick={() => {
                      setBuka(false);
                      a.jalankan();
                    }}
                    onMouseEnter={() => setKursor(i)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition",
                      i === kursor
                        ? "bg-daun-600/10 text-daun-800 dark:text-daun-200"
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
  );
}
