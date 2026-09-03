"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { PartyPopper } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/use-user";

export function MomenSelesai({
  reportId,
  awalSelesai,
}: {
  reportId: string;
  awalSelesai: boolean;
}) {
  const { user } = useUser();
  const [baru, setBaru] = useState(false);
  const refSelesai = useRef(awalSelesai);

  useEffect(() => {
    if (refSelesai.current) return;
    const supabase = createClient();
    const ch = supabase
      .channel(`momen-${reportId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "reports" },
        (payload) => {
          const upd = payload.new as { id: string; status: string };
          if (upd.id === reportId && upd.status === "selesai") {
            refSelesai.current = true;
            setBaru(true);
            void (async () => {
              const { default: confetti } = await import("canvas-confetti");
              confetti({
                particleCount: 160,
                spread: 75,
                origin: { y: 0.25 },
                colors: ["#2e9e57", "#f59e0b", "#55bc77", "#fbbf24"],
              });
            })();
          }
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [reportId]);

  if (awalSelesai && !baru) {
    return (
      <div className="mb-5 flex items-center gap-3 rounded-2xl border border-daun-500/40 bg-daun-500/10 px-5 py-4">
        <PartyPopper className="shrink-0 text-daun-700 dark:text-daun-300" size={22} />
        <p className="text-sm font-semibold text-daun-800 dark:text-daun-200">
          Masalah ini sudah selesai ditangani. Terima kasih kepada semua warga
          yang berpartisipasi!
        </p>
      </div>
    );
  }

  if (!baru) return null;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="mb-5 rounded-2xl border border-daun-500/40 bg-daun-500/10 p-6 text-center"
    >
      <PartyPopper size={44} className="mx-auto text-daun-700 dark:text-daun-300" />
      <h2 className="mt-2 font-display text-xl font-bold text-daun-800 dark:text-daun-200">
        Laporan ini baru saja SELESAI!
      </h2>
      <p className="mt-1 text-sm text-muted">
        {user
          ? "Partisipasimu membantu lingkungan jadi lebih baik."
          : "Inilah hasil kolaborasi warga dan dewan kota."}
      </p>
    </motion.div>
  );
}
