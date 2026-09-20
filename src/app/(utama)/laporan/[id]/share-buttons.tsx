"use client";

import { useState } from "react";
import { Check, Link2, MessageCircle, Share2 } from "lucide-react";
import { IconButton } from "@/components/ui";

export function ShareButtons({ judul }: { judul: string }) {
  const [tersalin, setTersalin] = useState(false);
  const [gagalSalin, setGagalSalin] = useState(false);
  const teks = `Lihat laporan ini di SIGAP: ${judul}`;

  function buka(tautan: string) {
    window.open(tautan, "_blank", "noopener,noreferrer");
  }

  async function salin() {
    setGagalSalin(false);
    try {
      await navigator.clipboard.writeText(location.href);
      setTersalin(true);
      setTimeout(() => setTersalin(false), 1600);
    } catch {
      setGagalSalin(true);
      setTimeout(() => setGagalSalin(false), 3000);
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <IconButton
        aria-label="Bagikan lewat WhatsApp"
        onClick={() =>
          buka(`https://wa.me/?text=${encodeURIComponent(`${teks}\n${location.href}`)}`)
        }
        className="hover:!bg-action/10 hover:!text-action"
      >
        <MessageCircle size={17} />
      </IconButton>
      <IconButton
        aria-label="Bagikan ke X"
        onClick={() =>
          buka(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(teks)}&url=${encodeURIComponent(location.href)}`
          )
        }
      >
        <Share2 size={17} />
      </IconButton>
      <span className="inline-flex items-center">
        <IconButton aria-label="Salin tautan" onClick={salin}>
          {tersalin ? <Check size={15} className="text-daun-600" /> : <Link2 size={15} />}
        </IconButton>
        {tersalin && (
          <span role="status" className="text-xs font-semibold text-daun-700 dark:text-daun-300">
            Tersalin!
          </span>
        )}
        {gagalSalin && (
          <span role="alert" className="text-xs font-semibold text-danger">
            Salin manual dari bilah alamat ya.
          </span>
        )}
      </span>
    </div>
  );
}
