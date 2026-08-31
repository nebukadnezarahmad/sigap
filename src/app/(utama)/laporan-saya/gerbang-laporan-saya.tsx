"use client";

import Link from "next/link";
import { FileText, Sparkles, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui";
import { PilihanAkunDemo } from "@/components/tombol-demo-login";

export function GerbangLaporanSaya() {
  return (
    <main className="mx-auto max-w-lg px-4 py-16">
      <Card className="p-8 text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-daun-600/10 text-daun-700 dark:text-daun-300">
          <FileText size={28} />
        </div>

        <h1 className="font-display text-2xl font-bold">
          Riwayat Laporan Saya
        </h1>

        <p className="mt-2 text-sm text-muted leading-relaxed">
          Halaman ini menampilkan seluruh laporan yang pernah Anda buat dan perkembangan status penanganannya. Silakan masuk untuk melihat daftar laporan Anda.
        </p>

        <div className="mt-6 rounded-2xl border border-daun-500/30 bg-daun-500/5 p-4 text-left">
          <p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-daun-700 dark:text-daun-300">
            <Sparkles size={14} /> Coba Akun Demo dengan Data Laporan (1-Klik)
          </p>
          <PilihanAkunDemo tujuan="/laporan-saya" />
        </div>

        <div className="mt-6 flex flex-col items-center gap-2 text-sm">
          <Link
            href="/peta"
            className="inline-flex items-center gap-1.5 text-muted hover:text-ink transition"
          >
            <ArrowLeft size={14} /> Kembali ke Peta Publik
          </Link>
        </div>
      </Card>
    </main>
  );
}
