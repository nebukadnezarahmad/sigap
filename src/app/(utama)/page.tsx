import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Building2, MapPin, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { KATEGORI } from "@/lib/constants";
import type { LaporanDenganRelasi } from "@/types/database";
import { IkonKategori } from "@/lib/ikon-vektor";
import { PetaHeroVisual, Terungkap } from "./landing-visual";

export const dynamic = "force-dynamic";

/* Grammar Apple DESIGN.md (FUSI): tile full-bleed bergantian
   putih, parchment, gelap, radius 0, tanpa shadow kecuali foto produk.
   Display tetap Fraunces/serif; headline tile 40px/600/tight; body 17px. */
const H2_TILE =
  "mt-2 font-serif text-[40px] font-semibold leading-[1.1] tracking-[-0.28px]";
const EYEBROW_LIGHT = "text-sm font-semibold text-ap-blue";
const BODY_TILE = "text-[17px] leading-[1.47] tracking-[-0.374px]";
const FOKUS_APPLE =
  "focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus!";

export default async function Beranda() {
  let statistik = { total: 0, selesai: 0, warga: 0 };
  let statistikGagal = false;
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
      if (laporan.error || selesai.error || warga.error) {
        statistikGagal = true;
      }
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
    } else {
      statistikGagal = true;
    }
  } catch {
    statistikGagal = true;
  }

  return (
    <main>
      <style>{`
        /* R-03: use the compact navigation before the header's desktop row clips. */
        @media (min-width: 768px) and (max-width: 833px) {
          header nav[aria-label="Utama"] {
            display: none;
          }

          header button[aria-controls="navigasi-seluler"] {
            display: flex;
          }
        }
      `}</style>
      <section className="bg-white text-ap-ink" aria-labelledby="judul-utama">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:py-16 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16 lg:py-20">
          <div className="max-w-xl">
            <p className={EYEBROW_LIGHT}>Peta laporan warga</p>
            <h1
              id="judul-utama"
              className="mt-3 max-w-lg font-serif text-[clamp(2.75rem,5vw,3.5rem)] font-semibold leading-[1.06] tracking-[-0.28px]"
            >
              Masalah lingkungan di sekitarmu, {" "}
              <span className="text-ap-blue">terlihat di peta.</span>
            </h1>
            <p className={`mt-6 max-w-lg text-ap-ink/70 ${BODY_TILE}`}>
              Pilih titik di sekitarmu untuk membaca kategori, status, dan
              catatan penanganan yang tersedia.
            </p>
            <Link
              href="/peta"
              className={`group mt-8 inline-flex min-h-[44px] items-center rounded-full ${FOKUS_APPLE}`}
            >
              <span className="inline-flex min-h-[44px] items-center gap-3 rounded-full bg-ap-blue py-[11px] pl-[22px] pr-[11px] text-[17px] font-semibold text-white transition active:scale-[0.95] hover:bg-ap-blue-focus">
                Buka peta laporan
                <span className="flex size-8 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none">
                  <ArrowRight size={16} strokeWidth={2.2} />
                </span>
              </span>
            </Link>
          </div>

          <Terungkap tunda={0.15}>
            <PetaHeroVisual awalTitik={titikAwal} />
          </Terungkap>
        </div>
      </section>

      <section
        className="bg-ap-parchment text-ap-ink"
        aria-labelledby="judul-bukti"
      >
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <div className="grid gap-12 lg:grid-cols-[0.86fr_1.14fr] lg:gap-20">
            <Terungkap>
              <p className={EYEBROW_LIGHT}>Laporan yang bisa diikuti</p>
              <h2 id="judul-bukti" className={`${H2_TILE} max-w-xl`}>
                Dari laporan ke bukti
              </h2>
              <p className={`mt-4 max-w-xl text-ap-ink/70 ${BODY_TILE}`}>
                Satu titik memberi konteks awal. Detail laporan menyatukan
                lokasi, kategori, dan status agar penanganannya mudah diikuti.
              </p>
              <figure className="relative mt-8 aspect-[4/3] w-full overflow-hidden rounded-[18px] shadow-ap-shadow">
                <Image
                  src="/images/gotong-royong.jpg"
                  alt="Warga bekerja bersama di lingkungan permukiman"
                  fill
                  sizes="(max-width:1024px)100vw,40vw"
                  className="object-cover"
                />
              </figure>
            </Terungkap>

            <Terungkap tunda={0.1}>
              <div className="border-t border-ap-hairline">
                <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-ap-hairline py-4">
                  <h3 className="font-display text-lg font-bold text-ap-ink">
                    Kategori laporan
                  </h3>
                  <p className="text-sm text-ap-ink-muted">
                    {statistikGagal
                      ? "Data tidak tersedia"
                      : `${statistik.total.toLocaleString("id-ID")} laporan tercatat`}
                  </p>
                </div>
                <ul className="grid gap-x-8 sm:grid-cols-2">
                  {KATEGORI.map((kategori) => (
                    <li
                      key={kategori.slug}
                      className="flex min-w-0 items-center justify-between gap-4 border-b border-ap-hairline py-5"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span
                          aria-hidden
                          className="flex size-8 shrink-0 items-center justify-center rounded-lg"
                          style={{
                            backgroundColor: `${kategori.warna}20`,
                            color: kategori.warna,
                          }}
                        >
                          <IkonKategori slug={kategori.slug} ukuran={15} />
                        </span>
                        <span className="min-w-0 break-words text-sm font-semibold text-ap-ink">
                          {kategori.nama}
                        </span>
                      </span>
                      <span className="shrink-0 font-serif text-2xl font-semibold tabular-nums text-ap-ink">
                        {statistikGagal
                          ? "-"
                          : (hitungKategori.get(kategori.slug) ?? 0)}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-xs leading-relaxed text-ap-ink-muted">
                  Hitungan mengikuti laporan yang tersedia di SIGAP.
                </p>
              </div>
            </Terungkap>
          </div>
        </div>
      </section>

      <section className="bg-white text-ap-ink" aria-labelledby="judul-peran">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <Terungkap>
            <p className={EYEBROW_LIGHT}>Ruang kerja SIGAP</p>
            <h2 id="judul-peran" className={`${H2_TILE} max-w-2xl`}>
              Satu laporan, dilihat dari peran yang berbeda
            </h2>
            <p className={`mt-4 max-w-2xl text-ap-ink/70 ${BODY_TILE}`}>
              Warga menemukan laporan. Pelapor mengikuti miliknya. Dewan
              melihat antrean yang perlu ditindaklanjuti.
            </p>
          </Terungkap>

          <div className="mt-12 space-y-6">
            <Terungkap>
              <article className="grid overflow-hidden rounded-[18px] border border-ap-hairline bg-ap-parchment lg:grid-cols-[1.08fr_0.92fr]">
                <div className="relative min-h-64 lg:min-h-80">
                  <Image
                    src="/images/lingkungan-permukiman.jpg"
                    alt="Kawasan permukiman kota hijau"
                    fill
                    sizes="(max-width:1024px)100vw,55vw"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col justify-between gap-8 p-6 sm:p-8 lg:p-10">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-semibold text-ap-blue">
                      <MapPin size={15} aria-hidden /> Warga sekitar
                    </p>
                    <h3 className="mt-3 font-serif text-3xl font-semibold leading-tight tracking-[-0.2px]">
                      Mulai dari lokasi yang kamu lihat
                    </h3>
                    <p className="mt-3 text-base leading-relaxed text-ap-ink/70">
                      Buka peta untuk melihat laporan di sekitar dan membaca
                      detail titik yang ingin kamu ikuti.
                    </p>
                  </div>
                  <Link
                    href="/peta"
                    className={`inline-flex min-h-[44px] items-center gap-2 text-[17px] font-semibold text-ap-blue ${FOKUS_APPLE}`}
                  >
                    Lihat laporan di peta <ArrowRight size={15} />
                  </Link>
                </div>
              </article>
            </Terungkap>

            <Terungkap tunda={0.1}>
              <article className="grid overflow-hidden rounded-[18px] border border-ap-hairline bg-white lg:grid-cols-[0.92fr_1.08fr]">
                <div className="order-2 relative min-h-64 lg:order-1 lg:min-h-80">
                  <Image
                    src="/images/gotong-royong.jpg"
                    alt="Warga bekerja bersama di ruang terbuka"
                    fill
                    sizes="(max-width:1024px)100vw,48vw"
                    className="object-cover"
                  />
                </div>
                <div className="order-1 flex flex-col justify-between gap-8 p-6 sm:p-8 lg:order-2 lg:p-10">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-semibold text-ap-blue">
                      <Users size={15} aria-hidden /> Pelapor
                    </p>
                    <h3 className="mt-3 max-w-xl font-serif text-3xl font-semibold leading-tight tracking-[-0.2px]">
                      Simpan jejak laporanmu
                    </h3>
                    <p className="mt-3 max-w-xl text-base leading-relaxed text-ap-ink/70">
                      Halaman laporan saya membantu kamu kembali ke titik yang
                      pernah dibuat dan melihat status terakhirnya.
                    </p>
                  </div>
                  <Link
                    href="/laporan-saya"
                    className={`inline-flex min-h-[44px] items-center gap-2 text-[17px] font-semibold text-ap-blue ${FOKUS_APPLE}`}
                  >
                    Buka laporan saya <ArrowRight size={15} />
                  </Link>
                </div>
              </article>
            </Terungkap>

            <Terungkap tunda={0.2}>
              <article className="grid overflow-hidden rounded-[18px] bg-ap-tile1 text-white lg:grid-cols-[1.02fr_0.98fr]">
                <div className="flex flex-col justify-between gap-8 p-6 sm:p-8 lg:p-10">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-semibold text-ap-sky">
                      <Building2 size={15} aria-hidden /> Dewan
                    </p>
                    <h3 className="mt-3 font-serif text-3xl font-semibold leading-tight tracking-[-0.2px]">
                      Pantau laporan dari satu ruang kerja
                    </h3>
                    <p className="mt-3 text-base leading-relaxed text-white/75">
                      Dashboard dewan menampilkan laporan yang masuk beserta
                      statusnya sesuai akses akun.
                    </p>
                  </div>
                  <Link
                    href="/dewan"
                    className="inline-flex min-h-[44px] items-center gap-2 text-[17px] font-semibold text-ap-sky focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-sky"
                  >
                    Buka ruang dewan <ArrowRight size={15} />
                  </Link>
                </div>
                <div className="relative min-h-64 lg:min-h-80">
                  <Image
                    src="/images/kota-sdg11.jpg"
                    alt="Koridor transportasi dan ruang hijau perkotaan"
                    fill
                    sizes="(max-width:1024px)100vw,50vw"
                    className="object-cover"
                  />
                </div>
              </article>
            </Terungkap>
          </div>
        </div>
      </section>

      <section className="bg-ap-tile2 text-white" aria-labelledby="judul-aksi">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <Terungkap>
            <p className="text-sm font-semibold text-ap-sky">Mulai di sekitar</p>
            <h2 id="judul-aksi" className={`${H2_TILE} max-w-2xl`}>
              Satu titik cukup untuk memulai.
            </h2>
            <p className={`mt-4 max-w-xl text-white/75 ${BODY_TILE}`}>
              Buka peta dan pilih laporan yang ingin kamu pahami lebih jauh.
            </p>
            <Link
              href="/peta"
              className="group mt-8 inline-flex min-h-[44px] items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-sky"
            >
              <span className="inline-flex min-h-[44px] items-center gap-3 rounded-full bg-ap-blue py-[14px] pl-7 pr-[14px] text-[17px] font-semibold text-white transition active:scale-[0.95] hover:bg-ap-blue-focus">
                Buka peta laporan
                <span className="flex size-8 items-center justify-center rounded-full bg-white/15 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none">
                  <ArrowRight size={16} strokeWidth={2.2} />
                </span>
              </span>
            </Link>
          </Terungkap>
        </div>
      </section>
    </main>
  );
}
