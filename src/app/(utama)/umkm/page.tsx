import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { UmkmKlien } from "./umkm-klien";

export const metadata: Metadata = { title: "UMKM Warga" };
export const dynamic = "force-dynamic";

export default async function HalamanUmkm() {
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
    .from("umkm")
    .select("id, nama, kategori, produk, whatsapp, alamat, jam_buka, verified, owner_id")
    .order("verified", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(60);

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
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-daun-600 dark:text-daun-400">
          Ekonomi lingkunganmu
        </p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight">
          UMKM Warga
        </h1>
        <p className="mt-3 max-w-xl text-muted teks-pretty">
          Usaha tetanggamu lebih dekat daripada yang kamu kira. Belanja di
          warga berarti memperkuat ekonomi lingkungan sekaligus memangkas
          jejak transportasi.
        </p>
      </header>

      <UmkmKlien awal={umkm} masuk={!!user} />
    </main>
  );
}
