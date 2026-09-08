"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, UserRound, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isTujuanAman } from "@/lib/utils";
import { Modal } from "@/components/modal";

/* Bahasa eksperimen: tile terang hairline 18px, pill 44px Action Blue,
   tabular untuk email, :focus-visible ap-blue-focus. Rute dan auth TETAP. */

export const AKUN_DEMO = [
  {
    peran: "Dewan (Admin)",
    email: "dewan@sigap.demo",
    deskripsi: "Lihat statistik, kelola status laporan, dan pantau heatmap",
    admin: true,
    warna:
      "border-ap-hairline bg-white hover:border-ap-blue/60 dark:border-line dark:bg-panel",
    badge: "bg-kunyit-500/15 text-kunyit-700 dark:text-kunyit-400",
  },
  {
    peran: "Budi (Warga Aktif)",
    email: "budi@sigap.demo",
    deskripsi: "Punya poin, riwayat laporan, dan badge yang bisa kamu jelajahi",
    admin: false,
    warna:
      "border-ap-hairline bg-white hover:border-ap-blue/60 dark:border-line dark:bg-panel",
    badge: "bg-ap-blue/10 text-ap-blue dark:text-ap-sky",
  },
  {
    peran: "Rafa (Warga Baru)",
    email: "rafa@sigap.demo",
    deskripsi: "Akun baru untuk mencoba alur lapor dari awal sampai terkirim",
    admin: false,
    warna:
      "border-ap-hairline bg-white hover:border-ap-blue/60 dark:border-line dark:bg-panel",
    badge: "bg-ap-blue/10 text-ap-blue dark:text-ap-sky",
  },
];

export function PilihanAkunDemo({
  tujuan,
  onSelesai,
  hanyaAdmin = false,
  ringkas = false,
}: {
  tujuan?: string;
  onSelesai?: () => void;
  hanyaAdmin?: boolean;
  ringkas?: boolean;
}) {
  const router = useRouter();
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);
  const [pesanGalat, setPesanGalat] = useState<string | null>(null);

  async function handleLogin(email: string) {
    setLoadingEmail(email);
    setPesanGalat(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: "sigap123456",
      });

      if (error) {
        setPesanGalat(
          "Gagal masuk dengan akun demo. Coba lagi atau masuk manual."
        );
        setLoadingEmail(null);
        return;
      }

      onSelesai?.();
      if (tujuan) {
        router.push(isTujuanAman(tujuan) ? tujuan : "/peta");
      }
      router.refresh();
    } catch {
      setPesanGalat("Terjadi kesalahan saat memproses login.");
      setLoadingEmail(null);
    }
  }

  const akunTampil = hanyaAdmin
    ? AKUN_DEMO.filter((a) => a.admin)
    : AKUN_DEMO;

  if (ringkas) {
    return (
      <div className="space-y-2">
        {pesanGalat && (
          <p role="alert" className="rounded-xl bg-danger/10 p-2 text-xs text-danger">
            {pesanGalat}
          </p>
        )}
        <div className="grid gap-2 sm:grid-cols-3">
          {akunTampil.map((a) => {
            const isLoading = loadingEmail === a.email;
            return (
              <button
                key={a.email}
                type="button"
                disabled={loadingEmail !== null}
                aria-busy={loadingEmail !== null}
                onClick={() => handleLogin(a.email)}
                className={`flex min-h-[44px] flex-col items-start rounded-[18px] border p-3 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus ${a.warna} ${
                  isLoading ? "opacity-75" : ""
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-ap-ink dark:text-ink">
                    {a.admin ? <Crown size={13} /> : <UserRound size={13} />}
                    {a.peran.split(" ")[0]}
                  </span>
                  {isLoading ? (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-muted">
                      <Loader2 size={13} className="animate-spin" /> Masuk…
                    </span>
                  ) : (
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${a.badge}`}>
                      1-Klik
                    </span>
                  )}
                </div>
                <span className="mt-1 text-[11px] text-muted tabular-nums">
                  {a.email}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pesanGalat && (
        <p role="alert" className="rounded-xl bg-danger/10 p-3 text-sm text-danger">
          {pesanGalat}
        </p>
      )}
      <div className="space-y-2.5">
        {akunTampil.map((a) => {
          const isLoading = loadingEmail === a.email;
          return (
            <button
              key={a.email}
              type="button"
              disabled={loadingEmail !== null}
              aria-busy={loadingEmail !== null}
              onClick={() => handleLogin(a.email)}
              className={`flex min-h-[44px] w-full items-center justify-between rounded-[18px] border p-4 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus ${a.warna} ${
                isLoading ? "opacity-75" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl ${
                    a.admin
                      ? "bg-kunyit-500/15 text-kunyit-700 dark:text-kunyit-400"
                      : "bg-ap-blue/10 text-ap-blue dark:text-ap-sky"
                  }`}
                >
                  {a.admin ? <Crown size={17} /> : <UserRound size={17} />}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-display font-bold text-sm text-ap-ink sm:text-base dark:text-ink">
                      {a.peran}
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${a.badge}`}
                    >
                      Demo
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted line-clamp-1">
                    {a.deskripsi}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted tabular-nums">
                    {a.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 pl-2 shrink-0">
                {isLoading ? (
                  <span className="flex items-center gap-1 text-xs text-muted font-medium">
                    <Loader2 size={14} className="animate-spin" /> Masuk…
                  </span>
                ) : (
                  <span className="inline-flex min-h-[44px] items-center rounded-full bg-ap-blue px-4 text-xs font-semibold text-white">
                    Masuk
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DemoAuthModal({
  terbuka,
  tutup,
  judul = "Masuk untuk Melanjutkan",
  deskripsi = "Pilih salah satu akun demo di bawah untuk mencoba fitur secara instan tanpa perlu mendaftar.",
  tujuan,
}: {
  terbuka: boolean;
  tutup: () => void;
  judul?: string;
  deskripsi?: string;
  tujuan?: string;
}) {
  const router = useRouter();
  const tujuanAman = isTujuanAman(tujuan) ? tujuan : undefined;

  return (
    <Modal terbuka={terbuka} tutup={tutup} judul={judul} lebar="max-w-lg">
      <div className="space-y-4">
        <p className="text-sm text-muted">{deskripsi}</p>
        <PilihanAkunDemo tujuan={tujuan} onSelesai={tutup} />
        <div className="border-t garis-halus pt-3 text-center">
          <p className="text-xs text-muted">
            Ingin menggunakan akun sendiri?{" "}
            <button
              type="button"
              onClick={() => {
                tutup();
                router.push(`/masuk${tujuanAman ? `?next=${encodeURIComponent(tujuanAman)}` : ""}`);
              }}
              className="inline-flex min-h-[44px] items-center rounded-full px-3 font-semibold text-ap-blue hover:bg-ap-blue/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus dark:text-ap-sky"
            >
              Masuk manual
            </button>
          </p>
        </div>
      </div>
    </Modal>
  );
}
