"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  ChevronDown,
  FileText,
  LogOut,
  MapPin,
  Moon,
  ShieldCheck,
  Sun,
  Trophy,
  UserRound,
  Users,
  GraduationCap,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/use-user";
import { useTheme, toggleTema } from "@/lib/use-theme";
import { Avatar, Button } from "@/components/ui";
import { NotifikasiBel } from "@/components/notifikasi-bel";

/* Gaya berulang diekstrak sekali — sebelumnya string yang sama diulang 8 kali. */
const NAV_DASAR =
  "relative rounded-kontrol px-3.5 py-1.5 text-sm font-medium transition";
const NAV_PASIF = "text-muted hover:bg-panel-2 hover:text-ink";
const NAV_AKTIF = "bg-daun-600/10 text-daun-700 dark:text-daun-300";
const ITEM_MENU =
  "flex w-full items-center gap-2.5 rounded-item px-3 py-2 text-sm text-muted transition hover:bg-panel-2 hover:text-ink";
const PANEL_MENU =
  "absolute top-full z-20 mt-1.5 rounded-panel bg-panel p-2 shadow-melayang dark:border dark:garis-halus";

/** Penanda aktif berbentuk, bukan hanya warna. */
function PenandaAktif() {
  return (
    <span
      aria-hidden
      className="absolute inset-x-3.5 -bottom-0.5 h-0.5 rounded-full bg-daun-600 dark:bg-daun-300"
    />
  );
}

/**
 * Disclosure terkontrol: klik membuka, Escape dan klik di luar menutup, fokus
 * kembali ke pemicu. Versi sebelumnya murni `group-hover` sehingga tidak bisa
 * dijangkau sama sekali di perangkat sentuh.
 */
function useMenuTurun() {
  const [buka, setBuka] = useState(false);
  const rujukanWadah = useRef<HTMLDivElement>(null);
  const rujukanTombol = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!buka) return;

    function padaTombol(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      setBuka(false);
      rujukanTombol.current?.focus();
    }
    function padaKlikLuar(e: MouseEvent) {
      if (rujukanWadah.current?.contains(e.target as Node)) return;
      setBuka(false);
    }

    document.addEventListener("keydown", padaTombol);
    document.addEventListener("mousedown", padaKlikLuar);
    return () => {
      document.removeEventListener("keydown", padaTombol);
      document.removeEventListener("mousedown", padaKlikLuar);
    };
  }, [buka]);

  return { buka, setBuka, rujukanWadah, rujukanTombol };
}

function ToggleTema() {
  const gelap = useTheme();

  function ubah() {
    toggleTema();
  }

  return (
    <button
      onClick={ubah}
      aria-label={gelap ? "Mode terang" : "Mode gelap"}
      className="flex size-10 items-center justify-center rounded-kontrol text-muted transition hover:bg-panel-2 hover:text-ink"
    >
      <span className="hidden dark:block">
        <Sun size={18} />
      </span>
      <span className="block dark:hidden">
        <Moon size={18} />
      </span>
    </button>
  );
}

const KOMUNITAS = [
  { href: "/polling", label: "Polling warga", ikon: BarChart3 },
  { href: "/aksi", label: "Aksi bersama", ikon: Users },
  { href: "/edukasi", label: "Edukasi & quiz", ikon: GraduationCap },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profil } = useUser();

  const komunitas = useMenuTurun();
  const akun = useMenuTurun();

  const tautan = [
    { href: "/peta", label: "Peta" },
    { href: "/papan-skor", label: "Papan Skor" },
    { href: "/transparansi", label: "Transparansi" },
    { href: "/pasar", label: "Pasar" },
    { href: "/layanan", label: "Layanan" },
    { href: "/umkm", label: "UMKM" },
  ];

  const komunitasAktif = KOMUNITAS.some((k) => pathname.startsWith(k.href));

  /* Pindah halaman menutup kedua menu. */
  const tutupKomunitas = komunitas.setBuka;
  const tutupAkun = akun.setBuka;
  useEffect(() => {
    tutupKomunitas(false);
    tutupAkun(false);
  }, [pathname, tutupKomunitas, tutupAkun]);

  async function keluar() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-[900] border-b garis-halus bg-paper/85 backdrop-blur-md print:hidden">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-item bg-daun-600 text-white">
            <MapPin size={17} strokeWidth={2.5} />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">
            SIGAP
          </span>
        </Link>

        <nav className="hidden items-center gap-0.5 md:flex" aria-label="Utama">
          {tautan.map((t) => {
            const aktif = pathname.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                aria-current={aktif ? "page" : undefined}
                className={cn(NAV_DASAR, aktif ? NAV_AKTIF : NAV_PASIF)}
              >
                {t.label}
                {aktif && <PenandaAktif />}
              </Link>
            );
          })}

          <div className="relative" ref={komunitas.rujukanWadah}>
            <button
              ref={komunitas.rujukanTombol}
              type="button"
              onClick={() => komunitas.setBuka((v) => !v)}
              aria-haspopup="true"
              aria-expanded={komunitas.buka}
              aria-controls="menu-komunitas"
              className={cn(
                NAV_DASAR,
                "flex items-center gap-1",
                komunitasAktif ? NAV_AKTIF : NAV_PASIF
              )}
            >
              Komunitas
              <ChevronDown
                size={13}
                aria-hidden
                className={cn(
                  "transition-transform duration-200 ease-sigap",
                  komunitas.buka && "rotate-180"
                )}
              />
              {komunitasAktif && <PenandaAktif />}
            </button>
            {komunitas.buka && (
              <div
                id="menu-komunitas"
                className={cn(PANEL_MENU, "left-1/2 w-52 -translate-x-1/2")}
              >
                {KOMUNITAS.map((k) => {
                  const aktif = pathname.startsWith(k.href);
                  return (
                    <Link
                      key={k.href}
                      href={k.href}
                      aria-current={aktif ? "page" : undefined}
                      onClick={() => komunitas.setBuka(false)}
                      className={cn(
                        ITEM_MENU,
                        aktif &&
                          "bg-daun-600/10 text-daun-700 dark:text-daun-300"
                      )}
                    >
                      <k.ikon size={15} aria-hidden />
                      {k.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {profil?.role === "admin" && (
            <Link
              href="/dewan"
              aria-current={pathname.startsWith("/dewan") ? "page" : undefined}
              className={cn(
                NAV_DASAR,
                "flex items-center gap-1.5",
                pathname.startsWith("/dewan")
                  ? "bg-kunyit-500/15 text-kunyit-700 dark:text-kunyit-400"
                  : NAV_PASIF
              )}
            >
              <ShieldCheck size={15} aria-hidden /> Dewan
              {pathname.startsWith("/dewan") && (
                <span
                  aria-hidden
                  className="absolute inset-x-3.5 -bottom-0.5 h-0.5 rounded-full bg-kunyit-600 dark:bg-kunyit-400"
                />
              )}
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-1.5">
          <ToggleTema />
          {user && <NotifikasiBel />}
          {user ? (
            <div className="relative" ref={akun.rujukanWadah}>
              <button
                ref={akun.rujukanTombol}
                type="button"
                onClick={() => akun.setBuka((v) => !v)}
                aria-label="Menu akun"
                aria-haspopup="true"
                aria-expanded={akun.buka}
                aria-controls="menu-akun"
                className="flex items-center rounded-kontrol transition hover:ring-4 hover:ring-daun-500/15"
              >
                <Avatar
                  nama={profil?.nama_lengkap ?? "?"}
                  url={profil?.avatar_url}
                  ukuran={34}
                />
              </button>
              {akun.buka && (
                <div id="menu-akun" className={cn(PANEL_MENU, "right-0 w-56")}>
                  <div className="border-b garis-halus px-3 pb-2 pt-1.5">
                    <p className="truncate text-sm font-semibold">
                      {profil?.nama_lengkap ?? user.email}
                    </p>
                    <p className="truncate text-xs text-muted">
                      @{profil?.username ?? "warga"}
                    </p>
                  </div>
                  <Link
                    href={`/warga/${profil?.username ?? ""}`}
                    onClick={() => akun.setBuka(false)}
                    className={cn(ITEM_MENU, "mt-1")}
                  >
                    <UserRound size={15} aria-hidden /> Profil saya
                  </Link>
                  <Link
                    href="/laporan-saya"
                    onClick={() => akun.setBuka(false)}
                    className={ITEM_MENU}
                  >
                    <FileText size={15} aria-hidden /> Laporan saya
                  </Link>
                  <Link
                    href="/papan-skor"
                    onClick={() => akun.setBuka(false)}
                    className={ITEM_MENU}
                  >
                    <Trophy size={15} aria-hidden /> Papan skor
                  </Link>
                  <Link
                    href="/demo"
                    onClick={() => akun.setBuka(false)}
                    className={ITEM_MENU}
                  >
                    <BookOpen size={15} aria-hidden /> Panduan demo
                  </Link>
                  <button
                    type="button"
                    onClick={keluar}
                    className={cn(
                      ITEM_MENU,
                      "text-danger-kuat hover:bg-danger/10 hover:text-danger-kuat dark:text-red-300 dark:hover:text-red-300"
                    )}
                  >
                    <LogOut size={15} aria-hidden /> Keluar
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Button onClick={() => router.push("/masuk")} size="sm">
              Masuk
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
