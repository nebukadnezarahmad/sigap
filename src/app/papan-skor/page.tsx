import type { Metadata } from "next";
import { Crown, Medal } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { BADGES } from "@/lib/constants";
import { Avatar, Card } from "@/components/ui";
import { BadgeSaya } from "./badge-saya";

export const metadata: Metadata = {
  title: "Papan Skor",
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
      <header className="mb-8 text-center">
        <h1 className="font-display text-3xl font-bold">Papan Skor Warga</h1>
        <p className="mt-2 text-muted">
          Poin diberikan untuk setiap partisipasi: lapor{" "}
          <b>+10</b> · komentar <b>+3</b> · dukung laporan <b>+1</b>
        </p>
      </header>

      {!dbAktif && (
        <Card className="mb-6 p-5 text-center text-sm text-muted">
          Database belum tersambung — papan skor akan tampil setelah Supabase diatur.
        </Card>
      )}

      {pemimpin.length > 0 && (
        <div className="mb-10 grid grid-cols-3 items-end gap-3 sm:gap-5">
          {urutanPodium.map((p) => {
            const juara = podium.indexOf(p) + 1;
            return (
              <Card
                key={p.id}
                className={`flex flex-col items-center px-3 py-5 text-center ${
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
                <p className="mt-1.5 rounded-full bg-daun-600/10 px-3 py-0.5 text-sm font-bold text-daun-700 dark:text-daun-300">
                  {p.poin} poin
                </p>
              </Card>
            );
          })}
        </div>
      )}

      {sisanya.length > 0 && (
        <Card className="mb-10 divide-y garis-halus overflow-hidden">
          {sisanya.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3 px-4 py-3">
              <span className="w-6 text-center font-display font-bold text-muted">
                {i + 4}
              </span>
              <Avatar nama={p.nama_lengkap} url={p.avatar_url} ukuran={34} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{p.nama_lengkap}</p>
                <p className="truncate text-xs text-muted">@{p.username}</p>
              </div>
              <span className="text-sm font-bold">{p.poin}</span>
            </div>
          ))}
        </Card>
      )}

      <section aria-label="Koleksi badge">
        <h2 className="mb-4 font-display text-xl font-bold">Koleksi Badge</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {BADGES.map((b) => (
            <Card key={b.key} className="p-4">
              <span className="text-3xl" role="img" aria-label={b.nama}>
                {b.emoji}
              </span>
              <p className="mt-2 font-display text-sm font-bold">{b.nama}</p>
              <p className="mt-0.5 text-xs text-muted">{b.deskripsi}</p>
            </Card>
          ))}
        </div>
        <BadgeSaya />
      </section>
    </main>
  );
}
