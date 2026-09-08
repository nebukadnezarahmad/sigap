"use client";

import { useState } from "react";
import { Check, Link2, MessageCircle, Share2 } from "lucide-react";

export function ShareButtons({ judul }: { judul: string }) {
  const [tersalin, setTersalin] = useState(false);
  const [pesan, setPesan] = useState("");
  const teks = `Lihat laporan ini di SIGAP: ${judul}`;

  function buka(tautan: string) {
    window.open(tautan, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() =>
          buka(`https://wa.me/?text=${encodeURIComponent(`${teks}\n${location.href}`)}`)
        }
        aria-label="Bagikan ke WhatsApp"
        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2 text-muted transition hover:bg-daun-500/10 hover:text-daun-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus dark:hover:text-daun-300"
      >
        <MessageCircle size={17} aria-hidden />
      </button>
      <button
        type="button"
        onClick={() =>
          buka(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(teks)}&url=${encodeURIComponent(location.href)}`
          )
        }
        aria-label="Bagikan ke X"
        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2 text-muted transition hover:bg-panel-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus"
      >
        <Share2 size={17} aria-hidden />
      </button>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(location.href);
            setTersalin(true);
            setPesan("Tautan laporan disalin.");
            setTimeout(() => setTersalin(false), 1600);
          } catch {
            setPesan("Tautan belum bisa disalin. Salin alamat halaman secara manual.");
          }
        }}
        aria-label="Salin tautan"
        className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-full p-2 text-xs text-muted transition hover:bg-panel-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus"
      >
        {tersalin ? <Check size={15} aria-hidden className="text-daun-600" /> : <Link2 size={15} aria-hidden />}
        {tersalin ? "Tersalin!" : ""}
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {pesan}
      </span>
    </div>
  );
}
