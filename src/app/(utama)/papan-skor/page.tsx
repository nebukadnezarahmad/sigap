import type { Metadata } from "next";
import { Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar, Card } from "@/components/ui";
import { FeedbackState } from "@/components/feedback-state";
import { PageHeader } from "@/components/layout-konten";
import { BadgeSaya } from "./badge-saya";

export const metadata: Metadata = {
  title: "Papan skor",
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
  const sisanya = pemimpin.slice(3, 10);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <PageHeader
        judul="Papan skor"
        deskripsi="Apresiasi warga yang aktif menjaga lingkungan: melapor (+10), komentar solusi (+3), dan mendukung laporan lain (+1)."
      />

      {!dbAktif && (
        <Card className="mb-6 p-5 text-center text-sm text-muted">
          Database belum tersambung, sambungkan Supabase untuk menampilkan papan skor.
        </Card>
      )}

      {dbAktif && pemimpin.length === 0 && (
        <FeedbackState
          jenis="kosong"
          ikon={Trophy}
          judul="Belum ada peringkat"
          deskripsi="Jadilah yang pertama mengumpulkan poin dengan melapor, berkomentar, atau mendukung laporan warga."
        />
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <BadgeSaya />

        {pemimpin.length > 0 && (
          <section
            aria-labelledby="judul-peringkat"
            className="order-2 lg:col-start-2 lg:row-span-2 lg:row-start-1"
          >
            <h2 id="judul-peringkat" className="font-display text-xl font-bold">
              10 besar
            </h2>
            <p className="mb-4 mt-1 text-sm text-muted">Warga dengan poin tertinggi.</p>

            <Card className="overflow-hidden rounded-[28px] p-0">
              <ol aria-label="Peringkat 10 besar">
                {podium[0] && (
                  <li className="m-3 rounded-[21px] bg-action p-5 text-[var(--on-action)]">
                    <p className="text-xs font-semibold opacity-90">Juara pertama</p>
                    <div className="mt-3 flex items-center gap-3.5">
                      <span className="shrink-0 rounded-full ring-2 ring-white/25">
                        <Avatar
                          nama={podium[0].nama_lengkap}
                          url={podium[0].avatar_url}
                          ukuran={52}
                        />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-base font-bold" title={podium[0].nama_lengkap}>
                          {podium[0].nama_lengkap}
                        </p>
                        <p className="truncate text-xs opacity-90" title={`@${podium[0].username}`}>
                          @{podium[0].username}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-2xl font-bold tracking-tight tabular-nums">{podium[0].poin}</p>
                        <p className="text-xs opacity-90">poin</p>
                      </div>
                    </div>
                  </li>
                )}

                {podium.slice(1).map((p, i) => (
                  <li
                    key={p.id}
                    className="flex min-h-[68px] items-center gap-3 border-t border-line px-4 py-3"
                  >
                    <span className="w-5 shrink-0 text-center text-base font-bold tabular-nums">
                      {i + 2}
                    </span>
                    <Avatar nama={p.nama_lengkap} url={p.avatar_url} ukuran={38} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold" title={p.nama_lengkap}>
                        {p.nama_lengkap}
                      </p>
                      <p className="truncate text-xs text-muted" title={`@${p.username}`}>
                        @{p.username}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-bold tabular-nums">{p.poin}</span>
                  </li>
                ))}

                {sisanya.map((p, i) => (
                  <li key={p.id} className="flex min-h-[58px] items-center gap-3 border-t border-line px-4 py-2.5">
                    <span className="w-5 shrink-0 text-center text-xs font-semibold tabular-nums text-muted">
                      {i + 4}
                    </span>
                    <Avatar nama={p.nama_lengkap} url={p.avatar_url} ukuran={34} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold" title={p.nama_lengkap}>
                        {p.nama_lengkap}
                      </p>
                      <p className="truncate text-xs text-muted" title={`@${p.username}`}>
                        @{p.username}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums">{p.poin}</span>
                  </li>
                ))}
              </ol>
            </Card>
          </section>
        )}
      </div>
    </main>
  );
}
