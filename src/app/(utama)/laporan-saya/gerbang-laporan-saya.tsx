"use client";

import Link from "next/link";
import { FileText, UserRound, ArrowLeft } from "lucide-react";
import { KacaKartu } from "@/components/eksperimen/kaca";
import { PitaGradient } from "@/components/eksperimen/pita-gradient";
import { PilihanAkunDemo } from "@/components/tombol-demo-login";

/* Bahasa eksperimen: header pita gelap + teks putih + CTA pil biru
   (pola papan-skor/demo); kartu aksi tetap terang; ikon, judul, copy,
   rute, dan logika tidak diubah, hanya warna agar kontras di atas pita;
   Fraunces tetap; tanpa emoji; tanpa animasi baru. */

export function GerbangLaporanSaya() {
  return (
    <main className="bg-ap-parchment pb-16 text-ap-ink dark:bg-paper dark:text-ink">
      <PitaGradient tone="gelap">
        <header className="text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-[18px] border border-white/30 bg-white/10 text-white">
            <FileText size={28} strokeWidth={1.8} />
          </div>

          <h1 className="font-display text-2xl font-bold text-white">
            Riwayat Laporan Saya
          </h1>

          <p className="mx-auto mt-2 max-w-md text-sm text-white/85 leading-relaxed teks-pretty">
            Kamu belum masuk. Halaman ini berisi semua laporan yang pernah kamu
            buat dan status penanganannya. Masuk untuk melihat daftarmu.
          </p>
        </header>
      </PitaGradient>

      <div className="mx-auto max-w-lg px-4 pt-8">
         <KacaKartu className="bg-ap-canvas p-8 text-center text-ap-ink dark:bg-ap-tile1 dark:text-ink">
          <div className="rounded-[18px] border border-ap-hairline bg-ap-pearl p-4 text-left tabular-nums dark:border-line dark:bg-panel-2">
            <p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ap-blue dark:text-ap-sky">
              <UserRound size={14} /> Masuk cepat dengan akun demo
            </p>
            <PilihanAkunDemo tujuan="/laporan-saya" />
          </div>

          <div className="mt-6 flex flex-col items-center gap-2 text-sm">
             <Link
               href="/masuk?next=/laporan-saya"
               aria-label="Masuk untuk melanjutkan ke Laporan Saya"
               className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-ap-blue px-5 font-semibold text-white transition hover:bg-ap-blue-focus focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus active:scale-[0.97]"
             >
               Masuk ke Laporan Saya
            </Link>
            <Link
              href="/demo"
              className="inline-flex min-h-[44px] items-center justify-center rounded-full px-5 text-muted transition hover:bg-ap-blue/10 hover:text-ap-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus dark:hover:text-ap-sky"
            >
              Lihat panduan demo
            </Link>
            <Link
              href="/peta"
              className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-full px-5 text-muted transition hover:bg-ap-blue/10 hover:text-ap-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus dark:hover:text-ap-sky"
            >
              <ArrowLeft size={14} /> Kembali ke Peta Publik
            </Link>
          </div>
        </KacaKartu>
      </div>
    </main>
  );
}
