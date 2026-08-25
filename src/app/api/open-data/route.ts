import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "database belum dikonfigurasi" },
      { status: 503 }
    );
  }

  const { data } = await supabase
    .from("reports")
    .select(
      `id, judul, deskripsi, status, petugas, alamat_teks, lat, lng, created_at, updated_at,
       categories(slug, nama),
       votes(count), comments(count)`
    )
    .order("created_at", { ascending: false })
    .limit(1000);

  const daftar = (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id,
    judul: r.judul,
    deskripsi: r.deskripsi,
    status: r.status,
    kategori: (r.categories as { slug?: string; nama?: string } | null)?.slug ?? "lainnya",
    nama_kategori: (r.categories as { nama?: string } | null)?.nama ?? "Lainnya",
    petugas: r.petugas,
    alamat: r.alamat_teks,
    koordinat: { lat: r.lat, lng: r.lng },
    dukungan: (r.votes as { count: number }[] | null)?.[0]?.count ?? 0,
    komentar: (r.comments as { count: number }[] | null)?.[0]?.count ?? 0,
    dilaporkan: r.created_at,
    diperbarui: r.updated_at,
  }));

  return NextResponse.json(
    {
      lisensi: "CC BY 4.0 — atribusi SIGAP / Infinitera 2.0",
      dihasilkan_pada: new Date().toISOString(),
      jumlah: daftar.length,
      data: daftar,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}
