"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { LogOut, MapPin, Moon, ShieldCheck, Sun, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/use-user";
import { Avatar, Button } from "@/components/ui";

function langgananTema(cb: () => void) {
  const pengamat = new MutationObserver(cb);
  pengamat.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => pengamat.disconnect();
}

function ambilTema() {
  return document.documentElement.classList.contains("dark");
}

function temaAwal() {
  return false;
}

function ToggleTema() {
  const gelap = useSyncExternalStore(langgananTema, ambilTema, temaAwal);

  function ubah() {
    const berikutnya = !gelap;
    document.documentElement.classList.toggle("dark", berikutnya);
    localStorage.setItem("tema", berikutnya ? "dark" : "light");
  }

  return (
    <button
      onClick={ubah}
      aria-label={gelap ? "Mode terang" : "Mode gelap"}
      className="rounded-full p-2 text-muted transition hover:bg-panel-2 hover:text-ink"
    >
      {gelap ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profil } = useUser();

  const tautan = [
    { href: "/peta", label: "Peta" },
    { href: "/papan-skor", label: "Papan Skor" },
  ];

  async function keluar() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-[900] border-b garis-halus bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-xl bg-daun-600 text-white">
            <MapPin size={17} strokeWidth={2.5} />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">
            SIGAP
          </span>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex" aria-label="Utama">
          {tautan.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm font-medium transition",
                pathname.startsWith(t.href)
                  ? "bg-daun-600/10 text-daun-700 dark:text-daun-300"
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
                "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition",
                pathname.startsWith("/dewan")
                  ? "bg-kunyit-500/15 text-kunyit-600 dark:text-kunyit-400"
                  : "text-muted hover:bg-panel-2 hover:text-ink"
              )}
            >
              <ShieldCheck size={15} /> Dewan
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-1.5">
          <ToggleTema />
          {user ? (
            <div className="group relative">
              <button
                aria-label="Menu akun"
                className="flex items-center rounded-full transition hover:ring-4 hover:ring-daun-500/15"
              >
                <Avatar nama={profil?.nama_lengkap ?? "?"} url={profil?.avatar_url} ukuran={34} />
              </button>
              <div className="invisible absolute right-0 top-full z-20 w-56 translate-y-1 rounded-2xl border garis-halus bg-panel p-2 opacity-0 shadow-xl transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                <div className="border-b garis-halus px-3 pb-2 pt-1.5">
                  <p className="truncate text-sm font-semibold">
                    {profil?.nama_lengkap ?? user.email}
                  </p>
                  <p className="truncate text-xs text-muted">@{profil?.username ?? "warga"}</p>
                </div>
                <Link
                  href="/papan-skor"
                  className="mt-1 flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted transition hover:bg-panel-2 hover:text-ink"
                >
                  <Trophy size={15} /> Papan skor saya
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
            <Button onClick={() => router.push("/masuk")} size="sm">
              Masuk
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
