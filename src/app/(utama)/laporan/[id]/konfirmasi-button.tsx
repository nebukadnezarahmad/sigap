"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { motion } from "motion/react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/use-user";
import { Button } from "@/components/ui";

export function KonfirmasiButton({
  reportId,
  jumlahAwal,
  sudahAwal,
  masuk,
}: {
  reportId: string;
  jumlahAwal: number;
  sudahAwal: boolean;
  masuk: boolean;
}) {
  const { user } = useUser();
  const [jumlah, setJumlah] = useState(jumlahAwal);
  const [sudah, setSudah] = useState(sudahAwal);
  const [proses, setProses] = useState(false);

  async function toggle() {
    if (!user || proses) return;
    setProses(true);
    const supabase = createClient();
    if (sudah) {
      await supabase
        .from("confirmations")
        .delete()
        .eq("report_id", reportId)
        .eq("user_id", user.id);
      setSudah(false);
      setJumlah((n) => Math.max(0, n - 1));
    } else {
      await supabase
        .from("confirmations")
        .insert({ report_id: reportId, user_id: user.id });
      setSudah(true);
      setJumlah((n) => n + 1);
    }
    setProses(false);
  }

  return (
    <Button
      variant={sudah ? "utama" : "sekunder"}
      onClick={toggle}
      disabled={!masuk || proses}
      title={masuk ? "" : "Masuk untuk konfirmasi"}
    >
      <Eye size={16} className={sudah ? "fill-current" : ""} />
      <motion.span key={jumlah}>{jumlah}</motion.span>
      <span>{sudah ? "Kukonfirmasi" : "Saya juga melihat ini"}</span>
    </Button>
  );
}
