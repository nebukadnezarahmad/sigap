"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Bell, BellOff, CheckCheck, Eye, Flag, Star, Wrench } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/use-user";
import { cn, waktuRelatif } from "@/lib/utils";
import { KosongState, Skeleton } from "@/components/ui";

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
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    setMemuat(true);
    setGalat(null);

    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data, error }) => {
        if (error) {
          setGalat("Notifikasi gagal dimuat.");
        } else {
          setDaftar(data ?? []);
        }
        setMemuat(false);
      });

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

  /* Escape menutup panel. */
  useEffect(() => {
    if (!buka) return;
    function padaTombol(e: KeyboardEvent) {
      if (e.key === "Escape") setBuka(false);
    }
    window.addEventListener("keydown", padaTombol);
    return () => window.removeEventListener("keydown", padaTombol);
  }, [buka]);

  const belum = daftar.filter((n) => !n.dibaca).length;

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
        onClick={() => setBuka((v) => !v)}
        aria-label={`Notifikasi${belum ? `, ${belum} belum dibaca` : ""}`}
        aria-expanded={buka}
        className="relative rounded-kontrol p-2 text-muted transition hover:bg-panel-2 hover:text-ink"
      >
        <Bell size={18} />
        {belum > 0 && (
          <motion.span
            key={belum}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            aria-hidden
            className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white"
          >
            {belum}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {buka && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setBuka(false)} />
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              className="absolute right-0 top-full z-40 mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-panel bg-panel shadow-melayang dark:border dark:garis-halus"
            >
              <div className="flex items-center justify-between gap-2 border-b garis-halus px-4 py-2">
                <h2 className="text-sm font-bold">Notifikasi</h2>
                {belum > 0 && (
                  <button
                    onClick={tandaiSemua}
                    className="-mr-2 flex items-center gap-1.5 rounded-kontrol px-2 py-1.5 text-xs font-semibold text-daun-700 transition hover:bg-panel-2 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-fokus dark:text-daun-300"
                  >
                    <CheckCheck size={14} aria-hidden /> Tandai dibaca
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {memuat && (
                  <div className="space-y-3 p-4" role="status" aria-live="polite">
                    <span className="sr-only">Memuat notifikasi…</span>
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <Skeleton className="size-6 shrink-0 rounded-full" />
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <Skeleton className="h-3.5 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!memuat && galat && (
                  <p className="px-4 py-6 text-center text-sm font-semibold text-danger-kuat dark:text-red-300">
                    {galat}
                  </p>
                )}

                {!memuat && !galat && daftar.length === 0 && (
                  <KosongState
                    className="px-4 py-8"
                    ikon={<BellOff size={22} />}
                    judul="Belum ada notifikasi"
                    isi="Lapor masalah atau dukung laporan warga lain — kabarnya akan muncul di sini."
                  />
                )}

                {!memuat &&
                  !galat &&
                  daftar.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => {
                        setBuka(false);
                        if (n.report_id) router.push(`/laporan/${n.report_id}`);
                      }}
                      className={cn(
                        "flex w-full items-start gap-2.5 border-b garis-halus px-4 py-3 text-left transition last:border-0 hover:bg-panel-2 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-fokus",
                        !n.dibaca && "bg-daun-500/5"
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full",
                          n.dibaca
                            ? "bg-panel-2 text-muted"
                            : "bg-daun-600 text-white"
                        )}
                      >
                        {IKON[n.jenis] ?? <Bell size={13} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start gap-1.5">
                          {!n.dibaca && (
                            <span
                              aria-hidden
                              className="mt-1.5 size-1.5 shrink-0 rounded-full bg-daun-600 dark:bg-daun-300"
                            />
                          )}
                          <span className="block text-sm font-semibold">
                            {!n.dibaca && (
                              <span className="sr-only">Belum dibaca. </span>
                            )}
                            {n.judul}
                          </span>
                        </span>
                        {n.isi && (
                          <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-muted">
                            {n.isi}
                          </span>
                        )}
                        <span
                          className="mt-0.5 block text-[11px] text-muted"
                          suppressHydrationWarning
                        >
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
