"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Label, Textarea } from "@/components/ui";
import { Modal } from "@/components/modal";

type Ringkas = {
  id: string;
  judul: string;
  deskripsi: string;
  alamat_teks: string;
};

export function AksiLaporanSaya({
  laporan,
  bisaDisunting,
}: {
  laporan: Ringkas;
  bisaDisunting: boolean;
}) {
  const router = useRouter();
  const [bukaEdit, setBukaEdit] = useState(false);
  const [mintaHapus, setMintaHapus] = useState(false);
  const [judul, setJudul] = useState(laporan.judul);
  const [deskripsi, setDeskripsi] = useState(laporan.deskripsi);
  const [alamat, setAlamat] = useState(laporan.alamat_teks);
  const [proses, setProses] = useState(false);
  const [pesan, setPesan] = useState<string | null>(null);

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    setProses(true);
    setPesan(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("reports")
      .update({
        judul,
        deskripsi,
        alamat_teks: alamat.trim() || null,
      })
      .eq("id", laporan.id);
    setProses(false);
    if (error) {
      setPesan(error.message);
      return;
    }
    setBukaEdit(false);
    router.refresh();
  }

  async function hapus() {
    setProses(true);
    const supabase = createClient();
    await supabase.from("reports").delete().eq("id", laporan.id);
    setProses(false);
    setMintaHapus(false);
    router.refresh();
  }

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      {bisaDisunting ? (
        <>
          <Button
            variant="hantu"
            size="sm"
            onClick={() => setBukaEdit(true)}
            aria-label="Sunting laporan"
            title="Sunting laporan"
            className="!px-2.5"
          >
            <Pencil size={15} />
          </Button>
          <Button
            variant="bahaya"
            size="sm"
            onClick={() => setMintaHapus(true)}
            aria-label="Hapus laporan"
            title="Hapus laporan"
            className="!px-2.5"
          >
            <Trash2 size={15} />
          </Button>
        </>
      ) : (
        <span className="rounded-full bg-panel-2 px-3 py-1 text-[11px] font-semibold text-muted">
          Terkunci
        </span>
      )}

      <Modal
        terbuka={bukaEdit}
        tutup={() => setBukaEdit(false)}
        judul="Sunting laporan"
      >
        <form onSubmit={simpan} className="space-y-4">
          <div>
            <Label htmlFor="edit-judul">Judul</Label>
            <Input
              id="edit-judul"
              required
              maxLength={120}
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="edit-deskripsi">Deskripsi</Label>
            <Textarea
              id="edit-deskripsi"
              required
              rows={5}
              maxLength={4000}
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="edit-alamat">Patokan alamat</Label>
            <Input
              id="edit-alamat"
              value={alamat}
              onChange={(e) => setAlamat(e.target.value)}
              placeholder="Opsional"
            />
          </div>
          {pesan && (
            <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
              {pesan}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="sekunder" onClick={() => setBukaEdit(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={proses}>
              {proses ? "Menyimpan…" : "Simpan perubahan"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        terbuka={mintaHapus}
        tutup={() => setMintaHapus(false)}
        judul="Hapus laporan ini?"
        lebar="max-w-md"
      >
        <p className="text-sm leading-relaxed text-muted">
          &quot;{laporan.judul}&quot; beserta foto, komentar, dan dukungannya
          akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="sekunder" onClick={() => setMintaHapus(false)}>
            Batal
          </Button>
          <Button variant="bahaya" onClick={hapus} disabled={proses}>
            {proses ? "Menghapus…" : "Ya, hapus"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
