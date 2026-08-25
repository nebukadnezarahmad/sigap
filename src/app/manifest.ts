import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SIGAP — Lapor. Serentak. Selesai.",
    short_name: "SIGAP",
    description:
      "Platform pelaporan masalah permukiman berbasis peta interaktif untuk kota dan desa berkelanjutan.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f4ef",
    theme_color: "#237f45",
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
