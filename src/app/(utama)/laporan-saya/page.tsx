import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, MapPinOff } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { LaporanDenganRelasi } from "@/types/database";
import { Card, StatusChip } from "@/components/ui";
import { IkonKategori } from "@/lib/ikon-vektor";
import { FeedbackState } from "@/components/feedback-state";
import { GalatMuatUlang, PageHeader } from "@/components/layout-konten";
import { STATUS, type StatusKey } from "@/lib/constants";
import { AksiLaporanSaya } from "./aksi";
import { HapusAreaKlien } from "./hapus-area";
import { GerbangLaporanSaya } from "./gerbang-laporan-saya";

export const metadata: Metadata = { title: "Laporan saya" };
export const dynamic = "force-dynamic";

const PROGRES_STATUS: Record<string, number> = {
  baru: 20,
  diverifikasi: 40,
  dikerjakan: 60,
  menunggu_verifikasi: 80,
  selesai: 100,
  ditolak: 100,
};

export default async function HalamanLaporanSaya() {
  const supabase = await createClient();
  if (!supabase) redirect("/peta");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return <GerbangLaporanSaya />;

  const { data: milik, error: galatLaporan } = await supabase
    .from("reports")
    .select(
      `*, lat, lng, categories(slug,nama,warna),
       votes(count), comments(count)`
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const daftar = (milik ?? []).map((r) => ({
    ...r,
    vote_count: r.votes?.[0]?.count ?? 0,
    comment_count: r.comments?.[0]?.count ?? 0,
  })) as unknown as LaporanDenganRelasi[];

  const { data: areaRaw, error: galatArea } = await supabase
    .from("area_follows")
    .select("id, label, radius_m, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (galatLaporan || galatArea) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <GalatMuatUlang judul="Laporan saya belum bisa dimuat" />
      </main>
    );
  }

  const area = areaRaw ?? [];

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <PageHeader
        eyebrow="Progresmu"
        judul="Laporan saya"
        deskripsi="Sunting laporan selama statusnya masih Baru. Setelah diverifikasi dewan, isinya terkunci demi akuntabilitas."
        aksi={
          <Link
            href="/peta?lapor=1"
            className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-full bg-action px-6 text-sm font-semibold text-white transition hover:bg-action-hover active:scale-[0.97]"
          >
            <Plus size={15} strokeWidth={2.5} /> Buat laporan
          </Link>
        }
      />

      {daftar.length === 0 ? (
        <Card className="p-2">
          <FeedbackState
            jenis="kosong"
            ikon={MapPinOff}
            judul="Belum ada laporan darimu"
            deskripsi="Mulai dari satu titik di sekitarmu. Laporan pertama butuh kurang dari 2 menit. Foto opsional tapi membantu."
            aksi={
              <Link
                href="/peta?lapor=1"
                className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-full bg-action px-7 text-sm font-semibold text-white transition hover:bg-action-hover active:scale-[0.97]"
              >
                <Plus size={15} strokeWidth={2.5} /> Buat laporan pertama
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {daftar.map((r) => (
            <Card key={r.id} className="rounded-[28px] p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <StatusChip status={r.status} />
                    <span className="flex items-center gap-1.5 text-xs font-semibold">
                      {/* Warna hanya di ikon; nama kategori tetap ink agar kontras AA. */}
                      <span style={{ color: r.categories?.warna }} className="flex">
                        <IkonKategori slug={r.categories?.slug ?? "lainnya"} ukuran={13} />
                      </span>
                      {r.categories?.nama ?? "Lainnya"}
                    </span>
                  </div>
                  <Link
                    href={`/laporan/${r.id}`}
                    className="font-display text-[19px] font-semibold tracking-[-0.02em] hover:underline"
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
                  <div
                    className="mt-3 h-1 overflow-hidden rounded-full bg-panel-2"
                    role="progressbar"
                    aria-valuenow={PROGRES_STATUS[r.status] ?? 0}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Progres: ${STATUS[r.status as StatusKey]?.label ?? r.status}`}
                  >
                    <div
                      className="h-full rounded-full transition-[width]"
                      style={{
                        width: `${PROGRES_STATUS[r.status] ?? 0}%`,
                        backgroundColor:
                          STATUS[r.status as StatusKey]?.warna ?? "#94a3b8",
                      }}
                    />
                  </div>
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
          <h2 className="mb-1 font-display text-xl font-bold">
            Area yang diikuti
          </h2>
          <p className="mb-3 text-sm text-muted">
            Dapatkan notifikasi setiap ada laporan baru dalam radius ini.
          </p>
          <div className="rounded-[28px] bg-panel p-3 sm:p-4">
            <div className="flex flex-col gap-[7px]">
            {area.map((a) => (
              <div key={a.id} className="flex min-h-[53px] items-center justify-between gap-3 rounded-[13px] bg-panel-2 px-3.5 py-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">{a.label}</p>
                  <p className="angka-tabular text-xs tabular-nums text-muted">
                    radius {a.radius_m} m
                  </p>
                </div>
                <HapusAreaKlien id={a.id} />
              </div>
            ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}


