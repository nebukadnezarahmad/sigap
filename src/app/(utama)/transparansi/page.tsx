import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircle2,
  ClipboardList,
  Database,
  Timer,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { KATEGORI, SLA_HARI, STATUS, type StatusKey } from "@/lib/constants";
import { IkonKategori } from "@/lib/ikon-vektor";
import { Card, KartuKpi, KosongState, StatusChip } from "@/components/ui";
import { GrafikBulanan, GrafikKategori } from "./grafik";
import { TombolCetak } from "./tombol-cetak";

export const metadata: Metadata = { title: "Transparansi" };
export const dynamic = "force-dynamic";

/**
 * Ambang tingkat penyelesaian. Warna pada KPI hanya boleh muncul kalau
 * angkanya bermakna — palet sky/violet/kunyit disimpan khusus untuk STATUS.
 */
const AMBANG_SELESAI_BAIK = 70;
const AMBANG_SELESAI_WASPADA = 40;

const GAYA_TAUTAN_TOMBOL =
  "inline-flex items-center justify-center gap-2 rounded-kontrol border garis-halus bg-panel px-5 py-2.5 text-sm font-semibold text-ink transition-[border-color,color] duration-300 ease-sigap hover:border-daun-400 hover:text-daun-700 dark:hover:text-daun-300";

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
      <main className="mx-auto max-w-3xl px-4 py-16">
        <Card variant="garis" className="py-6">
          <KosongState
            ikon={<Database size={24} />}
            judul="Database belum tersambung"
            isi="Halaman ini membaca langsung dari laporan warga, jadi tidak ada angka yang bisa ditampilkan sampai Supabase aktif. Coba muat ulang beberapa saat lagi."
            aksi={
              <>
                <a href="/transparansi" className={GAYA_TAUTAN_TOMBOL}>
                  Muat ulang halaman
                </a>
                <Link href="/" className={GAYA_TAUTAN_TOMBOL}>
                  Kembali ke beranda
                </Link>
              </>
            }
          />
        </Card>
      </main>
    );
  }

  const { data: semua } = await supabase
    .from("reports")
    .select(
      `id, judul, status, created_at, lat, lng, categories(slug,nama,warna),
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
        Math.max(
          1,
          Math.round(
            (new Date(evSelesai.created_at).getTime() -
              new Date(r.created_at).getTime()) /
              86400000
          )
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

  /* Nada KPI ditentukan oleh makna angkanya, bukan variasi dekoratif. */
  const nadaSelesai =
    persenSelesai >= AMBANG_SELESAI_BAIK
      ? "baik"
      : persenSelesai < AMBANG_SELESAI_WASPADA
        ? "waspada"
        : "netral";
  const nadaMedian =
    medianHari === 0 ? "netral" : medianHari > SLA_HARI ? "bahaya" : "baik";
  const selisihMinggu = mingguIni.length - mingguLalu.length;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-bold tampil-wonk">Transparansi Kinerja Dewan</h1>
          <p className="mt-3 max-w-2xl text-badan text-muted teks-pretty">
            Data publik dari laporan warga — tanpa disunting. Keterbukaan adalah
            fondasi kota yang berkelanjutan.
          </p>
        </div>
        <TombolCetak />
      </header>

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KartuKpi
          label="Total laporan"
          nilai={total}
          ikon={<ClipboardList size={20} />}
        />
        <KartuKpi
          label="Selesai ditangani"
          nilai={`${persenSelesai}%`}
          ikon={<CheckCircle2 size={20} />}
          nada={nadaSelesai}
          catatan={`${selesaiList.length} dari ${total} laporan`}
        />
        <KartuKpi
          label="Median waktu penyelesaian"
          nilai={medianHari > 0 ? medianHari : "—"}
          satuan={medianHari > 0 ? "hari" : undefined}
          ikon={<Timer size={20} />}
          nada={nadaMedian}
          catatan={
            medianHari > SLA_HARI
              ? `Melewati SLA ${SLA_HARI} hari`
              : `Target SLA ${SLA_HARI} hari`
          }
        />
        <KartuKpi
          label="Laporan minggu ini"
          nilai={mingguIni.length}
          ikon={<TrendingUp size={20} />}
          catatan={
            selisihMinggu === 0
              ? "Sama dengan minggu lalu"
              : `${selisihMinggu > 0 ? "+" : "−"}${Math.abs(
                  selisihMinggu
                )} dari minggu lalu`
          }
        />
      </div>

      {teratas && (
        <Card
          variant="garis"
          className="mb-4 border-kunyit-500 bg-kunyit-500/8 p-5 sm:p-6"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <span
              aria-hidden
              className="flex size-11 shrink-0 items-center justify-center rounded-item bg-kunyit-500/20 text-kunyit-800 dark:text-kunyit-400"
            >
              <TrendingUp size={22} />
            </span>
            <div className="min-w-0">
              <p className="text-mikro font-semibold uppercase text-kunyit-800 dark:text-kunyit-400">
                Insight otomatis · perlu perhatian dewan
              </p>
              <h2 className="mt-2 font-bold">
                Laporan{" "}
                <span className="inline-flex items-baseline gap-1.5">
                  <IkonKategori slug={teratas.slug} ukuran={18} />
                  {teratas.nama}
                </span>{" "}
                naik {teratas.naik} laporan
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-2 teks-pretty">
                <span className="angka-tabular font-semibold text-ink">
                  {teratas.kini}
                </span>{" "}
                laporan minggu ini berbanding{" "}
                <span className="angka-tabular font-semibold text-ink">
                  {teratas.lalu}
                </span>{" "}
                minggu lalu. Lonjakan tertinggi biasanya menandai masalah yang
                belum tertangani di sumbernya.
              </p>
            </div>
          </div>
        </Card>
      )}

      {tercepat && (
        <p className="mb-8 flex items-start gap-2.5 border-l-2 border-daun-500 py-1 pl-4 text-sm leading-relaxed text-ink-2 teks-pretty">
          <TrendingDown
            size={16}
            aria-hidden
            className="mt-1 shrink-0 text-daun-600 dark:text-daun-400"
          />
          <span>
            Kategori paling responsif:{" "}
            <b className="font-semibold text-ink">{tercepat.nama}</b> —{" "}
            <span className="angka-tabular font-semibold text-ink">
              {tercepat.persen}%
            </span>{" "}
            tuntas ({tercepat.selesai} dari {tercepat.total} laporan).
          </span>
        </p>
      )}

      <div className="mb-6 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <Card className="p-5 sm:p-6">
          <h2 className="mb-5 font-bold">Laporan masuk vs selesai (6 bulan)</h2>
          <GrafikBulanan data={bulan} />
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="mb-5 font-bold">Tingkat penyelesaian per kategori</h2>
          <GrafikKategori data={perKategori} />
        </Card>
      </div>

      <Card className="p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-bold">Distribusi status</h2>
          <p className="text-xs text-muted">
            Dari <span className="angka-tabular">{total}</span> laporan
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
          {(Object.keys(STATUS) as StatusKey[]).map((s) => {
            const jumlah = statusCount[s] ?? 0;
            const persen = total > 0 ? Math.round((jumlah / total) * 100) : 0;
            return (
              <div key={s}>
                <dt>
                  <StatusChip status={s} />
                </dt>
                <dd className="mt-2.5 flex items-baseline gap-1.5">
                  <span className="angka-tabular font-display text-3xl font-extrabold leading-none">
                    {jumlah}
                  </span>
                  <span className="angka-tabular text-xs text-muted">
                    {persen}%
                  </span>
                </dd>
                <div
                  className="mt-2.5 h-1 rounded-kontrol bg-line/60"
                  aria-hidden
                >
                  <div
                    className="h-full rounded-kontrol"
                    style={{
                      width: `${persen}%`,
                      backgroundColor: STATUS[s].warna,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </dl>
      </Card>
    </main>
  );
}
