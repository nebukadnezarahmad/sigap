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
      <body className={`${poppins.variable} ${fraunces.variable} grain font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
