"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { transisiCepat } from "@/lib/motion";
import { BADGES } from "@/lib/constants";
import { IkonVektor, nodeBadge } from "@/lib/ikon-vektor";
import { Lock } from "lucide-react";
import { useUser } from "@/lib/use-user";
import { createClient } from "@/lib/supabase/client";

export function BadgeSaya() {
  const { user, muat } = useUser();
  const [dimiliki, setDimiliki] = useState<string[]>([]);
  const [poin, setPoin] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase
      .from("user_badges")
      .select("badge_key")
      .eq("user_id", user.id)
      .then(({ data }) => setDimiliki((data ?? []).map((d) => d.badge_key)));
    supabase
      .from("profiles")
      .select("poin")
      .eq("id", user.id)
      .single()
      .then(({ data }) => setPoin(data?.poin ?? null));
  }, [user]);

  if (muat)
    return (
      <div role="status" aria-label="Memuat progres lencanamu" className="mt-6 rounded-2xl border garis-halus p-5">
        <div aria-hidden="true" className="space-y-2">
          <div className="h-4 w-32 animate-pulse rounded-lg bg-line/60" />
          <div className="flex gap-2">
            <div className="h-7 w-24 animate-pulse rounded-full bg-line/60" />
            <div className="h-7 w-24 animate-pulse rounded-full bg-line/60" />
            <div className="h-7 w-24 animate-pulse rounded-full bg-line/60" />
          </div>
        </div>
      </div>
    );

  if (!user)
    return (
      <p className="mt-4 text-sm text-muted">
        Masuk untuk melihat progres lencana dan poinmu.
      </p>
    );

  return (
    <div className="mt-6 rounded-2xl border border-daun-500/30 bg-daun-500/5 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display font-bold">Progresmu</h3>
        {poin !== null && (
          <motion.p
            key={poin}
            initial={{ scale: 1.25 }}
            animate={{ scale: 1 }}
            transition={transisiCepat}
            className="angka-tabular text-2xl font-extrabold tabular-nums text-daun-700 dark:text-daun-300"
          >
            {poin} poin
          </motion.p>
        )}
      </div>
      <ul className="mt-3 flex flex-wrap gap-2">
        {BADGES.map((b) => {
          const punya = dimiliki.includes(b.key);
          return (
            <li
              key={b.key}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                punya
                  ? "border-transparent bg-daun-600 text-white"
                  : "garis-halus text-muted opacity-60"
              }`}
              title={b.deskripsi}
            >
              <span aria-hidden className="flex items-center">
                {punya ? (
                  <IkonVektor node={nodeBadge(b)} ukuran={13} />
                ) : (
                  <Lock size={12} />
                )}
              </span>
              {b.nama}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
