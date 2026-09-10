"use client";

import type { ReactNode } from "react";
import Link from "next/link";
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
      <p
        className={cn(
          "flex items-center gap-2 text-[13px] font-medium text-muted",
          tengah && "justify-center"
        )}
      >
        <span
          aria-hidden="true"
          className="size-1.5 shrink-0 rounded-full"
          style={{
            background: "linear-gradient(145deg, #4098ff, #0066cc)",
          }}
        />
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
  pesan = "Data belum dapat dimuat. Periksa koneksi lalu coba lagi.",
  butuhMasuk = false,
}: {
  judul: string;
  pesan?: string;
  butuhMasuk?: boolean;
}) {
  const router = useRouter();
  return (
    <div className="text-center">
      <Card className="p-8">
        <h1 className="font-display text-2xl font-bold">{judul}</h1>
        <p className="mt-2 text-sm text-muted">{pesan}</p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <Button onClick={() => router.refresh()}>
            Coba lagi
          </Button>
          {butuhMasuk ? (
            <Link
              href="/masuk"
              className="inline-flex min-h-[44px] items-center justify-center rounded-full border garis-halus bg-panel px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-action hover:text-action"
            >
              Masuk
            </Link>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
