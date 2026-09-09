import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PasarKlien } from "./pasar-klien";
import {
  GalatMuatUlang,
  KontenUtama,
  PageHeader,
} from "@/components/layout-konten";

export const metadata: Metadata = { title: "Pasar ReUse" };
export const dynamic = "force-dynamic";

export type Barang = {
  id: string;
  judul: string;
  deskripsi: string | null;
  kategori: string;
  kondisi: string;
  titik_ambil: string;
  status: string;
  pemilik_id: string;
  pemilik_nama: string | null;
  milikKu: boolean;
};

export default async function HalamanPasar() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <KontenUtama lebar="lebar">
        <GalatMuatUlang judul="Pasar ReUse belum bisa dimuat" />
      </KontenUtama>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: raw, error: galatPasar } = await supabase
    .from("pasar_barang")
    .select("id, user_id, judul, deskripsi, kategori, kondisi, titik_ambil, status, created_at, pemilik:profiles!pasar_barang_user_id_fkey(username)")
    .order("created_at", { ascending: false })
    .limit(60);

  if (galatPasar) {
    return (
      <KontenUtama lebar="lebar">
        <GalatMuatUlang judul="Pasar ReUse belum bisa dimuat" />
      </KontenUtama>
    );
  }

  const barang: Barang[] = (raw ?? []).map((b) => {
    const pemilik = b.pemilik as
      | { username: string }
      | { username: string }[]
      | null
      | undefined;
    const pemilik_nama = Array.isArray(pemilik)
      ? (pemilik[0]?.username ?? null)
      : (pemilik?.username ?? null);
    return {
      id: b.id,
      judul: b.judul,
      deskripsi: b.deskripsi,
      kategori: b.kategori,
      kondisi: b.kondisi,
      titik_ambil: b.titik_ambil,
      status: b.status,
      pemilik_id: b.user_id,
      pemilik_nama,
      milikKu: user ? b.user_id === user.id : false,
    };
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <PageHeader
        eyebrow="Ekonomi sirkular warga"
        judul="Pasar ReUse"
        deskripsi="Barang bekas layak pakai dipindahtangankan gratis antar-warga. Kurangi tumpukan sampah, perpanjang usia barang. Pasang barangmu dan dapatkan poin."
      />

      <PasarKlien awal={barang} masuk={!!user} />
    </main>
  );
}
