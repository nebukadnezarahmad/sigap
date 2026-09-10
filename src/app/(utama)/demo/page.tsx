import type { Metadata } from "next";
import Link from "next/link";
import {
  Check,
  ChevronRight,
  Map,
  Scale,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import { Card } from "@/components/ui";
import { PageHeader } from "@/components/layout-konten";
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
    <main className="mx-auto max-w-4xl px-4 py-10">
      <PageHeader
        tengah
        eyebrow="Untuk juri dan penguji"
        judul="Panduan demo"
        deskripsi="Masuk instan 1-klik dengan akun demo, lalu jelajahi alur kolaborasi warga dan dewan dalam menyelesaikan masalah permukiman."
      />

      <section aria-label="Akun demo instan" className="mb-10">
        <h2 className="mb-1 font-display text-xl font-bold">Akun demo siap pakai</h2>
        <p className="mb-3 text-sm text-muted">Masuk tanpa mendaftar.</p>
        <PilihanAkunDemo />
      </section>

      <section aria-label="Tur fitur" className="mb-10">
        <h2 className="mb-1 font-display text-xl font-bold">Alur pengujian</h2>
        <p className="mb-3 text-sm text-muted">Empat rute untuk kamu nilai.</p>
        <div className="rounded-[28px] bg-panel p-3 sm:p-4">
          <div className="flex flex-col gap-[7px]">
          {TUR.map((t) => (
            <Link
              key={t.judul}
              href={t.href}
              className="group flex min-h-[53px] items-center gap-3 rounded-[13px] bg-panel-2 px-3.5 py-2 transition hover:bg-line/60"
            >
              <span className="flex shrink-0 text-muted">
                <t.ikon size={20} strokeWidth={1.8} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium">
                  {t.judul}
                  {t.khususAdmin && (
                    <span className="ml-2 rounded-full bg-panel px-2 py-0.5 align-middle text-[10px] font-bold text-muted">
                      perlu akun dewan
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block truncate text-xs text-muted">
                  {t.isi}
                </span>
              </span>
              <ChevronRight
                size={16}
                className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5"
              />
              <span className="sr-only">{t.label}</span>
            </Link>
          ))}
          </div>
        </div>
      </section>

      <section aria-label="Checklist fitur">
        <h2 className="mb-1 font-display text-xl font-bold">Cakupan fitur</h2>
        <p className="mb-3 text-sm text-muted">Fungsional dan keamanan (SDG 11).</p>
        <Card className="rounded-[28px] p-6 sm:p-7">
          <ul className="grid gap-x-6 gap-y-2 text-sm text-muted sm:grid-cols-2">
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
        <Card className="rounded-[28px] p-6 sm:p-7">
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
