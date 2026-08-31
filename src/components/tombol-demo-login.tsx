"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, UserRound, Loader2, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/modal";

export const AKUN_DEMO = [
  {
    peran: "Dewan (Admin)",
    email: "dewan@sigap.demo",
    deskripsi: "Dashboard statistik, kelola status laporan, dan heatmap",
    admin: true,
    warna: "border-kunyit-500/30 bg-kunyit-500/5 hover:border-kunyit-500/60",
    badge: "bg-kunyit-500/15 text-kunyit-600 dark:text-kunyit-400",
  },
  {
    peran: "Budi (Warga Aktif)",
    email: "budi@sigap.demo",
    deskripsi: "Warga dengan poin, riwayat laporan, dan badge",
    admin: false,
    warna: "border-daun-500/30 bg-daun-500/5 hover:border-daun-500/60",
    badge: "bg-daun-500/15 text-daun-700 dark:text-daun-300",
  },
  {
    peran: "Rafa (Warga Baru)",
    email: "rafa@sigap.demo",
    deskripsi: "Akun baru untuk mencoba alur pelaporan dari awal",
    admin: false,
    warna: "border-sky-500/30 bg-sky-500/5 hover:border-sky-500/60",
    badge: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
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
        setPesanGalat(error.message || "Gagal masuk dengan akun demo.");
        setLoadingEmail(null);
        return;
      }

      onSelesai?.();
      if (tujuan) {
        router.push(tujuan);
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
          <p className="rounded-xl bg-danger/10 p-2 text-xs text-danger">
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
                onClick={() => handleLogin(a.email)}
                className={`flex flex-col items-start rounded-xl border p-3 text-left transition ${a.warna} ${
                  isLoading ? "opacity-75" : ""
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-bold">
                    {a.admin ? <Crown size={13} /> : <UserRound size={13} />}
                    {a.peran.split(" ")[0]}
                  </span>
                  {isLoading ? (
                    <Loader2 size={13} className="animate-spin text-muted" />
                  ) : (
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${a.badge}`}>
                      1-Klik
                    </span>
                  )}
                </div>
                <span className="mt-1 text-[11px] text-muted">
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
        <p className="rounded-xl bg-danger/10 p-3 text-sm text-danger">
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
              onClick={() => handleLogin(a.email)}
              className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition ${a.warna} ${
                isLoading ? "opacity-75" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl ${
                    a.admin
                      ? "bg-kunyit-500/15 text-kunyit-600"
                      : "bg-daun-600/10 text-daun-700 dark:text-daun-300"
                  }`}
                >
                  {a.admin ? <Crown size={17} /> : <UserRound size={17} />}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-display font-bold text-sm sm:text-base">
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
                </div>
              </div>
              <div className="flex items-center gap-1.5 pl-2 shrink-0">
                {isLoading ? (
                  <span className="flex items-center gap-1 text-xs text-muted font-medium">
                    <Loader2 size={14} className="animate-spin" /> Masuk…
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-xl bg-panel px-2.5 py-1.5 text-xs font-semibold shadow-sm transition group-hover:bg-panel-2">
                    Masuk <ArrowRight size={12} />
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
                router.push(`/masuk${tujuan ? `?next=${encodeURIComponent(tujuan)}` : ""}`);
              }}
              className="font-semibold text-daun-700 hover:underline dark:text-daun-300"
            >
              Masuk manual
            </button>
          </p>
        </div>
      </div>
    </Modal>
  );
}
