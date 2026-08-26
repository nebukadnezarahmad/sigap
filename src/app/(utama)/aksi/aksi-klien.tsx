"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { CalendarDays, MapPin, Plus, Users } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { EventAksi } from "./page";
import {
  Button,
  Card,
  Input,
  KosongState,
  Label,
  Textarea,
} from "@/components/ui";
// `Modal` sebelumnya diimpor tapi tidak pernah dipakai — formnya dirender
// inline di dalam Card, bukan di modal.
import { formatTanggal } from "@/lib/utils";

function apakahLewat(tanggal: string) {
  return new Date(tanggal).getTime() < Date.now();
}

function KartuAksi({ event, masuk }: { event: EventAksi; masuk: boolean }) {
  const router = useRouter();
  const [data, setData] = useState(event);
  const [proses, setProses] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const ch = supabase
      .channel(`rsvp-${data.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "event_rsvp",
          filter: `event_id=eq.${data.id}`,
        },
        () => {
          setData((d) =>
            d.totalRsvp === event.totalRsvp
              ? { ...d, totalRsvp: d.totalRsvp + 1 }
              : d
          );
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [data.id, event.totalRsvp]);

  async function toggle() {
    if (!masuk || proses) return;
    setProses(true);
    const supabase = createClient();
    if (data.akuIkut) {
      await supabase.from("event_rsvp").delete().match({ event_id: data.id });
      setData((d) => ({ ...d, akuIkut: false, totalRsvp: d.totalRsvp - 1 }));
    } else {
      await supabase.from("event_rsvp").insert({ event_id: data.id });
      setData((d) => ({ ...d, akuIkut: true, totalRsvp: d.totalRsvp + 1 }));
      router.refresh();
    }
    setProses(false);
  }

  // Dulu bernama `dekat` padahal isinya "sudah lewat" — nama yang menyesatkan
  // pembacanya ke arah berlawanan dari maknanya.
  const sudahLewat = apakahLewat(data.tanggal);

  return (
    <Card
      variant={sudahLewat ? "datar" : "kartu"}
      className={`overflow-hidden p-0 ${sudahLewat ? "opacity-70" : ""}`}
    >
      <div className="flex items-stretch">
        {/* Blok tanggal kalender diredam kalau acaranya sudah lewat — dulu
            acara lampau tampil penuh warna dan hanya tombolnya yang mati. */}
        <div
          className={`flex w-20 shrink-0 flex-col items-center justify-center py-4 ${
            sudahLewat
              ? "bg-line/50 text-muted dark:bg-line"
              : "bg-daun-600/10 text-daun-800 dark:text-daun-200"
          }`}
        >
          <span className="angka-tabular font-display text-2xl font-extrabold leading-none">
            {new Date(data.tanggal).getDate()}
          </span>
          <span className="text-xs font-bold uppercase">
            {new Date(data.tanggal).toLocaleDateString("id-ID", { month: "short" })}
          </span>
        </div>
        <div className="min-w-0 flex-1 p-5">
          <h2 className="font-display font-bold leading-snug">
            {data.judul}
            {sudahLewat && (
              <span className="ml-2 align-middle rounded-kontrol bg-panel-2 px-2 py-0.5 text-mikro font-semibold uppercase text-muted">
                Selesai
              </span>
            )}
          </h2>
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
              onClick={toggle}
              disabled={!masuk || proses || sudahLewat}
            >
              {sudahLewat
                ? "Sudah lewat"
                : data.akuIkut
                  ? "Kamu ikut"
                  : "Ikut aksi ini"}
            </Button>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-muted">
              <Users size={13} />
              <span className="angka-tabular">{data.totalRsvp}</span> warga ikut
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

function FormAksi({ tutup, selesai }: { tutup: () => void; selesai: () => void }) {
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
    const { error } = await supabase.from("events").insert({
      judul,
      deskripsi,
      alamat: alamat.trim() || null,
      tanggal: new Date(tanggal).toISOString(),
    });
    setProses(false);
    if (error) {
      setPesan(error.message);
      return;
    }
    selesai();
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
          />
        </div>
        <div>
          <Label htmlFor="e-alamat">Lokasi</Label>
          <Input
            id="e-alamat"
            value={alamat}
            onChange={(e) => setAlamat(e.target.value)}
            placeholder="Alamat titik kumpul"
          />
        </div>
      </div>
      {pesan && (
        <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
          {pesan}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="sekunder" onClick={tutup}>
          Batal
        </Button>
        <Button type="submit" disabled={proses}>
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
  const [events] = useState(awal);
  const [formBuka, setFormBuka] = useState(false);

  const mendatang = events.filter((e) => !apakahLewat(e.tanggal));
  const lewat = events.filter((e) => apakahLewat(e.tanggal));

  return (
    <div>
      {masuk && (
        <div className="mb-6">
          {formBuka ? (
            <Card className="p-5">
              <h2 className="mb-4 flex items-center gap-2 font-display font-bold">
                <Plus size={17} /> Buat aksi baru
              </h2>
              <FormAksi
                tutup={() => setFormBuka(false)}
                selesai={() => {
                  setFormBuka(false);
                  router.refresh();
                }}
              />
            </Card>
          ) : (
            <Button variant="sekunder" onClick={() => setFormBuka(true)}>
              <Plus size={15} /> Buat aksi bersama
            </Button>
          )}
        </div>
      )}

      {/* Mendatang dan sudah lewat dipisah: keduanya dulu bercampur dalam satu
          daftar dan hanya dibedakan oleh tombol yang mati. */}
      {mendatang.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-sans text-mikro font-semibold uppercase text-muted">
            Mendatang
          </h2>
          <AnimatePresence initial={false}>
            {/* Key sebelumnya menyertakan totalRsvp & akuIkut, sehingga setiap
                RSVP memicu unmount+mount — kartunya berkedip. */}
            {mendatang.map((e) => (
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
        </section>
      )}

      {lewat.length > 0 && (
        <section className="mt-10 space-y-4">
          <h2 className="font-sans text-mikro font-semibold uppercase text-muted">
            Sudah lewat
          </h2>
          {lewat.map((e) => (
            <KartuAksi key={e.id} event={e} masuk={masuk} />
          ))}
        </section>
      )}

      {events.length === 0 && (
        <Card>
          <KosongState
            ikon={<CalendarDays size={24} strokeWidth={1.6} />}
            judul="Belum ada aksi bersama"
            isi={
              masuk
                ? "Sabtu bersih, lokakarya komposting, kerja bakti drainase — prakarsai yang pertama dan ajak tetangga."
                : "Kegiatan warga akan muncul di sini. Masuk untuk memprakarsai aksi pertamamu."
            }
            aksi={
              masuk ? (
                <Button size="sm" onClick={() => setFormBuka(true)}>
                  <Plus size={14} aria-hidden /> Buat aksi bersama
                </Button>
              ) : (
                <Link
                  href="/masuk?next=/aksi"
                  className="rounded-kontrol bg-daun-600 px-5 py-2.5 text-sm font-semibold text-white transition-[transform,background-color] duration-300 ease-sigap hover:bg-daun-700 active:scale-[0.97]"
                >
                  Masuk
                </Link>
              )
            }
          />
        </Card>
      )}
    </div>
  );
}

