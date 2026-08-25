import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import type { LaporanDenganRelasi } from "@/types/database";
import { Jelajah } from "@/components/map/jelajah";

export const metadata: Metadata = {
  title: "Peta Masalah",
};

export const dynamic = "force-dynamic";

export default async function HalamanPeta() {
  let awal: LaporanDenganRelasi[] = [];
  let dbAktif = true;

  try {
    const supabase = await createClient();
    if (!supabase) {
      dbAktif = false;
    } else {
      const { data, error } = await supabase
        .from("reports")
        .select(
          `*, lat, lng, categories(slug,nama,warna,emoji),
           profiles!reports_user_id_fkey(id,username,nama_lengkap,avatar_url),
           votes(count), comments(count)`
        )
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      awal = (data ?? []).map((r) => ({
        ...r,
        vote_count: r.votes?.[0]?.count ?? 0,
        comment_count: r.comments?.[0]?.count ?? 0,
      }));
    }
  } catch {
    dbAktif = false;
  }

  return (
    <Suspense fallback={<main className="mx-auto max-w-7xl px-4 py-6" />}>
      <Jelajah laporanAwal={awal} dbAktif={dbAktif} />
    </Suspense>
  );
}
