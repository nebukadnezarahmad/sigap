"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Lock } from "lucide-react";
import { BADGES, levelDari } from "@/lib/constants";
import { IkonVektor, nodeBadge } from "@/lib/ikon-vektor";
import { useUser } from "@/lib/use-user";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui";

/**
 * Badge adalah mekanik ASPIRASIONAL, jadi yang belum didapat harus tetap
 * terlihat — beserta cara mendapatkannya. Sebelumnya halaman ini merender
 * daftar badge DUA KALI: sekali sebagai grid seragam tanpa status, sekali lagi
 * sebagai pil terkunci. Sekarang satu grid yang tahu statusnya.
 *
 * Deskripsi cara mendapat badge dulu hanya ada di atribut `title`, yang tidak
 * terjangkau sentuh maupun keyboard. Sekarang dirender sebagai teks.
 */
export function BadgeSaya() {
  const { user } = useUser();
  const [dimiliki, setDimiliki] = useState<string[]>([]);
  const [poin, setPoin] = useState<number | null>(null);
  const [memuat, setMemuat] = useState(true);

  useEffect(() => {
    if (!user) {
      setMemuat(false);
      return;
    }
    let batal = false;
    const supabase = createClient();
    Promise.all([
      supabase.from("user_badges").select("badge_key").eq("user_id", user.id),
      supabase.from("profiles").select("poin").eq("id", user.id).single(),
    ]).then(([badge, profil]) => {
      if (batal) return;
      setDimiliki((badge.data ?? []).map((d) => d.badge_key));
      setPoin(profil.data?.poin ?? null);
      setMemuat(false);
    });
    return () => {
      batal = true;
    };
  }, [user]);

  const jumlahPunya = dimiliki.length;
  const level = poin !== null ? levelDari(poin) : null;

  return (
    <div>
      {user && (
        <Card variant="garis" className="mb-5 border-daun-500/30 bg-daun-500/5 p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="font-bold">Progresmu</h3>
              <p className="mt-1 text-sm text-muted">
                {memuat
                  ? "Memuat progres…"
                  : `${jumlahPunya} dari ${BADGES.length} badge terkumpul`}
                {level && ` · level ${level.sekarang.nama}`}
              </p>
            </div>
            {poin !== null && (
              <motion.p
                key={poin}
                initial={{ scale: 1.25 }}
                animate={{ scale: 1 }}
                className="angka-tabular font-display text-3xl font-extrabold leading-none text-daun-700 dark:text-daun-300"
              >
                {poin}
                <span className="ml-1.5 text-sm font-semibold text-muted">
                  poin
                </span>
              </motion.p>
            )}
          </div>

          {level && (
            <div className="mt-4">
              <div
                className="h-1.5 overflow-hidden rounded-kontrol bg-panel-2"
                role="progressbar"
                aria-valuenow={level.progres}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Progres menuju level ${level.berikut?.nama ?? "tertinggi"}`}
              >
                <div
                  className="h-full rounded-kontrol bg-daun-600 transition-[width] duration-700 ease-sigap"
                  style={{ width: `${level.progres}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-muted">
                {level.berikut
                  ? `${level.berikut.min - poin!} poin lagi menuju ${level.berikut.nama}`
                  : "Level tertinggi tercapai"}
              </p>
            </div>
          )}
        </Card>
      )}

      {!user && (
        <p className="mb-5 text-sm text-muted">
          Sepuluh badge di bawah bisa kamu kumpulkan.{" "}
          <a
            href="/masuk?next=/papan-skor"
            className="font-semibold text-daun-700 underline underline-offset-2 dark:text-daun-300"
          >
            Masuk
          </a>{" "}
          untuk melihat mana yang sudah kamu dapat.
        </p>
      )}

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {BADGES.map((b) => {
          const punya = dimiliki.includes(b.key);
          return (
            <li key={b.key}>
              <Card
                variant={punya ? "kartu" : "datar"}
                className={`flex h-full gap-3 p-4 ${punya ? "" : "opacity-70"}`}
              >
                <span
                  aria-hidden
                  className={`flex size-10 shrink-0 items-center justify-center rounded-item ${
                    punya
                      ? "bg-daun-600 text-white"
                      : "bg-line/60 text-muted dark:bg-line"
                  }`}
                >
                  {punya ? (
                    <IkonVektor node={nodeBadge(b)} ukuran={20} />
                  ) : (
                    <Lock size={16} />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold">
                    {b.nama}
                    {punya && (
                      <span className="ml-2 align-middle text-mikro font-semibold uppercase text-daun-700 dark:text-daun-300">
                        Didapat
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted teks-pretty">
                    {b.deskripsi}
                  </p>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
