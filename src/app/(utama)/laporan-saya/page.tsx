import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { LaporanDenganRelasi } from "@/types/database";
import { Card, StatusChip } from "@/components/ui";
import { AksiLaporanSaya } from "./aksi";
import { HapusAreaKlien } from "./hapus-area";

export const metadata: Metadata = { title: "Laporan Saya" };
export const dynamic = "force-dynamic";

export default async function HalamanLaporanSaya() {
  const supabase = await createClient();
  if (!supabase) redirect("/peta");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/masuk?next=/laporan-saya");

  const { data: milik } = await supabase
    .from("reports")
    .select(
      `*, lat, lng, categories(slug,nama,warna),
       votes(count), comments(count)`
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const daftar = (milik ?? []) as unknown as LaporanDenganRelasi[];

  const { data: areaRaw } = await supabase
    .from("area_follows")
    .select("id, label, radius_m, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  const area = areaRaw ?? [];

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-bold">Laporan Saya</h1>
        <p className="mt-2 text-muted">
          Sunting laporan selama statusnya masih{" "}
          <b className="text-ink">Baru</b>. Setelah diverifikasi dewan, isinya
          terkunci demi akuntabilitas.
        </p>
      </header>

      {daftar.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-muted">
            Kamu belum membuat laporan.{" "}
            <Link href="/peta?lapor=1" className="font-semibold text-daun-700 hover:underline dark:text-daun-300">
              Buat laporan pertamamu
            </Link>
            .
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {daftar.map((r) => (
            <Card key={r.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <StatusChip status={r.status} />
                    <span
                      className="text-xs font-semibold"
                      style={{ color: r.categories?.warna }}
                    >
                      {r.categories?.nama ?? "Lainnya"}
                    </span>
                  </div>
                  <Link
                    href={`/laporan/${r.id}`}
                    className="font-display font-bold hover:underline"
                  >
                    {r.judul}
                  </Link>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">
                    {r.deskripsi}
                  </p>
                  <p className="angka-tabular mt-2 text-xs text-muted">
                    {r.vote_count ?? 0} dukungan · {r.comment_count ?? 0}{" "}
                    komentar
                  </p>
                </div>
                <AksiLaporanSaya
                  laporan={{
                    id: r.id,
                    judul: r.judul,
                    deskripsi: r.deskripsi,
                    alamat_teks: r.alamat_teks ?? "",
                  }}
                  bisaDisunting={r.status === "baru"}
                />
              </div>
            </Card>
          ))}
        </div>
      )}

      {area.length > 0 && (
        <section aria-label="Area yang diikuti" className="mt-10">
          <h2 className="mb-3 font-display text-xl font-bold">
            Area yang kamu ikuti
          </h2>
          <p className="mb-3 text-sm text-muted">
            Kamu mendapat notifikasi setiap ada laporan baru dalam radius ini.
          </p>
          <div className="space-y-2">
            {area.map((a) => (
              <Card key={a.id} className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-sm font-semibold">{a.label}</p>
                  <p className="angka-tabular text-xs text-muted">
                    radius {a.radius_m} m
                  </p>
                </div>
                <HapusAreaKlien id={a.id} />
              </Card>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}


