import type { Metadata } from "next";
import { Card } from "@/components/ui";

export const metadata: Metadata = { title: "Ketentuan" };

export default function HalamanKetentuan() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-14">
      <h1 className="font-display text-3xl font-bold">Ketentuan penggunaan</h1>
      <p className="mt-3 teks-pretty text-muted">
        Dengan memakai SIGAP, kamu menyetujui hal-hal berikut.
      </p>
      <div className="mt-8 space-y-4">
        <Card className="p-5">
          <h2 className="font-display font-bold">Isi laporan</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Laporan harus benar dan berdasarkan pengamatanmu sendiri. Dilarang
            mengunggah konten yang mengandung unsur SARA, pornografi, promosi
            produk, atau melanggar hukum yang berlaku di Indonesia.
          </p>
        </Card>
        <Card className="p-5">
          <h2 className="font-display font-bold">Peran dewan</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            SIGAP adalah saluran pelaporan dan transparansi. Keputusan
            penanganan lapangan berada pada pemerintah desa/kota pengguna
            platform.
          </p>
        </Card>
        <Card className="p-5">
          <h2 className="font-display font-bold">Data peta</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Peta dasar disediakan OpenStreetMap & CARTO. Titik laporan adalah
            perkiraan lokasi yang dipilih pengguna, bukan pengukuran survei
            resmi.
          </p>
        </Card>
      </div>
    </main>
  );
}
