import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { KATEGORI } from "@/lib/constants";
import { Button, Card } from "@/components/ui";
import { AngkaHidup, PetaHeroVisual } from "./landing-visual";

export const dynamic = "force-dynamic";

const LANGKAH = [
  {
    emoji: "📍",
    judul: "Lapor dalam 30 detik",
    isi: "Klik titik di peta, tempel foto, pilih kategori. Selesai.",
  },
  {
    emoji: "📣",
    judul: "Warga serentak mendukung",
    isi: "Setiap dukungan & komentar menaikkan prioritas laporan di mata dewan.",
  },
  {
    emoji: "✅",
    judul: "Ditindaklanjuti transparan",
    isi: "Status berubah terlihat semua orang: baru → diverifikasi → dikerjakan → selesai.",
  },
];

export default async function Beranda() {
  let statistik = { total: 0, selesai: 0, warga: 0 };
  try {
    const supabase = await createClient();
    if (supabase) {
      const [laporan, selesai, warga] = await Promise.all([
        supabase.from("reports").select("id", { count: "exact", head: true }),
        supabase
          .from("reports")
          .select("id", { count: "exact", head: true })
          .eq("status", "selesai"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);
      statistik = {
        total: laporan.count ?? 0,
        selesai: selesai.count ?? 0,
        warga: warga.count ?? 0,
      };
    }
  } catch {
    /* fallback nol */
  }

  return (
    <main>
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_70%_10%,rgba(46,158,87,0.12),transparent)]"
        />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-14 pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:pt-20">
          <div className="animate-muncul">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-daun-500/30 bg-daun-500/10 px-3.5 py-1.5 text-xs font-semibold text-daun-700 dark:text-daun-300">
              🏙️ Untuk Kota & Permukiman Berkelanjutan · SDG 11
            </p>
            <h1 className="font-display text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl">
              Masalah lingkungan di sekitarmu,{" "}
              <span className="text-daun-600 dark:text-daun-400">terpetakan.</span>{" "}
              <span className="text-kunyit-500">Diselesaikan.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted">
              SIGAP menghubungkan warga dan pemerintah desa/kota lewat peta
              interaktif: laporkan sampah menumpuk, drainase macet, atau lampu
              jalan mati — lalu pantau penanganannya secara transparan.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/peta">
                <Button size="lg">
                  Buka peta interaktif <ArrowRight size={18} />
                </Button>
              </Link>
              <Link href="/daftar">
                <Button size="lg" variant="sekunder">
                  Gabung jadi warga SIGAP
                </Button>
              </Link>
            </div>
            <dl className="mt-9 flex gap-8">
              {[
                ["Laporan masuk", statistik.total],
                ["Selesai ditangani", statistik.selesai],
                ["Warga aktif", statistik.warga],
              ].map(([label, nilai]) => (
                <div key={label as string}>
                  <dd className="font-display text-2xl font-extrabold text-daun-700 dark:text-daun-300 sm:text-3xl">
                    <AngkaHidup nilai={nilai as number} />
                  </dd>
                  <dt className="mt-0.5 text-xs font-medium uppercase tracking-wide text-muted">
                    {label}
                  </dt>
                </div>
              ))}
            </dl>
          </div>

          <PetaHeroVisual />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16" aria-label="Cara kerja">
        <h2 className="text-center font-display text-3xl font-bold">
          Tiga langkah, satu lingkungan lebih baik
        </h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {LANGKAH.map((l, i) => (
            <Card key={l.judul} className="relative overflow-hidden p-6">
              <span
                aria-hidden
                className="absolute -right-3 -top-5 font-display text-[92px] font-extrabold leading-none text-daun-600/8 dark:text-daun-300/8"
              >
                {i + 1}
              </span>
              <span className="text-3xl">{l.emoji}</span>
              <h3 className="mt-3 font-display text-lg font-bold">{l.judul}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{l.isi}</p>
            </Card>
          ))}
        </div>
      </section>

      <section
        className="border-y garis-halus bg-panel-2/60 py-16"
        aria-label="Kategori laporan"
      >
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="font-display text-3xl font-bold">Apa yang bisa dilaporkan?</h2>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {KATEGORI.map((k) => (
              <Card
                key={k.slug}
                className="flex flex-col items-center gap-2 px-3 py-5 text-center transition hover:-translate-y-1 hover:shadow-md"
              >
                <span
                  className="flex size-11 items-center justify-center rounded-full text-xl"
                  style={{ backgroundColor: `${k.warna}22` }}
                  role="img"
                  aria-label={k.nama}
                >
                  {k.emoji}
                </span>
                <p className="text-sm font-semibold leading-tight">{k.nama}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16" aria-label="Mengapa penting">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-bold">
              Ini bukan sekadar aplikasi.
            </h2>
            <p className="mt-4 leading-relaxed text-muted">
              Data SIPSN Kementerian Lingkungan Hidup mencatat timbulan sampah
              nasional mencapai{" "}
              <b className="text-ink">±33,79 juta ton pada 2024</b>, dan hanya
              sekitar sepertiga yang dikelola dengan baik. Mayoritas sisanya
              menumpuk persis di permukiman kita — di got, di tikungan, di
              tanah kosong.
            </p>
            <p className="mt-3 leading-relaxed text-muted">
              Perubahan dimulai dari lingkungan terkecil: RT kita. SIGAP membuat
              setiap warga punya alat untuk memulainya hari ini.
            </p>
            <p className="mt-4 text-xs text-muted">
              Sumber: SIPSN KLHK 2024–2025 · BRIN (2025)
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["33,79 jt", "ton sampah nasional 2024"],
              ["~32%", "yang dikelola dengan baik"],
              ["56,7%", "berasal dari rumah tangga"],
            ].map(([angka, label]) => (
              <Card key={label} className="flex flex-col justify-between p-5">
                <p className="font-display text-3xl font-extrabold text-kunyit-500">
                  {angka}
                </p>
                <p className="mt-2 text-sm text-muted">{label}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <Card className="relative overflow-hidden border-none bg-daun-700 p-10 text-center text-white sm:p-14">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_60%_at_50%_120%,rgba(255,255,255,0.18),transparent)]"
          />
          <MapPin size={30} className="mx-auto mb-4 opacity-90" />
          <h2 className="font-display text-3xl font-bold">
            Lingkunganmu menunggu laporan pertamamu.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/85">
            Butuh 30 detik untuk melapor. Dampaknya bisa bertahun-tahun dirasakan.
          </p>
          <Link href="/peta" className="mt-7 inline-block">
            <Button size="lg" variant="sekunder" className="!bg-white !text-daun-800 hover:!bg-daun-50 !border-transparent">
              Mulai jelajahi peta <ArrowRight size={18} />
            </Button>
          </Link>
        </Card>
      </section>
    </main>
  );
}
