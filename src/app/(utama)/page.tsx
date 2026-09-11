import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, ChevronRight, MapPin, ScanLine, ShieldCheck, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { KATEGORI } from "@/lib/constants";
import type { LaporanDenganRelasi } from "@/types/database";
import { IkonKategori } from "@/lib/ikon-vektor";
import { AngkaHidup, PetaHeroVisual, Terungkap, type ModePetaHero } from "./landing-visual";
import { PixelGrid } from "@/components/pixel-grid";
import {
  PanggungPetaScroll,
  SorotTeksScroll,
  GaleriBuktiScroll,
} from "./scroll-animations";
import styles from "./beranda.module.css";

export const dynamic = "force-dynamic";

const LANGKAH = [
  { nomor: "01", ikon: MapPin, judul: "Lihat. Tandai. Laporkan.", isi: "Pilih titik di peta, tambahkan foto, dan ceritakan masalah yang kamu temui." },
  { nomor: "02", ikon: Users, judul: "Bergerak bersama.", isi: "Warga memberi dukungan. Dewan memverifikasi dan menugaskan penanganan." },
  { nomor: "03", ikon: ShieldCheck, judul: "Selesai, dengan bukti.", isi: "Foto penanganan dan konfirmasi warga melengkapi perjalanan setiap laporan." },
];

export default async function Beranda() {
  let statistik = { total: 0, selesai: 0, warga: 0 };
  let statistikGagal = false;
  let kategoriGagal = false;
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
  let modePeta: ModePetaHero = "demo";

  try {
    const supabase = await createClient();
    if (supabase) {
      modePeta = "live";
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
      kategoriGagal = Boolean(perKategori.error);
      const petaGagal = Boolean(laporanPeta.error);
      modePeta = petaGagal ? "galat" : "live";
      hitungKategori = new Map();
      for (const r of (perKategori.data ?? []) as unknown as LaporanDenganRelasi[]) {
        const slug = r.categories?.slug ?? "lainnya";
        hitungKategori.set(slug, (hitungKategori.get(slug) ?? 0) + 1);
      }
      // Mode demo (titik contoh di PetaHeroVisual) hanya sah bila TIDAK
      // ada error: kegagalan kueri bukan "data kosong".
      if (!petaGagal && laporanPeta.data && laporanPeta.data.length > 0) {
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
      kategoriGagal = true;
    }
  } catch {
    statistikGagal = true;
    kategoriGagal = true;
    modePeta = "galat";
  }

  return (
    <main className={styles.home}>
      <section className={styles.hero} aria-labelledby="judul-beranda">
        <PixelGrid cellSize={42} speed={0.3} />
        <div className={styles.heroCopy}>
          <Link href="/demo" className={styles.introLink}>
            <span className={styles.introDot} aria-hidden="true" />
            Kenali SIGAP. Mulai dari sekitarmu.
            <ChevronRight size={14} aria-hidden="true" />
          </Link>
          <h1 id="judul-beranda" className={styles.heroTitle}>
            Lingkungan lebih baik.<br />
            <span>Dimulai dari kamu.</span>
          </h1>
          <p className={styles.heroDescription}>
            Satu tempat untuk melapor, saling mendukung, dan melihat perubahan.
            Dari titik di peta, sampai masalah benar-benar selesai.
          </p>
          <div className={styles.actions}>
            <Link href="/peta" className={styles.primaryLink}>
              Jelajahi peta <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
            <Link href="/demo" className={styles.secondaryLink}>
              Lihat cara kerjanya <ChevronRight size={17} aria-hidden="true" />
            </Link>
          </div>
          <p className={styles.heroNote}>Terbuka untuk dilihat. Mudah untuk ikut peduli.</p>
        </div>
        <div className={styles.productStage}>
          <PanggungPetaScroll>
            <PetaHeroVisual awalTitik={titikAwal} modeAwal={modePeta} />
          </PanggungPetaScroll>
        </div>
      </section>

      <section className={styles.proof} aria-label="Aktivitas SIGAP">
        <p>Setiap laporan punya arti.<br /><span>Ini yang sudah tercatat di SIGAP.</span></p>
        <dl className={styles.stats}>
          {[
            { label: "laporan masuk", nilai: statistik.total },
            { label: "selesai ditangani", nilai: statistik.selesai },
            { label: "warga terdaftar", nilai: statistik.warga },
          ].map(({ label, nilai }) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{statistikGagal ? <span aria-label="Data belum tersedia">—</span> : <AngkaHidup nilai={nilai} />}</dd>
            </div>
          ))}
        </dl>
        {statistikGagal && <p className={styles.dataNote}>Statistik belum dapat dimuat.</p>}
      </section>

      <section className={styles.journey} aria-labelledby="judul-alur">
        <Terungkap>
          <div className={styles.sectionHeading}>
            <p className={styles.kicker}>Dari laporan menjadi perubahan</p>
            <h2 id="judul-alur">Kecil langkahnya.<br /><span>Terasa dampaknya.</span></h2>
            <SorotTeksScroll
              teks="Masalah di sekitar kita layak mendapat perhatian. Dari laporan warga, verifikasi dewan, hingga foto pembuktian tuntas, SIGAP membuat prosesnya terlihat dari awal sampai akhir."
              className="mt-6 text-sm text-muted leading-relaxed"
            />
          </div>
          <div className={styles.steps}>
            {LANGKAH.map(({ nomor, ikon: Ikon, judul, isi }) => (
              <article key={nomor} className={styles.step}>
                <div className={styles.stepTop}><Ikon size={27} strokeWidth={1.5} aria-hidden="true" /><span>{nomor}</span></div>
                <h3>{judul}</h3><p>{isi}</p>
              </article>
            ))}
          </div>
        </Terungkap>
      </section>

      <section className={styles.features} aria-labelledby="judul-fitur">
        <div className={styles.featureIntro}>
          <div><p className={styles.kicker}>Lebih dekat. Lebih jelas.</p><h2 id="judul-fitur">Kepedulian, bertemu tindakan.</h2></div>
          <Link href="/peta" className={styles.secondaryLink}>Temukan di sekitarmu <ArrowUpRight size={18} aria-hidden="true" /></Link>
        </div>
        <div className={styles.featureGrid}>
          <Terungkap className={styles.featureLarge}>
            <div className={styles.featureText}>
              <span className={styles.featureIcon}><MapPin size={24} strokeWidth={1.5} aria-hidden="true" /></span>
              <h3>Masalahnya dekat.<br />Solusinya dimulai di sini.</h3>
              <p>Dari sampah menumpuk hingga lampu jalan mati. Temukan laporan berdasarkan kategori dan lokasi di peta.</p>
            </div>
            <div className={styles.categories}>
              {KATEGORI.map((k) => (
                <div key={k.slug} className={styles.category}>
                  <span className={styles.categoryIcon}><IkonKategori slug={k.slug} ukuran={21} /></span>
                  <span>{k.nama}</span>
                  <span className={styles.categoryCount}>{kategoriGagal ? "—" : (hitungKategori.get(k.slug) ?? 0).toLocaleString("id-ID")}</span>
                </div>
              ))}
            </div>
            <Link href="/peta" className={styles.featureLink}>Buka peta laporan <ArrowRight size={18} aria-hidden="true" /></Link>
          </Terungkap>
          <Terungkap className={styles.featureSmall} tunda={0.08}>
            <span className={styles.featureIcon}><ScanLine size={24} strokeWidth={1.5} aria-hidden="true" /></span>
            <h3>Setiap status<br />ada buktinya.</h3>
            <p>Penanganan menyertakan foto bukti. Status selesai membutuhkan konfirmasi warga.</p>
            <div className={styles.verification}>
              <span className={styles.checkIcon}><Check size={26} aria-hidden="true" /></span>
              <div><strong>Bukti yang bisa dilihat.</strong><span>Proses yang bisa diikuti.</span></div>
            </div>
            <Link href="/laporan-saya" className={styles.featureLink}>Ikuti laporanmu <ArrowRight size={18} aria-hidden="true" /></Link>
          </Terungkap>
          <Terungkap className={styles.featureSmall} tunda={0.12}>
            <span className={styles.featureIcon}><ShieldCheck size={24} strokeWidth={1.5} aria-hidden="true" /></span>
            <h3>Terbuka untuk<br />semua warga.</h3>
            <p>Lihat target penanganan, laporan yang terlambat, dan hasil kerja dewan dalam satu halaman transparansi.</p>
            <Link href="/transparansi" className={styles.featureLink}>Lihat transparansi <ArrowRight size={18} aria-hidden="true" /></Link>
          </Terungkap>
        </div>
      </section>

      <section className={styles.community} aria-labelledby="judul-komunitas">
        <div className={styles.communityPhoto}>
          <Image src="/images/lingkungan-permukiman.jpg" alt="Suasana jalan permukiman dengan pepohonan, rumah, dan aktivitas warga" fill sizes="(max-width: 760px) 100vw, 55vw" className="object-cover" />
          <span className={styles.photoCaption}>Lingkungan yang kita rawat bersama.</span>
        </div>
        <div className={styles.communityCopy}>
          <p className={styles.kicker}>Rumah. Jalan. Lingkungan kita.</p>
          <h2>Tempat tinggal.<br /><span>Tempat kita peduli.</span></h2>
          <SorotTeksScroll
            teks="Jalan yang kita lewati setiap hari. Saluran air di depan rumah. Ruang hijau tempat anak bermain. Semua berawal dari perhatian orang-orang di sekitarnya."
            className="mt-5 text-sm text-muted leading-relaxed"
          />
          <Link href="/papan-skor" className={styles.secondaryLink}>Kenali kontribusi warga <ArrowUpRight size={18} aria-hidden="true" /></Link>
          <span className={styles.sdg}><span aria-hidden="true">11</span> Kota dan permukiman berkelanjutan</span>
        </div>
      </section>

      <GaleriBuktiScroll />

      <section className={styles.closing} aria-labelledby="judul-mulai">
        <span className={styles.appIcon}><MapPin size={37} strokeWidth={1.6} aria-hidden="true" /></span>
        <h2 id="judul-mulai">Ada yang perlu<br /><span>kita bereskan?</span></h2>
        <p>Mulai dari satu titik. Mulai dari lingkunganmu.</p>
        <div className={styles.actions}>
          <Link href="/peta?lapor=1" className={styles.primaryLink}>Buat laporan <ArrowUpRight size={18} aria-hidden="true" /></Link>
          <Link href="/daftar" className={styles.secondaryLink}>Bergabung sebagai warga <ChevronRight size={17} aria-hidden="true" /></Link>
        </div>
      </section>
    </main>
  );
}
