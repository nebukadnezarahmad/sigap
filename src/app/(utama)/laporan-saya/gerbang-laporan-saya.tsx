"use client";

import Link from "next/link";
import { FileText, Sparkles, ArrowLeft } from "lucide-react";
import { KacaKartu } from "@/components/eksperimen/kaca";
import { PilihanAkunDemo } from "@/components/tombol-demo-login";

/* Fusi visual-fusion: kartu utilitas KacaKartu 18px tanpa shadow;
   ikon tile terang Action Blue; link pill 44px Action Blue + focus-visible;
   Fraunces tetap. Copy, rute, dan logika tidak diubah. */

export function GerbangLaporanSaya() {
  return (
    <main className="mx-auto max-w-lg px-4 py-16">
      <KacaKartu className="bg-white/60 p-8 text-center text-ap-ink dark:bg-white/10 dark:text-ink">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-[18px] bg-ap-blue/10 text-ap-blue dark:text-ap-sky">
          <FileText size={28} />
        </div>

        <h1 className="font-display text-2xl font-bold">
          Riwayat Laporan Saya
        </h1>

        <p className="mt-2 text-sm text-muted leading-relaxed">
          Anda belum masuk. Halaman ini menampilkan seluruh laporan yang pernah Anda buat dan perkembangan status penanganannya. Silakan masuk untuk melihat daftar laporan Anda.
        </p>

        <div className="mt-6 rounded-[18px] border border-ap-hairline bg-ap-pearl p-4 text-left dark:border-line dark:bg-panel-2">
          <p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ap-blue dark:text-ap-sky">
            <Sparkles size={14} /> Coba Akun Demo dengan Data Laporan (1-Klik)
          </p>
          <PilihanAkunDemo tujuan="/laporan-saya" />
        </div>

        <div className="mt-6 flex flex-col items-center gap-2 text-sm">
          <Link
            href="/masuk?next=/laporan-saya"
            className="inline-flex min-h-[44px] items-center justify-center rounded-full px-5 font-semibold text-ap-blue hover:bg-ap-blue/10 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus dark:text-ap-sky"
          >
            Masuk manual
          </Link>
          <Link
            href="/demo"
            className="inline-flex min-h-[44px] items-center justify-center rounded-full px-5 text-muted transition hover:bg-ap-blue/10 hover:text-ap-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus"
          >
            Lihat panduan demo
          </Link>
          <Link
            href="/peta"
            className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-full px-5 text-muted transition hover:bg-ap-blue/10 hover:text-ap-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus"
          >
            <ArrowLeft size={14} /> Kembali ke Peta Publik
          </Link>
        </div>
      </KacaKartu>
    </main>
  );
}
