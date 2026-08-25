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
};

export const KATEGORI: KategoriDef[] = [
  { slug: "sampah", nama: "Sampah Menumpuk", warna: "#65a30d" },
  { slug: "drainase", nama: "Drainase & Banjir", warna: "#0284c7" },
  { slug: "lampu", nama: "Lampu Jalan Mati", warna: "#f59e0b" },
  { slug: "jalan", nama: "Jalan Rusak", warna: "#78716c" },
  { slug: "ruang-hijau", nama: "Ruang Hijau", warna: "#059669" },
  { slug: "lainnya", nama: "Lainnya", warna: "#64748b" },
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
  ikon: string;
};

export const BADGES: BadgeDef[] = [
  {
    key: "langkah_pertama",
    nama: "Langkah Pertama",
    deskripsi: "Melaporkan masalah pertamamu",
    ikon: "semai",
  },
  {
    key: "kontributor",
    nama: "Kontributor",
    deskripsi: "5 laporan terkirim",
    ikon: "kontributor",
  },
  {
    key: "juru_bersih",
    nama: "Juru Bersih",
    deskripsi: "10 laporan terkirim",
    ikon: "juru_bersih",
  },
  {
    key: "pendengar",
    nama: "Pendengar",
    deskripsi: "Mendukung 10 laporan warga lain",
    ikon: "pendengar",
  },
  {
    key: "suara_rakyat",
    nama: "Suara Rakyat",
    deskripsi: "Mendukung 25 laporan",
    ikon: "suara_rakyat",
  },
  {
    key: "pemberi_semangat",
    nama: "Pemberi Semangat",
    deskripsi: "Menulis 10 komentar",
    ikon: "pemberi_semangat",
  },
];

export type LevelDef = {
  key: string;
  nama: string;
  min: number;
  ikon: string;
};

export const LEVELS: LevelDef[] = [
  { key: "semai", nama: "Semai", min: 0, ikon: "semai" },
  { key: "tunas", nama: "Tunas", min: 50, ikon: "tunas" },
  { key: "pohon", nama: "Pohon", min: 150, ikon: "pohon" },
  { key: "rimbawan", nama: "Rimbawan", min: 400, ikon: "rimbawan" },
];

export function levelDari(poin: number) {
  let idx = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    if (poin >= LEVELS[i].min) idx = i;
  }
  const sekarang = LEVELS[idx];
  const berikut = LEVELS[idx + 1] ?? null;
  const maju = berikut ? berikut.min - sekarang.min : 1;
  const progres = berikut
    ? Math.min(100, Math.round(((poin - sekarang.min) / maju) * 100))
    : 100;
  return { sekarang, berikut, progres };
}

export const SLA_HARI = 7;

export function umurHari(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}
