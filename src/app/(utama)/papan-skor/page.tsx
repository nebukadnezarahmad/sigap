import type { Metadata } from "next";
import Link from "next/link";
import { Crown, Medal, ShieldCheck, TriangleAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { BADGES } from "@/lib/constants";
import { IkonVektor, nodeBadge } from "@/lib/ikon-vektor";
import { Avatar, Skeleton } from "@/components/ui";
import { KacaKartu } from "@/components/eksperimen/kaca";
import { PitaGradient } from "@/components/eksperimen/pita-gradient";
import { BadgeSaya } from "./badge-saya";

export const metadata: Metadata = {
  title: "Daftar Kehormatan Warga",
};

export const dynamic = "force-dynamic";

/* State papan skor: ikon medali relevan dengan juara, segitiga relevan
   dengan gangguan. Skeleton tanpa shimmer mengikuti MOTION 1. */
export function MuatPapanSkor() {
  return (
    <div aria-busy="true" className="mx-auto max-w-4xl px-4 pt-10">
      <p role="status" className="sr-only">
        Memuat papan skor
      </p>
      <div className="mb-10 grid grid-cols-3 items-end gap-3 sm:gap-5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex flex-col items-center rounded-[18px] border border-ap-hairline bg-white px-3 py-6 dark:border-white/15 dark:bg-ap-tile2"
          >
            <Skeleton className="size-14 rounded-full" />
            <Skeleton className="mt-3 h-4 w-2/3" />
            <Skeleton className="mt-2 h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
      <Skeleton className="h-40 w-full rounded-[18px]" />
    </div>
  );
}

export default async function HalamanPapanSkor() {
  let pemimpin: {
    id: string;
    username: string;
    nama_lengkap: string;
    avatar_url: string | null;
    poin: number;
  }[] = [];
  let dbAktif = true;

  try {
    const supabase = await createClient();
    if (!supabase) dbAktif = false;
    else {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,username,nama_lengkap,avatar_url,poin")
        .order("poin", { ascending: false })
        .limit(20);
      if (error) throw error;
      pemimpin = data ?? [];
    }
  } catch {
    dbAktif = false;
  }

  const podium = pemimpin.slice(0, 3);
  const sisanya = pemimpin.slice(3);
  const urutanPodium = [podium[1], podium[0], podium[2]].filter(Boolean);

  return (
    /* R-31: canvas putih Apple dominan di light dan tile netral ap-tile1 di dark agar tak muram-hijau; hero PitaGradient tetap sebagai identitas. */
    <main className="bg-white pb-10 text-ap-ink dark:bg-ap-tile1 dark:text-white">
      <PitaGradient tone="gelap">
        <header className="text-center">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
            <ShieldCheck size={14} /> Piagam Partisipasi Sipil
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold leading-[1.1] tracking-[-0.28px] text-white">
            Daftar Kehormatan Warga
          </h1>
          <p className="mt-2 text-sm text-white/85 max-w-lg mx-auto teks-pretty">
            Apresiasi bagi warga yang aktif menjaga lingkungan: Melaporkan masalah (<b>+10</b>), komentar solusi (<b>+3</b>), dan mendukung laporan warga lain (<b>+1</b>).
          </p>
        </header>
      </PitaGradient>

      <div className="mx-auto max-w-4xl px-4 pt-10">

      {!dbAktif && (
        /* R-31: kartu utility putih frosted hairline di light, tile netral ap-tile2 di dark. */
        <KacaKartu className="mb-6 border-ap-hairline bg-white/80 p-8 text-center dark:border-white/15 dark:bg-ap-tile2/80 dark:text-white">
          <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-[18px] bg-danger/10 text-danger">
            <TriangleAlert size={26} strokeWidth={1.8} />
          </span>
          <h2 className="font-display text-xl font-bold">
            Papan skor belum bisa dimuat
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted dark:text-white/70">
            Poinmu tetap tercatat. Data gagal dimuat karena database belum
            tersambung.
          </p>
          <ol className="mx-auto mt-4 max-w-md space-y-1 text-left text-sm text-muted dark:text-white/70">
            <li>1. Pastikan env Supabase sudah terisi.</li>
            <li>2. Jalankan schema.sql sesuai README.</li>
            <li>3. Muat ulang halaman ini.</li>
          </ol>
          <Link
            href="/papan-skor"
            className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-full bg-ap-blue px-5 text-sm font-semibold text-white transition hover:bg-ap-blue-focus focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus"
          >
            Muat ulang halaman
          </Link>
        </KacaKartu>
      )}

      {dbAktif && pemimpin.length === 0 && (
        <KacaKartu className="mb-10 border-ap-hairline bg-white/80 p-8 text-center dark:border-white/15 dark:bg-ap-tile2/80 dark:text-white">
          <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-[18px] bg-ap-blue/10 text-ap-blue dark:text-ap-sky">
            <Medal size={26} strokeWidth={1.8} />
          </span>
          <h2 className="font-display text-xl font-bold">
            Belum ada warga di papan skor
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted dark:text-white/70">
            Kamu bisa jadi yang pertama. Laporkan masalah, beri komentar
            solusi, atau dukung laporan tetanggamu untuk mengumpulkan poin.
          </p>
          <Link
            href="/peta?lapor=1"
            className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-full bg-ap-blue px-5 text-sm font-semibold text-white transition hover:bg-ap-blue-focus focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus"
          >
            Buat laporan pertamamu
          </Link>
        </KacaKartu>
      )}

      {pemimpin.length > 0 && (
        <div className="mb-10 grid grid-cols-3 items-end gap-3 sm:gap-5">
          {urutanPodium.map((p) => {
            const juara = podium.indexOf(p) + 1;
            return (
              <KacaKartu
                key={p.id}
                className={`flex flex-col items-center border-ap-hairline bg-white/80 px-3 py-6 text-center dark:border-white/15 dark:bg-ap-tile2/80 dark:text-white ${
                  juara === 1 ? "ring-2 ring-kunyit-500" : ""
                }`}
              >
                <span className="mb-2">
                  {juara === 1 ? (
                    <Crown size={26} className="text-kunyit-500" />
                  ) : (
                    <Medal size={22} className={juara === 2 ? "text-slate-400" : "text-amber-700"} />
                  )}
                </span>
                <Avatar nama={p.nama_lengkap} url={p.avatar_url} ukuran={juara === 1 ? 64 : 52} />
                <p className="mt-2 truncate font-display font-bold">
                  {p.nama_lengkap}
                </p>
                <p className="truncate text-xs text-muted dark:text-white/70">@{p.username}</p>
                <p className="angka-tabular mt-1.5 rounded-full bg-daun-600/10 px-3 py-0.5 text-sm font-bold tabular-nums text-daun-700 dark:text-daun-300">
                  {p.poin} poin
                </p>
              </KacaKartu>
            );
          })}
        </div>
      )}

      {sisanya.length > 0 && (
        /* R-31: divider hairline netral di kedua mode; baris daftar di atas tile netral ap-tile2 saat dark. */
        <KacaKartu className="mb-10 divide-y divide-ap-hairline overflow-hidden border-ap-hairline bg-white/80 dark:divide-white/15 dark:border-white/15 dark:bg-ap-tile2/80 dark:text-white">
          {sisanya.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3 px-4 py-3">
              <span className="angka-tabular w-6 text-center text-sm font-bold tabular-nums text-muted dark:text-white/70">
                {i + 4}
              </span>
              <Avatar nama={p.nama_lengkap} url={p.avatar_url} ukuran={34} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{p.nama_lengkap}</p>
                <p className="truncate text-xs text-muted dark:text-white/70">@{p.username}</p>
              </div>
              <span className="angka-tabular text-sm font-bold tabular-nums">{p.poin}</span>
            </div>
          ))}
        </KacaKartu>
      )}

      <section aria-label="Koleksi badge">
        <h2 className="mb-4 font-display text-xl font-bold tracking-[-0.224px]">Koleksi Badge</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {BADGES.map((b) => (
            <KacaKartu key={b.key} className="border-ap-hairline bg-white/80 p-6 dark:border-white/15 dark:bg-ap-tile2/80 dark:text-white">
              <span className="flex size-10 items-center justify-center rounded-xl bg-daun-600/10 text-daun-700 dark:text-daun-300">
                <IkonVektor node={nodeBadge(b)} ukuran={20} />
              </span>
              <p className="mt-2 font-display text-sm font-bold">{b.nama}</p>
              <p className="mt-0.5 text-xs text-muted dark:text-white/70">{b.deskripsi}</p>
            </KacaKartu>
          ))}
        </div>
        <BadgeSaya />
      </section>
      </div>
    </main>
  );
}
