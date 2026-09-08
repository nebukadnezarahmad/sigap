"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@/components/ui";
import { cn } from "@/lib/utils";

// Skala spacing konten yang dikunci (Fase 3A):
// - Vertikal section: py-10 (konten) / py-16 (landing-ish)
// - Header halaman: mb-8
// - Kartu: p-5 / p-6

export function KontenUtama({
  children,
  lebar = "baca",
}: {
  children: ReactNode;
  lebar?: "baca" | "lebar";
}) {
  return (
    <main
      className={cn(
        "mx-auto px-4 py-10",
        lebar === "lebar" ? "max-w-4xl" : "max-w-3xl"
      )}
    >
      {children}
    </main>
  );
}

export function PageHeader({
  eyebrow,
  judul,
  deskripsi,
  aksi,
  tengah = false,
}: {
  eyebrow: string;
  judul: string;
  deskripsi?: string;
  aksi?: ReactNode;
  tengah?: boolean;
}) {
  return (
    <header className={cn("mb-8", tengah && "text-center")}>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-action">
        {eyebrow}
      </p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
        {judul}
      </h1>
      {deskripsi ? (
        <p
          className={cn(
            "mt-3 max-w-xl text-muted teks-pretty",
            tengah && "mx-auto"
          )}
        >
          {deskripsi}
        </p>
      ) : null}
      {aksi ? <div className="mt-5">{aksi}</div> : null}
    </header>
  );
}

export function GalatMuatUlang({
  judul,
  pesan = "Koneksi ke database terputus, periksa konfigurasi Supabase lalu coba lagi.",
}: {
  judul: string;
  pesan?: string;
}) {
  const router = useRouter();
  return (
    <div className="text-center">
      <Card className="p-8">
        <h1 className="font-display text-2xl font-bold">{judul}</h1>
        <p className="mt-2 text-sm text-muted">{pesan}</p>
        <Button className="mt-5" onClick={() => router.refresh()}>
          Coba lagi
        </Button>
      </Card>
    </div>
  );
}
