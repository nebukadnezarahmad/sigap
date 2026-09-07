"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Trash2 } from "lucide-react";
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
      setPesan(`${error.message} Periksa koneksi lalu coba lagi.`);
      return;
    }
    setBukaEdit(false);
    router.refresh();
  }

  async function hapus() {
    setProses(true);
    setPesan(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("reports").delete().eq("id", laporan.id);
      if (error) throw error;
      setMintaHapus(false);
      router.refresh();
    } catch (e) {
      setPesan(e instanceof Error ? `${e.message} Periksa koneksi lalu coba lagi.` : "Gagal menghapus laporan. Periksa koneksi lalu coba lagi.");
    } finally {
      setProses(false);
    }
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
              name="judul"
              autoComplete="off"
              required
              maxLength={120}
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Contoh: TPS liar di ujung Jl. Melati…"
            />
          </div>
          <div>
            <Label htmlFor="edit-deskripsi">Deskripsi</Label>
            <Textarea
              id="edit-deskripsi"
              name="deskripsi"
              required
              rows={5}
              maxLength={4000}
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder="Contoh: tumpukan sampah menutup setengah jalan sejak 3 hari…"
            />
          </div>
          <div>
            <Label htmlFor="edit-alamat">Patokan alamat</Label>
            <Input
              id="edit-alamat"
              name="alamat"
              autoComplete="street-address"
              value={alamat}
              onChange={(e) => setAlamat(e.target.value)}
              placeholder="Contoh: depan Masjid Al-Ikhlas, RT 03…"
            />
          </div>
          {pesan && bukaEdit && (
            <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
              {pesan}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="sekunder" onClick={() => setBukaEdit(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={proses} aria-busy={proses}>
              {proses && <Loader2 size={16} aria-hidden className="animate-spin" />}
              {proses ? "Menyimpan laporan…" : "Simpan perubahan"}
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
        {pesan && mintaHapus && (
          <p role="alert" className="mt-3 rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
            {pesan}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="sekunder" onClick={() => setMintaHapus(false)} disabled={proses}>
            Batal
          </Button>
          <Button type="button" variant="bahaya" onClick={hapus} disabled={proses} aria-busy={proses}>
            {proses && <Loader2 size={16} aria-hidden className="animate-spin" />}
            {proses ? "Menghapus laporan…" : "Ya, hapus laporan"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
