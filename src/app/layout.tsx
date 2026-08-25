import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Fraunces, Public_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { CommandPalette } from "@/components/command-palette";

const inter = Public_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-editorial",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: {
    default: "SIGAP — Lapor. Serentak. Selesai.",
    template: "%s · SIGAP",
  },
  description:
    "Platform pelaporan masalah permukiman berbasis peta interaktif. Warga melapor, saling dukung, pemerintah menindaklanjuti — transparan dan terukur.",
};

export const viewport = {
  themeColor: "#237f45",
  width: "device-width",
  initialScale: 1,
};

const temaScript = `
(function(){try{var t=localStorage.getItem("tema");if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark")}}catch(e){}})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: temaScript }} />
      </head>
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${fraunces.variable} grain font-sans antialiased`}>
        <a href="#isi-utama" className="lompat-ke-isi">
          Lompat ke konten utama
        </a>
        <SiteHeader />
        <CommandPalette />
        <div id="isi-utama">{children}</div>
        <footer className="border-t garis-halus mt-16">
          <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-muted flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-display font-semibold text-base">
              SIGAP{" "}
              <span className="font-normal text-muted">— Lapor. Serentak. Selesai.</span>
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-5">
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
      </body>
    </html>
  );
}
