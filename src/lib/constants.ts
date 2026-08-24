export const APP_NAME = "SIGAP";
export const APP_TAGLINE = "Lapor. Serentak. Selesai.";

export type StatusKey =
  | "baru"
  | "diverifikasi"
  | "dikerjakan"
  | "selesai"
  | "ditolak";

export const STATUS: Record<
  StatusKey,
  { label: string; warna: string; chip: string }
> = {
  baru: {
    label: "Baru",
    warna: "#f59e0b",
    chip: "bg-kunyit-500/15 text-kunyit-600 dark:text-kunyit-400",
  },
  diverifikasi: {
    label: "Diverifikasi",
    warna: "#0284c7",
    chip: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  },
  dikerjakan: {
    label: "Dikerjakan",
    warna: "#7c3aed",
    chip: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
  },
  selesai: {
    label: "Selesai",
    warna: "#16a34a",
    chip: "bg-daun-500/15 text-daun-700 dark:text-daun-400",
  },
  ditolak: {
    label: "Ditolak",
    warna: "#dc2626",
    chip: "bg-danger/10 text-danger",
  },
};

export type KategoriDef = {
  slug: string;
  nama: string;
  warna: string;
  emoji: string;
};

export const KATEGORI: KategoriDef[] = [
  { slug: "sampah", nama: "Sampah Menumpuk", warna: "#65a30d", emoji: "🗑️" },
  { slug: "drainase", nama: "Drainase & Banjir", warna: "#0284c7", emoji: "🌊" },
  { slug: "lampu", nama: "Lampu Jalan Mati", warna: "#f59e0b", emoji: "💡" },
  { slug: "jalan", nama: "Jalan Rusak", warna: "#78716c", emoji: "🛣️" },
  { slug: "ruang-hijau", nama: "Ruang Hijau", warna: "#059669", emoji: "🌳" },
  { slug: "lainnya", nama: "Lainnya", warna: "#64748b", emoji: "📌" },
];

export function kategoriBySlug(slug: string): KategoriDef {
  return (
    KATEGORI.find((k) => k.slug === slug) ?? KATEGORI[KATEGORI.length - 1]
  );
}

export const POIN = {
  lapor: 10,
  komentar: 3,
  vote: 1,
} as const;

export type BadgeDef = {
  key: string;
  nama: string;
  deskripsi: string;
  emoji: string;
};

export const BADGES: BadgeDef[] = [
  {
    key: "langkah_pertama",
    nama: "Langkah Pertama",
    deskripsi: "Melaporkan masalah pertamamu",
    emoji: "🌱",
  },
  {
    key: "kontributor",
    nama: "Kontributor",
    deskripsi: "5 laporan terkirim",
    emoji: "🤝",
  },
  {
    key: "juru_bersih",
    nama: "Juru Bersih",
    deskripsi: "10 laporan terkirim",
    emoji: "🧹",
  },
  {
    key: "pendengar",
    nama: "Pendengar",
    deskripsi: "Mendukung 10 laporan warga lain",
    emoji: "👂",
  },
  {
    key: "suara_rakyat",
    nama: "Suara Rakyat",
    deskripsi: "Mendukung 25 laporan",
    emoji: "📣",
  },
  {
    key: "pemberi_semangat",
    nama: "Pemberi Semangat",
    deskripsi: "Menulis 10 komentar",
    emoji: "🔥",
  },
];
