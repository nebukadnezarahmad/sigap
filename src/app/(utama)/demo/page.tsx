import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Map,
  Scale,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import { KacaKartu } from "@/components/eksperimen/kaca";
import { PitaGradient } from "@/components/eksperimen/pita-gradient";
import { PilihanAkunDemo } from "@/components/tombol-demo-login";

export const metadata: Metadata = { title: "Panduan Demo Juri" };

const TUR = [
  {
    ikon: Map,
    judul: "Peta Interaktif & Pelaporan",
    isi: "16 titik laporan berkategori, marker clustering, filter status/kategori, garis waktu, mode gelap, dan geolokasi.",
    href: "/peta",
    label: "Buka peta",
  },
  {
    ikon: Scale,
    judul: "Transparansi Publik",
    isi: "Kinerja penanganan dewan: median waktu tuntas, SLA per kategori, insight otomatis, dan ekspor open data.",
    href: "/transparansi",
    label: "Lihat transparansi",
  },
  {
    ikon: Trophy,
    judul: "Gamifikasi & Partisipasi",
    isi: "Poin partisipasi warga (+10 lapor, +3 komentar, +1 vote), 10 badge pencapaian, 4 level warga, leaderboard realtime.",
    href: "/papan-skor",
    label: "Papan skor",
  },
  {
    ikon: ShieldCheck,
    judul: "Dashboard Dewan & Petugas",
    isi: "Pelacakan SLA penanganan, verifikasi bukti foto, penugasan petugas, bulk status update, dan sebaran heatmap.",
    href: "/dewan",
    label: "Dashboard dewan",
    khususAdmin: true,
  },
];

export default function HalamanDemo() {
  return (
    /* R-31: canvas putih Apple dominan di light dan tile netral ap-tile1 di dark agar tak muram-hijau; hero PitaGradient tetap sebagai identitas. */
    <main className="bg-white pb-12 text-ap-ink dark:bg-ap-tile1 dark:text-white">
      <PitaGradient tone="gelap">
        <header className="text-center">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-white">
            <ShieldCheck size={13} /> Khusus Dewan Juri & Penguji
          </p>
          <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight text-white">
            Panduan Demo Cepat SIGAP
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-white/85 teks-pretty">
            Pilih salah satu akun demo di bawah untuk masuk secara instan (1-klik).
            Jelajahi alur kolaborasi antara warga dan dewan pemerintah dalam menyelesaikan masalah permukiman.
          </p>
        </header>
      </PitaGradient>

      <div className="mx-auto max-w-4xl px-4 pt-10">

      <section aria-label="Pilih persona demo" className="mb-12">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Pilih persona</h2>
          <span className="text-xs text-muted dark:text-white/70">Tanpa perlu mendaftar</span>
        </div>
        <p className="mb-4 max-w-2xl text-sm leading-relaxed text-muted dark:text-white/70">
          Masuk sebagai warga atau dewan untuk mengikuti alur yang sesuai.
          Angka dan contoh pada panduan ini hanya berasal dari akun demo.
        </p>
        <PilihanAkunDemo />
      </section>

      <section aria-label="Urutan tugas demo" className="mb-12">
        <h2 className="mb-4 font-display text-lg font-bold">Urutan tugas</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {TUR.map((t) => (
            <KacaKartu key={t.judul} className="flex min-w-0 flex-col border-ap-hairline bg-ap-canvas p-5 dark:border-white/15 dark:bg-ap-tile2 dark:text-white">
              <span className="flex size-10 items-center justify-center rounded-lg bg-ap-blue/10 text-ap-blue dark:text-ap-sky">
                <t.ikon size={18} strokeWidth={1.8} />
              </span>
              <h3 className="mt-3 font-display font-bold">{t.judul}</h3>
              <p className="mt-1 flex-1 text-sm leading-relaxed text-muted dark:text-white/70">
                {t.isi}
              </p>
              <Link
                href={t.href}
                  className="group mt-4 inline-flex min-h-[44px] items-center gap-1.5 self-start rounded-full border border-ap-hairline bg-ap-canvas px-5 text-sm font-semibold text-ink transition-colors duration-300 hover:border-ap-blue hover:bg-ap-pearl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus dark:border-white/15 dark:bg-ap-tile1 dark:text-white dark:hover:bg-ap-tile2"
              >
                {t.label}
                <ArrowRight
                  size={14}
                  className="transition-transform group-hover:translate-x-0.5"
                />
                {t.khususAdmin && (
                  <span className="rounded-full bg-kunyit-500/15 px-2 py-0.5 text-[10px] font-bold text-kunyit-600 dark:text-kunyit-400">
                    perlu akun dewan
                  </span>
                )}
              </Link>
            </KacaKartu>
          ))}
        </div>
      </section>

      <section aria-label="Bukti dan hasil demo">
        <KacaKartu className="border-ap-hairline bg-ap-canvas p-6 dark:border-white/15 dark:bg-ap-tile2 dark:text-white">
          <h2 className="font-display font-bold text-base">Bukti dan hasil yang dapat diperiksa</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted dark:text-white/70">
            Gunakan checklist ini untuk mencatat bagian yang sudah kamu buka.
            Ini adalah daftar kemampuan pada lingkungan demo, bukan laporan produksi.
          </p>
          <ul className="mt-4 grid gap-x-6 gap-y-2 text-sm tabular-nums text-muted dark:text-white/70 sm:grid-cols-2">
            {[
              "Peta spasial PostGIS + Marker Cluster + Heatmap",
              "Lapor pin-drop presisi + multi-foto bukti",
              "Vote realtime & diskusi warga terintegrasi",
              "Notifikasi realtime perubahan status & tindak lanjut",
              "Gamifikasi: Poin otomatis (DB Trigger), Badge, & Level warga",
              "Laporan Saya: hak edit terkunci setelah verifikasi demi audit",
              "Dashboard Dewan: Penugasan petugas, SLA tracking, & Bulk update",
              "Transparansi Publik: Metrik kecepatan, SLA rasio, & Open Data",
              "Keamanan Tinggi: Row Level Security (RLS) & Cooldown anti-spam",
              "Desain Aksesibel: Reduksi gerakan (reduced-motion), Mode Gelap, & PWA",
            ].map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Check size={15} className="mt-0.5 shrink-0 text-daun-600 dark:text-daun-400" />
                {f}
              </li>
            ))}
          </ul>
        </KacaKartu>
      </section>
      </div>
    </main>
  );
}
