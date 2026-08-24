export type Profil = {
  id: string;
  username: string;
  nama_lengkap: string;
  avatar_url: string | null;
  role: "warga" | "admin";
  poin: number;
  created_at: string;
};

export type Kategori = {
  id: number;
  slug: string;
  nama: string;
  warna: string;
  emoji: string;
};

export type StatusLaporan =
  | "baru"
  | "diverifikasi"
  | "dikerjakan"
  | "selesai"
  | "ditolak";

export type Laporan = {
  id: string;
  user_id: string;
  category_id: number;
  judul: string;
  deskripsi: string;
  lokasi: { type: "Point"; coordinates: [number, number] };
  alamat_teks: string | null;
  foto_url: string | null;
  status: StatusLaporan;
  created_at: string;
  updated_at: string;
  vote_count?: number;
  comment_count?: number;
};

export type LaporanDenganRelasi = Laporan & {
  categories: Pick<Kategori, "slug" | "nama" | "warna" | "emoji"> | null;
  profiles:
    | Pick<Profil, "id" | "username" | "nama_lengkap" | "avatar_url">
    | null;
};

export type Komentar = {
  id: string;
  report_id: string;
  user_id: string;
  isi: string;
  created_at: string;
  profiles?:
    | Pick<Profil, "id" | "username" | "nama_lengkap" | "avatar_url">
    | null;
};

export type EventStatus = {
  id: string;
  report_id: string;
  status: StatusLaporan;
  catatan: string | null;
  created_at: string;
  profiles: Pick<Profil, "nama_lengkap"> | null;
};

export type LeaderboardRow = {
  id: string;
  username: string;
  nama_lengkap: string;
  avatar_url: string | null;
  poin: number;
};

export type StatistikUmum = {
  total_laporan: number;
  laporan_selesai: number;
  total_warga: number;
};
