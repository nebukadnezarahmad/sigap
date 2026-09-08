import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { LaporanDenganRelasi } from "@/types/database";
import { Card, Skeleton, StatusChip } from "@/components/ui";
import { PitaGradient } from "@/components/eksperimen/pita-gradient";
import { ClipboardList, TriangleAlert } from "lucide-react";
import { AksiLaporanSaya } from "./aksi";
import { HapusAreaKlien } from "./hapus-area";
import { GerbangLaporanSaya } from "./gerbang-laporan-saya";

export const metadata: Metadata = { title: "Laporan Saya" };
export const dynamic = "force-dynamic";

/* Fusi visual-fusion: kartu utilitas putih hairline 18px tanpa shadow;
   link CTA Action Blue; Fraunces + StatusChip tetap. Dark: tile netral
   ap-tile1 + teks putih + hairline netral (tanpa hijau-lumpur).
   Alasan state: satu ikon kecil per state (relevan, bukan dekorasi);
   skeleton tanpa shimmer agar tenang mengikuti MOTION 1. */
const KARTU =
  "rounded-[18px] border border-ap-hairline bg-white text-ap-ink shadow-none dark:border-white/15 dark:bg-ap-tile1 dark:text-white";

/* Skeleton muat: dipakai sebagai fallback Suspense/loading agar daftar
   tidak melompat saat data diambil. Tanpa ilustrasi karena ini muat. */
export function MuatLaporanSaya() {
  return (
    <div aria-busy="true" className="space-y-3">
      <p role="status" className="sr-only">
        Memuat laporanmu
      </p>
      {[0, 1, 2].map((i) => (
        <div key={i} className={`${KARTU} p-5`}>
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="mt-2 h-4 w-full" />
          <Skeleton className="mt-1.5 h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}

/* Galat muat: ilustrasi segitiga relevan dengan gangguan koneksi. */
function GalatLaporanSaya() {
  return (
    <Card className={`${KARTU} p-8 text-center`}>
      <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-[18px] bg-danger/10 text-danger">
        <TriangleAlert size={26} strokeWidth={1.8} />
      </span>
      <h2 className="font-display text-xl font-bold">
        Laporanmu belum bisa dimuat
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
        Kamu tidak ketinggalan apa pun. Data gagal dimuat karena koneksi ke
        database terputus.
      </p>
      <ol className="mx-auto mt-4 max-w-md space-y-1 text-left text-sm text-muted">
        <li>1. Periksa koneksi internet kamu.</li>
        <li>2. Muat ulang halaman ini.</li>
        <li>3. Kalau masih gagal, coba lagi beberapa menit lagi.</li>
      </ol>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <Link
          href="/laporan-saya"
          className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-ap-blue px-5 text-sm font-semibold text-white transition hover:bg-ap-blue-focus focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus"
        >
          Muat ulang halaman
        </Link>
        <Link
          href="/peta"
          className="inline-flex min-h-[44px] items-center justify-center rounded-full px-5 text-sm font-semibold text-ap-blue transition hover:bg-ap-blue/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus dark:text-ap-sky"
        >
          Buka peta
        </Link>
      </div>
    </Card>
  );
}

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

  if (galatLaporan) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <GalatLaporanSaya />
      </main>
    );
  }

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
  const area = areaRaw ?? [];

  return (
    <main className="pb-10">
      {/* Fusi header: pita gelap + teks putih, pola papan-skor/demo; judul,
          copy, dan Fraunces tidak diubah, hanya warna agar kontras. */}
      <PitaGradient tone="gelap">
        <header className="text-center">
          <h1 className="font-display text-3xl font-bold leading-[1.1] tracking-[-0.28px] text-white">Laporan Saya</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-white/85">
            Sunting laporan selama statusnya masih{" "}
            <b className="font-bold text-white">Baru</b>. Setelah diverifikasi dewan, isinya
            terkunci demi akuntabilitas.
          </p>
        </header>
      </PitaGradient>

      <div className="mx-auto max-w-3xl px-4 pt-8">

      {daftar.length === 0 ? (
        <Card className={`${KARTU} p-8 text-center`}>
          <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-[18px] bg-ap-blue/10 text-ap-blue dark:text-ap-sky">
            <ClipboardList size={26} strokeWidth={1.8} />
          </span>
          <h2 className="font-display text-xl font-bold">
            Kamu belum punya laporan
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
            Laporan yang kamu buat akan tercatat di sini lengkap dengan status
            dan dukungannya. Mulai dari masalah kecil di dekat rumahmu.
          </p>
          <Link
            href="/peta?lapor=1"
            className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-full bg-ap-blue px-5 text-sm font-semibold text-white transition hover:bg-ap-blue-focus focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus"
          >
            Buat laporan pertamamu
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {daftar.map((r) => (
            <Card key={r.id} className={`${KARTU} p-5`}>
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
                    className="inline-flex min-h-[44px] items-center rounded-full font-display font-bold text-ap-blue hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus dark:text-ap-sky"
                  >
                    {r.judul}
                  </Link>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">
                    {r.deskripsi}
                  </p>
                  <p className="angka-tabular mt-2 text-xs tabular-nums text-muted">
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

      {galatArea ? (
        <section aria-label="Area yang diikuti" className="mt-10">
          <Card className={`${KARTU} p-6 text-center`}>
            <p role="alert" className="text-sm text-muted">
              Area yang kamu ikuti belum bisa dimuat. Muat ulang halaman untuk
              mencoba lagi.
            </p>
          </Card>
        </section>
      ) : area.length > 0 ? (
        <section aria-label="Area yang diikuti" className="mt-10">
          <h2 className="mb-3 font-display text-xl font-bold">
            Area yang kamu ikuti
          </h2>
          <p className="mb-3 text-sm text-muted">
            Kamu mendapat notifikasi setiap ada laporan baru dalam radius ini.
          </p>
          <div className="space-y-2">
            {area.map((a) => (
              <Card key={a.id} className={`${KARTU} flex items-center justify-between gap-3 p-4`}>
                <div>
                  <p className="text-sm font-semibold">{a.label}</p>
                  <p className="angka-tabular text-xs tabular-nums text-muted">
                    radius {a.radius_m} m
                  </p>
                </div>
                <HapusAreaKlien id={a.id} />
              </Card>
            ))}
          </div>
        </section>
      ) : (
        <section aria-label="Area yang diikuti" className="mt-10">
          <Card className={`${KARTU} p-6 text-center`}>
            <h2 className="font-display text-base font-bold">
              Kamu belum mengikuti area
            </h2>
            <p className="mx-auto mt-1.5 max-w-md text-sm text-muted">
              Pilih area di peta agar kamu dapat kabar setiap ada laporan baru
              di sekitarmu.
            </p>
            <Link
              href="/peta"
              className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-full px-5 text-sm font-semibold text-ap-blue transition hover:bg-ap-blue/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus dark:text-ap-sky"
            >
              Pilih area di peta
            </Link>
          </Card>
        </section>
      )}
      </div>
    </main>
  );
}


