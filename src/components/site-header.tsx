"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  BookOpen,
  FileText,
  LogOut,
  MapPin,
  Menu,
  Moon,
  ShieldCheck,
  Sparkles,
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
      className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-muted transition hover:bg-panel-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
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
    <header className="sticky top-0 z-[900] border-b garis-halus bg-paper/85 backdrop-blur-md print:hidden">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
        >
          <span className="flex size-8 items-center justify-center rounded-xl bg-action text-white">
            <MapPin size={17} strokeWidth={2.5} />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">
            SIGAP
          </span>
        </Link>

        <nav className="hidden items-center gap-0.5 md:flex" aria-label="Utama">
          {tautan.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                "inline-flex min-h-[44px] items-center rounded-full px-3.5 py-1.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action",
                pathname.startsWith(t.href)
                  ? "bg-action/10 text-action font-semibold"
                  : "text-muted hover:bg-panel-2 hover:text-ink"
              )}
            >
              {t.label}
            </Link>
          ))}
          {profil?.role === "admin" && (
            <Link
              href="/dewan"
              className={cn(
                "inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action",
                pathname.startsWith("/dewan")
                  ? "bg-kunyit-500/15 text-kunyit-600 dark:text-kunyit-400 font-semibold"
                  : "text-muted hover:bg-panel-2 hover:text-ink"
              )}
            >
              <ShieldCheck size={15} /> Dewan
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <ToggleTema />
          <button
            onClick={() => setMenuBuka((v) => !v)}
            aria-expanded={menuBuka}
            aria-label={menuBuka ? "Tutup menu navigasi" : "Buka menu navigasi"}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-muted transition hover:bg-panel-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action md:hidden"
          >
            {menuBuka ? <X size={20} /> : <Menu size={20} />}
          </button>
          {user && <NotifikasiBel />}
          {user ? (
            <div className="group relative">
              <button
                aria-label="Menu akun"
                aria-expanded={akunBuka}
                aria-haspopup="menu"
                onClick={() => setAkunBuka((v) => !v)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setAkunBuka((v) => !v);
                  }
                  if (e.key === "Escape") setAkunBuka(false);
                }}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full transition hover:ring-4 hover:ring-action/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
              >
                <Avatar nama={profil?.nama_lengkap ?? "?"} url={profil?.avatar_url} ukuran={34} />
              </button>
              <div
                role="menu"
                className={cn(
                  "invisible absolute right-0 top-full z-20 w-56 translate-y-1 rounded-2xl border garis-halus bg-panel p-2 opacity-0 shadow-xl transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100",
                  akunBuka && "visible translate-y-0 opacity-100"
                )}
              >
                <div className="border-b garis-halus px-3 pb-2 pt-1.5">
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
                </div>
                <Link
                  href={`/warga/${profil?.username ?? ""}`}
                  className="mt-1 flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted transition hover:bg-panel-2 hover:text-ink"
                >
                  <UserRound size={15} /> Profil saya
                </Link>
                <Link
                  href="/laporan-saya"
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted transition hover:bg-panel-2 hover:text-ink"
                >
                  <FileText size={15} /> Laporan saya
                </Link>
                <Link
                  href="/papan-skor"
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted transition hover:bg-panel-2 hover:text-ink"
                >
                  <Trophy size={15} /> Papan skor
                </Link>
                {profil?.role === "admin" && (
                  <Link
                    href="/dewan"
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-kunyit-600 transition hover:bg-kunyit-500/10 dark:text-kunyit-400"
                  >
                    <ShieldCheck size={15} /> Dashboard dewan
                  </Link>
                )}
                <Link
                  href="/demo"
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted transition hover:bg-panel-2 hover:text-ink"
                >
                  <BookOpen size={15} /> Panduan demo
                </Link>
                <button
                  onClick={keluar}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-danger transition hover:bg-danger/10"
                >
                  <LogOut size={15} /> Keluar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="sekunder"
                size="sm"
                onClick={() => setModalDemoBuka(true)}
                className="hidden sm:inline-flex min-h-[44px] items-center gap-1.5 border-action/30 text-action hover:bg-action/10"
              >
                <Sparkles size={14} className="text-action" />
                Akun Demo
              </Button>
              <Link
                href="/masuk"
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-[transform,background-color,border-color,box-shadow,color] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action active:scale-[0.97] bg-action text-white shadow-[0_1px_2px_rgb(0_102_204/0.25),0_6px_16px_-6px_rgb(0_102_204/0.4)] hover:bg-action-hover hover:shadow-[0_2px_4px_rgb(0_102_204/0.25),0_10px_24px_-6px_rgb(0_102_204/0.45)]"
              >
                Masuk
              </Link>
            </div>
          )}
        </div>
      </div>

      {menuBuka && (
        <nav
          className="border-t garis-halus px-4 py-3 md:hidden"
          aria-label="Navigasi seluler"
        >
          <ul className="flex flex-col gap-1">
            {tautan.map((t) => (
              <li key={t.href}>
                <Link
                  href={t.href}
                  onClick={() => setMenuBuka(false)}
                  className={cn(
                    "flex min-h-[44px] items-center rounded-xl px-3 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action",
                    pathname.startsWith(t.href)
                      ? "bg-action/10 text-action font-semibold"
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
                  onClick={() => setMenuBuka(false)}
                  className={cn(
                    "flex min-h-[44px] items-center gap-1.5 rounded-xl px-3 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action",
                    pathname.startsWith("/dewan")
                      ? "bg-kunyit-500/15 text-kunyit-600 dark:text-kunyit-400 font-semibold"
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
    </header>
  );
}
