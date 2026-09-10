import type { Metadata } from "next";
import Link from "next/link";
import {
  TrendingDown,
  TrendingUp,
  FileSpreadsheet,
  ExternalLink,
  Inbox,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { KATEGORI, STATUS, SLA_KATEGORI, hitungSla, type StatusKey } from "@/lib/constants";
import { IkonKategori } from "@/lib/ikon-vektor";
import { Card, StatusChip } from "@/components/ui";
import { FeedbackState } from "@/components/feedback-state";
import { GalatMuatUlang, KontenUtama, PageHeader } from "@/components/layout-konten";
import { formatTanggal } from "@/lib/utils";
import { GrafikBulanan, GrafikKategori } from "./grafik";
import { TombolCetak } from "./tombol-cetak";

export const metadata: Metadata = { title: "Transparansi" };
export const dynamic = "force-dynamic";

function median(arr: number[]) {
  if (arr.length === 0) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

type BarisLaporan = {
  id: string;
  judul: string;
  status: string;
  created_at: string;
  lat: number | null;
  lng: number | null;
  alamat_teks: string | null;
  categories: { slug: string; nama: string; warna: string } | null;
  report_events: { status: string; created_at: string }[];
};

function pisahMinggu(daftar: BarisLaporan[]) {
  const sekarang = Date.now();
  const mingguIni = daftar.filter(
    (r) => sekarang - new Date(r.created_at).getTime() < 7 * 86400000
  );
  const mingguLalu = daftar.filter((r) => {
    const umur = sekarang - new Date(r.created_at).getTime();
    return umur >= 7 * 86400000 && umur < 14 * 86400000;
  });
  return { mingguIni, mingguLalu };
}

export default async function HalamanTransparansi() {
  const supabase = await createClient();
  if (!supabase) {
    return (
      <KontenUtama>
        <GalatMuatUlang judul="Transparansi belum bisa dimuat" />
      </KontenUtama>
    );
  }

  const { data: semua, error: galatLaporan } = await supabase
    .from("reports")
    .select(
      `id, judul, status, created_at, lat, lng, alamat_teks, categories(slug,nama,warna),
       report_events(status, created_at)`
    )
    .order("created_at", { ascending: false })
    .limit(1000);

  if (galatLaporan) {
    return (
      <KontenUtama>
        <GalatMuatUlang judul="Transparansi belum bisa dimuat" />
      </KontenUtama>
    );
  }

  const daftar = (semua ?? []) as unknown as BarisLaporan[];

  const total = daftar.length;
  const selesaiList = daftar.filter((r) => r.status === "selesai");
  const persenSelesai =
    total > 0 ? Math.round((selesaiList.length / total) * 100) : 0;

  const durasiHari: number[] = [];
  for (const r of selesaiList) {
    const evSelesai = (r.report_events ?? []).find(
      (e) => e.status === "selesai"
    );
    if (evSelesai) {
      durasiHari.push(
        Math.round(
          (new Date(evSelesai.created_at).getTime() -
            new Date(r.created_at).getTime()) /
            86400000
        )
      );
    }
  }
  const medianHari = median(durasiHari);

  const perKategori = KATEGORI.map((k) => {
    const milik = daftar.filter(
      (r) => (r.categories?.slug ?? "lainnya") === k.slug
    );
    const selesaiK = milik.filter((r) => r.status === "selesai").length;
    return {
      nama: k.nama,
      warna: k.warna,
      total: milik.length,
      selesai: selesaiK,
      persen: milik.length ? Math.round((selesaiK / milik.length) * 100) : 0,
    };
  }).filter((k) => k.total > 0);

  // Laporan yang melewati batas SLA kategori
  const laporanLewatSla = daftar
    .filter((r) => !["selesai", "ditolak"].includes(r.status))
    .map((r) => {
      const sla = hitungSla(r.categories?.slug, r.created_at);
      return {
        ...r,
        sla,
      };
    })
    .filter((r) => r.sla.lewatSla)
    .sort((a, b) => b.sla.hariTerlambat - a.sla.hariTerlambat);

  const bulan: { label: string; masuk: number; tuntas: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    const label = d.toLocaleDateString("id-ID", { month: "short" });
    const akhir = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const mulai = new Date(d.getFullYear(), d.getMonth(), 1);
    bulan.push({
      label,
      masuk: daftar.filter((r) => {
        const t = new Date(r.created_at);
        return t >= mulai && t < akhir;
      }).length,
      tuntas: daftar.filter((r) => {
        if (r.status !== "selesai") return false;
        const ev = (r.report_events ?? []).find((e) => e.status === "selesai");
        if (!ev) return false;
        const t = new Date(ev.created_at);
        return t >= mulai && t < akhir;
      }).length,
    });
  }

  const { mingguIni, mingguLalu } = pisahMinggu(daftar);
  const deltaKategori = KATEGORI.map((k) => {
    const hitung = (arr: typeof daftar) =>
      arr.filter((r) => (r.categories?.slug ?? "lainnya") === k.slug).length;
    const kini = hitung(mingguIni);
    const lalu = hitung(mingguLalu);
    return { slug: k.slug, nama: k.nama, kini, lalu, naik: kini - lalu };
  })
    .filter((d) => d.naik > 0)
    .sort((a, b) => b.naik - a.naik);
  const teratas = deltaKategori[0] ?? null;

  const tercepat = [...perKategori]
    .filter((k) => k.selesai > 0)
    .sort((a, b) => b.persen - a.persen)[0] ?? null;

  const statusCount: Partial<Record<StatusKey, number>> = {};
  for (const r of daftar)
    statusCount[r.status as StatusKey] =
      (statusCount[r.status as StatusKey] ?? 0) + 1;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader
        eyebrow="Akuntabilitas publik"
        judul="Transparansi"
        deskripsi="Kinerja penanganan laporan warga secara terbuka. Setiap kategori memiliki target waktu penanganan yang mengikat dewan."
        aksi={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/api/open-data"
              target="_blank"
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border garis-halus px-4 text-sm font-semibold transition hover:border-action hover:text-action"
            >
              <FileSpreadsheet size={15} /> Open Data (JSON)
            </Link>
            <TombolCetak />
          </div>
        }
      />

      {/* Papan Keterlambatan Publik (Overdue Watchlist) */}
      {total === 0 ? (
        <FeedbackState
          jenis="kosong"
          ikon={Inbox}
          judul="Data belum tersedia"
          deskripsi="Belum ada laporan yang bisa dihitung. Metrik kinerja akan muncul setelah warga mulai melapor."
        />
      ) : (
      <>
      <section aria-label="Laporan melewati batas waktu" className="mb-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-xl font-bold">
            Perlu tindakan cepat
          </h2>
          <span className="rounded-full bg-danger/10 px-2.5 py-1 text-xs font-bold tabular-nums text-danger">
            {laporanLewatSla.length} laporan
          </span>
        </div>
        <Card className="overflow-hidden rounded-[28px] p-0">

        {laporanLewatSla.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-muted">
            Tidak ada laporan yang melewati batas waktu saat ini.
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto px-5 py-4 sm:block">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">
                  Daftar laporan warga yang melewati batas waktu SLA
                </caption>
                <thead>
                  <tr className="border-b garis-halus text-xs text-muted">
                    <th scope="col" className="pb-2 font-semibold">Judul Masalah</th>
                    <th scope="col" className="pb-2 font-semibold">Kategori</th>
                    <th scope="col" className="pb-2 font-semibold">Tgl Lapor</th>
                    <th scope="col" className="pb-2 font-semibold">Target SLA</th>
                    <th scope="col" className="pb-2 font-semibold text-danger">Keterlambatan</th>
                    <th scope="col" className="pb-2 font-semibold">Status</th>
                    <th scope="col" className="pb-2 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-garis-halus">
                  {laporanLewatSla.slice(0, 10).map((r) => (
                    <tr key={r.id} className="hover:bg-panel-2/40 transition">
                      <td className="py-3 font-semibold text-ink max-w-xs truncate">
                        {r.judul}
                      </td>
                      <td className="py-3 text-xs text-muted">
                        {r.categories?.nama ?? "Lainnya"}
                      </td>
                      <td className="py-3 text-xs text-muted">
                        {formatTanggal(r.created_at)}
                      </td>
                      <td className="py-3 text-xs font-medium tabular-nums">
                        {r.sla.targetHari} hari
                      </td>
                      <td className="py-3 text-xs font-bold tabular-nums text-danger">
                        +{r.sla.hariTerlambat} hari
                      </td>
                      <td className="py-3">
                        <StatusChip status={r.status as StatusKey} />
                      </td>
                      <td className="py-3 text-right">
                        <Link
                          href={`/laporan/${r.id}`}
                          aria-label={`Detail laporan ${r.judul}`}
                          className="inline-flex min-h-[44px] items-center gap-1 text-xs font-semibold text-action hover:underline"
                        >
                          Detail <ExternalLink size={12} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="space-y-2.5 px-4 py-4 sm:hidden">
              {laporanLewatSla.slice(0, 10).map((r) => (
                <li
                  key={r.id}
                  className="rounded-2xl border garis-halus bg-panel-2/40 p-3.5"
                >
                  <p className="text-sm font-bold leading-snug">{r.judul}</p>
                  <p className="mt-1 text-xs text-muted">
                    {r.categories?.nama ?? "Lainnya"} ·{" "}
                    {formatTanggal(r.created_at)}
                  </p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-danger/10 px-2.5 py-1 text-[11px] font-bold tabular-nums text-danger">
                      +{r.sla.hariTerlambat} hari
                    </span>
                    <StatusChip status={r.status as StatusKey} />
                    <Link
                      href={`/laporan/${r.id}`}
                      aria-label={`Detail laporan ${r.judul}`}
                      className="ml-auto inline-flex min-h-[44px] items-center gap-1 text-xs font-semibold text-action hover:underline"
                    >
                      Detail <ExternalLink size={12} />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
      </section>

      {/* Ringkasan Metrik Utama */}
      <section aria-label="Ringkasan kinerja" className="mb-8">
        <dl className="grid grid-cols-2 gap-6 rounded-[28px] bg-panel p-7 sm:p-8 lg:grid-cols-4">
          <div>
            <dt className="text-[11px] text-muted">Total laporan warga</dt>
            <dd className="mt-1.5 text-[31px] font-semibold leading-none tabular-nums tracking-[-0.05em]">
              {total}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] text-muted">Tingkat tuntas</dt>
            <dd className="mt-1.5 text-[31px] font-semibold leading-none tabular-nums tracking-[-0.05em] text-daun-700 dark:text-daun-300">
              {persenSelesai}%
            </dd>
          </div>
          <div>
            <dt className="text-[11px] text-muted">Median waktu beres</dt>
            <dd className="mt-1.5 text-[31px] font-semibold leading-none tabular-nums tracking-[-0.05em]">
              {medianHari ? `${medianHari} hari` : "<1 hari"}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] text-muted">Melewati batas waktu</dt>
            <dd
              className={`mt-1.5 text-[31px] font-semibold leading-none tabular-nums tracking-[-0.05em] ${laporanLewatSla.length > 0 ? "text-danger" : ""}`}
            >
              {laporanLewatSla.length}
            </dd>
          </div>
        </dl>
      </section>

      {/* Standar SLA Kategori */}
      <section aria-label="Target waktu penanganan" className="mb-8">
        <h2 className="mb-1 font-display text-xl font-bold">
          Target waktu penanganan
        </h2>
        <p className="mb-3 text-sm text-muted">
          Batas hari penyelesaian per kategori yang mengikat dewan.
        </p>
        <div className="rounded-[28px] bg-panel p-3 sm:p-4">
          <dl className="flex flex-col gap-[7px]">
            {KATEGORI.filter((k) => k.slug !== "lainnya").map((k) => (
              <div
                key={k.slug}
                className="flex min-h-[53px] items-center gap-3 rounded-[13px] bg-panel-2 px-3.5 py-2 text-xs"
              >
                <dt className="flex min-w-0 flex-1 items-center gap-3 font-medium">
                  <span className="flex text-muted">
                    <IkonKategori slug={k.slug} ukuran={20} />
                  </span>
                  <span className="truncate">{k.nama}</span>
                </dt>
                <dd className="tabular-nums text-muted">
                  {SLA_KATEGORI[k.slug] ?? 7} hari
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Insight Otomatis */}
      {(teratas || tercepat) && (
      <div className="mb-8 grid gap-3 md:grid-cols-2">
        {teratas && (
          <Card className="flex items-start gap-3 rounded-[28px] p-6 sm:p-7">
            <TrendingUp className="mt-0.5 shrink-0 text-muted" size={20} />
            <div>
              <p className="font-display font-bold">Tren naik minggu ini</p>
              <p className="mt-1 text-sm text-muted">
                Laporan{" "}
                <b className="inline-flex items-center gap-1 text-ink">
                  <IkonKategori slug={teratas.slug} ukuran={13} /> {teratas.nama}
                </b>{" "}
                naik <b className="text-ink">{teratas.naik} laporan</b> dibanding
                minggu lalu ({teratas.kini} vs {teratas.lalu}).
              </p>
            </div>
          </Card>
        )}
        {tercepat && (
          <Card className="flex items-start gap-3 rounded-[28px] p-6 sm:p-7">
            <TrendingDown className="mt-0.5 shrink-0 text-muted" size={20} />
            <div>
              <p className="font-display font-bold">Ketuntasan tertinggi</p>
              <p className="mt-1 text-sm text-muted">
                <b className="text-ink">{tercepat.nama}</b> tuntas{" "}
                <b className="text-ink">{tercepat.persen}%</b> ({tercepat.selesai}/
                {tercepat.total} laporan).
              </p>
            </div>
          </Card>
        )}
      </div>
      )}

      {/* Grafik Laporan & Kategori */}
      <div className="mb-8 grid gap-5 lg:grid-cols-2">
        <Card className="rounded-[28px] p-6 sm:p-7">
          <h2 className="font-display text-[19px] font-semibold tracking-[-0.035em]">
            Tren 6 bulan
          </h2>
          <p className="mb-4 mt-0.5 text-xs text-muted">Laporan masuk vs tuntas</p>
          <GrafikBulanan data={bulan} />
        </Card>

        <Card className="rounded-[28px] p-6 sm:p-7">
          <h2 className="font-display text-[19px] font-semibold tracking-[-0.035em]">
            Ketuntasan per kategori
          </h2>
          <p className="mb-4 mt-0.5 text-xs text-muted">Persentase laporan tuntas</p>
          <GrafikKategori data={perKategori} />
        </Card>
      </div>

      {/* Distribusi Status & Open Data API Info */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="rounded-[28px] p-6 sm:col-span-2 sm:p-7">
          <h2 className="font-display text-[19px] font-semibold tracking-[-0.035em]">Distribusi status</h2>
          <p className="mb-4 mt-0.5 text-xs text-muted">Jumlah laporan per tahap</p>
          <div className="flex flex-wrap gap-2.5">
            {(Object.keys(STATUS) as StatusKey[]).map((s) => (
              <div
                key={s}
                className="flex items-center gap-2 rounded-full bg-panel-2 px-3.5 py-2"
              >
                <StatusChip status={s} />
                <span className="font-bold tabular-nums">{statusCount[s] ?? 0}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col justify-between rounded-[28px] p-6 sm:p-7">
          <div>
            <h2 className="font-display font-bold text-base">Open data</h2>
            <p className="mt-1.5 text-sm text-muted leading-relaxed">
              Data publik gratis berlisensi CC-BY untuk riset, jurnalisme warga, dan integrasi sistem kota.
            </p>
          </div>
          <Link
            href="/api/open-data"
            target="_blank"
            className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-full border garis-halus px-4 text-xs font-semibold transition hover:border-action hover:text-action"
          >
            <ExternalLink size={13} /> Akses /api/open-data
          </Link>
        </Card>
      </div>
      </>
      )}
    </main>
  );
}
