"use client";

import Link from "next/link";
import { FileText, LogIn, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui";
import { PilihanAkunDemo } from "@/components/tombol-demo-login";

export function GerbangLaporanSaya() {
  return (
    <main className="mx-auto max-w-lg px-4 py-16">
      <Card className="p-8 text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-action/10 text-action">
          <FileText size={28} />
        </div>

        <h1 className="font-display text-2xl font-bold">
          Riwayat laporan saya
        </h1>

        <p className="mt-2 text-sm text-muted leading-relaxed">
          Kamu belum masuk. Halaman ini menampilkan seluruh laporan yang pernah kamu buat dan perkembangan status penanganannya. Silakan masuk untuk melihat daftar laporanmu.
        </p>

        <div className="mt-6 rounded-2xl border border-action/30 bg-action/5 p-4 text-left">
          <p className="mb-3 flex items-center gap-1.5 text-xs font-bold text-action">
            <LogIn size={14} /> Coba akun demo berisi laporan (1-klik)
          </p>
          <PilihanAkunDemo tujuan="/laporan-saya" />
        </div>

        <div className="mt-6 flex flex-col items-center gap-2 text-sm">
          <Link
            href="/masuk?next=/laporan-saya"
            className="font-semibold text-action hover:underline"
          >
            Masuk manual
          </Link>
          <Link
            href="/demo"
            className="text-muted hover:text-ink transition"
          >
            Lihat panduan demo
          </Link>
          <Link
            href="/peta"
            className="inline-flex items-center gap-1.5 text-muted hover:text-ink transition"
          >
            <ArrowLeft size={14} /> Kembali ke peta publik
          </Link>
        </div>
      </Card>
    </main>
  );
}
