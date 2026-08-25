"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Ambulance,
  Droplets,
  Leaf,
  MessageCircle,
  Phone,
  Recycle,
  Search,
  Shield,
} from "lucide-react";

type Layanan = {
  id: string;
  nama: string;
  kategori: string;
  telepon: string;
  bisaWa: boolean;
  alamat: string | null;
  jam: string;
};

const KATEGORI_META: Record<string, { label: string; Ikon: typeof Leaf }> = {
  darurat: { label: "Darurat", Ikon: Ambulance },
  kesehatan: { label: "Kesehatan", Ikon: Ambulance },
  keamanan: { label: "Keamanan", Ikon: Shield },
  lingkungan: { label: "Lingkungan", Ikon: Recycle },
  utilitas: { label: "Utilitas", Ikon: Droplets },
};

function nomorWa(telepon: string) {
  const digit = telepon.replace(/\D/g, "");
  if (digit.startsWith("62")) return digit;
  if (digit.startsWith("0")) return `62${digit.slice(1)}`;
  return null;
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

  const grup = useMemo(() => {
    const map = new Map<string, Layanan[]>();
    for (const l of tampil) {
      const arr = map.get(l.kategori) ?? [];
      arr.push(l);
      map.set(l.kategori, arr);
    }
    return [...map.entries()];
  }, [tampil]);

  return (
    <div>
      <div className="relative mb-6">
        <Search
          size={16}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          type="search"
          value={kueri}
          onChange={(e) => setKueri(e.target.value)}
          placeholder="Cari layanan… (mis. damkar, PLN, sampah)"
          aria-label="Cari layanan"
          className="w-full rounded-full border garis-halus bg-panel py-3 pl-11 pr-4 text-sm outline-none transition focus:border-daun-400"
        />
      </div>

      <div className="space-y-8">
        {grup.map(([kategori, daftar]) => {
          const meta = KATEGORI_META[kategori] ?? KATEGORI_META.utilitas;
          return (
            <section key={kategori}>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted">
                <meta.Ikon size={15} /> {meta.label}
              </h2>
              <motion.div layout className="space-y-3">
                {daftar.map((l) => {
                  const wa = l.bisaWa ? nomorWa(l.telepon) : null;
                  return (
                    <div
                      key={l.id}
                      className="flex flex-wrap items-center gap-3 rounded-2xl border garis-halus bg-panel p-4"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-display font-bold">{l.nama}</p>
                        <p className="mt-0.5 text-xs text-muted">
                          {l.telepon}
                          {l.jam ? ` · ${l.jam}` : ""}
                          {l.alamat ? ` · ${l.alamat}` : ""}
                        </p>
                      </div>
                      <a
                        href={`tel:${l.telepon.replace(/[^+\d]/g, "")}`}
                        className="flex items-center gap-1.5 rounded-full bg-daun-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-daun-700"
                      >
                        <Phone size={14} /> Telepon
                      </a>
                      {wa && (
                        <a
                          href={`https://wa.me/${wa}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 rounded-full border garis-halus px-4 py-2 text-sm font-semibold transition hover:bg-panel-2"
                        >
                          <MessageCircle size={14} /> WhatsApp
                        </a>
                      )}
                    </div>
                  );
                })}
              </motion.div>
            </section>
          );
        })}
        {grup.length === 0 && (
          <div className="rounded-2xl border garis-halus bg-panel p-10 text-center text-sm text-muted">
            Tidak ada layanan yang cocok dengan pencarianmu.
          </div>
        )}
      </div>
    </div>
  );
}
