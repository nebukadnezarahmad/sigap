"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Bell, CheckCheck, Eye, Flag, Star, Wrench } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/use-user";
import { cn, waktuRelatif } from "@/lib/utils";

type Notif = {
  id: string;
  jenis: string;
  judul: string;
  isi: string | null;
  report_id: string | null;
  dibaca: boolean;
  created_at: string;
};

const IKON: Record<string, React.ReactNode> = {
  status: <Flag size={14} />,
  konfirmasi: <Eye size={14} />,
  poin: <Star size={14} />,
  tugas: <Wrench size={14} />,
};

export function NotifikasiBel() {
  const { user } = useUser();
  const router = useRouter();
  const [buka, setBuka] = useState(false);
  const [daftar, setDaftar] = useState<Notif[]>([]);
  const refPemicu = useRef<HTMLButtonElement>(null);
  const refPanel = useRef<HTMLDivElement>(null);
  const refFokusTerakhir = useRef<Element | null>(null);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();

    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => setDaftar(data ?? []));

    const ch = supabase
      .channel(`notif-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setDaftar((s) => [payload.new as Notif, ...s].slice(0, 20));
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(ch);
    };
  }, [user]);

  const belum = daftar.filter((n) => !n.dibaca).length;

  useEffect(() => {
    if (!buka) return;
    refFokusTerakhir.current = document.activeElement;
    const t = window.setTimeout(() => {
      const panel = refPanel.current;
      if (!panel) return;
      const target = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).find((el) => el.getClientRects().length > 0);
      (target ?? panel).focus();
    }, 0);
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setBuka(false);
        return;
      }
      if (e.key === "Tab") {
        const panel = refPanel.current;
        if (!panel) return;
        const daftarFokus = Array.from(
          panel.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => el.getClientRects().length > 0);
        if (daftarFokus.length === 0) {
          e.preventDefault();
          panel.focus();
          return;
        }
        const pertama = daftarFokus[0];
        const terakhir = daftarFokus[daftarFokus.length - 1];
        if (!panel.contains(document.activeElement)) {
          e.preventDefault();
          (e.shiftKey ? terakhir : pertama).focus();
        } else if (e.shiftKey && document.activeElement === pertama) {
          e.preventDefault();
          terakhir.focus();
        } else if (!e.shiftKey && document.activeElement === terakhir) {
          e.preventDefault();
          pertama.focus();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
      const pemicu = refFokusTerakhir.current as HTMLElement | null;
      if (pemicu?.isConnected) pemicu.focus();
      refFokusTerakhir.current = null;
    };
  }, [buka]);

  function tutupNotifikasi() {
    setBuka(false);
  }

  function ubahNotifikasi() {
    if (buka) {
      tutupNotifikasi();
      return;
    }
    refFokusTerakhir.current = document.activeElement;
    setBuka(true);
  }

  async function tandaiSemua() {
    if (!user) return;
    setDaftar((s) => s.map((n) => ({ ...n, dibaca: true })));
    const supabase = createClient();
    await supabase
      .from("notifications")
      .update({ dibaca: true })
      .eq("user_id", user.id)
      .eq("dibaca", false);
  }

  return (
    <div className="relative">
      <button
        ref={refPemicu}
        type="button"
        onClick={ubahNotifikasi}
        aria-label={`Notifikasi${belum ? `, ${belum} belum dibaca` : ""}`}
        aria-expanded={buka}
        aria-controls="panel-notifikasi"
        aria-haspopup="dialog"
        className="relative flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2 text-muted transition hover:bg-panel-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus! motion-reduce:transition-none"
      >
        <Bell size={18} />
        {belum > 0 && (
          <motion.span
            key={belum}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="angka-tabular absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white"
          >
            {belum}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {buka && (
          <>
            <button
              type="button"
              tabIndex={-1}
              aria-label="Tutup notifikasi"
              onClick={tutupNotifikasi}
              className="fixed inset-0 z-30 cursor-default bg-transparent"
            />
            <motion.div
              ref={refPanel}
              id="panel-notifikasi"
              role="dialog"
              aria-modal="true"
              aria-labelledby="notifikasi-judul"
              tabIndex={-1}
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              className="absolute right-[env(safe-area-inset-right,0px)] top-full z-40 mt-2 max-h-[calc(100dvh-4rem-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px))] w-[min(20rem,calc(100vw-2rem-env(safe-area-inset-left,0px)-env(safe-area-inset-right,0px)))] overflow-y-auto overscroll-contain rounded-[18px] border border-ap-hairline bg-white/85 shadow-none backdrop-blur-xl backdrop-saturate-150 dark:border-white/15 dark:bg-[#131d19]/85"
            >
              <div className="flex items-center justify-between border-b border-ap-hairline px-4 py-2.5 dark:border-white/10">
                <p id="notifikasi-judul" className="font-display text-sm font-bold">
                  Notifikasi
                </p>
                {belum > 0 && (
                  <button
                    type="button"
                    onClick={tandaiSemua}
                    className="inline-flex min-h-11 items-center gap-1 text-xs font-semibold text-ap-blue hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus! dark:text-ap-sky"
                  >
                    <CheckCheck size={13} /> Tandai dibaca
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto overscroll-contain">
                {daftar.length === 0 && (
                  <p className="px-4 py-8 text-center text-sm text-muted">
                    Belum ada notifikasi. Lapor atau dukung sesuatu!
                  </p>
                )}
                {daftar.map((n) => (
                  <button
                    type="button"
                    key={n.id}
                    onClick={() => {
                      tutupNotifikasi();
                      if (n.report_id) router.push(`/laporan/${n.report_id}`);
                    }}
                    className={cn(
                      "flex min-h-[44px] w-full items-start gap-2.5 border-b border-ap-hairline px-4 py-3 text-left transition last:border-0 hover:bg-panel-2 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-ap-blue-focus! dark:border-white/10",
                      !n.dibaca && "bg-ap-blue/5"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full",
                        n.dibaca
                          ? "bg-panel-2 text-muted"
                          : "bg-ap-blue text-white"
                      )}
                    >
                      {IKON[n.jenis] ?? <Bell size={13} />}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">
                        {n.judul}
                      </span>
                      {n.isi && (
                        <span className="mt-0.5 block truncate text-xs text-muted">
                          {n.isi}
                        </span>
                      )}
                      <span className="angka-tabular mt-0.5 block text-[11px] text-muted" suppressHydrationWarning>
                        {waktuRelatif(n.created_at)}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
