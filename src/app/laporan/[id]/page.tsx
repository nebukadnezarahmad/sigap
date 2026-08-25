import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { STATUS, kategoriBySlug, type StatusKey } from "@/lib/constants";
import type { FotoLaporan } from "@/types/database";
import { formatTanggal, waktuRelatif } from "@/lib/utils";
import { Avatar, Card, StatusChip } from "@/components/ui";
import { LeafletMap } from "@/components/map/leaflet-map";
import { VoteButton } from "./vote-button";
import { KomentarSection as Komentar } from "./komentar";
import { KonfirmasiButton } from "./konfirmasi-button";
import { ShareButtons } from "./share-buttons";
import { AdminPanel } from "./admin-panel";
import { MomenSelesai } from "./momen-selesai";

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
      `*, lat, lng, categories(slug,nama,warna,emoji),
       profiles!reports_user_id_fkey(id,username,nama_lengkap,avatar_url),
       votes(count), comments(count), confirmations(count),
       report_events(id,status,catatan,created_at),
       report_photos(id,url,fase)`
    )
    .eq("id", id)
    .single();

  if (!r) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  let isAdmin = false;
  let sudahKonfirmasi = false;
  if (user) {
    const [{ data: p }, { data: k }] = await Promise.all([
      supabase.from("profiles").select("role").eq("id", user.id).single(),
      supabase
        .from("confirmations")
        .select("user_id")
        .eq("report_id", id)
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);
    isAdmin = p?.role === "admin";
    sudahKonfirmasi = !!k;
  }

  const kat = r.categories;
  const koordinat: [number, number] = [r.lng ?? 106.816666, r.lat ?? -6.2];
  const semuaFoto = (r.report_photos ?? []) as unknown as FotoLaporan[];
  const fotoSebelum = semuaFoto.filter((f) => f.fase === "sebelum");
  const fotoSesudah = semuaFoto.filter((f) => f.fase === "sesudah");
  const galeri = [
    ...(r.foto_url ? [{ id: "utama", url: r.foto_url }] : []),
    ...fotoSebelum.map((f) => ({ id: f.id, url: f.url })),
  ];

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link
        href="/peta"
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-ink"
      >
        <ArrowLeft size={15} /> Kembali ke peta
      </Link>

      {r.status === "selesai" && (
        <MomenSelesai reportId={r.id} awalSelesai />
      )}

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
              {r.petugas && (
                <span className="rounded-full bg-violet-500/10 px-2.5 py-1 text-xs font-semibold text-violet-700 dark:text-violet-300">
                  🛠️ {r.petugas}
                </span>
              )}
              <span className="text-xs text-muted" suppressHydrationWarning>
                {waktuRelatif(r.created_at)}
              </span>
            </div>
            <h1 className="font-display text-3xl font-bold leading-tight">
              {r.judul}
            </h1>
            <div className="mt-3 flex items-center gap-2.5">
              <Link
                href={`/warga/${r.profiles?.username ?? ""}`}
                className="flex items-center gap-2.5 transition hover:opacity-80"
              >
                <Avatar
                  nama={r.profiles?.nama_lengkap ?? "Warga"}
                  url={r.profiles?.avatar_url}
                  ukuran={32}
                />
                <div className="text-sm">
                  <p className="font-semibold">
                    {r.profiles?.nama_lengkap ?? "Warga"}
                  </p>
                  <p className="text-xs text-muted">
                    @{r.profiles?.username}
                  </p>
                </div>
              </Link>
            </div>
          </header>

          {galeri.length > 0 && (
            <div
              className={`grid gap-2 ${
                galeri.length === 1 ? "" : "grid-cols-2"
              }`}
            >
              {galeri.map((f, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={f.id}
                  src={f.url}
                  alt={`Foto ${i + 1} — ${r.judul}`}
                  className={`w-full rounded-2xl border garis-halus object-cover shadow-sm ${
                    galeri.length === 1 ? "max-h-[420px]" : "h-44 sm:h-52"
                  }`}
                />
              ))}
            </div>
          )}

          <Card className="p-5">
            <p className="whitespace-pre-line leading-relaxed">{r.deskripsi}</p>
            {r.alamat_teks && (
              <p className="mt-3 border-t garis-halus pt-3 text-sm text-muted">
                📍 {r.alamat_teks}
              </p>
            )}
          </Card>

          <div className="flex flex-wrap items-center gap-3">
            <VoteButton reportId={r.id} jumlahAwal={r.votes?.[0]?.count ?? 0} />
            <KonfirmasiButton
              reportId={r.id}
              jumlahAwal={r.confirmations?.[0]?.count ?? 0}
              sudahAwal={sudahKonfirmasi}
              masuk={!!user}
            />
            <ShareButtons judul={r.judul} />
          </div>

          {fotoSesudah.length > 0 && (
            <Card className="border-daun-500/40 p-5">
              <h2 className="mb-3 font-display font-bold text-daun-700 dark:text-daun-300">
                ✅ Bukti penyelesaian
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {fotoSesudah.map((f) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={f.id}
                    src={f.url}
                    alt="Kondisi setelah ditangani"
                    className="h-44 w-full rounded-xl object-cover"
                  />
                ))}
              </div>
            </Card>
          )}

          <Komentar reportId={r.id} jumlahAwal={r.comments?.[0]?.count ?? 0} />

          {isAdmin && (
            <AdminPanel
              reportId={r.id}
              statusAwal={r.status}
              petugasAwal={r.petugas ?? ""}
            />
          )}
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
                <li className="text-sm text-muted">
                  Belum ada update dari dewan.
                </li>
              )}
              {[...(r.report_events ?? [])]
                .sort(
                  (a, b) =>
                    new Date(a.created_at).getTime() -
                    new Date(b.created_at).getTime()
                )
                .map((ev) => (
                  <li key={ev.id} className="relative pl-6">
                    <span
                      className="absolute left-0 top-1 size-3 rounded-full ring-4 ring-panel"
                      style={{
                        backgroundColor:
                          STATUS[ev.status as StatusKey]?.warna ?? "#94a3b8",
                      }}
                    />
                    <span
                      className="absolute left-[5.5px] top-4 h-[calc(100%+16px)] w-px bg-line"
                      aria-hidden
                    />
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
