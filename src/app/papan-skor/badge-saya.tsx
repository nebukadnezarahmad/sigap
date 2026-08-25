"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { BADGES } from "@/lib/constants";
import { useUser } from "@/lib/use-user";
import { createClient } from "@/lib/supabase/client";

export function BadgeSaya() {
  const { user } = useUser();
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

  if (!user)
    return (
      <p className="mt-4 text-sm text-muted">
        Masuk untuk melihat progres badge dan poinmu.
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
            className="angka-tabular font-display text-2xl font-extrabold text-daun-700 dark:text-daun-300"
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
              <span aria-hidden>{punya ? b.emoji : "🔒"}</span>
              {b.nama}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
