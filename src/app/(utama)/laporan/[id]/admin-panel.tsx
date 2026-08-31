"use client";

import { useState } from "react";
import { ImagePlus, Save, Wrench } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { STATUS, type StatusKey } from "@/lib/constants";
import { useUser } from "@/lib/use-user";
import { Button, Card, Input, Label, Select, Textarea } from "@/components/ui";

export function AdminPanel({
  reportId,
  statusAwal,
  petugasAwal,
}: {
  reportId: string;
  statusAwal: StatusKey;
  petugasAwal: string;
}) {
  const router = useRouter();
  const { user } = useUser();
  const [status, setStatus] = useState<StatusKey>(statusAwal);
  const [petugas, setPetugas] = useState(petugasAwal);
  const [catatan, setCatatan] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [proses, setProses] = useState(false);
  const [pesan, setPesan] = useState<string | null>(null);

  async function simpan() {
    if (!user) return;
    setProses(true);
    setPesan(null);
    try {
      const supabase = createClient();

      if ((status === "selesai" || status === "menunggu_verifikasi") && !file) {
        // Cek apakah sudah ada foto sesudah sebelumnya
        const { data: adaFoto } = await supabase
          .from("report_photos")
          .select("id")
          .eq("report_id", reportId)
          .eq("fase", "sesudah")
          .limit(1);

        if (!adaFoto || adaFoto.length === 0) {
          throw new Error("Foto bukti fisik sesudah penanganan wajib diunggah.");
        }
      }

      if (file) {
        if (file.size > 5 * 1024 * 1024)
          throw new Error("Ukuran foto maksimal 5 MB.");
        const path = `${user.id}/sesudah-${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
        const { error: upErr } = await supabase.storage
          .from("foto-laporan")
          .upload(path, file, { contentType: file.type });
        if (upErr) throw new Error(`Gagal unggah foto: ${upErr.message}`);
        const { data: pub } = supabase.storage
          .from("foto-laporan")
          .getPublicUrl(path);
        await supabase.from("report_photos").insert({
          report_id: reportId,
          url: pub.publicUrl,
          fase: "sesudah",
        });
      }

      const ubah: Record<string, unknown> = { status };
      if (petugas.trim() !== petugasAwal) {
        ubah.petugas = petugas.trim() || null;
        ubah.assigned_at = petugas.trim() ? new Date().toISOString() : null;
      }

      const { error } = await supabase
        .from("reports")
        .update(ubah)
        .eq("id", reportId);
      if (error) throw new Error(error.message);

      if (catatan.trim()) {
        const { data: ev } = await supabase
          .from("report_events")
          .select("id")
          .eq("report_id", reportId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
        if (ev) {
          await supabase
            .from("report_events")
            .update({ catatan: catatan.trim() })
            .eq("id", ev.id);
        }
      }

      setPesan("Tersimpan!");
      setCatatan("");
      setFile(null);
      router.refresh();
    } catch (e) {
      setPesan(e instanceof Error ? e.message : "Gagal menyimpan.");
    } finally {
      setProses(false);
    }
  }

  return (
    <Card className="border-kunyit-500/40 bg-kunyit-100/30 p-5 dark:bg-kunyit-500/5">
      <h2 className="mb-4 flex items-center gap-2 font-display font-bold">
        <Wrench size={16} /> Panel Dewan & Petugas
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="status-admin">Status penanganan</Label>
          <Select
            id="status-admin"
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusKey)}
          >
            {(Object.keys(STATUS) as StatusKey[]).map((s) => (
              <option key={s} value={s}>
                {STATUS[s].label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="petugas">Petugas penanganan</Label>
          <Input
            id="petugas"
            list="daftar-petugas"
            value={petugas}
            onChange={(e) => setPetugas(e.target.value)}
            placeholder="cth. Tim DLH Kecamatan"
          />
          <datalist id="daftar-petugas">
            <option value="Tim DLH Kecamatan" />
            <option value="Petugas Kebersihan 1" />
            <option value="Dinas PU Bina Marga" />
            <option value="PLN Area" />
          </datalist>
        </div>
      </div>
      <div>
        <Label htmlFor="catatan-admin">
          Catatan untuk linimasa (opsional, melengkapi status terbaru)
        </Label>
        <Textarea
          id="catatan-admin"
          rows={2}
          maxLength={300}
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          placeholder="cth. Petugas DLH dikirim hari ini, target selesai 3 hari"
        />
      </div>
      {(status === "selesai" || status === "menunggu_verifikasi") && (
        <div className="mt-3 space-y-2">
          <label
            htmlFor="foto-sesudah"
            className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-daun-500/50 bg-daun-500/5 px-3.5 py-3 text-sm text-ink transition hover:border-daun-500 hover:bg-daun-500/10"
          >
            <ImagePlus size={17} className="text-daun-600 dark:text-daun-400" />
            <span className="font-semibold">
              {file ? file.name : "Unggah foto bukti fisik sesudah (Wajib)*"}
            </span>
            <input
              id="foto-sesudah"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <p className="text-xs text-muted">
            Foto bukti fisik mutlak diperlukan demi akuntabilitas sebelum laporan dapat diverifikasi warga.
          </p>
        </div>
      )}
      <div className="mt-4 flex items-center gap-3">
        <Button onClick={simpan} disabled={proses}>
          <Save size={16} /> {proses ? "Menyimpan…" : "Simpan perubahan"}
        </Button>
        {pesan && <span className="text-sm font-semibold text-daun-700 dark:text-daun-300">{pesan}</span>}
      </div>
    </Card>
  );
}
