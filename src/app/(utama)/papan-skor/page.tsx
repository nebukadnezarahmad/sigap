import type { Metadata } from "next";
import { Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { BADGES } from "@/lib/constants";
import { IkonVektor, nodeBadge } from "@/lib/ikon-vektor";
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
    <main className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader
        tengah
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

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_360px]">
        <section aria-label="Koleksi lencana" className="order-2 lg:order-1">
          <h2 className="mb-1 font-display text-xl font-bold">Lencana</h2>
          <p className="mb-3 text-sm text-muted">Pencapaian partisipasi warga.</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {BADGES.map((b) => (
              <Card key={b.key} className="rounded-[24px] p-5">
                <span className="flex size-10 items-center justify-center rounded-xl bg-daun-600/10 text-daun-700 dark:text-daun-300">
                  <IkonVektor node={nodeBadge(b)} ukuran={20} />
                </span>
                <p className="mt-2 font-display text-sm font-bold">{b.nama}</p>
                <p className="mt-0.5 text-xs text-muted">{b.deskripsi}</p>
              </Card>
            ))}
          </div>
          <BadgeSaya />
        </section>

        {pemimpin.length > 0 && (
          <section aria-label="Peringkat 10 besar" className="order-1 lg:order-2">
            <h2 className="mb-1 font-display text-xl font-bold">10 besar</h2>
            <p className="mb-3 text-sm text-muted">Warga dengan poin tertinggi.</p>
            <div className="rounded-[28px] bg-panel p-3 sm:p-4">
              <div className="flex flex-col gap-[7px]">
                {podium.map((p, i) => (
                  <div key={p.id} className="flex min-h-[64px] items-center gap-3 rounded-[13px] bg-panel px-3.5 py-2 ring-1 ring-line">
                    <span className="w-6 shrink-0 text-center text-sm font-bold tabular-nums">
                      {i + 1}
                    </span>
                    <Avatar nama={p.nama_lengkap} url={p.avatar_url} ukuran={44} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold" title={p.nama_lengkap}>
                        {p.nama_lengkap}
                      </p>
                      <p className="truncate text-xs text-muted" title={`@${p.username}`}>
                        @{p.username}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-bold tabular-nums">{p.poin}</span>
                  </div>
                ))}
                {sisanya.map((p, i) => (
                  <div key={p.id} className="flex min-h-[53px] items-center gap-3 rounded-[13px] bg-panel-2 px-3.5 py-2">
                    <span className="w-6 shrink-0 text-center text-xs font-medium tabular-nums text-muted">
                      {i + 4}
                    </span>
                    <Avatar nama={p.nama_lengkap} url={p.avatar_url} ukuran={34} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium" title={p.nama_lengkap}>
                        {p.nama_lengkap}
                      </p>
                      <p className="truncate text-xs text-muted" title={`@${p.username}`}>
                        @{p.username}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs tabular-nums text-muted">{p.poin}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
