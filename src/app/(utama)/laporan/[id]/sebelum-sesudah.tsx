"use client";

import { useState } from "react";
import { MoveHorizontal } from "lucide-react";

export function SebelumSesudah({
  sebelum,
  sesudah,
  judul,
}: {
  sebelum: string;
  sesudah: string;
  judul?: string;
}) {
  const [posisi, setPosisi] = useState(50);
  const altSebelum = judul
    ? `Foto kondisi ${judul} — sebelum`
    : "Foto kondisi sebelum ditangani";
  const altSesudah = judul
    ? `Foto kondisi ${judul} — sesudah`
    : "Foto kondisi sesudah ditangani";

  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border garis-halus select-none focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-action has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-action">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={sesudah}
        alt={altSesudah}
        width={800}
        height={600}
        className="h-full w-full object-cover sm:h-80"
        draggable={false}
      />
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${posisi}%` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={sebelum}
          alt={altSebelum}
          width={800}
          height={600}
          className="h-full w-full object-cover sm:h-80"
          style={{ width: "100%" , maxWidth: "none" }}
          draggable={false}
        />
        <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-bold text-white">
          Sebelum
        </span>
      </div>
      <span className="absolute right-3 top-3 rounded-full bg-daun-600/90 px-2.5 py-1 text-[11px] font-bold text-white">
        Sesudah
      </span>

      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.4)]"
        style={{ left: `${posisi}%` }}
      >
        <span className="absolute left-1/2 top-1/2 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-action text-white shadow-lg">
          <MoveHorizontal size={16} />
        </span>
      </span>

      <input
        type="range"
        min={0}
        max={100}
        value={posisi}
        onChange={(e) => setPosisi(Number(e.target.value))}
        aria-label="Geser perbandingan sebelum dan sesudah"
        className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
      />

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1 text-[11px] font-semibold text-white">
        Geser untuk membandingkan
      </div>
    </div>
  );
}
