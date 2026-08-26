"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  LogOut,
  // Diberi alias: ikon bernama `Map` menutupi konstruktor Map bawaan JS.
  Map as IkonPeta,
  MapPin,
  Moon,
  Scale,
  Search,
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

const ID_DAFTAR = "palet-daftar";
const idOpsi = (i: number) => `palet-opsi-${i}`;

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
        ikon: <IkonPeta size={16} />,
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

  /* Pencarian menyertakan kategori: mengetik "admin" menemukan "Dashboard dewan". */
  const hasil = useMemo(() => {
    const q = kueri.trim().toLowerCase();
    if (!q) return aksi;
    return aksi.filter((a) =>
      `${a.label} ${a.hint}`.toLowerCase().includes(q)
    );
  }, [aksi, kueri]);

  /* Kelompokkan per kategori, tapi simpan indeks datar agar kursor tetap satu sumbu. */
  const kelompok = useMemo(() => {
    const peta = new Map<string, { aksi: Aksi; indeks: number }[]>();
    hasil.forEach((a, i) => {
      const isi = peta.get(a.hint) ?? [];
      isi.push({ aksi: a, indeks: i });
      peta.set(a.hint, isi);
    });
    return Array.from(peta.entries());
  }, [hasil]);

  const kursorAman = Math.min(kursor, Math.max(0, hasil.length - 1));
  const terpilih = hasil[kursorAman];

  useEffect(() => {
    function padaTombol(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setBuka((v) => !v);
        setKueri("");
        setKursor(0);
      }
      if (e.key === "Escape") setBuka(false);
    }
    window.addEventListener("keydown", padaTombol);
    return () => window.removeEventListener("keydown", padaTombol);
  }, []);

  /* Jaga opsi terpilih tetap terlihat saat navigasi panah. */
  useEffect(() => {
    if (!buka) return;
    document
      .getElementById(idOpsi(kursorAman))
      ?.scrollIntoView({ block: "nearest" });
  }, [buka, kursorAman]);

  function jalankan(a: Aksi) {
    setBuka(false);
    a.jalankan();
  }

  return (
    <AnimatePresence>
      {buka && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1200] flex items-start justify-center px-4 pt-[14vh]"
        >
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setBuka(false)}
          />
          <motion.div
            initial={{ y: -14, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: -10, opacity: 0 }}
            className="relative w-full max-w-lg overflow-hidden rounded-panel bg-panel shadow-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Palet perintah"
          >
            <div className="flex items-center gap-2.5 border-b garis-halus px-4">
              <Search size={16} className="shrink-0 text-muted" aria-hidden />
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
                    setKursor(Math.min(hasil.length - 1, kursorAman + 1));
                  }
                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setKursor(Math.max(0, kursorAman - 1));
                  }
                  if (e.key === "Home") {
                    e.preventDefault();
                    setKursor(0);
                  }
                  if (e.key === "End") {
                    e.preventDefault();
                    setKursor(Math.max(0, hasil.length - 1));
                  }
                  if (e.key === "Enter" && terpilih) {
                    e.preventDefault();
                    jalankan(terpilih);
                  }
                }}
                placeholder="Ketik perintah atau tujuan…"
                className="w-full bg-transparent py-3.5 text-sm outline-none placeholder:text-muted/70"
                role="combobox"
                aria-expanded="true"
                aria-controls={ID_DAFTAR}
                aria-activedescendant={
                  terpilih ? idOpsi(kursorAman) : undefined
                }
                aria-autocomplete="list"
                aria-label="Cari perintah atau tujuan"
              />
              <kbd className="shrink-0 rounded-kontrol border garis-halus px-2 py-0.5 text-mikro font-semibold text-muted">
                ESC
              </kbd>
            </div>

            <p aria-live="polite" className="sr-only">
              {hasil.length === 0
                ? "Tidak ada perintah cocok."
                : `${hasil.length} perintah ditemukan.`}
            </p>

            <ul
              id={ID_DAFTAR}
              role="listbox"
              aria-label="Daftar perintah"
              className="max-h-72 overflow-y-auto p-2"
            >
              {hasil.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-muted">
                  Tidak ada perintah cocok. Coba kata lain.
                </li>
              )}
              {kelompok.map(([kategori, isi]) => (
                <li key={kategori} role="presentation">
                  <p className="sticky top-0 z-10 bg-panel px-3 pb-1.5 pt-2 text-mikro font-semibold uppercase text-muted">
                    {kategori}
                  </p>
                  <ul role="group" aria-label={kategori}>
                    {isi.map(({ aksi: a, indeks }) => (
                      <li
                        key={a.id}
                        id={idOpsi(indeks)}
                        role="option"
                        aria-selected={indeks === kursorAman}
                        onClick={() => jalankan(a)}
                        onMouseEnter={() => setKursor(indeks)}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-item px-3 py-2.5 text-left text-sm transition",
                          indeks === kursorAman
                            ? "bg-daun-600/10 text-daun-800 dark:text-daun-200"
                            : "text-ink"
                        )}
                      >
                        <span className="text-muted" aria-hidden>
                          {a.ikon}
                        </span>
                        <span className="flex-1 font-medium">{a.label}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t garis-halus px-4 py-2.5 text-mikro font-semibold uppercase text-muted">
              <span>
                <span aria-hidden>↑↓</span> pilih
              </span>
              <span>
                <span aria-hidden>⏎</span> buka
              </span>
              <span>
                <span aria-hidden>esc</span> tutup
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
