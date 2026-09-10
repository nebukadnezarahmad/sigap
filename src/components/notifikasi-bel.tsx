"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { animasiPopover, transisiCepat } from "@/lib/motion";
import { Bell, BellOff, CheckCheck, Eye, Flag, Star, Wrench, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/use-user";
import { cn, waktuRelatif } from "@/lib/utils";
import { FeedbackState } from "@/components/feedback-state";

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
  const [galat, setGalat] = useState<string | null>(null);
  const refPemicu = useRef<HTMLButtonElement>(null);
  const refPanel = useRef<HTMLDivElement>(null);
  const refTutup = useRef<HTMLButtonElement>(null);
  const pernahBuka = useRef(false);

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
    if (!buka) {
      // Kembalikan fokus ke pemicu setiap panel ditutup (outside-click,
      // pilih item, Escape) — bukan saat mount awal.
      if (pernahBuka.current) {
        refPemicu.current?.focus();
      }
      return;
    }
    pernahBuka.current = true;
    const timerFokus = window.setTimeout(() => {
      (refTutup.current ?? refPanel.current)?.focus();
    }, 0);
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
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
      window.clearTimeout(timerFokus);
      window.removeEventListener("keydown", onKey);
    };
  }, [buka]);

  useEffect(() => {
    const panel = refPanel.current;
    if (buka && panel && !panel.contains(document.activeElement)) {
      refTutup.current?.focus();
    }
  }, [buka, daftar]);

  async function tandaiSemua() {
    if (!user) return;
    const sebelumnya = daftar;
    setDaftar((s) => s.map((n) => ({ ...n, dibaca: true })));
    setGalat(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("notifications")
      .update({ dibaca: true })
      .eq("user_id", user.id)
      .eq("dibaca", false);
    if (error) {
      console.error("Gagal menandai notifikasi dibaca:", error);
      setDaftar(sebelumnya);
      setGalat("Belum bisa menandai dibaca. Periksa koneksi lalu coba lagi.");
    }
  }

  return (
    <div className="relative">
      <button
        ref={refPemicu}
        onClick={() => setBuka((v) => !v)}
        aria-label={`Notifikasi${belum ? `, ${belum} belum dibaca` : ""}`}
        aria-expanded={buka}
        aria-haspopup="dialog"
        className="relative flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2 text-muted transition hover:bg-panel-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
      >
        <Bell size={18} />
        {belum > 0 && (
          <motion.span
            key={belum}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={transisiCepat}
            className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white"
          >
            {belum}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {buka && (
          <>
            <div
              aria-hidden="true"
              onMouseDown={() => setBuka(false)}
              className="fixed inset-0 z-30 cursor-default bg-black/15"
            />
            <motion.div
              ref={refPanel}
              role="dialog"
              aria-label="Notifikasi"
              aria-modal="true"
              tabIndex={-1}
              initial={animasiPopover.initial}
              animate={animasiPopover.animate}
              exit={animasiPopover.exit}
              transition={transisiCepat}
              className="absolute right-0 top-full z-40 mt-2 w-80 overflow-hidden rounded-2xl border garis-halus bg-panel shadow-xl"
            >
              <div className="flex min-h-[52px] items-center justify-between gap-2 border-b garis-halus px-4 py-1.5">
                <p className="font-display text-sm font-bold">Notifikasi</p>
                <div className="flex items-center gap-1">
                  {belum > 0 && (
                    <button
                      onClick={tandaiSemua}
                      className="flex min-h-[44px] items-center gap-1 px-2 text-xs font-semibold text-action hover:underline"
                    >
                      <CheckCheck size={13} /> Tandai semua dibaca
                    </button>
                  )}
                  <button
                    ref={refTutup}
                    type="button"
                    aria-label="Tutup notifikasi"
                    onClick={() => setBuka(false)}
                    className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-panel-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
                  >
                    <X size={18} aria-hidden="true" />
                  </button>
                </div>
              </div>
              {galat && (
                <p role="alert" className="border-b garis-halus bg-danger/10 px-4 py-2 text-xs font-semibold text-danger">
                  {galat}
                </p>
              )}
              <div className="max-h-80 overflow-y-auto">
                {daftar.length === 0 && (
                  <FeedbackState
                    jenis="kosong"
                    ikon={BellOff}
                    judul="Belum ada notifikasi"
                    deskripsi="Laporkan masalah atau dukung laporan warga agar kabar terbaru muncul di sini."
                    aksi={
                      <button
                        onClick={() => {
                          setBuka(false);
                          router.push("/peta");
                        }}
                        className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-action px-5 text-sm font-semibold text-white transition hover:bg-action-hover"
                      >
                        Jelajahi peta
                      </button>
                    }
                  />
                )}
                {daftar.map((n) => {
                  const isi = (
                    <>
                      <span
                        className={cn(
                          "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full",
                          n.dibaca
                            ? "bg-panel-2 text-muted"
                            : "bg-action text-white"
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
                        <span className="mt-0.5 block text-[11px] text-muted" suppressHydrationWarning>
                          {waktuRelatif(n.created_at)}
                        </span>
                      </span>
                    </>
                  );
                  const kelas = cn(
                    "flex w-full items-start gap-2.5 border-b garis-halus px-4 py-3 text-left transition last:border-0 hover:bg-panel-2",
                    !n.dibaca && "bg-action/5"
                  );
                  if (!n.report_id) {
                    return (
                      <div key={n.id} className={kelas} aria-label={n.judul}>
                        {isi}
                      </div>
                    );
                  }
                  return (
                    <button
                      key={n.id}
                      onClick={() => {
                        setBuka(false);
                        if (n.report_id) router.push(`/laporan/${n.report_id}`);
                      }}
                      className={kelas}
                    >
                      {isi}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
