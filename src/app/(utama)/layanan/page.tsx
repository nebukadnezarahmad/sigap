import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { GalatLayanan, LayananKlien } from "./layanan-klien";

export const metadata: Metadata = { title: "Direktori Layanan" };
export const dynamic = "force-dynamic";

export default async function HalamanLayanan() {
  const supabase = await createClient();

  if (!supabase) {
    return <GalatLayanan />;
  }

  const { data: layanan } = await supabase
    .from("layanan_penting")
    .select("id, nama, kategori, telepon, bisa_wa, alamat, jam_layanan")
    .order("urutan", { ascending: true });

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-6 rounded-[18px] border border-ap-hairline bg-white p-6 text-ap-ink shadow-none dark:border-line dark:bg-panel dark:text-ink">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-daun-600 dark:text-daun-400">
          Nomor yang wajib dihafal
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold leading-[1.1] tracking-[-0.28px]">
          Direktori Layanan
        </h1>
        <p className="mt-2 max-w-2xl text-muted teks-pretty">
          Kontak darurat dan layanan harian lingkunganmu. Satu ketukan untuk
          menelepon atau chat WhatsApp. Tidak perlu lagi mencari-cari saat
          keadaan mendesak.
        </p>
      </header>

      <div className="rounded-[18px] border border-ap-hairline bg-ap-parchment p-4 shadow-none sm:p-6 dark:border-line dark:bg-panel-2">
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
      </div>
    </main>
  );
}
