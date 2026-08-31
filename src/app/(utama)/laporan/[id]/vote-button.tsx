"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ThumbsUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/use-user";
import { Button } from "@/components/ui";
import { DemoAuthModal } from "@/components/tombol-demo-login";

export function VoteButton({
  reportId,
  jumlahAwal,
}: {
  reportId: string;
  jumlahAwal: number;
}) {
  const { user } = useUser();
  const [jumlah, setJumlah] = useState(jumlahAwal);
  const [sudahVote, setSudahVote] = useState(false);
  const [proses, setProses] = useState(false);
  const [modalAuth, setModalAuth] = useState(false);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase
      .from("votes")
      .select("user_id")
      .eq("report_id", reportId)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setSudahVote(!!data));
  }, [user, reportId]);

  async function toggle() {
    if (!user) {
      setModalAuth(true);
      return;
    }
    if (proses) return;
    setProses(true);

    const supabase = createClient();
    if (sudahVote) {
      await supabase
        .from("votes")
        .delete()
        .eq("report_id", reportId)
        .eq("user_id", user.id);
      setSudahVote(false);
      setJumlah((n) => Math.max(0, n - 1));
    } else {
      await supabase
        .from("votes")
        .insert({ report_id: reportId, user_id: user.id });
      setSudahVote(true);
      setJumlah((n) => n + 1);
    }
    setProses(false);
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <Button
          variant={sudahVote ? "utama" : "sekunder"}
          onClick={toggle}
          disabled={proses}
          title={user ? "" : "Masuk untuk mendukung laporan ini"}
        >
          <ThumbsUp size={16} className={sudahVote ? "fill-current" : ""} />
          <motion.span key={jumlah}>{jumlah}</motion.span>
          <span>{sudahVote ? "Didukung" : "Dukung laporan ini"}</span>
        </Button>
        {!user && (
          <button
            type="button"
            onClick={() => setModalAuth(true)}
            className="text-xs text-muted hover:text-ink hover:underline transition"
          >
            masuk untuk memberi dukungan
          </button>
        )}
      </div>

      <DemoAuthModal
        terbuka={modalAuth}
        tutup={() => setModalAuth(false)}
        judul="Dukung Laporan Ini"
        deskripsi="Masuk dengan salah satu akun demo untuk memberikan dukungan (vote) pada laporan warga ini."
        tujuan={`/laporan/${reportId}`}
      />
    </>
  );
}
