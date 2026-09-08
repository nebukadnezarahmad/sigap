import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTanggal(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatAngka(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

export function formatBulan(iso: string | Date) {
  return new Intl.DateTimeFormat("id-ID", { month: "short" }).format(
    new Date(iso)
  );
}

export function waktuRelatif(iso: string) {
  const detik = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (detik < 60) return "baru saja";
  const menit = Math.floor(detik / 60);
  if (menit < 60) return `${menit} mnt lalu`;
  const jam = Math.floor(menit / 60);
  if (jam < 24) return `${jam} jam lalu`;
  const hari = Math.floor(jam / 24);
  if (hari < 30) return `${hari} hr lalu`;
  return formatTanggal(iso);
}

export function inisial(nama: string) {
  return nama
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function isTujuanAman(t: string | null | undefined): boolean {
  if (!t) return false;
  return t.startsWith("/") && !t.startsWith("//") && !t.includes("://");
}
