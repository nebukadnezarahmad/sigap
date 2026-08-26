"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  Armchair,
  BookOpen,
  CheckCircle2,
  HandHeart,
  Laptop,
  PackageOpen,
  Plus,
  Shirt,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Barang } from "./page";
import {
  Button,
  Card,
  Input,
  KosongState,
  Label,
  Select,
  Textarea,
} from "@/components/ui";
import { Modal } from "@/components/modal";

/**
 * Tiap kategori punya warna sendiri dengan HUE yang berbeda — bukan gradasi
 * satu hue, karena gradasi diam-diam menciptakan urutan/ranking yang tidak
 * dimaksud. Sebelumnya kelima kategori punya lima ikon berbeda lalu semuanya
 * diberi latar hijau yang sama: warna murni dekoratif.
 *
 * Warna dipilih agar >= 3:1 terhadap putih supaya aman dipakai sebagai isian.
 */
const KATEGORI = [
  { id: "elektronik", label: "Elektronik", Ikon: Laptop, warna: "#0369a1" },
  { id: "pakaian", label: "Pakaian", Ikon: Shirt, warna: "#a21caf" },
  { id: "mebel", label: "Mebel", Ikon: Armchair, warna: "#b45309" },
  { id: "buku", label: "Buku & mainan", Ikon: BookOpen, warna: "#4d7c0f" },
  { id: "lainnya", label: "Lainnya", Ikon: PackageOpen, warna: "#64748b" },
] as const;

function kategoriPasar(kategori: string) {
  return KATEGORI.find((k) => k.id === kategori) ?? KATEGORI[4];
}

const KONDISI_LABEL: Record<string, string> = {
  "seperti-baru": "Seperti baru",
  baik: "Baik",
  cukup: "Cukup",
};

function IkonKategori({ kategori }: { kategori: string }) {
  const found = kategoriPasar(kategori);
  return (
    <span
      className="flex size-11 shrink-0 items-center justify-center rounded-item"
      style={{ backgroundColor: `${found.warna}1f`, color: found.warna }}
    >
      <found.Ikon size={20} aria-hidden />
    </span>
  );
}

function KartuBarang({
  barang,
  masuk,
  userId,
}: {
  barang: Barang;
  masuk: boolean;
  userId: string | null;
}) {
  const router = useRouter();
  const [data, setData] = useState(barang);
  const [proses, setProses] = useState(false);
  const [pesan, setPesan] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const ch = supabase
      .channel(`pasar-${barang.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "pasar_barang", filter: `id=eq.${barang.id}` },
        (payload) => {
          const baru = payload.new as { status: string; claimed_by: string | null };
          setData((d) => ({ ...d, status: baru.status }));
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [barang.id]);

  async function klaim() {
    if (!masuk || proses || data.status !== "tersedia" || data.milikKu) return;
    setProses(true);
    setPesan(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("pasar_barang")
      .update({ status: "terklaim", claimed_by: userId })
      .eq("id", data.id);
    if (error) {
      setPesan(error.message);
      setProses(false);
      return;
    }
    setData((d) => ({ ...d, status: "terklaim" }));
    setProses(false);
    router.refresh();
  }

  const tersedia = data.status === "tersedia";

  return (
    <Card className="p-5">
      <div className="flex gap-3">
        <IkonKategori kategori={data.kategori} />
        <div className="min-w-0 flex-1">
          <h2 className="font-display font-bold leading-snug">{data.judul}</h2>
          <p className="mt-1 text-xs text-muted">
            dari @{data.pemilik_nama ?? "warga"} ·{" "}
            <span className="uppercase tracking-wide">{data.kategori}</span> ·{" "}
            {KONDISI_LABEL[data.kondisi] ?? data.kondisi}
          </p>
        </div>
        <span
          className={
            tersedia
              ? "shrink-0 rounded-full bg-daun-500/15 px-2.5 py-1 text-xs font-semibold text-daun-700 dark:text-daun-300"
              : "shrink-0 rounded-full bg-panel-2 px-2.5 py-1 text-xs font-semibold text-muted"
          }
        >
          {tersedia ? "Tersedia" : "Terklaim"}
        </span>
      </div>

      {data.deskripsi && (
        <p className="mt-3 text-sm text-muted teks-pretty">{data.deskripsi}</p>
      )}

      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
        <Sparkles size={13} /> Ambil di: {data.titik_ambil}
      </p>

      {pesan && (
        <p role="alert" className="mt-3 rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
          {pesan}
        </p>
      )}

      {tersedia && !data.milikKu && (
        <Button
          className="mt-4 w-full"
          variant={masuk ? "utama" : "sekunder"}
          disabled={proses || !masuk}
          onClick={klaim}
        >
          {masuk ? (
            <>
              <HandHeart size={15} /> {proses ? "Mengklaim…" : "Klaim barang ini (+3 poin)"}
            </>
          ) : (
            "Masuk untuk mengklaim"
          )}
        </Button>
      )}
      {!tersedia && (
        <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-daun-700 dark:text-daun-300">
          <CheckCircle2 size={15} /> Sudah ditemukan pemilik barunya.
        </p>
      )}
    </Card>
  );
}

function FormPasangBarang({
  tutup,
  selesai,
}: {
  tutup: () => void;
  selesai: () => void;
}) {
  const [judul, setJudul] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [kategori, setKategori] = useState("elektronik");
  const [kondisi, setKondisi] = useState("baik");
  const [titik, setTitik] = useState("");
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
    const { error } = await supabase.from("pasar_barang").insert({
      user_id: user!.id,
      judul,
      deskripsi: deskripsi.trim() || null,
      kategori,
      kondisi,
      titik_ambil: titik,
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
        <Label htmlFor="pb-judul">Nama barang</Label>
        <Input
          id="pb-judul"
          required
          minLength={3}
          maxLength={120}
          value={judul}
          onChange={(e) => setJudul(e.target.value)}
          placeholder="Contoh: Rak sepatu 4 susun"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="pb-kategori">Kategori</Label>
          <Select id="pb-kategori" value={kategori} onChange={(e) => setKategori(e.target.value)}>
            {KATEGORI.map((k) => (
              <option key={k.id} value={k.id}>
                {k.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="pb-kondisi">Kondisi</Label>
          <Select id="pb-kondisi" value={kondisi} onChange={(e) => setKondisi(e.target.value)}>
            <option value="seperti-baru">Seperti baru</option>
            <option value="baik">Baik</option>
            <option value="cukup">Cukup</option>
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="pb-titik">Titik ambil</Label>
        <Input
          id="pb-titik"
          required
          minLength={3}
          maxLength={160}
          value={titik}
          onChange={(e) => setTitik(e.target.value)}
          placeholder="Di mana barang bisa diambil?"
        />
      </div>
      <div>
        <Label htmlFor="pb-deskripsi">Deskripsi singkat (opsional)</Label>
        <Textarea
          id="pb-deskripsi"
          maxLength={1000}
          rows={3}
          value={deskripsi}
          onChange={(e) => setDeskripsi(e.target.value)}
          placeholder="Keadaan barang, alasan memberi, catatan penting…"
        />
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
          {proses ? "Menyimpan…" : "Pasang barang (+10 poin)"}
        </Button>
      </div>
    </form>
  );
}

export function PasarKlien({
  awal,
  masuk,
  userId,
}: {
  awal: Barang[];
  masuk: boolean;
  userId: string | null;
}) {
  const router = useRouter();
  const [barang, setBarang] = useState(awal);
  const [filter, setFilter] = useState<string>("semua");
  const [formBuka, setFormBuka] = useState(false);

  /* Menyesuaikan state saat prop berubah — pola resmi React, bukan setState
     sinkron di dalam effect (yang memicu render bertingkat). */
  const [awalSebelumnya, setAwalSebelumnya] = useState(awal);
  if (awal !== awalSebelumnya) {
    setAwalSebelumnya(awal);
    setBarang(awal);
  }

  useEffect(() => {
    if (!masuk) return;
    const supabase = createClient();
    const ch = supabase
      .channel("pasar-semua")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "pasar_barang" },
        () => router.refresh()
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [masuk, router]);

  const tampil = useMemo(
    () => (filter === "semua" ? barang : barang.filter((b) => b.kategori === filter)),
    [barang, filter]
  );

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setFilter("semua")}
          className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
            filter === "semua"
              ? "bg-daun-600 text-white"
              : "border garis-halus text-muted hover:bg-panel-2 hover:text-ink"
          }`}
        >
          Semua
        </button>
        {KATEGORI.map((k) => (
          <button
            key={k.id}
            onClick={() => setFilter(k.id)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              filter === k.id
                ? "bg-daun-600 text-white"
                : "border garis-halus text-muted hover:bg-panel-2 hover:text-ink"
            }`}
          >
            {k.label}
          </button>
        ))}
        {masuk && (
          <Button className="ml-auto" onClick={() => setFormBuka(true)}>
            <Plus size={15} /> Pasang barang
          </Button>
        )}
      </div>

      <AnimatePresence initial={false}>
        <motion.div layout className="grid gap-4 sm:grid-cols-2">
          {/* Key sebelumnya `${b.id}-${b.status}`, sehingga barang yang diklaim
              UNMOUNT lalu MOUNT lagi — kartunya hilang lalu muncul kembali
              alih-alih bertransisi. */}
          {tampil.map((b) => (
            <motion.div
              key={b.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <KartuBarang barang={b} masuk={masuk} userId={userId} />
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
      {tampil.length === 0 && (
        <Card>
          <KosongState
            ikon={<PackageOpen size={24} strokeWidth={1.6} />}
            judul={
              filter === "semua"
                ? "Belum ada barang di Pasar ReUse"
                : `Belum ada barang ${kategoriPasar(filter).label.toLowerCase()}`
            }
            isi={
              filter === "semua"
                ? "Barang bekas layak pakai yang dipasang warga akan muncul di sini — gratis untuk diklaim tetangga."
                : "Coba lihat kategori lain, atau jadilah yang pertama memasang di kategori ini."
            }
            aksi={
              <>
                {filter !== "semua" && (
                  <Button variant="sekunder" size="sm" onClick={() => setFilter("semua")}>
                    Lihat semua kategori
                  </Button>
                )}
                {masuk && (
                  <Button size="sm" onClick={() => setFormBuka(true)}>
                    <Plus size={14} aria-hidden /> Pasang barang
                  </Button>
                )}
              </>
            }
          />
        </Card>
      )}

      <Modal terbuka={formBuka} tutup={() => setFormBuka(false)} judul="Pasang barang bekas">
        <FormPasangBarang
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
