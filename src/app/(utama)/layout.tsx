import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { CommandPalette } from "@/components/command-palette";
import { Gerak } from "@/components/gerak";

const TAUTAN_KAKI = [
  { href: "/pasar", label: "Pasar ReUse" },
  { href: "/layanan", label: "Direktori layanan" },
  { href: "/umkm", label: "UMKM warga" },
  { href: "/demo", label: "Panduan demo" },
  { href: "/privasi", label: "Privasi" },
  { href: "/ketentuan", label: "Ketentuan" },
] as const;

export default function LayoutUtama({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <a href="#isi-utama" className="lompat-ke-isi">
        Lompat ke konten utama
      </a>
      <Gerak>
        <SiteHeader />
        <CommandPalette />
        <main id="isi-utama" tabIndex={-1}>
          {children}
        </main>
        <footer className="border-t garis-halus mt-16 print:hidden">
          <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-muted flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-display font-semibold text-base">
              SIGAP{" "}
              <span className="font-normal text-muted">
                — Lapor. Serentak. Selesai.
              </span>
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-5">
              {TAUTAN_KAKI.map((t) => (
                <Link
                  key={t.href}
                  href={t.href}
                  className="inline-flex min-h-[44px] items-center transition hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-daun-600"
                >
                  {t.label}
                </Link>
              ))}
              <p>
                Untuk Kota & Permukiman Berkelanjutan · SDG 11 · Infinitera 2.0
              </p>
            </div>
          </div>
        </footer>
      </Gerak>
    </>
  );
}
