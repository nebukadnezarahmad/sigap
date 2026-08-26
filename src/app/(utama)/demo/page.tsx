import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Crown,
  Map,
  Scale,
  ShieldCheck,
  Trophy,
  UserRound,
} from "lucide-react";
import { Card } from "@/components/ui";
import { SalinAkun } from "./salin-akun";

export const metadata: Metadata = { title: "Panduan Demo" };

const AKUN = [
  {
    peran: "Dewan (admin)",
    email: "dewan@sigap.demo",
    bisa: "Kelola status, tugaskan petugas, dashboard statistik & heatmap",
    admin: true,
  },
  {
    peran: "Warga aktif",
    email: "budi@sigap.demo",
    bisa: "Semua fitur warga — poin 34, badge, riwayat laporan",
    admin: false,
  },
  {
    peran: "Warga baru",
    email: "rafa@sigap.demo",
    bisa: "Cocok untuk mencoba alur lapor dari awal",
    admin: false,
  },
];

const TUR = [
  {
    ikon: Map,
    judul: "Peta interaktif",
    isi: "16 pin berkategori, filter dropdown, garis waktu 6 bulan, mode gelap, geolokasi.",
    href: "/peta",
    label: "Buka peta",
  },
  {
    ikon: Scale,
    judul: "Transparansi",
    isi: "Kinerja dewan dalam angka: median penyelesaian, tingkat tuntas per kategori, insight otomatis.",
    href: "/transparansi",
    label: "Lihat data",
  },
  {
    ikon: Trophy,
    judul: "Gamifikasi",
    isi: "Poin partisipasi, 6 badge, 4 level warga, leaderboard realtime.",
    href: "/papan-skor",
    label: "Papan skor",
  },
  {
    ikon: ShieldCheck,
    judul: "Dashboard dewan",
    isi: "SLA 7 hari, penugasan petugas, bulk action, heatmap, ekspor CSV.",
    href: "/dewan",
    label: "Masuk dewan",
    khususAdmin: true,
  },
];

export default function HalamanDemo() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <header className="mb-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-daun-600 dark:text-daun-400">
          Untuk dewan juri
        </p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight">
          Panduan demo SIGAP
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted teks-pretty">
          Semua akun di bawah sudah berisi data contoh yang realistis. Gunakan
          salah satu, jelajahi alurnya, dan lihat bagaimana warga serta dewan
          bekerja sama di satu peta.
        </p>
      </header>

      <section aria-label="Akun demo" className="mb-12 space-y-3">
        {AKUN.map((a) => (
          <Card key={a.email} className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <span
                  className={`flex size-10 items-center justify-center rounded-xl ${
                    a.admin
                      ? "bg-kunyit-500/15 text-kunyit-600"
                      : "bg-daun-600/10 text-daun-700 dark:text-daun-300"
                  }`}
                >
                  {a.admin ? <Crown size={18} /> : <UserRound size={18} />}
                </span>
                <div>
                  <p className="font-display font-bold">
                    {a.peran}
                    {a.admin && (
                      <span className="ml-2 rounded-full bg-kunyit-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-kunyit-600">
                        Akses penuh
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-sm text-muted">{a.bisa}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <code className="rounded-lg bg-panel-2 px-3 py-1.5 text-xs font-semibold">
                  {a.email}
                </code>
                <SalinAkun email={a.email} />
              </div>
            </div>
          </Card>
        ))}
        <p className="text-center text-xs text-muted">
          Kata sandi semua akun:{" "}
          <SalinAkun sandi /> — login di{" "}
          <Link href="/masuk" className="font-semibold text-daun-700 hover:underline dark:text-daun-300">
            /masuk
          </Link>
        </p>
      </section>

      <section aria-label="Tur fitur" className="grid gap-4 sm:grid-cols-2">
        {TUR.map((t) => (
          <Card key={t.judul} className="flex flex-col p-5">
            <span className="flex size-10 items-center justify-center rounded-xl bg-daun-600/10 text-daun-700 dark:text-daun-300">
              <t.ikon size={18} strokeWidth={1.8} />
            </span>
            <h2 className="mt-3 font-display font-bold">{t.judul}</h2>
            <p className="mt-1 flex-1 text-sm leading-relaxed text-muted">
              {t.isi}
            </p>
            <Link
              href={t.href}
              className="group mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-daun-700 dark:text-daun-300"
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
      </section>

      <section className="mt-12" aria-label="Fitur lengkap">
        <Card className="bg-panel-2/60 p-6">
          <h2 className="font-display font-bold">Checklist fitur untuk juri</h2>
          <ul className="mt-4 grid gap-x-6 gap-y-2 text-sm text-muted sm:grid-cols-2">
            {[
              "Peta cluster + filter dropdown + garis waktu",
              "Lapor pin-drop + multi-foto + geolokasi",
              "Vote, komentar realtime, konfirmasi silang",
              "Notifikasi realtime + email-ready trigger",
              "Gamifikasi: poin, badge, level, leaderboard",
              "Profil publik warga + sunting/hapus laporan sendiri",
              "Dashboard dewan: SLA, penugasan, bulk, heatmap",
              "Transparansi publik + insight otomatis + open data",
              "Keamanan: RLS, guard role/status, cooldown lapor",
              "Komunitas: polling, aksi bersama, edukasi & quiz berpoin",
              "Pasar ReUse: pasang & klaim barang bekas antar-warga",
              "Direktori layanan penting + UMKM warga",
              "Direktori fasilitas hijau di peta + ikuti area",
              "PWA, mode gelap, command palette ⌘K, widget embed",
            ].map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Check size={15} className="mt-0.5 shrink-0 text-daun-600 dark:text-daun-400" />
                {f}
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </main>
  );
}
