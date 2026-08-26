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

/**
 * Penanda seksi bergaya editorial: nomor + garis + nama.
 * Menggantikan empat eyebrow `uppercase tracking-[0.2em]` yang identik —
 * pengulangan struktur pembuka yang sama adalah salah satu tanda paling khas
 * halaman yang di-generate.
 */
function PenandaSeksi({ nomor, nama }: { nomor: string; nama: string }) {
  return (
    <p className="flex items-center gap-3 text-mikro font-semibold uppercase text-muted">
      <span className="angka-tabular font-display text-base font-extrabold text-daun-700 dark:text-daun-300">
        {nomor}
      </span>
      <span aria-hidden className="h-px w-8 bg-line-kuat" />
      {nama}
    </p>
  );
}

const EKOSISTEM = [
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
    ikon: Store,
    judul: "UMKM warga",
    isi: "Belanja di tetangga sendiri: kuliner, kerajinan, jasa.",
    href: "/umkm",
    cta: "Jelajahi usaha",
  },
];

export default async function Beranda() {
  let statistik = { total: 0, selesai: 0, warga: 0 };
  let hitungKategori = new Map<string, number>();
  let dbHidup = false;
  let baruSelesai: LaporanDenganRelasi[] = [];

  try {
    const supabase = await createClient();
    if (supabase) {
      const [laporan, selesai, warga, perKategori, terbaru] = await Promise.all([
        supabase.from("reports").select("id", { count: "exact", head: true }),
        supabase
          .from("reports")
          .select("id", { count: "exact", head: true })
          .eq("status", "selesai"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("reports").select("categories(slug)"),
        supabase
          .from("reports")
          .select(
            "id, judul, alamat_teks, foto_url, updated_at, categories(slug, nama, warna)"
          )
          .eq("status", "selesai")
          .order("updated_at", { ascending: false })
          .limit(3),
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
      baruSelesai = (terbaru.data ?? []) as unknown as LaporanDenganRelasi[];
      dbHidup = !laporan.error;
    }
  } catch {
    dbHidup = false;
  }

  return (
    <main>
      {/* Hero — tanpa blob gradien. Kedalaman datang dari asimetri kolom dan
          visual peta yang nyata, bukan dari cahaya dekoratif. */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:pt-24">
          <div className="animate-muncul">
            <p className="mb-5 inline-flex items-center gap-2 rounded-kontrol border border-daun-500/30 bg-daun-500/10 px-3.5 py-1.5 text-xs font-semibold text-daun-700 dark:text-daun-300">
              <Building2 size={13} className="inline align-[-2px]" /> Untuk Kota
              & Permukiman Berkelanjutan · SDG 11
            </p>
            <h1 className="tampil-wonk text-tampil font-semibold">
              Masalah lingkungan di sekitarmu,{" "}
              <span className="text-daun-700 dark:text-daun-300">
                terpetakan.
              </span>{" "}
              <em className="font-light italic text-kunyit-800 dark:text-kunyit-400">
                Diselesaikan.
              </em>
            </h1>
            <p className="mt-6 max-w-lg text-badan text-muted teks-pretty">
              SIGAP menghubungkan warga dan pemerintah desa/kota lewat peta
              interaktif: laporkan sampah menumpuk, drainase macet, atau lampu
              jalan mati — lalu pantau penanganannya secara transparan.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/peta" className="group inline-flex">
                <span className="inline-flex items-center gap-3 rounded-kontrol bg-daun-600 py-2.5 pl-7 pr-2.5 text-base font-semibold text-white shadow-[0_1px_2px_rgb(23_67_42/0.2),0_8px_20px_-6px_rgb(23_67_42/0.4)] transition-[transform,background-color] duration-300 ease-sigap hover:bg-daun-700 active:scale-[0.98]">
                  Buka peta interaktif
                  <span className="flex size-8 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 ease-sigap group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                    <ArrowRight size={16} strokeWidth={2.2} />
                  </span>
                </span>
              </Link>
              <Link
                href="/daftar"
                className="rounded-kontrol border garis-halus bg-panel px-6 py-3 text-base font-semibold text-ink transition-[border-color,color] duration-300 ease-sigap hover:border-daun-400 hover:text-daun-700 dark:hover:text-daun-300"
              >
                Gabung jadi warga SIGAP
              </Link>
            </div>

            {/* Kalau database tak terjangkau, angka 0/0/0 akan berbohong tentang
                kota ini di elemen paling menonjol halaman. Lebih baik hilang. */}
            {dbHidup && (
              <dl className="mt-10 flex gap-10">
                {[
                  ["Laporan masuk", statistik.total],
                  ["Selesai ditangani", statistik.selesai],
                  ["Warga aktif", statistik.warga],
                ].map(([label, nilai]) => (
                  <div key={label as string}>
                    <dd className="angka-tabular font-display text-3xl font-extrabold text-daun-700 dark:text-daun-300">
                      <AngkaHidup nilai={nilai as number} />
                    </dd>
                    <dt className="mt-1 text-mikro font-semibold uppercase text-muted">
                      {label}
                    </dt>
                  </div>
                ))}
              </dl>
            )}
          </div>

          <Terungkap tunda={0.15}>
            <PetaHeroVisual />
          </Terungkap>
        </div>
      </section>

      {/* 01 — ritme vertikal sengaja tidak metronomik: py-24 empat kali
          berturut-turut adalah tanda halaman yang disusun mesin. */}
      <section className="mx-auto max-w-6xl px-4 py-28" aria-label="Cara kerja">
        <Terungkap>
          <PenandaSeksi nomor="01" nama="Cara kerja" />
          <h2 className="mt-4 max-w-xl text-judul font-semibold">
            Tiga langkah, satu lingkungan lebih baik
          </h2>
        </Terungkap>
        <div className="mt-14 space-y-14">
          {LANGKAH.map((l, i) => (
            <div
              key={l.nomor}
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
                  <span className="flex size-9 items-center justify-center rounded-item bg-daun-600/10 text-daun-700 dark:text-daun-300">
                    <l.ikon size={18} strokeWidth={1.8} />
                  </span>
                  {l.judul}
                </h3>
                <p className="mt-2 leading-relaxed text-muted teks-pretty">
                  {l.isi}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 02 — seksi padat, napasnya lebih pendek. */}
      <section
        className="border-y garis-halus bg-panel-2/60 py-16"
        aria-label="Kategori laporan"
      >
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <PenandaSeksi nomor="02" nama="Cakupan" />
              <h2 className="mt-4 text-judul font-semibold">
                Apa yang bisa dilaporkan?
              </h2>
            </div>
            <p className="max-w-sm text-sm text-muted teks-pretty">
              Enam kategori menampung hampir semua masalah permukiman sehari-hari
              — jumlahnya tumbuh seiring partisipasi warga.
            </p>
          </div>
          <div className="mt-10 flex flex-wrap gap-2.5">
            {KATEGORI.map((k) => (
              <span
                key={k.slug}
                className="flex items-center gap-2 rounded-kontrol bg-panel py-2.5 pl-4 pr-3 text-sm font-semibold shadow-kartu dark:border dark:garis-halus dark:shadow-none"
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
                <span className="angka-tabular rounded-kontrol bg-panel-2 px-2 py-0.5 text-xs text-muted">
                  {hitungKategori.get(k.slug) ?? 0}
                </span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 03 — bento, bukan lima kartu seragam. Lima kartu identik di grid tiga
          kolom menghasilkan baris yatim 3+2 dan tak satu pun memimpin. */}
      <section
        className="mx-auto max-w-6xl px-4 py-32"
        aria-label="Lebih dari sekadar lapor"
      >
        <Terungkap>
          <PenandaSeksi nomor="03" nama="Ekosistem" />
          <h2 className="mt-4 max-w-2xl text-judul font-semibold">
            Lebih dari sekadar kanal lapor.
          </h2>
        </Terungkap>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <Card
            interaktif
            className="flex flex-col justify-between overflow-hidden bg-daun-700 p-8 text-white md:col-span-2 dark:border-daun-600"
          >
            <div>
              <span className="flex size-11 items-center justify-center rounded-item bg-white/15">
                <Recycle size={22} strokeWidth={1.8} />
              </span>
              <h3 className="mt-5 font-serif text-3xl font-semibold tracking-tight text-white">
                Pasar ReUse
              </h3>
              <p className="mt-2 max-w-md leading-relaxed text-white/85 teks-pretty">
                Barang bekas layak pakai berpindah gratis antar-warga — sampah
                berkurang sebelum sempat jadi sampah, dan tetangga saling
                terhubung.
              </p>
            </div>
            <Link
              href="/pasar"
              className="group mt-8 inline-flex w-fit items-center gap-2 rounded-kontrol bg-white px-5 py-2.5 text-sm font-semibold text-daun-800 transition-transform duration-300 ease-sigap active:scale-[0.98]"
            >
              Cari barang
              <ArrowRight
                size={15}
                className="transition-transform duration-300 ease-sigap group-hover:translate-x-0.5"
              />
            </Link>
          </Card>

          {EKOSISTEM.map((k) => (
            <Card interaktif key={k.judul} className="flex h-full flex-col p-6">
              <span className="flex size-10 items-center justify-center rounded-item bg-panel-2 text-ink-2">
                <k.ikon size={18} strokeWidth={1.8} />
              </span>
              <h3 className="mt-3 font-bold">{k.judul}</h3>
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
                  className="transition-transform duration-300 ease-sigap group-hover:translate-x-0.5"
                />
              </Link>
            </Card>
          ))}
        </div>
      </section>

      {/* 04 */}
      <section className="mx-auto max-w-6xl px-4 py-20" aria-label="Mengapa penting">
        <div className="grid items-start gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <PenandaSeksi nomor="04" nama="Mengapa ini penting" />
            <h2 className="mt-4 text-judul font-semibold">
              Ini bukan sekadar aplikasi.
            </h2>
            <p className="mt-5 ukuran-baca leading-relaxed text-muted teks-pretty">
              Data SIPSN Kementerian Lingkungan Hidup mencatat timbulan sampah
              nasional mencapai{" "}
              <b className="text-ink">±33,79 juta ton pada 2024</b>, dan hanya
              sekitar sepertiga yang dikelola dengan baik. Mayoritas sisanya
              menumpuk persis di permukiman kita — di got, di tikungan, di tanah
              kosong.
            </p>
            <p className="mt-4 ukuran-baca leading-relaxed text-muted teks-pretty">
              Perubahan dimulai dari lingkungan terkecil: RT kita. SIGAP membuat
              setiap warga punya alat untuk memulainya hari ini.
            </p>
            <p className="mt-5 text-xs text-muted">
              Sumber: SIPSN KLHK 2024–2025 · BRIN (2025)
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:mt-14">
            {[
              ["33,79 jt", "ton sampah nasional 2024"],
              ["~32%", "yang dikelola dengan baik"],
              ["56,7%", "berasal dari rumah tangga"],
            ].map(([angka, label], i) => (
              <Card
                key={label}
                className={`flex h-full flex-col justify-between p-5 ${
                  i === 1 ? "sm:-translate-y-3" : i === 2 ? "sm:translate-y-2" : ""
                }`}
              >
                {/* Angka tidak diwarnai jingga: #FD9D24 hanya 1.9:1 terhadap
                    kertas. Jingga SDG jadi penanda grafis di bawahnya. */}
                <p className="angka-tabular font-serif text-3xl font-semibold text-ink">
                  {angka}
                </p>
                <span aria-hidden className="mt-3 block h-0.5 w-8 bg-kunyit-500" />
                <p className="mt-3 text-sm text-muted teks-pretty">{label}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Penutup — bukti, bukan janji yang diulang.
          Sebelumnya: kotak hijau + blob radial-gradient + judul tengah + satu
          tombol. Sekarang: laporan yang benar-benar sudah diselesaikan. */}
      <section className="mx-auto max-w-6xl px-4 pb-32" aria-label="Sudah selesai">
        <div className="flex flex-wrap items-end justify-between gap-4 border-t garis-halus pt-10">
          <div>
            <PenandaSeksi nomor="05" nama="Sudah beres" />
            <h2 className="mt-4 max-w-lg text-judul font-semibold">
              {baruSelesai.length > 0
                ? "Ini yang sudah selesai belakangan."
                : "Lingkunganmu menunggu laporan pertamamu."}
            </h2>
          </div>
          <Link
            href="/peta"
            className="group inline-flex items-center gap-2 rounded-kontrol bg-daun-600 px-6 py-3 text-base font-semibold text-white transition-[transform,background-color] duration-300 ease-sigap hover:bg-daun-700 active:scale-[0.98]"
          >
            Mulai jelajahi peta
            <ArrowRight
              size={16}
              strokeWidth={2.2}
              className="transition-transform duration-300 ease-sigap group-hover:translate-x-0.5"
            />
          </Link>
        </div>

        {baruSelesai.length > 0 ? (
          <ul className="mt-8 grid gap-4 sm:grid-cols-3">
            {baruSelesai.map((r) => (
              <li key={r.id}>
                <Link href={`/laporan/${r.id}`} className="group block h-full">
                  <Card interaktif className="h-full overflow-hidden">
                    {r.foto_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.foto_url}
                        alt=""
                        className="h-36 w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div
                        aria-hidden
                        className="flex h-36 w-full items-center justify-center bg-panel-2 text-muted"
                      >
                        <CheckCircle2 size={26} strokeWidth={1.6} />
                      </div>
                    )}
                    <div className="p-4">
                      <p className="flex items-center gap-1.5 text-mikro font-semibold uppercase text-daun-700 dark:text-daun-300">
                        <CheckCircle2 size={12} /> Selesai
                      </p>
                      <h3 className="mt-1.5 line-clamp-2 font-bold">{r.judul}</h3>
                      {r.alamat_teks && (
                        <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted">
                          <MapPin size={11} /> {r.alamat_teks}
                        </p>
                      )}
                    </div>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-6 ukuran-baca leading-relaxed text-muted teks-pretty">
            Butuh 30 detik untuk melapor. Dampaknya bisa bertahun-tahun
            dirasakan.
          </p>
        )}
      </section>
    </main>
  );
}
