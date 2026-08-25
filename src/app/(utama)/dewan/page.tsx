import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { LaporanDenganRelasi } from "@/types/database";
import type { StatusKey } from "@/lib/constants";
import { DewanClient } from "./dewan-klien";

export const metadata: Metadata = {
  title: "Dashboard Dewan",
};

export const dynamic = "force-dynamic";

export default async function HalamanDewan() {
  const supabase = await createClient();
  if (!supabase) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold">Database belum tersambung</h1>
        <p className="mt-2 text-muted">
          Isi env Supabase lalu jalankan schema.sql — lihat README.
        </p>
      </main>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/masuk?next=/dewan");
  const { data: profil } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profil?.role !== "admin") redirect("/peta");

  const { data: semua } = await supabase
    .from("reports")
    .select(
      `*, lat, lng, categories(slug,nama,warna),
       profiles!reports_user_id_fkey(id,username,nama_lengkap,avatar_url),
       votes(count), comments(count)`
    )
    .order("created_at", { ascending: false })
    .limit(500);

  const daftar: LaporanDenganRelasi[] = (semua ?? []).map((r) => ({
    ...r,
    vote_count: r.votes?.[0]?.count ?? 0,
    comment_count: r.comments?.[0]?.count ?? 0,
  }));

  const { count: totalWarga } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true });

  const hitungStatus: Record<string, number> = {};
  const hitungKategori = new Map<
    string,
    { nama: string; warna: string; jumlah: number }
  >();
  const trenMap = new Map<string, number>();
  const panas: [number, number][] = [];

  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    trenMap.set(d.toISOString().slice(5, 10), 0);
  }

  for (const r of daftar) {
    hitungStatus[r.status] = (hitungStatus[r.status] ?? 0) + 1;
    const slug = r.categories?.slug ?? "lainnya";
    const entri = hitungKategori.get(slug) ?? {
      nama: r.categories?.nama ?? "Lainnya",
      warna: r.categories?.warna ?? "#64748b",
      jumlah: 0,
    };
    entri.jumlah++;
    hitungKategori.set(slug, entri);

    const tgl = r.created_at.slice(5, 10);
    if (trenMap.has(tgl)) trenMap.set(tgl, (trenMap.get(tgl) ?? 0) + 1);

    if (r.lat != null && r.lng != null) panas.push([r.lat, r.lng]);
  }

  return (
    <DewanClient
      daftar={daftar}
      hitungStatus={hitungStatus as Partial<Record<StatusKey, number>>}
      kategori={[...hitungKategori.values()]}
      tren={[...trenMap.entries()].map(([tanggal, jumlah]) => ({ tanggal, jumlah }))}
      panas={panas}
      totalWarga={totalWarga ?? 0}
    />
  );
}
