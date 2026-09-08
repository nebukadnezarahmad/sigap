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
import { StatusChip, Button, Skeleton } from "@/components/ui";
import { KacaKartu } from "@/components/eksperimen/kaca";
import { PitaGradient } from "@/components/eksperimen/pita-gradient";
import { formatBulan, formatTanggal } from "@/lib/utils";
import { GrafikBulanan, GrafikKategori } from "./grafik";
import { TombolCetak } from "./tombol-cetak";

export const metadata: Metadata = { title: "Transparansi" };
export const dynamic = "force-dynamic";

/* Skeleton muat transparansi: tanpa ilustrasi karena ini muat. */
export function MuatTransparansi() {
  return (
    <div aria-busy="true" className="mx-auto max-w-6xl px-4 py-10">
      <p role="status" className="sr-only">
        Memuat data transparansi
      </p>
      <Skeleton className="h-9 w-2/3" />
      <Skeleton className="mt-2 h-4 w-1/2" />
      <div className="mb-6 mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-[18px]" />
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-[18px]" />
    </div>
  );
}

/* Galat transparansi: ikon segitiga relevan dengan gangguan data. */
function GalatTransparansi({ mode }: { mode: "sambung" | "muat" }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-center">
      <KacaKartu className="p-8">
        <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-[18px] bg-danger/10 text-danger">
          <AlertTriangle size={26} strokeWidth={1.8} />
        </span>
        <h1 className="font-display text-2xl font-bold">
          Data transparansi belum bisa dimuat
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
          {mode === "sambung"
            ? "Kamu tidak ketinggalan info apa pun. Database belum tersambung sehingga angka kinerja belum bisa ditampilkan."
            : "Kamu tidak ketinggalan info apa pun. Data gagal dimuat karena koneksi terputus."}
        </p>
        <ol className="mx-auto mt-4 max-w-md space-y-1 text-left text-sm text-muted">
          <li>1. Periksa koneksi internet kamu.</li>
          <li>2. Muat ulang halaman ini.</li>
          <li>3. Kalau masih gagal, kembali lagi beberapa menit lagi.</li>
        </ol>
        <Link
          href="/transparansi"
          className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-full bg-ap-blue px-5 text-sm font-semibold text-white transition hover:bg-ap-blue-focus focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus"
        >
          Muat ulang halaman
        </Link>
      </KacaKartu>
    </main>
  );
}

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
    return <GalatTransparansi mode="sambung" />;
  }

  const { data: semua, error: galat } = await supabase
    .from("reports")
    .select(
      `id, judul, status, created_at, lat, lng, alamat_teks, categories(slug,nama,warna),
       report_events(status, created_at)`
    )
    .order("created_at", { ascending: false })
    .limit(1000);

  if (galat) {
    return <GalatTransparansi mode="muat" />;
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
    const label = formatBulan(d);
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
    <main className="pb-10">
      <PitaGradient tone="gelap">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
              <ShieldCheck size={16} /> Rapor Akuntabilitas Publik
            </div>
            <h1 className="mt-3 font-display text-3xl font-bold leading-[1.1] tracking-[-0.28px] text-white">
              Transparansi & Kepatuhan SLA Dewan
            </h1>
            <p className="mt-2 max-w-2xl text-white/85">
              Data kinerja penanganan masalah lingkungan dari warga secara terbuka. Setiap kategori memiliki target waktu penanganan (*Service Level Agreement*) yang mengikat.
            </p>
          </div>
          <div className="flex items-center gap-2">
             <Link
               href="/api/open-data"
               target="_blank"
              className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-full bg-ap-blue px-5 text-sm font-semibold text-white transition hover:bg-ap-blue-focus focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus"
            >
              <FileSpreadsheet size={15} /> Open Data (JSON)
            </Link>
            <TombolCetak />
          </div>
        </header>
      </PitaGradient>

      <div className="mx-auto max-w-6xl px-4 pt-10">

      {/* Papan Keterlambatan Publik (Overdue Watchlist) */}
      <section className="mb-6 rounded-[18px] border border-danger/30 bg-white p-6 text-ap-ink shadow-none dark:border-danger/40 dark:bg-ap-tile1 dark:text-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ap-hairline pb-3 dark:border-white/15">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-danger" size={18} />
            <h2 className="font-display font-bold text-lg tracking-[-0.224px]">
              Papan Keterlambatan Publik (*Overdue Watchlist*)
            </h2>
          </div>
          <span className="rounded-full bg-danger/10 px-2.5 py-0.5 text-xs font-bold tabular-nums text-danger">
            {laporanLewatSla.length} Laporan Perlu Tindakan Cepat
          </span>
        </div>

        {laporanLewatSla.length === 0 ? (
          <div className="py-8 text-center">
            <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-[18px] bg-daun-500/10 text-daun-700 dark:text-daun-300">
              <CheckCircle2 size={24} strokeWidth={1.8} />
            </span>
            <h3 className="font-display text-base font-bold">
              Tidak ada laporan yang melewati batas
            </h3>
            <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-muted">
              Kabar baik untuk kamu. Semua laporan tertangani dalam target
              waktu. Pantau terus agar tetap seperti ini.
            </p>
          </div>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">
                Daftar laporan warga yang melewati batas waktu SLA
              </caption>
              <thead>
                <tr className="border-b border-ap-hairline text-xs text-muted dark:border-white/15 dark:text-white/70">
                  <th scope="col" className="pb-2 font-semibold">Judul Masalah</th>
                  <th scope="col" className="pb-2 font-semibold">Kategori</th>
                  <th scope="col" className="pb-2 font-semibold">Tgl Lapor</th>
                  <th scope="col" className="pb-2 font-semibold">Target SLA</th>
                  <th scope="col" className="pb-2 font-semibold text-danger">Keterlambatan</th>
                  <th scope="col" className="pb-2 font-semibold">Status</th>
                  <th scope="col" className="pb-2 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ap-hairline dark:divide-white/15">
                {laporanLewatSla.slice(0, 10).map((r) => (
                  <tr key={r.id} className="transition hover:bg-ap-parchment dark:hover:bg-white/5">
                    <td className="max-w-xs truncate py-3 font-semibold text-ap-ink dark:text-white">
                      {r.judul}
                    </td>
                    <td className="py-3 text-xs text-muted">
                      {r.categories?.nama ?? "Lainnya"}
                    </td>
                    <td className="py-3 text-xs text-muted">
                      {formatTanggal(r.created_at)}
                    </td>
                    <td className="angka-tabular py-3 text-xs font-medium tabular-nums">
                      {r.sla.targetHari} hari
                    </td>
                    <td className="angka-tabular py-3 text-xs font-bold tabular-nums text-danger">
                      +{r.sla.hariTerlambat} hari
                    </td>
                    <td className="py-3">
                      <StatusChip status={r.status as StatusKey} />
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/laporan/${r.id}`}
                        aria-label={`Detail laporan ${r.judul}`}
                        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-ap-blue hover:bg-ap-blue/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus dark:text-ap-sky dark:hover:bg-ap-sky/10"
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
      </section>

      {total === 0 && (
        <KacaKartu className="mb-6 p-8 text-center">
          <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-[18px] bg-ap-blue/10 text-ap-blue dark:text-ap-sky">
            <FileSpreadsheet size={26} strokeWidth={1.8} />
          </span>
          <h2 className="font-display text-xl font-bold">
            Belum ada laporan untuk ditampilkan
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
            Kamu bisa jadi yang pertama melaporkan. Data transparansi akan
            terisi otomatis setelah ada laporan masuk.
          </p>
          <Link
            href="/peta?lapor=1"
            className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-full bg-ap-blue px-5 text-sm font-semibold text-white transition hover:bg-ap-blue-focus focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus"
          >
            Buat laporan pertama
          </Link>
        </KacaKartu>
      )}

      {/* Ringkasan Metrik Utama */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: "Total laporan warga",
            nilai: total,
            ikon: <CheckCircle2 size={20} />,
            warna: "text-ap-blue dark:text-ap-sky bg-ap-blue/10",
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
          <KacaKartu
            key={k.label}
            className="flex items-center gap-3.5 p-6"
          >
            <span
              className={`flex size-11 items-center justify-center rounded-lg ${k.warna}`}
            >
              {k.ikon}
            </span>
            <div>
              <p className="angka-tabular text-2xl font-extrabold leading-none tabular-nums">
                {k.nilai}
              </p>
              <p className="mt-1 text-xs text-muted">{k.label}</p>
            </div>
          </KacaKartu>
        ))}
      </div>

      {/* Standar SLA Kategori */}
      <section className="mb-6 rounded-[18px] border border-ap-hairline bg-white p-6 text-ap-ink shadow-none dark:border-white/15 dark:bg-ap-tile1 dark:text-white">
        <h2 className="font-display text-base font-bold tracking-[-0.224px]">
          Standar Target Waktu Penanganan (SLA Resmi per Kategori)
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
          {KATEGORI.filter((k) => k.slug !== "lainnya").map((k) => (
            <div
              key={k.slug}
              className="rounded-lg border border-ap-hairline bg-ap-pearl p-3 text-left dark:border-white/15 dark:bg-ap-tile2"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted">
                <IkonKategori slug={k.slug} ukuran={13} />
                <span className="truncate">{k.nama}</span>
              </div>
              <p className="angka-tabular mt-1 text-xl font-black tabular-nums text-ap-ink dark:text-white">
                {SLA_KATEGORI[k.slug] ?? 7} Hari
              </p>
              <p className="text-[11px] text-muted">Target respon & beres</p>
            </div>
          ))}
        </div>
      </section>

      {/* Insight Otomatis */}
      <div className="mb-6 grid gap-3 md:grid-cols-2">
        {teratas && (
          <div className="flex items-start gap-3 rounded-[18px] border border-kunyit-500/40 bg-white p-6 text-ap-ink shadow-none dark:border-kunyit-500/40 dark:bg-ap-tile1 dark:text-white">
            <TrendingUp className="mt-0.5 text-kunyit-500" size={20} />
            <div>
              <p className="font-display font-bold tracking-[-0.224px]">Tren Kenaikan Laporan</p>
              <p className="mt-1 text-sm text-muted dark:text-white/70">
                Laporan{" "}
                <b className="inline-flex items-center gap-1 text-ap-ink dark:text-white">
                  <IkonKategori slug={teratas.slug} ukuran={13} /> {teratas.nama}
                </b>{" "}
                naik <b className="angka-tabular text-ap-ink dark:text-white">{teratas.naik} laporan</b> dibanding
                minggu lalu ({teratas.kini} vs {teratas.lalu}). Memerlukan alokasi petugas tambahan.
              </p>
            </div>
          </div>
        )}
        {tercepat && (
          <div className="flex items-start gap-3 rounded-[18px] border border-daun-500/40 bg-white p-6 text-ap-ink shadow-none dark:bg-ap-tile1 dark:text-white">
            <TrendingDown className="mt-0.5 text-daun-600 dark:text-daun-400" size={20} />
            <div>
              <p className="font-display font-bold tracking-[-0.224px]">Kinerja Tertinggi</p>
              <p className="mt-1 text-sm text-muted dark:text-white/70">
                Kategori <b className="angka-tabular text-ap-ink dark:text-white">{tercepat.nama}</b> memiliki tingkat ketuntasan tertinggi yaitu{" "}
                <b className="angka-tabular text-ap-ink dark:text-white">{tercepat.persen}%</b> ({tercepat.selesai}/
                {tercepat.total} laporan diselesaikan).
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Grafik Laporan & Kategori */}
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-[18px] border border-ap-hairline bg-white p-6 text-ap-ink shadow-none dark:border-white/15 dark:bg-ap-tile1 dark:text-white">
          <h2 className="mb-4 font-display font-bold tracking-[-0.224px]">
            Tren Laporan Masuk vs Selesai (6 Bulan)
          </h2>
          <GrafikBulanan data={bulan} />
        </section>

        <section className="rounded-[18px] border border-ap-hairline bg-white p-6 text-ap-ink shadow-none dark:border-white/15 dark:bg-ap-tile1 dark:text-white">
          <h2 className="mb-4 font-display font-bold tracking-[-0.224px]">
            Tingkat Ketuntasan per Kategori
          </h2>
          <GrafikKategori data={perKategori} />
        </section>
      </div>

      {/* Distribusi Status & Open Data API Info */}
      <div className="grid gap-4 sm:grid-cols-3">
        <section className="rounded-[18px] border border-ap-hairline bg-white p-6 text-ap-ink shadow-none dark:border-white/15 dark:bg-ap-tile1 dark:text-white sm:col-span-2">
          <h2 className="mb-4 font-display font-bold tracking-[-0.224px]">Distribusi Status Penanganan</h2>
          <div className="flex flex-wrap gap-3">
            {(Object.keys(STATUS) as StatusKey[]).map((s) => (
              <div
                key={s}
                className="flex items-center gap-2 rounded-full border border-ap-hairline bg-ap-pearl px-4 py-2 dark:border-white/15 dark:bg-ap-tile2"
              >
                <StatusChip status={s} />
                <span className="angka-tabular font-bold tabular-nums">{statusCount[s] ?? 0}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col justify-between rounded-[18px] border border-ap-hairline bg-white p-6 text-ap-ink shadow-none dark:border-white/15 dark:bg-ap-tile1 dark:text-white">
          <div>
            <h2 className="font-display font-bold text-base tracking-[-0.224px]">Open Data API Warga</h2>
            <p className="mt-2 text-xs text-muted leading-relaxed">
              Seluruh data laporan dapat diakses secara publik dan gratis di bawah lisensi CC-BY untuk kepentingan riset akademis, jurnalisme warga, dan integrasi sistem kota.
            </p>
          </div>
          <Link href="/api/open-data" target="_blank" className="mt-4">
              <Button variant="sekunder" size="sm" className="w-full min-h-[44px] gap-1.5 text-xs focus-visible:outline-ap-blue-focus">
              <ExternalLink size={13} /> Akses /api/open-data
            </Button>
          </Link>
        </section>
        </div>
      </div>
    </main>
  );
}
