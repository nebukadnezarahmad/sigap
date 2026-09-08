"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BellOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/modal";
import { Button } from "@/components/ui";

/* Fusi visual-fusion: target sentuh 44px + :focus-visible Action Blue.
   Varian danger/sekunder, copy, pesan error, aria, dan logika tetap. */
const SENTUH_44 = "min-h-[44px] focus-visible:outline-ap-blue-focus";

export function HapusAreaKlien({ id }: { id: string }) {
  const router = useRouter();
  const [proses, setProses] = useState(false);
  const [buka, setBuka] = useState(false);
  const [pesan, setPesan] = useState<string | null>(null);

  async function hapus() {
    setProses(true);
    setPesan(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("area_follows").delete().eq("id", id);
      if (error) throw error;
      setBuka(false);
      router.refresh();
    } catch (e) {
      const inti = e instanceof Error ? e.message : "Gagal berhenti mengikuti area.";
      setPesan(`${inti} Periksa koneksi lalu coba lagi.`);
    } finally {
      setProses(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setPesan(null);
          setBuka(true);
        }}
        disabled={proses}
        aria-label="Berhenti ikuti area"
        aria-busy={proses}
        title="Berhenti ikuti"
        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-muted transition hover:bg-danger/10 hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus"
      >
        <BellOff size={15} />
      </button>

      <Modal
        terbuka={buka}
        tutup={() => {
          if (!proses) setBuka(false);
        }}
        judul="Berhenti ikuti area ini?"
        lebar="max-w-md"
      >
        <p className="text-sm leading-relaxed text-muted">
          Kamu tidak akan lagi menerima notifikasi laporan baru dari area ini.
          Kamu bisa mengikutinya lagi kapan pun dari halaman peta.
        </p>
        {pesan && (
          <p role="alert" className="mt-3 rounded-[11px] bg-danger/10 px-3 py-2 text-sm text-danger">
            {pesan}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <Button
            type="button"
            variant="sekunder"
            onClick={() => setBuka(false)}
            disabled={proses}
            className={SENTUH_44}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="bahaya"
            onClick={hapus}
            disabled={proses}
            aria-busy={proses}
            className={SENTUH_44}
          >
            {proses ? "Memproses…" : "Ya, berhenti ikuti"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
