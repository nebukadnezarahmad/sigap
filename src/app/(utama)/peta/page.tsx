import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import type { LaporanDenganRelasi } from "@/types/database";
import { Jelajah } from "@/components/map/jelajah";

export type FasilitasRingkas = {
  id: string;
  nama: string;
  jenis: string;
  alamat: string | null;
  jam_buka: string | null;
  lat: number;
  lng: number;
};

export const metadata: Metadata = {
  title: "Peta Masalah",
};

export const dynamic = "force-dynamic";

export default async function HalamanPeta() {
  let awal: LaporanDenganRelasi[] = [];
  let fasilitas: FasilitasRingkas[] = [];
  let dbAktif = true;

  try {
    const supabase = await createClient();
    if (!supabase) {
      dbAktif = false;
    } else {
      const [{ data, error }, { data: f }] = await Promise.all([
        supabase
          .from("reports")
          .select(
            `*, lat, lng, categories(slug,nama,warna),
             profiles!reports_user_id_fkey(id,username,nama_lengkap,avatar_url),
             votes(count), comments(count)`
          )
          .order("created_at", { ascending: false })
          .limit(300),
        supabase
          .from("facilities")
          .select("id, nama, jenis, alamat, jam_buka, lat, lng")
          .order("created_at", { ascending: false })
          .limit(200),
      ]);
      if (error) throw error;
      awal = (data ?? []).map((r) => ({
        ...r,
        vote_count: r.votes?.[0]?.count ?? 0,
        comment_count: r.comments?.[0]?.count ?? 0,
      }));
      fasilitas = (f ?? []) as FasilitasRingkas[];
    }
  } catch {
    dbAktif = false;
  }

  return (
    <Suspense fallback={<main className="mx-auto max-w-7xl px-4 py-6" />}>
      <Jelajah laporanAwal={awal} dbAktif={dbAktif} fasilitasAwal={fasilitas} />
    </Suspense>
  );
}
