import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { GalatMuatUlang } from "@/components/layout-konten";
import { BADGES, LEVELS, levelDari } from "@/lib/constants";
import { IkonKategori, IkonVektor, nodeBadge, nodeLevel } from "@/lib/ikon-vektor";
import { Check, Lock } from "lucide-react";
import type { StatusLaporan } from "@/types/database";
import { waktuRelatif } from "@/lib/utils";
import { Avatar, Card, StatusChip } from "@/components/ui";
import { Progress } from "@/components/progress";

export const dynamic = "force-dynamic";

type LaporanRingkas = {
  id: string;
  judul: string;
  status: string;
  created_at: string;
  categories: { slug: string; nama: string; warna: string } | null;
};

function hitungStreak(tanggal: string[]) {
  const unik = new Set(tanggal.map((iso) => iso.slice(0, 10)));
  let streak = 0;
  const d = new Date();
  // Mundur dari hari ini selama ada aktivitas tiap harinya
  while (true) {
    const kunci = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (!unik.has(kunci)) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export default async function HalamanWarga({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();
  if (!supabase) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <GalatMuatUlang judul="Profil warga belum bisa dimuat" />
      </main>
    );
  }

  const { data: p, error: galatProfil } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .maybeSingle();
  if (galatProfil) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <GalatMuatUlang judul="Profil warga belum bisa dimuat" />
      </main>
    );
  }
  if (!p) notFound();

  const [laporan, komentar, votes, badges] = await Promise.all([
    supabase
      .from("reports")
      .select("id, judul, status, created_at, categories(slug,nama,warna)")
      .eq("user_id", p.id)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase.from("comments").select("created_at").eq("user_id", p.id),
    supabase.from("votes").select("created_at").eq("user_id", p.id),
    supabase.from("user_badges").select("badge_key").eq("user_id", p.id),
  ]);

  if (laporan.error || komentar.error || votes.error || badges.error) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <GalatMuatUlang judul="Profil warga belum bisa dimuat" />
      </main>
    );
  }

  const lv = levelDari(p.poin);
  const dimiliki = new Set((badges.data ?? []).map((b) => b.badge_key));
  const laporanTerakhir = (laporan.data ?? []) as unknown as LaporanRingkas[];

  const streak = hitungStreak([
    ...laporanTerakhir.map((x) => x.created_at),
    ...(komentar.data ?? []).map((x: { created_at: string }) => x.created_at),
    ...(votes.data ?? []).map((x: { created_at: string }) => x.created_at),
  ]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <Card className="p-6 sm:p-7">
        <div aria-hidden="true" className="mb-6 h-1 w-16 rounded-full bg-action" />
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex min-w-0 items-center gap-4">
            <span className="rounded-full border garis-halus">
              <Avatar
                nama={p.nama_lengkap}
                url={p.avatar_url}
                ukuran={64}
              />
            </span>
            <div className="min-w-0">
              <h1 className="truncate font-display text-2xl font-semibold tracking-tight">
                {p.nama_lengkap}
                {p.role === "admin" && (
                  <span className="ml-2 rounded-full bg-panel-2 px-2.5 py-1 align-middle text-xs font-semibold text-muted">
                    Dewan
                  </span>
                )}
              </h1>
              <p className="mt-0.5 text-sm text-muted">@{p.username}</p>
            </div>
          </div>

          <div role="group" aria-label="Statistik kontribusi">
            <dl className="flex gap-7">
              <div>
                <dt className="text-xs text-muted">Laporan terakhir</dt>
                <dd className="angka-tabular mt-1 text-xl font-semibold">
                  {(laporan.data ?? []).length}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Hari beruntun</dt>
                <dd className="angka-tabular mt-1 text-xl font-semibold">{streak}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="mt-6 border-t garis-halus pt-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <IkonVektor node={nodeLevel(lv.sekarang)} ukuran={16} />
              Level {lv.sekarang.nama}
            </p>
            <p className="text-sm text-muted">
              <span className="angka-tabular font-semibold text-ink">
                {p.poin} poin
              </span>
            </p>
          </div>
          <Progress
            nilai={lv.progres}
            label={`Progres level ${lv.sekarang.nama}`}
            varian="aksi"
            className="mt-3"
          />
          <p className="mt-2 text-sm text-muted">
            {lv.berikut
              ? `${lv.berikut.min - p.poin} poin lagi menuju ${lv.berikut.nama}`
              : "Level tertinggi tercapai."}
          </p>
          <ol
            aria-label="Tahapan level"
            className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted"
          >
            {LEVELS.map((l) => (
              <li
                key={l.key}
                aria-current={l.key === lv.sekarang.key ? "step" : undefined}
                className={
                  p.poin >= l.min ? "font-semibold text-ink" : undefined
                }
              >
                <span className="flex items-center gap-1">
                  <IkonVektor node={nodeLevel(l)} ukuran={12} />
                  {l.nama} ({l.min}+)
                </span>
              </li>
            ))}
          </ol>
        </div>
      </Card>

      <section aria-labelledby="judul-lencana" className="mt-10">
        <h2
          id="judul-lencana"
          className="font-display text-xl font-semibold tracking-tight"
        >
          Koleksi lencana
        </h2>
        <p className="mb-4 mt-1 text-sm text-muted">
          {dimiliki.size} dari {BADGES.length} dimiliki
        </p>
        <ul
          aria-label="Koleksi lencana"
          className="grid gap-px overflow-hidden rounded-2xl border garis-halus bg-line sm:grid-cols-2"
        >
          {BADGES.map((b) => {
            const punya = dimiliki.has(b.key);
            return (
              <li key={b.key} className="flex items-start gap-3 bg-panel p-4">
                <span
                  aria-hidden="true"
                  className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                    punya ? "bg-action-soft text-action" : "bg-panel-2 text-muted"
                  }`}
                >
                  <IkonVektor node={nodeBadge(b)} ukuran={19} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{b.nama}</p>
                  <p className="teks-pretty mt-0.5 text-xs leading-5 text-muted">
                    {b.deskripsi}
                  </p>
                  <p
                    className={`mt-1 text-xs font-semibold ${
                      punya ? "text-action" : "text-muted"
                    }`}
                  >
                    {punya ? "Dimiliki" : "Terkunci"}
                  </p>
                </div>
                <span
                  aria-hidden="true"
                  className={punya ? "text-action" : "text-muted"}
                >
                  {punya ? (
                    <Check size={17} aria-hidden="true" />
                  ) : (
                    <Lock size={15} aria-hidden="true" />
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="judul-laporan" className="mt-10">
        <h2
          id="judul-laporan"
          className="font-display text-xl font-semibold tracking-tight"
        >
          Laporan terakhir
        </h2>
        <p className="mb-4 mt-1 text-sm text-muted">
          Aktivitas terbaru {p.nama_lengkap}.
        </p>
        {(laporan.data ?? []).length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted">
            Belum ada laporan.
          </Card>
        ) : (
          <ul
            aria-label="Laporan terakhir"
            className="divide-y divide-line overflow-hidden rounded-2xl border garis-halus bg-panel"
          >
            {laporanTerakhir.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/laporan/${r.id}`}
                  className="flex items-center gap-3 p-4 transition hover:bg-panel-2"
                >
                  <span style={{ color: r.categories?.warna }}>
                    <IkonKategori slug={r.categories?.slug ?? "lainnya"} ukuran={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{r.judul}</p>
                    <p className="text-xs text-muted" suppressHydrationWarning>
                      {waktuRelatif(r.created_at)}
                    </p>
                  </div>
                  <StatusChip status={r.status as StatusLaporan} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
