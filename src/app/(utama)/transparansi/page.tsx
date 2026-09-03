import type { Metadata } from "next";
import Link from "next/link";
import {
  TrendingDown,
  TrendingUp,
  Timer,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { KATEGORI, STATUS, SLA_KATEGORI, hitungSla, type StatusKey } from "@/lib/constants";
import { IkonKategori } from "@/lib/ikon-vektor";
import { Card, StatusChip, Button } from "@/components/ui";
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
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold">
          Database belum tersambung
        </h1>
      </main>
    );
  }

  const { data: semua } = await supabase
    .from("reports")
    .select(
      `id, judul, status, created_at, lat, lng, alamat_teks, categories(slug,nama,warna),
       report_events(status, created_at)`
    )
    .order("created_at", { ascending: false })
    .limit(1000);

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
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-daun-700 dark:text-daun-400">
            <ShieldCheck size={16} /> Rapor Akuntabilitas Publik
          </div>
          <h1 className="mt-1 font-display text-3xl font-bold">
            Transparansi & Kepatuhan SLA Dewan
          </h1>
          <p className="mt-2 max-w-2xl text-muted">
            Data kinerja penanganan masalah lingkungan dari warga secara terbuka. Setiap kategori memiliki target waktu penanganan (*Service Level Agreement*) yang mengikat.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/api/open-data" target="_blank">
            <Button variant="sekunder" size="sm" className="hidden sm:inline-flex gap-1.5">
              <FileSpreadsheet size={15} /> Open Data (JSON)
            </Button>
          </Link>
          <TombolCetak />
        </div>
      </header>

      {/* Ringkasan Metrik Utama */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: "Total laporan warga",
            nilai: total,
            ikon: <CheckCircle2 size={20} />,
            warna: "text-sky-600 dark:text-sky-400 bg-sky-500/10",
          },
          {
            label: "Tingkat tuntas",
            nilai: `${persenSelesai}%`,
            ikon: <CheckCircle2 size={20} />,
            warna: "text-daun-700 dark:text-daun-300 bg-daun-500/10",
          },
          {
            label: "Median waktu beres",
            nilai: medianHari ? `${medianHari} hari` : "<1 hari",
            ikon: <Timer size={20} />,
            warna: "text-kunyit-600 dark:text-kunyit-400 bg-kunyit-500/10",
          },
          {
            label: "Melewati batas SLA",
            nilai: laporanLewatSla.length,
            ikon: <AlertTriangle size={20} />,
            warna:
              laporanLewatSla.length > 0
                ? "text-danger bg-danger/10"
                : "text-daun-700 dark:text-daun-300 bg-daun-500/10",
          },
        ].map((k) => (
          <Card key={k.label} className="flex items-center gap-3.5 p-4">
            <span
              className={`flex size-11 items-center justify-center rounded-xl ${k.warna}`}
            >
              {k.ikon}
            </span>
            <div>
              <p className="font-display text-2xl font-extrabold leading-none">
                {k.nilai}
              </p>
              <p className="mt-1 text-xs text-muted">{k.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Standar SLA Kategori */}
      <Card className="mb-6 border-panel-2 bg-panel-2/50 p-5">
        <h2 className="font-display text-base font-bold">
          Standar Target Waktu Penanganan (SLA Resmi per Kategori)
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
          {KATEGORI.filter((k) => k.slug !== "lainnya").map((k) => (
            <div
              key={k.slug}
              className="rounded-2xl border garis-halus bg-panel p-3 text-left"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted">
                <IkonKategori slug={k.slug} ukuran={13} />
                <span className="truncate">{k.nama}</span>
              </div>
              <p className="mt-1 font-display text-xl font-black text-ink">
                {SLA_KATEGORI[k.slug] ?? 7} Hari
              </p>
              <p className="text-[11px] text-muted">Target respon & beres</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Papan Keterlambatan Publik (Overdue Watchlist) */}
      <Card className="mb-6 border-danger/30 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b garis-halus pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-danger" size={18} />
            <h2 className="font-display font-bold text-lg">
              Papan Keterlambatan Publik (*Overdue Watchlist*)
            </h2>
          </div>
          <span className="rounded-full bg-danger/10 px-2.5 py-0.5 text-xs font-bold text-danger">
            {laporanLewatSla.length} Laporan Perlu Tindakan Cepat
          </span>
        </div>

        {laporanLewatSla.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted">
            ✓ Luar biasa! Tidak ada laporan warga yang melewati batas waktu SLA saat ini.
          </div>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b garis-halus text-xs text-muted">
                  <th className="pb-2 font-semibold">Judul Masalah</th>
                  <th className="pb-2 font-semibold">Kategori</th>
                  <th className="pb-2 font-semibold">Tgl Lapor</th>
                  <th className="pb-2 font-semibold">Target SLA</th>
                  <th className="pb-2 font-semibold text-danger">Keterlambatan</th>
                  <th className="pb-2 font-semibold">Status</th>
                  <th className="pb-2 font-semibold text-right">Aksi</th>
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
                    <td className="py-3 text-xs font-medium">
                      {r.sla.targetHari} hari
                    </td>
                    <td className="py-3 text-xs font-bold text-danger">
                      +{r.sla.hariTerlambat} hari
                    </td>
                    <td className="py-3">
                      <StatusChip status={r.status as StatusKey} />
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/laporan/${r.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-daun-700 hover:underline dark:text-daun-300"
                      >
                        Detail <ExternalLink size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Insight Otomatis */}
      <div className="mb-6 grid gap-3 md:grid-cols-2">
        {teratas && (
          <Card className="flex items-start gap-3 border-kunyit-500/40 p-5">
            <TrendingUp className="mt-0.5 text-kunyit-500" size={20} />
            <div>
              <p className="font-display font-bold">Tren Kenaikan Laporan</p>
              <p className="mt-1 text-sm text-muted">
                Laporan{" "}
                <b className="inline-flex items-center gap-1 text-ink">
                  <IkonKategori slug={teratas.slug} ukuran={13} /> {teratas.nama}
                </b>{" "}
                naik <b className="text-ink">{teratas.naik} laporan</b> dibanding
                minggu lalu ({teratas.kini} vs {teratas.lalu}). Memerlukan alokasi petugas tambahan.
              </p>
            </div>
          </Card>
        )}
        {tercepat && (
          <Card className="flex items-start gap-3 border-daun-500/40 p-5">
            <TrendingDown className="mt-0.5 text-daun-600 dark:text-daun-400" size={20} />
            <div>
              <p className="font-display font-bold">Kinerja Tertinggi</p>
              <p className="mt-1 text-sm text-muted">
                Kategori <b className="text-ink">{tercepat.nama}</b> memiliki tingkat ketuntasan tertinggi yaitu{" "}
                <b className="text-ink">{tercepat.persen}%</b> ({tercepat.selesai}/
                {tercepat.total} laporan diselesaikan).
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Grafik Laporan & Kategori */}
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 font-display font-bold">
            Tren Laporan Masuk vs Selesai (6 Bulan)
          </h2>
          <GrafikBulanan data={bulan} />
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 font-display font-bold">
            Tingkat Ketuntasan per Kategori
          </h2>
          <GrafikKategori data={perKategori} />
        </Card>
      </div>

      {/* Distribusi Status & Open Data API Info */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5 sm:col-span-2">
          <h2 className="mb-4 font-display font-bold">Distribusi Status Penanganan</h2>
          <div className="flex flex-wrap gap-3">
            {(Object.keys(STATUS) as StatusKey[]).map((s) => (
              <div
                key={s}
                className="flex items-center gap-2 rounded-full bg-panel-2 px-4 py-2"
              >
                <StatusChip status={s} />
                <span className="font-display font-bold">{statusCount[s] ?? 0}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between">
          <div>
            <h2 className="font-display font-bold text-base">Open Data API Warga</h2>
            <p className="mt-2 text-xs text-muted leading-relaxed">
              Seluruh data laporan dapat diakses secara publik dan gratis di bawah lisensi CC-BY untuk kepentingan riset akademis, jurnalisme warga, dan integrasi sistem kota.
            </p>
          </div>
          <Link href="/api/open-data" target="_blank" className="mt-4">
            <Button variant="sekunder" size="sm" className="w-full gap-1.5 text-xs">
              <ExternalLink size={13} /> Akses /api/open-data
            </Button>
          </Link>
        </Card>
      </div>
    </main>
  );
}
