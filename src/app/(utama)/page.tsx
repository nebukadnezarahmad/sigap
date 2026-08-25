import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  GraduationCap,
  MapPin,
  Megaphone,
  Recycle,
  Store,
  Users,
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
  try {
    const supabase = await createClient();
    if (supabase) {
      const [laporan, selesai, warga, perKategori] = await Promise.all([
        supabase.from("reports").select("id", { count: "exact", head: true }),
        supabase
          .from("reports")
          .select("id", { count: "exact", head: true })
          .eq("status", "selesai"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("reports").select("categories(slug)"),
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
            <PetaHeroVisual />
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
        className="border-y garis-halus bg-panel-2/60 py-24"
        aria-label="Kategori laporan"
      >
        <div className="mx-auto max-w-6xl px-4">
          <Terungkap className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-daun-600 dark:text-daun-400">
                Cakupan
              </p>
              <h2 className="mt-3 font-serif text-4xl font-semibold tracking-tight">
                Apa yang bisa dilaporkan?
              </h2>
            </div>
            <p className="max-w-sm text-sm text-muted teks-pretty">
              Enam kategori menampung hampir semua masalah permukiman sehari-hari
              — jumlahnya tumbuh seiring partisipasi warga.
            </p>
          </Terungkap>
          <Terungkap tunda={0.1}>
            <div className="mt-10 flex flex-wrap gap-2.5">
              {KATEGORI.map((k) => (
                <span
                  key={k.slug}
                  className="flex items-center gap-2 rounded-full border garis-halus bg-panel py-2.5 pl-4 pr-3 text-sm font-semibold shadow-[0_1px_2px_rgb(23_67_42/0.04)]"
                >
                  <span
                    className="flex size-7 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${k.warna}22`, color: k.warna }}
                    role="img"
                    aria-label={k.nama}
                  >
                    <IkonKategori slug={k.slug} ukuran={14} />
                  </span>
                  {k.nama}
                  <span className="angka-tabular rounded-full bg-panel-2 px-2 py-0.5 text-xs text-muted">
                    {hitungKategori.get(k.slug) ?? 0}
                  </span>
                </span>
              ))}
            </div>
          </Terungkap>
        </div>
      </section>

      <section
        className="mx-auto max-w-6xl px-4 py-24"
        aria-label="Lebih dari sekadar lapor"
      >
        <Terungkap>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-kunyit-600">
            Ekosistem
          </p>
          <h2 className="mt-3 max-w-2xl font-serif text-4xl font-semibold tracking-tight">
            Lebih dari sekadar kanal lapor.
          </h2>
        </Terungkap>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            {
              ikon: BarChart3,
              judul: "Polling partisipatif",
              isi: "Suaramu menentukan prioritas kebijakan lingkungan — hasil realtime, terbuka.",
              href: "/polling",
              cta: "Ikut polling",
            },
            {
              ikon: Users,
              judul: "Aksi bersama",
              isi: "Sabtu bersih, lokakarya komposting — temukan atau prakarsai gerakan warga.",
              href: "/aksi",
              cta: "Lihat aksi",
            },
            {
              ikon: GraduationCap,
              judul: "Edukasi & quiz",
              isi: "Materi ringkas, quiz badge, dan kalkulator jejak sampah pribadimu.",
              href: "/edukasi",
              cta: "Mulai belajar",
            },
            {
              ikon: Recycle,
              judul: "Pasar ReUse",
              isi: "Barang bekas layak pakai berpindah gratis antar-warga — sampah berkurang, tetangga terhubung.",
              href: "/pasar",
              cta: "Cari barang",
            },
            {
              ikon: Store,
              judul: "UMKM warga",
              isi: "Belanja di tetangga sendiri: kuliner, kerajinan, jasa — ekonomi lingkungan berputar lokal.",
              href: "/umkm",
              cta: "Jelajahi usaha",
            },
          ].map((k, i) => (
            <Terungkap key={k.judul} tunda={(i % 3) * 0.08}>
              <Card className="flex h-full flex-col p-6">
                <span className="flex size-10 items-center justify-center rounded-xl bg-daun-600/10 text-daun-700 dark:text-daun-300">
                  <k.ikon size={18} strokeWidth={1.8} />
                </span>
                <h3 className="mt-3 font-display text-lg font-bold">{k.judul}</h3>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted teks-pretty">
                  {k.isi}
                </p>
                <Link
                  href={k.href}
                  className="group mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-daun-700 dark:text-daun-300"
                >
                  {k.cta}
                  <ArrowRight
                    size={14}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              </Card>
            </Terungkap>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-24" aria-label="Mengapa penting">
        <div className="grid items-start gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <Terungkap>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-kunyit-600">
              Mengapa ini penting
            </p>
            <h2 className="mt-3 font-serif text-4xl font-semibold tracking-tight">
              Ini bukan sekadar aplikasi.
            </h2>
            <p className="mt-5 max-w-lg leading-relaxed text-muted teks-pretty">
              Data SIPSN Kementerian Lingkungan Hidup mencatat timbulan sampah
              nasional mencapai{" "}
              <b className="text-ink">±33,79 juta ton pada 2024</b>, dan hanya
              sekitar sepertiga yang dikelola dengan baik. Mayoritas sisanya
              menumpuk persis di permukiman kita — di got, di tikungan, di tanah
              kosong.
            </p>
            <p className="mt-4 max-w-lg leading-relaxed text-muted teks-pretty">
              Perubahan dimulai dari lingkungan terkecil: RT kita. SIGAP membuat
              setiap warga punya alat untuk memulainya hari ini.
            </p>
            <p className="mt-5 text-xs text-muted">
              Sumber: SIPSN KLHK 2024–2025 · BRIN (2025)
            </p>
          </Terungkap>
          <div className="grid gap-3 sm:grid-cols-3 lg:mt-14">
            {[
              ["33,79 jt", "ton sampah nasional 2024"],
              ["~32%", "yang dikelola dengan baik"],
              ["56,7%", "berasal dari rumah tangga"],
            ].map(([angka, label], i) => (
              <Terungkap key={label} tunda={i * 0.08}>
                <Card
                  className={`flex h-full flex-col justify-between p-5 bayi-daun ${
                    i === 1 ? "sm:-translate-y-3" : i === 2 ? "sm:translate-y-2" : ""
                  }`}
                >
                  <p className="font-serif text-3xl font-semibold text-kunyit-500">
                    {angka}
                  </p>
                  <p className="mt-3 text-sm text-muted teks-pretty">{label}</p>
                </Card>
              </Terungkap>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-28">
        <Terungkap>
          <div className="relative overflow-hidden rounded-[2rem] border-none bg-daun-700 p-10 text-center text-white sm:p-16">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_60%_at_50%_120%,rgba(255,255,255,0.16),transparent)]"
            />
            <h2 className="font-serif text-3xl font-semibold sm:text-4xl">
              Lingkunganmu menunggu laporan pertamamu.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/85 teks-pretty">
              Butuh 30 detik untuk melapor. Dampaknya bisa bertahun-tahun
              dirasakan.
            </p>
            <Link href="/peta" className="group mt-8 inline-flex">
              <span className="inline-flex items-center gap-3 rounded-full bg-white py-2.5 pl-7 pr-2.5 text-base font-semibold text-daun-800 transition-[transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-daun-50 active:scale-[0.98]">
                Mulai jelajahi peta
                <span className="flex size-8 items-center justify-center rounded-full bg-daun-600/10 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  <ArrowRight size={16} strokeWidth={2.2} className="text-daun-700" />
                </span>
              </span>
            </Link>
          </div>
        </Terungkap>
      </section>
    </main>
  );
}
