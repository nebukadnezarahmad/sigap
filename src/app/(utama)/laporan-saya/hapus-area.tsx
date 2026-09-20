"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BellOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/modal";
import { Button } from "@/components/ui";

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
      console.error("Gagal berhenti mengikuti area:", e);
      setPesan("Belum bisa berhenti mengikuti. Periksa koneksi lalu coba lagi.");
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
        aria-label="Berhenti mengikuti area ini"
        aria-busy={proses}
        title="Berhenti mengikuti area ini"
        className="flex size-8 items-center justify-center rounded-lg text-muted transition hover:bg-danger/10 hover:text-danger"
      >
        <BellOff size={15} />
      </button>

      <Modal
        terbuka={buka}
        tutup={() => {
          if (!proses) setBuka(false);
        }}
        judul="Berhenti mengikuti area ini?"
        lebar="max-w-md"
      >
        <p className="text-sm leading-relaxed text-muted">
          Kamu tidak akan lagi menerima notifikasi laporan baru dari area ini.
          Kamu bisa mengikutinya lagi kapan pun dari halaman peta.
        </p>
        {pesan && (
          <p role="alert" className="mt-3 rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
            {pesan}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <Button
            type="button"
            variant="sekunder"
            onClick={() => setBuka(false)}
            disabled={proses}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="bahaya"
            onClick={hapus}
            disabled={proses}
            loading={proses}
            loadingLabel="Berhenti mengikuti…"
            aria-busy={proses}
          >
            {proses ? "Berhenti mengikuti…" : "Ya, berhenti mengikuti"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
