import type { Metadata, Viewport } from "next";
import { Fraunces, Public_Sans } from "next/font/google";
import { GerakProvider } from "@/components/gerak-provider";
import "./globals.css";

/**
 * Dua keluarga font, bukan tiga.
 * Public Sans — turunan Libre Franklin yang dipakai design system pemerintahan
 * AS; netral, tinggi x besar, terbaca di layar murah. Untuk seluruh UI & data.
 * Fraunces — serif variabel dengan sumbu optical size; memikul seluruh peran
 * display. Space Grotesk dilepas: ia salah satu sidik jari paling khas situs
 * generasi AI, dan font ketiga tidak membayar ongkosnya.
 */
const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-teks",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-tampil",
  style: ["normal", "italic"],
  // opsz: bentuk huruf menyesuaikan ukuran optis — judul 60px dan 20px tidak
  // lagi memakai gambar huruf yang sama. SOFT/WONK memberi karakter
  // idiosinkratik pada display besar (lihat .tampil-wonk di globals.css).
  axes: ["SOFT", "WONK", "opsz"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#237f45",
  width: "device-width",
  initialScale: 1,
};

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
      <body
        className={`${publicSans.variable} ${fraunces.variable} grain font-sans antialiased`}
      >
        <GerakProvider>{children}</GerakProvider>
      </body>
    </html>
  );
}
