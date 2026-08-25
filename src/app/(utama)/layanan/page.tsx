import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { LayananKlien } from "./layanan-klien";

export const metadata: Metadata = { title: "Direktori Layanan" };
export const dynamic = "force-dynamic";

export default async function HalamanLayanan() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold">Database belum tersambung</h1>
      </main>
    );
  }

  const { data: layanan } = await supabase
    .from("layanan_penting")
    .select("id, nama, kategori, telepon, bisa_wa, alamat, jam_layanan")
    .order("urutan", { ascending: true });

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-daun-600 dark:text-daun-400">
          Nomor yang wajib dihafal
        </p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight">
          Direktori Layanan
        </h1>
        <p className="mt-3 max-w-xl text-muted teks-pretty">
          Kontak darurat dan layanan harian lingkunganmu — satu ketukan untuk
          menelepon atau chat WhatsApp. Tidak perlu lagi mencari-cari saat
          keadaan mendesak.
        </p>
      </header>

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
