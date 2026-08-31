"use client";

import Link from "next/link";
import { Crown, ArrowLeft, Sparkles } from "lucide-react";
import { Card } from "@/components/ui";
import { PilihanAkunDemo } from "@/components/tombol-demo-login";

export function GerbangDewan({
  alasan = "belum_login",
}: {
  alasan?: "belum_login" | "bukan_admin";
}) {
  return (
    <main className="mx-auto max-w-lg px-4 py-16">
      <Card className="p-8 text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-kunyit-500/15 text-kunyit-600 dark:text-kunyit-400">
          <Crown size={28} />
        </div>

        <h1 className="font-display text-2xl font-bold">
          Akses Khusus Dewan / Pemerintah
        </h1>

        <p className="mt-2 text-sm text-muted leading-relaxed">
          {alasan === "bukan_admin"
            ? "Akun Anda saat ini memiliki peran Warga. Dashboard ini hanya dapat diakses oleh peran Administrator/Dewan."
            : "Dashboard Dewan digunakan untuk memverifikasi laporan masuk, menugaskan petugas, dan memantau SLA penanganan masalah."}
        </p>

        <div className="mt-6 rounded-2xl border border-kunyit-500/30 bg-kunyit-500/5 p-4 text-left">
          <p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-kunyit-700 dark:text-kunyit-400">
            <Sparkles size={14} /> Masuk sebagai Admin Demo (1-Klik)
          </p>
          <PilihanAkunDemo tujuan="/dewan" hanyaAdmin />
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
