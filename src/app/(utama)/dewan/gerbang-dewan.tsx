"use client";

import Link from "next/link";
import { Crown, ArrowLeft, Sparkles } from "lucide-react";
import { PilihanAkunDemo } from "@/components/tombol-demo-login";

/* Grammar Apple (FUSI): tile header terang + konten parchment; kartu utilitas
   putih hairline radius 18 tanpa shadow; link pill Action Blue min-44 dengan
   :focus-visible. Kunci kunyit (identitas gerbang) + teks/rute/logika TETAP. */
const KARTU_UTILITAS =
  "rounded-[18px] border border-ap-hairline bg-white shadow-none dark:border-line dark:bg-panel dark:text-ink";
const LINK_PILL_APPLE =
  "inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-ap-blue hover:bg-ap-blue/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus dark:text-ap-sky dark:hover:bg-ap-sky/10";

export function GerbangDewan({
  alasan = "belum_login",
}: {
  alasan?: "belum_login" | "bukan_admin";
}) {
  return (
    <main>
      {/* Tile header terang (canvas putih) */}
      <section className="bg-white text-ap-ink dark:bg-panel dark:text-ink">
        <div className="mx-auto max-w-lg px-4 py-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-kunyit-600 dark:text-kunyit-400">
            Panel dewan
          </p>
          <h1 className="mt-3 font-display text-3xl font-bold leading-[1.1] tracking-[-0.28px]">
            Akses Khusus Dewan / Pemerintah
          </h1>
          <p className="mt-3 text-[17px] leading-[1.47] tracking-[-0.374px] text-muted teks-pretty">
            {alasan === "bukan_admin"
              ? "Anda sudah masuk dengan peran Warga. Dashboard ini hanya untuk peran Administrator/Dewan — gunakan tombol demo di bawah untuk beralih ke akun Dewan."
              : "Anda belum masuk. Dashboard Dewan digunakan untuk memverifikasi laporan masuk, menugaskan petugas, dan memantau SLA penanganan masalah."}
          </p>
        </div>
      </section>

      {/* Konten parchment */}
      <section className="bg-ap-parchment text-ap-ink dark:bg-paper dark:text-ink">
        <div className="mx-auto max-w-lg px-4 pb-16">
      <div className={`${KARTU_UTILITAS} p-8 text-center`}>
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-xl bg-kunyit-500/15 text-kunyit-600 dark:text-kunyit-400">
          <Crown size={28} />
        </div>

        <div className="rounded-lg border border-kunyit-500/30 bg-kunyit-500/5 p-4 text-left">
          <p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-kunyit-700 dark:text-kunyit-400">
            <Sparkles size={14} /> Masuk sebagai Admin Demo (1-Klik)
          </p>
          <PilihanAkunDemo tujuan="/dewan" hanyaAdmin />
        </div>

        <div className="mt-6 flex flex-col items-center gap-2 text-sm">
          <Link href="/masuk?next=/dewan" className={LINK_PILL_APPLE}>
            Masuk manual sebagai admin
          </Link>
          <Link href="/demo" className={LINK_PILL_APPLE}>
            Lihat panduan demo
          </Link>
          <Link href="/peta" className={LINK_PILL_APPLE}>
            <ArrowLeft size={14} /> Kembali ke Peta Publik
          </Link>
        </div>
      </div>
        </div>
      </section>
    </main>
  );
}
