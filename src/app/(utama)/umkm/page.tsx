import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { UmkmKlien } from "./umkm-klien";
import {
  GalatMuatUlang,
  KontenUtama,
  PageHeader,
} from "@/components/layout-konten";

export const metadata: Metadata = { title: "UMKM Warga" };
export const dynamic = "force-dynamic";

export default async function HalamanUmkm() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <KontenUtama lebar="lebar">
        <GalatMuatUlang judul="UMKM Warga belum bisa dimuat" />
      </KontenUtama>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: raw, error: galatUmkm } = await supabase
    .from("umkm")
    .select("id, nama, kategori, produk, whatsapp, alamat, jam_buka, verified, owner_id")
    .order("verified", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(60);

  if (galatUmkm) {
    return (
      <KontenUtama lebar="lebar">
        <GalatMuatUlang judul="UMKM Warga belum bisa dimuat" />
      </KontenUtama>
    );
  }

  const umkm = (raw ?? []).map((u) => ({
    id: u.id,
    nama: u.nama,
    kategori: u.kategori,
    produk: u.produk,
    whatsapp: u.whatsapp,
    alamat: u.alamat,
    jamBuka: u.jam_buka,
    verified: u.verified,
    milikKu: user ? u.owner_id === user.id : false,
  }));

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <PageHeader
        eyebrow="Ekonomi lingkunganmu"
        judul="UMKM Warga"
        deskripsi="Usaha tetanggamu lebih dekat daripada yang kamu kira. Belanja dari usaha warga berarti memperkuat ekonomi lingkungan sekaligus memangkas jejak transportasi."
      />

      <UmkmKlien awal={umkm} masuk={!!user} />
    </main>
  );
}
