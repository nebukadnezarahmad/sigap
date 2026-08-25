"use client";

import { useEffect, useState } from "react";
import { Check, Link2, MessageCircle, Share2 } from "lucide-react";

export function ShareButtons({ judul }: { judul: string }) {
  const [tersalin, setTersalin] = useState(false);
  const [url, setUrl] = useState("");

  useEffect(() => setUrl(location.href), []);

  const teks = `Lihat laporan ini di SIGAP: ${judul}`;

  return (
    <div className="flex items-center gap-1.5">
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${teks}\n${url}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Bagikan ke WhatsApp"
        className="rounded-full p-2 text-muted transition hover:bg-daun-500/10 hover:text-daun-700 dark:hover:text-daun-300"
      >
        <MessageCircle size={17} />
      </a>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(teks)}&url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Bagikan ke X"
        className="rounded-full p-2 text-muted transition hover:bg-panel-2 hover:text-ink"
      >
        <Share2 size={17} />
      </a>
      <button
        onClick={async () => {
          await navigator.clipboard.writeText(url);
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
