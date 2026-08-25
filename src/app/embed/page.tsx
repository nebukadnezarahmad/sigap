import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { PetaEmbedKlien } from "@/components/map/peta-embed-klien";
import { createClient } from "@/lib/supabase/server";
import type { LaporanDenganRelasi } from "@/types/database";
import { KATEGORI, STATUS, type StatusKey } from "@/lib/constants";

export const metadata: Metadata = { title: "Widget Peta" };
export const dynamic = "force-dynamic";

export default async function HalamanEmbed() {
  let titik: {
    id: string;
    lat: number;
    lng: number;
    warna: string;
    slug: string;
    judul: string;
  }[] = [];

  try {
    const supabase = await createClient();
    if (supabase) {
      const { data } = await supabase
        .from("reports")
        .select("id, judul, status, lat, lng, categories(slug,warna)")
        .order("created_at", { ascending: false })
        .limit(300);
      titik = ((data ?? []) as unknown as LaporanDenganRelasi[])
        .filter((r) => r.lat != null && r.lng != null)
        .map((r) => ({
          id: r.id,
          lat: r.lat as number,
          lng: r.lng as number,
          warna: r.categories?.warna ?? "#64748b",
          slug: r.categories?.slug ?? "lainnya",
          judul: `${r.judul} · ${STATUS[r.status as StatusKey]?.label ?? ""}`,
        }));
    }
  } catch {
    /* peta kosong */
  }

  return (
    <main className="relative h-dvh w-full overflow-hidden">
      <PetaEmbedKlien titik={titik} />
      <div className="absolute left-3 top-3 z-[600] flex items-center gap-2 rounded-full border garis-halus bg-panel/90 py-1.5 pl-2 pr-3 shadow backdrop-blur">
        <span className="flex size-6 items-center justify-center rounded-full bg-daun-600 text-white">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </span>
        <span className="font-display text-sm font-bold">SIGAP</span>
        <span className="angka-tabular text-xs text-muted">
          {titik.length} laporan
        </span>
        <Link
          href="/peta"
          target="_blank"
          rel="noopener"
          className="ml-1 flex items-center gap-1 rounded-full bg-daun-600 px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-daun-700"
        >
          Buka penuh <ExternalLink size={10} />
        </Link>
      </div>
      <div className="absolute bottom-3 left-3 z-[600] flex flex-wrap gap-1.5">
        {KATEGORI.map((k) => (
          <span
            key={k.slug}
            className="flex items-center gap-1 rounded-full border garis-halus bg-panel/90 px-2 py-1 text-[10px] font-semibold text-muted backdrop-blur"
          >
            <span
              className="size-1.5 rounded-full"
              style={{ backgroundColor: k.warna }}
            />
            {k.nama}
          </span>
        ))}
      </div>
    </main>
  );
}
