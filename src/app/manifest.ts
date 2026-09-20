import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "SIGAP — Lapor. Serentak. Selesai.",
    short_name: "SIGAP",
    description:
      "Platform pelaporan masalah permukiman berbasis peta interaktif untuk kota dan desa berkelanjutan.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f5f7",
    theme_color: "#0066cc",
    lang: "id",
    icons: [
      {
        src: "/ikon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
