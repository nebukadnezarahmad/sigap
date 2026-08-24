import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: {
    default: "SIGAP — Lapor. Serentak. Selesai.",
    template: "%s · SIGAP",
  },
  description:
    "Platform pelaporan masalah permukiman berbasis peta interaktif. Warga melapor, saling dukung, pemerintah menindaklanjuti — transparan dan terukur.",
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
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased`}>
        <SiteHeader />
        {children}
        <footer className="border-t garis-halus mt-16">
          <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-muted flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-display font-semibold text-base">
              SIGAP{" "}
              <span className="font-normal text-muted">— Lapor. Serentak. Selesai.</span>
            </p>
            <p>
              Untuk Kota & Permukiman Berkelanjutan · SDG 11 · Infinitera 2.0
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
