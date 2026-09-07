"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ThumbsUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/use-user";
import { KacaPill } from "@/components/eksperimen/kaca";
import { DemoAuthModal } from "@/components/tombol-demo-login";

/* Fusi visual-fusion: pill kaca; status aktif diisi Action Blue (FUSI b).
   Copy, pesan error, aria, dan logika vote tidak diubah. */
const PILL_KACA = "min-h-[44px] focus-visible:outline-ap-blue-focus";
const PILL_BIRU =
  "min-h-[44px] border-transparent bg-ap-blue text-white hover:bg-ap-blue-focus focus-visible:outline-ap-blue-focus dark:border-transparent dark:bg-ap-blue dark:text-white dark:hover:bg-ap-blue-focus";

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
  const [modalAuth, setModalAuth] = useState(false);
  const [pesan, setPesan] = useState<string | null>(null);

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
    if (!user) {
      setModalAuth(true);
      return;
    }
    if (proses) return;
    setProses(true);
    setPesan(null);

    const supabase = createClient();
    try {
      if (sudahVote) {
        setSudahVote(false);
        setJumlah((n) => Math.max(0, n - 1));
        const { error } = await supabase
          .from("votes")
          .delete()
          .eq("report_id", reportId)
          .eq("user_id", user.id);
        if (error) {
          setSudahVote(true);
          setJumlah((n) => n + 1);
          setPesan("Gagal membatalkan dukungan. Periksa koneksi lalu coba lagi.");
        }
      } else {
        setSudahVote(true);
        setJumlah((n) => n + 1);
        const { error } = await supabase
          .from("votes")
          .upsert(
            { report_id: reportId, user_id: user.id },
            { onConflict: "report_id,user_id" }
          );
        if (error) {
          setSudahVote(false);
          setJumlah((n) => Math.max(0, n - 1));
          setPesan("Gagal menyimpan dukungan. Periksa koneksi lalu coba lagi.");
        }
      }
    } catch {
      setSudahVote((v) => !v);
      setJumlah((n) => (sudahVote ? n + 1 : Math.max(0, n - 1)));
      setPesan("Gagal menyimpan dukungan. Periksa koneksi lalu coba lagi.");
    } finally {
      setProses(false);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-3">
          <KacaPill
            type="button"
            onClick={toggle}
            disabled={proses}
            aria-pressed={sudahVote}
            aria-busy={proses}
            title={user ? "" : "Masuk untuk mendukung laporan ini"}
            className={sudahVote ? PILL_BIRU : PILL_KACA}
          >
            <span className="inline-flex items-center gap-2">
              <ThumbsUp size={16} className={sudahVote ? "fill-current" : ""} />
              <motion.span key={jumlah}>{jumlah}</motion.span>
              <span>{sudahVote ? "Didukung" : "Dukung laporan ini"}</span>
            </span>
          </KacaPill>
          {!user && (
            <button
              type="button"
              onClick={() => setModalAuth(true)}
              className="min-h-[44px] text-xs text-ap-blue transition hover:underline focus-visible:outline-ap-blue-focus"
            >
              masuk untuk memberi dukungan
            </button>
          )}
        </div>
        {pesan && (
          <p role="alert" className="text-xs font-semibold text-danger">
            {pesan}
          </p>
        )}
      </div>

      <DemoAuthModal
        terbuka={modalAuth}
        tutup={() => setModalAuth(false)}
        judul="Dukung Laporan Ini"
        deskripsi="Masuk dengan salah satu akun demo untuk memberikan dukungan (vote) pada laporan warga ini."
        tujuan={`/laporan/${reportId}`}
      />
    </>
  );
}
