"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  CookingPot,
  Flower2,
  Hammer,
  MessageCircle,
  Plus,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, Input, Label, Select, Textarea } from "@/components/ui";
import { Modal } from "@/components/modal";

type Usaha = {
  id: string;
  nama: string;
  kategori: string;
  produk: string;
  whatsapp: string;
  alamat: string | null;
  jamBuka: string | null;
  verified: boolean;
  milikKu: boolean;
};

const KATEGORI = [
  { id: "kuliner", label: "Kuliner", Ikon: CookingPot },
  { id: "kerajinan", label: "Kerajinan", Ikon: Hammer },
  { id: "jasa", label: "Jasa", Ikon: ShoppingBag },
  { id: "pertanian", label: "Pertanian", Ikon: Flower2 },
  { id: "lainnya", label: "Lainnya", Ikon: ShoppingBag },
] as const;

function nomorWa(telepon: string) {
  const digit = telepon.replace(/\D/g, "");
  if (digit.startsWith("62")) return digit;
  if (digit.startsWith("0")) return `62${digit.slice(1)}`;
  return null;
}

function KartuUsaha({ usaha }: { usaha: Usaha }) {
  const wa = nomorWa(usaha.whatsapp);
  const meta = KATEGORI.find((k) => k.id === usaha.kategori) ?? KATEGORI[4];
  return (
    <Card className="flex h-full flex-col p-5">
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-kunyit-500/15 text-kunyit-600 dark:text-kunyit-400">
          <meta.Ikon size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display font-bold leading-snug">{usaha.nama}</h2>
          <p className="mt-0.5 text-xs uppercase tracking-wide text-muted">
            {meta.label}
          </p>
        </div>
        {usaha.verified && (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-daun-500/15 px-2.5 py-1 text-xs font-semibold text-daun-700 dark:text-daun-300">
            <Sparkles size={11} /> Terverifikasi
          </span>
        )}
      </div>

      <p className="mt-3 flex-1 text-sm text-muted teks-pretty">{usaha.produk}</p>

      <p className="mt-3 text-xs text-muted">
        {[usaha.alamat, usaha.jamBuka].filter(Boolean).join(" · ") || "Alamat menyusul"}
      </p>

      {wa && (
        <a
          href={`https://wa.me/${wa}`}
          target="_blank"
          rel="noreferrer"
          className="mt-4 flex items-center justify-center gap-1.5 rounded-full bg-daun-600 py-2.5 text-sm font-semibold text-white transition hover:bg-daun-700"
        >
          <MessageCircle size={15} /> Hubungi via WhatsApp
        </a>
      )}
    </Card>
  );
}

function FormAjukanUsaha({
  tutup,
  selesai,
}: {
  tutup: () => void;
  selesai: () => void;
}) {
  const [nama, setNama] = useState("");
  const [kategori, setKategori] = useState("kuliner");
  const [produk, setProduk] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [alamat, setAlamat] = useState("");
  const [jam, setJam] = useState("");
  const [proses, setProses] = useState(false);
  const [pesan, setPesan] = useState<string | null>(null);

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    setProses(true);
    setPesan(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase.from("umkm").insert({
      nama,
      kategori,
      produk,
      whatsapp,
      alamat: alamat.trim() || null,
      jam_buka: jam.trim() || null,
      owner_id: user?.id ?? null,
    });
    setProses(false);
    if (error) {
      setPesan(error.message);
      return;
    }
    selesai();
  }

  return (
    <form onSubmit={kirim} className="space-y-4">
      <div>
        <Label htmlFor="um-nama">Nama usaha</Label>
        <Input
          id="um-nama"
          required
          minLength={3}
          maxLength={100}
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          placeholder="Contoh: Warung Sembako Bu Tuti"
        />
      </div>
      <div>
        <Label htmlFor="um-kategori">Kategori</Label>
        <Select id="um-kategori" value={kategori} onChange={(e) => setKategori(e.target.value)}>
          {KATEGORI.map((k) => (
            <option key={k.id} value={k.id}>
              {k.label}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="um-produk">Produk / layanan utama</Label>
        <Textarea
          id="um-produk"
          required
          maxLength={300}
          rows={2}
          value={produk}
          onChange={(e) => setProduk(e.target.value)}
          placeholder="Apa yang dijual atau dikerjakan?"
        />
      </div>
      <div>
        <Label htmlFor="um-wa">Nomor WhatsApp</Label>
        <Input
          id="um-wa"
          required
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          placeholder="08xx xxxx xxxx"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="um-alamat">Lokasi (opsional)</Label>
          <Input id="um-alamat" value={alamat} onChange={(e) => setAlamat(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="um-jam">Jam buka (opsional)</Label>
          <Input
            id="um-jam"
            value={jam}
            onChange={(e) => setJam(e.target.value)}
            placeholder="08.00–17.00 WIB"
          />
        </div>
      </div>
      {pesan && (
        <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
          {pesan}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="sekunder" onClick={tutup}>
          Batal
        </Button>
        <Button type="submit" disabled={proses}>
          {proses ? "Menyimpan…" : "Ajukan usaha"}
        </Button>
      </div>
    </form>
  );
}

export function UmkmKlien({ awal, masuk }: { awal: Usaha[]; masuk: boolean }) {
  const router = useRouter();
  const [daftar, setDaftar] = useState(awal);
  const [formBuka, setFormBuka] = useState(false);

  const tampil = useMemo(() => daftar, [daftar]);

  return (
    <div>
      {masuk && (
        <div className="mb-6 flex justify-end">
          <Button variant="sekunder" onClick={() => setFormBuka(true)}>
            <Plus size={15} /> Daftarkan usahamu
          </Button>
        </div>
      )}

      <AnimatePresence initial={false}>
        <motion.div layout className="grid gap-4 sm:grid-cols-2">
          {tampil.map((u) => (
            <motion.div
              key={u.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              <KartuUsaha usaha={u} />
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
      {tampil.length === 0 && (
        <Card className="p-10 text-center text-sm text-muted">
          Belum ada usaha terdaftar. Jadilah yang pertama!
        </Card>
      )}

      <Modal terbuka={formBuka} tutup={() => setFormBuka(false)} judul="Daftarkan usaha">
        <FormAjukanUsaha
          tutup={() => setFormBuka(false)}
          selesai={() => {
            setFormBuka(false);
            router.refresh();
          }}
        />
      </Modal>
    </div>
  );
}
