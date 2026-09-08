"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  FileText,
  LogOut,
  MapPin,
  Menu,
  Moon,
  ShieldCheck,
  Sun,
  Trophy,
  UserRound,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/use-user";
import { useTheme, toggleTema } from "@/lib/use-theme";
import { Avatar, Button } from "@/components/ui";
import { KacaBar } from "@/components/eksperimen/kaca";
import { NotifikasiBel } from "@/components/notifikasi-bel";
import { DemoAuthModal } from "@/components/tombol-demo-login";

function ToggleTema() {
  const gelap = useTheme();

  function ubah() {
    toggleTema();
  }

  return (
    <button
      onClick={ubah}
      aria-label={gelap ? "Mode terang" : "Mode gelap"}
      className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-muted transition hover:bg-panel-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus!"
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

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profil } = useUser();
  const [modalDemoBuka, setModalDemoBuka] = useState(false);
  const [menuBuka, setMenuBuka] = useState(false);
  const [akunBuka, setAkunBuka] = useState(false);
  const tombolMenuRef = useRef<HTMLButtonElement>(null);
  const tombolAkunRef = useRef<HTMLButtonElement>(null);

  /* R-03/R-32: lapisan header tak boleh bertumpuk di 390px. Membuka satu
     menutup yang lain; ESC menutup lalu mengembalikan fokus ke pemicu;
     pindah rute menutup keduanya. */
  function alihMenu() {
    setAkunBuka(false);
    setMenuBuka((v) => !v);
  }

  function alihAkun() {
    setMenuBuka(false);
    setAkunBuka((v) => !v);
  }

  function tutupMenuKePemicu() {
    setMenuBuka(false);
    tombolMenuRef.current?.focus();
  }

  function tutupAkunKePemicu() {
    setAkunBuka(false);
    tombolAkunRef.current?.focus();
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (menuBuka) {
        tutupMenuKePemicu();
      } else if (akunBuka) {
        tutupAkunKePemicu();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuBuka, akunBuka]);

  /* Pindah rute menutup keduanya (pola yang sama dengan jelajah.tsx). */
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMenuBuka(false);
    setAkunBuka(false);
  }

  const tautan = [
    { href: "/peta", label: "Peta" },
    { href: "/laporan-saya", label: "Laporan Saya" },
    { href: "/papan-skor", label: "Papan Skor" },
    { href: "/transparansi", label: "Transparansi" },
    { href: "/demo", label: "Panduan Demo" },
  ];

  async function keluar() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <KacaBar
      as="header"
      /* R-03: viewport-fit=cover membentangkan bar ke bawah poni; padding ini
         menjaga isi bar di bawah safe-area (bernilai 0 di desktop). */
      className="pt-[env(safe-area-inset-top)] print:hidden"
    >
      <div className="mx-auto flex h-11 max-w-6xl items-center justify-between gap-2 pl-[calc(1rem+env(safe-area-inset-left,0px))] pr-[calc(1rem+env(safe-area-inset-right,0px))] sm:gap-4">
        <Link
          href="/"
          className="flex items-center gap-1 rounded-xl text-ap-blue transition-colors hover:text-ap-blue-focus focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus! sm:gap-2"
        >
          <span className="flex size-7 items-center justify-center rounded-xl bg-ap-blue text-white sm:size-8">
            <MapPin size={17} strokeWidth={2.5} />
          </span>
          <span className="font-display text-base font-bold tracking-tight sm:text-lg">
            SIGAP
          </span>
        </Link>

        <nav className="hidden items-center gap-0.5 min-[834px]:flex" aria-label="Utama">
          {tautan.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              aria-current={pathname.startsWith(t.href) ? "page" : undefined}
              className={cn(
                "inline-flex min-h-[44px] items-center rounded-full px-3.5 py-1.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus!",
                pathname.startsWith(t.href)
                  ? "bg-ap-blue/10 font-semibold text-ap-blue dark:text-ap-sky"
                  : "text-muted hover:bg-panel-2 hover:text-ink"
              )}
            >
              {t.label}
            </Link>
          ))}
          {profil?.role === "admin" && (
            <Link
              href="/dewan"
              aria-current={pathname.startsWith("/dewan") ? "page" : undefined}
              className={cn(
                "inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus!",
                pathname.startsWith("/dewan")
                  ? "bg-ap-blue/10 font-semibold text-ap-blue dark:text-ap-sky"
                  : "text-muted hover:bg-panel-2 hover:text-ink"
              )}
            >
              <ShieldCheck size={15} /> Dewan
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <ToggleTema />
          <button
            ref={tombolMenuRef}
            type="button"
            onClick={alihMenu}
            aria-expanded={menuBuka}
            aria-controls="navigasi-seluler"
            aria-label={menuBuka ? "Tutup menu navigasi" : "Buka menu navigasi"}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-1 rounded-lg px-1 text-xs font-semibold text-ap-blue transition hover:bg-ap-blue/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus! sm:gap-1.5 sm:px-2 sm:text-sm min-[834px]:hidden"
          >
            {menuBuka ? <X size={20} /> : <Menu size={20} />}
            <span>{menuBuka ? "Tutup" : "Menu"}</span>
          </button>
          {user && <NotifikasiBel />}
          {user ? (
            <div className="relative">
              <button
                ref={tombolAkunRef}
                type="button"
                aria-label="Menu akun"
                aria-expanded={akunBuka}
                aria-controls="menu-akun"
                onClick={alihAkun}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full transition hover:ring-4 hover:ring-ap-blue/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus!"
              >
                <Avatar nama={profil?.nama_lengkap ?? "?"} url={profil?.avatar_url} ukuran={34} />
              </button>
              {akunBuka && (
                <div
                  id="menu-akun"
                  className="absolute right-0 top-full z-20 w-56 max-w-[calc(100vw-2rem)] translate-y-1 rounded-2xl border garis-halus bg-panel p-2 shadow-none"
                >
                  <ul aria-label="Pilihan akun" className="space-y-0.5">
                    <li className="border-b garis-halus px-3 pb-2 pt-1.5">
                      <p className="truncate text-sm font-semibold">
                        {profil?.nama_lengkap ?? user.email}
                      </p>
                      <p className="truncate text-xs text-muted">
                        @{profil?.username ?? "warga"}{" "}
                        {profil?.role === "admin" && (
                          <span className="rounded bg-kunyit-500/15 px-1.5 py-0.5 text-[10px] font-bold text-kunyit-600">
                            Admin
                          </span>
                        )}
                      </p>
                    </li>
                    <li>
                      <Link
                        href={`/warga/${profil?.username ?? ""}`}
                        onClick={tutupAkunKePemicu}
                        className="flex min-h-[44px] items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted transition hover:bg-panel-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus!"
                      >
                        <UserRound size={15} /> Profil saya
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/laporan-saya"
                        onClick={tutupAkunKePemicu}
                        className="flex min-h-[44px] items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted transition hover:bg-panel-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus!"
                      >
                        <FileText size={15} /> Laporan saya
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/papan-skor"
                        onClick={tutupAkunKePemicu}
                        className="flex min-h-[44px] items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted transition hover:bg-panel-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus!"
                      >
                        <Trophy size={15} /> Papan skor
                      </Link>
                    </li>
                    {profil?.role === "admin" && (
                      <li>
                        <Link
                          href="/dewan"
                          onClick={tutupAkunKePemicu}
                          className="flex min-h-[44px] items-center gap-2 rounded-xl px-3 py-2 text-sm text-ap-blue transition hover:bg-ap-blue/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus! dark:text-ap-sky"
                        >
                          <ShieldCheck size={15} /> Dashboard dewan
                        </Link>
                      </li>
                    )}
                    <li>
                      <Link
                        href="/demo"
                        onClick={tutupAkunKePemicu}
                        className="flex min-h-[44px] items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted transition hover:bg-panel-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus!"
                      >
                        <BookOpen size={15} /> Panduan demo
                      </Link>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          tutupAkunKePemicu();
                          void keluar();
                        }}
                        className="flex min-h-[44px] w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-danger transition hover:bg-danger/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus!"
                      >
                        <LogOut size={15} /> Keluar
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="sekunder"
                size="sm"
                onClick={() => setModalDemoBuka(true)}
                className="hidden min-h-[44px] items-center gap-1.5 border-ap-blue/40 text-ap-blue hover:bg-ap-blue/10 sm:inline-flex dark:text-ap-sky"
              >
                <UserRound size={14} />
                Akun Demo
              </Button>
              <Link
                href="/masuk"
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-ap-blue px-3.5 py-1.5 text-sm font-semibold text-white transition-[transform,background-color,border-color,color] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-ap-blue-focus focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus! active:scale-[0.97]"
              >
                Masuk
              </Link>
            </div>
          )}
        </div>
      </div>

      {menuBuka && (
        <nav
          id="navigasi-seluler"
          /* R-03: menu tak boleh menutupi konten di layar pendek; tinggi
             dibatasi viewport dinamis + safe-area bawah, sisanya menggeser. */
          className="max-h-[calc(100dvh-2.75rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] overflow-y-auto overscroll-contain border-t garis-halus pb-[calc(0.75rem+env(safe-area-inset-bottom))] pl-[calc(1rem+env(safe-area-inset-left,0px))] pr-[calc(1rem+env(safe-area-inset-right,0px))] pt-3 min-[834px]:hidden"
          aria-label="Navigasi seluler"
        >
          <ul className="flex flex-col gap-1">
            {tautan.map((t) => (
              <li key={t.href}>
                <Link
                  href={t.href}
                  onClick={tutupMenuKePemicu}
                  aria-current={pathname.startsWith(t.href) ? "page" : undefined}
                  className={cn(
                    "flex min-h-[44px] items-center rounded-xl px-3 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus!",
                    pathname.startsWith(t.href)
                      ? "bg-ap-blue/10 font-semibold text-ap-blue dark:text-ap-sky"
                      : "text-muted hover:bg-panel-2 hover:text-ink"
                  )}
                >
                  {t.label}
                </Link>
              </li>
            ))}
            {profil?.role === "admin" && (
              <li>
                <Link
                  href="/dewan"
                  onClick={tutupMenuKePemicu}
                  aria-current={pathname.startsWith("/dewan") ? "page" : undefined}
                  className={cn(
                    "flex min-h-[44px] items-center gap-1.5 rounded-xl px-3 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus!",
                    pathname.startsWith("/dewan")
                      ? "bg-ap-blue/10 font-semibold text-ap-blue dark:text-ap-sky"
                      : "text-muted hover:bg-panel-2 hover:text-ink"
                  )}
                >
                  <ShieldCheck size={15} /> Dewan
                </Link>
              </li>
            )}
          </ul>
        </nav>
      )}

      <DemoAuthModal
        terbuka={modalDemoBuka}
        tutup={() => setModalDemoBuka(false)}
        judul="Masuk Cepat Mode Demo"
        deskripsi="Pilih peran akun di bawah untuk menguji fitur SIGAP secara langsung dengan 1-klik."
      />
    </KacaBar>
  );
}
