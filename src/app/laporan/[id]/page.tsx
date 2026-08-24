import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { STATUS, kategoriBySlug, type StatusKey } from "@/lib/constants";
import { formatTanggal, waktuRelatif } from "@/lib/utils";
import { Avatar, Card, StatusChip } from "@/components/ui";
import { LeafletMap } from "@/components/map/leaflet-map";
import { VoteButton } from "./vote-button";
import { KomentarSection as Komentar } from "./komentar";

export const dynamic = "force-dynamic";

export default async function HalamanLaporan({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  if (!supabase) notFound();

  const { data: r } = await supabase
    .from("reports")
    .select(
      `*, categories(slug,nama,warna,emoji),
       profiles(id,username,nama_lengkap,avatar_url),
       votes(count), comments(count),
       report_events(id,status,catatan,created_at)`
    )
    .eq("id", id)
    .single();

  if (!r) notFound();

  const kat = r.categories;
  const koordinat = r.lokasi?.coordinates ?? [106.816666, -6.2];

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link
        href="/peta"
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-ink"
      >
        <ArrowLeft size={15} /> Kembali ke peta
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <header>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <StatusChip status={r.status} />
              <span
                className="rounded-full px-2.5 py-1 text-xs font-semibold"
                style={{
                  backgroundColor: `${kat?.warna}22`,
                  color: kat?.warna,
                }}
              >
                {kat?.emoji} {kat?.nama ?? "Lainnya"}
              </span>
              <span className="text-xs text-muted">{waktuRelatif(r.created_at)}</span>
            </div>
            <h1 className="font-display text-3xl font-bold leading-tight">
              {r.judul}
            </h1>
            <div className="mt-3 flex items-center gap-2.5">
              <Avatar
                nama={r.profiles?.nama_lengkap ?? "Warga"}
                url={r.profiles?.avatar_url}
                ukuran={32}
              />
              <div className="text-sm">
                <p className="font-semibold">{r.profiles?.nama_lengkap ?? "Warga"}</p>
                <p className="text-xs text-muted">@{r.profiles?.username}</p>
              </div>
            </div>
          </header>

          {r.foto_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={r.foto_url}
              alt={r.judul}
              className="max-h-[420px] w-full rounded-2xl border garis-halus object-cover shadow-sm"
            />
          )}

          <Card className="p-5">
            <p className="whitespace-pre-line leading-relaxed">{r.deskripsi}</p>
            {r.alamat_teks && (
              <p className="mt-3 border-t garis-halus pt-3 text-sm text-muted">
                📍 {r.alamat_teks}
              </p>
            )}
          </Card>

          <VoteButton reportId={r.id} jumlahAwal={r.votes?.[0]?.count ?? 0} />

          <Komentar reportId={r.id} jumlahAwal={r.comments?.[0]?.count ?? 0} />
        </div>

        <aside className="space-y-5">
          <Card className="overflow-hidden p-0">
            <div className="h-56 w-full">
              <LeafletMap
                mode="satu"
                zoom={16}
                titik={[
                  {
                    id: r.id,
                    lat: koordinat[1],
                    lng: koordinat[0],
                    warna: kat?.warna ?? "#64748b",
                    emoji: kat?.emoji ?? "📌",
                    judul: r.judul,
                  },
                ]}
              />
            </div>
            <p className="px-4 py-2.5 text-center text-xs text-muted">
              {koordinat[0].toFixed(5)}, {koordinat[1].toFixed(5)}
            </p>
          </Card>

          <Card className="p-5">
            <h2 className="mb-4 font-display font-bold">Linimasa penanganan</h2>
            <ol className="space-y-4">
              {(r.report_events ?? []).length === 0 && (
                <li className="text-sm text-muted">Belum ada update dari dewan.</li>
              )}
              {[...(r.report_events ?? [])]
                .sort(
                  (a, b) =>
                    new Date(a.created_at).getTime() -
                    new Date(b.created_at).getTime()
                )
                .map((ev) => (
                  <li key={ev.id} className="relative pl-6 last:before:hidden">
                    <span
                      className="absolute left-0 top-1 size-3 rounded-full ring-4 ring-panel"
                      style={{
                        backgroundColor:
                          STATUS[ev.status as StatusKey]?.warna ?? "#94a3b8",
                      }}
                    />
                    <span className="absolute left-[5.5px] top-4 h-[calc(100%+16px)] w-px bg-line" aria-hidden />
                    <p className="text-sm font-semibold">
                      {STATUS[ev.status as StatusKey]?.label ?? ev.status}
                    </p>
                    {ev.catatan && (
                      <p className="mt-0.5 text-sm text-muted">{ev.catatan}</p>
                    )}
                    <p className="mt-0.5 text-xs text-muted">
                      {formatTanggal(ev.created_at)}
                    </p>
                  </li>
                ))}
            </ol>
          </Card>

          <Card className="bg-panel-2 p-5 text-center">
            <p className="font-display text-lg font-bold">
              {kategoriBySlug(kat?.slug ?? "").nama}
            </p>
            <p className="mt-1 text-sm text-muted">
              Dilaporkan lewat SIGAP — platform partisipasi permukiman.
            </p>
          </Card>
        </aside>
      </div>
    </main>
  );
}
