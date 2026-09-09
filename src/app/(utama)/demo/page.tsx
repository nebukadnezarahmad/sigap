import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Map,
  Scale,
  ShieldCheck,
  Sparkles,
  Trophy,
} from "lucide-react";
import { Card } from "@/components/ui";
import { PilihanAkunDemo } from "@/components/tombol-demo-login";

export const metadata: Metadata = { title: "Panduan Demo Juri" };

const TUR = [
  {
    ikon: Map,
    judul: "Peta Interaktif & Pelaporan",
    isi: "16 titik laporan berkategori, marker clustering, saringan status/kategori, garis waktu, mode gelap, dan geolokasi.",
    href: "/peta",
    label: "Buka peta",
  },
  {
    ikon: Scale,
    judul: "Transparansi Publik",
    isi: "Kinerja penanganan dewan: median waktu tuntas, batas waktu layanan (SLA) per kategori, insight otomatis, dan ekspor open data.",
    href: "/transparansi",
    label: "Lihat transparansi",
  },
  {
    ikon: Trophy,
    judul: "Gamifikasi & Partisipasi",
    isi: "Poin partisipasi warga (+10 lapor, +3 komentar, +1 vote), 10 lencana pencapaian, 4 level warga, papan peringkat langsung.",
    href: "/papan-skor",
    label: "Papan skor",
  },
  {
    ikon: ShieldCheck,
    judul: "Dashboard Dewan & Petugas",
    isi: "Pelacakan batas waktu penanganan, verifikasi bukti foto, penugasan petugas, bulk status update, dan sebaran peta panas.",
    href: "/dewan",
    label: "Dashboard dewan",
    khususAdmin: true,
  },
];

export default function HalamanDemo() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <header className="mb-10 text-center">
        <p className="inline-flex items-center gap-1.5 rounded-full border border-action/30 bg-action-soft px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-action">
          <Sparkles size={13} /> Khusus Dewan Juri & Penguji
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
          Panduan Demo Cepat SIGAP
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted teks-pretty">
          Pilih salah satu akun demo di bawah untuk masuk secara instan (1-klik).
          Jelajahi alur kolaborasi antara warga dan dewan pemerintah dalam menyelesaikan masalah permukiman.
        </p>
      </header>

      <section aria-label="Akun demo instan" className="mb-12">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Akun Demo Siap Pakai</h2>
          <span className="text-xs text-muted">Tanpa perlu mendaftar</span>
        </div>
        <PilihanAkunDemo />
      </section>

      <section aria-label="Tur fitur" className="mb-12">
        <h2 className="mb-4 font-display text-lg font-bold">Alur Pengujian Utama</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {TUR.map((t) => (
            <Card key={t.judul} className="flex flex-col p-5">
              <span className="flex size-10 items-center justify-center rounded-xl bg-action-soft text-action">
                <t.ikon size={18} strokeWidth={1.8} />
              </span>
              <h3 className="mt-3 font-display font-bold">{t.judul}</h3>
              <p className="mt-1 flex-1 text-sm leading-relaxed text-muted">
                {t.isi}
              </p>
              <Link
                href={t.href}
                className="group mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-action"
              >
                {t.label}
                <ArrowRight
                  size={14}
                  className="transition-transform group-hover:translate-x-0.5"
                />
                {t.khususAdmin && (
                  <span className="rounded-full bg-kunyit-500/15 px-2 py-0.5 text-[10px] font-bold text-kunyit-600">
                    perlu akun dewan
                  </span>
                )}
              </Link>
            </Card>
          ))}
        </div>
      </section>

      <section aria-label="Checklist fitur">
        <Card className="bg-panel-2/60 p-6">
          <h2 className="font-display font-bold text-base">Checklist Fungsional & Keamanan (SDG 11)</h2>
          <ul className="mt-4 grid gap-x-6 gap-y-2 text-sm text-muted sm:grid-cols-2">
            {[
              "Peta spasial PostGIS + Marker Cluster + Heatmap",
              "Lapor pin-drop presisi + multi-foto bukti",
              "Vote langsung & diskusi warga terintegrasi",
              "Notifikasi langsung perubahan status & tindak lanjut",
              "Gamifikasi: Poin otomatis (DB Trigger), Lencana, & Level warga",
              "Laporan Saya: hak edit terkunci setelah verifikasi demi audit",
              "Dasbor Dewan: Penugasan petugas, pelacakan batas waktu, & Bulk update",
              "Transparansi Publik: Metrik kecepatan, rasio batas waktu, & Open Data",
              "Keamanan Tinggi: Row Level Security (RLS) & Cooldown anti-spam",
              "Desain Aksesibel: Reduksi gerakan (reduced-motion), Mode Gelap, & PWA",
            ].map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Check size={15} className="mt-0.5 shrink-0 text-daun-600 dark:text-daun-400" />
                {f}
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section aria-label="Glosarium istilah" className="mt-6">
        <Card className="p-6">
          <h2 className="font-display font-bold text-base">Glosarium singkat</h2>
          <dl className="mt-3 space-y-2.5 text-sm">
            <div>
              <dt className="font-semibold">SLA (batas waktu layanan)</dt>
              <dd className="text-muted">Target hari penyelesaian per kategori laporan yang mengikat dewan.</dd>
            </div>
            <div>
              <dt className="font-semibold">RLS (Row Level Security)</dt>
              <dd className="text-muted">Aturan keamanan basis data: warga hanya bisa membaca/menulis datanya sendiri.</dd>
            </div>
            <div>
              <dt className="font-semibold">Peta panas (heatmap)</dt>
              <dd className="text-muted">Sebaran kepadatan laporan di peta dewan; warna pekat berarti banyak laporan.</dd>
            </div>
            <div>
              <dt className="font-semibold">Lencana & poin</dt>
              <dd className="text-muted">Apresiasi partisipasi: melapor +10, komentar +3, mendukung +1.</dd>
            </div>
          </dl>
        </Card>
      </section>
    </main>
  );
}
