"use client";

import { useState } from "react";
import { Check, Link2, MessageCircle, Share2 } from "lucide-react";

export function ShareButtons({ judul }: { judul: string }) {
  const [tersalin, setTersalin] = useState(false);
  const teks = `Lihat laporan ini di SIGAP: ${judul}`;

  function buka(tautan: string) {
    window.open(tautan, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() =>
          buka(`https://wa.me/?text=${encodeURIComponent(`${teks}\n${location.href}`)}`)
        }
        aria-label="Bagikan ke WhatsApp"
        className="rounded-full p-2 text-muted transition hover:bg-daun-500/10 hover:text-daun-700 dark:hover:text-daun-300"
      >
        <MessageCircle size={17} />
      </button>
      <button
        onClick={() =>
          buka(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(teks)}&url=${encodeURIComponent(location.href)}`
          )
        }
        aria-label="Bagikan ke X"
        className="rounded-full p-2 text-muted transition hover:bg-panel-2 hover:text-ink"
      >
        <Share2 size={17} />
      </button>
      <button
        onClick={async () => {
          await navigator.clipboard.writeText(location.href);
          setTersalin(true);
          setTimeout(() => setTersalin(false), 1600);
        }}
        aria-label="Salin tautan"
        className="flex items-center gap-1.5 rounded-full p-2 text-xs text-muted transition hover:bg-panel-2 hover:text-ink"
      >
        {tersalin ? <Check size={15} className="text-daun-600" /> : <Link2 size={15} />}
        {tersalin ? "Tersalin!" : ""}
      </button>
    </div>
  );
}
