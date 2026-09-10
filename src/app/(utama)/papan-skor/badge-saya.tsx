"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Lock } from "lucide-react";
import { BADGES, levelDari } from "@/lib/constants";
import { IkonVektor, nodeBadge } from "@/lib/ikon-vektor";
import { Card } from "@/components/ui";
import { Progress } from "@/components/progress";
import { useUser } from "@/lib/use-user";
import { createClient } from "@/lib/supabase/client";

export function BadgeSaya() {
  const { user, muat } = useUser();
  const [progres, setProgres] = useState<{
    dimiliki: string[];
    poin: number;
    userId: string;
  } | { gagal: true; userId: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    let aktif = true;
    const supabase = createClient();

    Promise.all([
      supabase.from("user_badges").select("badge_key").eq("user_id", user.id),
      supabase.from("profiles").select("poin").eq("id", user.id).single(),
    ])
      .then(([hasilLencana, hasilProfil]) => {
        if (
          hasilLencana.error ||
          hasilProfil.error ||
          typeof hasilProfil.data?.poin !== "number"
        ) {
          throw new Error("Progres tidak tersedia");
        }
        if (!aktif) return;
        setProgres({
          dimiliki: (hasilLencana.data ?? []).map((item) => item.badge_key),
          poin: hasilProfil.data.poin,
          userId: user.id,
        });
      })
      .catch(() => {
        if (aktif) setProgres({ gagal: true, userId: user.id });
      });

    return () => {
      aktif = false;
    };
  }, [user]);

  const progresAktif = progres?.userId === user?.id ? progres : null;
  const gagal = progresAktif !== null && "gagal" in progresAktif;
  const dimiliki = progresAktif && !("gagal" in progresAktif)
    ? progresAktif.dimiliki
    : null;
  const poin = progresAktif && !("gagal" in progresAktif)
    ? progresAktif.poin
    : null;
  const level = levelDari(poin ?? 0);
  const jumlahLencana = dimiliki?.length ?? 0;

  return (
    <>
      <section
        aria-labelledby="judul-perjalanan"
        className="order-1 lg:col-start-1 lg:row-start-1"
      >
        <h2 id="judul-perjalanan" className="font-display text-xl font-bold">
          Perjalananmu
        </h2>
        <p className="mb-4 mt-1 text-sm text-muted">Poin dan level kontribusimu.</p>

        {muat ? (
          <Card
            role="status"
            aria-label="Memuat progres lencanamu"
            className="rounded-[28px] p-6"
          >
            <div aria-hidden="true" className="animate-pulse space-y-5">
              <div className="h-12 w-12 rounded-2xl bg-panel-2" />
              <div className="h-7 w-40 rounded-lg bg-panel-2" />
              <div className="h-2 w-full rounded-full bg-panel-2" />
            </div>
          </Card>
        ) : !user ? (
          <Card className="rounded-[28px] p-6 sm:p-7">
            <h3 className="font-display text-lg font-bold">Mulai perjalananmu</h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted teks-pretty">
              Masuk untuk melihat poin, level, dan lencana yang sudah kamu raih.
            </p>
            <Link
              href="/masuk"
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-action px-5 text-sm font-semibold text-[var(--on-action)] transition-[transform,background-color] duration-200 ease-out hover:bg-action-hover active:scale-[0.97]"
            >
              Masuk untuk melihat progres
            </Link>
          </Card>
        ) : gagal ? (
          <Card role="alert" className="rounded-[28px] p-6 sm:p-7">
            <h3 className="font-display text-lg font-bold">Progres belum dapat dimuat</h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              Muat ulang halaman untuk mencoba lagi.
            </p>
          </Card>
        ) : poin === null ? (
          <Card
            role="status"
            aria-label="Memuat progres lencanamu"
            className="rounded-[28px] p-6"
          >
            <div aria-hidden="true" className="animate-pulse space-y-5">
              <div className="h-12 w-12 rounded-2xl bg-panel-2" />
              <div className="h-7 w-40 rounded-lg bg-panel-2" />
              <div className="h-2 w-full rounded-full bg-panel-2" />
            </div>
          </Card>
        ) : (
          <Card className="rounded-[28px] p-6 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-action-soft text-action">
                  <IkonVektor node={nodeBadge(level.sekarang)} ukuran={24} />
                </span>
                <div className="min-w-0">
                  <h3 className="truncate font-display text-lg font-bold">Level {level.sekarang.nama}</h3>
                  <p className="text-sm text-muted">{jumlahLencana} dari {BADGES.length} lencana</p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-3xl font-bold tracking-tight tabular-nums">{poin}</p>
                <p className="text-xs text-muted">poin</p>
              </div>
            </div>

            <Progress
              nilai={level.progres}
              label={`Progres level ${level.sekarang.nama}`}
              varian="aksi"
              className="mt-6"
            />
            <p className="mt-3 text-sm text-muted">
              {level.berikut
                ? `${level.berikut.min - poin} poin lagi menuju ${level.berikut.nama}.`
                : "Kamu sudah mencapai level tertinggi."}
            </p>
          </Card>
        )}
      </section>

      <section
        aria-labelledby="judul-lencana"
        className="order-3 lg:col-start-1 lg:row-start-2"
      >
        <h2 id="judul-lencana" className="font-display text-xl font-bold">
          Koleksi lencana
        </h2>
        <p className="mb-4 mt-1 text-sm text-muted">Jejak partisipasi yang bisa kamu raih.</p>

        <ul
          aria-label="Koleksi lencana"
          className="grid gap-px overflow-hidden rounded-[24px] border border-line bg-line sm:grid-cols-2"
        >
          {BADGES.map((b) => {
            const punya = dimiliki?.includes(b.key) ?? false;
            const statusDiketahui = Boolean(user && dimiliki);

            return (
              <li key={b.key} className="flex min-h-[86px] items-center gap-3 bg-panel p-4">
                <span
                  aria-hidden="true"
                  className={`flex size-10 shrink-0 items-center justify-center rounded-[13px] ${
                    punya
                      ? "bg-action text-[var(--on-action)]"
                      : statusDiketahui
                        ? "bg-panel-2 text-muted"
                        : "bg-action-soft text-action"
                  }`}
                >
                  <IkonVektor node={nodeBadge(b)} ukuran={19} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{b.nama}</p>
                  <p className="mt-0.5 text-xs leading-5 text-muted teks-pretty">{b.deskripsi}</p>
                </div>
                {statusDiketahui && (
                  <span className={punya ? "text-action" : "text-muted"}>
                    {punya ? <Check size={17} aria-hidden="true" /> : <Lock size={15} aria-hidden="true" />}
                    <span className="sr-only">{punya ? "Dimiliki" : "Terkunci"}</span>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
