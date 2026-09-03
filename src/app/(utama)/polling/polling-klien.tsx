"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { BarChart3, Check, Plus, Users, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/use-user";
import type { Poll } from "./page";
import { Button, Card, Input, Label } from "@/components/ui";

function PersenBar({
  persen,
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
    <div className="relative overflow-hidden rounded-xl border garis-halus bg-panel-2 px-4 py-2.5">
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
    <Card className="p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <h2 className="font-display text-lg font-bold leading-snug">
          {data.pertanyaan}
        </h2>
        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-panel-2 px-2.5 py-1 text-xs font-semibold text-muted">
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
                className="w-full rounded-xl border garis-halus bg-panel-2 px-4 py-2.5 text-left text-sm font-medium transition hover:border-daun-400 hover:bg-daun-500/5 disabled:opacity-50"
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
    </Card>
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
            />
            {opsi.length > 2 && (
              <Button
                type="button"
                variant="hantu"
                onClick={() => setOpsi((arr) => arr.filter((_, j) => j !== i))}
                aria-label="Hapus opsi"
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
        <Button type="button" variant="sekunder" onClick={tutup}>
          Batal
        </Button>
        <Button type="submit" disabled={proses}>
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
            <Card className="p-5">
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
            </Card>
          ) : (
            <Button variant="sekunder" onClick={() => setFormBuka(true)}>
              <Plus size={15} /> Buat polling baru
            </Button>
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
          <Card className="p-10 text-center text-sm text-muted">
            Belum ada polling aktif.
          </Card>
        )}
      </div>
    </div>
  );
}
