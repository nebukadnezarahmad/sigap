import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { CommandPalette } from "@/components/command-palette";
import { Gerak } from "@/components/gerak";

const TAUTAN_KAKI = [
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
        <div id="isi-utama" tabIndex={-1}>
          {children}
        </div>
        <footer className="mt-16 bg-[#f5f5f7] print:hidden">
          <div className="mx-auto max-w-6xl px-4 py-16 text-muted">
            <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
              <p className="text-[14px] font-semibold leading-[1.29] tracking-[-0.224px]">
                SIGAP{" "}
                <span className="font-normal text-muted">
                  — Lapor. Serentak. Selesai.
                </span>
              </p>
              <nav
                aria-label="Tautan kaki"
                className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-5"
              >
                {TAUTAN_KAKI.map((t) => (
                  <Link
                    key={t.href}
                    href={t.href}
                    className="inline-flex min-h-[44px] items-center text-[17px] leading-[2.41] transition hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-daun-600"
                  >
                    {t.label}
                  </Link>
                ))}
              </nav>
            </div>
            <p className="mt-8 border-t border-black/10 pt-4 text-xs leading-relaxed">
              Untuk Kota & Permukiman Berkelanjutan · SDG 11 · Infinitera 2.0
            </p>
          </div>
        </footer>
      </Gerak>
    </>
  );
}
