import { notFound } from "next/navigation";
import Link from "next/link";
import { Flame } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { BADGES, LEVELS, levelDari } from "@/lib/constants";
import type { StatusLaporan } from "@/types/database";
import { waktuRelatif } from "@/lib/utils";
import { Avatar, Card, StatusChip } from "@/components/ui";

export const dynamic = "force-dynamic";

type LaporanRingkas = {
  id: string;
  judul: string;
  status: string;
  created_at: string;
  categories: { slug: string; nama: string; warna: string; emoji: string } | null;
};

function hitungStreak(tanggal: string[]) {
  const unik = new Set(tanggal.map((iso) => iso.slice(0, 10)));
  const sekarang = Date.now();
  return [...unik].filter((d) => {
    const selisih = (sekarang - new Date(d + "T00:00:00").getTime()) / 86400000;
    return selisih <= 7;
  }).length;
}

export default async function HalamanWarga({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();
  if (!supabase) notFound();

  const { data: p } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();
  if (!p) notFound();

  const [laporan, komentar, votes, badges] = await Promise.all([
    supabase
      .from("reports")
      .select("id, judul, status, created_at, categories(slug,nama,warna,emoji)")
      .eq("user_id", p.id)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase.from("comments").select("created_at").eq("user_id", p.id),
    supabase.from("votes").select("created_at").eq("user_id", p.id),
    supabase.from("user_badges").select("badge_key").eq("user_id", p.id),
  ]);

  const lv = levelDari(p.poin);
  const dimiliki = new Set((badges.data ?? []).map((b) => b.badge_key));
  const laporanTerakhir = (laporan.data ?? []) as unknown as LaporanRingkas[];

  const streak = hitungStreak([
    ...laporanTerakhir.map((x) => x.created_at),
    ...(komentar.data ?? []).map((x: { created_at: string }) => x.created_at),
    ...(votes.data ?? []).map((x: { created_at: string }) => x.created_at),
  ]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <Card className="relative overflow-hidden p-0">
        <div
          aria-hidden
          className="h-28 bg-daun-600"
          style={{
            backgroundImage:
              "repeating-linear-gradient(115deg, rgba(255,255,255,0.08) 0 2px, transparent 2px 26px)",
          }}
        />
        <div className="-mt-10 px-6 pb-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <span className="rounded-full ring-4 ring-panel">
                <Avatar
                  nama={p.nama_lengkap}
                  url={p.avatar_url}
                  ukuran={84}
                />
              </span>
              <div className="pb-1">
                <h1 className="font-display text-2xl font-bold">
                  {p.nama_lengkap}
                  {p.role === "admin" && (
                    <span className="ml-2 rounded-full bg-kunyit-500/15 px-2.5 py-1 text-xs font-bold text-kunyit-600">
                      Dewan
                    </span>
                  )}
                </h1>
                <p className="text-sm text-muted">@{p.username}</p>
              </div>
            </div>
            <div className="flex gap-2 pb-1">
              <span className="rounded-full bg-panel-2 px-3.5 py-1.5 text-xs font-semibold text-muted">
                📋 {(laporan.data ?? []).length} laporan terakhir
              </span>
              <span className="flex items-center gap-1 rounded-full bg-panel-2 px-3.5 py-1.5 text-xs font-semibold text-muted">
                <Flame size={13} className="text-kunyit-500" /> {streak} hari
                aktif (7hr)
              </span>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-display font-bold">
                  {lv.sekarang.emoji} Level {lv.sekarang.nama}
                </span>
                <span className="text-muted">
                  {p.poin} poin
                  {lv.berikut && ` · ${lv.berikut.min - p.poin} lagi ke ${lv.berikut.nama}`}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full bg-daun-500 transition-[width,background-color]"
                  style={{ width: `${lv.progres}%` }}
                />
              </div>
              <div className="mt-1.5 flex gap-3 text-[11px] text-muted">
                {LEVELS.map((l) => (
                  <span key={l.key} className={p.poin >= l.min ? "font-semibold text-daun-700 dark:text-daun-300" : ""}>
                    {l.emoji} {l.nama} ({l.min}+)
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <section className="mt-8" aria-label="Koleksi badge">
        <h2 className="mb-3 font-display text-lg font-bold">Badge</h2>
        <div className="flex flex-wrap gap-2">
          {BADGES.map((b) => {
            const punya = dimiliki.has(b.key);
            return (
              <span
                key={b.key}
                title={b.deskripsi}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  punya
                    ? "border-transparent bg-daun-600 text-white"
                    : "garis-halus text-muted opacity-55"
                }`}
              >
                <span aria-hidden>{punya ? b.emoji : "🔒"}</span>
                {b.nama}
              </span>
            );
          })}
        </div>
      </section>

      <section className="mt-8" aria-label="Laporan terakhir">
        <h2 className="mb-3 font-display text-lg font-bold">
          Laporan terakhir
        </h2>
        <div className="space-y-2.5">
          {(laporan.data ?? []).length === 0 && (
            <Card className="p-6 text-center text-sm text-muted">
              Belum ada laporan.
            </Card>
          )}
          {laporanTerakhir.map((r) => (
            <Link key={r.id} href={`/laporan/${r.id}`} className="block">
              <Card className="flex items-center gap-3 p-4 transition hover:border-daun-400">
                <span className="text-xl">{r.categories?.emoji ?? "📌"}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{r.judul}</p>
                  <p className="text-xs text-muted" suppressHydrationWarning>
                    {waktuRelatif(r.created_at)}
                  </p>
                </div>
                <StatusChip status={r.status as StatusLaporan} />
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
