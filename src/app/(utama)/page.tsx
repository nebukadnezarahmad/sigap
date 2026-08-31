import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  MapPin,
  Megaphone,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { KATEGORI } from "@/lib/constants";
import type { LaporanDenganRelasi } from "@/types/database";
import { Card } from "@/components/ui";
import { IkonKategori } from "@/lib/ikon-vektor";
import { AngkaHidup, PetaHeroVisual, Terungkap } from "./landing-visual";

export const dynamic = "force-dynamic";

const LANGKAH = [
  {
    nomor: "01",
    ikon: MapPin,
    judul: "Lapor dalam 30 detik",
    isi: "Klik titik di peta, tempel foto, pilih kategori. Selesai. Setiap laporan langsung terlihat oleh dewan.",
    lebar: "md:ml-0 md:max-w-xl",
  },
  {
    nomor: "02",
    ikon: Megaphone,
    judul: "Warga serentak mendukung",
    isi: "Dukungan dan komentar warga lain menaikkan prioritas laporan — dan membuatnya sulit diabaikan.",
    lebar: "md:ml-auto md:max-w-xl md:text-right",
  },
  {
    nomor: "03",
    ikon: CheckCircle2,
    judul: "Ditindaklanjuti transparan",
    isi: "Semua orang melihat perubahan status: baru, diverifikasi, dikerjakan, selesai — lengkap dengan bukti foto.",
    lebar: "md:ml-0 md:max-w-xl",
  },
];

export default async function Beranda() {
  let statistik = { total: 0, selesai: 0, warga: 0 };
  let hitungKategori = new Map<string, number>();
  let titikAwal: {
    id: string;
    lat: number;
    lng: number;
    warna: string;
    slug: string;
    judul: string;
    status?: string;
  }[] = [];

  try {
    const supabase = await createClient();
    if (supabase) {
      const [laporan, selesai, warga, perKategori, laporanPeta] = await Promise.all([
        supabase.from("reports").select("id", { count: "exact", head: true }),
        supabase
          .from("reports")
          .select("id", { count: "exact", head: true })
          .eq("status", "selesai"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("reports").select("categories(slug)"),
        supabase
          .from("reports")
          .select("id, judul, lat, lng, status, categories(slug, nama, warna)")
          .not("lat", "is", null)
          .not("lng", "is", null)
          .order("created_at", { ascending: false })
          .limit(30),
      ]);
      statistik = {
        total: laporan.count ?? 0,
        selesai: selesai.count ?? 0,
        warga: warga.count ?? 0,
      };
      hitungKategori = new Map();
      for (const r of (perKategori.data ?? []) as unknown as LaporanDenganRelasi[]) {
        const slug = r.categories?.slug ?? "lainnya";
        hitungKategori.set(slug, (hitungKategori.get(slug) ?? 0) + 1);
      }
      if (laporanPeta.data && laporanPeta.data.length > 0) {
        titikAwal = (laporanPeta.data as unknown as {
          id: string;
          judul: string;
          lat: number | string;
          lng: number | string;
          status: string;
          categories: { slug: string; nama: string; warna: string } | null;
        }[]).map((r) => ({
          id: r.id,
          lat: Number(r.lat),
          lng: Number(r.lng),
          warna: r.categories?.warna ?? "#2e9e57",
          slug: r.categories?.slug ?? "sampah",
          judul: r.judul,
          status: r.status,
        }));
      }
    }
  } catch {
    /* fallback nol */
  }

  return (
    <main>
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_70%_10%,rgba(46,158,87,0.1),transparent)]"
        />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:pt-24">
          <div className="animate-muncul">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-daun-500/30 bg-daun-500/10 px-3.5 py-1.5 text-xs font-semibold text-daun-700 dark:text-daun-300">
              <Building2 size={13} className="inline align-[-2px]" /> Untuk Kota
              & Permukiman Berkelanjutan · SDG 11
            </p>
            <h1 className="font-serif text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              Masalah lingkungan di sekitarmu,{" "}
              <span className="text-daun-600 dark:text-daun-400">
                terpetakan.
              </span>{" "}
              <em className="font-light italic text-kunyit-500">
                Diselesaikan.
              </em>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted teks-pretty">
              SIGAP menghubungkan warga dan pemerintah desa/kota lewat peta
              interaktif: laporkan sampah menumpuk, drainase macet, atau lampu
              jalan mati — lalu pantau penanganannya secara transparan.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/peta" className="group inline-flex">
                <span className="inline-flex items-center gap-3 rounded-full bg-daun-600 py-2.5 pl-7 pr-2.5 text-base font-semibold text-white shadow-[0_1px_2px_rgb(23_67_42/0.2),0_8px_20px_-6px_rgb(23_67_42/0.4)] transition-[transform,background-color] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-daun-700 active:scale-[0.98]">
                  Buka peta interaktif
                  <span className="flex size-8 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                    <ArrowRight size={16} strokeWidth={2.2} />
                  </span>
                </span>
              </Link>
              <Link
                href="/daftar"
                className="rounded-full border garis-halus bg-panel px-6 py-3 text-base font-semibold text-ink transition-[border-color,color] duration-300 hover:border-daun-400 hover:text-daun-700 dark:hover:text-daun-300"
              >
                Gabung jadi warga SIGAP
              </Link>
            </div>
            <dl className="mt-10 flex gap-10">
              {[
                ["Laporan masuk", statistik.total],
                ["Selesai ditangani", statistik.selesai],
                ["Warga aktif", statistik.warga],
              ].map(([label, nilai]) => (
                <div key={label as string}>
                  <dd className="font-display text-2xl font-extrabold text-daun-700 dark:text-daun-300 sm:text-3xl">
                    <AngkaHidup nilai={nilai as number} />
                  </dd>
                  <dt className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-muted">
                    {label}
                  </dt>
                </div>
              ))}
            </dl>
          </div>

          <Terungkap tunda={0.15}>
            <PetaHeroVisual awalTitik={titikAwal} />
          </Terungkap>
        </div>
      </section>

      <section
        className="mx-auto max-w-6xl px-4 py-24"
        aria-label="Cara kerja"
      >
        <Terungkap>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-daun-600 dark:text-daun-400">
            Cara kerja
          </p>
          <h2 className="mt-3 max-w-xl font-serif text-4xl font-semibold tracking-tight">
            Tiga langkah, satu lingkungan lebih baik
          </h2>
        </Terungkap>
        <div className="mt-14 space-y-14">
          {LANGKAH.map((l, i) => (
            <Terungkap key={l.nomor} tunda={i * 0.08}>
              <div
                className={`relative flex items-start gap-6 border-l-2 border-daun-600/20 pl-8 ${l.lebar}`}
              >
                <span
                  aria-hidden
                  className="absolute -left-[13px] top-1 flex size-6 items-center justify-center rounded-full bg-daun-600 font-display text-[10px] font-bold text-white"
                >
                  {i + 1}
                </span>
                <span
                  aria-hidden
                  className="hidden font-display text-6xl font-extrabold leading-none text-daun-600/10 sm:block dark:text-daun-300/10"
                >
                  {l.nomor}
                </span>
                <div className={l.lebar.includes("text-right") ? "sm:ml-auto" : ""}>
                  <h3 className="flex items-center gap-2.5 font-serif text-2xl font-semibold tracking-tight">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-daun-600/10 text-daun-700 dark:text-daun-300">
                      <l.ikon size={18} strokeWidth={1.8} />
                    </span>
                    {l.judul}
                  </h3>
                  <p className="mt-2 leading-relaxed text-muted teks-pretty">
                    {l.isi}
                  </p>
                </div>
              </div>
            </Terungkap>
          ))}
        </div>
      </section>

      <section
        className="border-y garis-halus bg-panel-2/60 py-20"
        aria-label="Kategori laporan"
      >
        <div className="mx-auto max-w-6xl px-4">
          <Terungkap className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-daun-600 dark:text-daun-400">
                Standar Cakupan & SLA Resmi
              </p>
              <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-semibold tracking-tight">
                6 Kategori Permukiman dengan Target SLA Terikat
              </h2>
            </div>
            <p className="max-w-sm text-sm text-muted teks-pretty">
              Setiap kategori memiliki target waktu penanganan (*Service Level Agreement*) resmi yang dipantau publik secara transparan.
            </p>
          </Terungkap>
          <Terungkap tunda={0.1}>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {KATEGORI.map((k) => (
                <div
                  key={k.slug}
                  className="flex flex-col justify-between rounded-2xl border garis-halus bg-panel p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="flex size-8 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${k.warna}20`, color: k.warna }}
                      role="img"
                      aria-label={k.nama}
                    >
                      <IkonKategori slug={k.slug} ukuran={15} />
                    </span>
                    <span className="angka-tabular rounded-full bg-panel-2 px-2 py-0.5 text-xs font-bold text-muted">
                      {hitungKategori.get(k.slug) ?? 0}
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="font-display font-bold text-sm text-ink truncate">
                      {k.nama}
                    </p>
                    <p className="mt-1 text-[11px] font-semibold text-daun-700 dark:text-daun-300">
                      SLA: {k.slug === "sampah" ? "3 Hari" : k.slug === "jalan" ? "14 Hari" : k.slug === "ruang-hijau" ? "21 Hari" : "7 Hari"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Terungkap>
        </div>
      </section>

      {/* Arsitektur Solusi — Asymmetric Editorial Layout */}
      <section
        className="mx-auto max-w-6xl px-4 py-24"
        aria-label="Pilar solusi SIGAP"
      >
        <Terungkap>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-kunyit-600">
            <Building2 size={15} /> Arsitektur Solusi Infinitera 2.0
          </div>
          <h2 className="mt-2 max-w-2xl font-serif text-3xl sm:text-4xl font-semibold tracking-tight">
            Ekosistem Civic-Tech Tertutup & Akuntabel
          </h2>
          <p className="mt-3 max-w-2xl text-muted text-base">
            Bukan sekadar form pengaduan biasa. SIGAP dirancang dengan siklus data lengkap dari mitigasi duplikasi spasial hingga verifikasi silang oleh warga.
          </p>
        </Terungkap>

        <div className="mt-12 grid gap-6 lg:grid-cols-12">
          {/* Spotlight Kiri: Peta Spasial & Deduplikasi */}
          <Terungkap className="lg:col-span-6 flex">
            <Card className="flex flex-col justify-between p-8 border-daun-600/30 bg-gradient-to-b from-daun-600/5 to-transparent w-full">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-daun-600/15 px-3 py-1 text-xs font-bold text-daun-700 dark:text-daun-300">
                  <MapPin size={13} /> Pilar 01 · Masukan Data Bersih
                </span>
                <h3 className="mt-4 font-serif text-2xl font-semibold">
                  Peta Spasial & Deduplikasi Geospasial 100m
                </h3>
                <p className="mt-3 leading-relaxed text-muted text-sm teks-pretty">
                  Mencegah penumpukan laporan kembar di titik yang sama. Ketika warga meletakkan pin, algoritma PostGIS memindai masalah serupa dalam radius 100 meter dan mengajak warga ikut mendukung alih-alih membuat entri duplikat.
                </p>
                <div className="mt-6 rounded-2xl border garis-halus bg-panel p-4 text-xs space-y-2">
                  <div className="flex items-center justify-between text-muted">
                    <span>Indeks Spasial</span>
                    <span className="font-mono text-ink font-semibold">PostGIS GiST 4326</span>
                  </div>
                  <div className="flex items-center justify-between text-muted">
                    <span>Radius Filter</span>
                    <span className="font-semibold text-daun-700 dark:text-daun-300">≤ 100 Meter</span>
                  </div>
                </div>
              </div>

              <Link
                href="/peta"
                className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-daun-700 hover:text-daun-800 dark:text-daun-300"
              >
                Buka Peta & Coba Lapor <ArrowRight size={15} />
              </Link>
            </Card>
          </Terungkap>

          {/* 3 Blok Kanan: Dashboard, Verifikasi Warga, Transparansi */}
          <div className="lg:col-span-6 space-y-4 flex flex-col justify-between">
            <Terungkap tunda={0.1}>
              <Card className="p-6 transition hover:border-daun-400">
                <div className="flex items-start gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                    <Building2 size={20} />
                  </span>
                  <div>
                    <h3 className="font-display font-bold text-lg">
                      Dashboard Dewan dengan Target SLA
                    </h3>
                    <p className="mt-1 text-xs text-muted leading-relaxed">
                      Pemantauan target hari penanganan yang mengikat (3–21 hari), penugasan petugas teknis (DLH/PU), serta pemantauan sebaran kepadatan masalah via Heatmap.
                    </p>
                  </div>
                </div>
              </Card>
            </Terungkap>

            <Terungkap tunda={0.2}>
              <Card className="p-6 border-orange-500/30 bg-orange-500/5 transition hover:border-orange-500/50">
                <div className="flex items-start gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/15 text-orange-600 dark:text-orange-400">
                    <CheckCircle2 size={20} />
                  </span>
                  <div>
                    <h3 className="font-display font-bold text-lg text-ink">
                      Verifikasi 2 Warga & Bukti Foto Wajib
                    </h3>
                    <p className="mt-1 text-xs text-muted leading-relaxed">
                      Menghapus praktik penutupan laporan sepihak. Dewan wajib melampirkan foto bukti fisik sesudah, dan status membutuhkan minimal 2 konfirmasi warga lapangan.
                    </p>
                  </div>
                </div>
              </Card>
            </Terungkap>

            <Terungkap tunda={0.3}>
              <Card className="p-6 transition hover:border-daun-400">
                <div className="flex items-start gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-daun-600/10 text-daun-700 dark:text-daun-300">
                    <BarChart3 size={20} />
                  </span>
                  <div>
                    <h3 className="font-display font-bold text-lg">
                      Papan Keterlambatan Publik & Open Data
                    </h3>
                    <p className="mt-1 text-xs text-muted leading-relaxed">
                      Daftar laporan yang melewati SLA dipublikasikan terbuka (*Overdue Watchlist*), siap dicetak PDF untuk rapat RT/RW, dan tersedia via API lisensi CC-BY.
                    </p>
                  </div>
                </div>
              </Card>
            </Terungkap>
          </div>
        </div>
      </section>

      {/* Section Mengapa Ini Penting — Factsheet Dossier */}
      <section className="mx-auto max-w-6xl px-4 py-20" aria-label="Mengapa penting">
        <div className="rounded-[2.5rem] border garis-halus bg-panel p-8 sm:p-12 shadow-sm">
          <div className="grid items-center gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-kunyit-600">
                Lembar Fakta Permukiman
              </p>
              <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-semibold tracking-tight">
                Mengapa SIGAP Mendesak untuk Kota Kita?
              </h2>
              <p className="mt-4 leading-relaxed text-muted text-sm sm:text-base teks-pretty">
                Data SIPSN Kementerian Lingkungan Hidup mencatat timbulan sampah nasional mencapai <b className="text-ink font-semibold">±33,79 juta ton pada 2024</b>, dan hanya sekitar sepertiga yang berhasil dikelola dengan baik. Mayoritas sisanya menumpuk persis di lingkungan permukiman: drainase tersumbat, TPS liar di tikungan jalan, dan fasilitas publik terbengkalai.
              </p>
              <p className="mt-3 leading-relaxed text-muted text-sm sm:text-base teks-pretty">
                Perubahan nyata dimulai dari lingkup terkecil: koordinasi RT/RW yang transparan dan terdata secara digital.
              </p>
              <p className="mt-6 text-xs text-muted/80">
                Sumber Resmi: SIPSN KLHK 2024–2025 · Publikasi Riset BRIN (2025)
              </p>
            </div>

            <div className="lg:col-span-5 grid gap-3">
              {[
                { angka: "33,79 Jt", unit: "Ton", label: "Timbulan sampah nasional tahun 2024" },
                { angka: "~32%", unit: "Terkelola", label: "Sampah yang tertangani dengan baik" },
                { angka: "56,7%", unit: "Rumah Tangga", label: "Berasal dari aktivitas permukiman warga" },
              ].map((f) => (
                <div
                  key={f.label}
                  className="rounded-2xl border garis-halus bg-panel-2 p-4 text-left"
                >
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-serif text-3xl font-bold text-ink">
                      {f.angka}
                    </span>
                    <span className="text-xs font-bold text-daun-700 dark:text-daun-300 uppercase">
                      {f.unit}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted">{f.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Banner Call to Action */}
      <section className="mx-auto max-w-6xl px-4 pb-28">
        <Terungkap>
          <div className="relative overflow-hidden rounded-[2.5rem] bg-daun-700 p-10 text-center text-white sm:p-16 shadow-2xl">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_60%_at_50%_120%,rgba(255,255,255,0.18),transparent)]"
            />
            <h2 className="font-serif text-3xl font-semibold sm:text-4xl">
              Lingkunganmu Menunggu Tindakan Nyata.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/85 text-base sm:text-lg teks-pretty">
              Butuh 30 detik untuk menandai masalah di peta. Penanganannya tercatat dan dipantau bersama seluruh warga.
            </p>
            <div className="mt-8 flex flex-wrap justify-center items-center gap-3">
              <Link href="/peta" className="group inline-flex">
                <span className="inline-flex items-center gap-3 rounded-full bg-white py-3 pl-8 pr-3 text-base font-bold text-daun-800 transition-all hover:bg-daun-50 active:scale-[0.98] shadow-lg">
                  Buka Peta Interaktif
                  <span className="flex size-8 items-center justify-center rounded-full bg-daun-600/15 transition-transform group-hover:translate-x-0.5">
                    <ArrowRight size={16} strokeWidth={2.2} className="text-daun-700" />
                  </span>
                </span>
              </Link>
            </div>
          </div>
        </Terungkap>
      </section>
    </main>
  );
}
