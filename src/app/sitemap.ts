import type { MetadataRoute } from "next";

const BASIS_URL = "https://sigap-murex-seven.vercel.app";

// Daftar statis semua rute publik. Rute dinamis (/laporan/[id],
// /warga/[username]) sengaja dikecualikan — tidak bisa dienumerasi statis.
const RUTE_STATIS: { path: string; priority: number }[] = [
  { path: "/", priority: 1 },
  { path: "/peta", priority: 0.9 },
  { path: "/transparansi", priority: 0.8 },
  { path: "/demo", priority: 0.7 },
  { path: "/papan-skor", priority: 0.7 },
  { path: "/daftar", priority: 0.6 },
  { path: "/masuk", priority: 0.5 },
  { path: "/laporan-saya", priority: 0.5 },
  { path: "/aksi", priority: 0.6 },
  { path: "/dewan", priority: 0.6 },
  { path: "/edukasi", priority: 0.6 },
  { path: "/layanan", priority: 0.6 },
  { path: "/pasar", priority: 0.6 },
  { path: "/polling", priority: 0.6 },
  { path: "/umkm", priority: 0.6 },
  { path: "/embed", priority: 0.4 },
  { path: "/ketentuan", priority: 0.3 },
  { path: "/privasi", priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return RUTE_STATIS.map(({ path, priority }) => ({
    url: `${BASIS_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority,
  }));
}
