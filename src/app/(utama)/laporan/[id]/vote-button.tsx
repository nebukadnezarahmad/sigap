"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ThumbsUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/use-user";
import { Button } from "@/components/ui";

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
    if (!user || proses) return;
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
    <div className="flex items-center gap-3">
      <Button
        variant={sudahVote ? "utama" : "sekunder"}
        onClick={toggle}
        disabled={!user || proses}
        title={user ? "" : "Masuk untuk mendukung laporan ini"}
        className={!sudahVote && !user ? "opacity-70" : ""}
      >
        <ThumbsUp size={16} className={sudahVote ? "fill-current" : ""} />
        <motion.span key={jumlah}>{jumlah}</motion.span>
        <span>{sudahVote ? "Didukung" : "Dukung laporan ini"}</span>
      </Button>
      {!user && (
        <span className="text-xs text-muted">masuk untuk memberi dukungan</span>
      )}
    </div>
  );
}
