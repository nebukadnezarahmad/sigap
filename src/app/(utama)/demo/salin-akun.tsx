"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function SalinAkun({ email, sandi }: { email?: string; sandi?: boolean }) {
  const [tersalin, setTersalin] = useState(false);

  async function salin() {
    await navigator.clipboard.writeText(email ?? "sigap123456");
    setTersalin(true);
    setTimeout(() => setTersalin(false), 1500);
  }

  return (
    <button
      onClick={salin}
      aria-label={sandi ? "Salin kata sandi" : `Salin email ${email}`}
      className="flex size-8 items-center justify-center rounded-lg border garis-halus text-muted transition hover:border-daun-400 hover:text-ink"
    >
      {tersalin ? (
        <Check size={14} className="text-daun-600" />
      ) : (
        <Copy size={14} />
      )}
    </button>
  );
}
