"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, SendHorizonal } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/use-user";
import type { Komentar } from "@/types/database";
import { waktuRelatif } from "@/lib/utils";
import { Avatar, Button, Card, Textarea } from "@/components/ui";
import { DemoAuthModal } from "@/components/tombol-demo-login";

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
  const [modalAuth, setModalAuth] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    supabase
      .from("comments")
      .select("*, profiles(id,username,nama_lengkap,avatar_url)")
      .eq("report_id", reportId)
      .order("created_at", { ascending: true })
      .limit(100)
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
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "comments",
          filter: `report_id=eq.${reportId}`,
        },
        async (payload) => {
          const upd = payload.new as Komentar;
          const { data } = await supabase
            .from("profiles")
            .select("id,username,nama_lengkap,avatar_url")
            .eq("id", upd.user_id)
            .single();
          setDaftar((s) =>
            s.map((k) => (k.id === upd.id ? { ...upd, profiles: data } : k))
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "comments",
          filter: `report_id=eq.${reportId}`,
        },
        (payload) => {
          const lama = payload.old as { id: string };
          setDaftar((s) => s.filter((k) => k.id !== lama.id));
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
                  <span className="text-muted" suppressHydrationWarning>· {waktuRelatif(k.created_at)}</span>
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
        <div className="mt-5 rounded-2xl border border-daun-500/25 bg-daun-500/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Ingin ikut berdiskusi?</p>
              <p className="text-xs text-muted">
                Masuk untuk menulis komentar atau klarifikasi pada laporan warga ini.
              </p>
            </div>
            <Button
              size="sm"
              variant="sekunder"
              onClick={() => setModalAuth(true)}
              className="border-daun-500/30 text-daun-700 hover:bg-daun-500/10 dark:text-daun-300"
            >
              Masuk 1-Klik Demo
            </Button>
          </div>
        </div>
      )}

      <DemoAuthModal
        terbuka={modalAuth}
        tutup={() => setModalAuth(false)}
        judul="Diskusi Laporan Warga"
        deskripsi="Masuk dengan akun demo untuk mengirim tanggapan atau informasi tambahan."
        tujuan={`/laporan/${reportId}`}
      />
    </Card>
  );
}
