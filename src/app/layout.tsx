import type { Metadata, Viewport } from "next";
import { Poppins, Fraunces } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f7" },
    { media: "(prefers-color-scheme: dark)", color: "#111113" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const BASIS_URL = "https://sigap-murex-seven.vercel.app";

const DESKRIPSI_SIGAP =
  "Platform pelaporan masalah permukiman berbasis peta interaktif. Warga melapor, saling dukung, pemerintah menindaklanjuti — transparan dan terukur.";

export const metadata: Metadata = {
  metadataBase: new URL(BASIS_URL),
  title: {
    default: "SIGAP — Lapor. Serentak. Selesai.",
    template: "%s · SIGAP",
  },
  description: DESKRIPSI_SIGAP,
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "SIGAP — Lapor. Serentak. Selesai.",
    description: DESKRIPSI_SIGAP,
    type: "website",
    locale: "id_ID",
    siteName: "SIGAP",
    url: "/",
    // TODO(owner): rancang gambar OG khusus (1200×630 PNG). Sementara pakai ikon yang ada.
    images: [{ url: "/ikon.svg", alt: "Logo SIGAP" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SIGAP — Lapor. Serentak. Selesai.",
    description: DESKRIPSI_SIGAP,
    images: ["/ikon.svg"],
  },
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
      <body className={`${poppins.variable} ${fraunces.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
