import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hitungSla } from "@/lib/constants";

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

  const daftar = (data ?? []).map((r: Record<string, unknown>) => {
    const slug = (r.categories as { slug?: string; nama?: string } | null)?.slug ?? "lainnya";
    const sla = hitungSla(slug, String(r.created_at));

    return {
      id: r.id,
      judul: r.judul,
      deskripsi: r.deskripsi,
      status: r.status,
      kategori: slug,
      nama_kategori: (r.categories as { nama?: string } | null)?.nama ?? "Lainnya",
      target_sla_hari: sla.targetHari,
      kepatuhan_sla: {
        lewat_sla: sla.lewatSla,
        sisa_hari: sla.sisaHari,
        hari_terlambat: sla.hariTerlambat,
      },
      petugas: r.petugas,
      alamat: r.alamat_teks,
      // Pembulatan ke 3 desimal (~100m) untuk menjaga privasi rumah warga di dataset publik
      koordinat_publik:
        r.lat != null && r.lng != null
          ? {
              lat: Math.round(Number(r.lat) * 1000) / 1000,
              lng: Math.round(Number(r.lng) * 1000) / 1000,
            }
          : null,
      dukungan: (r.votes as { count: number }[] | null)?.[0]?.count ?? 0,
      komentar: (r.comments as { count: number }[] | null)?.[0]?.count ?? 0,
      dilaporkan: r.created_at,
      diperbarui: r.updated_at,
    };
  });

  return NextResponse.json(
    {
      lisensi: "CC BY 4.0 — atribusi SIGAP / Infinitera 2.0",
      kebijakan_privasi: "Koordinat dibulatkan ke grid ~100m untuk melindungi privasi lokasi rumah warga.",
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
