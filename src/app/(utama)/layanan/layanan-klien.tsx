"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Ambulance,
  Clock,
  Droplets,
  Leaf,
  MapPin,
  MessageCircle,
  Phone,
  PhoneOff,
  Recycle,
  Search,
  Shield,
} from "lucide-react";
import { Card, KosongState } from "@/components/ui";

type Layanan = {
  id: string;
  nama: string;
  kategori: string;
  telepon: string;
  bisaWa: boolean;
  alamat: string | null;
  jam: string;
};

/**
 * Halaman ini adalah satu-satunya layar SIGAP yang mungkin dibaca orang dalam
 * keadaan panik. Karena itu kategori punya TINGKAT, dan tingkat menentukan
 * ukuran serta warna — bukan sekadar label. Sebelumnya Ambulans dan tukang
 * sampah mendapat tombol hijau yang sama persis, dan nomor teleponnya adalah
 * teks terkecil di halaman.
 */
type Tingkat = "darurat" | "penting" | "rutin";

const KATEGORI_META: Record<
  string,
  { label: string; Ikon: typeof Leaf; tingkat: Tingkat }
> = {
  darurat: { label: "Darurat", Ikon: Ambulance, tingkat: "darurat" },
  kesehatan: { label: "Kesehatan", Ikon: Ambulance, tingkat: "penting" },
  keamanan: { label: "Keamanan", Ikon: Shield, tingkat: "penting" },
  lingkungan: { label: "Lingkungan", Ikon: Recycle, tingkat: "rutin" },
  utilitas: { label: "Utilitas", Ikon: Droplets, tingkat: "rutin" },
};

const URUTAN_TINGKAT: Record<Tingkat, number> = {
  darurat: 0,
  penting: 1,
  rutin: 2,
};

function metaKategori(kategori: string) {
  return KATEGORI_META[kategori] ?? KATEGORI_META.utilitas;
}

function nomorWa(telepon: string) {
  const digit = telepon.replace(/\D/g, "");
  if (digit.startsWith("62")) return digit;
  if (digit.startsWith("0")) return `62${digit.slice(1)}`;
  return null;
}

function nomorTel(telepon: string) {
  return telepon.replace(/[^+\d]/g, "");
}

function BarisLayanan({ l, tingkat }: { l: Layanan; tingkat: Tingkat }) {
  const wa = l.bisaWa ? nomorWa(l.telepon) : null;
  const darurat = tingkat === "darurat";

  return (
    <Card
      className={
        darurat
          ? "flex flex-wrap items-center gap-x-6 gap-y-4 border-l-4 border-l-danger p-6"
          : "flex flex-wrap items-center gap-x-5 gap-y-3 p-4"
      }
    >
      <div className="min-w-0 flex-1">
        <p className={darurat ? "font-display text-lg font-bold" : "font-bold"}>
          {l.nama}
        </p>

        {/* Nomor telepon adalah alasan halaman ini ada — jadi ia yang terbesar,
            bukan yang terkecil. */}
        <p
          className={
            darurat
              ? "angka-tabular mt-1 font-display text-3xl font-extrabold leading-none text-danger-kuat dark:text-red-300"
              : "angka-tabular mt-1 font-display text-xl font-bold leading-none"
          }
        >
          {l.telepon}
        </p>

        {(l.jam || l.alamat) && (
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            {l.jam && (
              <span className="flex items-center gap-1">
                <Clock size={12} aria-hidden /> {l.jam}
              </span>
            )}
            {l.alamat && (
              <span className="flex items-center gap-1">
                <MapPin size={12} aria-hidden /> {l.alamat}
              </span>
            )}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <a
          href={`tel:${nomorTel(l.telepon)}`}
          aria-label={`Telepon ${l.nama} di ${l.telepon}`}
          className={
            darurat
              ? "flex items-center gap-2 rounded-kontrol bg-danger px-6 py-3 text-base font-semibold text-white transition-[transform,background-color] duration-300 ease-sigap hover:bg-danger-kuat active:scale-[0.97]"
              : "flex items-center gap-1.5 rounded-kontrol bg-daun-600 px-4 py-2 text-sm font-semibold text-white transition-[transform,background-color] duration-300 ease-sigap hover:bg-daun-700 active:scale-[0.97]"
          }
        >
          <Phone size={darurat ? 17 : 14} aria-hidden /> Telepon
        </a>
        {wa && (
          <a
            href={`https://wa.me/${wa}`}
            target="_blank"
            rel="noreferrer"
            aria-label={`WhatsApp ${l.nama}`}
            className="flex items-center gap-1.5 rounded-kontrol border garis-halus px-4 py-2 text-sm font-semibold transition-[background-color,border-color] duration-300 ease-sigap hover:border-daun-400 hover:bg-panel-2"
          >
            <MessageCircle size={14} aria-hidden /> WhatsApp
          </a>
        )}
      </div>
    </Card>
  );
}

export function LayananKlien({ awal }: { awal: Layanan[] }) {
  const [kueri, setKueri] = useState("");

  const tampil = useMemo(() => {
    const q = kueri.trim().toLowerCase();
    if (!q) return awal;
    return awal.filter(
      (l) =>
        l.nama.toLowerCase().includes(q) ||
        l.kategori.toLowerCase().includes(q) ||
        l.telepon.includes(q)
    );
  }, [awal, kueri]);

  /* Dikelompokkan lalu diurutkan menurut tingkat: yang darurat selalu di atas,
     berapa pun urutan datanya dari database. */
  const grup = useMemo(() => {
    const peta = new Map<string, Layanan[]>();
    for (const l of tampil) {
      const arr = peta.get(l.kategori) ?? [];
      arr.push(l);
      peta.set(l.kategori, arr);
    }
    return [...peta.entries()].sort(
      (a, b) =>
        URUTAN_TINGKAT[metaKategori(a[0]).tingkat] -
        URUTAN_TINGKAT[metaKategori(b[0]).tingkat]
    );
  }, [tampil]);

  return (
    <div>
      <div className="relative mb-8">
        <Search
          size={16}
          aria-hidden
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          type="search"
          value={kueri}
          onChange={(e) => setKueri(e.target.value)}
          placeholder="Cari layanan… (mis. damkar, PLN, sampah)"
          aria-label="Cari layanan"
          className="w-full rounded-kontrol border garis-halus bg-panel py-3 pl-11 pr-4 text-sm outline-none transition-[border-color] duration-200 ease-sigap focus-visible:border-daun-500"
        />
      </div>

      <div className="space-y-10">
        {grup.map(([kategori, daftar]) => {
          const meta = metaKategori(kategori);
          const darurat = meta.tingkat === "darurat";
          return (
            <section key={kategori}>
              <h2
                className={
                  darurat
                    ? "mb-4 flex items-center gap-2 text-mikro font-bold uppercase text-danger-kuat dark:text-red-300"
                    : "mb-3 flex items-center gap-2 text-mikro font-semibold uppercase text-muted"
                }
              >
                <meta.Ikon size={15} aria-hidden /> {meta.label}
                {darurat && (
                  <span className="rounded-kontrol bg-danger/12 px-2 py-0.5 normal-case tracking-normal">
                    Hubungi lebih dulu saat mendesak
                  </span>
                )}
              </h2>
              <motion.div layout className="space-y-3">
                {daftar.map((l) => (
                  <BarisLayanan key={l.id} l={l} tingkat={meta.tingkat} />
                ))}
              </motion.div>
            </section>
          );
        })}

        {grup.length === 0 && (
          <Card>
            <KosongState
              ikon={<PhoneOff size={24} strokeWidth={1.6} />}
              judul={
                kueri
                  ? `Tidak ada layanan cocok dengan "${kueri}"`
                  : "Direktori layanan masih kosong"
              }
              isi={
                kueri
                  ? "Coba kata kunci lain, atau kosongkan pencarian untuk melihat seluruh direktori."
                  : "Nomor penting desa akan muncul di sini setelah dewan mengisinya."
              }
              aksi={
                kueri ? (
                  <button
                    type="button"
                    onClick={() => setKueri("")}
                    className="rounded-kontrol bg-daun-600 px-5 py-2.5 text-sm font-semibold text-white transition-[transform,background-color] duration-300 ease-sigap hover:bg-daun-700 active:scale-[0.97]"
                  >
                    Tampilkan semua layanan
                  </button>
                ) : undefined
              }
            />
          </Card>
        )}
      </div>
    </div>
  );
}
