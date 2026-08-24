"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, SendHorizonal } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/use-user";
import type { Komentar } from "@/types/database";
import { waktuRelatif } from "@/lib/utils";
import { Avatar, Button, Card, Textarea } from "@/components/ui";

export function KomentarSection({
  reportId,
  jumlahAwal,
}: {
  reportId: string;
  jumlahAwal: number;
}) {
  const { user } = useUser();
  const [daftar, setDaftar] = useState<Komentar[]>([]);
  const [teks, setTeks] = useState("");
  const [kirim, setKirim] = useState(false);
  const [terisi, setTerisi] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    supabase
      .from("comments")
      .select("*, profiles(id,username,nama_lengkap,avatar_url)")
      .eq("report_id", reportId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setDaftar(data ?? []);
        setTerisi(true);
      });

    const ch = supabase
      .channel(`komentar-${reportId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
          filter: `report_id=eq.${reportId}`,
        },
        async (payload) => {
          const baru = payload.new as Komentar;
          if (baru.user_id === user?.id) return;
          const { data } = await supabase
            .from("profiles")
            .select("id,username,nama_lengkap,avatar_url")
            .eq("id", baru.user_id)
            .single();
          setDaftar((s) =>
            s.some((k) => k.id === baru.id)
              ? s
              : [...s, { ...baru, profiles: data }]
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [reportId, user?.id]);

  async function kirimKomentar(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !teks.trim() || kirim) return;
    setKirim(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("comments")
      .insert({ report_id: reportId, user_id: user.id, isi: teks.trim() })
      .select("*, profiles(id,username,nama_lengkap,avatar_url)")
      .single();
    if (!error && data) {
      setDaftar((s) => [...s, data]);
      setTeks("");
    }
    setKirim(false);
  }

  return (
    <Card className="p-5">
      <h2 className="mb-4 flex items-center gap-2 font-display font-bold">
        <MessageSquare size={17} />
        Diskusi warga
        <span className="text-sm font-normal text-muted">
          ({jumlahAwal > daftar.length ? jumlahAwal : daftar.length})
        </span>
      </h2>

      <div className="space-y-4">
        {!terisi && (
          <p className="text-sm text-muted">Memuat komentar…</p>
        )}
        <AnimatePresence initial={false}>
          {daftar.map((k) => (
            <motion.article
              key={k.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <Avatar
                nama={k.profiles?.nama_lengkap ?? "Warga"}
                url={k.profiles?.avatar_url}
                ukuran={32}
              />
              <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md bg-panel-2 px-4 py-2.5">
                <p className="text-xs">
                  <span className="font-semibold">{k.profiles?.nama_lengkap ?? "Warga"}</span>{" "}
                  <span className="text-muted">· {waktuRelatif(k.created_at)}</span>
                </p>
                <p className="mt-0.5 whitespace-pre-line break-words text-sm leading-relaxed">
                  {k.isi}
                </p>
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
        {terisi && daftar.length === 0 && (
          <p className="text-sm text-muted">
            Belum ada komentar — jadilah suara pertama.
          </p>
        )}
      </div>

      {user ? (
        <form onSubmit={kirimKomentar} className="mt-5 flex items-end gap-3">
          <Textarea
            rows={2}
            value={teks}
            maxLength={500}
            onChange={(e) => setTeks(e.target.value)}
            placeholder="Tulis tanggapan atau info tambahan…"
            aria-label="Tulis komentar"
          />
          <Button type="submit" disabled={kirim || !teks.trim()} aria-label="Kirim komentar">
            <SendHorizonal size={16} />
          </Button>
        </form>
      ) : (
        <p className="mt-5 text-sm text-muted">Masuk untuk ikut berdiskusi.</p>
      )}
    </Card>
  );
}
