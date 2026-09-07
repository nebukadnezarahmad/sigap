import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  MapPin,
  Megaphone,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { KATEGORI } from "@/lib/constants";
import type { LaporanDenganRelasi } from "@/types/database";
import { IkonKategori } from "@/lib/ikon-vektor";
import { AngkaHidup, PetaHeroVisual, Terungkap } from "./landing-visual";
import { HeroPembungkus } from "@/components/eksperimen/hero-pembungkus";

export const dynamic = "force-dynamic";

const LANGKAH = [
  {
    nomor: "01",
    ikon: MapPin,
    judul: "Lapor dalam 30 detik",
    isi: "Klik titik di peta, tempel foto bukti, pilih kategori. Setiap laporan langsung terlihat oleh dewan.",
  },
  {
    nomor: "02",
    ikon: Megaphone,
    judul: "Warga serentak mendukung",
    isi: "Dukungan warga lain menaikkan prioritas penanganan dan mempercepat tindak lanjut di lapangan.",
  },
  {
    nomor: "03",
    ikon: CheckCircle2,
    judul: "Verifikasi tuntas transparan",
    isi: "Petugas wajib upload foto sesudah, dan laporan disahkan selesai setelah diverifikasi minimal 2 warga.",
  },
];

/* Grammar Apple DESIGN.md (FUSI): tile full-bleed bergantian
   putih ↔ parchment ↔ gelap, radius 0, tanpa shadow kecuali foto produk.
   Display tetap Fraunces/serif; headline tile 40px/600/tight; body 17px. */
const H2_TILE =
  "mt-2 font-serif text-[40px] font-semibold leading-[1.1] tracking-[-0.28px]";
const EYEBROW_LIGHT =
  "text-xs font-semibold uppercase tracking-[0.2em] text-ap-blue";
const BODY_TILE = "text-[17px] leading-[1.47] tracking-[-0.374px]";
const FOKUS_APPLE =
  "focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus!";
const KARTU_UTILITAS =
  "rounded-[18px] border border-ap-hairline bg-white shadow-none";

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
      <HeroPembungkus />
      {/* Tile 1 — hero terang (canvas putih) */}
      <section className="bg-white text-ap-ink">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="animate-muncul">
            <h1 className="font-serif text-[40px] font-semibold leading-[1.1] tracking-[-0.28px]">
              Masalah lingkungan di sekitarmu,{" "}
              <span className="text-ap-blue">terpetakan.</span>{" "}
              <em className="font-light italic text-ap-ink">
                Diselesaikan.
              </em>
            </h1>
            <p
              className={`mt-6 max-w-lg text-ap-ink/70 ${BODY_TILE}`}
            >
              SIGAP menghubungkan warga dan pemerintah desa/kota lewat peta
              interaktif: laporkan sampah menumpuk, drainase macet, atau lampu
              jalan mati — lalu pantau penanganannya secara transparan.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/peta"
                className={`group inline-flex min-h-[44px] items-center rounded-full ${FOKUS_APPLE}`}
              >
                <span className="inline-flex min-h-[44px] items-center gap-3 rounded-full bg-ap-blue py-[11px] pl-[22px] pr-[11px] text-[17px] font-semibold text-white transition active:scale-[0.95] hover:bg-ap-blue-focus">
                  Buka peta interaktif
                  <span className="flex size-8 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none">
                    <ArrowRight size={16} strokeWidth={2.2} />
                  </span>
                </span>
              </Link>
              <Link
                href="/daftar"
                className={`inline-flex min-h-[44px] items-center rounded-full border border-ap-blue bg-white px-[22px] py-[11px] text-[17px] font-semibold text-ap-blue transition hover:bg-ap-blue/5 active:scale-[0.95] ${FOKUS_APPLE}`}
              >
                Gabung jadi warga SIGAP
              </Link>
            </div>

            <dl className="mt-10 grid gap-5 sm:grid-cols-3">
              {[
                ["Laporan masuk", statistik.total],
                ["Selesai ditangani", statistik.selesai],
                ["Warga aktif", statistik.warga],
              ].map(([label, nilai]) => (
                <div
                  key={label as string}
                  className={`${KARTU_UTILITAS} p-6`}
                >
                  <dd className="font-serif text-3xl font-semibold text-ap-ink">
                    <AngkaHidup nilai={nilai as number} />
                  </dd>
                  <dt className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-ap-ink/60">
                    {label}
                  </dt>
                </div>
              ))}
            </dl>

            {/* Cuplikan Foto Lingkungan Nyata */}
            <div
              className={`mt-8 flex max-w-lg items-center gap-3.5 ${KARTU_UTILITAS} p-6`}
            >
              <div className="relative size-12 shrink-0 overflow-hidden rounded-lg shadow-ap-shadow">
                <Image
                  src="/images/lingkungan-permukiman.jpg"
                  alt="Kawasan permukiman kota hijau"
                  fill
                  sizes="(max-width:640px)100vw,(max-width:1024px)50vw,33vw"
                  priority
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-ap-ink">
                  Kawasan Permukiman Berkelanjutan
                </p>
                <p className="truncate text-[11px] text-ap-ink/60">
                  Kota Harapan · Terintegrasi Pos Ronda, DLH & Warga RT/RW
                </p>
              </div>
            </div>
          </div>

          <Terungkap tunda={0.15}>
            <PetaHeroVisual awalTitik={titikAwal} />
          </Terungkap>
        </div>
      </section>

      {/* Tile 2 — Cara Kerja & Gotong Royong (parchment) */}
      <section
        className="bg-ap-parchment text-ap-ink"
        aria-label="Cara kerja"
      >
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <Terungkap>
                <p className={EYEBROW_LIGHT}>Cara kerja</p>
                <h2 className={`${H2_TILE} max-w-xl`}>
                  Tiga Langkah Mudah Menjaga Lingkungan Bersama
                </h2>
              </Terungkap>
              <div className="mt-10 space-y-8">
                {LANGKAH.map((l, i) => (
                  <Terungkap key={l.nomor} tunda={i * 0.08}>
                    <div className="relative flex items-start gap-4 border-l-2 border-ap-blue/30 pl-6">
                      <span
                        aria-hidden
                        className="absolute -left-[13px] top-1 flex size-6 items-center justify-center rounded-full bg-ap-blue font-display text-[10px] font-bold text-white"
                      >
                        {i + 1}
                      </span>
                      <div>
                        <h3 className="flex items-center gap-2 font-display text-lg font-bold text-ap-ink">
                          <span className="flex size-7 items-center justify-center rounded-lg bg-ap-blue/10 text-ap-blue">
                            <l.ikon size={15} />
                          </span>
                          {l.judul}
                        </h3>
                        <p
                          className={`mt-1.5 text-ap-ink/70 teks-pretty ${BODY_TILE}`}
                        >
                          {l.isi}
                        </p>
                      </div>
                    </div>
                  </Terungkap>
                ))}
              </div>
            </div>

            {/* Kartu Foto Gotong Royong Warga Lapangan */}
            <div className="lg:col-span-5">
              <Terungkap tunda={0.2}>
                <div className={`${KARTU_UTILITAS} p-6`}>
                  <div className="relative h-80 w-full overflow-hidden rounded-lg shadow-ap-shadow">
                    <Image
                      src="/images/gotong-royong.jpg"
                      alt="Warga RT gotong royong dan verifikasi lingkungan"
                      fill
                      sizes="(max-width:640px)100vw,(max-width:1024px)50vw,33vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold backdrop-blur-md">
                        <Sparkles size={11} /> Aksi Lapangan Warga
                      </span>
                      <p className="mt-1.5 text-sm font-bold">
                        Gotong Royong & Verifikasi Warga
                      </p>
                      <p className="text-[11px] leading-relaxed text-white/80">
                        RT 05 / RW 03 · Masalah selesai divalidasi langsung oleh 2 warga sekitar.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-1 pt-4 text-xs">
                    <span className="text-ap-ink/60">Partisipasi Aktif RT/RW</span>
                    <span className="font-bold text-ap-blue">✓ Terverifikasi Lapangan</span>
                  </div>
                </div>
              </Terungkap>
            </div>
          </div>
        </div>
      </section>

      {/* Tile 3 — Kategori laporan (gelap ap-tile1, kartu utilitas putih) */}
      <section
        className="bg-ap-tile1 text-white"
        aria-label="Kategori laporan"
      >
        <div className="mx-auto max-w-6xl px-4 py-20">
          <Terungkap className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ap-sky">
                Standar Cakupan & SLA Resmi
              </p>
              <h2 className={H2_TILE}>
                6 Kategori Permukiman dengan Target SLA Terikat
              </h2>
            </div>
            <p className={`max-w-sm text-white/70 teks-pretty ${BODY_TILE}`}>
              Setiap kategori memiliki target waktu penanganan (*Service Level Agreement*) resmi yang dipantau publik secara transparan.
            </p>
          </Terungkap>
          <Terungkap tunda={0.1}>
            <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
              {KATEGORI.map((k) => (
                <div
                  key={k.slug}
                  className={`flex flex-col justify-between ${KARTU_UTILITAS} p-6`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="flex size-8 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${k.warna}20`, color: k.warna }}
                      role="img"
                      aria-label={k.nama}
                    >
                      <IkonKategori slug={k.slug} ukuran={15} />
                    </span>
                    <span className="angka-tabular rounded-full bg-ap-parchment px-2 py-0.5 text-xs font-bold text-ap-ink">
                      {hitungKategori.get(k.slug) ?? 0}
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="truncate font-display text-sm font-bold text-ap-ink">
                      {k.nama}
                    </p>
                    <p className="mt-1 text-[11px] font-semibold text-ap-blue">
                      SLA: {k.slug === "sampah" ? "3 Hari" : k.slug === "jalan" ? "14 Hari" : k.slug === "ruang-hijau" ? "21 Hari" : "7 Hari"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Terungkap>
        </div>
      </section>

      {/* Tile 4 — Arsitektur Solusi (canvas putih, kartu utilitas) */}
      <section
        className="bg-white text-ap-ink"
        aria-label="Pilar solusi SIGAP"
      >
        <div className="mx-auto max-w-6xl px-4 py-20">
          <Terungkap>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-ap-blue">
              <Building2 size={15} /> Arsitektur Solusi Infinitera 2.0
            </div>
            <h2 className={`${H2_TILE} max-w-2xl`}>
              Ekosistem Civic-Tech Tertutup & Akuntabel
            </h2>
            <p className={`mt-3 max-w-2xl text-ap-ink/70 ${BODY_TILE}`}>
              Bukan sekadar form pengaduan biasa. SIGAP dirancang dengan siklus data lengkap dari mitigasi duplikasi spasial hingga verifikasi silang oleh warga.
            </p>
          </Terungkap>

          <div className="mt-12 grid gap-5 lg:grid-cols-12">
            {/* Spotlight Kiri: Peta Spasial & Deduplikasi */}
            <Terungkap className="flex lg:col-span-6">
              <div className={`flex w-full flex-col justify-between ${KARTU_UTILITAS} p-6`}>
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-ap-parchment px-3 py-1 text-xs font-bold text-ap-blue">
                    <MapPin size={13} /> Pilar 01 · Masukan Data Bersih
                  </span>
                  <h3 className="mt-4 font-serif text-2xl font-semibold text-ap-ink">
                    Peta Spasial & Deduplikasi Geospasial 100m
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-ap-ink/70 teks-pretty">
                    Mencegah penumpukan laporan kembar di titik yang sama. Ketika warga meletakkan pin, algoritma PostGIS memindai masalah serupa dalam radius 100 meter dan mengajak warga ikut mendukung alih-alih membuat entri duplikat.
                  </p>
                  <div className="mt-6 space-y-2 rounded-lg border border-ap-hairline bg-ap-parchment p-4 text-xs">
                    <div className="flex items-center justify-between text-ap-ink/60">
                      <span>Indeks Spasial</span>
                      <span className="font-mono font-semibold text-ap-ink">PostGIS GiST 4326</span>
                    </div>
                    <div className="flex items-center justify-between text-ap-ink/60">
                      <span>Radius Filter</span>
                      <span className="font-semibold text-ap-blue">≤ 100 Meter</span>
                    </div>
                  </div>
                </div>

                <Link
                  href="/peta"
                  className={`mt-8 inline-flex min-h-[44px] items-center gap-2 text-[17px] font-semibold text-ap-blue ${FOKUS_APPLE}`}
                >
                  Buka Peta & Coba Lapor <ArrowRight size={15} />
                </Link>
              </div>
            </Terungkap>

            {/* 3 Blok Kanan: Dashboard, Verifikasi Warga, Transparansi */}
            <div className="flex flex-col justify-between space-y-5 lg:col-span-6">
              <Terungkap tunda={0.1}>
                <div className={`${KARTU_UTILITAS} p-6`}>
                  <div className="flex items-start gap-4">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-ap-blue/10 text-ap-blue">
                      <Building2 size={20} />
                    </span>
                    <div>
                      <h3 className="font-display text-lg font-bold text-ap-ink">
                        Dashboard Dewan dengan Target SLA
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-ap-ink/70">
                        Pemantauan target hari penanganan yang mengikat (3–21 hari), penugasan petugas teknis (DLH/PU), serta pemantauan sebaran kepadatan masalah via Heatmap.
                      </p>
                    </div>
                  </div>
                </div>
              </Terungkap>

              <Terungkap tunda={0.2}>
                <div className={`${KARTU_UTILITAS} p-6`}>
                  <div className="flex items-start gap-4">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-ap-blue/10 text-ap-blue">
                      <CheckCircle2 size={20} />
                    </span>
                    <div>
                      <h3 className="font-display text-lg font-bold text-ap-ink">
                        Verifikasi 2 Warga & Bukti Foto Wajib
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-ap-ink/70">
                        Menghapus praktik penutupan laporan sepihak. Dewan wajib melampirkan foto bukti fisik sesudah, dan status membutuhkan minimal 2 konfirmasi warga lapangan.
                      </p>
                    </div>
                  </div>
                </div>
              </Terungkap>

              <Terungkap tunda={0.3}>
                <div className={`${KARTU_UTILITAS} p-6`}>
                  <div className="flex items-start gap-4">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-ap-blue/10 text-ap-blue">
                      <BarChart3 size={20} />
                    </span>
                    <div>
                      <h3 className="font-display text-lg font-bold text-ap-ink">
                        Papan Keterlambatan Publik & Open Data
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-ap-ink/70">
                        Daftar laporan yang melewati SLA dipublikasikan terbuka (*Overdue Watchlist*), siap dicetak PDF untuk rapat RT/RW, dan tersedia via API lisensi CC-BY.
                      </p>
                    </div>
                  </div>
                </div>
              </Terungkap>
            </div>
          </div>
        </div>
      </section>

      {/* Tile 5 — Lembar Fakta (parchment, kartu utilitas putih) */}
      <section className="bg-ap-parchment text-ap-ink" aria-label="Mengapa penting">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="grid items-center gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <p className={EYEBROW_LIGHT}>
                Lembar Fakta Permukiman
              </p>
              <h2 className={H2_TILE}>
                Mengapa SIGAP Mendesak untuk Kota Kita?
              </h2>
              <p className={`mt-4 text-ap-ink/70 teks-pretty ${BODY_TILE}`}>
                Data SIPSN Kementerian Lingkungan Hidup mencatat timbulan sampah nasional mencapai <b className="font-semibold text-ap-ink">±33,79 juta ton pada 2024</b>, dan hanya sekitar sepertiga yang berhasil dikelola dengan baik. Mayoritas sisanya menumpuk persis di lingkungan permukiman: drainase tersumbat, TPS liar di tikungan jalan, dan fasilitas publik terbengkalai.
              </p>
              <p className={`mt-3 text-ap-ink/70 teks-pretty ${BODY_TILE}`}>
                Perubahan nyata dimulai dari lingkup terkecil: koordinasi RT/RW yang transparan dan terdata secara digital.
              </p>
              <p className="mt-6 text-xs text-ap-ink/60">
                Sumber Resmi: SIPSN KLHK 2024–2025 · Publikasi Riset BRIN (2025)
              </p>
            </div>

            <div className="flex flex-col gap-5 lg:col-span-5">
              <div className="relative h-48 w-full overflow-hidden rounded-lg shadow-ap-shadow">
                <Image
                  src="/images/kota-sdg11.jpg"
                  alt="Koridor transportasi dan ruang hijau perkotaan berkelanjutan SDG 11"
                  fill
                  sizes="(max-width:640px)100vw,(max-width:1024px)50vw,33vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <p className="absolute bottom-2.5 left-3.5 right-3.5 text-xs font-bold text-white">
                  Target SDG 11: Kota & Permukiman Berkelanjutan
                </p>
              </div>

              {[
                { angka: "33,79 Jt", unit: "Ton", label: "Timbulan sampah nasional tahun 2024" },
                { angka: "~32%", unit: "Terkelola", label: "Sampah yang tertangani dengan baik" },
                { angka: "56,7%", unit: "Rumah Tangga", label: "Berasal dari aktivitas permukiman warga" },
              ].map((f) => (
                <div
                  key={f.label}
                  className={`${KARTU_UTILITAS} p-6 text-left`}
                >
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-serif text-2xl font-semibold text-ap-ink">
                      {f.angka}
                    </span>
                    <span className="text-xs font-bold uppercase text-ap-blue">
                      {f.unit}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-ap-ink/70">{f.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tile 6 — Call to Action (gelap ap-tile2) */}
      <section className="bg-ap-tile2 text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <Terungkap>
            <h2 className="font-serif text-[40px] font-semibold leading-[1.1] tracking-[-0.28px]">
              Lingkunganmu Menunggu Tindakan Nyata.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[17px] leading-[1.47] tracking-[-0.374px] text-white/70 teks-pretty">
              Butuh 30 detik untuk menandai masalah di peta. Penanganannya tercatat dan dipantau bersama seluruh warga.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/peta"
                className={`group inline-flex min-h-[44px] items-center rounded-full ${FOKUS_APPLE}`}
              >
                <span className="inline-flex min-h-[44px] items-center gap-3 rounded-full bg-ap-blue py-[14px] pl-7 pr-[14px] text-[17px] font-semibold text-white transition active:scale-[0.95] hover:bg-ap-blue-focus">
                  Buka Peta Interaktif
                  <span className="flex size-8 items-center justify-center rounded-full bg-white/15 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none">
                    <ArrowRight size={16} strokeWidth={2.2} />
                  </span>
                </span>
              </Link>
            </div>
          </Terungkap>
        </div>
      </section>
    </main>
  );
}
