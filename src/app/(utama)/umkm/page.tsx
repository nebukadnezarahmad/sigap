import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { GalatUmkm, UmkmKlien } from "./umkm-klien";

export const metadata: Metadata = { title: "UMKM Warga" };
export const dynamic = "force-dynamic";

export default async function HalamanUmkm() {
  const supabase = await createClient();

  if (!supabase) {
    return <GalatUmkm />;
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
      <header className="mb-6 rounded-[18px] border border-ap-hairline bg-white p-6 text-ap-ink shadow-none dark:border-line dark:bg-panel dark:text-ink">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-daun-600 dark:text-daun-400">
          Ekonomi lingkunganmu
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold leading-[1.1] tracking-[-0.28px]">
          UMKM Warga
        </h1>
        <p className="mt-2 max-w-2xl text-muted teks-pretty">
          Usaha tetanggamu lebih dekat daripada yang kamu kira. Belanja di
          warga berarti memperkuat ekonomi lingkungan sekaligus memangkas
          jejak transportasi.
        </p>
      </header>

      <div className="rounded-[18px] border border-ap-hairline bg-ap-parchment p-4 shadow-none sm:p-6 dark:border-line dark:bg-panel-2">
        <UmkmKlien awal={umkm} masuk={!!user} />
      </div>
    </main>
  );
}
