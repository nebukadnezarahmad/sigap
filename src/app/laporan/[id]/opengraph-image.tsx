import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";
import { kategoriBySlug } from "@/lib/constants";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Pratinjau laporan SIGAP";

export default async function Gambar({ params }: { params: { id: string } }) {
  const { id } = await params;
  let judul = "Laporan Warga";
  let kategori = "Lainnya";
  let status = "baru";
  let nama = "Warga";

  try {
    const supabase = await createClient();
    if (supabase) {
      const { data } = await supabase
        .from("reports")
        .select(
          `judul, status, categories(nama), profiles!reports_user_id_fkey(nama_lengkap)`
        )
        .eq("id", id)
        .single();
      if (data) {
        const baris = data as unknown as {
          judul: string;
          status: string;
          categories: { nama: string } | null;
          profiles: { nama_lengkap: string } | null;
        };
        judul = baris.judul;
        status = baris.status;
        kategori = baris.categories?.nama ?? "Lainnya";
        nama = baris.profiles?.nama_lengkap ?? "Warga";
      }
    }
  } catch {
    /* fallback teks bawaan */
  }

  const kat = kategoriBySlug(
    kategori === "Lainnya" ? "lainnya" : kategori.toLowerCase().includes("drainase") ? "drainase" : "lainnya"
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #f6f4ef 0%, #dcf3e0 100%)",
          padding: 64,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "#237f45",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 30,
              fontWeight: 700,
            }}
            aria-hidden
          >
            S
          </div>
          <div style={{ fontSize: 34, fontWeight: 700, color: "#1a2420" }}>
            SIGAP
          </div>
          <div
            style={{
              marginLeft: "auto",
              fontSize: 24,
              fontWeight: 600,
              color: "#237f45",
              background: "#ffffffcc",
              padding: "8px 20px",
              borderRadius: 999,
              border: "2px solid #bbe7c6",
            }}
          >
            {status.toUpperCase()}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 26, color: "#5c6b64", display: "flex", gap: 10 }}>
            <span>{kat.emoji}</span>
            <span>{kategori}</span>
          </div>
          <div
            style={{
              fontSize: 58,
              fontWeight: 800,
              lineHeight: 1.15,
              color: "#1a2420",
              maxWidth: 1000,
            }}
          >
            {judul}
          </div>
        </div>

        <div style={{ fontSize: 24, color: "#5c6b64" }}>
          Dilaporkan oleh {nama} · Lapor. Serentak. Selesai.
        </div>
      </div>
    ),
    size
  );
}
