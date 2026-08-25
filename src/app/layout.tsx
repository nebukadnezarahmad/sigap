import type { Metadata, Viewport } from "next";
import { Fraunces, Public_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";

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
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${fraunces.variable} grain font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
