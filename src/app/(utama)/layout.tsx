import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { CommandPalette } from "@/components/command-palette";

export default function LayoutUtama({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <a href="#isi-utama" className="lompat-ke-isi">
        Lompat ke konten utama
      </a>
      <SiteHeader />
      <CommandPalette />
      <div id="isi-utama">{children}</div>
      <footer className="border-t garis-halus mt-16 print:hidden">
        <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-muted flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-display font-semibold text-base">
            SIGAP{" "}
            <span className="font-normal text-muted">
              — Lapor. Serentak. Selesai.
            </span>
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-5">
            <Link href="/pasar" className="transition hover:text-ink">
              Pasar ReUse
            </Link>
            <Link href="/layanan" className="transition hover:text-ink">
              Direktori layanan
            </Link>
            <Link href="/umkm" className="transition hover:text-ink">
              UMKM warga
            </Link>
            <Link href="/demo" className="transition hover:text-ink">
              Panduan demo
            </Link>
            <Link href="/privasi" className="transition hover:text-ink">
              Privasi
            </Link>
            <Link href="/ketentuan" className="transition hover:text-ink">
              Ketentuan
            </Link>
            <p>Untuk Kota & Permukiman Berkelanjutan · SDG 11 · Infinitera 2.0</p>
          </div>
        </div>
      </footer>
    </>
  );
}
