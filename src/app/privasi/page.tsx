import type { Metadata } from "next";
import { Card } from "@/components/ui";

export const metadata: Metadata = { title: "Privasi" };

export default function HalamanPrivasi() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-14">
      <h1 className="font-display text-3xl font-bold">Privasi</h1>
      <p className="mt-3 teks-pretty text-muted">
        SIGAP mengumpulkan data seminimal mungkin agar laporan bisa
        dipertanggungjawabkan dan penanganannya terpantau.
      </p>
      <div className="mt-8 space-y-4">
        <Card className="p-5">
          <h2 className="font-display font-bold">Yang kami simpan</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Nama, username, dan email akunmu; isi laporan (judul, deskripsi,
            foto, titik koordinat yang kamu pilih sendiri); serta aktivitas
            partisipasi (dukungan, komentar, poin, badge).
          </p>
        </Card>
        <Card className="p-5">
          <h2 className="font-display font-bold">Yang terlihat publik</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Laporan, komentar, nama, dan username tampil publik demi
            transparansi penanganan. Email tidak pernah ditampilkan. Kata sandi
            tersimpan terenkripsi oleh penyedia autentikasi (Supabase Auth) dan
            tidak pernah bisa dibaca siapa pun.
          </p>
        </Card>
        <Card className="p-5">
          <h2 className="font-display font-bold">Hakmu</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Kamu dapat menghapus laporanmu sendiri selama statusnya masih baru,
            menghapus komentarmu kapan pun, dan meminta penghapusan akun melalui
            narahubung lomba.
          </p>
        </Card>
      </div>
    </main>
  );
}
