"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  Crosshair,
  MapPinOff,
  Play,
  Plus,
  Search,
  WifiOff,
} from "lucide-react";
import type { LaporanDenganRelasi } from "@/types/database";
import { KATEGORI, STATUS, kategoriBySlug, type StatusKey } from "@/lib/constants";
import { IkonKategori } from "@/lib/ikon-vektor";
import { History, MessageSquare, ThumbsUp } from "lucide-react";
import { waktuRelatif } from "@/lib/utils";
import { StatusChip, Button, Card } from "@/components/ui";
import { Modal } from "@/components/modal";
import { createClient } from "@/lib/supabase/client";
import { BuatLaporanFormulir } from "./buat-laporan";
import { TurPeta } from "./tur-peta";

const LeafletMap = dynamic(
  () => import("./leaflet-map").then((m) => m.LeafletMap),
  {
    ssr: false,
    loading: () => <div className="h-full w-full animate-pulse bg-panel-2" />,
  }
);

const BULAN = (() => {
  const out: { label: string; akhir: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    d.setMonth(d.getMonth() + 1);
    d.setHours(0, 0, 0, 0);
    out.push({
      label: d.toLocaleDateString("id-ID", { month: "short" }),
      akhir: new Date(d.getTime() - 1).toISOString(),
    });
  }
  return out;
})();

function jarakMeter(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function Jelajah({
  laporanAwal,
  dbAktif,
}: {
  laporanAwal: LaporanDenganRelasi[];
  dbAktif: boolean;
}) {
  const params = useSearchParams();
  const [laporan, setLaporan] = useState(laporanAwal);
  const [terpilihId, setTerpilihId] = useState<string | null>(null);
  const [kueri, setKueri] = useState("");
  const [fKategori, setFKategori] = useState<string[]>([]);
  const [fStatus, setFStatus] = useState<StatusKey[]>([]);
  const [modalBuka, setModalBuka] = useState(
    () => params.get("lapor") === "1"
  );
  const [realtimeAktif, setRealtimeAktif] = useState(false);
  const [periodeIdx, setPeriodeIdx] = useState<number | null>(null);
  const [mainkan, setMainkan] = useState(false);
  const [pusatSaya, setPusatSaya] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [cariLokasi, setCariLokasi] = useState(false);

  useEffect(() => {
    if (!mainkan || periodeIdx === null) return;
    const t = setInterval(() => {
      setPeriodeIdx((i) => {
        if (i === null || i >= BULAN.length - 1) {
          setMainkan(false);
          return i;
        }
        return i + 1;
      });
    }, 900);
    return () => clearInterval(t);
  }, [mainkan, periodeIdx]);

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
            s.map((r) => (r.id === upd.id ? { ...r, status: upd.status } : r))
          );
        }
      )
      .subscribe((st) => setRealtimeAktif(st === "SUBSCRIBED"));

    return () => {
      void supabase.removeChannel(ch1);
    };
  }, [dbAktif]);

  const tersaring = useMemo(() => {
    return laporan.filter((r) => {
      if (
        periodeIdx !== null &&
        new Date(r.created_at) > new Date(BULAN[periodeIdx].akhir)
      )
        return false;
      if (pusatSaya && r.lat != null && r.lng != null) {
        if (jarakMeter(pusatSaya, { lat: r.lat, lng: r.lng }) > 2000) return false;
      }
      if (
        fKategori.length &&
        !fKategori.includes(r.categories?.slug ?? "lainnya")
      )
        return false;
      if (fStatus.length && !fStatus.includes(r.status)) return false;
      if (
        kueri &&
        !`${r.judul} ${r.deskripsi}`.toLowerCase().includes(kueri.toLowerCase())
      )
        return false;
      return true;
    });
  }, [laporan, fKategori, fStatus, kueri, periodeIdx, pusatSaya]);

  const titikPeta = useMemo(
    () =>
      tersaring
        .filter((r) => r.lat != null && r.lng != null)
        .map((r) => ({
          id: r.id,
          lat: r.lat as number,
          lng: r.lng as number,
          warna:
            r.categories?.warna ??
            STATUS[r.status as StatusKey]?.warna ??
            "#64748b",
          slug: r.categories?.slug ?? "lainnya",
          judul: r.judul,
        })),
    [tersaring]
  );

  const terpilih = laporan.find((r) => r.id === terpilihId) ?? null;

  function aktifkanSekitarSaya() {
    if (pusatSaya) {
      setPusatSaya(null);
      return;
    }
    setCariLokasi(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPusatSaya({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setCariLokasi(false);
      },
      () => setCariLokasi(false),
      { timeout: 8000 }
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 pb-10 pt-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">
            Peta Masalah Permukiman
          </h1>
          <p className="text-sm text-muted">
            {tersaring.length} laporan ditampilkan ·{" "}
            <span
              className={`inline-flex items-center gap-1 ${
                realtimeAktif ? "text-daun-600 dark:text-daun-400" : ""
              }`}
            >
              <span
                className={`size-1.5 rounded-full ${
                  realtimeAktif ? "animate-pulse bg-daun-500" : "bg-muted"
                }`}
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
          <WifiOff size={16} /> Database belum tersambung — atur env Supabase lalu
          jalankan schema.sql (lihat README).
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label className="relative">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            value={kueri}
            onChange={(e) => setKueri(e.target.value)}
            placeholder="Cari judul atau isi laporan…"
            className="w-64 rounded-full border garis-halus bg-panel py-2 pl-9 pr-3 text-sm outline-none transition focus:border-daun-500 focus:ring-4 focus:ring-daun-500/15"
          />
        </label>

        <button
          onClick={aktifkanSekitarSaya}
          aria-pressed={!!pusatSaya}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition ${
            pusatSaya
              ? "border-transparent bg-daun-600 text-white"
              : "garis-halus bg-panel text-muted hover:text-ink"
          }`}
        >
          <Crosshair size={14} />
          {cariLokasi
            ? "Mencari lokasi…"
            : pusatSaya
              ? "≤ 2 km dari saya ✕"
              : "Di sekitar saya"}
        </button>

        {KATEGORI.map((k) => (
          <button
            key={k.slug}
            onClick={() =>
              setFKategori((s) =>
                s.includes(k.slug)
                  ? s.filter((x) => x !== k.slug)
                  : [...s, k.slug]
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
            <IkonKategori slug={k.slug} ukuran={14} />
            {k.nama}
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

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border garis-halus bg-panel px-4 py-3">
        <button
          onClick={() => {
            if (periodeIdx === null) setPeriodeIdx(BULAN.length - 1);
            else {
              setPeriodeIdx(null);
              setMainkan(false);
            }
          }}
          aria-pressed={periodeIdx !== null}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            periodeIdx !== null
              ? "bg-daun-600 text-white"
              : "garis-halus bg-panel-2 text-muted hover:text-ink"
          }`}
        >
          <History size={14} className="inline" /> Garis waktu
        </button>
        {periodeIdx !== null && (
          <>
            <button
              onClick={() => setMainkan((v) => !v)}
              aria-label={mainkan ? "Jeda" : "Putar"}
              className="flex size-7 items-center justify-center rounded-full bg-daun-600 text-white transition hover:bg-daun-700"
            >
              {mainkan ? <span className="text-[10px]">■</span> : <Play size={13} />}
            </button>
            <input
              type="range"
              min={0}
              max={BULAN.length - 1}
              value={periodeIdx}
              onChange={(e) => setPeriodeIdx(Number(e.target.value))}
              className="w-48 accent-daun-600"
              aria-label="Pilih periode waktu"
            />
            <span className="text-xs font-semibold text-muted">
              s.d. {BULAN[periodeIdx].label} ·{" "}
              <span className="angka-tabular">{tersaring.length}</span> laporan
              kumulatif
            </span>
          </>
        )}
      </div>

      <div className="grid h-[64dvh] min-h-[460px] grid-rows-[minmax(0,1fr)] gap-4 lg:grid-cols-[1fr_360px]">
        <Card className="relative min-h-0 overflow-hidden p-0">
          <LeafletMap
            titik={titikPeta}
            terpilih={terpilihId}
            pusat={
              pusatSaya ? [pusatSaya.lat, pusatSaya.lng] : undefined
            }
            zoom={pusatSaya ? 15 : undefined}
            onKlikTitik={(id) => setTerpilihId(id)}
          />
          {periodeIdx !== null && (
            <div className="pointer-events-none absolute left-3 top-3 z-[500] rounded-xl bg-panel/90 px-3 py-1.5 font-display text-sm font-bold shadow backdrop-blur">
              <History size={13} className="inline align-[-2px]" /> s.d.{" "}
              {BULAN[periodeIdx].label}
            </div>
          )}
        </Card>

        <aside
          className="hidden min-h-0 flex-col gap-3 overflow-y-auto pr-1 lg:flex"
          aria-label="Daftar laporan"
        >
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
                    <span
                      className="flex items-center gap-1.5 text-xs font-semibold"
                      style={{ color: r.categories?.warna }}
                    >
                      <IkonKategori slug={r.categories?.slug ?? "lainnya"} ukuran={13} />
                      {r.categories?.nama ?? "Lainnya"}
                    </span>
                    <span className="text-xs text-muted" suppressHydrationWarning>
                      {waktuRelatif(r.created_at)}
                    </span>
                  </div>
                  <h3 className="font-display font-bold leading-snug">
                    {r.judul}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">
                    {r.deskripsi}
                  </p>
                  <div className="mt-2.5 flex items-center gap-3 text-xs text-muted">
                    <StatusChip status={r.status} />
                    <span className="flex items-center gap-1">
                      <ThumbsUp size={11} /> {r.vote_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare size={11} /> {r.comment_count}
                    </span>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
          {tersaring.length === 0 && (
            <Card className="flex flex-col items-center gap-2 p-8 text-center text-muted">
              <MapPinOff size={28} />
              <p className="text-sm">
                {periodeIdx !== null
                  ? `Belum ada laporan hingga ${BULAN[periodeIdx].label}.`
                  : "Belum ada laporan yang cocok. Jadilah yang pertama melapor!"}
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
                <IkonKategori slug={terpilih.categories?.slug ?? "lainnya"} ukuran={13} />{" "}
                {kategoriBySlug(terpilih.categories?.slug ?? "").nama}
              </span>
              <span className="text-xs text-muted">
                <span className="flex items-center gap-1">
                  <ThumbsUp size={12} /> {terpilih.vote_count}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare size={12} /> {terpilih.comment_count}
                </span>
              </span>
            </div>
            <p className="whitespace-pre-line text-sm leading-relaxed">
              {terpilih.deskripsi}
            </p>
            {terpilih.foto_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={terpilih.foto_url}
                alt={terpilih.judul}
                className="max-h-64 w-full rounded-xl object-cover"
              />
            )}
            <Link href={`/laporan/${terpilih.id}`} className="block pt-1">
              <Button className="w-full">Buka halaman lengkap →</Button>
            </Link>
          </div>
        )}
      </Modal>

      <Modal
        terbuka={modalBuka}
        tutup={() => setModalBuka(false)}
        judul="Laporkan masalah baru"
        lebar="max-w-2xl"
      >
        <BuatLaporanFormulir
          selesai={() => {
            setModalBuka(false);
          }}
        />
      </Modal>

      <TurPeta />
    </main>
  );
}
