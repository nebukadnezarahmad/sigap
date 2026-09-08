import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { LayananKlien } from "./layanan-klien";
import {
  GalatMuatUlang,
  KontenUtama,
  PageHeader,
} from "@/components/layout-konten";

export const metadata: Metadata = { title: "Direktori Layanan" };
export const dynamic = "force-dynamic";

export default async function HalamanLayanan() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <KontenUtama>
        <GalatMuatUlang judul="Direktori Layanan belum bisa dimuat" />
      </KontenUtama>
    );
  }

  const { data: layanan } = await supabase
    .from("layanan_penting")
    .select("id, nama, kategori, telepon, bisa_wa, alamat, jam_layanan")
    .order("urutan", { ascending: true });

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <PageHeader
        eyebrow="Nomor yang wajib dihafal"
        judul="Direktori Layanan"
        deskripsi="Kontak darurat dan layanan harian lingkunganmu — satu ketukan untuk menelepon atau chat WhatsApp. Tidak perlu lagi mencari-cari saat keadaan mendesak."
      />

      <LayananKlien
        awal={
          (layanan ?? []).map((l) => ({
            id: l.id,
            nama: l.nama,
            kategori: l.kategori,
            telepon: l.telepon,
            bisaWa: l.bisa_wa,
            alamat: l.alamat,
            jam: l.jam_layanan,
          }))
        }
      />
    </main>
  );
}
