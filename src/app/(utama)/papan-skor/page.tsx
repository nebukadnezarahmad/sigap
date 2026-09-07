import type { Metadata } from "next";
import { Crown, Medal, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { BADGES } from "@/lib/constants";
import { IkonVektor, nodeBadge } from "@/lib/ikon-vektor";
import { Avatar } from "@/components/ui";
import { BadgeSaya } from "./badge-saya";

export const metadata: Metadata = {
  title: "Daftar Kehormatan Warga",
};

export const dynamic = "force-dynamic";

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
    <main className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-10 text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-daun-600/10 px-3 py-1 text-xs font-bold text-daun-700 dark:text-daun-300 uppercase tracking-wider mb-2">
          <ShieldCheck size={14} /> Piagam Partisipasi Sipil
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold leading-[1.1] tracking-[-0.28px]">
          Daftar Kehormatan Warga
        </h1>
        <p className="mt-2 text-sm text-muted max-w-lg mx-auto teks-pretty">
          Apresiasi bagi warga yang aktif menjaga lingkungan: Melaporkan masalah (<b>+10</b>), komentar solusi (<b>+3</b>), dan mendukung laporan warga lain (<b>+1</b>).
        </p>
      </header>

      {!dbAktif && (
        <div className="mb-6 rounded-[18px] border border-ap-hairline bg-white p-6 text-center text-sm text-muted shadow-none dark:border-line dark:bg-panel">
          Database belum tersambung — papan skor akan tampil setelah Supabase diatur.
        </div>
      )}

      {pemimpin.length > 0 && (
        <div className="mb-10 grid grid-cols-3 items-end gap-3 sm:gap-5">
          {urutanPodium.map((p) => {
            const juara = podium.indexOf(p) + 1;
            return (
              <div
                key={p.id}
                className={`flex flex-col items-center rounded-[18px] border border-ap-hairline bg-white px-3 py-6 text-center text-ap-ink shadow-none dark:border-line dark:bg-panel dark:text-ink ${
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
                <p className="truncate text-xs text-muted">@{p.username}</p>
                <p className="angka-tabular mt-1.5 rounded-full bg-daun-600/10 px-3 py-0.5 text-sm font-bold text-daun-700 dark:text-daun-300">
                  {p.poin} poin
                </p>
              </div>
            );
          })}
        </div>
      )}

      {sisanya.length > 0 && (
        <div className="mb-10 divide-y divide-ap-hairline overflow-hidden rounded-[18px] border border-ap-hairline bg-white shadow-none dark:divide-line dark:border-line dark:bg-panel">
          {sisanya.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3 px-4 py-3">
              <span className="angka-tabular w-6 text-center font-display font-bold text-muted">
                {i + 4}
              </span>
              <Avatar nama={p.nama_lengkap} url={p.avatar_url} ukuran={34} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{p.nama_lengkap}</p>
                <p className="truncate text-xs text-muted">@{p.username}</p>
              </div>
              <span className="angka-tabular text-sm font-bold">{p.poin}</span>
            </div>
          ))}
        </div>
      )}

      <section aria-label="Koleksi badge">
        <h2 className="mb-4 font-display text-xl font-bold tracking-[-0.224px]">Koleksi Badge</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {BADGES.map((b) => (
            <div key={b.key} className="rounded-[18px] border border-ap-hairline bg-white p-6 text-ap-ink shadow-none dark:border-line dark:bg-panel dark:text-ink">
              <span className="flex size-10 items-center justify-center rounded-xl bg-daun-600/10 text-daun-700 dark:text-daun-300">
                <IkonVektor node={nodeBadge(b)} ukuran={20} />
              </span>
              <p className="mt-2 font-display text-sm font-bold">{b.nama}</p>
              <p className="mt-0.5 text-xs text-muted">{b.deskripsi}</p>
            </div>
          ))}
        </div>
        <BadgeSaya />
      </section>
    </main>
  );
}
