"use client";

import { useState } from "react";
import { Eye, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/use-user";
import { Button, Card } from "@/components/ui";
import { DemoAuthModal } from "@/components/tombol-demo-login";
import type { StatusKey } from "@/lib/constants";

export function KonfirmasiButton({
  reportId,
  jumlahAwal,
  sudahAwal,
  masuk,
  status,
}: {
  reportId: string;
  jumlahAwal: number;
  sudahAwal: boolean;
  masuk: boolean;
  status: StatusKey;
}) {
  const router = useRouter();
  const { user } = useUser();
  const [jumlah, setJumlah] = useState(jumlahAwal);
  const [sudah, setSudah] = useState(sudahAwal);
  const [proses, setProses] = useState(false);
  const [modalAuth, setModalAuth] = useState(false);
  const [pesan, setPesan] = useState<string | null>(null);

  async function toggleKonfirmasi() {
    if (!user) {
      setModalAuth(true);
      return;
    }
    if (proses) return;
    setProses(true);
    setPesan(null);
    const supabase = createClient();

    try {
      if (sudah) {
        const { error } = await supabase
          .from("confirmations")
          .delete()
          .eq("report_id", reportId)
          .eq("user_id", user.id);
        if (error) throw error;
        setSudah(false);
        setJumlah((n) => Math.max(0, n - 1));
      } else {
        // Jalur utama: RPC atomik (fallback ke cara lama jika RPC belum ada)
        try {
          const { data, error } = await supabase.rpc("konfirmasi_laporan", {
            p_report_id: reportId,
          });
          if (error) throw error;
          const hasil = data as { jumlah?: number; selesai?: boolean } | null;
          setSudah(true);
          setJumlah(hasil?.jumlah ?? jumlah + 1);
          if (hasil?.selesai) {
            setPesan("Laporan telah diverifikasi oleh 2 warga dan resmi berstatus Selesai!");
          }
          router.refresh();
          return;
        } catch {
          /* RPC belum tersedia — lanjut ke cara lama */
        }

        const { error: insErr } = await supabase
          .from("confirmations")
          .insert({ report_id: reportId, user_id: user.id });
        if (insErr) throw insErr;
        const baruJml = jumlah + 1;
        setSudah(true);
        setJumlah(baruJml);

        // Jika status menunggu_verifikasi dan konfirmasi mencapai 2, selesaikan resmi
        if (status === "menunggu_verifikasi" && baruJml >= 2) {
          const { error: updErr } = await supabase
            .from("reports")
            .update({ status: "selesai" })
            .eq("id", reportId);
          if (updErr) throw updErr;
          setPesan("Laporan telah diverifikasi oleh 2 warga dan resmi berstatus Selesai!");
          router.refresh();
        }
      }
    } catch (e) {
      const inti = e instanceof Error ? e.message : "Gagal menyimpan konfirmasi.";
      setPesan(`${inti} Periksa koneksi lalu coba lagi.`);
    } finally {
      setProses(false);
    }
  }

  async function tolakVerifikasi() {
    if (!user) {
      setModalAuth(true);
      return;
    }
    if (proses) return;
    setProses(true);
    try {
      const supabase = createClient();
      // Jalur resmi: RPC sistem (guard owner menolak update langsung
      // saat status bukan "baru", bahkan oleh pemilik laporan).
      const { error: rpcErr } = await supabase.rpc("tolak_verifikasi", {
        p_report_id: reportId,
      });
      if (rpcErr) throw rpcErr;

      setPesan("Laporan dikembalikan ke status 'Dikerjakan' untuk ditindaklanjuti ulang.");
      router.refresh();
    } catch (e) {
      setPesan(e instanceof Error ? e.message : "Penolakan gagal, coba lagi.");
    } finally {
      setProses(false);
    }
  }

  // Khusus mode Verifikasi Warga saat status Menunggu Verifikasi
  if (status === "menunggu_verifikasi") {
    return (
      <div className="w-full space-y-3">
        <Card className="border-orange-500/40 bg-orange-500/10 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="mt-0.5 shrink-0 text-orange-600 dark:text-orange-400" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-display font-bold text-base text-ink">
                  Tahap Verifikasi Warga Sekitar
                </p>
                <span className="rounded-full bg-orange-500/20 px-2.5 py-0.5 text-xs font-bold text-orange-700 dark:text-orange-300">
                  {jumlah}/2 Konfirmasi Warga
                </span>
              </div>
              <p className="mt-1 text-sm text-muted leading-relaxed">
                Petugas telah mengajukan bukti perbaikan. Apakah Anda mengonfirmasi bahwa masalah di lokasi ini sudah benar-benar beres?
              </p>

              {pesan && (
                <p
                  role={pesan.includes("Gagal") ? "alert" : "status"}
                  className="mt-2 text-xs font-semibold text-daun-700 dark:text-daun-300"
                >
                  {pesan}
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-2.5">
                <Button
                  type="button"
                  onClick={toggleKonfirmasi}
                  disabled={proses}
                  aria-pressed={sudah}
                  aria-busy={proses}
                  className="bg-action hover:bg-action-hover text-white"
                >
                  <CheckCircle2 size={16} />
                  {sudah ? "Sudah Kamu Verifikasi" : "Ya, Masalah Sudah Selesai"}
                </Button>
                <Button
                  type="button"
                  variant="sekunder"
                  onClick={tolakVerifikasi}
                  disabled={proses}
                  aria-busy={proses}
                  className="border-danger/30 text-danger hover:bg-danger/10"
                >
                  <XCircle size={16} /> Masalah Belum Beres
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <DemoAuthModal
          terbuka={modalAuth}
          tutup={() => setModalAuth(false)}
          judul="Verifikasi Penyelesaian Masalah"
          deskripsi="Masuk dengan akun demo warga untuk mengonfirmasi bahwa masalah lingkungan ini telah selesai dibereskan."
          tujuan={`/laporan/${reportId}`}
        />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant={sudah ? "utama" : "sekunder"}
          onClick={toggleKonfirmasi}
          disabled={proses}
          aria-pressed={sudah}
          aria-busy={proses}
          title={masuk ? "" : "Masuk untuk konfirmasi"}
        >
          <Eye size={16} className={sudah ? "fill-current" : ""} />
          <motion.span key={jumlah}>{jumlah}</motion.span>
          <span>
            {status === "selesai"
              ? "Diverifikasi Warga"
              : sudah
              ? "Kukonfirmasi Ada"
              : "Saya juga melihat ini"}
          </span>
        </Button>
        {pesan && (
          <p
            role={pesan.includes("Gagal") ? "alert" : "status"}
            className="text-xs font-semibold text-danger"
          >
            {pesan}
          </p>
        )}
      </div>

      <DemoAuthModal
        terbuka={modalAuth}
        tutup={() => setModalAuth(false)}
        judul="Konfirmasi Keberadaan Masalah"
        deskripsi="Masuk dengan akun demo untuk ikut mengonfirmasi keberadaan masalah ini di lapangan."
        tujuan={`/laporan/${reportId}`}
      />
    </>
  );
}
