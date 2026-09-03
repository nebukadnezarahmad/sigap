import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PasarKlien } from "./pasar-klien";

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
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold">Database belum tersambung</h1>
      </main>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: raw } = await supabase
    .from("pasar_barang")
    .select("id, user_id, judul, deskripsi, kategori, kondisi, titik_ambil, status, created_at, pemilik:profiles!pasar_barang_user_id_fkey(username)")
    .order("created_at", { ascending: false })
    .limit(60);

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
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-daun-600 dark:text-daun-400">
          Ekonomi sirkular warga
        </p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight">
          Pasar ReUse
        </h1>
        <p className="mt-3 max-w-xl text-muted teks-pretty">
          Barang bekas layak pakai dipindahtangankan gratis antar-warga. Kurangi
          tumpukan sampah, perpanjang usia barang. Pasang barangmu dan dapatkan
          poin.
        </p>
      </header>

      <PasarKlien awal={barang} masuk={!!user} />
    </main>
  );
}
