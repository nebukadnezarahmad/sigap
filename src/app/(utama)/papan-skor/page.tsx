import type { Metadata } from "next";
import Link from "next/link";
import { Crown, Medal, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { POIN } from "@/lib/constants";
import { Avatar, Card, KosongState } from "@/components/ui";
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
    <main className="mx-auto max-w-4xl px-4 py-12">
      <header className="mb-10">
        <p className="flex items-center gap-3 text-mikro font-semibold uppercase text-muted">
          <span aria-hidden className="h-px w-8 bg-line-kuat" />
          Partisipasi warga
        </p>
        <h1 className="mt-4">Papan Skor Warga</h1>
        <p className="mt-3 ukuran-baca text-muted teks-pretty">
          Poin diberikan untuk setiap partisipasi: lapor{" "}
          <b className="text-ink">+{POIN.lapor}</b> · komentar{" "}
          <b className="text-ink">+{POIN.komentar}</b> · dukung laporan{" "}
          <b className="text-ink">+{POIN.vote}</b>
        </p>
      </header>

      {!dbAktif && (
        <Card variant="garis" className="mb-8 border-kunyit-500/40">
          <KosongState
            ikon={<Trophy size={24} strokeWidth={1.6} />}
            judul="Papan skor belum bisa dimuat"
            isi="Sambungan ke database sedang tidak tersedia, jadi peringkat warga belum bisa ditampilkan. Badge di bawah tetap bisa kamu lihat."
            aksi={
              <Link
                href="/peta"
                className="rounded-kontrol border garis-halus bg-panel px-5 py-2.5 text-sm font-semibold transition-[border-color,color] duration-300 ease-sigap hover:border-daun-400 hover:text-daun-700 dark:hover:text-daun-300"
              >
                Kembali ke peta
              </Link>
            }
          />
        </Card>
      )}

      {pemimpin.length > 0 && (
        <div className="mb-10 grid grid-cols-3 items-end gap-3 sm:gap-5">
          {urutanPodium.map((p) => {
            const juara = podium.indexOf(p) + 1;
            const pertama = juara === 1;
            return (
              <Link key={p.id} href={`/warga/${p.username}`} className="block">
                <Card
                  interaktif
                  className={`flex h-full flex-col items-center px-3 text-center ${
                    pertama ? "py-7 ring-2 ring-kunyit-500" : "py-5"
                  }`}
                >
                  <span className="mb-2">
                    {pertama ? (
                      <Crown size={26} className="text-kunyit-600" aria-hidden />
                    ) : (
                      <Medal
                        size={22}
                        aria-hidden
                        className={juara === 2 ? "text-slate-400" : "text-amber-700"}
                      />
                    )}
                    <span className="sr-only">Peringkat {juara}</span>
                  </span>
                  <Avatar
                    nama={p.nama_lengkap}
                    url={p.avatar_url}
                    ukuran={pertama ? 72 : 52}
                  />
                  {/* Hierarki juara dipikul tipografi, bukan hanya ring emas. */}
                  <p
                    className={`mt-2.5 w-full truncate font-display font-bold ${
                      pertama ? "text-lg" : "text-sm"
                    }`}
                  >
                    {p.nama_lengkap}
                  </p>
                  <p className="w-full truncate text-xs text-muted">
                    @{p.username}
                  </p>
                  <p
                    className={`angka-tabular mt-2 font-display font-extrabold leading-none text-daun-700 dark:text-daun-300 ${
                      pertama ? "text-3xl" : "text-xl"
                    }`}
                  >
                    {p.poin}
                    <span className="ml-1 text-xs font-semibold text-muted">
                      poin
                    </span>
                  </p>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {sisanya.length > 0 && (
        <Card className="mb-12 divide-y garis-halus overflow-hidden">
          {sisanya.map((p, i) => (
            <Link
              key={p.id}
              href={`/warga/${p.username}`}
              className="flex items-center gap-3 px-4 py-3 transition-colors duration-200 ease-sigap hover:bg-panel-2 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-fokus"
            >
              <span className="angka-tabular w-6 text-center font-display font-bold text-muted">
                {i + 4}
              </span>
              <Avatar nama={p.nama_lengkap} url={p.avatar_url} ukuran={34} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{p.nama_lengkap}</p>
                <p className="truncate text-xs text-muted">@{p.username}</p>
              </div>
              <span className="angka-tabular text-sm font-bold">{p.poin}</span>
            </Link>
          ))}
        </Card>
      )}

      <section aria-label="Koleksi badge">
        <h2 className="mb-5">Koleksi Badge</h2>
        <BadgeSaya />
      </section>
    </main>
  );
}
