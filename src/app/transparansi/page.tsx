import type { Metadata } from "next";
import { TrendingDown, TrendingUp, Timer, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { KATEGORI, STATUS, type StatusKey } from "@/lib/constants";
import { Card, StatusChip } from "@/components/ui";
import { GrafikBulanan, GrafikKategori } from "./grafik";

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
  categories: { slug: string; nama: string; warna: string; emoji: string } | null;
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
      `id, judul, status, created_at, lat, lng, categories(slug,nama,warna,emoji),
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
    return { nama: k.nama, emoji: k.emoji, kini, lalu, naik: kini - lalu };
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
      <header className="mb-8">
        <h1 className="font-display text-3xl font-bold">
          Transparansi Kinerja Dewan
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Data publik dari laporan warga — tanpa disunting. Keterbukaan adalah
          fondasi kota yang berkelanjutan.
        </p>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: "Total laporan",
            nilai: total,
            ikon: <CheckCircle2 size={20} />,
            warna: "text-sky-600 dark:text-sky-400 bg-sky-500/10",
          },
          {
            label: "Selesai ditangani",
            nilai: `${persenSelesai}%`,
            ikon: <CheckCircle2 size={20} />,
            warna: "text-daun-700 dark:text-daun-300 bg-daun-500/10",
          },
          {
            label: "Median waktu penyelesaian",
            nilai: medianHari ? `${medianHari} hari` : "—",
            ikon: <Timer size={20} />,
            warna: "text-kunyit-600 dark:text-kunyit-400 bg-kunyit-500/10",
          },
          {
            label: "Laporan minggu ini",
            nilai: mingguIni.length,
            ikon: <TrendingUp size={20} />,
            warna: "text-violet-600 dark:text-violet-400 bg-violet-500/10",
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

      <div className="mb-6 grid gap-3 md:grid-cols-2">
        {teratas && (
          <Card className="flex items-start gap-3 border-kunyit-500/40 p-5">
            <TrendingUp className="mt-0.5 text-kunyit-500" size={20} />
            <div>
              <p className="font-display font-bold">Insight otomatis</p>
              <p className="mt-1 text-sm text-muted">
                Laporan <b className="text-ink">{teratas.emoji} {teratas.nama}</b>{" "}
                naik <b className="text-ink">{teratas.naik} laporan</b> dibanding
                minggu lalu ({teratas.kini} vs {teratas.lalu}). Perlu perhatian
                khusus dewan.
              </p>
            </div>
          </Card>
        )}
        {tercepat && (
          <Card className="flex items-start gap-3 border-daun-500/40 p-5">
            <TrendingDown className="mt-0.5 text-daun-600 dark:text-daun-400" size={20} />
            <div>
              <p className="font-display font-bold">Yang paling responsif</p>
              <p className="mt-1 text-sm text-muted">
                Kategori <b className="text-ink">{tercepat.nama}</b> dituntaskan{" "}
                <b className="text-ink">{tercepat.persen}%</b> ({tercepat.selesai}/
                {tercepat.total} laporan). Contoh kerja sama yang baik!
              </p>
            </div>
          </Card>
        )}
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 font-display font-bold">
            Laporan masuk vs selesai (6 bulan)
          </h2>
          <GrafikBulanan data={bulan} />
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 font-display font-bold">
            Tingkat penyelesaian per kategori
          </h2>
          <GrafikKategori data={perKategori} />
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="mb-4 font-display font-bold">Distribusi status</h2>
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
    </main>
  );
}
