"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { BarChart3, Check, Plus, TriangleAlert, Users, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/use-user";
import type { Poll } from "./page";
import { Button, Input, Label, Skeleton } from "@/components/ui";
import { KacaKartu, KacaPill } from "@/components/eksperimen/kaca";

/* Grammar Apple (FUSI): kartu utilitas putih hairline radius 18;
   sorotan memakai KacaKartu; fokus Action Blue; target sentuh 44px. */
const KARTU_UTILITAS =
  "rounded-[18px] border border-ap-hairline bg-white shadow-none dark:border-line dark:bg-panel dark:text-ink";
const FOKUS_APPLE =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus!";
const TOMBOL_UTAMA_APPLE =
  "min-h-[44px] bg-ap-blue text-white shadow-none hover:bg-ap-blue-focus focus-visible:outline-ap-blue-focus!";
const TOMBOL_SEKUNDER_APPLE =
  "min-h-[44px] hover:border-ap-blue hover:text-ap-blue focus-visible:outline-ap-blue-focus! dark:hover:text-ap-sky";
const INPUT_APPLE =
  "focus:border-ap-blue focus:ring-ap-blue/15 focus-visible:outline-ap-blue-focus!";

export function GalatPolling() {
  const router = useRouter();
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-center">
      <div className={`${KARTU_UTILITAS} p-8`}>
        <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-[18px] bg-danger/10 text-danger">
          <TriangleAlert size={26} strokeWidth={1.8} />
        </span>
        <h1 className="font-display text-2xl font-bold">
          Polling Warga belum bisa dimuat
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
          Suaramu tetap aman. Daftar polling gagal dimuat karena koneksi
          terputus.
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

/* Skeleton muat polling: tanpa ilustrasi karena ini muat. */
export function MuatPolling() {
  return (
    <div aria-busy="true" className="space-y-5">
      <p role="status" className="sr-only">
        Memuat polling warga
      </p>
      {[0, 1].map((i) => (
        <div key={i} className={`${KARTU_UTILITAS} p-6`}>
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="mt-4 h-11 w-full rounded-full" />
          <Skeleton className="mt-2 h-11 w-full rounded-full" />
        </div>
      ))}
    </div>
  );
}

function PersenBar({  persen,
  terpilih,
  label,
  jumlah,
}: {
  persen: number;
  terpilih: boolean;
  label: string;
  jumlah: number;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-ap-hairline bg-ap-parchment/80 px-4 py-2.5 backdrop-blur dark:border-line dark:bg-panel-2">
      <motion.div
        className="absolute inset-y-0 left-0 bg-daun-500/15"
        initial={{ width: 0 }}
        animate={{ width: `${persen}%` }}
        transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
      />
      {terpilih && (
        <motion.div
          className="absolute inset-y-0 left-0 bg-daun-600/25"
          initial={{ width: 0 }}
          animate={{ width: `${persen}%` }}
          transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
        />
      )}
      <div className="relative flex items-center justify-between gap-3 text-sm">
        <span className="flex items-center gap-2 font-medium">
          {terpilih && <Check size={14} className="shrink-0 text-daun-700 dark:text-daun-300" />}
          {label}
        </span>
        <span className="angka-tabular shrink-0 font-bold text-muted">
          {persen}% · {jumlah}
        </span>
      </div>
    </div>
  );
}

function KartuPolling({ poll, masuk }: { poll: Poll; masuk: boolean }) {
  const router = useRouter();
  const { user: pengguna } = useUser();
  const [data, setData] = useState(poll);
  const [prevPoll, setPrevPoll] = useState(poll);
  if (poll !== prevPoll) {
    setPrevPoll(poll);
    setData(poll);
  }
  const [proses, setProses] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const ch = supabase
      .channel(`poll-${poll.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "poll_votes",
          filter: `poll_id=eq.${poll.id}`,
        },
        (payload) => {
          const baru = payload.new as { opsi_idx: number; user_id: string };
          // Suara sendiri sudah dihitung optimistis di pilih()
          if (baru.user_id && baru.user_id === pengguna?.id) return;
          setData((d) => {
            const perOpsi = [...d.perOpsi];
            perOpsi[baru.opsi_idx] = (perOpsi[baru.opsi_idx] ?? 0) + 1;
            return { ...d, perOpsi, totalSuara: d.totalSuara + 1 };
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "poll_votes",
          filter: `poll_id=eq.${poll.id}`,
        },
        (payload) => {
          const lama = payload.old as { opsi_idx: number };
          setData((d) => {
            const perOpsi = [...d.perOpsi];
            perOpsi[lama.opsi_idx] = Math.max(
              0,
              (perOpsi[lama.opsi_idx] ?? 0) - 1
            );
            return { ...d, perOpsi, totalSuara: Math.max(0, d.totalSuara - 1) };
          });
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [poll.id, pengguna?.id]);

  async function pilih(idx: number) {
    if (!masuk || proses || data.pilihanKu !== null) return;
    setProses(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setProses(false);
      return;
    }
    setData((d) => {
      const perOpsi = [...d.perOpsi];
      perOpsi[idx] = (perOpsi[idx] ?? 0) + 1;
      return { ...d, perOpsi, totalSuara: d.totalSuara + 1, pilihanKu: idx };
    });
    const { error } = await supabase
      .from("poll_votes")
      .insert({ poll_id: data.id, user_id: user.id, opsi_idx: idx });
    if (error) {
      setData((d) => {
        const perOpsi = [...d.perOpsi];
        perOpsi[idx] = Math.max(0, (perOpsi[idx] ?? 0) - 1);
        return {
          ...d,
          perOpsi,
          totalSuara: Math.max(0, d.totalSuara - 1),
          pilihanKu: null,
        };
      });
    } else {
      router.refresh();
    }
    setProses(false);
  }

  const sudahVote = data.pilihanKu !== null;

  return (
    <div className={`${KARTU_UTILITAS} p-6`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <h2 className="font-display text-lg font-bold leading-snug">
          {data.pertanyaan}
        </h2>
        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-ap-parchment px-2.5 py-1 text-xs font-semibold text-muted dark:bg-panel-2">
          <Users size={12} />
          <span className="angka-tabular">{data.totalSuara}</span>
        </span>
      </div>

      <div className="space-y-2">
        {sudahVote || !masuk
          ? data.opsi.map((o, i) => {
              const jumlah = data.perOpsi[i] ?? 0;
              const persen = data.totalSuara
                ? Math.round((jumlah / data.totalSuara) * 100)
                : 0;
              return (
                <PersenBar
                  key={i}
                  label={o}
                  jumlah={jumlah}
                  persen={persen}
                  terpilih={data.pilihanKu === i}
                />
              );
            })
          : data.opsi.map((o, i) => (
              <button
                key={i}
                onClick={() => pilih(i)}
                disabled={proses}
                className={`min-h-[44px] w-full rounded-full border border-ap-hairline bg-white px-4 py-2.5 text-left text-sm font-medium transition hover:border-ap-blue hover:bg-ap-blue/5 disabled:opacity-50 dark:border-line dark:bg-panel ${FOKUS_APPLE}`}
              >
                {o}
              </button>
            ))}
      </div>

      <p className="mt-3 text-xs text-muted">
        {!masuk
          ? "Masuk untuk memberi suara."
          : sudahVote
            ? "Terima kasih — suaramu tercatat."
            : "Klik salah satu opsi untuk memberi suara."}
      </p>
    </div>
  );
}

function FormBuatPolling({
  tutup,
  selesai,
}: {
  tutup: () => void;
  selesai: (baru?: Poll) => void;
}) {
  const [pertanyaan, setPertanyaan] = useState("");
  const [opsi, setOpsi] = useState(["", ""]);
  const [proses, setProses] = useState(false);
  const [pesan, setPesan] = useState<string | null>(null);

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    const bersih = opsi.map((o) => o.trim()).filter(Boolean);
    if (bersih.length < 2) {
      setPesan("Minimal 2 opsi terisi.");
      return;
    }
    setProses(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("polls")
      .insert({
        pertanyaan,
        opsi: bersih,
        created_by: user?.id ?? null,
      })
      .select("id, pertanyaan, opsi")
      .single();
    setProses(false);
    if (error) {
      setPesan(error.message);
      return;
    }
    const baru: Poll = {
      id: data.id,
      pertanyaan: data.pertanyaan,
      opsi: data.opsi as string[],
      totalSuara: 0,
      perOpsi: (data.opsi as string[]).map(() => 0),
      pilihanKu: null,
      buatanKu: true,
    };
    selesai(baru);
  }

  return (
    <form onSubmit={kirim} className="space-y-4">
      <div>
        <Label htmlFor="p-pertanyaan">Pertanyaan</Label>
        <Input
          id="p-pertanyaan"
          required
          minLength={10}
          maxLength={300}
          value={pertanyaan}
          onChange={(e) => setPertanyaan(e.target.value)}
          placeholder="Pertanyaan untuk warga…"
          className={INPUT_APPLE}
        />
      </div>
      {opsi.map((o, i) => (
        <div key={i}>
          <Label htmlFor={`p-opsi-${i}`}>Opsi {i + 1}</Label>
          <div className="flex gap-2">
            <Input
              id={`p-opsi-${i}`}
              required
              value={o}
              onChange={(e) =>
                setOpsi((arr) => arr.map((x, j) => (j === i ? e.target.value : x)))
              }
              className={INPUT_APPLE}
            />
            {opsi.length > 2 && (
              <Button
                type="button"
                variant="hantu"
                onClick={() => setOpsi((arr) => arr.filter((_, j) => j !== i))}
                aria-label="Hapus opsi"
                className={`min-h-[44px] min-w-[44px] ${FOKUS_APPLE}`}
              >
                <X size={15} />
              </Button>
            )}
          </div>
        </div>
      ))}
      {opsi.length < 6 && (
        <Button
          type="button"
          variant="sekunder"
          size="sm"
          className={TOMBOL_SEKUNDER_APPLE}
          onClick={() => setOpsi((arr) => [...arr, ""])}
        >
          <Plus size={14} /> Tambah opsi
        </Button>
      )}
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
          {proses ? "Menyimpan…" : "Terbitkan polling"}
        </Button>
      </div>
    </form>
  );
}

export function PollingKlien({
  awal,
  isAdmin,
  masuk,
}: {
  awal: Poll[];
  isAdmin: boolean;
  masuk: boolean;
}) {
  const router = useRouter();
  const [polls, setPolls] = useState(awal);
  const [prevAwal, setPrevAwal] = useState(awal);
  if (awal !== prevAwal) {
    setPrevAwal(awal);
    setPolls(awal);
  }
  const [formBuka, setFormBuka] = useState(false);

  return (
    <div>
      {isAdmin && (
        <div className="mb-6">
          {formBuka ? (
            <KacaKartu className="p-5">
              <h2 className="mb-4 flex items-center gap-2 font-display font-bold">
                <BarChart3 size={17} /> Polling baru
              </h2>
              <FormBuatPolling
                tutup={() => setFormBuka(false)}
                selesai={(baru) => {
                  if (baru) setPolls((s) => [baru, ...s]);
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
                <Plus size={15} /> Buat polling baru
              </span>
            </KacaPill>
          )}
        </div>
      )}

      <div className="space-y-5">
        <AnimatePresence initial={false}>
          {polls.map((p) => (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <KartuPolling poll={p} masuk={masuk} />
            </motion.div>
          ))}
        </AnimatePresence>
        {polls.length === 0 && (
          <div className={`${KARTU_UTILITAS} p-8 text-center`}>
            <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-[18px] bg-ap-blue/10 text-ap-blue dark:text-ap-sky">
              <BarChart3 size={26} strokeWidth={1.8} />
            </span>
            <h2 className="font-display text-lg font-bold">
              Belum ada polling aktif
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
              Kamu belum ketinggalan suara apa pun. Polling baru akan muncul
              di sini. Kalau kamu pengurus, buat polling pertama untuk meminta
              pendapat warga.
            </p>
            {isAdmin && !formBuka && (
              <KacaPill
                type="button"
                onClick={() => setFormBuka(true)}
                className={`mt-5 min-h-[44px] ${FOKUS_APPLE}`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Plus size={15} /> Buat polling baru
                </span>
              </KacaPill>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
