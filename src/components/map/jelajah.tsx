"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "motion/react";
import { MapPinOff, Plus, Search, WifiOff } from "lucide-react";
import type { LaporanDenganRelasi } from "@/types/database";
import { KATEGORI, STATUS, kategoriBySlug, type StatusKey } from "@/lib/constants";
import { waktuRelatif } from "@/lib/utils";
import { StatusChip, Button, Card } from "@/components/ui";
import { Modal } from "@/components/modal";
import { createClient } from "@/lib/supabase/client";
import { BuatLaporanFormulir } from "./buat-laporan";

const LeafletMap = dynamic(
  () => import("./leaflet-map").then((m) => m.LeafletMap),
  { ssr: false, loading: () => <div className="h-full w-full animate-pulse bg-panel-2" /> }
);

export function Jelajah({
  laporanAwal,
  dbAktif,
}: {
  laporanAwal: LaporanDenganRelasi[];
  dbAktif: boolean;
}) {
  const [laporan, setLaporan] = useState(laporanAwal);
  const [terpilihId, setTerpilihId] = useState<string | null>(null);
  const [kueri, setKueri] = useState("");
  const [fKategori, setFKategori] = useState<string[]>([]);
  const [fStatus, setFStatus] = useState<StatusKey[]>([]);
  const [modalBuka, setModalBuka] = useState(false);
  const [realtimeAktif, setRealtimeAktif] = useState(false);

  useEffect(() => {
    if (!dbAktif) return;
    const supabase = createClient();

    const ch1 = supabase
      .channel("reports-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reports" },
        (payload) => {
          const baru = payload.new as LaporanDenganRelasi;
          setLaporan((s) => [
            {
              ...baru,
              categories: null,
              profiles: null,
              vote_count: 0,
              comment_count: 0,
            },
            ...s.filter((r) => r.id !== baru.id),
          ]);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "reports" },
        (payload) => {
          const upd = payload.new as LaporanDenganRelasi;
          setLaporan((s) =>
            s.map((r) =>
              r.id === upd.id ? { ...r, status: upd.status } : r
            )
          );
        }
      )
      .subscribe((st) => setRealtimeAktif(st === "SUBSCRIBED"));

    return () => {
      supabase.removeChannel(ch1);
    };
  }, [dbAktif]);

  const tersaring = useMemo(() => {
    return laporan.filter((r) => {
      if (fKategori.length && !fKategori.includes(r.categories?.slug ?? "lainnya"))
        return false;
      if (fStatus.length && !fStatus.includes(r.status)) return false;
      if (kueri && !`${r.judul} ${r.deskripsi}`.toLowerCase().includes(kueri.toLowerCase()))
        return false;
      return true;
    });
  }, [laporan, fKategori, fStatus, kueri]);

  const titikPeta = useMemo(
    () =>
      tersaring.map((r) => ({
        id: r.id,
        lat: r.lokasi?.coordinates?.[1] ?? 0,
        lng: r.lokasi?.coordinates?.[0] ?? 0,
        warna:
          r.categories?.warna ??
          STATUS[r.status as StatusKey]?.warna ??
          "#64748b",
        emoji: r.categories?.emoji ?? "📌",
        judul: r.judul,
      })),
    [tersaring]
  );

  const terpilih = laporan.find((r) => r.id === terpilihId) ?? null;

  return (
    <main className="mx-auto max-w-7xl px-4 pb-10 pt-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Peta Masalah Permukiman</h1>
          <p className="text-sm text-muted">
            {tersaring.length} laporan ditampilkan ·{" "}
            <span
              className={`inline-flex items-center gap-1 ${realtimeAktif ? "text-daun-600 dark:text-daun-400" : ""}`}
            >
              <span
                className={`size-1.5 rounded-full ${realtimeAktif ? "bg-daun-500 animate-pulse" : "bg-muted"}`}
              />
              {realtimeAktif ? "Realtime aktif" : "Menyambungkan…"}
            </span>
          </p>
        </div>
        <Button size="lg" onClick={() => setModalBuka(true)}>
          <Plus size={18} strokeWidth={3} /> Laporkan Masalah
        </Button>
      </div>

      {!dbAktif && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-kunyit-500/40 bg-kunyit-100/50 px-4 py-3 text-sm text-kunyit-600">
          <WifiOff size={16} /> Database belum tersambung — atur env Supabase lalu jalankan
          schema.sql (lihat README).
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label className="relative">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={kueri}
            onChange={(e) => setKueri(e.target.value)}
            placeholder="Cari judul atau isi laporan…"
            className="w-64 rounded-full border garis-halus bg-panel py-2 pl-9 pr-3 text-sm outline-none transition focus:border-daun-500 focus:ring-4 focus:ring-daun-500/15"
          />
        </label>

        {KATEGORI.map((k) => (
          <button
            key={k.slug}
            onClick={() =>
              setFKategori((s) =>
                s.includes(k.slug) ? s.filter((x) => x !== k.slug) : [...s, k.slug]
              )
            }
            aria-pressed={fKategori.includes(k.slug)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              fKategori.includes(k.slug)
                ? "border-transparent text-white"
                : "garis-halus bg-panel text-muted hover:text-ink"
            }`}
            style={
              fKategori.includes(k.slug)
                ? { backgroundColor: k.warna }
                : undefined
            }
          >
            {k.emoji} {k.nama}
          </button>
        ))}

        {(Object.keys(STATUS) as StatusKey[]).map((s) => (
          <button
            key={s}
            onClick={() =>
              setFStatus((arr) =>
                arr.includes(s) ? arr.filter((x) => x !== s) : [...arr, s]
              )
            }
            aria-pressed={fStatus.includes(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              fStatus.includes(s)
                ? STATUS[s].chip + " ring-2 ring-current"
                : "garis-halus bg-panel text-muted hover:text-ink"
            }`}
          >
            ● {STATUS[s].label}
          </button>
        ))}
      </div>

      <div className="grid h-[68dvh] min-h-[480px] gap-4 lg:grid-cols-[1fr_360px]">
        <Card className="overflow-hidden p-0">
          <LeafletMap
            titik={titikPeta}
            terpilih={terpilihId}
            onKlikTitik={(id) => setTerpilihId(id)}
          />
        </Card>

        <aside className="hidden flex-col gap-3 overflow-y-auto pr-1 lg:flex" aria-label="Daftar laporan">
          <AnimatePresence initial={false}>
            {tersaring.slice(0, 40).map((r) => (
              <motion.div
                key={r.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <Card
                  onClick={() => setTerpilihId(r.id)}
                  className={`cursor-pointer p-4 transition hover:border-daun-400 ${
                    terpilihId === r.id ? "ring-2 ring-daun-500" : ""
                  }`}
                >
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: r.categories?.warna }}>
                      {r.categories?.emoji} {r.categories?.nama ?? "Lainnya"}
                    </span>
                    <span className="text-xs text-muted">{waktuRelatif(r.created_at)}</span>
                  </div>
                  <h3 className="font-display font-bold leading-snug">{r.judul}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{r.deskripsi}</p>
                  <div className="mt-2.5 flex items-center gap-3 text-xs text-muted">
                    <StatusChip status={r.status} />
                    <span>👍 {r.vote_count}</span>
                    <span>💬 {r.comment_count}</span>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
          {tersaring.length === 0 && (
            <Card className="flex flex-col items-center gap-2 p-8 text-center text-muted">
              <MapPinOff size={28} />
              <p className="text-sm">
                Belum ada laporan yang cocok. Jadilah yang pertama melapor!
              </p>
            </Card>
          )}
        </aside>
      </div>

      <Modal
        terbuka={!!terpilih}
        tutup={() => setTerpilihId(null)}
        judul={terpilih?.judul ?? ""}
      >
        {terpilih && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusChip status={terpilih.status} />
              <span
                className="rounded-full px-2.5 py-1 text-xs font-semibold"
                style={{
                  backgroundColor: `${terpilih.categories?.warna}22`,
                  color: terpilih.categories?.warna,
                }}
              >
                {terpilih.categories?.emoji} {kategoriBySlug(terpilih.categories?.slug ?? "").nama}
              </span>
              <span className="text-xs text-muted">
                👍 {terpilih.vote_count} · 💬 {terpilih.comment_count}
              </span>
            </div>
            <p className="whitespace-pre-line text-sm leading-relaxed">{terpilih.deskripsi}</p>
            {terpilih.foto_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={terpilih.foto_url} alt={terpilih.judul} className="max-h-64 w-full rounded-xl object-cover" />
            )}
            <Link href={`/laporan/${terpilih.id}`} className="block pt-1">
              <Button className="w-full">Buka halaman lengkap →</Button>
            </Link>
          </div>
        )}
      </Modal>

      <Modal terbuka={modalBuka} tutup={() => setModalBuka(false)} judul="Laporkan masalah baru" lebar="max-w-2xl">
        <BuatLaporanFormulir
          selesai={() => {
            setModalBuka(false);
          }}
        />
      </Modal>
    </main>
  );
}
