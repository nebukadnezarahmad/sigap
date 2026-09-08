"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { CalendarDays, MapPin, Plus, TriangleAlert, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/use-user";
import type { EventAksi } from "./page";
import { Button, Input, Label, Skeleton, Textarea } from "@/components/ui";
import { KacaKartu, KacaPill } from "@/components/eksperimen/kaca";
import { formatBulan, formatTanggal } from "@/lib/utils";

function apakahLewat(tanggal: string) {
  return new Date(tanggal).getTime() < Date.now();
}

/* Grammar Apple (FUSI): kartu utilitas putih hairline radius 18;
   sorotan memakai KacaKartu; fokus Action Blue; target sentuh 44px. */
const KARTU_UTILITAS =
  "rounded-[18px] border border-ap-hairline bg-white shadow-none dark:border-line dark:bg-panel dark:text-ink";
const FOKUS_APPLE =
  "focus-visible:outline-ap-blue-focus! focus-visible:outline-offset-2";
const TOMBOL_UTAMA_APPLE =
  "min-h-[44px] bg-ap-blue text-white shadow-none hover:bg-ap-blue-focus focus-visible:outline-ap-blue-focus!";
const TOMBOL_SEKUNDER_APPLE =
  "min-h-[44px] hover:border-ap-blue hover:text-ap-blue focus-visible:outline-ap-blue-focus! dark:hover:text-ap-sky";
const INPUT_APPLE =
  "focus:border-ap-blue focus:ring-ap-blue/15 focus-visible:outline-ap-blue-focus!";

export function GalatAksi() {
  const router = useRouter();
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-center">
      <div className={`${KARTU_UTILITAS} p-8`}>
        <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-[18px] bg-danger/10 text-danger">
          <TriangleAlert size={26} strokeWidth={1.8} />
        </span>
        <h1 className="font-display text-2xl font-bold">
          Aksi Bersama belum bisa dimuat
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
          Kamu tidak ketinggalan ajakan apa pun. Daftar aksi gagal dimuat
          karena koneksi terputus.
        </p>
        <ol className="mx-auto mt-4 max-w-md space-y-1 text-left text-sm text-muted">
          <li>1. Periksa koneksi internet kamu.</li>
          <li>2. Pilih Coba lagi di bawah.</li>
          <li>3. Kalau masih gagal, kembali lagi beberapa menit lagi.</li>
        </ol>
        <Button className={`mt-6 ${TOMBOL_UTAMA_APPLE}`} onClick={() => router.refresh()}>
          Coba lagi
        </Button>
      </div>
    </main>
  );
}

/* Skeleton muat aksi: tanpa ilustrasi karena ini muat. */
export function MuatAksi() {
  return (
    <div aria-busy="true" className="space-y-4">
      <p role="status" className="sr-only">
        Memuat aksi bersama
      </p>
      {[0, 1, 2].map((i) => (
        <div key={i} className={`${KARTU_UTILITAS} p-5`}>
          <div className="flex gap-4">
            <Skeleton className="h-16 w-16 shrink-0 rounded-2xl" />
            <div className="flex-1">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="mt-2 h-4 w-full" />
              <Skeleton className="mt-2 h-9 w-36 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function KartuAksi({ event, masuk }: { event: EventAksi; masuk: boolean }) {
  const router = useRouter();
  const { user: pengguna } = useUser();
  const [data, setData] = useState(event);
  const [prevEvent, setPrevEvent] = useState(event);
  if (event !== prevEvent) {
    setPrevEvent(event);
    setData(event);
  }
  const [proses, setProses] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const ch = supabase
      .channel(`rsvp-${event.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "event_rsvp",
          filter: `event_id=eq.${event.id}`,
        },
        (payload) => {
          // RSVP sendiri sudah dihitung optimistis di toggle()
          const baru = payload.new as { user_id: string };
          if (baru.user_id && baru.user_id === pengguna?.id) return;
          setData((d) => ({ ...d, totalRsvp: d.totalRsvp + 1 }));
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "event_rsvp",
          filter: `event_id=eq.${event.id}`,
        },
        (payload) => {
          const lama = payload.old as { user_id: string };
          if (lama.user_id && lama.user_id === pengguna?.id) return;
          setData((d) => ({
            ...d,
            totalRsvp: Math.max(0, d.totalRsvp - 1),
          }));
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [event.id, pengguna?.id]);

  async function toggle() {
    if (!masuk || proses) return;
    setProses(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setProses(false);
      return;
    }
    if (data.akuIkut) {
      const { error } = await supabase
        .from("event_rsvp")
        .delete()
        .match({ event_id: data.id, user_id: user.id });
      if (!error) {
        setData((d) => ({
          ...d,
          akuIkut: false,
          totalRsvp: Math.max(0, d.totalRsvp - 1),
        }));
      }
    } else {
      const { error } = await supabase
        .from("event_rsvp")
        .insert({ event_id: data.id, user_id: user.id });
      if (!error) {
        setData((d) => ({ ...d, akuIkut: true, totalRsvp: d.totalRsvp + 1 }));
      }
      router.refresh();
    }
    setProses(false);
  }

  const dekat = apakahLewat(data.tanggal);

  return (
    <div className={`${KARTU_UTILITAS} overflow-hidden p-0`}>
      <div className="flex items-stretch">
        <div className="flex w-20 shrink-0 flex-col items-center justify-center bg-ap-blue/10 py-4 text-ap-blue dark:text-ap-sky">
          <span className="angka-tabular font-display text-2xl font-extrabold leading-none">
            {new Date(data.tanggal).getDate()}
          </span>
          <span className="angka-tabular text-xs font-bold uppercase">
            {formatBulan(data.tanggal)}
          </span>
        </div>
        <div className="min-w-0 flex-1 p-5">
          <h2 className="font-display font-bold leading-snug">{data.judul}</h2>
          <p className="mt-1 line-clamp-2 text-sm text-muted">{data.deskripsi}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
            <span className="flex items-center gap-1">
              <CalendarDays size={12} />
              {formatTanggal(data.tanggal)} ·{" "}
              {new Date(data.tanggal).toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            {data.alamat && (
              <span className="flex items-center gap-1">
                <MapPin size={12} /> {data.alamat}
              </span>
            )}
            <span className="flex items-center gap-1">
              oleh {data.namaPembuat}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <Button
              variant={data.akuIkut ? "utama" : "sekunder"}
              size="sm"
              className={data.akuIkut ? TOMBOL_UTAMA_APPLE : TOMBOL_SEKUNDER_APPLE}
              onClick={toggle}
              disabled={!masuk || proses || dekat}
            >
              {dekat
                ? "Sudah lewat"
                : data.akuIkut
                  ? "Kamu ikut ✓"
                  : "Ikut aksi ini"}
            </Button>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-muted">
              <Users size={13} />
              <span className="angka-tabular">{data.totalRsvp}</span> warga ikut
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormAksi({ tutup, selesai }: { tutup: () => void; selesai: (baru?: EventAksi) => void }) {
  const [judul, setJudul] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [alamat, setAlamat] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [proses, setProses] = useState(false);
  const [pesan, setPesan] = useState<string | null>(null);

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    setProses(true);
    setPesan(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("events")
      .insert({
        judul,
        deskripsi,
        alamat: alamat.trim() || null,
        tanggal: new Date(tanggal).toISOString(),
        user_id: user?.id ?? null,
      })
      .select("id, judul, deskripsi, alamat, tanggal, user_id")
      .single();
    setProses(false);
    if (error) {
      setPesan(error.message);
      return;
    }
    selesai({
      id: data.id,
      judul: data.judul,
      deskripsi: data.deskripsi,
      alamat: data.alamat,
      tanggal: data.tanggal,
      totalRsvp: 0,
      akuIkut: false,
      pembuatKu: true,
      namaPembuat: "Kamu",
    });
  }

  return (
    <form onSubmit={kirim} className="space-y-4">
      <div>
        <Label htmlFor="e-judul">Judul aksi</Label>
        <Input
          id="e-judul"
          required
          minLength={5}
          maxLength={120}
          value={judul}
          onChange={(e) => setJudul(e.target.value)}
          placeholder="cth. Sabtu Bersih: Bengkel Sungai Sektor 4"
          className={INPUT_APPLE}
        />
      </div>
      <div>
        <Label htmlFor="e-deskripsi">Deskripsi</Label>
        <Textarea
          id="e-deskripsi"
          required
          rows={4}
          maxLength={2000}
          value={deskripsi}
          onChange={(e) => setDeskripsi(e.target.value)}
          placeholder="Rencana kegiatan, yang perlu dibawa, kuota…"
          className={INPUT_APPLE}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="e-tanggal">Tanggal & jam</Label>
          <Input
            id="e-tanggal"
            type="datetime-local"
            required
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className={INPUT_APPLE}
          />
        </div>
        <div>
          <Label htmlFor="e-alamat">Lokasi</Label>
          <Input
            id="e-alamat"
            value={alamat}
            onChange={(e) => setAlamat(e.target.value)}
            placeholder="Alamat titik kumpul"
            className={INPUT_APPLE}
          />
        </div>
      </div>
      {pesan && (
        <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
          {pesan}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="sekunder" className={TOMBOL_SEKUNDER_APPLE} onClick={tutup}>
          Batal
        </Button>
        <Button type="submit" className={TOMBOL_UTAMA_APPLE} disabled={proses}>
          {proses ? "Menyimpan…" : "Buat aksi"}
        </Button>
      </div>
    </form>
  );
}

export function AksiKlien({
  awal,
  masuk,
}: {
  awal: EventAksi[];
  masuk: boolean;
}) {
  const router = useRouter();
  const [events, setEvents] = useState(awal);
  const [prevAwal, setPrevAwal] = useState(awal);
  if (awal !== prevAwal) {
    setPrevAwal(awal);
    setEvents(awal);
  }
  const [formBuka, setFormBuka] = useState(false);

  return (
    <div>
      {masuk && (
        <div className="mb-6">
          {formBuka ? (
            <KacaKartu className="p-5">
              <h2 className="mb-4 flex items-center gap-2 font-display font-bold">
                <Plus size={17} /> Buat aksi baru
              </h2>
              <FormAksi
                tutup={() => setFormBuka(false)}
                selesai={(baru) => {
                  if (baru) setEvents((s) => [baru, ...s]);
                  setFormBuka(false);
                  router.refresh();
                }}
              />
            </KacaKartu>
          ) : (
            <KacaPill
              type="button"
              onClick={() => setFormBuka(true)}
              className={`min-h-[44px] ${FOKUS_APPLE}`}
            >
              <span className="inline-flex items-center gap-1.5">
                <Plus size={15} /> Buat aksi bersama
              </span>
            </KacaPill>
          )}
        </div>
      )}

      <div className="space-y-4">
        <AnimatePresence initial={false}>
          {events.map((e) => (
            <motion.div
              key={e.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <KartuAksi event={e} masuk={masuk} />
            </motion.div>
          ))}
        </AnimatePresence>
        {events.length === 0 && (
          <div className={`${KARTU_UTILITAS} p-8 text-center`}>
            <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-[18px] bg-ap-blue/10 text-ap-blue dark:text-ap-sky">
              <CalendarDays size={26} strokeWidth={1.8} />
            </span>
            <h2 className="font-display text-lg font-bold">
              Belum ada aksi mendatang
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
              Kamu bisa jadi pemrakarsa pertama. Buat aksi bersih lingkungan
              dan ajak tetanggamu ikut.
            </p>
            {masuk && !formBuka && (
              <KacaPill
                type="button"
                onClick={() => setFormBuka(true)}
                className={`mt-5 min-h-[44px] ${FOKUS_APPLE}`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Plus size={15} /> Buat aksi bersama
                </span>
              </KacaPill>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
